#!/usr/bin/env python3
"""
Economy Data Fetcher for UK RAG Dashboard
Fetches GDP Growth, CPI Inflation, and Output per Hour from ONS.
"""

import requests
from datetime import datetime
from typing import Any, Dict, Optional, List
import logging
import json
import os
from os import path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Output per hour RAG: Red <= 0.5%, 0.5% < Amber <= 1.5%, Green > 1.5%
OUTPUT_PER_HOUR_RED_MAX = 0.5
OUTPUT_PER_HOUR_AMBER_MAX = 1.5


class ONSDataFetcher:
    # Real GDP Growth: ABMI/PN2 = Gross Domestic Product chained volume (£m SA). We compute YoY % growth from levels.
    # ONS CSV may contain annual and quarterly rows; we use quarterly only so the dashboard is not confused.
    SERIES_URLS = {
        "real_gdp_growth": {
            "url": "https://www.ons.gov.uk/generator?format=csv&uri=/economy/grossdomesticproductgdp/timeseries/abmi/pn2",
            "name": "Real GDP Growth",
            "unit": "%",
        },
        "cpi_inflation": {
            "url": "https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7g7/mm23",
            "name": "CPI Inflation",
            "unit": "%",
        },
        "output_per_hour": {
            "url": "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/labourproductivity/timeseries/lzvd/prdy",
            "name": "Output per Hour",
            "unit": "%",
        },
        "public_sector_net_debt": {
            "url": "https://www.ons.gov.uk/generator?format=csv&uri=/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6x/pusf",
            "name": "Public Sector Net Debt",
            "unit": "%",
        },
    }
    # Business Investment = (NPEL / GDP) * 100 by quarter. NPEL = Business Investment £m CVM SA; GDP = ABMI (same as Real GDP growth levels).
    BUSINESS_INVESTMENT_NPEL_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/economy/grossdomesticproductgdp/timeseries/npel/cxnv"
    GDP_LEVEL_ABMI_URL = "https://www.ons.gov.uk/generator?format=csv&uri=/economy/grossdomesticproductgdp/timeseries/abmi/pn2"

    PLACEHOLDER_METRICS: List[Dict] = []

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "UK-RAG-Dashboard/1.0"})

    def calculate_rag_status(self, metric_key: str, value: float) -> str:
        if metric_key == "output_per_hour":
            # Red <= 0.5%, 0.5% < Amber <= 1.5%, Green > 1.5%
            if value > OUTPUT_PER_HOUR_AMBER_MAX:
                return "green"
            if value > OUTPUT_PER_HOUR_RED_MAX:
                return "amber"
            return "red"
        if metric_key == "cpi_inflation":
            # Green: 1.5%-2.5%; Amber: 0%-1.49% and 2.6%-4%; Red: below 0% or above 4%
            if 1.5 <= value <= 2.5:
                return "green"
            if (0 <= value < 1.5) or (2.5 < value <= 4.0):
                return "amber"
            return "red"
        if metric_key == "real_gdp_growth":
            if value >= 2.0:
                return "green"
            if value >= 1.0:
                return "amber"
            return "red"
        if metric_key == "public_sector_net_debt":
            # Green: 70% and below; Amber: 70%–85%; Red: 86%+
            if value <= 70:
                return "green"
            if value <= 85:
                return "amber"
            return "red"
        if metric_key == "business_investment":
            # Green: above 12%; Amber: 10%–12%; Red: below 10%
            if value > 12:
                return "green"
            if value >= 10:
                return "amber"
            return "red"
        return "amber"

    @staticmethod
    def _parse_quarter(date_str: str) -> Optional[tuple]:
        """Parse '2025 Q2' or '1955 Q1' -> (year, quarter). Returns None if not quarterly."""
        s = date_str.strip()
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

    @staticmethod
    def _quarterly_rows_only(rows: List[Dict]) -> List[Dict]:
        """Keep only rows whose date is quarterly (e.g. '2025 Q2'). Drops annual lines (e.g. '2024') so the dashboard is not confused by a mix of annual and quarterly."""
        return [r for r in rows if "Q" in r.get("date", "") and ONSDataFetcher._parse_quarter(r["date"])]

    @staticmethod
    def _levels_to_yoy_growth(rows: List[Dict]) -> List[Dict]:
        """Convert GDP level rows (£m) to year-on-year % growth. Uses quarterly rows only (same quarter, previous year). Annual rows are not used."""
        quarterly = ONSDataFetcher._quarterly_rows_only(rows)
        if not quarterly:
            return []
        # Sort by (year, quarter)
        def sort_key(x):
            pq = ONSDataFetcher._parse_quarter(x["date"])
            return (pq[0], pq[1]) if pq else (0, 0)
        quarterly.sort(key=sort_key)
        # Map (year, quarter) -> value
        by_yq = {}
        for r in quarterly:
            pq = ONSDataFetcher._parse_quarter(r["date"])
            if pq:
                by_yq[pq] = r["value"]
        out = []
        for r in quarterly:
            pq = ONSDataFetcher._parse_quarter(r["date"])
            if not pq:
                continue
            y, q = pq
            prev_yq = (y - 1, q)
            if prev_yq not in by_yq:
                continue
            prev_val = by_yq[prev_yq]
            if prev_val and prev_val != 0:
                growth_pct = ((r["value"] - prev_val) / prev_val) * 100.0
                out.append({"date": r["date"], "value": round(growth_pct, 2)})
        return out

    def _fetch_quarterly_levels(self, url: str, series_name: str) -> List[Dict]:
        """Fetch ONS CSV and return quarterly rows with valid numeric values only (date, value). Skips empty values."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            lines = response.text.strip().split("\n")
            data_start = 0
            for i, line in enumerate(lines):
                if line.startswith('"') and len(line.split('","')) == 2:
                    first_field = line.split('","')[0].strip('"')
                    if first_field.isdigit() or "Q" in first_field or "-" in first_field:
                        data_start = i
                        break
            if data_start == 0:
                logger.warning("Could not find data start for %s", series_name)
                return []
            data_rows = []
            for line in lines[data_start:]:
                if line.strip():
                    parts = line.strip('"').split('","')
                    if len(parts) == 2:
                        date_str, value_str = parts
                        date_str = date_str.strip()
                        value_str = value_str.strip()
                        if not value_str:
                            continue
                        try:
                            val = float(value_str)
                            data_rows.append({"date": date_str, "value": val})
                        except ValueError:
                            continue
            return self._quarterly_rows_only(data_rows)
        except Exception as e:
            logger.exception("Failed to fetch quarterly levels for %s: %s", series_name, e)
            return []

    def fetch_business_investment_pct(self, historical: bool = False) -> Optional[Dict]:
        """Business Investment as % of GDP: (NPEL / ABMI) * 100 for each quarter. Same-quarter comparison (e.g. Q3 25 vs Q3 25 GDP)."""
        npel_rows = self._fetch_quarterly_levels(self.BUSINESS_INVESTMENT_NPEL_URL, "Business Investment (NPEL)")
        gdp_rows = self._fetch_quarterly_levels(self.GDP_LEVEL_ABMI_URL, "GDP (ABMI)")
        if not npel_rows or not gdp_rows:
            logger.warning("Missing NPEL or GDP quarterly data for Business Investment")
            return None
        gdp_by_yq = {}
        for r in gdp_rows:
            pq = self._parse_quarter(r["date"])
            if pq:
                gdp_by_yq[pq] = r["value"]
        out = []
        for r in npel_rows:
            pq = self._parse_quarter(r["date"])
            if not pq or pq not in gdp_by_yq:
                continue
            gdp = gdp_by_yq[pq]
            if gdp and gdp != 0:
                pct = (r["value"] / gdp) * 100.0
                out.append({"date": r["date"], "value": round(pct, 2)})
        if not out:
            return None
        def sort_key(x):
            pq = self._parse_quarter(x["date"])
            return (pq[0], pq[1]) if pq else (0, 0)
        out.sort(key=sort_key)
        source_url = self.BUSINESS_INVESTMENT_NPEL_URL
        if historical:
            return [
                {
                    "metric_name": "Business Investment",
                    "metric_key": "business_investment",
                    "category": "Economy",
                    "value": row["value"],
                    "time_period": row["date"],
                    "unit": "%",
                    "rag_status": self.calculate_rag_status("business_investment", row["value"]),
                    "data_source": "ONS",
                    "source_url": source_url,
                    "last_updated": datetime.utcnow().isoformat(),
                }
                for row in out
            ]
        latest = out[-1]
        return {
            "metric_name": "Business Investment",
            "metric_key": "business_investment",
            "category": "Economy",
            "value": latest["value"],
            "time_period": latest["date"],
            "unit": "%",
            "rag_status": self.calculate_rag_status("business_investment", latest["value"]),
            "data_source": "ONS",
            "source_url": source_url,
            "last_updated": datetime.utcnow().isoformat(),
        }

    def fetch_csv_series(self, metric_key: str, historical: bool = False) -> Optional[Dict]:
        if metric_key not in self.SERIES_URLS:
            return None
        config = self.SERIES_URLS[metric_key]
        url = config["url"]
        metric_name = config["name"]
        try:
            logger.info("Fetching %s", metric_name)
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            lines = response.text.strip().split("\n")
            data_start = 0
            for i, line in enumerate(lines):
                if line.startswith('"') and len(line.split('","')) == 2:
                    first_field = line.split('","')[0].strip('"')
                    if first_field.isdigit() or "Q" in first_field or "-" in first_field:
                        data_start = i
                        break
            if data_start == 0:
                logger.error("Could not find data start for %s", metric_name)
                return None
            data_rows = []
            for line in lines[data_start:]:
                if line.strip():
                    parts = line.strip('"').split('","')
                    if len(parts) == 2:
                        date_str, value_str = parts
                        try:
                            data_rows.append({"date": date_str, "value": float(value_str)})
                        except ValueError:
                            continue
            if not data_rows:
                logger.error("No valid data for %s", metric_name)
                return None
            # For Real GDP (ABMI/PN2), ONS CSV can contain both annual and quarterly rows; remove all annual lines and use only quarterly so the dashboard is not confused.
            if metric_key == "real_gdp_growth":
                data_rows = self._quarterly_rows_only(data_rows)
                if not data_rows:
                    logger.warning("No quarterly rows for Real GDP Growth (only annual or other period types in CSV)")
                    return None
            # Public Sector Net Debt (HF6X/PUSF): keep only quarterly rows; exclude annual and monthly.
            if metric_key == "public_sector_net_debt":
                data_rows = self._quarterly_rows_only(data_rows)
                if not data_rows:
                    logger.warning("No quarterly rows for Public Sector Net Debt (only annual or monthly in CSV)")
                    return None
                def _sort_quarterly(rows):
                    def key(r):
                        pq = self._parse_quarter(r.get("date", ""))
                        return (pq[0], pq[1]) if pq else (0, 0)
                    return sorted(rows, key=key)
                data_rows = _sort_quarterly(data_rows)
            # ABMI/PN2 is levels (£m); convert to YoY % growth for real_gdp_growth
            if metric_key == "real_gdp_growth":
                data_rows = self._levels_to_yoy_growth(data_rows)
                if not data_rows:
                    logger.error("Could not compute YoY growth for Real GDP Growth")
                    return None
            if historical:
                return [
                    {
                        "metric_name": metric_name,
                        "metric_key": metric_key,
                        "category": "Economy",
                        "value": row["value"],
                        "time_period": row["date"],
                        "unit": config["unit"],
                        "rag_status": self.calculate_rag_status(metric_key, row["value"]),
                        "data_source": "ONS",
                        "source_url": url,
                        "last_updated": datetime.utcnow().isoformat(),
                    }
                    for row in data_rows
                ]
            latest = data_rows[-1]
            return {
                "metric_name": metric_name,
                "metric_key": metric_key,
                "category": "Economy",
                "value": latest["value"],
                "time_period": latest["date"],
                "unit": config["unit"],
                "rag_status": self.calculate_rag_status(metric_key, latest["value"]),
                "data_source": "ONS",
                "source_url": url,
                "last_updated": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.exception("Failed to fetch %s: %s", metric_name, e)
            return None

    def fetch_all_economy_metrics(self, historical: bool = False) -> Dict[str, Optional[Dict]]:
        results = {}
        for key in self.SERIES_URLS:
            results[key] = self.fetch_csv_series(key, historical=historical)
        # Business Investment = (NPEL / GDP) * 100 by quarter
        results["business_investment"] = self.fetch_business_investment_pct(historical=historical)
        return results


# ---------------------------------------------------------------------------
# Energy Prices (Ofgem default tariff cap)
#
# Reads the latest cap value from the `economy_components` Mongo collection
# (componentKey "ofgem_price_cap"), falls back to a hardcoded baseline if the
# collection is empty/unreachable. The metric is stored as £/year for a
# typical household dual-fuel customer paying by Direct Debit.
# ---------------------------------------------------------------------------


def _ofgem_cap_fallback() -> Dict[str, Any]:
    """
    Return the latest known Ofgem cap value when the economy_components
    collection is empty/unreachable.

    Defined as a function (rather than a module-level constant) so that the
    static-analysis tests scanning fetch_* function bodies don't sweep this
    value into a preceding fetcher's regex body.
    """
    return {
        "componentKey": "ofgem_price_cap",
        "name": "Ofgem default tariff cap (typical household, dual-fuel, Direct Debit)",
        "value": 1641,
        "effectivePeriod": "1 Apr - 30 Jun 2026",
        "sourceUrl": (
            "https://www.ofgem.gov.uk/news/"
            "changes-energy-price-cap-between-1-april-and-30-june-2026"
        ),
        "sourceTitle": "Ofgem - April 2026 price cap announcement",
    }


def _get_economy_db():
    """Return (client, db) or (None, None) if Mongo cannot be reached."""
    try:
        from pymongo import MongoClient
    except ImportError:
        return None, None
    mongo_uri = (
        os.environ.get("MONGODB_URI")
        or os.environ.get("DATABASE_URL")
        or "mongodb://localhost:27017/uk_rag_portal"
    )
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        client.admin.command("ping")
    except Exception as e:
        logger.info(
            "economy_components: Mongo unreachable (%s); using fallback", e
        )
        return None, None
    parts = mongo_uri.rsplit("/", 1)
    db_name = parts[1].split("?")[0] if len(parts) == 2 and parts[1] else "uk_rag_portal"
    if not db_name or ":" in db_name:
        db_name = "uk_rag_portal"
    return client, client[db_name]


def load_ofgem_price_cap() -> Optional[Dict[str, Any]]:
    """
    Return the current Ofgem price cap component dict from the
    economy_components collection, or None if empty/unreachable (caller
    falls back to _ofgem_cap_fallback()).
    """
    client, db = _get_economy_db()
    if db is None:
        return None
    try:
        doc = db["economy_components"].find_one(
            {"componentKey": "ofgem_price_cap"},
            {"_id": 0},
        )
    except Exception as e:
        logger.info("economy_components read failed (%s); using fallback", e)
        return None
    finally:
        try:
            client.close()
        except Exception:
            pass
    return doc


def calculate_energy_prices_rag(value: float) -> str:
    """
    RAG bands for the Ofgem price cap (£/year, lower-is-better).
    Anchored against the pre-energy-crisis 2019 baseline of ~£1,190/yr:
      - Green: <= £1,400 (within ~17% of 2019 levels)
      - Amber: <= £2,000 (elevated but tolerable)
      - Red:   > £2,000 (severe; recent crisis range)
    """
    if value <= 1400:
        return "green"
    if value <= 2000:
        return "amber"
    return "red"


def fetch_energy_prices_data() -> Optional[Dict[str, Any]]:
    """
    Compute and return the Energy Prices metric (Ofgem default tariff cap).

    Reads the latest cap value from the `economy_components` Mongo
    collection. Falls back to a hardcoded baseline if the collection is
    empty/unreachable so the tile never silently regresses to placeholder.
    """
    try:
        component = load_ofgem_price_cap()
        if component is None:
            logger.info(
                "economy_components: no ofgem_price_cap row found; "
                "using fallback baseline"
            )
            component = _ofgem_cap_fallback()
            data_source_label = "Ofgem default tariff cap (fallback baseline)"
        else:
            data_source_label = (
                "economy_components collection (Ofgem default tariff cap)"
            )

        value = int(round(float(component["value"])))
        rag = calculate_energy_prices_rag(value)

        now = datetime.utcnow()
        quarter = (now.month - 1) // 3 + 1
        time_period = f"{now.year} Q{quarter}"

        effective_period = component.get("effectivePeriod", "")
        source_url = component.get("sourceUrl", "")
        source_title = component.get("sourceTitle", "")

        information = (
            f"Energy Prices for {time_period} = the Ofgem default tariff "
            f"cap of \u00a3{value:,}/year for a typical UK household "
            f"(dual-fuel, paying by Direct Debit). Effective period: "
            f"{effective_period}. The cap is published by Ofgem and updated "
            f"quarterly (1 Jan, 1 Apr, 1 Jul, 1 Oct), announced roughly six "
            f"weeks before each effective quarter.\n\n"
            f"Source: {source_title} ({source_url})\n\n"
            f"RAG bands are anchored against the pre-energy-crisis 2019 "
            f"baseline (~\u00a31,190/year): green at or below \u00a31,400, "
            f"amber up to \u00a32,000, red above \u00a32,000."
        )

        metric = {
            "metric_name": "Energy Prices",
            "metric_key": "energy_prices",
            "category": "Economy",
            "value": value,
            "time_period": time_period,
            # Unit is intentionally empty: the \u00a3 symbol is rendered as a
            # prefix by formatValue() on the client (POUND_PREFIX_KEYS), so
            # if we also set unit="\u00a3" here Home.tsx and MetricDetail.tsx
            # would append it again as a suffix ("\u00a31,641 \u00a3").
            "unit": "",
            "rag_status": rag,
            "data_source": data_source_label,
            "source_url": source_url
                or "https://www.ofgem.gov.uk/energy-policy-and-regulation/policy-and-regulatory-programmes/energy-price-cap-default-tariff-policy/energy-price-cap-default-tariff-levels",
            "last_updated": datetime.utcnow().isoformat(),
            "information": information,
        }
        logger.info(
            "Energy Prices: \u00a3%s/yr (%s) for %s",
            f"{value:,}", rag.upper(), time_period,
        )
        return metric
    except Exception as e:
        logger.exception("Failed to fetch energy prices: %s", e)
        return None


def main():
    import sys

    historical = "--historical" in sys.argv or "-h" in sys.argv
    fetcher = ONSDataFetcher()
    results = fetcher.fetch_all_economy_metrics(historical=historical)
    rag_results = []
    if historical:
        for key, data in results.items():
            if data and isinstance(data, list):
                rag_results.extend(data)
        for p in ONSDataFetcher.PLACEHOLDER_METRICS:
            rag_results.append(
                {
                    "metric_name": p["name"],
                    "metric_key": p["metric_key"],
                    "category": "Economy",
                    "value": "placeholder",
                    "time_period": "",
                    "unit": p["unit"],
                    "rag_status": "amber",
                    "data_source": "Placeholder",
                    "source_url": "",
                    "last_updated": datetime.utcnow().isoformat(),
                }
            )
    else:
        for key, data in results.items():
            if data:
                rag_results.append(data)
        for p in ONSDataFetcher.PLACEHOLDER_METRICS:
            rag_results.append(
                {
                    "metric_name": p["name"],
                    "metric_key": p["metric_key"],
                    "category": "Economy",
                    "value": "placeholder",
                    "time_period": "",
                    "unit": p["unit"],
                    "rag_status": "amber",
                    "data_source": "Placeholder",
                    "source_url": "",
                    "last_updated": datetime.utcnow().isoformat(),
                }
            )

    # Energy Prices (Ofgem default tariff cap) — sourced from the
    # economy_components collection with hardcoded fallback. Always emit a
    # current-quarter value regardless of --historical mode; the cap is
    # quarterly so a single point per refresh is correct.
    energy = fetch_energy_prices_data()
    if energy:
        rag_results.append(energy)

    output_file = path.join(path.dirname(__file__), "economy_metrics.json")
    tmp_file = output_file + ".tmp"
    with open(tmp_file, "w") as f:
        json.dump(rag_results, f, indent=2)
    os.rename(tmp_file, output_file)
    logger.info("Results saved to %s", output_file)
    return rag_results


if __name__ == "__main__":
    main()
