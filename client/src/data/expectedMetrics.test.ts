import { describe, it, expect } from "vitest";
import { EXPECTED_METRICS } from "./expectedMetrics";
import { METRIC_DIRECTION } from "./metricDirections";
import {
  getEconomyTooltip,
  getEmploymentTooltip,
  getEducationTooltip,
  getCrimeTooltip,
  getHealthcareTooltip,
  getDefenceTooltip,
  getPopulationTooltip,
} from "./metricTooltips";

const tooltipFns: Record<string, (key: string) => string | undefined> = {
  Economy: getEconomyTooltip,
  Employment: getEmploymentTooltip,
  Education: getEducationTooltip,
  Crime: getCrimeTooltip,
  Healthcare: getHealthcareTooltip,
  Defence: getDefenceTooltip,
  Population: getPopulationTooltip,
};

describe("EXPECTED_METRICS", () => {
  it("has no duplicate metricKeys across all categories", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const [, slots] of Object.entries(EXPECTED_METRICS)) {
      for (const slot of slots) {
        if (seen.has(slot.metricKey)) dupes.push(slot.metricKey);
        seen.add(slot.metricKey);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("has no duplicate metricKeys within a single category", () => {
    for (const [category, slots] of Object.entries(EXPECTED_METRICS)) {
      const keys = slots.map((s) => s.metricKey);
      const unique = new Set(keys);
      expect(keys.length, `Duplicate in ${category}`).toBe(unique.size);
    }
  });

  it("every metric has a tooltip function that can be called without throwing", () => {
    for (const [category, slots] of Object.entries(EXPECTED_METRICS)) {
      const fn = tooltipFns[category];
      if (!fn) continue;
      for (const slot of slots) {
        expect(() => fn(slot.metricKey)).not.toThrow();
      }
    }
  });

  it("every metric has a direction entry", () => {
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

  it("all categories are present", () => {
    const categories = Object.keys(EXPECTED_METRICS);
    expect(categories).toContain("Economy");
    expect(categories).toContain("Employment");
    expect(categories).toContain("Education");
    expect(categories).toContain("Crime");
    expect(categories).toContain("Healthcare");
    expect(categories).toContain("Defence");
    expect(categories).toContain("Population");
  });

  it("each category has at least 3 metrics", () => {
    for (const [category, slots] of Object.entries(EXPECTED_METRICS)) {
      expect(slots.length, `${category} should have >= 3 metrics`).toBeGreaterThanOrEqual(3);
    }
  });

  it("every metric has a non-empty tooltip string", () => {
    const missing: string[] = [];
    for (const [category, slots] of Object.entries(EXPECTED_METRICS)) {
      const fn = tooltipFns[category];
      if (!fn) continue;
      for (const slot of slots) {
        const tip = fn(slot.metricKey);
        if (!tip || tip.trim().length === 0) {
          missing.push(`${category}/${slot.metricKey}`);
        }
      }
    }
    expect(missing, "These metrics are missing tooltip content").toEqual([]);
  });

  it("tooltip functions return undefined for unknown keys", () => {
    for (const fn of Object.values(tooltipFns)) {
      expect(fn("totally_unknown_key_xyz")).toBeUndefined();
    }
  });
});
