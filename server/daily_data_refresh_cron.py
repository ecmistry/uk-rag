#!/usr/bin/env python3
"""
Daily data refresh cron: runs all 7 category fetcher scripts, validates
their output, normalises dates to canonical YYYY QN, deduplicates against
existing MongoDB history, and inserts/updates metrics + history.

Usage (manual):
    python3 server/daily_data_refresh_cron.py
    python3 server/daily_data_refresh_cron.py --category Economy   # single category

Crontab (daily at 06:00 UTC):
    0 6 * * * cd /home/ec2-user/uk-rag-portal && /usr/bin/python3 server/daily_data_refresh_cron.py >> /home/ec2-user/uk-rag-portal/logs/daily_data_refresh_cron.log 2>&1
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    from pymongo import MongoClient
except ImportError:
    print("[DailyRefresh] pymongo not installed – run: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)
LOG_PREFIX = "[DailyRefresh]"

CATEGORIES: List[Dict[str, Any]] = [
    {
        "name": "Economy",
        "script": "economy_data_fetcher.py",
        "output_mode": "file",
        "output_file": "economy_metrics.json",
        "args": ["--historical"],
    },
    {
        "name": "Employment",
        "script": "employment_data_fetcher.py",
        "output_mode": "stdout",
        "args": ["--historical"],
    },
    {
        "name": "Education",
        "script": "education_data_fetcher.py",
        "output_mode": "stdout",
    },
    {
        "name": "Crime",
        "script": "crime_data_fetcher.py",
        "output_mode": "stdout",
    },
    {
        "name": "Healthcare",
        "script": "healthcare_data_fetcher.py",
        "output_mode": "stdout",
        "args": ["--historical"],
    },
    {
        "name": "Defence",
        "script": "defence_data_fetcher.py",
        "output_mode": "stdout",
    },
]

# Metric keys to skip during ingestion (superseded or removed)
SKIP_METRIC_KEYS: set = set()

REQUIRED_FIELDS = {"metric_name", "metric_key", "value", "time_period", "rag_status"}
VALID_RAG = {"red", "amber", "green"}

# ---------------------------------------------------------------------------
# Validation: acceptable value ranges per metric key
# ---------------------------------------------------------------------------

VALIDATION_RANGES: Dict[str, Tuple[float, float]] = {
    # Economy
    "real_gdp_growth":          (-30.0, 30.0),
    "cpi_inflation":            (-5.0, 30.0),
    "output_per_hour":          (-20.0, 20.0),
    "public_sector_net_debt":   (0.0, 300.0),
    "business_investment":      (-50.0, 50.0),
    # Employment
    "inactivity_rate":          (0.0, 100.0),
    "real_wage_growth":         (-30.0, 30.0),
    "job_vacancy_ratio":        (0.0, 10.0),
    "underemployment":          (0.0, 100.0),
    "sickness_absence":         (0.0, 100.0),
    # Education
    "attainment8":              (0.0, 100.0),
    "neet_rate":                (0.0, 100.0),
    "persistent_absence":       (0.0, 100.0),
    "apprentice_starts":        (0.0, 1_000_000.0),
    "pupil_attendance":         (0.0, 100.0),
    "apprenticeship_intensity": (0.0, 200.0),
    # Crime
    "street_confidence_index":  (0.0, 100.0),
    "crown_court_backlog":      (0.0, 500.0),
    "recall_rate":              (0.0, 100.0),
    "asb_low_level_crime":      (0.0, 10_000.0),
    "serious_crime":            (0.0, 10_000.0),
    # Healthcare
    "a_e_wait_time":            (0.0, 100.0),
    "cancer_wait_time":         (0.0, 365.0),
    "ambulance_response_time":  (0.0, 120.0),
    "elective_backlog":         (0.0, 20_000_000.0),
    "gp_appt_access":           (0.0, 100.0),
    "staff_vacancy_rate":       (0.0, 100.0),
    "old_age_dependency_ratio": (0.0, 1000.0),
    # Defence
    "defence_spending_gdp":     (0.0, 20.0),
    "sea_mass":                 (0.0, 200.0),
    "land_mass":                (0.0, 200.0),
    "air_mass":                 (0.0, 200.0),
    "defence_industry_vitality":(0.0, 200.0),
}
DEFAULT_RANGE = (-1_000_000.0, 100_000_000.0)

# Unit inference (mirrors routers.ts logic)
UNIT_OVERRIDES: Dict[str, str] = {
    "attainment8": "Score",
    "apprentice_starts": "",
    "cancer_wait_time": " days",
    "ambulance_response_time": " minutes",
    "crown_court_backlog": "per 100k",
    "old_age_dependency_ratio": " per 1,000",
}
PERCENTAGE_KEYS = {
    "cpi_inflation", "real_gdp_growth", "output_per_hour",
    "public_sector_net_debt", "business_investment",
    "inactivity_rate", "real_wage_growth", "job_vacancy_ratio",
    "underemployment", "persistent_absence", "pupil_attendance",
    "recall_rate", "neet_rate",
    "a_e_wait_time", "staff_vacancy_rate", "gp_appt_access",
    "sickness_absence", "defence_spending_gdp",
    "defence_industry_vitality",
    "street_confidence_index", "apprenticeship_intensity",
}

# RAG recalculation for Employment metrics — must match dataIngestion.ts RAG_THRESHOLDS
EMPLOYMENT_RAG_OVERRIDES = {
    "inactivity_rate":   {"green_max": 14,   "amber_max": 20},
    "real_wage_growth":  {"green_min": 2.0,  "amber_min": 1.0},
    "job_vacancy_ratio": {"green_min": 3.5,  "amber_min": 2.5},
    "underemployment":   {"green_max": 5.5,  "amber_max": 8.5},
    "sickness_absence":  {"green_max": 3.0,  "amber_max": 4.5},
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"{ts} {LOG_PREFIX} {msg}", flush=True)


def log_warn(msg: str) -> None:
    log(f"⚠ WARNING: {msg}")


def log_error(msg: str) -> None:
    log(f"✗ ERROR: {msg}")

# ---------------------------------------------------------------------------
# Date normalisation (mirrors db.ts normaliseDataDate)
# ---------------------------------------------------------------------------

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4,
    "june": 6, "july": 7, "august": 8, "september": 9,
    "october": 10, "november": 11, "december": 12,
}

def month_to_quarter(m: int) -> int:
    if m <= 3: return 1
    if m <= 6: return 2
    if m <= 9: return 3
    return 4


def normalise_data_date(data_date: str) -> str:
    """Convert any period string to canonical 'YYYY QN' format."""
    s = str(data_date).strip()
    if not s or s.lower() == "placeholder":
        return s

    # Already canonical
    if re.match(r"^\d{4}\s+Q[1-4]$", s):
        return s

    # "QN YYYY"
    m = re.match(r"^Q([1-4])\s+(\d{4})$", s, re.I)
    if m:
        return f"{m.group(2)} Q{m.group(1)}"

    # NHS financial year quarterly: "Q4 2024/25"
    m = re.match(r"^Q([1-4])\s+(\d{4})/(\d{2})$", s, re.I)
    if m:
        fq, start_year = int(m.group(1)), int(m.group(2))
        fy_map = {1: (start_year, 2), 2: (start_year, 3), 3: (start_year, 4), 4: (start_year + 1, 1)}
        yr, cq = fy_map[fq]
        return f"{yr} Q{cq}"

    # Month range: "Oct-Dec 2023"
    m = re.match(r"^(\w+)-(\w+)\s+(\d{4})", s, re.I)
    if m:
        end_month = MONTH_MAP.get(m.group(2).lower())
        if end_month:
            return f"{m.group(3)} Q{month_to_quarter(end_month)}"

    # "Year Ending": "YE Jun 25 P"
    m = re.match(r"^YE\s+(\w+)\s+(\d{2,4})", s, re.I)
    if m:
        month = MONTH_MAP.get(m.group(1).lower())
        year = int(m.group(2))
        if year < 100:
            year += 2000
        if month:
            return f"{year} Q{month_to_quarter(month)}"

    # Monthly: "Nov 2025" / "2025 NOV" / "November 2025"
    for abbr, num in MONTH_MAP.items():
        pat1 = re.compile(rf"^{abbr}\w*\s+(\d{{4}})$", re.I)
        m1 = pat1.match(s)
        if m1:
            return f"{m1.group(1)} Q{month_to_quarter(num)}"

        pat2 = re.compile(rf"^(\d{{4}})\s+{abbr}\w*$", re.I)
        m2 = pat2.match(s)
        if m2:
            return f"{m2.group(1)} Q{month_to_quarter(num)}"

    # Multi-year range: "2021-2023"
    m = re.match(r"^(\d{4})-(\d{4})$", s)
    if m:
        return f"{m.group(2)} Q4"

    # Academic year: "202425"
    m = re.match(r"^(\d{4})(\d{2})$", s)
    if m:
        return f"{int(m.group(1)) + 1} Q3"

    # Pure annual: "2025"
    m = re.match(r"^(\d{4})$", s)
    if m:
        return f"{m.group(1)} Q4"

    return s

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def calculate_employment_rag(metric_key: str, value: float) -> Optional[str]:
    """Recalculate RAG for Employment metrics (mirrors routers.ts logic)."""
    cfg = EMPLOYMENT_RAG_OVERRIDES.get(metric_key)
    if not cfg:
        return None
    if "green_max" in cfg:
        if value <= cfg["green_max"]:
            return "green"
        if value <= cfg["amber_max"]:
            return "amber"
        return "red"
    else:
        if value >= cfg["green_min"]:
            return "green"
        if value >= cfg["amber_min"]:
            return "amber"
        return "red"


def validate_metric(row: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a single metric row. Returns (is_valid, list_of_warnings).
    Rows that fail hard validation (missing fields, non-numeric value) are rejected.
    Rows that fail soft validation (out-of-range) generate warnings but are accepted.
    """
    warnings: List[str] = []
    key = row.get("metric_key", "<unknown>")

    missing = REQUIRED_FIELDS - set(row.keys())
    if missing:
        return False, [f"{key}: missing required fields: {missing}"]

    rag = str(row.get("rag_status", "")).lower()
    if rag not in VALID_RAG:
        return False, [f"{key}: invalid rag_status '{rag}', expected one of {VALID_RAG}"]

    val_raw = row.get("value")
    if val_raw is None or val_raw == "":
        return False, [f"{key}: value is empty/null"]

    try:
        val = float(val_raw)
    except (ValueError, TypeError):
        if str(val_raw).lower() == "placeholder":
            warnings.append(f"{key}: placeholder value, skipping range check")
            return True, warnings
        return False, [f"{key}: value '{val_raw}' is not numeric"]

    lo, hi = VALIDATION_RANGES.get(key, DEFAULT_RANGE)
    if val < lo or val > hi:
        warnings.append(
            f"{key}: value {val} outside expected range [{lo}, {hi}] — accepting but flagging"
        )

    tp = row.get("time_period", "")
    if not tp or tp.lower() == "placeholder":
        warnings.append(f"{key}: time_period is empty or placeholder")

    return True, warnings

# ---------------------------------------------------------------------------
# Fetcher execution
# ---------------------------------------------------------------------------

def run_fetcher(category: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Run a Python fetcher script and return (metrics_list, error_or_none).
    """
    script_path = os.path.join(SCRIPT_DIR, category["script"])
    if not os.path.isfile(script_path):
        return [], f"Script not found: {script_path}"

    cmd = ["python3", script_path] + category.get("args", [])
    log(f"Running {category['name']}: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
            cwd=PROJECT_ROOT,
        )
    except subprocess.TimeoutExpired:
        return [], f"{category['name']}: script timed out after 300s"
    except Exception as e:
        return [], f"{category['name']}: subprocess error: {e}"

    if result.returncode != 0:
        stderr_snippet = (result.stderr or "")[-500:]
        return [], f"{category['name']}: exit code {result.returncode}. stderr: {stderr_snippet}"

    if category.get("output_mode") == "file":
        output_file = os.path.join(SCRIPT_DIR, category["output_file"])
        if not os.path.isfile(output_file):
            return [], f"{category['name']}: expected output file not found: {output_file}"
        try:
            with open(output_file, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return [], f"{category['name']}: JSON parse error in {output_file}: {e}"
    else:
        stdout = result.stdout or ""
        json_match = re.search(r"\[\s*\{[\s\S]*\}\s*]", stdout)
        if not json_match:
            if not stdout.strip():
                return [], f"{category['name']}: no stdout output"
            return [], f"{category['name']}: no JSON array found in stdout"
        try:
            data = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            return [], f"{category['name']}: JSON parse error: {e}"

    if not isinstance(data, list):
        return [], f"{category['name']}: expected JSON array, got {type(data).__name__}"

    return data, None

# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

def get_db():
    uri = MONGO_URI
    client = MongoClient(uri)
    db_match = re.search(r"//[^/]+/([^?]+)", uri)
    db_name = db_match.group(1) if db_match else "uk_rag_portal"
    return client, client[db_name]


def get_existing_periods(db, metric_keys: List[str]) -> set:
    """Return set of 'metricKey|dataDate' strings for existing history entries."""
    if not metric_keys:
        return set()
    coll = db["metricHistory"]
    docs = coll.find(
        {"metricKey": {"$in": metric_keys}},
        {"metricKey": 1, "dataDate": 1},
    )
    return {f"{d['metricKey']}|{d['dataDate']}" for d in docs}


def upsert_metric(db, metric_key: str, name: str, category: str,
                  value: str, unit: str, rag: str, data_date: str,
                  source_url: str) -> None:
    now = datetime.now(timezone.utc)
    db["metrics"].update_one(
        {"metricKey": metric_key},
        {
            "$set": {
                "name": name,
                "category": category,
                "value": value,
                "unit": unit,
                "ragStatus": rag,
                "dataDate": data_date,
                "sourceUrl": source_url,
                "lastUpdated": now,
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )


def insert_history(db, metric_key: str, value: str, rag: str,
                   data_date: str, information: Optional[str] = None) -> None:
    doc = {
        "metricKey": metric_key,
        "value": value,
        "ragStatus": rag,
        "dataDate": data_date,
        "recordedAt": datetime.now(timezone.utc),
    }
    if information is not None:
        doc["information"] = information
    db["metricHistory"].find_one_and_update(
        {"metricKey": metric_key, "dataDate": data_date},
        {"$set": doc},
        upsert=True,
    )

# ---------------------------------------------------------------------------
# Unit inference (mirrors routers.ts)
# ---------------------------------------------------------------------------

def infer_unit(metric_key: str, raw_unit: Optional[str]) -> str:
    if raw_unit:
        return raw_unit
    if metric_key in UNIT_OVERRIDES:
        return UNIT_OVERRIDES[metric_key]
    if metric_key in PERCENTAGE_KEYS:
        return "%"
    return ""

# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run(only_category: Optional[str] = None) -> None:
    log("=" * 70)
    log("Daily data refresh starting")
    log("=" * 70)

    client, db = get_db()

    categories = CATEGORIES
    if only_category:
        categories = [c for c in CATEGORIES if c["name"].lower() == only_category.lower()]
        if not categories:
            log_error(f"Unknown category: {only_category}")
            return

    total_inserted = 0
    total_updated = 0
    total_skipped = 0
    total_rejected = 0
    all_warnings: List[str] = []
    category_errors: List[str] = []

    try:
        for cat in categories:
            log(f"\n{'─' * 50}")
            log(f"Processing: {cat['name']}")
            log(f"{'─' * 50}")

            raw_metrics, fetch_err = run_fetcher(cat)
            if fetch_err:
                log_error(fetch_err)
                category_errors.append(fetch_err)
                continue

            log(f"  Fetched {len(raw_metrics)} metric row(s)")

            # Validate and normalise
            valid_metrics: List[Dict[str, Any]] = []
            for row in raw_metrics:
                key = row.get("metric_key", "<unknown>")

                if key in SKIP_METRIC_KEYS:
                    log(f"  Skipping superseded metric: {key}")
                    total_skipped += 1
                    continue

                is_valid, warnings = validate_metric(row)
                all_warnings.extend(warnings)

                if not is_valid:
                    for w in warnings:
                        log_error(w)
                    total_rejected += 1
                    continue

                for w in warnings:
                    log_warn(w)

                # Normalise date
                raw_period = row.get("time_period", "")
                normalised = normalise_data_date(raw_period)
                if normalised != raw_period:
                    log(f"  Date normalised: '{raw_period}' → '{normalised}' ({key})")
                row["_normalised_period"] = normalised

                # RAG override for Employment metrics
                rag_override = calculate_employment_rag(key, float(row.get("value", 0)))
                if rag_override:
                    row["rag_status"] = rag_override

                valid_metrics.append(row)

            if not valid_metrics:
                log(f"  No valid metrics for {cat['name']}")
                continue

            # Batch-fetch existing periods for deduplication
            metric_keys = list({m["metric_key"] for m in valid_metrics})
            existing = get_existing_periods(db, metric_keys)
            log(f"  Found {len(existing)} existing history entries for these metrics")

            cat_inserted = 0
            cat_updated = 0

            # Track the latest row per metric_key so only the most
            # recent period is written to the dashboard tile.
            latest_per_key: Dict[str, Dict] = {}

            for row in valid_metrics:
                key = row["metric_key"]
                val = str(row["value"])
                rag = row["rag_status"].lower()
                period = row["_normalised_period"]
                name = row.get("metric_name", key)
                source = row.get("source_url", "")
                unit = infer_unit(key, row.get("unit"))
                info = row.get("information")
                metric_category = row.get("category", cat["name"])

                # Insert history if this period doesn't exist yet
                dedup_key = f"{key}|{period}"
                if dedup_key not in existing:
                    insert_history(db, key, val, rag, period, info)
                    existing.add(dedup_key)
                    cat_inserted += 1
                    log(f"  ✓ New history: {name} — {period} = {val} ({rag})")

                # Keep only the latest period for the dashboard tile
                prev = latest_per_key.get(key)
                if prev is None or period >= prev["period"]:
                    latest_per_key[key] = {
                        "key": key, "name": name, "category": metric_category,
                        "val": val, "unit": unit, "rag": rag,
                        "period": period, "source": source,
                    }

            # Upsert only the latest row per metric to the dashboard tile,
            # and always update the history entry for that period so the
            # tile and history stay in sync when data sources revise values.
            for entry in latest_per_key.values():
                upsert_metric(
                    db, entry["key"], entry["name"], entry["category"],
                    entry["val"], entry["unit"], entry["rag"],
                    entry["period"], entry["source"],
                )
                insert_history(
                    db, entry["key"], entry["val"], entry["rag"],
                    entry["period"], entry.get("info"),
                )
                cat_updated += 1

            total_inserted += cat_inserted
            total_updated += cat_updated
            log(f"  {cat['name']}: {cat_updated} tiles updated, {cat_inserted} new history entries")

        # ── Supplementary scripts (manage their own DB connections) ──
        SUPPLEMENTARY_SCRIPTS = [
            {"name": "Sickness Absence", "script": "sickness_absence_cron.py"},
            {"name": "Apprenticeship Intensity", "script": "apprenticeship_intensity_cron.py"},
            {"name": "Crime Per Capita", "script": "crime_per_capita_cron.py"},
            {"name": "Defence Industry Vitality", "script": "defence_industry_vitality_cron.py"},
        ]
        supplement_errors: List[str] = []

        if not only_category:
            log(f"\n{'─' * 50}")
            log("Running supplementary metric scripts")
            log(f"{'─' * 50}")

            for sup in SUPPLEMENTARY_SCRIPTS:
                script_path = os.path.join(SCRIPT_DIR, sup["script"])
                if not os.path.isfile(script_path):
                    msg = f"{sup['name']}: script not found: {script_path}"
                    log_error(msg)
                    supplement_errors.append(msg)
                    continue

                cmd = ["python3", script_path]
                log(f"  Running {sup['name']}: {' '.join(cmd)}")
                try:
                    result = subprocess.run(
                        cmd,
                        capture_output=True, text=True, timeout=300,
                        cwd=os.path.dirname(SCRIPT_DIR) or ".",
                    )
                    if result.returncode == 0:
                        log(f"  ✓ {sup['name']} completed successfully")
                    else:
                        snippet = (result.stderr or result.stdout or "")[-200:]
                        msg = f"{sup['name']}: exit code {result.returncode}. {snippet}"
                        log_error(msg)
                        supplement_errors.append(msg)
                except subprocess.TimeoutExpired:
                    msg = f"{sup['name']}: timed out after 300s"
                    log_error(msg)
                    supplement_errors.append(msg)
                except Exception as e:
                    msg = f"{sup['name']}: {e}"
                    log_error(msg)
                    supplement_errors.append(msg)

            category_errors.extend(supplement_errors)

        # Summary
        log(f"\n{'=' * 70}")
        log("DAILY REFRESH SUMMARY")
        log(f"{'=' * 70}")
        log(f"  Tiles updated:        {total_updated}")
        log(f"  New history entries:   {total_inserted}")
        log(f"  Skipped (superseded):  {total_skipped}")
        log(f"  Rejected (invalid):    {total_rejected}")
        log(f"  Warnings:              {len(all_warnings)}")
        log(f"  Category errors:       {len(category_errors)}")

        if category_errors:
            log("\nFETCHER ERRORS:")
            for e in category_errors:
                log(f"  ✗ {e}")

        if all_warnings:
            log("\nVALIDATION WARNINGS:")
            for w in all_warnings:
                log(f"  ⚠ {w}")

        if category_errors:
            log(f"\n⚠ {len(category_errors)} category fetcher(s) failed — review above")
        else:
            log("\n✓ All categories processed successfully")

    finally:
        client.close()
        log("Database connection closed")


if __name__ == "__main__":
    cat_arg = None
    for i, arg in enumerate(sys.argv):
        if arg == "--category" and i + 1 < len(sys.argv):
            cat_arg = sys.argv[i + 1]
    run(only_category=cat_arg)
