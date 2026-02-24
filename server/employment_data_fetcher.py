#!/usr/bin/env python3
"""
Employment Data Fetcher for UK RAG Dashboard.
Fetches Inactivity Rate (LF2S) from ONS - quarterly data only (no monthly or annual).
"""

import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

import requests

# Inactivity rate RAG: Green < 14%, Amber 14%-20%, Red > 20%
INACTIVITY_GREEN_MAX = 14.0
INACTIVITY_AMBER_MAX = 20.0

INACTIVITY_RATE_URL = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/employmentandlabourmarket/peoplenotinwork/economicinactivity/timeseries/lf2s/lms"
)

# Real Wage Growth: AWE level (KAB9) -> YoY % minus CPI inflation (same quarter)
REAL_WAGE_GROWTH_URL = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/kab9/emp"
)
CPI_INFLATION_URL = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/economy/inflationandpriceindices/timeseries/d7g7/mm23"
)

# Job Vacancy Ratio: AP2Z/UNEM monthly -> quarterly average (Q1 = avg Jan,Feb,Mar etc.)
JOB_VACANCY_RATIO_URL = (
    "https://www.ons.gov.uk/generator?format=csv&uri="
    "/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/ap2z/unem"
)
# Underemployment: EMP16 dataset – no stable CSV URL; latest XLS discovered at runtime via ons_emp16
UNDEREMPLOYMENT_DATASET_PAGE = (
    "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/"
    "employmentandemployeetypes/datasets/underemploymentandoveremploymentemp16"
)
MONTH_TO_QUARTER = {"JAN": 1, "FEB": 1, "MAR": 1, "APR": 2, "MAY": 2, "JUN": 2,
                    "JUL": 3, "AUG": 3, "SEP": 3, "OCT": 4, "NOV": 4, "DEC": 4}


def parse_quarter(date_str: str) -> Optional[tuple]:
    """Parse '2025 Q2' or '1971 Q1' -> (year, quarter). Returns None if not quarterly."""
    s = (date_str or "").strip()
    if "Q" not in s:
        return None
    parts = s.split()
    year, qpart = None, None
    for p in parts:
        if p.isdigit() and len(p) == 4:
            year = int(p)
        elif p.upper().startswith("Q") and len(p) >= 2 and p[1:2].isdigit():
            qpart = int(p[1])
            if 1 <= qpart <= 4:
                break
    if year is not None and qpart is not None:
        return (year, qpart)
    return None


def quarterly_rows_only(rows: List[Dict]) -> List[Dict]:
    """Keep only rows whose date is quarterly (e.g. '2025 Q2'). Drop annual and monthly."""
    return [r for r in rows if parse_quarter(r.get("date", "")) is not None]


def rag_status_inactivity(value: float) -> str:
    if value < INACTIVITY_GREEN_MAX:
        return "green"
    if value <= INACTIVITY_AMBER_MAX:
        return "amber"
    return "red"


# Real wage growth RAG: Green > 2%, Amber 1%–2%, Red < 1%
def rag_status_real_wage_growth(value: float) -> str:
    if value > 2.0:
        return "green"
    if value >= 1.0:
        return "amber"
    return "red"


# Job vacancy ratio RAG: Green > 3.5%, Amber 2.5%–3.5%, Red < 2.5%
def rag_status_job_vacancy_ratio(value: float) -> str:
    if value > 3.5:
        return "green"
    if value >= 2.5:
        return "amber"
    return "red"


# Underemployment RAG: Green < 5.5%, Amber 5.5%–8.5%, Red > 8.5%
def rag_status_underemployment(value: float) -> str:
    if value < 5.5:
        return "green"
    if value <= 8.5:
        return "amber"
    return "red"


def fetch_inactivity_rate_quarterly(historical: bool) -> List[Dict]:
    """Fetch LF2S CSV, keep only quarterly rows, return list of metric objects."""
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})
    try:
        resp = session.get(INACTIVITY_RATE_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(json.dumps([{"error": str(e)}]), file=sys.stderr)
        return []

    lines = resp.text.strip().split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('"') and '","' in line:
            parts = line.strip('"').split('","')
            if len(parts) == 2:
                first = parts[0].strip()
                if (first.isdigit() and len(first) == 4) or " Q" in first:
                    data_start = i
                    break
    if data_start == 0:
        return []

    data_rows = []
    for line in lines[data_start:]:
        if not line.strip():
            continue
        parts = line.strip('"').split('","')
        if len(parts) != 2:
            continue
        date_str = parts[0].strip()
        value_str = parts[1].strip()
        if not value_str:
            continue
        try:
            value = float(value_str)
        except ValueError:
            continue
        data_rows.append({"date": date_str, "value": value})

    quarterly = quarterly_rows_only(data_rows)
    if not quarterly:
        return []

    def sort_key(r):
        pq = parse_quarter(r["date"])
        return (pq[0], pq[1]) if pq else (0, 0)

    quarterly.sort(key=sort_key)
    now = datetime.utcnow().isoformat()

    out = [
        {
            "metric_name": "Inactivity Rate",
            "metric_key": "inactivity_rate",
            "category": "Employment",
            "value": round(row["value"], 1),
            "time_period": row["date"],
            "unit": "%",
            "rag_status": rag_status_inactivity(row["value"]),
            "data_source": "ONS",
            "source_url": INACTIVITY_RATE_URL,
            "last_updated": now,
        }
        for row in quarterly
    ]
    return out


def _fetch_cpi_by_quarter(session: requests.Session) -> Dict[tuple, float]:
    """Fetch CPI inflation CSV and return (year, quarter) -> CPI % (use last month of each quarter)."""
    try:
        resp = session.get(CPI_INFLATION_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(json.dumps([{"error": str(e)}]), file=sys.stderr)
        return {}
    lines = resp.text.strip().split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('"') and '","' in line:
            parts = line.strip('"').split('","')
            if len(parts) == 2:
                first = parts[0].strip().upper()
                if first.isdigit() or any(m in first for m in ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]):
                    data_start = i
                    break
    if data_start == 0:
        return {}
    # Last month of each quarter: MAR=Q1, JUN=Q2, SEP=Q3, DEC=Q4
    end_month = {"MAR": 1, "JUN": 2, "SEP": 3, "DEC": 4}
    by_yq = {}
    for line in lines[data_start:]:
        if not line.strip():
            continue
        parts = line.strip('"').split('","')
        if len(parts) != 2:
            continue
        date_str = parts[0].strip().upper()
        value_str = parts[1].strip()
        if not value_str:
            continue
        try:
            value = float(value_str)
        except ValueError:
            continue
        parts_d = date_str.split()
        year = None
        for p in parts_d:
            if p.isdigit() and len(p) == 4:
                year = int(p)
                break
        for mon, q in end_month.items():
            if mon in parts_d and year is not None:
                by_yq[(year, q)] = value
                break
    return by_yq


def _fetch_csv_quarterly_levels(url: str, session: requests.Session) -> List[Dict]:
    """Fetch ONS CSV and return quarterly rows with valid numeric values (date, value)."""
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(json.dumps([{"error": str(e)}]), file=sys.stderr)
        return []
    lines = resp.text.strip().split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('"') and '","' in line:
            parts = line.strip('"').split('","')
            if len(parts) == 2:
                first = parts[0].strip()
                if (first.isdigit() and len(first) == 4) or " Q" in first:
                    data_start = i
                    break
    if data_start == 0:
        return []
    data_rows = []
    for line in lines[data_start:]:
        if not line.strip():
            continue
        parts = line.strip('"').split('","')
        if len(parts) != 2:
            continue
        date_str = parts[0].strip()
        value_str = parts[1].strip()
        if not value_str:
            continue
        try:
            value = float(value_str)
        except ValueError:
            continue
        data_rows.append({"date": date_str, "value": value})
    return quarterly_rows_only(data_rows)


def _levels_to_yoy_growth(rows: List[Dict]) -> List[Dict]:
    """Convert level rows to year-on-year % growth (same quarter previous year)."""
    if not rows:
        return []
    def sort_key(r):
        pq = parse_quarter(r["date"])
        return (pq[0], pq[1]) if pq else (0, 0)
    rows = sorted(rows, key=sort_key)
    by_yq = {}
    for r in rows:
        pq = parse_quarter(r["date"])
        if pq:
            by_yq[pq] = r["value"]
    out = []
    for r in rows:
        pq = parse_quarter(r["date"])
        if not pq:
            continue
        y, q = pq
        prev_yq = (y - 1, q)
        if prev_yq not in by_yq:
            continue
        prev_val = by_yq[prev_yq]
        if prev_val is None or prev_val == 0:
            continue
        growth_pct = ((r["value"] - prev_val) / prev_val) * 100.0
        out.append({"date": r["date"], "value": round(growth_pct, 2)})
    return out


def fetch_real_wage_growth_quarterly(historical: bool) -> List[Dict]:
    """Real Wage Growth = nominal wage YoY % (KAB9) minus CPI inflation (same quarter)."""
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})
    quarterly = _fetch_csv_quarterly_levels(REAL_WAGE_GROWTH_URL, session)
    if not quarterly:
        return []
    nominal_yoy = _levels_to_yoy_growth(quarterly)
    if not nominal_yoy:
        return []
    cpi_by_yq = _fetch_cpi_by_quarter(session)
    if not cpi_by_yq:
        return []
    now = datetime.utcnow().isoformat()
    out = []
    for row in nominal_yoy:
        pq = parse_quarter(row["date"])
        if not pq:
            continue
        y, q = pq
        cpi = cpi_by_yq.get((y, q))
        if cpi is None:
            continue
        real = round(row["value"] - cpi, 2)
        out.append({
            "metric_name": "Real Wage Growth",
            "metric_key": "real_wage_growth",
            "category": "Employment",
            "value": real,
            "time_period": row["date"],
            "unit": "%",
            "rag_status": rag_status_real_wage_growth(real),
            "data_source": "ONS",
            "source_url": REAL_WAGE_GROWTH_URL,
            "last_updated": now,
        })
    return out


def _parse_monthly_date(date_str: str) -> Optional[tuple]:
    """Parse '2025 JAN' or '2024 DEC' -> (year, quarter). Returns None if not monthly."""
    s = (date_str or "").strip().upper()
    parts = s.split()
    year = None
    month = None
    for p in parts:
        if p.isdigit() and len(p) == 4:
            year = int(p)
        elif p in MONTH_TO_QUARTER:
            month = p
            break
    if year is not None and month is not None:
        return (year, MONTH_TO_QUARTER[month])
    return None


def fetch_job_vacancy_ratio_quarterly(historical: bool) -> List[Dict]:
    """Fetch AP2Z (job vacancies per 100 emp jobs) CSV, aggregate monthly to quarterly average (calendar Q1–Q4)."""
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})
    try:
        resp = session.get(JOB_VACANCY_RATIO_URL, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(json.dumps([{"error": str(e)}]), file=sys.stderr)
        return []

    lines = resp.text.strip().split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('"') and '","' in line:
            parts = line.strip('"').split('","')
            if len(parts) == 2:
                first = parts[0].strip().upper()
                if first.isdigit() or any(m in first for m in MONTH_TO_QUARTER):
                    data_start = i
                    break
    if data_start == 0:
        return []

    # Collect monthly rows and group by (year, quarter)
    by_yq: Dict[tuple, List[float]] = {}
    for line in lines[data_start:]:
        if not line.strip():
            continue
        parts = line.strip('"').split('","')
        if len(parts) != 2:
            continue
        date_str = parts[0].strip()
        value_str = parts[1].strip()
        if not value_str:
            continue
        try:
            value = float(value_str)
        except ValueError:
            continue
        yq = _parse_monthly_date(date_str)
        if yq is None:
            continue
        if yq not in by_yq:
            by_yq[yq] = []
        by_yq[yq].append(value)

    # Quarterly average and sort
    quarterly = []
    for (y, q), vals in by_yq.items():
        if vals:
            avg_val = sum(vals) / len(vals)
            quarterly.append({"year": y, "quarter": q, "value": round(avg_val, 2), "date": f"{y} Q{q}"})
    quarterly.sort(key=lambda r: (r["year"], r["quarter"]))
    if not quarterly:
        return []

    now = datetime.utcnow().isoformat()
    out = [
        {
            "metric_name": "Job Vacancy Ratio",
            "metric_key": "job_vacancy_ratio",
            "category": "Employment",
            "value": row["value"],
            "time_period": row["date"],
            "unit": "%",
            "rag_status": rag_status_job_vacancy_ratio(row["value"]),
            "data_source": "ONS",
            "source_url": JOB_VACANCY_RATIO_URL,
            "last_updated": now,
        }
        for row in quarterly
    ]
    return out


def fetch_underemployment_quarterly(historical: bool) -> List[Dict]:
    """Fetch underemployment rate (%) from ONS EMP16. Latest XLS URL discovered at runtime (no fixed CSV URL)."""
    try:
        from ons_emp16 import fetch_emp16_underemployment_rate_by_quarter
    except ImportError:
        return []
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})
    rows = fetch_emp16_underemployment_rate_by_quarter(session)
    if not rows:
        return []
    if not historical:
        rows = rows[-1:]  # latest quarter only
    now = datetime.utcnow().isoformat()
    return [
        {
            "metric_name": "Underemployment",
            "metric_key": "underemployment",
            "category": "Employment",
            "value": row["value"],
            "time_period": row["date"],
            "unit": "%",
            "rag_status": rag_status_underemployment(row["value"]),
            "data_source": "ONS",
            "source_url": UNDEREMPLOYMENT_DATASET_PAGE,
            "last_updated": now,
        }
        for row in rows
    ]


def main():
    historical = "--historical" in sys.argv or "-h" in sys.argv
    results = (
        fetch_inactivity_rate_quarterly(historical=historical)
        + fetch_real_wage_growth_quarterly(historical=historical)
        + fetch_job_vacancy_ratio_quarterly(historical=historical)
        + fetch_underemployment_quarterly(historical=historical)
    )
    print(json.dumps(results))


if __name__ == "__main__":
    main()
