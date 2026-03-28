import { describe, it, expect } from "vitest";
import {
  METRIC_DIRECTION,
  getTrendSentiment,
} from "./metricDirections";
import { EXPECTED_METRICS } from "./expectedMetrics";

describe("METRIC_DIRECTION coverage", () => {
  it("every metric in EXPECTED_METRICS has a direction", () => {
    const missing: string[] = [];
    for (const [, slots] of Object.entries(EXPECTED_METRICS)) {
      for (const slot of slots) {
        if (!METRIC_DIRECTION[slot.metricKey]) {
          missing.push(slot.metricKey);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("getTrendSentiment", () => {
  describe("higher_better metrics", () => {
    it("returns positive when value goes up", () => {
      expect(getTrendSentiment("real_gdp_growth", 2.5, 1.5)).toBe("positive");
    });

    it("returns negative when value goes down", () => {
      expect(getTrendSentiment("real_gdp_growth", 1.0, 2.0)).toBe("negative");
    });

    it("returns neutral when unchanged", () => {
      expect(getTrendSentiment("real_gdp_growth", 2.0, 2.0)).toBe("neutral");
    });
  });

  describe("lower_better metrics", () => {
    it("returns positive when value goes down (e.g. crime falls)", () => {
      expect(getTrendSentiment("crown_court_backlog", 80, 90)).toBe("positive");
    });

    it("returns negative when value goes up (e.g. crime rises)", () => {
      expect(getTrendSentiment("crown_court_backlog", 95, 85)).toBe("negative");
    });

    it("returns neutral when unchanged", () => {
      expect(getTrendSentiment("inactivity_rate", 20, 20)).toBe("neutral");
    });
  });

  describe("target_band metrics", () => {
    it("CPI: moving towards band is positive", () => {
      // Band is 1.5–2.5; moving from 4.0 to 3.0 is closer = positive
      expect(getTrendSentiment("cpi_inflation", 3.0, 4.0)).toBe("positive");
    });

    it("CPI: moving away from band is negative", () => {
      // Band is 1.5–2.5; moving from 3.0 to 5.0 is farther = negative
      expect(getTrendSentiment("cpi_inflation", 5.0, 3.0)).toBe("negative");
    });

    it("CPI: both inside band is neutral", () => {
      expect(getTrendSentiment("cpi_inflation", 2.0, 1.8)).toBe("neutral");
    });

    it("returns neutral for metric with no target band entry", () => {
      expect(getTrendSentiment("net_migration", 350, 500)).toBe("neutral");
    });
  });

  describe("edge cases", () => {
    it("returns neutral for NaN currentValue", () => {
      expect(getTrendSentiment("real_gdp_growth", NaN, 1.0)).toBe("neutral");
    });

    it("returns neutral for NaN previousValue", () => {
      expect(getTrendSentiment("real_gdp_growth", 1.0, NaN)).toBe("neutral");
    });

    it("returns neutral for Infinity", () => {
      expect(getTrendSentiment("real_gdp_growth", Infinity, 1.0)).toBe("neutral");
    });

    it("returns neutral for -Infinity", () => {
      expect(getTrendSentiment("real_gdp_growth", 1.0, -Infinity)).toBe("neutral");
    });

    it("returns neutral for unknown metric key", () => {
      expect(getTrendSentiment("unknown_metric_xyz", 10, 5)).toBe("neutral");
    });

    it("returns neutral when both are NaN", () => {
      expect(getTrendSentiment("real_gdp_growth", NaN, NaN)).toBe("neutral");
    });
  });
});
