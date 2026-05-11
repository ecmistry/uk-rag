#!/usr/bin/env python3
"""
Seed (or refresh) the economy_components collection from
server/economy/economy_components.seed.json.

Same idempotent shape as scripts/seed_education_components.py: each component
is upserted by its stable `itemId`. The Economy fetcher reads from this
collection at refresh time; values edited directly in Mongo by an admin
will be clobbered by a subsequent run of this seeder (use --replace for an
explicit destructive reset, or just edit the JSON before re-seeding).

Usage:
    python3 scripts/seed_economy_components.py
    python3 scripts/seed_economy_components.py --replace
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
    "economy",
    "economy_components.seed.json",
)
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)

# Known componentKeys. New keys must be added here AND wired into the fetcher
# before they will affect any dashboard tile.
ALLOWED_COMPONENT_KEYS = {
    "ofgem_price_cap",
}


def load_seed() -> List[Dict[str, Any]]:
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        payload = json.load(f)
    raw = payload.get("components", [])
    if not isinstance(raw, list):
        raise ValueError(
            "economy_components.seed.json must contain a 'components' array"
        )
    return [c for c in raw if isinstance(c, dict) and "itemId" in c]


def validate(components: List[Dict[str, Any]]) -> None:
    seen_ids: set[str] = set()
    seen_keys: set[str] = set()
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
        if not isinstance(value, (int, float)) or value < 0:
            raise ValueError(
                f"{item_id}: value must be a non-negative number, got {value!r}"
            )
        for required in ("name", "effectivePeriod", "sourceUrl", "sourceTitle"):
            if not c.get(required):
                raise ValueError(f"{item_id}: missing required field {required!r}")


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
        "effectivePeriod": c["effectivePeriod"],
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
        description="Seed the economy_components collection."
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete all existing components before seeding (destructive).",
    )
    args = parser.parse_args()

    print(f"[EcoSeed] Reading {SEED_PATH}")
    components = load_seed()
    print(f"[EcoSeed] Loaded {len(components)} component(s)")
    validate(components)
    print("[EcoSeed] Validation passed")

    client, db = get_db()
    coll = db["economy_components"]

    try:
        if args.replace:
            removed = coll.delete_many({}).deleted_count
            print(f"[EcoSeed] --replace: removed {removed} existing component(s)")

        now = datetime.now(timezone.utc)
        inserted = 0
        updated = 0
        for c in components:
            verdict = upsert_component(coll, c, now)
            if verdict == "inserted":
                inserted += 1
            else:
                updated += 1
        print(f"[EcoSeed] Done. inserted={inserted} updated={updated}")

        print("[EcoSeed] Current component values:")
        for doc in coll.find(
            {}, {"_id": 0, "componentKey": 1, "value": 1, "effectivePeriod": 1}
        ):
            print(
                f"  {doc.get('componentKey')}: "
                f"{doc.get('value')} ({doc.get('effectivePeriod')})"
            )
    finally:
        try:
            client.close()
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
