#!/usr/bin/env python3
"""
Daily cron job: check GOV.UK Proven Reoffending releases and load new data.

Source page:
  https://www.gov.uk/government/collections/proven-reoffending-statistics#full-publication-update-history

What this script does:
  1) Scrapes the collection page for publication links/titles.
  2) Parses quarterly cohort periods (e.g. "January to March 2024" -> "2024 Q1").
  3) For unseen periods, fetches the publication page and extracts the overall
     proven reoffending rate (%) from the narrative text.
  4) Upserts into MongoDB:
       - metrics (latest period only)
       - metricHistory (one row per period)

Usage:
  python3 server/reoffending_cron.py

Example crontab (daily 06:30 UTC):
  30 6 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/reoffending_cron.py >> /home/ec2-user/uk-rag-portal/logs/reoffending_cron.log 2>&1
"""

from __future__ import annotations

import os
import re
import sys
import html
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[ReoffendingCron] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)


LOG_PREFIX = "[ReoffendingCron]"
COLLECTION_URL = (
    "https://www.gov.uk/government/collections/"
    "proven-reoffending-statistics#full-publication-update-history"
)
BASE_URL = "https://www.gov.uk"
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def rag_status(value: float) -> str:
    # Existing crime threshold convention for reoffending: lower is better.
    # Green <= 25, Amber <= 30, else Red.
    if value <= 25.0:
        return "green"
    if value <= 30.0:
        return "amber"
    return "red"


def get_db():
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def quarter_label_from_title(title: str) -> Optional[str]:
    """
    Convert:
      'Proven reoffending statistics: January to March 2024'
    into:
      '2024 Q1'
    """
    t = title.lower().strip()
    m = re.search(
        r"(january|april|july|october)\s+to\s+"
        r"(march|june|september|december)\s+(\d{4})",
        t,
    )
    if not m:
        return None
    start_month = m.group(1)
    year = int(m.group(3))
    q_map = {
        "january": 1,
        "april": 2,
        "july": 3,
        "october": 4,
    }
    q = q_map[start_month]
    return f"{year} Q{q}"


def sort_key_quarter(period: str) -> Tuple[int, int]:
    m = re.match(r"^(\d{4})\s+Q([1-4])$", period.strip())
    if not m:
        return (0, 0)
    return (int(m.group(1)), int(m.group(2)))


def scrape_release_links(session: requests.Session) -> List[Tuple[str, str]]:
    """
    Returns list of tuples: (title, absolute_url)
    """
    r = session.get(COLLECTION_URL, timeout=30)
    r.raise_for_status()
    html = r.text

    pattern = re.compile(
        r'href="(?P<href>/government/statistics/proven-reoffending-statistics-[^"#]+)"[^>]*>'
        r"\s*(?P<title>Proven reoffending statistics:[^<]+?)\s*</a>",
        re.IGNORECASE,
    )

    seen = set()
    out: List[Tuple[str, str]] = []
    for m in pattern.finditer(html):
        href = m.group("href").strip()
        title = re.sub(r"\s+", " ", m.group("title")).strip()
        abs_url = BASE_URL + href
        key = (title, abs_url)
        if key in seen:
            continue
        seen.add(key)
        out.append(key)

    return out


def extract_rate_from_publication(session: requests.Session, url: str) -> Optional[float]:
    """
    Extract the headline overall proven reoffending rate (%).
    """
    def _extract_from_text(raw_html: str) -> Optional[float]:
        text = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", " ", raw_html, flags=re.IGNORECASE)
        text = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = html.unescape(text)
        text = re.sub(r"\s+", " ", text)

        patterns = [
            r"overall proven reoffending rate(?: for [^.]*)? (?:was|is) ([0-9]{1,2}(?:\.[0-9])?)\s*%",
            r"proven reoffending rate(?: for [^.]*)? (?:was|is) ([0-9]{1,2}(?:\.[0-9])?)\s*%",
            r"([0-9]{1,2}(?:\.[0-9])?)\s*% of offenders reoffended",
        ]
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if not m:
                continue
            try:
                v = float(m.group(1))
            except ValueError:
                continue
            if 5.0 <= v <= 60.0:
                return round(v, 1)
        return None

    r = session.get(url, timeout=30)
    r.raise_for_status()
    value = _extract_from_text(r.text)
    if value is not None:
        return value

    # Some collection links point to a statistics landing page; follow its
    # canonical bulletin subpage where the "Main points" text lives.
    slug = url.rstrip("/").split("/")[-1]
    subpage_pattern = re.compile(
        rf'href="(?P<href>/government/statistics/{re.escape(slug)}/[^"#]+)"',
        re.IGNORECASE,
    )
    for m in subpage_pattern.finditer(r.text):
        sub_href = m.group("href")
        if any(ext in sub_href.lower() for ext in [".pdf", ".xls", ".xlsx", ".ods", ".csv"]):
            continue
        sub_url = BASE_URL + sub_href
        try:
            rr = session.get(sub_url, timeout=30)
            rr.raise_for_status()
        except Exception:
            continue
        value = _extract_from_text(rr.text)
        if value is not None:
            return value

    return None


def get_existing_periods(db) -> set:
    docs = db["metricHistory"].find({"metricKey": "reoffending_rate"}, {"dataDate": 1})
    return {d["dataDate"] for d in docs}


def insert_history(db, period: str, value: float, rag: str, source_url: str) -> None:
    db["metricHistory"].find_one_and_update(
        {"metricKey": "reoffending_rate", "dataDate": period},
        {
            "$set": {
                "metricKey": "reoffending_rate",
                "value": str(value),
                "ragStatus": rag,
                "dataDate": period,
                "recordedAt": datetime.now(timezone.utc),
                "sourceUrl": source_url,
            }
        },
        upsert=True,
    )


def upsert_metric(db, period: str, value: float, rag: str, source_url: str) -> None:
    now = datetime.now(timezone.utc)
    db["metrics"].update_one(
        {"metricKey": "reoffending_rate"},
        {
            "$set": {
                "name": "Reoffending Rate",
                "category": "Crime",
                "value": str(value),
                "unit": "%",
                "ragStatus": rag,
                "dataDate": period,
                "sourceUrl": source_url,
                "lastUpdated": now,
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )


def run() -> None:
    log("Starting daily proven reoffending release check...")
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard-ReoffendingCron/1.0"})

    client, db = get_db()
    try:
        existing = get_existing_periods(db)
        log(f"Existing reoffending history periods in DB: {len(existing)}")

        releases = scrape_release_links(session)
        if not releases:
            log("No release links found on GOV.UK collection page.")
            return

        # keep only parseable quarter cohorts
        parsed = []
        for title, url in releases:
            period = quarter_label_from_title(title)
            if period:
                parsed.append((period, title, url))

        if not parsed:
            log("No parseable quarterly proven reoffending release titles found.")
            return

        parsed.sort(key=lambda x: sort_key_quarter(x[0]))
        latest_period, latest_title, latest_url = parsed[-1]
        log(f"Latest release detected: {latest_title} ({latest_period})")

        new_count = 0
        latest_value: Optional[float] = None
        latest_rag: Optional[str] = None

        for period, title, url in parsed:
            if period in existing:
                continue
            value = extract_rate_from_publication(session, url)
            if value is None:
                log(f"Could not extract headline reoffending rate for {title}; skipping.")
                continue
            rag = rag_status(value)
            insert_history(db, period, value, rag, url)
            new_count += 1
            log(f"Inserted {period}: {value}% ({rag}) from {url}")

            if period == latest_period:
                latest_value = value
                latest_rag = rag

        # Ensure current metric row always reflects latest release period.
        if latest_value is None:
            # either latest already existed or parse failed now; read from history if present
            doc = db["metricHistory"].find_one(
                {"metricKey": "reoffending_rate", "dataDate": latest_period},
                sort=[("recordedAt", -1)],
            )
            if doc:
                try:
                    latest_value = float(doc.get("value"))
                    latest_rag = str(doc.get("ragStatus") or rag_status(latest_value))
                except Exception:
                    latest_value = None

        if latest_value is not None and latest_rag is not None:
            upsert_metric(db, latest_period, latest_value, latest_rag, latest_url)
            log(f"Updated metric row to latest: {latest_period} = {latest_value}% ({latest_rag})")
        else:
            log("Latest metric row not updated (latest value unavailable).")

        if new_count == 0:
            log("No new proven reoffending cohort found.")
        else:
            log(f"Done. Loaded {new_count} new reoffending cohort(s).")
    finally:
        client.close()
        log("Database connection closed.")


if __name__ == "__main__":
    run()

