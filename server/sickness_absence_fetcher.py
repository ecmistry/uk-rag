#!/usr/bin/env python3
"""
NHS Sickness Absence Data Fetcher for UK RAG Dashboard.

Fetches monthly sickness absence rates from NHS Digital:
  https://digital.nhs.uk/data-and-information/publications/statistical/nhs-sickness-absence-rates

Strategy:
  1. Download the annual summary CSV (covers April 2009 – March 2019, old column format).
  2. Scrape the listing page for individual monthly publication URLs (April 2019+).
  3. For each monthly publication, scrape the page for the rates CSV link and download it.
  4. Compute the weighted average rate per month: sum(FTE_DAYS_LOST) / sum(FTE_DAYS_AVAILABLE) * 100.
  5. Output JSON: list of {metric_name, metric_key, category, value, time_period, unit, rag_status, ...}.

Caching: Results are written to server/sickness_absence_cache.json with a TTL so subsequent
calls within the window skip the expensive HTTP work.
"""

import csv
import io
import json
import os
import re
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import requests

LISTING_URL = (
    "https://digital.nhs.uk/data-and-information/publications/statistical/"
    "nhs-sickness-absence-rates"
)

ANNUAL_CSV_URL = (
    "https://files.digital.nhs.uk/8F/919EB8/ESR_ABSENCE_annual_csv_HEE.csv"
)

BASE_URL = "https://digital.nhs.uk"
CACHE_FILE = os.path.join(os.path.dirname(__file__), "sickness_absence_cache.json")
CACHE_TTL_SECONDS = 6 * 3600  # 6 hours

GREEN_MAX = 3.0
AMBER_MAX = 4.5

MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}
MONTH_NAMES = {v: k.capitalize() for k, v in MONTH_MAP.items()}


def rag_status(value: float) -> str:
    if value < GREEN_MAX:
        return "green"
    if value <= AMBER_MAX:
        return "amber"
    return "red"


def parse_old_date(date_str: str) -> Optional[Tuple[int, int]]:
    """Parse '2014-NOV' -> (2014, 11)."""
    parts = date_str.strip().split("-")
    if len(parts) != 2:
        return None
    try:
        year = int(parts[0])
        month = MONTH_MAP.get(parts[1].upper())
        if month is None:
            return None
        return (year, month)
    except ValueError:
        return None


def parse_new_date(date_str: str) -> Optional[Tuple[int, int]]:
    """Parse '30/11/2025' -> (2025, 11)."""
    parts = date_str.strip().split("/")
    if len(parts) != 3:
        return None
    try:
        return (int(parts[2]), int(parts[1]))
    except ValueError:
        return None


def weighted_avg_from_csv(text: str) -> Dict[Tuple[int, int], float]:
    """
    Read a sickness absence CSV and return {(year, month): weighted_rate}
    for every month present. Handles both old-format and new-format columns.
    """
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []

    # Detect format
    if "SICKNESS_ABSENCE_RATE_PERCENT" in fields:
        date_col = "DATE"
        lost_col = "FTE_DAYS_LOST"
        avail_col = "FTE_DAYS_AVAILABLE"
        parse_fn = parse_new_date
    elif "SA Rate (%)" in fields:
        date_col = "Date"
        lost_col = "FTE Days Sick"
        avail_col = "FTE Days Available"
        parse_fn = parse_old_date
    else:
        return {}

    buckets: Dict[Tuple[int, int], List[float]] = {}  # key -> [lost, avail]
    for row in reader:
        raw_date = row.get(date_col, "").strip().strip('"')
        ym = parse_fn(raw_date)
        if ym is None:
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

    result: Dict[Tuple[int, int], float] = {}
    for ym, (lost, avail) in buckets.items():
        if avail > 0:
            result[ym] = round((lost / avail) * 100, 2)
    return result


def fetch_annual_csv(session: requests.Session) -> Dict[Tuple[int, int], float]:
    """Download the annual summary CSV covering Apr 2009 – Mar 2019."""
    try:
        r = session.get(ANNUAL_CSV_URL, timeout=30)
        r.raise_for_status()
        return weighted_avg_from_csv(r.text)
    except Exception as e:
        print(f"[SicknessAbsence] Failed to fetch annual CSV: {e}", file=sys.stderr)
        return {}


def get_monthly_publication_slugs(session: requests.Session) -> List[str]:
    """Scrape listing page for individual-month publication path slugs."""
    try:
        r = session.get(LISTING_URL, timeout=20)
        r.raise_for_status()
    except Exception as e:
        print(f"[SicknessAbsence] Failed to fetch listing page: {e}", file=sys.stderr)
        return []

    prefix = "/data-and-information/publications/statistical/nhs-sickness-absence-rates/"
    pattern = re.compile(r'href="(' + re.escape(prefix) + r'[^"]+)"')
    all_slugs = set()
    for m in pattern.finditer(r.text):
        path = m.group(1)
        slug = path[len(prefix):]
        all_slugs.add(slug)

    # Filter: keep only single-month slugs (exclude quarterly summaries and annual summaries)
    monthly = []
    for slug in all_slugs:
        if "-to-" in slug:
            continue
        if "annual" in slug:
            continue
        monthly.append(slug)

    return sorted(monthly)


def extract_month_year_from_slug(slug: str) -> Optional[Tuple[int, int]]:
    """Best-effort parse of 'november-2025' or 'nhs-sickness-absence-rates-november-2017'."""
    month_names_lower = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    for name, num in month_names_lower.items():
        pattern = re.compile(name + r"[- ](\d{4})")
        m = pattern.search(slug)
        if m:
            return (int(m.group(1)), num)
    return None


def fetch_csv_url_from_pub_page(session: requests.Session, slug: str) -> Optional[str]:
    """Scrape a publication page to find the sickness absence rates CSV URL."""
    url = BASE_URL + "/data-and-information/publications/statistical/nhs-sickness-absence-rates/" + slug
    try:
        r = session.get(url, timeout=15)
        if r.status_code != 200:
            return None
    except Exception:
        return None

    # Look for CSV links - we want the rates CSV, NOT "by reason" or "benchmarking"
    csv_links = re.findall(r'href="(https://files\.digital\.nhs\.uk/[^"]*\.csv)"', r.text)
    for link in csv_links:
        lower = link.lower()
        if "by reason" in lower or "by%20reason" in lower:
            continue
        if "benchmarking" in lower:
            continue
        return link

    return None


def fetch_monthly_csvs(
    session: requests.Session,
    existing_months: set,
) -> Dict[Tuple[int, int], float]:
    """For each monthly publication not already in existing_months, fetch the CSV."""
    slugs = get_monthly_publication_slugs(session)
    results: Dict[Tuple[int, int], float] = {}

    for slug in slugs:
        ym = extract_month_year_from_slug(slug)
        if ym and ym in existing_months:
            continue

        csv_url = fetch_csv_url_from_pub_page(session, slug)
        if not csv_url:
            continue

        try:
            r = session.get(csv_url, timeout=30)
            r.raise_for_status()
            month_data = weighted_avg_from_csv(r.text)
            results.update(month_data)
        except Exception as e:
            print(f"[SicknessAbsence] Failed to fetch CSV for {slug}: {e}", file=sys.stderr)

        time.sleep(0.3)

    return results


def load_cache() -> Optional[dict]:
    try:
        if not os.path.exists(CACHE_FILE):
            return None
        with open(CACHE_FILE, "r") as f:
            data = json.load(f)
        if time.time() - data.get("timestamp", 0) > CACHE_TTL_SECONDS:
            return None
        return data
    except Exception:
        return None


def save_cache(months: Dict[str, float]) -> None:
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump({"timestamp": time.time(), "months": months}, f)
    except Exception:
        pass


def fetch_all_months() -> Dict[Tuple[int, int], float]:
    """Fetch all available monthly sickness absence rates."""

    # Check cache first
    cached = load_cache()
    if cached and "months" in cached:
        result = {}
        for key_str, val in cached["months"].items():
            parts = key_str.split(",")
            if len(parts) == 2:
                result[(int(parts[0]), int(parts[1]))] = val
        return result

    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})

    print("[SicknessAbsence] Fetching annual CSV (2009-2019)...", file=sys.stderr)
    all_months = fetch_annual_csv(session)
    print(f"[SicknessAbsence] Got {len(all_months)} months from annual CSV", file=sys.stderr)

    print("[SicknessAbsence] Fetching individual monthly CSVs...", file=sys.stderr)
    monthly = fetch_monthly_csvs(session, set(all_months.keys()))
    print(f"[SicknessAbsence] Got {len(monthly)} additional months from individual CSVs", file=sys.stderr)

    all_months.update(monthly)

    # Save cache
    cache_dict = {f"{y},{m}": v for (y, m), v in all_months.items()}
    save_cache(cache_dict)

    return all_months


def format_period(year: int, month: int) -> str:
    return f"{MONTH_NAMES.get(month, str(month))} {year}"


def main():
    historical = "--historical" in sys.argv

    all_months = fetch_all_months()
    if not all_months:
        print("[]")
        return

    sorted_months = sorted(all_months.keys())
    now = datetime.utcnow().isoformat()

    if historical:
        entries = sorted_months
    else:
        entries = sorted_months[-1:] if sorted_months else []

    results = []
    for ym in entries:
        year, month = ym
        value = all_months[ym]
        results.append({
            "metric_name": "Sickness Absence",
            "metric_key": "sickness_absence",
            "category": "Employment",
            "value": value,
            "time_period": format_period(year, month),
            "unit": "%",
            "rag_status": rag_status(value),
            "data_source": "NHS Digital",
            "source_url": LISTING_URL,
            "last_updated": now,
        })

    print(json.dumps(results))


if __name__ == "__main__":
    main()
