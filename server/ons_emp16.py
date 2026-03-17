"""
ONS EMP16: Underemployment and overemployment – discover latest XLS URL and parse.

The dataset is published as a new file each quarter (e.g. emp16feb2026.xls); the download URL
changes each release. This module discovers the latest file by fetching the stable "current"
edition page and parsing the "Latest version" link, so automation does not rely on a fixed URL.
"""

import re
import sys
from typing import Dict, List, Optional, Tuple
from io import BytesIO

import requests


# Stable URL for the "current" edition – lists the latest file and previous versions
EMP16_CURRENT_EDITION_PAGE = (
    "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/"
    "employmentandemployeetypes/datasets/underemploymentandoveremploymentemp16/current"
)


def get_latest_emp16_xls_url(session: Optional[requests.Session] = None) -> Optional[str]:
    """
    Fetch the EMP16 current edition page and return the URL of the latest XLS file.
    The page lists "Latest version" first; previous versions are under /current/previous/.
    """
    if session is None:
        session = requests.Session()
    session.headers.setdefault("User-Agent", "UK-RAG-Dashboard/1.0")
    try:
        r = session.get(EMP16_CURRENT_EDITION_PAGE, timeout=30)
        r.raise_for_status()
        text = r.text
    except Exception as e:
        print(f"[OnsEmp16] Error fetching EMP16 page: {e}", file=sys.stderr)
        return None

    # Find links that point to the current XLS (not previous versions).
    # ONS page may use relative href: /file?uri=/employment.../current/emp16feb2026.xls
    # Previous: .../current/previous/v42/emp16nov2025.xls
    pattern = re.compile(
        r'href=["\']?(/file\?uri=[^"\'>\s]+/current/(?!previous/)[^"\'>\s]*\.xls)["\']?',
        re.IGNORECASE,
    )
    match = pattern.search(text)
    if match:
        path = match.group(1)
        if path.startswith("/"):
            return "https://www.ons.gov.uk" + path
        return path
    return None


def _parse_quarter_label(label: str) -> Optional[Tuple[int, int]]:
    """Parse 'Jan-Mar 2002' or 'Apr-Jun 2002' -> (year, quarter)."""
    if not label or " " not in label:
        return None
    period_part, year_part = label.strip().split(" ", 1)
    period_part = period_part.strip()
    year_part = year_part.strip()
    try:
        year = int(year_part[:4])
    except ValueError:
        return None
    if period_part == "Jan-Mar":
        q = 1
    elif period_part == "Apr-Jun":
        q = 2
    elif period_part == "Jul-Sep":
        q = 3
    elif period_part == "Oct-Dec":
        q = 4
    else:
        return None
    return (year, q)


def fetch_emp16_underemployment_level_by_quarter(
    session: Optional[requests.Session] = None,
) -> Dict[Tuple[int, int], float]:
    """
    Download the latest EMP16 XLS and parse the 'Levels' sheet for underemployment level by quarter.
    Returns {(year, quarter): level (headcount)}.
    """
    try:
        import pandas as pd
    except ImportError:
        return {}

    sess = session or requests.Session()
    sess.headers.setdefault("User-Agent", "UK-RAG-Dashboard/1.0")
    url = get_latest_emp16_xls_url(sess)
    if not url:
        return {}
    try:
        r = sess.get(url, timeout=60)
        r.raise_for_status()
        content = BytesIO(r.content)
        df = pd.read_excel(content, sheet_name="Levels", header=None)
    except Exception as e:
        print(f"[OnsEmp16] Error loading EMP16 Excel: {e}", file=sys.stderr)
        return {}

    out: Dict[Tuple[int, int], float] = {}
    for _, row in df.iterrows():
        date_val = row.iloc[0]
        if not isinstance(date_val, str):
            continue
        yq = _parse_quarter_label(date_val.strip())
        if not yq:
            continue
        try:
            val = float(str(row.iloc[1]).replace(",", ""))
        except (ValueError, TypeError):
            continue
        out[yq] = val
    return out


def fetch_emp16_underemployment_rate_by_quarter(
    session: Optional[requests.Session] = None,
) -> List[Dict]:
    """
    Download the latest EMP16 XLS and parse underemployment rate (%) by quarter.
    Returns list of {"date": "YYYY Qn", "value": rate_pct} sorted by (year, quarter).
    Tries sheet 'Rates' first (ONS often uses this for rate tables); otherwise uses first sheet
    with date-like col0 and percentage-like col1 (0–30).
    """
    try:
        import pandas as pd
    except ImportError:
        return []

    sess = session or requests.Session()
    sess.headers.setdefault("User-Agent", "UK-RAG-Dashboard/1.0")
    url = get_latest_emp16_xls_url(sess)
    if not url:
        return []
    try:
        r = sess.get(url, timeout=60)
        r.raise_for_status()
        content = BytesIO(r.content)
        excel_file = pd.ExcelFile(content)
    except Exception as e:
        print(f"[OnsEmp16] Error loading EMP16 Excel for inactivity: {e}", file=sys.stderr)
        return []

    cand_sheets = [n for n in excel_file.sheet_names if n and "rate" in n.lower()]
    if not cand_sheets:
        cand_sheets = list(excel_file.sheet_names) if excel_file.sheet_names else []

    for sheet_name in cand_sheets:
        try:
            df = pd.read_excel(content, sheet_name=sheet_name, header=None)
            content.seek(0)
        except Exception as e:
            print(f"[OnsEmp16] Error parsing sheet {sheet_name}: {e}", file=sys.stderr)
            continue
        rows_out: List[Dict] = []
        for _, row in df.iterrows():
            if row.iloc[0] is None or (isinstance(row.iloc[0], float) and pd.isna(row.iloc[0])):
                continue
            date_val = str(row.iloc[0]).strip()
            yq = _parse_quarter_label(date_val)
            if not yq:
                continue
            try:
                val = float(str(row.iloc[1]).replace(",", ""))
            except (ValueError, TypeError, IndexError):
                continue
            # Rate is typically 0–20%; level is thousands (e.g. 500–3000)
            if val > 100:
                continue
            year, q = yq
            rows_out.append({"date": f"{year} Q{q}", "value": round(val, 2)})
        if rows_out:
            rows_out.sort(key=lambda r: (int(r["date"].split()[0]), int(r["date"].split()[1][1])))
            return rows_out
    return []
