#!/usr/bin/env python3
"""
One-off backfill of historical Ofgem default tariff cap values into
`metricHistory` so the Energy Prices tile shows a trend arrow without
having to wait a full quarter for the cron to produce a second data point.

All values below are the official Ofgem cap announcements for the indicated
quarter (typical household dual-fuel, paying by Direct Debit, includes 5%
VAT). Source: Ofgem press releases linked per row.

Idempotent: re-running is safe. Existing rows for the same dataDate are
updated in place (matches the addMetricHistory semantics used by the cron
and tRPC refresh paths).

Usage:
    python3 scripts/seed_energy_prices_history.py
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from typing import List, Tuple

try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo not installed. Install with: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)


MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)


# (dataDate, value £/yr, effective period, source URL)
HISTORY: List[Tuple[str, int, str, str]] = [
    (
        "2025 Q2",
        1849,
        "1 Apr - 30 Jun 2025",
        "https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-april-and-30-june-2026",
    ),
    (
        "2026 Q1",
        1758,
        "1 Jan - 31 Mar 2026",
        "https://www.ofgem.gov.uk/news/changes-energy-price-cap-between-1-april-and-30-june-2026",
    ),
]


def rag_band(value: int) -> str:
    """Mirrors economy_data_fetcher.calculate_energy_prices_rag."""
    if value <= 1400:
        return "green"
    if value <= 2000:
        return "amber"
    return "red"


def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    parts = MONGO_URI.rsplit("/", 1)
    db_name = parts[1].split("?")[0] if len(parts) == 2 and parts[1] else "uk_rag_portal"
    if not db_name or ":" in db_name:
        db_name = "uk_rag_portal"
    return client, client[db_name]


def main() -> int:
    print("[EnergyPricesHistory] Backfilling Ofgem cap quarterly history")
    client, db = get_db()
    coll = db["metricHistory"]
    try:
        now = datetime.now(timezone.utc)
        for data_date, value, period, source_url in HISTORY:
            rag = rag_band(value)
            information = (
                f"Energy Prices for {data_date} = the Ofgem default tariff "
                f"cap of \u00a3{value:,}/year for a typical UK household "
                f"(dual-fuel, paying by Direct Debit). Effective period: "
                f"{period}.\n\nSource: Ofgem cap announcement ({source_url})\n\n"
                f"Seeded via scripts/seed_energy_prices_history.py to provide "
                f"trend-arrow coverage; replaced by cron-driven data once "
                f"future quarters accumulate."
            )
            result = coll.find_one_and_update(
                {"metricKey": "energy_prices", "dataDate": data_date},
                {
                    "$set": {
                        "metricKey": "energy_prices",
                        "value": str(value),
                        "ragStatus": rag,
                        "dataDate": data_date,
                        "recordedAt": now,
                        "information": information,
                    }
                },
                upsert=True,
                return_document=False,
            )
            verdict = "updated" if result is not None else "inserted"
            print(
                f"[EnergyPricesHistory]   {data_date}: \u00a3{value:,} "
                f"({rag.upper()}) [{verdict}]"
            )

        # Show the resulting timeline.
        timeline = list(
            coll.find({"metricKey": "energy_prices"}, {"_id": 0})
                .sort("dataDate", -1)
        )
        print(f"[EnergyPricesHistory] Total history rows: {len(timeline)}")
        for h in timeline:
            print(f"  {h.get('dataDate')}: \u00a3{int(float(h.get('value', 0))):,}")
    finally:
        try:
            client.close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
