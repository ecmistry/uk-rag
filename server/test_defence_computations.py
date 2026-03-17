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
    compute_combined_sustainability_score,
    calculate_rag_status,
    get_sea_mass_information,
    get_land_mass_information,
    get_air_mass_information,
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
        self.assertEqual(calculate_rag_status("defence_spending_gdp", 2.1), "amber")

    def test_defence_spending_red(self):
        self.assertEqual(calculate_rag_status("defence_spending_gdp", 1.9), "red")

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


class TestCombinedSustainabilityScore(unittest.TestCase):
    def test_returns_valid_range(self):
        score = compute_combined_sustainability_score()
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 100)

    def test_returns_float(self):
        score = compute_combined_sustainability_score()
        self.assertIsInstance(score, float)


class TestRAGStatusExtended(unittest.TestCase):
    """RAG status for defence metrics not covered in TestRAGStatus."""

    def test_equipment_readiness_green(self):
        self.assertEqual(calculate_rag_status("equipment_readiness", 92.0), "green")

    def test_equipment_readiness_amber(self):
        self.assertEqual(calculate_rag_status("equipment_readiness", 80.0), "amber")

    def test_equipment_readiness_red(self):
        self.assertEqual(calculate_rag_status("equipment_readiness", 60.0), "red")

    def test_personnel_strength_green(self):
        self.assertEqual(calculate_rag_status("personnel_strength", 96.0), "green")

    def test_personnel_strength_amber(self):
        self.assertEqual(calculate_rag_status("personnel_strength", 90.0), "amber")

    def test_personnel_strength_red(self):
        self.assertEqual(calculate_rag_status("personnel_strength", 80.0), "red")

    def test_equipment_spend_green(self):
        self.assertEqual(calculate_rag_status("equipment_spend", 35.0), "green")

    def test_equipment_spend_amber(self):
        self.assertEqual(calculate_rag_status("equipment_spend", 30.0), "amber")

    def test_equipment_spend_red(self):
        self.assertEqual(calculate_rag_status("equipment_spend", 20.0), "red")

    def test_deployability_green(self):
        self.assertEqual(calculate_rag_status("deployability", 90.0), "green")

    def test_deployability_amber(self):
        self.assertEqual(calculate_rag_status("deployability", 80.0), "amber")

    def test_deployability_red(self):
        self.assertEqual(calculate_rag_status("deployability", 60.0), "red")

    def test_defence_industry_vitality_green(self):
        self.assertEqual(calculate_rag_status("defence_industry_vitality", 95.0), "green")

    def test_defence_industry_vitality_amber(self):
        self.assertEqual(calculate_rag_status("defence_industry_vitality", 75.0), "amber")

    def test_defence_industry_vitality_red(self):
        self.assertEqual(calculate_rag_status("defence_industry_vitality", 50.0), "red")

    def test_combined_sustainability_green(self):
        self.assertEqual(calculate_rag_status("combined_sustainability", 92.0), "green")

    def test_combined_sustainability_red(self):
        self.assertEqual(calculate_rag_status("combined_sustainability", 65.0), "red")

    def test_boundary_exactly_green(self):
        self.assertEqual(calculate_rag_status("sea_mass", 90.0), "green")

    def test_boundary_just_below_green(self):
        self.assertEqual(calculate_rag_status("sea_mass", 89.9), "amber")

    def test_boundary_exactly_amber(self):
        self.assertEqual(calculate_rag_status("sea_mass", 70.0), "amber")

    def test_boundary_just_below_amber(self):
        self.assertEqual(calculate_rag_status("sea_mass", 69.9), "red")


class TestLandMassInformation(unittest.TestCase):
    def test_returns_string(self):
        info = get_land_mass_information("2026 Q1")
        self.assertIsInstance(info, str)
        self.assertGreater(len(info), 0)

    def test_includes_date(self):
        info = get_land_mass_information("2026 Q1")
        self.assertIn("2026 Q1", info)


class TestAirMassInformation(unittest.TestCase):
    def test_returns_string(self):
        info = get_air_mass_information("2026 Q1")
        self.assertIsInstance(info, str)
        self.assertGreater(len(info), 0)

    def test_includes_date(self):
        info = get_air_mass_information("2026 Q1")
        self.assertIn("2026 Q1", info)


if __name__ == "__main__":
    unittest.main()
