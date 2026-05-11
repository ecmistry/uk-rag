#!/usr/bin/env python3
"""
Tests for the inventory-driven Sea Mass computation (Phase 2 of the
news-aware defence pipeline). These tests are pure-Python: they exercise the
counting and citation-rendering logic via monkeypatched fixtures rather than
touching the real MongoDB.
"""
from __future__ import annotations

import os
import sys
import unittest
from datetime import datetime, timezone
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))

import defence_data_fetcher as fetcher


def _item(item_id: str, role: str, status: str, name: str | None = None,
          class_name: str = "Type 23 Frigate", source_url: str | None = None,
          source_title: str | None = None,
          status_changed_at: datetime | None = None) -> dict:
    return {
        "itemId": item_id,
        "name": name or item_id,
        "className": class_name,
        "category": "sea_mass",
        "role": role,
        "status": status,
        "statusChangedAt": status_changed_at or datetime(2026, 5, 1, tzinfo=timezone.utc),
        "statusSourceUrl": source_url,
        "statusSourceTitle": source_title,
    }


# Active+refit roster matching the Phase 2 seed:
# 2 carrier, 4 ssbn, 6 ssn, 12 escort, 9 rfa, 14 patrol_mcm
ACTIVE_SEED = (
    [_item(f"c-{i}", "carrier", "active") for i in range(2)]
    + [_item(f"sb-{i}", "ssbn", "active") for i in range(4)]
    + [_item(f"sn-{i}", "ssn", "active") for i in range(6)]
    + [_item(f"esc-{i}", "escort", "active") for i in range(11)]
    + [_item("hms-kent", "escort", "refit")]
    + [_item(f"rfa-{i}", "rfa", "active") for i in range(9)]
    + [_item(f"pm-{i}", "patrol_mcm", "active") for i in range(14)]
)

# Three non-counted hulls with citations — the recent_changes path.
NON_COUNTED = [
    _item(
        "hms-iron-duke", "escort", "withdrawn",
        name="HMS Iron Duke",
        source_url="https://www.navylookout.com/another-warship-quietly-withdrawn-royal-navy-now-down-to-just-5-frigates/",
        source_title="Navy Lookout, 4 May 2026",
        status_changed_at=datetime(2026, 5, 4, tzinfo=timezone.utc),
    ),
    _item(
        "hms-richmond", "escort", "decommissioned",
        name="HMS Richmond",
        source_url="https://example.test/richmond",
        source_title="Test Source",
        status_changed_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
    ),
    _item(
        "hms-westminster", "escort", "decommissioned",
        name="HMS Westminster",
        source_url="https://example.test/westminster",
        status_changed_at=datetime(2025, 6, 1, tzinfo=timezone.utc),
    ),
]


class TestSeaMassInventoryCounting(unittest.TestCase):
    """The fetcher must count only active+refit per role from the inventory."""

    def _patched_inventory(self, items):
        """Build the dict shape that load_sea_mass_inventory returns."""
        counts = {}
        recent = []
        for it in items:
            if it["status"] in fetcher.SEA_MASS_COUNTED_STATUSES:
                counts[it["role"]] = counts.get(it["role"], 0) + 1
            else:
                recent.append(it)
        return {"counts": counts, "recent_changes": recent, "all_items": items}

    def test_phase2_seed_produces_64_6(self):
        items = ACTIVE_SEED + NON_COUNTED
        with mock.patch.object(
            fetcher, "load_sea_mass_inventory",
            return_value=self._patched_inventory(items),
        ):
            metric = fetcher.fetch_sea_mass()
        self.assertIsNotNone(metric)
        self.assertEqual(metric["value"], 64.6)
        self.assertEqual(metric["rag_status"], "red")

    def test_refit_counts_toward_score(self):
        # 11 active escorts only — no refit — should produce a lower score.
        items_no_refit = [it for it in ACTIVE_SEED if it["itemId"] != "hms-kent"]
        items_with_refit = list(ACTIVE_SEED)
        with mock.patch.object(
            fetcher, "load_sea_mass_inventory",
            return_value=self._patched_inventory(items_no_refit),
        ):
            no_refit = fetcher.fetch_sea_mass()
        with mock.patch.object(
            fetcher, "load_sea_mass_inventory",
            return_value=self._patched_inventory(items_with_refit),
        ):
            with_refit = fetcher.fetch_sea_mass()
        # Adding one refit escort should improve the score.
        self.assertLess(no_refit["value"], with_refit["value"])

    def test_withdrawn_and_decommissioned_excluded(self):
        # Remove all escorts and add three "withdrawn" — score should drop.
        items = [it for it in ACTIVE_SEED if it["role"] != "escort"] + [
            _item(f"esc-{i}", "escort", "withdrawn") for i in range(3)
        ]
        with mock.patch.object(
            fetcher, "load_sea_mass_inventory",
            return_value=self._patched_inventory(items),
        ):
            metric = fetcher.fetch_sea_mass()
        # 0 counted escorts → escort contribution = 0
        # other pillars contribute 25 + 12.5 + 11.25 + 5.83 = 54.58
        self.assertAlmostEqual(metric["value"], 54.6, places=1)


class TestFallbackBehaviour(unittest.TestCase):
    """When the inventory is empty/unreachable, fall back to hardcoded counts."""

    def test_fallback_when_inventory_unavailable(self):
        with mock.patch.object(
            fetcher, "load_sea_mass_inventory", return_value=None,
        ):
            metric = fetcher.fetch_sea_mass()
        self.assertIsNotNone(metric)
        # Fallback baseline: 2/4/6/16/9/14 → 67.9
        self.assertEqual(metric["value"], 67.9)
        self.assertIn("fallback baseline", metric["data_source"])


class TestRecentChangesCitations(unittest.TestCase):
    """The information field must surface recent non-counted hulls with URLs."""

    def test_recent_changes_block_includes_citations(self):
        items = ACTIVE_SEED + NON_COUNTED
        inv = {
            "counts": {
                "carrier": 2, "ssbn": 4, "ssn": 6, "escort": 12,
                "rfa": 9, "patrol_mcm": 14,
            },
            "recent_changes": NON_COUNTED,
            "all_items": items,
        }
        with mock.patch.object(fetcher, "load_sea_mass_inventory", return_value=inv):
            metric = fetcher.fetch_sea_mass()
        info = metric["information"]
        # Iron Duke is the most recent non-counted change and must appear with its URL.
        self.assertIn("HMS Iron Duke", info)
        self.assertIn(
            "https://www.navylookout.com/another-warship-quietly-withdrawn",
            info,
        )
        # Sorted newest-first: Iron Duke (May 2026) before Richmond (Mar 2026).
        self.assertLess(info.find("HMS Iron Duke"), info.find("HMS Richmond"))

    def test_recent_changes_block_omitted_when_empty(self):
        inv = {
            "counts": {
                "carrier": 2, "ssbn": 4, "ssn": 6, "escort": 12,
                "rfa": 9, "patrol_mcm": 14,
            },
            "recent_changes": [],
            "all_items": [],
        }
        with mock.patch.object(fetcher, "load_sea_mass_inventory", return_value=inv):
            metric = fetcher.fetch_sea_mass()
        self.assertNotIn("Recent fleet changes", metric["information"])


if __name__ == "__main__":
    unittest.main()
