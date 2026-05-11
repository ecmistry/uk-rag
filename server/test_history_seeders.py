#!/usr/bin/env python3
"""
Tests for the historical-data backfill seeders that provide trend-arrow
coverage on the two newest scorecards.

These tests pin:
  1. The presence and shape of the HISTORY constants in each seeder.
  2. The dataDate format (canonical "YYYY QN").
  3. The RAG-band helper inside each seeder agrees with the threshold
     constants in the corresponding fetcher.

The goal is to catch silent regressions where someone removes a row from
the seeded history (which would make the dashboard trend arrow vanish)
or introduces a typo in the dataDate format (which would silently break
sort ordering in the metric-history view).
"""
from __future__ import annotations

import importlib.util
import os
import re
import sys
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, "server"))

# Load the seeders by path so we don't depend on scripts/ being a package.
def _load_module(name: str, relative_path: str):
    abs_path = os.path.join(REPO_ROOT, relative_path)
    spec = importlib.util.spec_from_file_location(name, abs_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {relative_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


energy_hist = _load_module(
    "seed_energy_prices_history",
    "scripts/seed_energy_prices_history.py",
)
edu_hist = _load_module(
    "seed_education_quality_history",
    "scripts/seed_education_quality_history.py",
)

import economy_data_fetcher  # noqa: E402
import education_data_fetcher  # noqa: E402


CANONICAL_DATE = re.compile(r"^\d{4} Q[1-4]$")


# ---------------------------------------------------------------------------
# Energy Prices history
# ---------------------------------------------------------------------------

class TestEnergyPricesHistorySeed(unittest.TestCase):
    def test_history_has_at_least_one_prior_quarter(self):
        # At least one prior period so the trend arrow renders on the
        # dashboard the moment the seeder runs.
        self.assertGreaterEqual(len(energy_hist.HISTORY), 1)

    def test_each_row_uses_canonical_date_format(self):
        for data_date, _, _, _ in energy_hist.HISTORY:
            self.assertRegex(data_date, CANONICAL_DATE, data_date)

    def test_values_are_positive_pounds(self):
        for data_date, value, _, _ in energy_hist.HISTORY:
            self.assertIsInstance(value, int, f"{data_date} value not int: {value!r}")
            self.assertGreater(value, 500, f"{data_date} suspiciously low: \u00a3{value}")
            self.assertLess(value, 10000, f"{data_date} suspiciously high: \u00a3{value}")

    def test_rag_band_helper_matches_fetcher(self):
        # Boundary cases per the fetcher's calculate_energy_prices_rag.
        cases = [
            (1000, "green"),
            (1400, "green"),
            (1401, "amber"),
            (1758, "amber"),  # 2026 Q1 seed
            (1849, "amber"),  # 2025 Q2 seed
            (2000, "amber"),
            (2001, "red"),
            (3000, "red"),
        ]
        for value, expected in cases:
            self.assertEqual(
                energy_hist.rag_band(value),
                expected,
                f"\u00a3{value} should be {expected}",
            )
            # And cross-check against the fetcher's own band function so the
            # two never drift.
            self.assertEqual(
                economy_data_fetcher.calculate_energy_prices_rag(value),
                expected,
            )

    def test_source_url_points_to_ofgem(self):
        for _, _, _, source_url in energy_hist.HISTORY:
            self.assertIn("ofgem.gov.uk", source_url)

    def test_pinned_specific_quarters(self):
        # Pin the exact rows we seeded so removing one is a test failure
        # rather than a silently-vanished trend arrow.
        by_date = {row[0]: row[1] for row in energy_hist.HISTORY}
        self.assertEqual(by_date.get("2025 Q2"), 1849)
        self.assertEqual(by_date.get("2026 Q1"), 1758)


# ---------------------------------------------------------------------------
# University Education Quality history
# ---------------------------------------------------------------------------

class TestEducationQualityHistorySeed(unittest.TestCase):
    def test_history_has_at_least_one_prior_period(self):
        self.assertGreaterEqual(len(edu_hist.HISTORY), 1)

    def test_each_row_uses_canonical_date_format(self):
        for data_date, _, _, _ in edu_hist.HISTORY:
            self.assertRegex(data_date, CANONICAL_DATE, data_date)

    def test_composite_values_in_zero_to_hundred_range(self):
        for data_date, value, _, _ in edu_hist.HISTORY:
            self.assertGreaterEqual(value, 0)
            self.assertLessEqual(value, 100)

    def test_rag_band_helper_matches_fetcher(self):
        cases = [
            (60.0, "red"),
            (69.9, "red"),
            (70.0, "amber"),
            (79.9, "amber"),
            (80.0, "green"),
            (82.2, "green"),  # seeded value
            (82.7, "green"),  # live value
            (95.0, "green"),
        ]
        for value, expected in cases:
            self.assertEqual(edu_hist.rag_band(value), expected)
            self.assertEqual(
                education_data_fetcher.calculate_rag_status(
                    "university_education_quality", value,
                ),
                expected,
            )

    def test_pinned_2025_q3_value(self):
        by_date = {row[0]: row[1] for row in edu_hist.HISTORY}
        self.assertAlmostEqual(by_date.get("2025 Q3", 0), 82.2, places=1)

    def test_composite_formula_reproduces_seeded_value(self):
        # The seeded 82.2 must equal:
        #   0.40 * 73.8 + 0.30 * 90.2 + 0.30 * 85.3 = 82.17
        components = [
            {"componentKey": "graduate_outcomes", "value": 73.8, "weight": 0.40},
            {"componentKey": "continuation_rate", "value": 90.2, "weight": 0.30},
            {"componentKey": "nss_teaching_positive", "value": 85.3, "weight": 0.30},
        ]
        score = education_data_fetcher.compute_university_education_quality(components)
        # The seeded 82.2 is the 1dp rounded composite of these inputs.
        self.assertEqual(score, 82.2)

    def test_source_url_points_to_ofs(self):
        for _, _, _, source_url in edu_hist.HISTORY:
            self.assertIn("officeforstudents.org.uk", source_url)


if __name__ == "__main__":
    unittest.main()
