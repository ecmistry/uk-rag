#!/usr/bin/env python3
"""
Round-trip tests for the Mongo inventory/component loaders used by the
defence and education/economy fetchers.

These tests patch `pymongo.MongoClient` at the boundary so the loader
functions run all the way through their connect/query/close logic. This
catches bugs in the actual Mongo read path that higher-level mocks (which
patch the loader function itself) would mask.

Loaders covered:
  - economy_data_fetcher.load_ofgem_price_cap
  - education_data_fetcher.load_education_quality_components
  - defence_data_fetcher.load_inventory_for_category (sea / land / air)
"""
from __future__ import annotations

import importlib
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))


class FakeCollection:
    """Minimal stand-in for a Mongo collection that returns canned docs."""

    def __init__(self, docs=None, raises=None):
        self._docs = list(docs or [])
        self._raises = raises

    def find(self, query=None, projection=None):
        if self._raises:
            raise self._raises
        # Mimic pymongo's behavior of returning a cursor over a list.
        return iter(self._docs)

    def find_one(self, query=None, projection=None):
        if self._raises:
            raise self._raises
        for d in self._docs:
            if all(d.get(k) == v for k, v in (query or {}).items()):
                return d
        return None


class FakeDb:
    def __init__(self, collections=None):
        self._collections = collections or {}

    def __getitem__(self, name):
        return self._collections.get(name, FakeCollection())


class FakeClient:
    def __init__(self, db_or_collections, ping_raises=None):
        if isinstance(db_or_collections, FakeDb):
            self._db = db_or_collections
        else:
            self._db = FakeDb(db_or_collections)
        self.admin = mock.MagicMock()
        if ping_raises:
            self.admin.command = mock.MagicMock(side_effect=ping_raises)
        else:
            self.admin.command = mock.MagicMock(return_value={"ok": 1})

    def __getitem__(self, _name):
        return self._db

    def close(self):
        pass


def _patch_mongo(loaders_module, fake_client):
    """Patch pymongo.MongoClient inside the function under test's local import."""
    return mock.patch.object(
        importlib.import_module("pymongo"), "MongoClient",
        return_value=fake_client,
    )


# ---------------------------------------------------------------------------
# economy_data_fetcher.load_ofgem_price_cap
# ---------------------------------------------------------------------------

class TestLoadOfgemPriceCap(unittest.TestCase):
    def setUp(self):
        # Re-import so patches take effect on each test.
        import economy_data_fetcher as efm  # noqa: F401
        self.efm = efm

    def test_returns_doc_when_collection_has_one(self):
        doc = {
            "componentKey": "ofgem_price_cap",
            "value": 1641,
            "effectivePeriod": "1 Apr - 30 Jun 2026",
        }
        fake = FakeClient({"economy_components": FakeCollection([doc])})
        with _patch_mongo(self.efm, fake):
            result = self.efm.load_ofgem_price_cap()
        self.assertIsNotNone(result)
        self.assertEqual(result["componentKey"], "ofgem_price_cap")
        self.assertEqual(result["value"], 1641)

    def test_returns_none_when_collection_empty(self):
        fake = FakeClient({"economy_components": FakeCollection([])})
        with _patch_mongo(self.efm, fake):
            result = self.efm.load_ofgem_price_cap()
        self.assertIsNone(result)

    def test_returns_none_when_mongo_ping_fails(self):
        fake = FakeClient(
            {"economy_components": FakeCollection([])},
            ping_raises=RuntimeError("connection refused"),
        )
        with _patch_mongo(self.efm, fake):
            result = self.efm.load_ofgem_price_cap()
        self.assertIsNone(result)


# ---------------------------------------------------------------------------
# education_data_fetcher.load_education_quality_components
# ---------------------------------------------------------------------------

class TestLoadEducationQualityComponents(unittest.TestCase):
    def setUp(self):
        import education_data_fetcher as edm
        self.edm = edm

    def test_returns_components_when_collection_populated(self):
        docs = [
            {"componentKey": "graduate_outcomes", "value": 73.8, "weight": 0.40},
            {"componentKey": "continuation_rate", "value": 90.2, "weight": 0.30},
            {"componentKey": "nss_teaching_positive", "value": 86.9, "weight": 0.30},
        ]
        fake = FakeClient(
            {"education_quality_components": FakeCollection(docs)}
        )
        with _patch_mongo(self.edm, fake):
            result = self.edm.load_education_quality_components()
        self.assertEqual(len(result), 3)
        keys = {c["componentKey"] for c in result}
        self.assertEqual(
            keys,
            {"graduate_outcomes", "continuation_rate", "nss_teaching_positive"},
        )

    def test_returns_none_when_empty(self):
        fake = FakeClient(
            {"education_quality_components": FakeCollection([])}
        )
        with _patch_mongo(self.edm, fake):
            result = self.edm.load_education_quality_components()
        self.assertIsNone(result)

    def test_returns_none_on_read_exception(self):
        fake = FakeClient(
            {"education_quality_components": FakeCollection(
                raises=RuntimeError("query failed"),
            )}
        )
        with _patch_mongo(self.edm, fake):
            result = self.edm.load_education_quality_components()
        self.assertIsNone(result)


# ---------------------------------------------------------------------------
# defence_data_fetcher.load_inventory_for_category
# ---------------------------------------------------------------------------

class TestLoadFleetInventory(unittest.TestCase):
    def setUp(self):
        import defence_data_fetcher as dfm
        self.dfm = dfm

    def _hull(self, item_id, role, status, category="sea_mass", quantity=None):
        d = {
            "itemId": item_id,
            "name": item_id,
            "className": "test class",
            "category": category,
            "role": role,
            "status": status,
        }
        if quantity is not None:
            d["quantity"] = quantity
        return d

    def test_counts_active_and_refit_only_for_sea_mass(self):
        docs = [
            self._hull("hms-a", "escort", "active"),
            self._hull("hms-b", "escort", "active"),
            self._hull("hms-c", "escort", "refit"),
            self._hull("hms-d", "escort", "withdrawn"),
            self._hull("hms-e", "escort", "decommissioned"),
        ]
        fake = FakeClient({"fleet_inventory": FakeCollection(docs)})
        with _patch_mongo(self.dfm, fake):
            result = self.dfm.load_inventory_for_category("sea_mass")
        self.assertEqual(result["counts"]["escort"], 3)
        # Two non-counted hulls land in recent_changes.
        self.assertEqual(len(result["recent_changes"]), 2)

    def test_sums_quantity_field_for_land_mass(self):
        docs = [
            self._hull("warrior", "afv", "active", category="land_mass", quantity=632),
            self._hull("ajax", "afv", "active", category="land_mass", quantity=50),
            self._hull("mastiff", "afv", "active", category="land_mass", quantity=20),
        ]
        fake = FakeClient({"fleet_inventory": FakeCollection(docs)})
        with _patch_mongo(self.dfm, fake):
            result = self.dfm.load_inventory_for_category("land_mass")
        self.assertEqual(result["counts"]["afv"], 702)

    def test_returns_none_when_category_has_no_rows(self):
        fake = FakeClient({"fleet_inventory": FakeCollection([])})
        with _patch_mongo(self.dfm, fake):
            result = self.dfm.load_inventory_for_category("air_mass")
        self.assertIsNone(result)

    def test_returns_none_on_mongo_failure(self):
        fake = FakeClient(
            {"fleet_inventory": FakeCollection(raises=RuntimeError("read error"))}
        )
        with _patch_mongo(self.dfm, fake):
            result = self.dfm.load_inventory_for_category("sea_mass")
        self.assertIsNone(result)

    def test_quantity_zero_explicitly_contributes_zero(self):
        # The autonomous-platforms row uses quantity 0 — must be honoured
        # (not silently defaulted to 1).
        docs = [
            self._hull("acp", "autonomous", "active",
                       category="air_mass", quantity=0),
        ]
        fake = FakeClient({"fleet_inventory": FakeCollection(docs)})
        with _patch_mongo(self.dfm, fake):
            result = self.dfm.load_inventory_for_category("air_mass")
        self.assertEqual(result["counts"]["autonomous"], 0)


if __name__ == "__main__":
    unittest.main()
