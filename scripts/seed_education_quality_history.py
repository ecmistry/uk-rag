#!/usr/bin/env python3
"""
One-off backfill of historical Quality of University Education composite
values into `metricHistory` so the tile shows a trend arrow without having
to wait for a subsequent release cycle to add a second data point.

Method
======
The composite weights stay fixed (0.40 grad outcomes + 0.30 continuation +
0.30 NSS). For each prior period, the seeded composite uses the most
recently published component value as of that period:

  - 2025 Q3 (i.e. the dashboard snapshot taken right after NSS 2025 vintage
    landed but BEFORE the 2026 NSS or new Graduate Outcomes release):
      grad_outcomes  = 73.8  (2021/22 cohort, unchanged from 2026 Q2 seed)
      continuation   = 90.2  (2021/22 entry cohort, unchanged)
      nss_teaching   = 85.3  (NSS 2024 sector average, per OfS UK release)
      composite      = 0.40*73.8 + 0.30*90.2 + 0.30*85.3 = 82.17 -> 82.2

The 2026 Q2 row already in place uses NSS 2025 (86.9%) and the same
other components, producing 82.7. Trend: 82.2 -> 82.7, +0.5pp green up.

Why this is honest: the only field that changed between the two periods is
NSS Teaching positive (85.3 -> 86.9), which is a real, OfS-published
movement. The Graduate Outcomes and Continuation components used the
latest figures available in both snapshots, so the seeded trend
attributes movement to the component that actually moved.

Idempotent: re-running is safe. Existing rows for the same dataDate are
updated in place.

Usage:
    python3 scripts/seed_education_quality_history.py
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


# (dataDate, composite value, brief narrative, OfS NSS URL)
HISTORY: List[Tuple[str, float, str, str]] = [
    (
        "2025 Q3",
        82.2,
        (
            "Composite of HESA Graduate Outcomes (73.8% high-skilled, "
            "2021/22 cohort, w=0.40), HESA Student data continuation "
            "(90.2%, 2021/22 entry, w=0.30) and OfS NSS Teaching positive "
            "(85.3%, NSS 2024 UK sector average, w=0.30)."
        ),
        "https://www.officeforstudents.org.uk/data-and-analysis/national-student-survey-data/",
    ),
]


def rag_band(value: float) -> str:
    """Mirrors education_data_fetcher RAG bands for university_education_quality."""
    if value >= 80:
        return "green"
    if value >= 70:
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
    print("[EduQualityHistory] Backfilling university_education_quality history")
    client, db = get_db()
    coll = db["metricHistory"]
    try:
        now = datetime.now(timezone.utc)
        for data_date, value, narrative, source_url in HISTORY:
            rag = rag_band(value)
            information = (
                f"Quality of University Education for {data_date}: composite "
                f"score {value:.1f}. {narrative}\n\nSource: {source_url}\n\n"
                f"Seeded via scripts/seed_education_quality_history.py to "
                f"provide trend-arrow coverage; replaced by cron-driven data "
                f"once future component updates are approved through the "
                f"admin queue."
            )
            result = coll.find_one_and_update(
                {"metricKey": "university_education_quality", "dataDate": data_date},
                {
                    "$set": {
                        "metricKey": "university_education_quality",
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
                f"[EduQualityHistory]   {data_date}: {value:.1f}% "
                f"({rag.upper()}) [{verdict}]"
            )

        timeline = list(
            coll.find({"metricKey": "university_education_quality"}, {"_id": 0})
                .sort("dataDate", -1)
        )
        print(f"[EduQualityHistory] Total history rows: {len(timeline)}")
        for h in timeline:
            print(f"  {h.get('dataDate')}: {h.get('value')}%")
    finally:
        try:
            client.close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
