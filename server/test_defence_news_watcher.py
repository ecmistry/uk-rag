#!/usr/bin/env python3
"""
Tests for the defence news watcher (Phase 3). All external IO is mocked:
no live HTTP calls, no real MongoDB, no real LLM.
"""
from __future__ import annotations

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))

import defence_news_watcher as watcher  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

IRON_DUKE_FEED = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Navy Lookout</title>
    <item>
      <title>Another warship quietly withdrawn</title>
      <link>https://www.navylookout.com/another-warship-quietly-withdrawn-royal-navy-now-down-to-just-5-frigates/</link>
      <pubDate>Mon, 04 May 2026 09:00:00 +0000</pubDate>
    </item>
    <item>
      <title>Unrelated article</title>
      <link>https://www.navylookout.com/some-other-news/</link>
      <pubDate>Sun, 03 May 2026 12:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>"""

ATOM_FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>MOD news</title>
  <entry>
    <title>Statement on fleet posture</title>
    <link href="https://www.gov.uk/government/news/some-statement"/>
    <updated>2026-05-05T12:00:00Z</updated>
  </entry>
</feed>"""


class InMemoryColl:
    """Tiny in-memory stand-in for a Mongo collection — enough for the watcher."""

    def __init__(self, docs=None):
        self.docs = list(docs or [])

    def find(self, query=None, projection=None):
        query = query or {}
        for d in self.docs:
            if self._match(d, query):
                yield {k: v for k, v in d.items() if k != "_id"}

    def find_one(self, query):
        for d in self.docs:
            if self._match(d, query):
                return d
        return None

    def count_documents(self, query, limit=None):
        n = 0
        for d in self.docs:
            if self._match(d, query):
                n += 1
                if limit and n >= limit:
                    return n
        return n

    def insert_one(self, doc):
        self.docs.append(dict(doc))

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if self._match(d, query):
                d.update(update.get("$set", {}))
                return
        if upsert:
            self.docs.append({**query, **update.get("$set", {})})

    @staticmethod
    def _match(doc, query):
        for k, v in query.items():
            if isinstance(v, dict):
                if "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        return False
                elif "$gte" in v:
                    if not (doc.get(k) and doc.get(k) >= v["$gte"]):
                        return False
                else:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True


class FakeDB:
    def __init__(self, inventory=None, proposals=None, seen=None):
        self._collections = {
            "fleet_inventory": InMemoryColl(inventory),
            "fleet_change_proposals": InMemoryColl(proposals),
            "fleet_news_seen_articles": InMemoryColl(seen),
        }

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = InMemoryColl()
        return self._collections[name]


SEED_INVENTORY = [
    {"itemId": "hms-iron-duke", "name": "HMS Iron Duke",
     "className": "Type 23 Frigate", "category": "sea_mass",
     "role": "escort", "status": "active"},
    {"itemId": "hms-kent", "name": "HMS Kent",
     "className": "Type 23 Frigate", "category": "sea_mass",
     "role": "escort", "status": "refit"},
    {"itemId": "hms-richmond", "name": "HMS Richmond",
     "className": "Type 23 Frigate", "category": "sea_mass",
     "role": "escort", "status": "active"},
]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestFeedParsing(unittest.TestCase):
    def test_rss_extracts_title_link_and_date(self):
        entries = watcher.parse_rss(IRON_DUKE_FEED)
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["title"], "Another warship quietly withdrawn")
        self.assertIn("navylookout", entries[0]["link"])
        self.assertIsNotNone(entries[0]["published_at"])

    def test_atom_extracts_href_link(self):
        entries = watcher.parse_rss(ATOM_FEED)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["link"], "https://www.gov.uk/government/news/some-statement")


class TestInventoryMatching(unittest.TestCase):
    def test_normalise_strips_hms_prefix_and_punctuation(self):
        self.assertEqual(watcher.normalise_name("HMS Iron Duke"), "iron duke")
        self.assertEqual(watcher.normalise_name("the Iron-Duke"), "iron duke")
        self.assertEqual(watcher.normalise_name("RFA Mounts Bay"), "mounts bay")

    def test_match_exact(self):
        db = FakeDB(inventory=SEED_INVENTORY)
        item = watcher.match_inventory(db, "HMS Iron Duke")
        self.assertIsNotNone(item)
        self.assertEqual(item["itemId"], "hms-iron-duke")

    def test_match_without_hms_prefix(self):
        db = FakeDB(inventory=SEED_INVENTORY)
        item = watcher.match_inventory(db, "Iron Duke")
        self.assertIsNotNone(item)
        self.assertEqual(item["itemId"], "hms-iron-duke")

    def test_no_match_returns_none(self):
        db = FakeDB(inventory=SEED_INVENTORY)
        item = watcher.match_inventory(db, "HMS Belfast")
        self.assertIsNone(item)


class TestProcessArticle(unittest.TestCase):
    FEED = {"name": "Navy Lookout", "url": "https://www.navylookout.com/feed/",
            "kind": "rss", "categories": ["sea_mass"]}
    ENTRY = {
        "title": "Another warship quietly withdrawn",
        "link": "https://www.navylookout.com/another-warship-quietly-withdrawn/",
        "published_at": datetime(2026, 5, 4, tzinfo=timezone.utc),
    }

    def _run(self, llm_changes, inventory=None, proposals=None, seen=None,
             dry_run=False, ignore_dedup=False):
        db = FakeDB(
            inventory=inventory or SEED_INVENTORY,
            proposals=proposals or [],
            seen=seen or [],
        )
        with mock.patch.object(watcher, "fetch_article_text",
                               return_value=("Title", "body text " * 50)), \
             mock.patch.object(watcher, "call_llm", return_value=llm_changes):
            counters = watcher.process_article(
                db, self.FEED, self.ENTRY,
                dry_run=dry_run, ignore_dedup=ignore_dedup,
            )
        return db, counters

    def test_high_confidence_change_produces_pending_proposal(self):
        changes = [{
            "vessel_name": "HMS Iron Duke",
            "proposed_status": "withdrawn",
            "evidence_quote": "stripped of her weapons and sensors",
            "confidence": 0.95,
        }]
        db, counters = self._run(changes)
        self.assertEqual(counters["proposed"], 1)
        self.assertEqual(counters["auto_rejected"], 0)
        proposals = list(db["fleet_change_proposals"].find({}))
        self.assertEqual(len(proposals), 1)
        p = proposals[0]
        self.assertEqual(p["itemId"], "hms-iron-duke")
        self.assertEqual(p["proposedStatus"], "withdrawn")
        self.assertEqual(p["status"], "pending_review")
        self.assertEqual(p["articleSource"], "Navy Lookout")

    def test_low_confidence_change_is_auto_rejected(self):
        changes = [{
            "vessel_name": "HMS Iron Duke",
            "proposed_status": "withdrawn",
            "evidence_quote": "may possibly be retired",
            "confidence": 0.4,
        }]
        db, counters = self._run(changes)
        self.assertEqual(counters["auto_rejected"], 1)
        self.assertEqual(counters["proposed"], 0)
        proposals = list(db["fleet_change_proposals"].find({}))
        self.assertEqual(len(proposals), 1)
        self.assertEqual(proposals[0]["status"], "auto_rejected")

    def test_no_inventory_match_is_dropped(self):
        changes = [{
            "vessel_name": "HMS Belfast",
            "proposed_status": "decommissioned",
            "evidence_quote": "in a museum",
            "confidence": 0.99,
        }]
        db, counters = self._run(changes)
        self.assertEqual(counters["no_match"], 1)
        self.assertEqual(len(list(db["fleet_change_proposals"].find({}))), 0)

    def test_noop_when_status_already_matches(self):
        changes = [{
            "vessel_name": "HMS Iron Duke",
            "proposed_status": "active",  # same as current
            "evidence_quote": "still serving",
            "confidence": 0.9,
        }]
        db, counters = self._run(changes)
        self.assertEqual(counters["noop"], 1)
        self.assertEqual(counters["proposed"], 0)

    def test_dedup_window_collapses_repeat(self):
        existing_proposal = {
            "itemId": "hms-iron-duke",
            "proposedStatus": "withdrawn",
            "status": "pending_review",
            "createdAt": datetime.now(timezone.utc) - timedelta(days=5),
        }
        changes = [{
            "vessel_name": "HMS Iron Duke",
            "proposed_status": "withdrawn",
            "evidence_quote": "still gone",
            "confidence": 0.95,
        }]
        db, counters = self._run(changes, proposals=[existing_proposal])
        self.assertEqual(counters["deduped"], 1)
        self.assertEqual(counters["proposed"], 0)

    def test_dry_run_writes_nothing(self):
        changes = [{
            "vessel_name": "HMS Iron Duke",
            "proposed_status": "withdrawn",
            "evidence_quote": "stripped",
            "confidence": 0.95,
        }]
        db, counters = self._run(changes, dry_run=True)
        self.assertEqual(counters["proposed"], 1)
        self.assertEqual(len(list(db["fleet_change_proposals"].find({}))), 0)
        # And the article should NOT be marked as seen on a dry run.
        self.assertEqual(len(list(db["fleet_news_seen_articles"].find({}))), 0)


class TestLLMResponseParsing(unittest.TestCase):
    """Drift-proofing on the LLM response parser."""

    def test_extract_json_handles_bare_object(self):
        blob = watcher._extract_json_object('Sure, here you go: {"changes": []} thanks!')
        self.assertEqual(blob, '{"changes": []}')

    def test_extract_json_handles_code_fence(self):
        text = '```json\n{"changes": [{"vessel_name": "HMS X"}]}\n```'
        blob = watcher._extract_json_object(text)
        self.assertIn("HMS X", blob)

    def test_extract_json_handles_nested_braces(self):
        text = '{"a": {"b": 1}, "changes": []}'
        blob = watcher._extract_json_object(text)
        self.assertEqual(blob, text)

    def test_extract_json_returns_none_when_absent(self):
        self.assertIsNone(watcher._extract_json_object("no json here"))

    def test_allowed_statuses_set_matches_schema_intent(self):
        # The five statuses are the source of truth for both the prompt and
        # the cross-reference logic. Don't accidentally drift.
        self.assertEqual(
            watcher.ALLOWED_STATUSES,
            {"active", "refit", "low_readiness", "withdrawn", "decommissioned"},
        )

    def test_confidence_floor_keeps_high_signal_only(self):
        self.assertGreaterEqual(watcher.CONFIDENCE_FLOOR, 0.5)
        self.assertLessEqual(watcher.CONFIDENCE_FLOOR, 0.9)


if __name__ == "__main__":
    unittest.main()
