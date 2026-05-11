#!/usr/bin/env python3
"""
Seed (or refresh) the education_quality_components collection from
server/education/education_quality_components.seed.json.

Same idempotent shape as scripts/seed_fleet_inventory.py: each component is
upserted by its stable `itemId`, so the script can be re-run safely. Values
edited in Mongo by an admin survive re-seeding only if you stop running this
script. To force a clean re-seed, use --replace (destructive).

Usage:
    python3 scripts/seed_education_components.py
    python3 scripts/seed_education_components.py --replace
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List

try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo not installed. Install with: pip3 install pymongo", file=sys.stderr)
    sys.exit(1)


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
SEED_PATH = os.path.join(
    PROJECT_ROOT,
    "server",
    "education",
    "education_quality_components.seed.json",
)
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)

ALLOWED_COMPONENT_KEYS = {
    "graduate_outcomes",
    "continuation_rate",
    "nss_teaching_positive",
}


def load_seed() -> List[Dict[str, Any]]:
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        payload = json.load(f)
    raw = payload.get("components", [])
    if not isinstance(raw, list):
        raise ValueError(
            "education_quality_components.seed.json must contain a 'components' array"
        )
    return [c for c in raw if isinstance(c, dict) and "itemId" in c]


def validate(components: List[Dict[str, Any]]) -> None:
    seen_ids: set[str] = set()
    seen_keys: set[str] = set()
    total_weight = 0.0
    for c in components:
        item_id = c.get("itemId")
        if not item_id or not isinstance(item_id, str):
            raise ValueError(f"component missing string itemId: {c!r}")
        if item_id in seen_ids:
            raise ValueError(f"duplicate itemId in seed: {item_id}")
        seen_ids.add(item_id)
        ck = c.get("componentKey")
        if ck not in ALLOWED_COMPONENT_KEYS:
            raise ValueError(
                f"{item_id}: componentKey must be one of {sorted(ALLOWED_COMPONENT_KEYS)},"
                f" got {ck!r}"
            )
        if ck in seen_keys:
            raise ValueError(f"duplicate componentKey: {ck}")
        seen_keys.add(ck)
        value = c.get("value")
        if not isinstance(value, (int, float)) or value < 0 or value > 100:
            raise ValueError(
                f"{item_id}: value must be a number in [0,100], got {value!r}"
            )
        weight = c.get("weight")
        if not isinstance(weight, (int, float)) or weight < 0 or weight > 1:
            raise ValueError(
                f"{item_id}: weight must be a number in [0,1], got {weight!r}"
            )
        total_weight += float(weight)
        for required in ("name", "reportingPeriod", "sourceUrl", "sourceTitle"):
            if not c.get(required):
                raise ValueError(f"{item_id}: missing required field {required!r}")
    if abs(total_weight - 1.0) > 0.001:
        raise ValueError(
            f"weights must sum to 1.0 across all components, got {total_weight:.4f}"
        )


def get_db():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    parts = MONGO_URI.rsplit("/", 1)
    db_name = parts[1].split("?")[0] if len(parts) == 2 and parts[1] else "uk_rag_portal"
    if not db_name or ":" in db_name:
        db_name = "uk_rag_portal"
    return client, client[db_name]


def upsert_component(coll, c: Dict[str, Any], now: datetime) -> str:
    doc = {
        "itemId": c["itemId"],
        "componentKey": c["componentKey"],
        "name": c["name"],
        "value": float(c["value"]),
        "weight": float(c["weight"]),
        "reportingPeriod": c["reportingPeriod"],
        "sourceUrl": c["sourceUrl"],
        "sourceTitle": c["sourceTitle"],
        "notes": c.get("notes"),
        "lastVerifiedAt": now,
        "updatedAt": now,
    }
    result = coll.find_one_and_update(
        {"itemId": c["itemId"]},
        {"$set": doc, "$setOnInsert": {"createdAt": now}},
        upsert=True,
        return_document=False,
    )
    return "updated" if result is not None else "inserted"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed the education_quality_components collection."
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete all existing components before seeding (destructive).",
    )
    args = parser.parse_args()

    print(f"[EduSeed] Reading {SEED_PATH}")
    components = load_seed()
    print(f"[EduSeed] Loaded {len(components)} component(s)")
    validate(components)
    print("[EduSeed] Validation passed (weights sum to 1.0)")

    client, db = get_db()
    coll = db["education_quality_components"]

    try:
        if args.replace:
            removed = coll.delete_many({}).deleted_count
            print(f"[EduSeed] --replace: removed {removed} existing component(s)")

        now = datetime.now(timezone.utc)
        inserted = 0
        updated = 0
        for c in components:
            verdict = upsert_component(coll, c, now)
            if verdict == "inserted":
                inserted += 1
            else:
                updated += 1
        print(f"[EduSeed] Done. inserted={inserted} updated={updated}")

        # Preview composite score from current rows.
        composite = 0.0
        for doc in coll.find({}, {"_id": 0, "value": 1, "weight": 1, "componentKey": 1}):
            composite += float(doc["value"]) * float(doc["weight"])
        print(f"[EduSeed] Preview composite score: {composite:.1f}")
    finally:
        try:
            client.close()
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
