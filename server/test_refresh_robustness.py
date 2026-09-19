"""Unit tests for daily-refresh robustness helpers."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

SERVER = Path(__file__).resolve().parent
if str(SERVER) not in sys.path:
    sys.path.insert(0, str(SERVER))


def _load(name: str, filename: str):
    path = SERVER / filename
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


class SourceRankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cron = _load("daily_refresh_under_test", "daily_data_refresh_cron.py")

    def test_monthly_later_month_ranks_higher(self):
        jul = self.cron.source_rank("2026 JUL", "2026 Q3")
        aug = self.cron.source_rank("2026 AUG", "2026 Q3")
        self.assertGreater(aug, jul)

    def test_later_quarter_ranks_higher(self):
        q2 = self.cron.source_rank("2026 JUN", "2026 Q2")
        q3 = self.cron.source_rank("2026 JUL", "2026 Q3")
        self.assertGreater(q3, q2)

    def test_slash_academic_year_normalises(self):
        self.assertEqual(self.cron.normalise_data_date("2025/26"), "2026 Q3")
        self.assertEqual(self.cron.normalise_data_date("202526"), "2026 Q3")


class SicknessRobustnessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sick = _load("sickness_under_test", "sickness_absence_cron.py")

    def test_upcoming_stub_detected(self):
        html = "<html>NHS Sickness Absence Rates, June 2026 (Upcoming, not yet published)</html>"
        self.assertTrue(self.sick.publication_is_upcoming(html))

    def test_published_page_not_upcoming(self):
        html = "<html>Official statistics Publication Date: 24 Jul 2026 Download CSV</html>"
        self.assertFalse(self.sick.publication_is_upcoming(html))

    def test_latest_month_wins_within_quarter(self):
        snaps = self.sick.quarter_snapshots_from_months({
            "2026-04": 3.50,
            "2026-05": 3.74,
            "2026-06": 3.60,
        })
        self.assertEqual(snaps["2026 Q2"], ("2026-06", 3.60))


class EnvLoaderTests(unittest.TestCase):
    def test_load_project_env_finds_repo_env(self):
        env = _load("env_loader_under_test", "env_loader.py")
        path = env.load_project_env(SERVER)
        self.assertIsNotNone(path)
        self.assertTrue(path.name == ".env" or path.exists())


if __name__ == "__main__":
    unittest.main()
