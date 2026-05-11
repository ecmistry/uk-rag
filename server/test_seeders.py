#!/usr/bin/env python3
"""
Tests for the three seeder scripts:
  scripts/seed_fleet_inventory.py
  scripts/seed_education_components.py
  scripts/seed_economy_components.py

These tests exercise the `validate(...)` functions directly with crafted
good and bad inputs. The validation surface is where bad seed data fails
fast (before any Mongo write), so locking down rejection rules keeps the
seeders trustworthy as new components are added.
"""
from __future__ import annotations

import importlib.util
import json
import os
import sys
import unittest
from typing import Any, Dict, List

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_module(module_name: str, relative_path: str):
    """Load a Python module by file path so we don't depend on package layout."""
    abs_path = os.path.join(REPO_ROOT, relative_path)
    spec = importlib.util.spec_from_file_location(module_name, abs_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {relative_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


# Loaded once per test module.
seed_fleet = _load_module("seed_fleet_inventory", "scripts/seed_fleet_inventory.py")
seed_edu = _load_module(
    "seed_education_components", "scripts/seed_education_components.py"
)
seed_eco = _load_module(
    "seed_economy_components", "scripts/seed_economy_components.py"
)


# ---------------------------------------------------------------------------
# seed_fleet_inventory.py
# ---------------------------------------------------------------------------

def _valid_fleet_item(**overrides) -> Dict[str, Any]:
    base = {
        "itemId": "hms-test",
        "name": "HMS Test",
        "className": "Test class",
        "category": "sea_mass",
        "role": "escort",
        "status": "active",
    }
    base.update(overrides)
    return base


class TestSeedFleetInventoryValidation(unittest.TestCase):
    def test_valid_item_passes(self):
        seed_fleet.validate([_valid_fleet_item()])

    def test_missing_itemId_rejected(self):
        bad = _valid_fleet_item()
        del bad["itemId"]
        with self.assertRaisesRegex(ValueError, "itemId"):
            seed_fleet.validate([bad])

    def test_duplicate_itemId_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            seed_fleet.validate([
                _valid_fleet_item(itemId="dup"),
                _valid_fleet_item(itemId="dup", name="HMS Test 2"),
            ])

    def test_invalid_category_rejected(self):
        with self.assertRaisesRegex(ValueError, "category"):
            seed_fleet.validate([_valid_fleet_item(category="space_mass")])

    def test_invalid_status_rejected(self):
        with self.assertRaisesRegex(ValueError, "status"):
            seed_fleet.validate([_valid_fleet_item(status="mothballed")])

    def test_missing_role_rejected(self):
        with self.assertRaisesRegex(ValueError, "role"):
            seed_fleet.validate([_valid_fleet_item(role="")])

    def test_negative_quantity_rejected(self):
        with self.assertRaisesRegex(ValueError, "quantity"):
            seed_fleet.validate([_valid_fleet_item(quantity=-5)])

    def test_quantity_zero_allowed(self):
        # Zero is a valid quantity (e.g. autonomous combat platforms = 0).
        seed_fleet.validate([_valid_fleet_item(quantity=0)])

    def test_comment_blocks_are_skipped(self):
        # Free-form _comment blocks should not be validated as items.
        seed_fleet.validate([
            {"_comment": ["section label"]},
            _valid_fleet_item(),
        ])

    def test_real_seed_file_validates(self):
        """The shipped seed JSON must always pass validation."""
        items = seed_fleet.load_seed()
        seed_fleet.validate(items)
        self.assertGreater(len(items), 0)


# ---------------------------------------------------------------------------
# seed_education_components.py
# ---------------------------------------------------------------------------

def _valid_edu_components() -> List[Dict[str, Any]]:
    return [
        {
            "itemId": "graduate_outcomes_high_skilled",
            "componentKey": "graduate_outcomes",
            "name": "Graduate Outcomes",
            "value": 73.8,
            "weight": 0.40,
            "reportingPeriod": "2022/23 cohort",
            "sourceUrl": "https://www.hesa.ac.uk/",
            "sourceTitle": "HESA",
        },
        {
            "itemId": "continuation_rate",
            "componentKey": "continuation_rate",
            "name": "Continuation rate",
            "value": 90.2,
            "weight": 0.30,
            "reportingPeriod": "2021/22 entry",
            "sourceUrl": "https://www.hesa.ac.uk/",
            "sourceTitle": "HESA",
        },
        {
            "itemId": "nss_teaching_positive",
            "componentKey": "nss_teaching_positive",
            "name": "NSS",
            "value": 86.9,
            "weight": 0.30,
            "reportingPeriod": "NSS 2025",
            "sourceUrl": "https://www.officeforstudents.org.uk/",
            "sourceTitle": "OfS",
        },
    ]


class TestSeedEducationComponentsValidation(unittest.TestCase):
    def test_valid_components_pass(self):
        seed_edu.validate(_valid_edu_components())

    def test_weights_must_sum_to_one(self):
        components = _valid_edu_components()
        components[0]["weight"] = 0.50  # Sum becomes 1.10
        with self.assertRaisesRegex(ValueError, "weights must sum to 1"):
            seed_edu.validate(components)

    def test_value_out_of_range_rejected(self):
        components = _valid_edu_components()
        components[0]["value"] = 150
        with self.assertRaisesRegex(ValueError, "value"):
            seed_edu.validate(components)

    def test_negative_value_rejected(self):
        components = _valid_edu_components()
        components[0]["value"] = -1
        with self.assertRaisesRegex(ValueError, "value"):
            seed_edu.validate(components)

    def test_invalid_component_key_rejected(self):
        components = _valid_edu_components()
        components[0]["componentKey"] = "made_up_key"
        with self.assertRaisesRegex(ValueError, "componentKey"):
            seed_edu.validate(components)

    def test_duplicate_component_key_rejected(self):
        components = _valid_edu_components()
        components[1]["componentKey"] = components[0]["componentKey"]
        with self.assertRaisesRegex(ValueError, "duplicate componentKey"):
            seed_edu.validate(components)

    def test_missing_required_field_rejected(self):
        components = _valid_edu_components()
        del components[0]["sourceUrl"]
        with self.assertRaisesRegex(ValueError, "sourceUrl"):
            seed_edu.validate(components)

    def test_real_seed_file_validates(self):
        components = seed_edu.load_seed()
        seed_edu.validate(components)
        # The shipped composite must always have its weights summing to 1.0.
        total = sum(float(c["weight"]) for c in components)
        self.assertAlmostEqual(total, 1.0, places=3)


# ---------------------------------------------------------------------------
# seed_economy_components.py
# ---------------------------------------------------------------------------

def _valid_economy_component(**overrides) -> Dict[str, Any]:
    base = {
        "itemId": "ofgem_price_cap",
        "componentKey": "ofgem_price_cap",
        "name": "Ofgem default tariff cap",
        "value": 1641,
        "effectivePeriod": "1 Apr - 30 Jun 2026",
        "sourceUrl": "https://www.ofgem.gov.uk/",
        "sourceTitle": "Ofgem",
    }
    base.update(overrides)
    return base


class TestSeedEconomyComponentsValidation(unittest.TestCase):
    def test_valid_component_passes(self):
        seed_eco.validate([_valid_economy_component()])

    def test_missing_itemId_rejected(self):
        c = _valid_economy_component()
        del c["itemId"]
        with self.assertRaisesRegex(ValueError, "itemId"):
            seed_eco.validate([c])

    def test_invalid_componentKey_rejected(self):
        with self.assertRaisesRegex(ValueError, "componentKey"):
            seed_eco.validate([_valid_economy_component(componentKey="brent_crude")])

    def test_negative_value_rejected(self):
        with self.assertRaisesRegex(ValueError, "non-negative"):
            seed_eco.validate([_valid_economy_component(value=-100)])

    def test_missing_required_field_rejected(self):
        c = _valid_economy_component()
        del c["sourceUrl"]
        with self.assertRaisesRegex(ValueError, "sourceUrl"):
            seed_eco.validate([c])

    def test_real_seed_file_validates(self):
        components = seed_eco.load_seed()
        seed_eco.validate(components)
        self.assertGreater(len(components), 0)


# ---------------------------------------------------------------------------
# Cross-seeder consistency: every shipped seed file references real Mongo
# component keys that the corresponding fetcher knows how to consume.
# ---------------------------------------------------------------------------

class TestSeedFileShipsCorrectComponentKeys(unittest.TestCase):
    def test_economy_seed_keys_match_seeder_allowlist(self):
        components = seed_eco.load_seed()
        for c in components:
            self.assertIn(c["componentKey"], seed_eco.ALLOWED_COMPONENT_KEYS)

    def test_education_seed_keys_match_seeder_allowlist(self):
        components = seed_edu.load_seed()
        for c in components:
            self.assertIn(c["componentKey"], seed_edu.ALLOWED_COMPONENT_KEYS)

    def test_fleet_seed_statuses_are_recognised(self):
        items = seed_fleet.load_seed()
        for it in items:
            self.assertIn(it["status"], seed_fleet.ALLOWED_STATUSES)


if __name__ == "__main__":
    unittest.main()
