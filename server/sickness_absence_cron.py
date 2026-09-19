#!/usr/bin/env python3
"""
Daily cron job: check NHS Digital for new sickness absence monthly data.

Scrapes the listing page, skips unpublished ("Upcoming") stubs, downloads
CSVs for published months, computes the CIPD-adjusted weighted average, and
upserts into `metrics` + `metricHistory` (canonical YYYY QN, latest month
in each quarter wins).

Usage (manual):
    python3 server/sickness_absence_cron.py
    python3 server/sickness_absence_cron.py --backfill   # ingest older years too

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
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[SicknessCron] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)

from env_loader import load_project_env

load_project_env()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LISTING_URL = (
    "https://digital.nhs.uk/data-and-information/publications/statistical/"
    "nhs-sickness-absence-rates"
)
BASE_URL = "https://digital.nhs.uk"
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)

GREEN_MAX = 3.0
AMBER_MAX = 4.5
CIPD_ADJUSTMENT = 1.3

MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}
MONTH_TO_QUARTER = {
    1: "Q1", 2: "Q1", 3: "Q1", 4: "Q2", 5: "Q2", 6: "Q2",
    7: "Q3", 8: "Q3", 9: "Q3", 10: "Q4", 11: "Q4", 12: "Q4",
}

SCRIPT_DIR = Path(__file__).resolve().parent
MONTH_CACHE_FILE = SCRIPT_DIR / "sickness_absence_months_cache.json"

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


def month_key(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


# ---------------------------------------------------------------------------
# NHS Digital scraping
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
        date_col, lost_col, avail_col, parse_fn = (
            "DATE", "FTE_DAYS_LOST", "FTE_DAYS_AVAILABLE", parse_new_date
        )
    elif "SA Rate (%)" in fields:
        def parse_old(d):
            parts = d.strip().split("-")
            if len(parts) != 2:
                return None
            try:
                return (int(parts[0]), MONTH_MAP.get(parts[1].upper()))
            except ValueError:
                return None
        date_col, lost_col, avail_col, parse_fn = (
            "Date", "FTE Days Sick", "FTE Days Available", parse_old
        )
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


def publication_is_upcoming(page_html: str) -> bool:
    """True for scheduled stubs that have no downloadable data yet."""
    lowered = page_html.lower()
    markers = (
        "upcoming, not yet published",
        "not yet published",
        "this publication is forthcoming",
    )
    return any(m in lowered for m in markers)


def fetch_csv_url_from_pub_page(
    session: requests.Session, slug: str
) -> Tuple[Optional[str], str]:
    """
    Return (csv_url_or_None, status) where status is one of:
      'ok', 'upcoming', 'no_csv', 'error'
    """
    if ".." in slug or "/" in slug:
        log(f"Rejecting suspicious slug: {slug}")
        return None, "error"
    url = (
        f"{BASE_URL}/data-and-information/publications/statistical/"
        f"nhs-sickness-absence-rates/{slug}"
    )
    try:
        r = session.get(url, timeout=15)
        if r.status_code != 200:
            return None, "error"
    except Exception as e:
        log(f"Failed to fetch publication page for {slug}: {e}")
        return None, "error"

    if publication_is_upcoming(r.text):
        return None, "upcoming"

    csv_links = re.findall(
        r'href="(https://files\.digital\.nhs\.uk/[^"]*\.csv)"', r.text, re.I
    )
    if not csv_links:
        csv_links = re.findall(
            r'(https://files\.digital\.nhs\.uk/[^\s"\'<>]+\.csv)', r.text, re.I
        )

    for link in csv_links:
        lower = link.lower().replace("%20", " ")
        if "by reason" in lower or "by%20reason" in lower:
            continue
        if "benchmarking" in lower:
            continue
        return link, "ok"
    return None, "no_csv"


def load_month_cache() -> Dict[str, float]:
    if not MONTH_CACHE_FILE.is_file():
        return {}
    try:
        data = json.loads(MONTH_CACHE_FILE.read_text(encoding="utf-8"))
        months = data.get("months", data if isinstance(data, dict) else {})
        return {str(k): float(v) for k, v in months.items()}
    except Exception as e:
        log(f"Warning: could not read month cache ({e}); starting fresh")
        return {}


def save_month_cache(months: Dict[str, float]) -> None:
    payload = {
        "months": months,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    MONTH_CACHE_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db():
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


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


def quarter_snapshots_from_months(
    months: Dict[str, float],
) -> Dict[str, Tuple[str, float]]:
    """
    Collapse YYYY-MM adjusted values to canonical quarters.
    Latest calendar month within each quarter wins.
    Returns {period: (month_key, value)}.
    """
    best: Dict[str, Tuple[str, float]] = {}
    for mk, value in months.items():
        try:
            year_s, month_s = mk.split("-")
            year, month = int(year_s), int(month_s)
        except ValueError:
            continue
        period = format_period(year, month)
        prev = best.get(period)
        if prev is None or mk > prev[0]:
            best[period] = (mk, value)
    return best


# ---------------------------------------------------------------------------
# Main cron logic
# ---------------------------------------------------------------------------

def run() -> None:
    log("Starting daily sickness absence check...")

    client, db = get_db()
    try:
        month_cache = load_month_cache()
        log(f"Month cache has {len(month_cache)} ingested month(s)")

        session = requests.Session()
        session.headers.update({"User-Agent": "UK-RAG-Dashboard-Cron/1.0"})

        slugs = get_monthly_publication_slugs(session)
        log(f"Found {len(slugs)} monthly publications on NHS Digital")

        # Only probe recent publications for new months. Older history already
        # lives in Mongo; use --backfill to re-ingest further back.
        backfill = "--backfill" in sys.argv
        now = datetime.now(timezone.utc)
        min_year = 0 if backfill else (now.year - 1)
        if not backfill:
            log(f"Probing publications from {min_year} onwards (pass --backfill for full history)")

        new_months = 0
        skipped_upcoming = 0
        skipped_no_csv = 0

        for slug in slugs:
            ym = extract_month_year_from_slug(slug)
            if ym is None:
                continue
            if ym[0] < min_year:
                continue

            mk = month_key(ym[0], ym[1])
            if mk in month_cache:
                continue

            csv_url, status = fetch_csv_url_from_pub_page(session, slug)
            if status == "upcoming":
                skipped_upcoming += 1
                continue
            if status != "ok" or not csv_url:
                if status == "no_csv":
                    skipped_no_csv += 1
                    log(f"  Published page has no usable rates CSV yet: {slug}")
                continue

            log(f"New published month: {mk} (slug: {slug})")
            try:
                r = session.get(csv_url, timeout=30)
                r.raise_for_status()
                month_data = weighted_avg_from_csv(r.text)
            except Exception as e:
                log(f"  Failed to download/parse CSV for {slug}: {e}")
                continue

            if ym not in month_data:
                log(f"  CSV downloaded but no row for {mk}")
                continue

            nhs_val = month_data[ym]
            value = round(max(0, nhs_val - CIPD_ADJUSTMENT), 2)
            month_cache[mk] = value
            new_months += 1
            log(
                f"  Cached: {mk} = {value}% "
                f"[NHS: {nhs_val}%, adj: -{CIPD_ADJUSTMENT}pp]"
            )
            time.sleep(0.5)

        if skipped_upcoming:
            log(f"Skipped {skipped_upcoming} upcoming/unpublished publication stub(s)")
        if skipped_no_csv:
            log(f"Skipped {skipped_no_csv} page(s) with no rates CSV")

        if not month_cache:
            log("No sickness absence months available – nothing to write")
            return

        save_month_cache(month_cache)
        snapshots = quarter_snapshots_from_months(month_cache)

        for period, (_mk, value) in sorted(snapshots.items()):
            rag = rag_status(value)
            insert_history(db, period, value, rag)

        latest_mk = max(month_cache.keys())
        latest_value = month_cache[latest_mk]
        y, m = latest_mk.split("-")
        latest_period = format_period(int(y), int(m))
        rag = rag_status(latest_value)
        upsert_metric(db, latest_period, latest_value, rag)
        log(
            f"Updated tile metric to: {latest_period} = {latest_value}% "
            f"({rag}) [from {latest_mk}]"
        )

        cache_file = SCRIPT_DIR / "sickness_absence_cache.json"
        if cache_file.exists():
            cache_file.unlink()
            log("Cleared sickness_absence_cache.json")

        if new_months == 0:
            log("No new published months – quarter snapshots refreshed from cache.")
        else:
            log(f"Done. Ingested {new_months} new month(s).")

    finally:
        client.close()
        log("Done.")


if __name__ == "__main__":
    run()
