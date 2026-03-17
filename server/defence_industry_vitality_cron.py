#!/usr/bin/env python3
"""
Defence Industry Vitality: two pillars from ONS international trade series.
All turnover figures use 4-quarter rolling averages to smooth peaks and troughs.

Pillar 1 (50%): Output Scale — two sub-pillars (50% of Pillar 1 each), from 4Q rolling avg:
  - Sub-Pillar 1.1 Weapons & Ammunition: target £1,000m/quarter (ONS P39H/MQ10)
  - Sub-Pillar 1.2 Military Fighting Vehicles: target £975m/quarter (ONS P3AJ/MQ10)
Pillar 2 (50%): Year-on-Year Momentum — 4Q rolling sum vs same quarter prior year; target 5%.

Data sources (ONS generator CSV):
  - Weapons & ammunition: https://www.ons.gov.uk/generator?format=csv&uri=/businessindustryandtrade/internationaltrade/timeseries/p39h/mq10
  - Military fighting vehicles: https://www.ons.gov.uk/generator?format=csv&uri=/businessindustryandtrade/internationaltrade/timeseries/p3aj/mq10

Usage:
  python3 server/defence_industry_vitality_cron.py
  python3 server/defence_industry_vitality_cron.py --force   # always re-fetch

Crontab (e.g. daily 06:00 UTC):
  0 6 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/defence_industry_vitality_cron.py >> /var/log/defence_industry_vitality_cron.log 2>&1
"""

import csv
import io
import json
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[DefenceIndustryVitality] pymongo required: pip install pymongo", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

URL_WEAPONS = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/businessindustryandtrade/internationaltrade/timeseries/p39h/mq10"
)
URL_VEHICLES = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/businessindustryandtrade/internationaltrade/timeseries/p3aj/mq10"
)

TARGET_WEAPONS_MILLION = 1000.0   # £1,000 million per quarter
TARGET_VEHICLES_MILLION = 975.0   # £975 million per quarter
BENCHMARK_YOY_PCT = 5.0

# RAG vs Gold Standard (Tier 1): Green >90%, Amber 70–90%, Red <70%
RAG_GREEN = 90.0
RAG_AMBER = 70.0

MONGO_URI = os.environ.get("MONGODB_URI") or os.environ.get("DATABASE_URL") or "mongodb://localhost:27017/uk_rag_portal"
CACHE_FILENAME = "defence_industry_vitality_cache.json"
METRIC_KEY = "defence_industry_vitality"
LOG_PREFIX = "[DefenceIndustryVitality]"

# Quarter pattern: "1997 Q1", "2025 Q4"
QUARTER_RE = re.compile(r"^\s*(\d{4})\s+Q([1-4])\s*$")


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def rag_status(score_pct: float) -> str:
    if score_pct >= RAG_GREEN:
        return "green"
    if score_pct >= RAG_AMBER:
        return "amber"
    return "red"


def parse_quarter(s: str) -> Optional[Tuple[int, int]]:
    """Return (year, quarter) 1-4 or None if not a quarterly period."""
    m = QUARTER_RE.match(s.strip().strip('"'))
    if not m:
        return None
    year = int(m.group(1))
    q = int(m.group(2))
    return (year, q)


def fetch_quarterly_series(url: str, session: requests.Session) -> Dict[Tuple[int, int], float]:
    """
    Fetch ONS generator CSV and return dict (year, quarter) -> value (£m).
    Only includes rows where the first column is "YYYY Qn".
    """
    try:
        r = session.get(url, timeout=30)
        r.raise_for_status()
        text = r.text
    except Exception as e:
        log(f"Fetch failed {url[:60]}...: {e}")
        return {}

    out: Dict[Tuple[int, int], float] = {}
    reader = csv.reader(io.StringIO(text))
    for row in reader:
        if len(row) < 2:
            continue
        period = row[0].strip().strip('"')
        key = parse_quarter(period)
        if key is None:
            continue
        try:
            val = float(row[1].strip().strip('"').replace(",", ""))
        except (ValueError, TypeError):
            continue
        out[key] = val
    return out


def merge_quarters(
    weapons: Dict[Tuple[int, int], float],
    vehicles: Dict[Tuple[int, int], float],
) -> List[Tuple[str, float, float]]:
    """
    Return list of (time_period_str, weapons_m, vehicles_m) for quarters present in both series.
    Sorted by (year, quarter).
    """
    common = set(weapons.keys()) & set(vehicles.keys())
    if not common:
        return []
    result = []
    for (y, q) in sorted(common):
        tp = f"{y} Q{q}"
        result.append((tp, weapons[(y, q)], vehicles[(y, q)]))
    return result


def compute_all_quarters(
    merged: List[Tuple[str, float, float]],
) -> List[Dict[str, Any]]:
    """
    For each quarter compute 4-quarter rolling averages for weapons and vehicles,
    then Pillar 1 (sub-pillars 1.1 and 1.2 from rolling avgs), Pillar 2 (YoY of rolling sum), and RAG.
    Only quarters with a full 4Q window (index >= 3) are included.
    """
    if not merged:
        return []
    n = len(merged)
    if n < 4:
        return []

    weapons_vals = [w for _, w, _ in merged]
    vehicles_vals = [v for _, v, _ in merged]

    # 4-quarter rolling averages
    rolling_weapons = []
    rolling_vehicles = []
    for i in range(n):
        if i < 3:
            rolling_weapons.append(None)
            rolling_vehicles.append(None)
        else:
            roll_w = sum(weapons_vals[i - 3 : i + 1]) / 4.0
            roll_v = sum(vehicles_vals[i - 3 : i + 1]) / 4.0
            rolling_weapons.append(roll_w)
            rolling_vehicles.append(roll_v)

    result = []
    for i in range(3, n):
        time_period = merged[i][0]
        weapons_m = rolling_weapons[i]
        vehicles_m = rolling_vehicles[i]
        sum_m = weapons_m + vehicles_m

        sub_1_1 = min(1.0, max(0.0, weapons_m / TARGET_WEAPONS_MILLION))
        sub_1_2 = min(1.0, max(0.0, vehicles_m / TARGET_VEHICLES_MILLION))
        pillar1 = 0.5 * sub_1_1 + 0.5 * sub_1_2

        # Pillar 2: YoY momentum of 4Q rolling sum (vs same quarter previous year)
        yoy_pct = 0.0
        if i >= 7:  # i-4 must have a 4Q rolling avg (i-4 >= 3)
            prev_sum = rolling_weapons[i - 4] + rolling_vehicles[i - 4]
            if prev_sum != 0:
                yoy_pct = ((sum_m / prev_sum) - 1.0) * 100.0
        pillar2 = min(1.0, max(0.0, yoy_pct / BENCHMARK_YOY_PCT))

        rag_score_pct = (0.5 * pillar1 + 0.5 * pillar2) * 100.0
        result.append({
            "time_period": time_period,
            "rag_score_raw": rag_score_pct,
            "weapons_million": round(weapons_m, 1),
            "vehicles_million": round(vehicles_m, 1),
            "sum_million": round(sum_m, 1),
            "yoy_pct": round(yoy_pct, 2),
        })

    # Apply 4-quarter rolling average to the RAG score so chart/table show smoothed series
    # e.g. "Q1 2026" displayed value = average of RAG for Q2 25, Q3 25, Q4 25, Q1 26
    m = len(result)
    for j in range(m):
        if j < 3:
            value_smoothed = result[j]["rag_score_raw"]
            result[j]["window_label"] = result[j]["time_period"]
        else:
            value_smoothed = sum(result[k]["rag_score_raw"] for k in range(j - 3, j + 1)) / 4.0
            result[j]["window_label"] = f"{result[j - 3]['time_period']}–{result[j]['time_period']}"
        result[j]["value"] = round(value_smoothed, 1)
        result[j]["rag_status"] = rag_status(value_smoothed)
    for j in range(m):
        del result[j]["rag_score_raw"]
    return result


def get_db():
    client = MongoClient(MONGO_URI)
    db_match = re.search(r"//[^/]+/([^/?]+)", MONGO_URI)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def upsert_metric_and_history(
    db,
    time_period: str,
    value_pct: float,
    rag: str,
    weapons_m: float,
    vehicles_m: float,
    sum_m: float,
    yoy_pct: float,
) -> None:
    coll_metrics = db["metrics"]
    coll_history = db["metricHistory"]
    now = datetime.now(timezone.utc)

    coll_metrics.update_one(
        {"metricKey": METRIC_KEY},
        {
            "$set": {
                "name": "Defence Industry Vitality",
                "metricKey": METRIC_KEY,
                "category": "Defence",
                "value": str(round(value_pct, 1)),
                "unit": "%",
                "ragStatus": rag,
                "dataDate": time_period,
                "sourceUrl": "",
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )

    info = (
        f"4-quarter rolling average ending in {time_period} (e.g. 2025 Q4 = avg of 2025 Q1–Q4). "
        f"Pillar 1: Weapons & Ammunition £{weapons_m:.1f}m (target £1,000m), Military Fighting Vehicles £{vehicles_m:.1f}m (target £975m). "
        f"Pillar 2: YoY growth of rolling sum {yoy_pct:.1f}% (target 5%). "
        f"Score is the 4Q rolling average of the index, 0–100%."
    )
    coll_history.update_one(
        {"metricKey": METRIC_KEY, "dataDate": time_period},
        {
            "$set": {
                "metricKey": METRIC_KEY,
                "value": str(round(value_pct, 1)),
                "ragStatus": rag,
                "dataDate": time_period,
                "recordedAt": now,
                "information": info,
            }
        },
        upsert=True,
    )


def insert_all_history(db, all_quarters: List[Dict[str, Any]]) -> int:
    coll = db["metricHistory"]
    now = datetime.now(timezone.utc)
    count = 0
    for q in all_quarters:
        tp = q["time_period"]
        wlabel = q.get("window_label", tp)
        info = (
            f"4-quarter rolling average (avg of {wlabel}). "
            f"Pillar 1: Weapons & Ammunition £{q['weapons_million']:.1f}m (target £1,000m), Military Fighting Vehicles £{q['vehicles_million']:.1f}m (target £975m). "
            f"Pillar 2: YoY growth of rolling sum {q['yoy_pct']:.1f}% (target 5%). "
            f"Score shown is the 4Q rolling average of the index, 0–100%."
        )
        coll.update_one(
            {"metricKey": METRIC_KEY, "dataDate": q["time_period"]},
            {
                "$set": {
                    "metricKey": METRIC_KEY,
                    "value": str(q["value"]),
                    "ragStatus": q["rag_status"],
                    "dataDate": q["time_period"],
                    "recordedAt": now,
                    "information": info,
                }
            },
            upsert=True,
        )
        count += 1
    return count


def write_cache(
    latest_period: str,
    value_pct: float,
    rag: str,
    weapons_m: float,
    vehicles_m: float,
    sum_m: float,
    yoy_pct: float,
) -> None:
    cache_path = os.path.join(os.path.dirname(__file__), CACHE_FILENAME)
    payload = {
        "time_period": latest_period,
        "value": value_pct,
        "rag_status": rag,
        "weapons_million": weapons_m,
        "vehicles_million": vehicles_m,
        "sum_million": sum_m,
        "yoy_growth_pct": yoy_pct,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    tmp_path = cache_path + ".tmp"
    with open(tmp_path, "w") as f:
        json.dump(payload, f, indent=2)
    os.rename(tmp_path, cache_path)
    log(f"Wrote cache to {cache_path}")


def run() -> None:
    log("Starting Defence Industry Vitality update (ONS Weapons & Vehicles)...")

    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard-Cron/1.0"})

    weapons = fetch_quarterly_series(URL_WEAPONS, session)
    vehicles = fetch_quarterly_series(URL_VEHICLES, session)

    if not weapons:
        log("No weapons (P39H) quarterly data.")
        return
    if not vehicles:
        log("No vehicles (P3AJ) quarterly data.")
        return

    log(f"Weapons: {len(weapons)} quarters. Vehicles: {len(vehicles)} quarters.")

    merged = merge_quarters(weapons, vehicles)
    if not merged:
        log("No common quarters between weapons and vehicles series.")
        return

    log(f"Merged: {len(merged)} quarters from {merged[0][0]} to {merged[-1][0]}.")

    all_quarters = compute_all_quarters(merged)
    if not all_quarters:
        log("No quarters computed.")
        return

    latest = all_quarters[-1]
    rag = latest["rag_status"]
    log(
        f"Latest {latest['time_period']}: Weapons £{latest['weapons_million']}m, "
        f"Vehicles £{latest['vehicles_million']}m, sum £{latest['sum_million']}m, "
        f"YoY {latest['yoy_pct']}%, RAG {latest['value']}% ({rag})"
    )

    client, db = get_db()
    try:
        history_count = insert_all_history(db, all_quarters)
        log(f"Upserted {history_count} quarters into metricHistory.")

        upsert_metric_and_history(
            db,
            latest["time_period"],
            latest["value"],
            rag,
            latest["weapons_million"],
            latest["vehicles_million"],
            latest["sum_million"],
            latest["yoy_pct"],
        )
        write_cache(
            latest["time_period"],
            latest["value"],
            rag,
            latest["weapons_million"],
            latest["vehicles_million"],
            latest["sum_million"],
            latest["yoy_pct"],
        )
        log("Updated metrics tile and cache.")
    finally:
        client.close()


if __name__ == "__main__":
    run()
