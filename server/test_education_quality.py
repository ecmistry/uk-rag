#!/usr/bin/env python3
"""
Unit tests for the Quality of University Education composite metric.

These tests exercise the formula, the RAG band, and the inventory-loader's
fallback path via monkeypatching — no MongoDB, no network.
"""
from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))

import education_data_fetcher as fetcher  # noqa: E402


# ---------------------------------------------------------------------------
# Composite formula
# ---------------------------------------------------------------------------

class TestUniversityEducationCompositeFormula(unittest.TestCase):
    def test_fallback_components_produce_82_7(self):
        score = fetcher.compute_university_education_quality(
            fetcher.UNIVERSITY_QUALITY_FALLBACK_COMPONENTS,
        )
        # 0.40 * 73.8 + 0.30 * 90.2 + 0.30 * 86.9 = 82.65 → 82.7
        self.assertEqual(score, 82.7)

    def test_all_zero_components_produce_zero(self):
        components = [
            {"componentKey": "graduate_outcomes", "value": 0, "weight": 0.40},
            {"componentKey": "continuation_rate", "value": 0, "weight": 0.30},
            {"componentKey": "nss_teaching_positive", "value": 0, "weight": 0.30},
        ]
        self.assertEqual(
            fetcher.compute_university_education_quality(components), 0.0,
        )

    def test_all_max_components_produce_one_hundred(self):
        components = [
            {"componentKey": "graduate_outcomes", "value": 100, "weight": 0.40},
            {"componentKey": "continuation_rate", "value": 100, "weight": 0.30},
            {"componentKey": "nss_teaching_positive", "value": 100, "weight": 0.30},
        ]
        self.assertEqual(
            fetcher.compute_university_education_quality(components), 100.0,
        )

    def test_out_of_range_values_clamped(self):
        components = [
            {"componentKey": "graduate_outcomes", "value": 250, "weight": 0.40},
            {"componentKey": "continuation_rate", "value": -50, "weight": 0.30},
            {"componentKey": "nss_teaching_positive", "value": 80, "weight": 0.30},
        ]
        # graduate_outcomes clamps to 100 (40 pts), continuation clamps to 0,
        # nss contributes 24 pts → 64.0.
        self.assertEqual(
            fetcher.compute_university_education_quality(components), 64.0,
        )

    def test_missing_components_skipped(self):
        components = [
            {"componentKey": "graduate_outcomes", "value": 80, "weight": 0.40},
            # other two components missing entirely
        ]
        # Only graduate_outcomes contributes: 80 * 0.40 = 32.0.
        self.assertEqual(
            fetcher.compute_university_education_quality(components), 32.0,
        )


# ---------------------------------------------------------------------------
# RAG bands
# ---------------------------------------------------------------------------

class TestUniversityEducationRAG(unittest.TestCase):
    def test_green_at_or_above_80(self):
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 80.0),
            "green",
        )
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 95.0),
            "green",
        )

    def test_amber_between_70_and_80(self):
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 70.0),
            "amber",
        )
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 75.0),
            "amber",
        )

    def test_red_below_70(self):
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 69.9),
            "red",
        )
        self.assertEqual(
            fetcher.calculate_rag_status("university_education_quality", 0.0),
            "red",
        )


# ---------------------------------------------------------------------------
# Fetcher — full path with patched component loader
# ---------------------------------------------------------------------------

class TestFetchUniversityEducationQuality(unittest.TestCase):
    def test_fallback_when_components_unavailable(self):
        with mock.patch.object(
            fetcher, "load_education_quality_components", return_value=None,
        ):
            metric = fetcher.fetch_university_education_quality_data()
        self.assertIsNotNone(metric)
        self.assertEqual(metric["metric_key"], "university_education_quality")
        self.assertEqual(metric["value"], 82.7)
        self.assertEqual(metric["rag_status"], "green")
        self.assertIn("fallback baseline", metric["data_source"])

    def test_information_blurb_contains_all_three_citations(self):
        with mock.patch.object(
            fetcher, "load_education_quality_components", return_value=None,
        ):
            metric = fetcher.fetch_university_education_quality_data()
        info = metric["information"]
        self.assertIn("HESA Graduate Outcomes", info)
        self.assertIn("HESA Student data", info)
        self.assertIn("Office for Students", info)
        # All three source URLs surfaced.
        self.assertIn("hesa.ac.uk", info)
        self.assertIn("officeforstudents.org.uk", info)

    def test_path_to_green_blurb_appears_when_below_80(self):
        low_components = [
            {"componentKey": "graduate_outcomes",
             "name": "Graduate Outcomes",
             "value": 60.0, "weight": 0.40,
             "reportingPeriod": "test", "sourceUrl": "https://x", "sourceTitle": "T"},
            {"componentKey": "continuation_rate",
             "name": "Continuation",
             "value": 80.0, "weight": 0.30,
             "reportingPeriod": "test", "sourceUrl": "https://x", "sourceTitle": "T"},
            {"componentKey": "nss_teaching_positive",
             "name": "NSS",
             "value": 70.0, "weight": 0.30,
             "reportingPeriod": "test", "sourceUrl": "https://x", "sourceTitle": "T"},
        ]
        with mock.patch.object(
            fetcher,
            "load_education_quality_components",
            return_value=low_components,
        ):
            metric = fetcher.fetch_university_education_quality_data()
        # 0.40*60 + 0.30*80 + 0.30*70 = 24 + 24 + 21 = 69.0
        self.assertEqual(metric["value"], 69.0)
        self.assertEqual(metric["rag_status"], "red")
        self.assertIn("To reach green", metric["information"])

    def test_metric_shape_matches_other_education_metrics(self):
        with mock.patch.object(
            fetcher, "load_education_quality_components", return_value=None,
        ):
            metric = fetcher.fetch_university_education_quality_data()
        for key in (
            "metric_name", "metric_key", "category", "value", "rag_status",
            "time_period", "data_source", "source_url", "last_updated",
            "information", "unit",
        ):
            self.assertIn(key, metric, f"missing key: {key}")
        self.assertEqual(metric["category"], "Education")
        self.assertEqual(metric["unit"], "%")


if __name__ == "__main__":
    unittest.main()
