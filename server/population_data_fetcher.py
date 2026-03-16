#!/usr/bin/env python3
"""
Population Data Fetcher for UK RAG Dashboard
Data Source & Location: see docs/DATA_SOURCES_UK_RAG.md (canonical).
Natural Change: ONS Vital Statistics / Series VVHM | Old-Age Dependency: ONS API Population Projections
Net Migration: ONS API Series BBGM | Healthy Life Expectancy: ONS Health State Life Expectancy | Total Population: ONS Total Population
"""

import json
import sys
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from io import BytesIO

# ONS: Total Population (UK mid-year population estimate – UKPOP series)
UKPOP_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/peoplepopulationandcommunity/populationandmigration/populationestimates/timeseries/ukpop/pop"
TOTAL_POPULATION_SOURCE_URL = "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates"

# ONS Labour Market (for population breakdown stacked bar) – 5 datasets: UKPOP (above), MGRZ, LF2M, MGSX, LF24
WORKING_POPULATION_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/mgrz/lms"
ECONOMICALLY_INACTIVE_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peoplenotinwork/economicinactivity/timeseries/lf2m/lms"
UNEMPLOYED_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms"
EMPLOYMENT_RATE_16_64_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/lf24/lms"

# ONS Vital Statistics: births, deaths, natural change (Series VVHM source – Excel only, no CSV generator)
VITAL_STATISTICS_EXCEL_URL = (
    "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/"
    "populationestimates/datasets/vitalstatisticspopulationandhealthreferencetables/current/"
    "annualreferencetables2021.xlsx"
)
VITAL_STATISTICS_SOURCE_URL = (
    "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/"
    "datasets/vitalstatisticspopulationandhealthreferencetables"
)

# ONS Population Projections: Old-age dependency ratio (OADR) – UK estimates and projections (Excel)
OADR_EXCEL_URL = (
    "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/"
    "populationprojections/datasets/comparisonofoldagedependencyratioestimatesandprojectionsukandconstituentcountries/"
    "current/oldagedependencyratiosprojectionsandestimatesuk.xlsx"
)
OADR_SOURCE_URL = (
    "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/"
    "datasets/comparisonofoldagedependencyratioestimatesandprojectionsukandconstituentcountries"
)

# ONS Series BBGM: Long-term net migration – from Long-term international migration flows dataset (Excel)
BBGM_EXCEL_URL = (
    "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/"
    "internationalmigration/datasets/longterminternationalimmigrationemigrationandnetmigrationflowsprovisional/"
    "yearendingjune2025/ltimnov25.xlsx"
)
BBGM_SOURCE_URL = (
    "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/"
    "datasets/longterminternationalimmigrationemigrationandnetmigrationflowsprovisional"
)

# ONS Health State Life Expectancy: England and Wales (UK coverage when Scotland/NI added) – Excel
HEALTH_STATE_LE_EXCEL_URL = (
    "https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/"
    "datasets/healthstatelifeexpectancyallagesuk/current/healthylifeexpectancyenglandandwales.xlsx"
)
HEALTH_STATE_LE_SOURCE_URL = (
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/"
    "datasets/healthstatelifeexpectancyallagesuk"
)

POPULATION_PLACEHOLDERS: List[Dict[str, Any]] = []

# ONS EMP16: Underemployment – latest file URL is discovered at runtime via ons_emp16.get_latest_emp16_xls_url()
# so we do not rely on a fixed filename (e.g. emp16feb2026.xls) that changes each quarter.


def _parse_ons_csv(response_text: str) -> List[Dict[str, Any]]:
    """Parse ONS generator CSV; return list of {date, value}."""
    lines = response_text.strip().split("\n")
    data_start = 0
    for i, line in enumerate(lines):
        if line.startswith('"') and len(line.split('","')) == 2:
            first = line.split('","')[0].strip('"').strip()
            if first.isdigit() or " Q" in first or "-" in first:
                data_start = i
                break
    if data_start == 0:
        return []
    out = []
    for line in lines[data_start:]:
        if not line.strip():
            continue
        parts = line.strip('"').split('","')
        if len(parts) == 2:
            try:
                out.append({"date": parts[0].strip(), "value": float(parts[1])})
            except ValueError:
                continue
    return out


def _fetch_natural_change(session: requests.Session) -> Optional[Dict[str, Any]]:
    """
    Fetch UK natural change (births minus deaths) from ONS Vital Statistics Excel.
    Series VVHM source: Vital statistics in the UK: births, deaths and marriages (Excel only).
    Structure: Sheet '2' = Births (row 6+ = Year col0, UK births col1); Sheet '3' = Deaths (same layout).
    """
    try:
        import pandas as pd
    except ImportError:
        return None
    try:
        r = session.get(VITAL_STATISTICS_EXCEL_URL, timeout=60)
        r.raise_for_status()
        excel_file = pd.ExcelFile(BytesIO(r.content))
        # Sheet "2" = Births, Sheet "3" = Deaths; row 5 = header, row 6 = latest year (2021), col 0 = Year, col 1 = UK
        births_val: Optional[float] = None
        deaths_val: Optional[float] = None
        time_period: Optional[str] = None
        if "2" in excel_file.sheet_names and "3" in excel_file.sheet_names:
            df_b = pd.read_excel(excel_file, sheet_name="2", header=None)
            df_d = pd.read_excel(excel_file, sheet_name="3", header=None)
            # First data row (row 6) has latest year in col 0, UK total in col 1
            for row_idx in range(5, min(15, len(df_b))):
                try:
                    year_cell = df_b.iloc[row_idx, 0]
                    year_val = int(float(year_cell)) if pd.notna(year_cell) and str(year_cell).replace(".0", "").isdigit() else None
                    if year_val and 1990 <= year_val <= 2030:
                        b = float(str(df_b.iloc[row_idx, 1]).replace(",", ""))
                        if 400000 <= b <= 900000:  # plausible UK births
                            births_val = b
                            time_period = str(year_val)
                            break
                except (ValueError, TypeError, IndexError):
                    continue
            for row_idx in range(5, min(15, len(df_d))):
                try:
                    year_cell = df_d.iloc[row_idx, 0]
                    year_val = int(float(year_cell)) if pd.notna(year_cell) and str(year_cell).replace(".0", "").isdigit() else None
                    if year_val and 1990 <= year_val <= 2030:
                        d = float(str(df_d.iloc[row_idx, 1]).replace(",", ""))
                        if 400000 <= d <= 900000:  # plausible UK deaths
                            deaths_val = d
                            if not time_period:
                                time_period = str(year_val)
                            break
                except (ValueError, TypeError, IndexError):
                    continue
        if births_val is None or deaths_val is None:
            return None
        natural_change_raw = births_val - deaths_val
        value_thousands = round(natural_change_raw / 1000, 1)
        return {
            "metric_name": "Natural Change (Births vs Deaths)",
            "metric_key": "natural_change",
            "category": "Population",
            "value": value_thousands,
            "time_period": time_period or "Latest",
            "unit": "k",  # thousands (e.g. 27.2k = 27,200)
            "rag_status": "green" if value_thousands > 0 else "red" if value_thousands < 0 else "amber",
            "data_source": "ONS Vital Statistics (VVHM)",
            "source_url": VITAL_STATISTICS_SOURCE_URL,
            "last_updated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[Population] Error fetching natural change: {e}", file=sys.stderr)
        return None


def _fetch_healthy_life_expectancy(session: requests.Session) -> Optional[Dict[str, Any]]:
    """
    Fetch healthy life expectancy at birth from ONS Health State Life Expectancy (England and Wales).
    Sheet '3': Country, Area code, Sex, Age group, '2021 to 2023\\nHealthy life expectancy'; at birth = <1.
    Uses average of Male and Female at birth for England, latest period (2021-2023).
    """
    try:
        import pandas as pd
    except ImportError:
        return None
    try:
        r = session.get(HEALTH_STATE_LE_EXCEL_URL, timeout=90)
        r.raise_for_status()
        excel_file = pd.ExcelFile(BytesIO(r.content))
        if "3" not in excel_file.sheet_names:
            return None
        df = pd.read_excel(excel_file, sheet_name="3", header=None)
        # Row 5 = header; col 0 = Country, col 3 = Sex, col 5 = Age group, col 7 = 2021 to 2023 HLE
        hle_values: List[float] = []
        for row_idx in range(6, len(df)):
            country = str(df.iloc[row_idx, 0]).strip()
            age_grp = str(df.iloc[row_idx, 5]).strip() if df.shape[1] > 5 else ""
            if "England" not in country or age_grp != "<1":
                continue
            try:
                val = float(df.iloc[row_idx, 7])
                if 50 <= val <= 70:
                    hle_values.append(val)
            except (ValueError, TypeError, IndexError):
                continue
        if not hle_values:
            return None
        hle_years = round(sum(hle_values) / len(hle_values), 1)
        rag = "green" if hle_years >= 63 else "amber" if hle_years >= 60 else "red"
        return {
            "metric_name": "Healthy Life Expectancy",
            "metric_key": "healthy_life_expectancy",
            "category": "Population",
            "value": hle_years,
            "time_period": "2021-2023",
            "unit": " years",
            "rag_status": rag,
            "data_source": "ONS Health State Life Expectancy",
            "source_url": HEALTH_STATE_LE_SOURCE_URL,
            "last_updated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[Population] Error fetching healthy life expectancy: {e}", file=sys.stderr)
        return None


def _fetch_net_migration(session: requests.Session) -> Optional[Dict[str, Any]]:
    """
    Fetch UK long-term net migration from ONS Series BBGM source (Long-term international migration flows).
    Sheet '1': col 0 = Flow, col 1 = Period, col 2 = All Nationalities; Net migration rows give latest in thousands (000s).
    """
    try:
        import pandas as pd
    except ImportError:
        return None
    try:
        r = session.get(BBGM_EXCEL_URL, timeout=60)
        r.raise_for_status()
        excel_file = pd.ExcelFile(BytesIO(r.content))
        if "1" not in excel_file.sheet_names:
            return None
        df = pd.read_excel(excel_file, sheet_name="1", header=None)
        time_period: Optional[str] = None
        net_val: Optional[float] = None
        for row_idx in range(5, len(df)):
            flow = str(df.iloc[row_idx, 0]).strip().lower()
            if "net migration" not in flow:
                continue
            try:
                period_cell = df.iloc[row_idx, 1]
                val_cell = df.iloc[row_idx, 2]
                if pd.isna(val_cell):
                    continue
                val = float(str(val_cell).replace(",", ""))
                if -500000 <= val <= 800000:
                    net_val = val
                    time_period = str(period_cell).strip() if pd.notna(period_cell) else None
            except (ValueError, TypeError, IndexError):
                continue
        if net_val is None:
            return None
        value_thousands = round(net_val / 1000, 1)
        rag = "green" if 0 <= value_thousands <= 300 else "amber" if value_thousands <= 500 else "red"
        return {
            "metric_name": "Net Migration (Long-term)",
            "metric_key": "net_migration",
            "category": "Population",
            "value": value_thousands,
            "time_period": time_period or "Latest",
            "unit": "000s",
            "rag_status": rag,
            "data_source": "ONS Series BBGM",
            "source_url": BBGM_SOURCE_URL,
            "last_updated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[Population] Error fetching net migration: {e}", file=sys.stderr)
        return None


def _fetch_old_age_dependency_ratio(session: requests.Session) -> Optional[Dict[str, Any]]:
    """
    Fetch UK old-age dependency ratio from ONS Population Projections (OADR dataset).
    Sheet 'UK': row 3 = header (Year, OADR estimate), row 4+ = data; OADR = per 1,000 working-age.
    """
    try:
        import pandas as pd
    except ImportError:
        return None
    try:
        r = session.get(OADR_EXCEL_URL, timeout=60)
        r.raise_for_status()
        excel_file = pd.ExcelFile(BytesIO(r.content))
        if "UK" not in excel_file.sheet_names:
            return None
        df = pd.read_excel(excel_file, sheet_name="UK", header=None)
        # Row 3 = header (Year, OADR estimate), row 4+ = data
        time_period: Optional[str] = None
        oadr_val: Optional[float] = None
        for row_idx in range(4, len(df)):
            try:
                year_cell = df.iloc[row_idx, 0]
                est_cell = df.iloc[row_idx, 1]
                if pd.isna(est_cell):
                    continue
                year_val = int(float(year_cell)) if pd.notna(year_cell) and str(year_cell).replace(".0", "").isdigit() else None
                val = float(str(est_cell).replace(",", ""))
                if year_val and 1970 <= year_val <= 2030 and 200 <= val <= 500:
                    time_period = str(year_val)
                    oadr_val = val
            except (ValueError, TypeError, IndexError):
                continue
        if oadr_val is None:
            return None
        # RAG: lower is better (less pressure on pensions/NHS); illustrative thresholds per 1,000
        if oadr_val < 300:
            rag = "green"
        elif oadr_val < 350:
            rag = "amber"
        else:
            rag = "red"
        return {
            "metric_name": "Old-Age Dependency Ratio",
            "metric_key": "old_age_dependency_ratio",
            "category": "Population",
            "value": round(oadr_val, 1),
            "time_period": time_period or "Latest",
            "unit": " per 1,000",
            "rag_status": rag,
            "data_source": "ONS Population Projections",
            "source_url": OADR_SOURCE_URL,
            "last_updated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[Population] Error fetching old-age dependency ratio: {e}", file=sys.stderr)
        return None


def _fetch_total_population(session: requests.Session) -> Optional[Dict[str, Any]]:
    """Fetch UK mid-year population from ONS: Total Population (UKPOP series)."""
    try:
        r = session.get(UKPOP_URL, timeout=30)
        r.raise_for_status()
        rows = _parse_ons_csv(r.text)
        if not rows:
            return None
        latest = rows[-1]
        val = int(latest["value"])  # ONS UKPOP is raw count (e.g. 69.3m for 2024)
        return {
            "metric_name": "Total Population",
            "metric_key": "total_population",
            "category": "Population",
            "value": int(val),
            "time_period": latest["date"],
            "unit": "",
            "rag_status": "amber",
            "data_source": "ONS: Total Population",
            "source_url": TOTAL_POPULATION_SOURCE_URL,
            "last_updated": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        print(f"[Population] Error fetching total population: {e}", file=sys.stderr)
        return None


def fetch_population_metrics() -> List[Dict[str, Any]]:
    """Return 5 Population metrics: Total Population from ONS, others placeholder."""
    now = datetime.utcnow()
    period = str(now.year)
    results = []
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})

    # Total Population (ONS: Total Population – UKPOP series)
    total_pop = _fetch_total_population(session)
    if total_pop:
        results.append(total_pop)
    else:
        results.append({
            "metric_name": "Total Population",
            "metric_key": "total_population",
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": "",
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": TOTAL_POPULATION_SOURCE_URL,
            "last_updated": now.isoformat(),
        })

    # Natural Change (ONS Vital Statistics / Series VVHM – Excel)
    natural_change = _fetch_natural_change(session)
    if natural_change:
        results.append(natural_change)
    else:
        results.append({
            "metric_name": "Natural Change (Births vs Deaths)",
            "metric_key": "natural_change",
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": "k",
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": VITAL_STATISTICS_SOURCE_URL,
            "last_updated": now.isoformat(),
        })

    # Old-Age Dependency Ratio (ONS Population Projections)
    oadr = _fetch_old_age_dependency_ratio(session)
    if oadr:
        results.append(oadr)
    else:
        results.append({
            "metric_name": "Old-Age Dependency Ratio",
            "metric_key": "old_age_dependency_ratio",
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": " per 1,000",
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": OADR_SOURCE_URL,
            "last_updated": now.isoformat(),
        })

    # Net Migration Long-term (ONS Series BBGM)
    net_mig = _fetch_net_migration(session)
    if net_mig:
        results.append(net_mig)
    else:
        results.append({
            "metric_name": "Net Migration (Long-term)",
            "metric_key": "net_migration",
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": "000s",
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": BBGM_SOURCE_URL,
            "last_updated": now.isoformat(),
        })

    # Healthy Life Expectancy (ONS Health State Life Expectancy)
    hle = _fetch_healthy_life_expectancy(session)
    if hle:
        results.append(hle)
    else:
        results.append({
            "metric_name": "Healthy Life Expectancy",
            "metric_key": "healthy_life_expectancy",
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": " years",
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": HEALTH_STATE_LE_SOURCE_URL,
            "last_updated": now.isoformat(),
        })

    # Placeholders until ONS series/datasets are wired
    for m in POPULATION_PLACEHOLDERS:
        results.append({
            "metric_name": m["name"],
            "metric_key": m["metric_key"],
            "category": "Population",
            "value": "placeholder",
            "time_period": period,
            "unit": m.get("unit", "%"),
            "rag_status": "amber",
            "data_source": "Placeholder",
            "source_url": "",
            "last_updated": now.isoformat(),
        })
    return results


def _fetch_series_csv(session: requests.Session, url: str) -> List[Dict[str, Any]]:
    """Fetch ONS generator CSV and return list of {date, value}."""
    try:
        r = session.get(url, timeout=30)
        r.raise_for_status()
        return _parse_ons_csv(r.text)
    except Exception as e:
        print(f"[Population] Error fetching CSV from {url}: {e}", file=sys.stderr)
        return []


def _month_to_quarter(date_str: str) -> Optional[tuple]:
    """Parse ONS date like '2024 SEP' or '2024 MAR' and return (year, quarter) or None. Only quarter-end months."""
    parts = date_str.strip().upper().split()
    if len(parts) != 2:
        return None
    try:
        year = int(parts[0])
    except ValueError:
        return None
    mon = parts[1][:3] if len(parts[1]) >= 3 else parts[1]
    if mon == "MAR":
        return (year, 1)
    if mon == "JUN":
        return (year, 2)
    if mon == "SEP":
        return (year, 3)
    if mon == "DEC":
        return (year, 4)
    return None


def _fetch_underemployed_by_quarter(session: requests.Session) -> Dict[tuple, float]:
    """
    Fetch underemployed totals by quarter from EMP16 'Levels' sheet.
    Uses ons_emp16 to discover the latest XLS URL (no fixed filename).
    Returns mapping {(year, quarter): underemployed_raw_count}.
    """
    from ons_emp16 import fetch_emp16_underemployment_level_by_quarter
    return fetch_emp16_underemployment_level_by_quarter(session)


def fetch_population_breakdown() -> Optional[Dict[str, Any]]:
    """
    Population breakdown from 5 ONS datasets: UKPOP (total), MGRZ (working), LF2M (inactive), MGSX (unemployed), LF24 (employment rate).
    Under 16 & Over 64 = Total - (working + inactive + unemployed). Returns historic quarters; each bar is one quarter.
    """
    session = requests.Session()
    session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})

    # Fetch EMP16 underemployment first (2 requests) to avoid ONS 429 after multiple CSV requests
    underemployed_by_q = _fetch_underemployed_by_quarter(session)

    total_rows = _fetch_series_csv(session, UKPOP_URL)
    working_rows = _fetch_series_csv(session, WORKING_POPULATION_URL)
    inactive_rows = _fetch_series_csv(session, ECONOMICALLY_INACTIVE_URL)
    unemployed_rows = _fetch_series_csv(session, UNEMPLOYED_URL)
    employment_rate_rows = _fetch_series_csv(session, EMPLOYMENT_RATE_16_64_URL)

    if not total_rows or not working_rows or not inactive_rows or not unemployed_rows:
        return None

    # UKPOP: annual total (date = year). Build year -> value; normalize to raw count.
    total_by_year: Dict[int, float] = {}
    for r in total_rows:
        try:
            y = int(str(r["date"]).strip()[:4])
            v = float(r["value"])
            if v > 1e6:
                total_by_year[y] = v
            elif v < 1000:
                total_by_year[y] = v * 1e6
            else:
                total_by_year[y] = v * 1000.0
        except (ValueError, TypeError):
            continue
    if not total_by_year:
        return None

    def get_val(rows: List[Dict], date: str) -> float:
        for r in rows:
            if r["date"] == date:
                return float(r["value"])
        return 0.0

    # Underemployment totals by (year, quarter) – already fetched at start to avoid ONS 429

    # Common monthly dates across MGRZ, LF2M, MGSX
    working_dates = {r["date"] for r in working_rows}
    inactive_dates = {r["date"] for r in inactive_rows}
    unemployed_dates = {r["date"] for r in unemployed_rows}
    common_dates = working_dates & inactive_dates & unemployed_dates
    quarter_end_dates = [d for d in common_dates if _month_to_quarter(d) is not None]
    if not quarter_end_dates:
        return None

    # Sort by (year, quarter) and take unique quarters (one date per quarter)
    def sort_key(d: str) -> tuple:
        t = _month_to_quarter(d)
        return (t[0], t[1]) if t else (0, 0)

    quarter_end_dates.sort(key=sort_key)
    # Deduplicate by (year, quarter) keeping one date per quarter
    seen_quarter: set = set()
    unique_by_quarter: List[str] = []
    for d in quarter_end_dates:
        t = _month_to_quarter(d)
        if t and t not in seen_quarter:
            seen_quarter.add(t)
            unique_by_quarter.append(d)

    periods_out: List[Dict[str, Any]] = []
    for date_str in unique_by_quarter:
        t = _month_to_quarter(date_str)
        if not t:
            continue
        year, q = t
        if year not in total_by_year:
            continue
        total_raw = total_by_year[year]
        total_000s = total_raw / 1000.0

        working_000s = get_val(working_rows, date_str)
        inactive_000s = get_val(inactive_rows, date_str)
        unemployed_val = get_val(unemployed_rows, date_str)

        # MGSX: if value looks like rate (< 30), treat as unemployment rate (%); else level (000s)
        if unemployed_val < 30:
            if unemployed_val >= 100:
                unemployed_000s = 0.0
            else:
                unemployed_000s = working_000s * (unemployed_val / 100.0) / (1.0 - unemployed_val / 100.0)
        else:
            unemployed_000s = unemployed_val

        # Labour series are in thousands; total_raw is in raw count. Convert labour and underemployment to raw.
        working_raw_total = working_000s * 1000.0
        inactive_raw = inactive_000s * 1000.0
        unemployed_raw = unemployed_000s * 1000.0

        underemployed_raw = underemployed_by_q.get((year, q), 0.0)
        # Ensure underemployed does not exceed total working population.
        if underemployed_raw < 0:
            underemployed_raw = 0.0
        if underemployed_raw > working_raw_total:
            underemployed_raw = working_raw_total

        # Adjust working population to exclude underemployed portion.
        working_raw = working_raw_total - underemployed_raw

        labour_raw = working_raw + inactive_raw + unemployed_raw + underemployed_raw
        under16_over64_raw = total_raw - labour_raw
        if under16_over64_raw < 0:
            under16_over64_raw = 0.0

        period_label = f"{year} Q{q}"
        periods_out.append({
            "period": period_label,
            "total": round(total_raw, 0),
            "working": round(working_raw, 0),
            "inactive": round(inactive_raw, 0),
            "unemployed": round(unemployed_raw, 0),
            "underemployed": round(underemployed_raw, 0),
            "under16Over64": round(under16_over64_raw, 0),
        })

    if not periods_out:
        return None
    return {"periods": periods_out}


def main():
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--breakdown":
        result = fetch_population_breakdown()
        print(json.dumps(result if result else {}))
        return

    print("=" * 60)
    print("UK RAG Dashboard - Population Metrics Fetcher (Phase 4)")
    print("=" * 60)
    results = fetch_population_metrics()
    print("\nJSON OUTPUT")
    print("=" * 60)
    print(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    main()
