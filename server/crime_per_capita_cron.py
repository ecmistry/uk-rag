#!/usr/bin/env python3
"""
Crime per-capita cron: downloads the latest cumulative street-level crime
archive from data.police.uk, categorises into ASB/Low-Level and Serious
Crime, aggregates quarterly, and calculates per-100,000 population rates.

The archive is cumulative — a single zip contains all months from Feb 2023
onwards, with per-force CSVs named like `YYYY-MM/YYYY-MM-force-street.csv`.

Usage:
    python3 server/crime_per_capita_cron.py            # process only new months
    python3 server/crime_per_capita_cron.py --seed      # full rebuild from archive

Crontab (daily 08:00 UTC):
    0 8 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/crime_per_capita_cron.py >> /home/ec2-user/uk-rag-portal/logs/crime_per_capita_cron.log 2>&1
"""
from __future__ import annotations

import csv
import io
import json
import os
import re
import sys
import tempfile
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[CrimePerCapita] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_FILE = os.path.join(SCRIPT_DIR, "crime_per_capita_cache.json")
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)
LOG_PREFIX = "[CrimePerCapita]"

LAST_UPDATED_URL = "https://data.police.uk/api/crime-last-updated"
ARCHIVE_URL_TEMPLATE = "https://data.police.uk/data/archive/{year}-{month:02d}.zip"

# Crime type display names (as they appear in the CSV "Crime type" column)
ASB_LOW_LEVEL_TYPES: Set[str] = {
    "Anti-social behaviour",
    "Shoplifting",
    "Bicycle theft",
    "Other theft",
    "Theft from the person",
    "Vehicle crime",
    "Public order",
    "Other crime",
    "Criminal damage and arson",
}

SERIOUS_TYPES: Set[str] = {
    "Violence and sexual offences",
    "Robbery",
    "Burglary",
    "Drugs",
    "Possession of weapons",
}

PER_CAPITA_MULTIPLIER = 100_000

# Placeholder RAG thresholds (per 100,000 population per quarter)
RAG_THRESHOLDS = {
    "asb_low_level_crime": {"green": 800.0, "amber": 1200.0},
    "serious_crime": {"green": 400.0, "amber": 700.0},
}

MONTH_TO_QUARTER = {
    1: 1, 2: 1, 3: 1,
    4: 2, 5: 2, 6: 2,
    7: 3, 8: 3, 9: 3,
    10: 4, 11: 4, 12: 4,
}
QUARTER_MONTHS = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10, 11, 12],
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


# ---------------------------------------------------------------------------
# Cache management (monthly raw counts)
# ---------------------------------------------------------------------------

def load_cache() -> Dict[str, Any]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {"monthly_counts": {}, "processed_quarters": []}


def save_cache(cache: Dict[str, Any]) -> None:
    tmp = CACHE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(cache, f, indent=2)
    os.replace(tmp, CACHE_FILE)


# ---------------------------------------------------------------------------
# data.police.uk interaction
# ---------------------------------------------------------------------------

def get_latest_available_month() -> Tuple[int, int]:
    """Returns (year, month) of the latest available data."""
    try:
        r = requests.get(LAST_UPDATED_URL, timeout=15)
        r.raise_for_status()
        date_str = r.json()["date"]
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.year, dt.month
    except Exception as e:
        log(f"Failed to check latest available month: {e}")
        raise


MONTH_PATTERN = re.compile(r"(\d{4})-(\d{2})/\d{4}-\d{2}-.*-street\.csv$")


def download_and_count_all(year: int, month: int) -> Optional[Dict[str, Dict[str, int]]]:
    """
    Download the latest cumulative archive and count crimes per month.
    Returns { "YYYY-MM": {"asb": N, "serious": N}, ... } or None on failure.
    """
    url = ARCHIVE_URL_TEMPLATE.format(year=year, month=month)
    log(f"Downloading cumulative archive ({year}-{month:02d})...")

    try:
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            tmp_path = tmp.name
            r = requests.get(url, stream=True, timeout=1800, allow_redirects=True)
            r.raise_for_status()
            downloaded = 0
            for chunk in r.iter_content(chunk_size=8 * 1024 * 1024):
                tmp.write(chunk)
                downloaded += len(chunk)
            log(f"  Downloaded {downloaded / (1024*1024):.0f} MB")
    except Exception as e:
        log(f"  Failed to download: {e}")
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        return None

    # month_key -> {"asb": count, "serious": count}
    counts: Dict[str, Dict[str, int]] = defaultdict(lambda: {"asb": 0, "serious": 0})

    try:
        with zipfile.ZipFile(tmp_path, "r") as zf:
            street_files = [n for n in zf.namelist() if n.endswith("-street.csv")]
            log(f"  Found {len(street_files)} street CSV files in archive")

            for i, csv_name in enumerate(street_files):
                m = MONTH_PATTERN.search(csv_name)
                if not m:
                    continue
                month_key = f"{m.group(1)}-{m.group(2)}"

                try:
                    with zf.open(csv_name) as f:
                        reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
                        for row in reader:
                            crime_type = row.get("Crime type", "").strip()
                            if crime_type in ASB_LOW_LEVEL_TYPES:
                                counts[month_key]["asb"] += 1
                            elif crime_type in SERIOUS_TYPES:
                                counts[month_key]["serious"] += 1
                except Exception as e:
                    log(f"  Warning: failed to parse {csv_name}: {e}")

                if (i + 1) % 200 == 0:
                    log(f"  Processed {i + 1}/{len(street_files)} CSV files...")

    except zipfile.BadZipFile:
        log("  Bad zip file")
        os.unlink(tmp_path)
        return None
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    log(f"  Parsed data for {len(counts)} months")
    for mk in sorted(counts):
        c = counts[mk]
        log(f"    {mk}: ASB={c['asb']:,}  Serious={c['serious']:,}")

    return dict(counts)


# ---------------------------------------------------------------------------
# RAG and per-capita calculation
# ---------------------------------------------------------------------------

def rag_status(metric_key: str, value: float) -> str:
    thresholds = RAG_THRESHOLDS.get(metric_key, {"green": 800, "amber": 1200})
    if value <= thresholds["green"]:
        return "green"
    if value <= thresholds["amber"]:
        return "amber"
    return "red"


def calculate_quarterly_rate(total_incidents: int, population: int) -> float:
    if population <= 0:
        return 0.0
    return round((total_incidents / population) * PER_CAPITA_MULTIPLIER, 1)


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db():
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def get_population(db) -> int:
    """Get the total UK population from the metrics collection."""
    doc = db["metrics"].find_one({"metricKey": "total_population"})
    if doc:
        try:
            return int(float(doc["value"]))
        except (ValueError, TypeError):
            pass
    log("Warning: total_population not found in DB, using fallback 69487000")
    return 69_487_000


def upsert_metric(db, metric_key: str, name: str, value: float,
                  rag: str, quarter: str, raw_count: int) -> None:
    now = datetime.now(timezone.utc)
    db["metrics"].update_one(
        {"metricKey": metric_key},
        {
            "$set": {
                "name": name,
                "category": "Crime",
                "value": str(value),
                "unit": "per 100k",
                "ragStatus": rag,
                "dataDate": quarter,
                "sourceUrl": "https://data.police.uk/data/",
                "lastUpdated": now,
                "information": f"Raw count: {raw_count:,} incidents",
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )


def insert_history(db, metric_key: str, value: float, rag: str,
                   quarter: str, raw_count: int) -> None:
    db["metricHistory"].find_one_and_update(
        {"metricKey": metric_key, "dataDate": quarter},
        {
            "$set": {
                "metricKey": metric_key,
                "value": str(value),
                "ragStatus": rag,
                "dataDate": quarter,
                "recordedAt": datetime.now(timezone.utc),
                "information": f"Raw count: {raw_count:,} incidents",
            },
        },
        upsert=True,
    )


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------

def run(seed: bool = False) -> None:
    log("=" * 70)
    log(f"Crime per-capita {'SEED' if seed else 'daily check'} starting")
    log("=" * 70)

    cache = load_cache()
    existing_months = set(cache.get("monthly_counts", {}).keys())
    processed_quarters = set(cache.get("processed_quarters", []))

    latest_year, latest_month = get_latest_available_month()
    latest_key = f"{latest_year}-{latest_month:02d}"
    log(f"Latest available data: {latest_key}")

    if not seed and latest_key in existing_months:
        log("Latest month already cached — checking for incomplete quarters only.")
    else:
        # Download the cumulative archive (contains all months)
        all_counts = download_and_count_all(latest_year, latest_month)
        if all_counts is None:
            log("FAILED: could not download/parse archive")
            sys.exit(1)

        if seed:
            cache["monthly_counts"] = all_counts
        else:
            for mk, c in all_counts.items():
                if mk not in existing_months:
                    cache.setdefault("monthly_counts", {})[mk] = c

        save_cache(cache)
        log(f"Cached monthly counts for {len(cache['monthly_counts'])} months")

    client, db = get_db()
    try:
        population = get_population(db)
        log(f"UK population for per-capita: {population:,}")

        monthly_counts = cache.get("monthly_counts", {})
        new_quarter_count = 0

        years = set()
        for mk in monthly_counts:
            y_str = mk.split("-")[0]
            years.add(int(y_str))

        for year in sorted(years):
            for q_num, q_months in QUARTER_MONTHS.items():
                quarter_label = f"{year} Q{q_num}"
                if quarter_label in processed_quarters:
                    continue

                month_keys = [f"{year}-{m:02d}" for m in q_months]
                if not all(mk in monthly_counts for mk in month_keys):
                    continue

                asb_total = sum(monthly_counts[mk]["asb"] for mk in month_keys)
                serious_total = sum(monthly_counts[mk]["serious"] for mk in month_keys)

                asb_rate = calculate_quarterly_rate(asb_total, population)
                serious_rate = calculate_quarterly_rate(serious_total, population)

                asb_rag = rag_status("asb_low_level_crime", asb_rate)
                serious_rag = rag_status("serious_crime", serious_rate)

                log(f"  Quarter {quarter_label}:")
                log(f"    ASB/Low-Level: {asb_total:,} incidents = {asb_rate} per 100k ({asb_rag})")
                log(f"    Serious:       {serious_total:,} incidents = {serious_rate} per 100k ({serious_rag})")

                upsert_metric(db, "asb_low_level_crime",
                              "Anti-Social Behaviour and Low Level Crime per capita",
                              asb_rate, asb_rag, quarter_label, asb_total)
                insert_history(db, "asb_low_level_crime",
                               asb_rate, asb_rag, quarter_label, asb_total)

                upsert_metric(db, "serious_crime",
                              "Serious Crime per capita",
                              serious_rate, serious_rag, quarter_label, serious_total)
                insert_history(db, "serious_crime",
                               serious_rate, serious_rag, quarter_label, serious_total)

                processed_quarters.add(quarter_label)
                new_quarter_count += 1

        cache["processed_quarters"] = sorted(processed_quarters)
        save_cache(cache)

        log(f"\n{'=' * 70}")
        log("SUMMARY")
        log(f"{'=' * 70}")
        log(f"  Total months cached: {len(monthly_counts)}")
        log(f"  Quarters completed this run: {new_quarter_count}")
        log(f"  Total quarters in DB: {len(processed_quarters)}")

    finally:
        client.close()
        log("Database connection closed")


if __name__ == "__main__":
    seed_mode = "--seed" in sys.argv
    run(seed=seed_mode)
