#!/usr/bin/env python3
"""
Unit tests for the Energy Prices metric (Ofgem default tariff cap).

These tests exercise the RAG bands, the Mongo loader's fallback path, and
the metric dict shape via monkeypatching — no MongoDB, no network.
"""
from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))

import economy_data_fetcher as fetcher  # noqa: E402


# ---------------------------------------------------------------------------
# RAG bands
# ---------------------------------------------------------------------------

class TestEnergyPricesRAG(unittest.TestCase):
    def test_green_at_or_below_1400(self):
        for v in (0, 1000, 1190, 1400):
            self.assertEqual(
                fetcher.calculate_energy_prices_rag(v),
                "green",
                f"\u00a3{v} should be green",
            )

    def test_amber_between_1400_and_2000(self):
        for v in (1401, 1641, 1800, 2000):
            self.assertEqual(
                fetcher.calculate_energy_prices_rag(v),
                "amber",
                f"\u00a3{v} should be amber",
            )

    def test_red_above_2000(self):
        for v in (2001, 2500, 3500, 5000):
            self.assertEqual(
                fetcher.calculate_energy_prices_rag(v),
                "red",
                f"\u00a3{v} should be red",
            )


# ---------------------------------------------------------------------------
# Fallback baseline
# ---------------------------------------------------------------------------

class TestFallbackBaseline(unittest.TestCase):
    def test_fallback_has_required_fields(self):
        c = fetcher._ofgem_cap_fallback()
        for field in (
            "componentKey", "name", "value", "effectivePeriod",
            "sourceUrl", "sourceTitle",
        ):
            self.assertIn(field, c, f"fallback missing field: {field}")

    def test_fallback_value_matches_april_2026_cap(self):
        c = fetcher._ofgem_cap_fallback()
        self.assertEqual(c["value"], 1641)
        self.assertIn("2026", c["effectivePeriod"])

    def test_fallback_url_points_to_ofgem(self):
        c = fetcher._ofgem_cap_fallback()
        self.assertIn("ofgem.gov.uk", c["sourceUrl"])


# ---------------------------------------------------------------------------
# fetch_energy_prices_data() — full path with patched component loader
# ---------------------------------------------------------------------------

class TestFetchEnergyPrices(unittest.TestCase):
    def test_fallback_when_component_missing(self):
        with mock.patch.object(fetcher, "load_ofgem_price_cap", return_value=None):
            m = fetcher.fetch_energy_prices_data()
        self.assertIsNotNone(m)
        self.assertEqual(m["metric_key"], "energy_prices")
        self.assertEqual(m["value"], 1641)
        self.assertEqual(m["rag_status"], "amber")
        # Unit deliberately empty - the \u00a3 prefix is applied client-side
        # by formatValue's POUND_PREFIX_KEYS set, so a non-empty unit here
        # would render as a duplicate suffix.
        self.assertEqual(m["unit"], "")
        self.assertIn("fallback baseline", m["data_source"])

    def test_uses_collection_value_when_present(self):
        custom = {
            "componentKey": "ofgem_price_cap",
            "name": "Test Ofgem cap",
            "value": 1200,
            "effectivePeriod": "1 Jul - 30 Sep 2026",
            "sourceUrl": "https://example.test/ofgem",
            "sourceTitle": "Ofgem test source",
        }
        with mock.patch.object(fetcher, "load_ofgem_price_cap", return_value=custom):
            m = fetcher.fetch_energy_prices_data()
        self.assertEqual(m["value"], 1200)
        self.assertEqual(m["rag_status"], "green")
        # data_source label flips when the collection-backed value is used
        self.assertNotIn("fallback baseline", m["data_source"])
        self.assertIn("economy_components", m["data_source"])

    def test_information_blurb_contains_citation_and_rag_notes(self):
        with mock.patch.object(fetcher, "load_ofgem_price_cap", return_value=None):
            m = fetcher.fetch_energy_prices_data()
        info = m["information"]
        # Citation surfaced
        self.assertIn("Ofgem", info)
        self.assertIn("ofgem.gov.uk", info)
        # RAG anchor explanation surfaced
        self.assertIn("1,400", info)
        self.assertIn("2,000", info)

    def test_metric_shape_matches_other_economy_metrics(self):
        with mock.patch.object(fetcher, "load_ofgem_price_cap", return_value=None):
            m = fetcher.fetch_energy_prices_data()
        for key in (
            "metric_name", "metric_key", "category", "value", "rag_status",
            "time_period", "data_source", "source_url", "last_updated",
            "information", "unit",
        ):
            self.assertIn(key, m, f"missing key: {key}")
        self.assertEqual(m["category"], "Economy")
        # Value must be a plain int (not e.g. a numpy type) so json.dumps works.
        self.assertIsInstance(m["value"], int)


if __name__ == "__main__":
    unittest.main()
