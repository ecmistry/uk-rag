#!/usr/bin/env python3
"""
Nightly news watcher for the defence dashboard (Phase 3 of the news-aware
defence pipeline).

Flow per run:
  1. Pull a small, whitelisted set of RSS/Atom feeds.
  2. Skip any article URL already processed (seen_articles collection).
  3. For each new article, fetch the page, strip to plain text, and send to
     the Forge LLM with a strict JSON schema asking for vessel status changes.
  4. Cross-reference extracted vessel names against fleet_inventory by a
     normalised name match.
  5. Apply quality gates:
        - confidence floor (auto-reject quietly)
        - dedup window (collapse repeat claims onto the existing proposal)
        - no-op filter (skip when proposed status == current status)
  6. Write surviving candidates to fleet_change_proposals as
     `pending_review`. NEVER auto-apply — the inventory is only mutated by
     the Phase 4 admin review queue.

Usage:
    python3 server/defence_news_watcher.py
    python3 server/defence_news_watcher.py --dry-run           # parse + extract, do not write
    python3 server/defence_news_watcher.py --article <url>     # single article, ignore dedup
    python3 server/defence_news_watcher.py --max-articles 5    # cap per run
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("[NewsWatcher] BeautifulSoup4 not installed — pip3 install beautifulsoup4",
          file=sys.stderr)
    sys.exit(1)

try:
    from pymongo import MongoClient
except ImportError:
    print("[NewsWatcher] pymongo not installed — pip3 install pymongo",
          file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LOG_PREFIX = "[NewsWatcher]"

# Source whitelist. Only feeds in this list contribute proposals. Adding
# random sources is a deliberate decision (governance), not a config tweak.
FEEDS = [
    {
        "name": "Navy Lookout",
        "url": "https://www.navylookout.com/feed/",
        "kind": "rss",
        "categories": ["sea_mass"],
    },
    {
        "name": "UK Defence Journal",
        "url": "https://ukdefencejournal.org.uk/feed/",
        "kind": "rss",
        "categories": ["sea_mass", "land_mass", "air_mass"],
    },
    {
        "name": "MOD news",
        "url": "https://www.gov.uk/government/organisations/ministry-of-defence.atom",
        "kind": "atom",
        "categories": ["sea_mass", "land_mass", "air_mass"],
    },
]

USER_AGENT = (
    "UKRAGPortal-NewsWatcher/1.0 "
    "(+https://uk-rag.online; dashboard provenance crawler)"
)

# Statuses the LLM is allowed to propose. Must match FleetItemStatus.
ALLOWED_STATUSES = {
    "active", "refit", "low_readiness", "withdrawn", "decommissioned",
}

CONFIDENCE_FLOOR = 0.7
DEDUP_WINDOW_DAYS = 30

MAX_ARTICLE_CHARS = 16000  # truncate before LLM to keep token cost predictable

MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)

# LLM: use the same Gravitee Gemini gateway that powers the NHS diagnosis
# tool (see server/diagnosis.ts). The OpenAI-compatible BUILT_IN_FORGE_* vars
# are present in env.ts but not actually populated in this deployment.
GRAVITEE_GATEWAY_URL = os.environ.get("GRAVITEE_GEMINI_GATEWAY_URL", "")
GRAVITEE_API_KEY = os.environ.get("GRAVITEE_GEMINI_API_KEY", "")
LLM_MODEL = os.environ.get(
    "NEWS_WATCHER_MODEL", "operations-gemini-api:gemini-3-flash-preview"
)


def log(msg: str) -> None:
    print(f"{LOG_PREFIX} {msg}", flush=True)


def warn(msg: str) -> None:
    print(f"{LOG_PREFIX} WARN: {msg}", file=sys.stderr, flush=True)


def err(msg: str) -> None:
    print(f"{LOG_PREFIX} ERROR: {msg}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Feed parsing (stdlib only; supports RSS 2.0 and Atom)
# ---------------------------------------------------------------------------

def fetch_feed(url: str) -> Optional[str]:
    try:
        resp = requests.get(url, timeout=20, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        warn(f"feed fetch failed for {url}: {e}")
        return None


def _strip_ns(tag: str) -> str:
    # ElementTree returns namespaced tags like '{http://www.w3.org/2005/Atom}entry'.
    return tag.rsplit("}", 1)[-1]


def parse_rss(xml_text: str) -> List[Dict[str, Any]]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        warn(f"feed parse failed: {e}")
        return []

    entries: List[Dict[str, Any]] = []
    for item in root.iter():
        tag = _strip_ns(item.tag)
        if tag not in {"item", "entry"}:
            continue
        title = ""
        link = ""
        published_raw = ""
        for child in item:
            ctag = _strip_ns(child.tag)
            if ctag == "title":
                title = (child.text or "").strip()
            elif ctag == "link":
                # Atom: href attribute; RSS: text content
                href = child.attrib.get("href", "").strip()
                link = href or (child.text or "").strip()
            elif ctag == "pubDate" or ctag == "published" or ctag == "updated":
                if not published_raw:
                    published_raw = (child.text or "").strip()
        if not link or not title:
            continue
        entries.append({
            "title": title,
            "link": link,
            "published_raw": published_raw,
            "published_at": _parse_date(published_raw),
        })
    return entries


def _parse_date(raw: str) -> Optional[datetime]:
    if not raw:
        return None
    try:
        dt = parsedate_to_datetime(raw)
        if dt and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass
    # Try ISO-8601 (atom uses YYYY-MM-DDTHH:MM:SSZ)
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Article fetch + text extraction
# ---------------------------------------------------------------------------

def fetch_article_text(url: str) -> Tuple[str, str]:
    """Return (title, plain_text) for an article URL. Returns ("", "") on failure."""
    try:
        resp = requests.get(url, timeout=30, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
    except Exception as e:
        warn(f"article fetch failed for {url}: {e}")
        return "", ""

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        title = h1.get_text(strip=True)

    # Strip noise we don't want the LLM to see.
    for tag in soup(["script", "style", "noscript", "header", "footer", "nav",
                     "form", "iframe", "aside"]):
        tag.decompose()

    # Prefer <article>, fall back to <main>, then body.
    body = soup.find("article") or soup.find("main") or soup.body
    if body is None:
        return title, ""

    # Concatenate paragraph and heading text only — avoids dropdown menus,
    # related-link lists, etc.
    parts: List[str] = []
    for el in body.find_all(["p", "h2", "h3", "li"]):
        text = el.get_text(" ", strip=True)
        if text:
            parts.append(text)
    plain = "\n\n".join(parts)
    return title, plain[:MAX_ARTICLE_CHARS]


# ---------------------------------------------------------------------------
# LLM extraction (Forge / OpenAI-compatible)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You extract status changes for specific UK military units from a news article.

You will receive an article about UK defence. Your job is to detect, for any individually-named UK military hull (Royal Navy, RFA), regiment (British Army), or squadron (RAF), a CONFIRMED status change reported in the article.

Allowed statuses (output exactly one):
  - active           : currently in service, deployable
  - refit            : in maintenance/refit, expected to return to service
  - low_readiness    : retained in low/reserve readiness, not deployable
  - withdrawn        : stripped of equipment / quietly removed from service; no formal decommissioning yet
  - decommissioned   : formally retired from service

Rules:
  - ONLY report changes that the article CONFIRMS or that the article reports as confirmed by MOD / Royal Navy / Royal Air Force / British Army.
  - Do NOT report speculation, rumour, opinion, or hypothetical scenarios. Set confidence below 0.7 if there is meaningful doubt.
  - Do NOT report aggregate claims like "the navy is shrinking" — only per-unit claims with a name.
  - vessel_name must be the unit name as written (e.g. "HMS Iron Duke", "RFA Mounts Bay", "2nd Battalion The Royal Anglian Regiment").
  - evidence_quote must be a direct excerpt of <= 400 characters from the article body that supports the claim.
  - Confidence calibration:
      * 0.9–1.0: explicit, unambiguous, attributed announcement
      * 0.7–0.9: clearly stated by reliable reporting with named sourcing
      * 0.5–0.7: strong rumour or unattributed but specific claim
      * <0.5: anything more speculative — still emit but it will be filtered

OUTPUT FORMAT
=============
Respond with raw JSON ONLY. No prose, no Markdown, no code fences. Exactly this shape:

{
  "changes": [
    {
      "vessel_name": "HMS Iron Duke",
      "proposed_status": "withdrawn",
      "evidence_quote": "stripped of her weapons and sensors and has not been to sea since October 2025",
      "confidence": 0.95
    }
  ]
}

If the article contains no per-unit status changes, return: {"changes": []}
"""


def _extract_json_object(text: str) -> Optional[str]:
    """Pull the first balanced {...} JSON object out of text. Handles code-fence wrapping."""
    if not text:
        return None
    # Strip Markdown code fences if present (```json ... ``` or ``` ... ```).
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1)
    # Otherwise find the first { and walk to its balanced closing }.
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
    return None


def call_llm(article_title: str, article_text: str) -> Optional[List[Dict[str, Any]]]:
    if not GRAVITEE_GATEWAY_URL or not GRAVITEE_API_KEY:
        err("GRAVITEE_GEMINI_GATEWAY_URL / GRAVITEE_GEMINI_API_KEY not set; cannot call LLM")
        return None

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Article title: {article_title}\n\n"
                    f"Article body:\n{article_text}\n\n"
                    "Return raw JSON only — no prose, no code fences."
                ),
            },
        ],
    }
    url = GRAVITEE_GATEWAY_URL.rstrip("/") + "/chat/completions"
    try:
        resp = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "X-Gravitee-Api-Key": GRAVITEE_API_KEY,
            },
            data=json.dumps(payload),
            timeout=120,
        )
        if not resp.ok:
            err(f"LLM call failed: {resp.status_code} {resp.text[:300]}")
            return None
        body = resp.json()
    except Exception as e:
        err(f"LLM call exception: {e}")
        return None

    try:
        content = body["choices"][0]["message"]["content"]
        if isinstance(content, list):
            content = "".join(
                p.get("text", "") for p in content if isinstance(p, dict)
            )
    except (KeyError, IndexError, TypeError) as e:
        err(f"LLM response missing choices[0].message.content: {e}; raw: {str(body)[:300]}")
        return None

    json_blob = _extract_json_object(content)
    if not json_blob:
        warn(f"LLM returned no JSON object; raw content: {content[:300]!r}")
        return []
    try:
        parsed = json.loads(json_blob)
    except json.JSONDecodeError as e:
        warn(f"LLM JSON failed to parse: {e}; blob: {json_blob[:300]!r}")
        return []

    changes = parsed.get("changes", [])
    if not isinstance(changes, list):
        warn(f"LLM returned non-list changes: {changes!r}")
        return []
    # Validate each row and coerce types.
    clean: List[Dict[str, Any]] = []
    for c in changes:
        if not isinstance(c, dict):
            continue
        name = (c.get("vessel_name") or "").strip()
        status = (c.get("proposed_status") or "").strip()
        quote = (c.get("evidence_quote") or "").strip()
        conf = c.get("confidence")
        if not name or status not in ALLOWED_STATUSES:
            continue
        try:
            conf_f = float(conf)
        except (TypeError, ValueError):
            continue
        clean.append({
            "vessel_name": name,
            "proposed_status": status,
            "evidence_quote": quote[:400],
            "confidence": max(0.0, min(1.0, conf_f)),
        })
    return clean


# ---------------------------------------------------------------------------
# Inventory cross-reference
# ---------------------------------------------------------------------------

_NAME_PREFIXES = ("hms", "rfa", "hmnb", "the")


def normalise_name(name: str) -> str:
    s = re.sub(r"[^a-z0-9 ]+", " ", name.lower()).strip()
    tokens = s.split()
    while tokens and tokens[0] in _NAME_PREFIXES:
        tokens = tokens[1:]
    return " ".join(tokens)


def match_inventory(db, vessel_name: str) -> Optional[Dict[str, Any]]:
    """Return the inventory item whose name best matches vessel_name, or None."""
    target = normalise_name(vessel_name)
    if not target:
        return None
    # Try exact match on normalised name first.
    candidates: List[Dict[str, Any]] = []
    for item in db["fleet_inventory"].find({}, {"_id": 0}):
        if normalise_name(item["name"]) == target:
            return item
        # Substring match on either side (handles "Iron Duke" vs "HMS Iron Duke").
        item_norm = normalise_name(item["name"])
        if target and (target in item_norm or item_norm in target):
            candidates.append(item)
    if len(candidates) == 1:
        return candidates[0]
    if len(candidates) > 1:
        warn(f"ambiguous match for {vessel_name!r}: {[c['itemId'] for c in candidates]}")
    return None


# ---------------------------------------------------------------------------
# Dedup
# ---------------------------------------------------------------------------

def has_recent_proposal(db, item_id: str, proposed_status: str) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUP_WINDOW_DAYS)
    existing = db["fleet_change_proposals"].find_one({
        "itemId": item_id,
        "proposedStatus": proposed_status,
        "status": {"$in": ["pending_review", "approved"]},
        "createdAt": {"$gte": cutoff},
    })
    return existing is not None


def mark_article_seen(db, url: str, source: str) -> None:
    db["fleet_news_seen_articles"].update_one(
        {"url": url},
        {"$set": {"url": url, "source": source,
                   "processedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )


def is_article_seen(db, url: str) -> bool:
    return db["fleet_news_seen_articles"].count_documents({"url": url}, limit=1) > 0


# ---------------------------------------------------------------------------
# Mongo connection
# ---------------------------------------------------------------------------

def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    parts = MONGO_URI.rsplit("/", 1)
    db_name = parts[1].split("?")[0] if len(parts) == 2 and parts[1] else "uk_rag_portal"
    if not db_name or ":" in db_name:
        db_name = "uk_rag_portal"
    return client, client[db_name]


# ---------------------------------------------------------------------------
# Main per-article pipeline
# ---------------------------------------------------------------------------

def process_article(
    db,
    feed: Dict[str, Any],
    entry: Dict[str, Any],
    dry_run: bool = False,
    ignore_dedup: bool = False,
) -> Dict[str, int]:
    """
    Process one article. Returns counters:
      {extracted, proposed, auto_rejected, no_match, deduped, noop}
    """
    counters = {"extracted": 0, "proposed": 0, "auto_rejected": 0,
                "no_match": 0, "deduped": 0, "noop": 0}

    url = entry["link"]
    log(f"  Article: {entry['title']!r} — {url}")

    title, body = fetch_article_text(url)
    if not body:
        warn(f"  empty body for {url}; skipping")
        return counters
    if not title:
        title = entry["title"]

    changes = call_llm(title, body)
    if changes is None:
        warn("  LLM returned None; not marking article as seen so it retries next run")
        return counters
    counters["extracted"] = len(changes)
    if not changes:
        log("  No per-unit status changes detected.")
        if not dry_run:
            mark_article_seen(db, url, feed["name"])
        return counters

    for ch in changes:
        item = match_inventory(db, ch["vessel_name"])
        if not item:
            log(f"    No inventory match for {ch['vessel_name']!r}; skipping")
            counters["no_match"] += 1
            continue
        if ch["proposed_status"] == item["status"]:
            log(f"    {item['name']}: proposed status {ch['proposed_status']} == current; no-op")
            counters["noop"] += 1
            continue
        if ch["confidence"] < CONFIDENCE_FLOOR:
            log(f"    {item['name']}: confidence {ch['confidence']:.2f} < {CONFIDENCE_FLOOR}; auto-rejected")
            counters["auto_rejected"] += 1
            if not dry_run:
                _write_proposal(db, feed, entry, title, item, ch, status="auto_rejected")
            continue
        if not ignore_dedup and has_recent_proposal(db, item["itemId"], ch["proposed_status"]):
            log(f"    {item['name']}: existing pending/approved proposal within {DEDUP_WINDOW_DAYS}d; deduped")
            counters["deduped"] += 1
            continue
        log(f"    PROPOSAL: {item['name']} {item['status']} → {ch['proposed_status']} "
            f"(confidence {ch['confidence']:.2f})")
        counters["proposed"] += 1
        if not dry_run:
            _write_proposal(db, feed, entry, title, item, ch, status="pending_review")

    if not dry_run:
        mark_article_seen(db, url, feed["name"])
    return counters


def _write_proposal(
    db, feed: Dict[str, Any], entry: Dict[str, Any], title: str,
    item: Dict[str, Any], change: Dict[str, Any], status: str,
) -> None:
    doc = {
        "itemId": item["itemId"],
        "vesselNameFromArticle": change["vessel_name"],
        "currentStatus": item["status"],
        "proposedStatus": change["proposed_status"],
        "evidenceQuote": change["evidence_quote"],
        "articleUrl": entry["link"],
        "articleTitle": title,
        "articleSource": feed["name"],
        "articlePublishedAt": entry.get("published_at"),
        "confidence": change["confidence"],
        "status": status,
        "createdAt": datetime.now(timezone.utc),
    }
    db["fleet_change_proposals"].insert_one(doc)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

def run(
    dry_run: bool = False,
    single_article: Optional[str] = None,
    max_articles: Optional[int] = None,
    ignore_dedup: bool = False,
) -> int:
    log("=" * 60)
    log("Defence news watcher starting")
    log("=" * 60)

    client, db = get_db()
    try:
        if single_article:
            # Synthesize a one-shot entry and force a re-fetch.
            entry = {
                "title": single_article,
                "link": single_article,
                "published_raw": "",
                "published_at": datetime.now(timezone.utc),
            }
            # Pick a feed by URL host, or fall back to "manual".
            feed = next(
                (f for f in FEEDS if urlparse(f["url"]).netloc in single_article),
                {"name": "Manual", "url": single_article, "kind": "manual",
                 "categories": ["sea_mass"]},
            )
            log(f"Single-article mode: {single_article} (source: {feed['name']})")
            c = process_article(db, feed, entry, dry_run=dry_run,
                                ignore_dedup=ignore_dedup)
            log(f"Counters: {c}")
            return 0

        totals = {"extracted": 0, "proposed": 0, "auto_rejected": 0,
                  "no_match": 0, "deduped": 0, "noop": 0,
                  "articles_processed": 0, "articles_skipped_seen": 0}

        for feed in FEEDS:
            log(f"\nFeed: {feed['name']} — {feed['url']}")
            xml_text = fetch_feed(feed["url"])
            if not xml_text:
                continue
            entries = parse_rss(xml_text)
            log(f"  Found {len(entries)} entries in feed")

            processed_this_feed = 0
            for entry in entries:
                if max_articles is not None and totals["articles_processed"] >= max_articles:
                    log(f"  Reached --max-articles cap ({max_articles}); stopping")
                    break
                if not ignore_dedup and is_article_seen(db, entry["link"]):
                    totals["articles_skipped_seen"] += 1
                    continue
                c = process_article(db, feed, entry, dry_run=dry_run,
                                    ignore_dedup=ignore_dedup)
                for k, v in c.items():
                    totals[k] = totals.get(k, 0) + v
                totals["articles_processed"] += 1
                processed_this_feed += 1
                # Be polite to feed hosts.
                time.sleep(0.5)

            log(f"  {feed['name']}: processed {processed_this_feed} new article(s)")

        log("\n" + "=" * 60)
        log("Defence news watcher complete")
        for k, v in totals.items():
            log(f"  {k}: {v}")
        log("=" * 60)
        return 0
    finally:
        try:
            client.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description="Defence news watcher")
    parser.add_argument("--dry-run", action="store_true",
                        help="Do not write to Mongo; just log what would happen.")
    parser.add_argument("--article", default=None,
                        help="Process a single URL (overrides feed pull, bypasses dedup).")
    parser.add_argument("--max-articles", type=int, default=None,
                        help="Cap how many new articles to process this run.")
    parser.add_argument("--ignore-dedup", action="store_true",
                        help="Re-process even already-seen articles / repeat proposals.")
    args = parser.parse_args()

    return run(
        dry_run=args.dry_run,
        single_article=args.article,
        max_articles=args.max_articles,
        ignore_dedup=args.ignore_dedup,
    )


if __name__ == "__main__":
    sys.exit(main())
