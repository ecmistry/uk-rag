#!/usr/bin/env python3
"""
Daily cron job: check NHS Digital for new sickness absence monthly data.

Scrapes the listing page, compares against months already in MongoDB,
downloads any new CSV, computes the weighted average, and inserts into
both the `metrics` and `metricHistory` collections.

Usage (manual):
    python3 server/sickness_absence_cron.py

Designed to run via crontab, e.g. daily at 07:00 UTC:
    0 7 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/sickness_absence_cron.py >> /var/log/sickness_absence_cron.log 2>&1
"""

import csv
import io
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[SicknessCron] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LISTING_URL = (
    "https://digital.nhs.uk/data-and-information/publications/statistical/"
    "nhs-sickness-absence-rates"
)
BASE_URL = "https://digital.nhs.uk"
MONGO_URI = os.environ.get("MONGODB_URI") or os.environ.get("DATABASE_URL") or "mongodb://localhost:27017/uk_rag_portal"

GREEN_MAX = 3.0
AMBER_MAX = 4.5
CIPD_ADJUSTMENT = 1.3

MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}
MONTH_NAMES = {v: k.capitalize() for k, v in MONTH_MAP.items()}
MONTH_TO_QUARTER = {
    1: "Q1", 2: "Q1", 3: "Q1", 4: "Q2", 5: "Q2", 6: "Q2",
    7: "Q3", 8: "Q3", 9: "Q3", 10: "Q4", 11: "Q4", 12: "Q4",
}

LOG_PREFIX = "[SicknessCron]"


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def rag_status(value: float) -> str:
    if value < GREEN_MAX:
        return "green"
    if value <= AMBER_MAX:
        return "amber"
    return "red"


def format_period(year: int, month: int) -> str:
    """Canonical quarterly format matching the normalised DB convention."""
    return f"{year} {MONTH_TO_QUARTER[month]}"


# ---------------------------------------------------------------------------
# NHS Digital scraping (reused logic from sickness_absence_fetcher.py)
# ---------------------------------------------------------------------------

def parse_new_date(date_str: str) -> Optional[Tuple[int, int]]:
    parts = date_str.strip().split("/")
    if len(parts) != 3:
        return None
    try:
        return (int(parts[2]), int(parts[1]))
    except ValueError:
        return None


def weighted_avg_from_csv(text: str) -> Dict[Tuple[int, int], float]:
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []

    if "SICKNESS_ABSENCE_RATE_PERCENT" in fields:
        date_col, lost_col, avail_col, parse_fn = "DATE", "FTE_DAYS_LOST", "FTE_DAYS_AVAILABLE", parse_new_date
    elif "SA Rate (%)" in fields:
        def parse_old(d):
            parts = d.strip().split("-")
            if len(parts) != 2:
                return None
            try:
                return (int(parts[0]), MONTH_MAP.get(parts[1].upper()))
            except ValueError:
                return None
        date_col, lost_col, avail_col, parse_fn = "Date", "FTE Days Sick", "FTE Days Available", parse_old
    else:
        return {}

    buckets: Dict[Tuple[int, int], List[float]] = {}
    for row in reader:
        raw = row.get(date_col, "").strip().strip('"')
        ym = parse_fn(raw)
        if ym is None or ym[1] is None:
            continue
        try:
            lost = float(row[lost_col].strip().strip('"'))
            avail = float(row[avail_col].strip().strip('"'))
        except (ValueError, KeyError):
            continue
        if ym not in buckets:
            buckets[ym] = [0.0, 0.0]
        buckets[ym][0] += lost
        buckets[ym][1] += avail

    return {ym: round((l / a) * 100, 2) for ym, (l, a) in buckets.items() if a > 0}


def extract_month_year_from_slug(slug: str) -> Optional[Tuple[int, int]]:
    names = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    for name, num in names.items():
        m = re.search(name + r"[- ](\d{4})", slug)
        if m:
            return (int(m.group(1)), num)
    return None


def get_monthly_publication_slugs(session: requests.Session) -> List[str]:
    try:
        r = session.get(LISTING_URL, timeout=20)
        r.raise_for_status()
    except Exception as e:
        log(f"Failed to fetch listing page: {e}")
        return []

    prefix = "/data-and-information/publications/statistical/nhs-sickness-absence-rates/"
    pattern = re.compile(r'href="(' + re.escape(prefix) + r'[^"]+)"')
    slugs = set()
    for m in pattern.finditer(r.text):
        slug = m.group(1)[len(prefix):]
        if "-to-" not in slug and "annual" not in slug:
            slugs.add(slug)
    return sorted(slugs)


def fetch_csv_url_from_pub_page(session: requests.Session, slug: str) -> Optional[str]:
    if ".." in slug or "/" in slug:
        log(f"Rejecting suspicious slug: {slug}")
        return None
    url = f"{BASE_URL}/data-and-information/publications/statistical/nhs-sickness-absence-rates/{slug}"
    try:
        r = session.get(url, timeout=15)
        if r.status_code != 200:
            return None
    except Exception as e:
        log(f"Failed to fetch publication page for {slug}: {e}")
        return None

    csv_links = re.findall(r'href="(https://files\.digital\.nhs\.uk/[^"]*\.csv)"', r.text)
    for link in csv_links:
        lower = link.lower()
        if "by reason" in lower or "by%20reason" in lower:
            continue
        if "benchmarking" in lower:
            continue
        return link
    return None


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db():
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def get_existing_months(db) -> set:
    """Return set of dataDate strings already in metricHistory for sickness_absence."""
    coll = db["metricHistory"]
    docs = coll.find({"metricKey": "sickness_absence"}, {"dataDate": 1})
    return {doc["dataDate"] for doc in docs}


def insert_history(db, period: str, value: float, rag: str) -> None:
    coll = db["metricHistory"]
    coll.find_one_and_update(
        {"metricKey": "sickness_absence", "dataDate": period},
        {"$set": {
            "metricKey": "sickness_absence",
            "value": str(value),
            "ragStatus": rag,
            "dataDate": period,
            "recordedAt": datetime.now(timezone.utc),
        }},
        upsert=True,
    )


def upsert_metric(db, period: str, value: float, rag: str) -> None:
    coll = db["metrics"]
    now = datetime.now(timezone.utc)
    coll.update_one(
        {"metricKey": "sickness_absence"},
        {
            "$set": {
                "name": "Sickness Absence",
                "category": "Employment",
                "value": str(value),
                "unit": "%",
                "ragStatus": rag,
                "dataDate": period,
                "sourceUrl": LISTING_URL,
                "lastUpdated": now,
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )


# ---------------------------------------------------------------------------
# Main cron logic
# ---------------------------------------------------------------------------

def run() -> None:
    log("Starting daily sickness absence check...")

    client, db = get_db()
    try:
        existing_periods = get_existing_months(db)
        log(f"Found {len(existing_periods)} existing monthly entries in DB")

        session = requests.Session()
        session.headers.update({"User-Agent": "UK-RAG-Dashboard-Cron/1.0"})

        slugs = get_monthly_publication_slugs(session)
        log(f"Found {len(slugs)} monthly publications on NHS Digital")

        new_count = 0
        latest_ym = None
        latest_value = None

        for slug in slugs:
            ym = extract_month_year_from_slug(slug)
            if ym is None:
                continue

            period = format_period(ym[0], ym[1])
            if period in existing_periods:
                continue

            log(f"New month detected: {period} (slug: {slug})")

            csv_url = fetch_csv_url_from_pub_page(session, slug)
            if not csv_url:
                log(f"  Could not find CSV link for {slug}, skipping")
                continue

            try:
                r = session.get(csv_url, timeout=30)
                r.raise_for_status()
                month_data = weighted_avg_from_csv(r.text)
            except Exception as e:
                log(f"  Failed to download/parse CSV for {slug}: {e}")
                continue

            if ym not in month_data:
                log(f"  CSV downloaded but no data found for {period}")
                continue

            nhs_val = month_data[ym]
            value = round(max(0, nhs_val - CIPD_ADJUSTMENT), 2)
            rag = rag_status(value)

            insert_history(db, period, value, rag)
            new_count += 1
            log(f"  Inserted: {period} = {value}% ({rag}) [NHS: {nhs_val}%, adj: -{CIPD_ADJUSTMENT}pp]")

            if latest_ym is None or ym > latest_ym:
                latest_ym = ym
                latest_value = value

            time.sleep(0.5)

        if latest_value is not None:
            period = format_period(latest_ym[0], latest_ym[1])
            rag = rag_status(latest_value)
            upsert_metric(db, period, latest_value, rag)
            log(f"Updated tile metric to: {period} = {latest_value}% ({rag})")

            # Invalidate the fetcher cache so the live site picks up the new data immediately
            cache_file = os.path.join(os.path.dirname(__file__), "sickness_absence_cache.json")
            if os.path.exists(cache_file):
                os.remove(cache_file)
                log("Cleared sickness_absence_cache.json")

        if new_count == 0:
            log("No new months found – data is up to date.")
        else:
            log(f"Done. Loaded {new_count} new month(s).")

    finally:
        client.close()


if __name__ == "__main__":
    run()
