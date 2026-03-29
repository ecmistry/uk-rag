#!/usr/bin/env python3
"""
Fetch UK public sector current receipts from ONS Appendix D Excel.

Source: https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/datasets/appendixdpublicsectorcurrentreceipts

Usage:
  python3 server/public_sector_receipts_fetcher.py --chart   # JSON to stdout for tRPC
  python3 server/public_sector_receipts_fetcher.py --cron    # Upsert into MongoDB

Crontab (daily at 06:30 UTC):
  30 6 * * * cd /home/ec2-user/uk-rag-portal && python3 server/public_sector_receipts_fetcher.py --cron >> logs/public_sector_receipts.log 2>&1
"""

import json
import os
import re
import sys
import tempfile
from collections import defaultdict
from datetime import datetime, timezone

import requests

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl is required. Install with: pip3 install openpyxl", file=sys.stderr)
    sys.exit(1)

DOWNLOAD_URL = "https://www.ons.gov.uk/file?uri=/economy/governmentpublicsectorandtaxes/publicsectorfinance/datasets/appendixdpublicsectorcurrentreceipts/current/publicsectorcurrentreceiptsappendixdfinal.xlsx"

YELLOW_COLUMNS = {
    "B":  "vat",
    "E":  "fuel_duties",
    "F":  "business_rates",
    "G":  "stamp_duty_land_tax",
    "H":  "stamp_taxes_on_shares",
    "I":  "tobacco_duties",
    "J":  "alcohol_duties",
    "O":  "customs_duties",
    "P":  "vehicle_excise_business",
    "Q":  "other_taxes_on_production",
    "AT": "income_tax",
    "AY": "corporation_tax",
    "BE": "petroleum_revenue_tax",
    "BF": "misc_taxes_income_wealth",
    "BI": "vehicle_excise_households",
    "BJ": "bank_levy",
    "BK": "tv_licence_fee",
    "BL": "misc_other_taxes",
    "BP": "social_contributions",
    "BR": "council_tax",
    "BS": "other_local_govt_taxes",
    "BU": "interest_and_dividends",
    "BW": "gross_operating_surplus",
    "BX": "other_receipts",
}

MONTH_TO_QUARTER = {
    "Jan": 1, "Feb": 1, "Mar": 1,
    "Apr": 2, "May": 2, "Jun": 2,
    "Jul": 3, "Aug": 3, "Sep": 3,
    "Oct": 4, "Nov": 4, "Dec": 4,
}

MONTHS_IN_QUARTER = {
    1: {"Jan", "Feb", "Mar"},
    2: {"Apr", "May", "Jun"},
    3: {"Jul", "Aug", "Sep"},
    4: {"Oct", "Nov", "Dec"},
}


def log(msg):
    print(f"[PublicSectorReceipts] {msg}", file=sys.stderr, flush=True)


def download_excel():
    """Download the ONS Excel file to a temp path and return the path."""
    log("Downloading ONS Appendix D Excel...")
    headers = {"User-Agent": "UK-RAG-Dashboard/1.0 (public sector receipts fetcher)"}
    try:
        resp = requests.get(DOWNLOAD_URL, headers=headers, timeout=120)
        resp.raise_for_status()
    except requests.RequestException as e:
        log(f"ERROR: Failed to download from ONS: {e}")
        raise
    if len(resp.content) < 10_000:
        raise ValueError(f"Downloaded file suspiciously small ({len(resp.content)} bytes), aborting")
    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    tmp.write(resp.content)
    tmp.close()
    log(f"Downloaded {len(resp.content):,} bytes to {tmp.name}")
    return tmp.name


def col_letter_to_index(letter):
    """Convert Excel column letter (e.g. 'AT') to 1-based index."""
    result = 0
    for ch in letter.upper():
        result = result * 26 + (ord(ch) - ord("A") + 1)
    return result


def parse_period(cell_value):
    """Parse '2025 Oct' into (year, month_abbr) or None."""
    if not cell_value or not isinstance(cell_value, str):
        return None
    m = re.match(r"(\d{4})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", cell_value.strip())
    if m:
        return int(m.group(1)), m.group(2)
    return None


def safe_float(val):
    """Convert cell value to float, treating None/empty/non-numeric as 0."""
    if val is None:
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def extract_quarterly_data(excel_path):
    """
    Read the Time Series sheet, extract yellow columns, aggregate to calendar quarters.
    Returns list of dicts sorted chronologically.
    """
    wb = openpyxl.load_workbook(excel_path, data_only=True, read_only=True)
    ws = wb["Time Series"]

    col_indices = {col_letter_to_index(letter): key for letter, key in YELLOW_COLUMNS.items()}

    quarterly = defaultdict(lambda: defaultdict(float))
    months_seen = defaultdict(set)

    for row in ws.iter_rows(min_row=7, values_only=False):
        period_cell = row[0]
        parsed = parse_period(period_cell.value)
        if not parsed:
            continue
        year, month_abbr = parsed
        quarter = MONTH_TO_QUARTER[month_abbr]
        q_key = f"{year} Q{quarter}"

        months_seen[q_key].add(month_abbr)

        for col_idx, field_key in col_indices.items():
            cell_val = row[col_idx - 1].value if col_idx - 1 < len(row) else None
            quarterly[q_key][field_key] += safe_float(cell_val)

    wb.close()

    results = []
    for q_key in sorted(quarterly.keys()):
        year_str, q_str = q_key.split(" ")
        quarter_num = int(q_str[1])
        expected_months = MONTHS_IN_QUARTER[quarter_num]
        if not expected_months.issubset(months_seen[q_key]):
            continue
        entry = {"period": q_key}
        for field_key in YELLOW_COLUMNS.values():
            entry[field_key] = round(quarterly[q_key][field_key], 0)
        results.append(entry)

    log(f"Extracted {len(results)} complete quarters from {results[0]['period'] if results else '?'} to {results[-1]['period'] if results else '?'}")
    return results


ANBT_URL = "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anbt/pusf/data"


def fetch_anbt_fiscal_year_totals():
    """
    Fetch official PS total current receipts from the live ONS ANBT time
    series and aggregate to fiscal years.  Returns dict like
    {"2024-25": 1144778, ...} in £ millions.  Returns empty dict on failure.
    """
    try:
        resp = requests.get(
            ANBT_URL,
            headers={"User-Agent": "UK-RAG-Dashboard/1.0"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        log(f"WARNING: Could not fetch ANBT time series: {e}")
        return {}

    fy_totals = defaultdict(float)
    fy_quarter_count = defaultdict(int)
    for q in data.get("quarters", []):
        m = re.match(r"(\d{4})\s*Q(\d)", q.get("date", ""))
        if not m:
            continue
        try:
            val = float(q["value"])
        except (ValueError, TypeError, KeyError):
            continue
        year, quarter = int(m.group(1)), int(m.group(2))
        if quarter >= 2:
            fy = f"{year}-{str(year + 1)[-2:]}"
        else:
            fy = f"{year - 1}-{str(year)[-2:]}"
        fy_totals[fy] += val
        fy_quarter_count[fy] += 1

    # Only keep fiscal years with all 4 quarters
    result = {fy: round(total) for fy, total in fy_totals.items()
              if fy_quarter_count[fy] == 4}
    if result:
        latest = max(result.keys())
        log(f"ANBT fiscal year totals: {len(result)} years, latest {latest} = £{result[latest]:,}m")
    return result


def run_chart_mode(excel_path):
    """Output JSON to stdout for tRPC consumption."""
    data = extract_quarterly_data(excel_path)
    anbt = fetch_anbt_fiscal_year_totals()
    output = {"periods": data, "fiscalYearTotals": anbt}
    print(json.dumps(output))


def run_cron_mode(excel_path):
    """Upsert quarterly data into MongoDB."""
    try:
        import pymongo
    except ImportError:
        log("ERROR: pymongo is required for --cron mode")
        sys.exit(1)

    mongo_uri = os.environ.get("MONGODB_URI") or os.environ.get("DATABASE_URL") or "mongodb://localhost:27017/uk_rag_portal"
    client = pymongo.MongoClient(mongo_uri)
    db_name = mongo_uri.rsplit("/", 1)[-1].split("?")[0] if "/" in mongo_uri else "uk_rag_portal"
    db = client[db_name]
    collection = db["publicSectorReceipts"]

    collection.create_index("period", unique=True)

    data = extract_quarterly_data(excel_path)
    now = datetime.now(timezone.utc)

    upserted = 0
    for entry in data:
        result = collection.update_one(
            {"period": entry["period"]},
            {
                "$set": {**entry, "updatedAt": now},
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )
        if result.upserted_id or result.modified_count:
            upserted += 1

    log(f"Upserted {upserted} quarters into publicSectorReceipts collection")
    client.close()


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("--chart", "--cron"):
        print("Usage: python3 public_sector_receipts_fetcher.py [--chart|--cron]", file=sys.stderr)
        sys.exit(1)

    mode = sys.argv[1]

    excel_path = download_excel()

    try:
        if mode == "--chart":
            run_chart_mode(excel_path)
        elif mode == "--cron":
            run_cron_mode(excel_path)
    finally:
        os.unlink(excel_path)


if __name__ == "__main__":
    main()
