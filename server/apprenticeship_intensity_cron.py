#!/usr/bin/env python3
"""
Daily cron job: check DfE for new apprenticeship starts data.

Fetches the DfE apprenticeship CSV, calculates quarterly starts
(age_summary=Total rows summed per calendar quarter), pairs with
workforce data (working + underemployed) from the population breakdown
API, computes intensity per 1,000, and inserts new quarters into
both the `metrics` and `metricHistory` collections.

Usage (manual):
    python3 server/apprenticeship_intensity_cron.py

Designed to run via crontab, e.g. daily at 07:30 UTC:
    30 7 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/apprenticeship_intensity_cron.py >> /home/ec2-user/uk-rag-portal/logs/apprenticeship_intensity_cron.log 2>&1
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

import pandas as pd
import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[ApprenticeshipCron] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DFE_CSV_URL = (
    "https://explore-education-statistics.service.gov.uk/data-catalogue/"
    "data-set/693cfe5f-bd05-4fc0-af9c-d62ac61d00be/csv"
)
_API_BASE = os.environ.get("API_BASE_URL", "http://localhost:3000")
POPULATION_API_URL = f"{_API_BASE}/api/trpc/metrics.getPopulationBreakdown"
MONGO_URI = os.environ.get("MONGODB_URI") or os.environ.get("DATABASE_URL") or "mongodb://localhost:27017/uk_rag_portal"
SOURCE_URL = "https://explore-education-statistics.service.gov.uk/find-statistics/apprenticeships"

GREEN_MIN = 15.0
AMBER_MIN = 10.0
ENGLAND_FACTOR = 0.84

LOG_PREFIX = "[ApprenticeshipCron]"

MONTH_TO_NUM = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}
MONTH_TO_QUARTER = {
    1: "Q1", 2: "Q1", 3: "Q1", 4: "Q2", 5: "Q2", 6: "Q2",
    7: "Q3", 8: "Q3", 9: "Q3", 10: "Q4", 11: "Q4", 12: "Q4",
}


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def rag_status(value: float) -> str:
    if value >= GREEN_MIN:
        return "green"
    if value >= AMBER_MIN:
        return "amber"
    return "red"


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

def get_quarterly_starts() -> Dict[str, int]:
    """
    Fetch DfE apprenticeship CSV and aggregate into calendar quarters.
    Filters to age_summary=Total rows, sums monthly starts per quarter.
    Returns dict of {'YYYY QN': starts_sum} for complete quarters only.
    """
    log("Fetching DfE apprenticeship data...")
    resp = requests.get(DFE_CSV_URL, timeout=60, headers={"User-Agent": "UK-RAG-Dashboard-Cron/1.0"})
    resp.raise_for_status()
    df = pd.read_csv(io.BytesIO(resp.content))
    national = df[df["geographic_level"] == "National"]

    monthly = national[
        (national["age_summary"] == "Total") &
        (national["std_fwk_flag"] == "Total") &
        (national["apps_level"] == "Total") &
        (national["funding_type"] == "Total") &
        (national["start_month"] != "Total")
    ].copy()
    monthly["starts_num"] = pd.to_numeric(monthly["starts"], errors="coerce").fillna(0).astype(int)

    def get_cal_year(tp, month_name):
        start_yr = tp // 100
        end_yr = 2000 + (tp % 100)
        mn = MONTH_TO_NUM[month_name]
        return start_yr if mn >= 8 else end_yr

    monthly["cal_year"] = monthly.apply(lambda r: get_cal_year(int(r["time_period"]), r["start_month"]), axis=1)
    monthly["month_num"] = monthly["start_month"].map(MONTH_TO_NUM)
    monthly["quarter"] = monthly["month_num"].map(MONTH_TO_QUARTER)
    monthly["quarter_label"] = monthly["cal_year"].astype(str) + " " + monthly["quarter"]

    months_per_q = monthly.groupby("quarter_label")["start_month"].apply(lambda x: x.nunique()).reset_index()
    months_per_q.columns = ["quarter", "month_count"]

    quarterly = monthly.groupby("quarter_label")["starts_num"].sum().reset_index()
    quarterly.columns = ["quarter", "total_starts"]
    quarterly = quarterly.merge(months_per_q, on="quarter")

    result = {}
    for _, r in quarterly.iterrows():
        if r["month_count"] == 3:
            result[r["quarter"]] = int(r["total_starts"])

    log(f"Calculated {len(result)} complete quarters from DfE data")
    return result


def compute_rolling_4q(quarterly_starts: Dict[str, int]) -> Dict[str, int]:
    """
    Given dict of {'YYYY QN': starts}, compute rolling 4-quarter (12-month) sums.
    Returns dict of {'YYYY QN': rolling_sum} for quarters with 4 preceding available.
    """
    sorted_q = sorted(quarterly_starts.items())
    rolling = {}
    for i in range(3, len(sorted_q)):
        q_label = sorted_q[i][0]
        total = sum(sorted_q[j][1] for j in range(i - 3, i + 1))
        rolling[q_label] = total
    return rolling


def get_workforce_by_quarter() -> Dict[str, float]:
    """
    Fetch workforce data (working + underemployed) per quarter from the local API.
    Returns dict of {'YYYY QN': workforce_total}.
    """
    log("Fetching workforce data from population breakdown API...")
    try:
        resp = requests.get(POPULATION_API_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        result_data = data.get("result", {}).get("data", {})
        periods = result_data.get("json", result_data)
        if isinstance(periods, dict):
            periods = periods.get("periods", [])

        wf = {}
        for p in periods:
            if not isinstance(p, dict):
                continue
            period = p.get("period")
            working = p.get("working", 0)
            underemployed = p.get("underemployed", 0)
            if period is not None:
                wf[period] = working + underemployed
        log(f"Got workforce data for {len(wf)} quarters")
        return wf
    except Exception as e:
        log(f"Failed to fetch workforce data: {e}")
        return {}


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db() -> Tuple[Any, Any]:
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def get_existing_quarters(db: Any) -> set[str]:
    coll = db["metricHistory"]
    docs = coll.find({"metricKey": "apprenticeship_intensity"}, {"dataDate": 1})
    return {doc["dataDate"] for doc in docs}


def insert_history(db: Any, quarter: str, intensity: float, rag: str) -> None:
    db["metricHistory"].insert_one({
        "metricKey": "apprenticeship_intensity",
        "value": str(intensity),
        "ragStatus": rag,
        "dataDate": quarter,
        "recordedAt": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc),
    })


def upsert_metric(db: Any, quarter: str, raw_starts: int, intensity: float, rag: str) -> None:
    now = datetime.now(timezone.utc)
    db["metrics"].update_one(
        {"metricKey": "apprenticeship_intensity"},
        {
            "$set": {
                "name": "Apprenticeship Intensity",
                "category": "Education",
                "value": str(raw_starts),
                "unit": "per 1,000",
                "ragStatus": rag,
                "dataDate": quarter,
                "sourceUrl": SOURCE_URL,
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
    log("Starting daily apprenticeship intensity check...")

    quarterly_starts = get_quarterly_starts()
    if not quarterly_starts:
        log("No quarterly data available. Exiting.")
        return

    rolling_starts = compute_rolling_4q(quarterly_starts)
    if not rolling_starts:
        log("Not enough quarters for rolling 12-month sum. Exiting.")
        return
    log(f"Computed {len(rolling_starts)} rolling 12-month sums")

    workforce = get_workforce_by_quarter()
    if not workforce:
        log("No workforce data available. Exiting.")
        return

    client, db = get_db()
    try:
        existing = get_existing_quarters(db)
        log(f"Found {len(existing)} existing quarterly entries in DB")

        new_count = 0
        latest_quarter = None
        latest_intensity = None
        latest_rolling = None

        for quarter in sorted(rolling_starts.keys()):
            if quarter in existing:
                continue

            rolling = rolling_starts[quarter]
            wf = workforce.get(quarter)
            if not wf or wf < 1.0:
                log(f"  Skipping {quarter}: no workforce data available")
                continue

            eng_wf = wf * ENGLAND_FACTOR
            intensity = round((rolling / eng_wf) * 1000, 1)
            rag = rag_status(intensity)

            insert_history(db, quarter, intensity, rag)
            new_count += 1
            log(f"  Inserted: {quarter} = {intensity} per 1,000 [{rag}] (rolling_12m={rolling:,}, eng_wf={int(eng_wf):,})")

            if latest_quarter is None or quarter > latest_quarter:
                latest_quarter = quarter
                latest_intensity = intensity
                latest_rolling = rolling

        if latest_intensity is not None:
            rag = rag_status(latest_intensity)
            upsert_metric(db, latest_quarter, latest_rolling, latest_intensity, rag)
            log(f"Updated tile metric to: {latest_quarter} = {latest_intensity} per 1,000 [{rag}]")

        if new_count == 0:
            log("No new quarters found – data is up to date.")
        else:
            log(f"Done. Loaded {new_count} new quarter(s).")

    finally:
        client.close()


if __name__ == "__main__":
    run()
