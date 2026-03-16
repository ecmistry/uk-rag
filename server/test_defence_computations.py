#!/usr/bin/env python3
"""Tests for defence metric computation functions."""
from __future__ import annotations

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from defence_data_fetcher import (
    compute_sea_mass_score,
    compute_land_mass_score,
    compute_air_mass_score,
    calculate_rag_status,
    get_sea_mass_information,
    get_sea_mass_path_to_green,
    get_land_mass_path_to_green,
    get_air_mass_path_to_green,
)


class TestSeaMassScore(unittest.TestCase):
    def test_default_uk_values(self):
        score = compute_sea_mass_score()
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)

    def test_all_zeros_produces_zero(self):
        score = compute_sea_mass_score(
            carriers=0, ssbns=0, ssns=0, escorts=0, rfa=0, patrol_mcm=0
        )
        self.assertEqual(score, 0.0)

    def test_at_target_produces_100(self):
        score = compute_sea_mass_score(
            carriers=3, ssbns=4, ssns=12, escorts=24, rfa=12, patrol_mcm=24
        )
        self.assertEqual(score, 100.0)

    def test_above_target_capped_at_100(self):
        score = compute_sea_mass_score(
            carriers=10, ssbns=10, ssns=50, escorts=50, rfa=50, patrol_mcm=50
        )
        self.assertEqual(score, 100.0)

    def test_negative_inputs_clamped_to_zero(self):
        score = compute_sea_mass_score(
            carriers=-5, ssbns=-2, ssns=-1, escorts=-3, rfa=-1, patrol_mcm=-1
        )
        self.assertEqual(score, 0.0)

    def test_partial_fleet(self):
        score = compute_sea_mass_score(
            carriers=1, ssbns=2, ssns=3, escorts=12, rfa=6, patrol_mcm=12
        )
        self.assertGreater(score, 0)
        self.assertLess(score, 100)


class TestLandMassScore(unittest.TestCase):
    def test_returns_valid_range(self):
        score = compute_land_mass_score()
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)


class TestAirMassScore(unittest.TestCase):
    def test_returns_valid_range(self):
        score = compute_air_mass_score()
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)


class TestRAGStatus(unittest.TestCase):
    def test_sea_mass_green(self):
        self.assertEqual(calculate_rag_status("sea_mass", 95.0), "green")

    def test_sea_mass_amber(self):
        self.assertEqual(calculate_rag_status("sea_mass", 80.0), "amber")

    def test_sea_mass_red(self):
        self.assertEqual(calculate_rag_status("sea_mass", 60.0), "red")

    def test_land_mass_green(self):
        self.assertEqual(calculate_rag_status("land_mass", 92.0), "green")

    def test_air_mass_red(self):
        self.assertEqual(calculate_rag_status("air_mass", 50.0), "red")

    def test_defence_spending_green(self):
        self.assertEqual(calculate_rag_status("defence_spending_gdp", 2.5), "green")

    def test_defence_spending_amber(self):
        self.assertEqual(calculate_rag_status("defence_spending_gdp", 1.9), "amber")

    def test_defence_spending_red(self):
        self.assertEqual(calculate_rag_status("defence_spending_gdp", 1.5), "red")

    def test_unknown_metric_returns_amber(self):
        self.assertEqual(calculate_rag_status("unknown_metric", 42.0), "amber")


class TestSeaMassInformation(unittest.TestCase):
    def test_returns_string(self):
        info = get_sea_mass_information("2026 Q1")
        self.assertIsInstance(info, str)
        self.assertIn("2026 Q1", info)
        self.assertIn("aircraft carrier", info)

    def test_includes_vessel_counts(self):
        info = get_sea_mass_information("2026 Q1", carriers=2, ssns=6)
        self.assertIn("2", info)
        self.assertIn("6", info)


class TestPathToGreen(unittest.TestCase):
    def test_sea_mass_already_green(self):
        result = get_sea_mass_path_to_green(current_score=95.0)
        self.assertEqual(result, "")

    def test_sea_mass_not_green(self):
        result = get_sea_mass_path_to_green(current_score=70.0)
        self.assertIn("To reach green", result)

    def test_land_mass_already_green(self):
        result = get_land_mass_path_to_green(current_score=95.0)
        self.assertEqual(result, "")

    def test_land_mass_not_green(self):
        result = get_land_mass_path_to_green(current_score=60.0)
        self.assertIn("To reach green", result)

    def test_air_mass_already_green(self):
        result = get_air_mass_path_to_green(current_score=92.0)
        self.assertEqual(result, "")

    def test_air_mass_not_green(self):
        result = get_air_mass_path_to_green(current_score=50.0)
        self.assertIn("To reach green", result)


if __name__ == "__main__":
    unittest.main()
