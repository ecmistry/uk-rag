#!/usr/bin/env python3
"""
Economy Data Fetcher for UK RAG Dashboard
Fetches GDP Growth, CPI Inflation, and Output per Hour from ONS.
"""

import requests
from datetime import datetime
from typing import Dict, Optional, List
import logging
import json
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
    }
    PLACEHOLDER_METRICS = [
        {"metric_key": "public_sector_net_debt", "name": "Public Sector Net Debt", "unit": "%"},
        {"metric_key": "business_investment", "name": "Business Investment", "unit": "%"},
    ]

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
            if 1.5 <= value <= 2.5:
                return "green"
            if 1.0 <= value <= 3.5:
                return "amber"
            return "red"
        if metric_key == "real_gdp_growth":
            if value >= 2.0:
                return "green"
            if value >= 1.0:
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
    def _levels_to_yoy_growth(rows: List[Dict]) -> List[Dict]:
        """Convert GDP level rows (£m) to year-on-year % growth. Uses quarterly rows only (same quarter, previous year)."""
        # Keep only quarterly rows (e.g. "2025 Q2", "1955 Q1")
        quarterly = [r for r in rows if "Q" in r["date"] and ONSDataFetcher._parse_quarter(r["date"])]
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
        return results


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
    output_file = path.join(path.dirname(__file__), "economy_metrics.json")
    with open(output_file, "w") as f:
        json.dump(rag_results, f, indent=2)
    logger.info("Results saved to %s", output_file)
    return rag_results


if __name__ == "__main__":
    main()
