#!/usr/bin/env python3
"""
Seed (or refresh) the fleet_inventory collection from
server/defence/fleet_inventory.seed.json.

The collection is the source of truth for defence mass-score computation
(Phase 2 of the news-aware defence pipeline). Each item is upserted by its
stable `itemId`, so this script is idempotent — re-running it picks up new
entries in the JSON file and refreshes citations/notes on existing ones
without disturbing items that an admin has subsequently edited.

Usage:
    python3 scripts/seed_fleet_inventory.py
    python3 scripts/seed_fleet_inventory.py --replace   # delete-then-insert (destructive)
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
SEED_PATH = os.path.join(PROJECT_ROOT, "server", "defence", "fleet_inventory.seed.json")
MONGO_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("DATABASE_URL")
    or "mongodb://localhost:27017/uk_rag_portal"
)

ALLOWED_STATUSES = {"active", "refit", "low_readiness", "withdrawn", "decommissioned"}
ALLOWED_CATEGORIES = {"sea_mass", "land_mass", "air_mass"}


def load_seed() -> List[Dict[str, Any]]:
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        payload = json.load(f)
    raw = payload.get("items", [])
    if not isinstance(raw, list):
        raise ValueError("fleet_inventory.seed.json must contain an 'items' array")
    # Drop free-form `_comment` blocks used to annotate the seed file.
    return [it for it in raw if isinstance(it, dict) and "itemId" in it]


def validate(items: List[Dict[str, Any]]) -> None:
    seen_ids: set[str] = set()
    for item in items:
        # Permit free-form `_comment` blocks in the seed file (skipped here).
        if "itemId" not in item and "_comment" in item:
            continue
        item_id = item.get("itemId")
        if not item_id or not isinstance(item_id, str):
            raise ValueError(f"item missing string itemId: {item!r}")
        if item_id in seen_ids:
            raise ValueError(f"duplicate itemId in seed: {item_id}")
        seen_ids.add(item_id)
        if item.get("category") not in ALLOWED_CATEGORIES:
            raise ValueError(f"{item_id}: invalid category {item.get('category')!r}")
        if item.get("status") not in ALLOWED_STATUSES:
            raise ValueError(f"{item_id}: invalid status {item.get('status')!r}")
        for required in ("name", "className", "role"):
            if not item.get(required):
                raise ValueError(f"{item_id}: missing required field {required!r}")
        if "quantity" in item:
            q = item["quantity"]
            if not isinstance(q, (int, float)) or q < 0:
                raise ValueError(f"{item_id}: quantity must be a non-negative number, got {q!r}")


def get_db():
    client = MongoClient(MONGO_URI)
    match = MONGO_URI.rsplit("/", 1)
    db_name = match[1].split("?")[0] if len(match) == 2 and match[1] else "uk_rag_portal"
    if not db_name or ":" in db_name:
        db_name = "uk_rag_portal"
    return client, client[db_name]


def upsert_item(coll, item: Dict[str, Any], now: datetime) -> str:
    """Upsert one inventory item; returns 'inserted' | 'updated'."""
    doc = {
        "itemId": item["itemId"],
        "name": item["name"],
        "className": item["className"],
        "category": item["category"],
        "role": item["role"],
        "status": item["status"],
        "statusChangedAt": now,
        "statusSourceUrl": item.get("statusSourceUrl"),
        "statusSourceTitle": item.get("statusSourceTitle"),
        "notes": item.get("notes"),
        "updatedAt": now,
    }
    if "quantity" in item:
        doc["quantity"] = int(item["quantity"])
    result = coll.find_one_and_update(
        {"itemId": item["itemId"]},
        {
            "$set": doc,
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
        return_document=False,
    )
    return "updated" if result is not None else "inserted"


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the fleet_inventory collection.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete all existing items before seeding (destructive).",
    )
    args = parser.parse_args()

    print(f"[FleetSeed] Reading {SEED_PATH}")
    items = load_seed()
    print(f"[FleetSeed] Loaded {len(items)} item(s)")
    validate(items)
    print("[FleetSeed] Validation passed")

    client, db = get_db()
    coll = db["fleet_inventory"]

    try:
        if args.replace:
            removed = coll.delete_many({}).deleted_count
            print(f"[FleetSeed] --replace: removed {removed} existing item(s)")

        now = datetime.now(timezone.utc)
        inserted = 0
        updated = 0
        for item in items:
            verdict = upsert_item(coll, item, now)
            if verdict == "inserted":
                inserted += 1
            else:
                updated += 1

        print(f"[FleetSeed] Done. inserted={inserted} updated={updated}")

        counts: Dict[str, Dict[str, int]] = {}
        for doc in coll.find(
            {},
            {"_id": 0, "category": 1, "role": 1, "status": 1, "quantity": 1},
        ):
            cat = doc["category"]
            role = doc["role"]
            counts.setdefault(cat, {}).setdefault(role, 0)
            if doc["status"] in ("active", "refit"):
                q = doc.get("quantity")
                counts[cat][role] += int(q) if q is not None else 1
        print("[FleetSeed] Counted (sum of quantity for active+refit) by category/role:")
        for cat, by_role in sorted(counts.items()):
            print(f"  {cat}:")
            for role, n in sorted(by_role.items()):
                print(f"    {role}: {n}")
    finally:
        client.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
