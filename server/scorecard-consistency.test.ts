/**
 * Scorecard Consistency Tests
 *
 * Guards against the class of bug where a metric's category is changed in one
 * layer (e.g. frontend) but not another (e.g. Python fetcher, DB allowed keys).
 *
 * These tests cross-check four independent sources of truth:
 *   1. client/src/data/expectedMetrics.ts   — what the dashboard renders
 *   2. server/db.ts ALLOWED_METRIC_KEYS     — what the API lets through
 *   3. client/src/data/metricDirections.ts   — trend direction for each metric
 *   4. client/src/data/metricTooltips.ts     — tooltip content for each metric
 *
 * If any metric is moved, added, or removed, ALL layers must be updated
 * together or these tests will fail.
 */
import { describe, it, expect } from "vitest";
import { EXPECTED_METRICS, type ExpectedSlot } from "../client/src/data/expectedMetrics";
import { METRIC_DIRECTION } from "../client/src/data/metricDirections";
import {
  getEconomyTooltip,
  getEmploymentTooltip,
  getEducationTooltip,
  getCrimeTooltip,
  getHealthcareTooltip,
  getDefenceTooltip,
} from "../client/src/data/metricTooltips";
import {
  EMPLOYMENT_ALLOWED_METRIC_KEYS,
  EDUCATION_ALLOWED_METRIC_KEYS,
  CRIME_ALLOWED_METRIC_KEYS,
  HEALTHCARE_ALLOWED_METRIC_KEYS,
  DEFENCE_ALLOWED_METRIC_KEYS,
} from "./db";

const SERVER_ALLOWED_KEYS: Record<string, Set<string>> = {
  Employment: EMPLOYMENT_ALLOWED_METRIC_KEYS,
  Education: EDUCATION_ALLOWED_METRIC_KEYS,
  Crime: CRIME_ALLOWED_METRIC_KEYS,
  Healthcare: HEALTHCARE_ALLOWED_METRIC_KEYS,
  Defence: DEFENCE_ALLOWED_METRIC_KEYS,
};

const TOOLTIP_FNS: Record<string, (key: string) => string | undefined> = {
  Economy: getEconomyTooltip,
  Employment: getEmploymentTooltip,
  Education: getEducationTooltip,
  Crime: getCrimeTooltip,
  Healthcare: getHealthcareTooltip,
  Defence: getDefenceTooltip,
};

const ALL_CATEGORIES = Object.keys(EXPECTED_METRICS);

function allExpectedKeys(): { category: string; slot: ExpectedSlot }[] {
  return ALL_CATEGORIES.flatMap((cat) =>
    EXPECTED_METRICS[cat].map((slot) => ({ category: cat, slot })),
  );
}

// ─── Cross-layer consistency ────────────────────────────────────────────────

describe("Scorecard consistency: frontend ↔ server allowed keys", () => {
  for (const category of ALL_CATEGORIES) {
    const allowedSet = SERVER_ALLOWED_KEYS[category];
    if (!allowedSet) continue;

    const frontendKeys = EXPECTED_METRICS[category].map((s) => s.metricKey);

    it(`${category}: every frontend metric is in server ALLOWED_METRIC_KEYS`, () => {
      const missing = frontendKeys.filter((k) => !allowedSet.has(k));
      expect(
        missing,
        `These ${category} metrics are shown on the dashboard but would be filtered out by the server: ${missing.join(", ")}`,
      ).toEqual([]);
    });

    it(`${category}: server ALLOWED_METRIC_KEYS is a superset of frontend keys (no dashboard card is orphaned)`, () => {
      const missing = frontendKeys.filter((k) => !allowedSet.has(k));
      expect(
        missing,
        `These ${category} metrics are on the dashboard but NOT in server ALLOWED_METRIC_KEYS — they will be filtered out and show "No data available": ${missing.join(", ")}`,
      ).toEqual([]);
    });
  }
});

describe("Scorecard consistency: every metric has a trend direction", () => {
  it("all dashboard metrics have a METRIC_DIRECTION entry", () => {
    const missing = allExpectedKeys()
      .filter(({ slot }) => !METRIC_DIRECTION[slot.metricKey])
      .map(({ category, slot }) => `${category}/${slot.metricKey}`);
    expect(
      missing,
      `These metrics have no trend direction defined — add them to metricDirections.ts`,
    ).toEqual([]);
  });
});

describe("Scorecard consistency: every metric has tooltip content", () => {
  it("all dashboard metrics return a non-empty tooltip string", () => {
    const missing = allExpectedKeys()
      .filter(({ category, slot }) => {
        const fn = TOOLTIP_FNS[category];
        if (!fn) return false;
        const tip = fn(slot.metricKey);
        return !tip || tip.trim().length === 0;
      })
      .map(({ category, slot }) => `${category}/${slot.metricKey}`);
    expect(
      missing,
      `These metrics are missing tooltip content — add them to metricTooltips.ts`,
    ).toEqual([]);
  });
});

// ─── Structural invariants ──────────────────────────────────────────────────

describe("Scorecard consistency: structural invariants", () => {
  it("no metric key appears in more than one category", () => {
    const keyToCategories = new Map<string, string[]>();
    for (const { category, slot } of allExpectedKeys()) {
      const cats = keyToCategories.get(slot.metricKey) || [];
      cats.push(category);
      keyToCategories.set(slot.metricKey, cats);
    }
    const dupes = [...keyToCategories.entries()]
      .filter(([, cats]) => cats.length > 1)
      .map(([key, cats]) => `${key} → [${cats.join(", ")}]`);
    expect(dupes, "These metrics appear in multiple categories").toEqual([]);
  });

  it("no duplicate metricKeys within a single category", () => {
    for (const category of ALL_CATEGORIES) {
      const keys = EXPECTED_METRICS[category].map((s) => s.metricKey);
      expect(
        keys.length,
        `Duplicate metricKey in ${category}`,
      ).toBe(new Set(keys).size);
    }
  });

  it("every metric has a non-empty display name", () => {
    const nameless = allExpectedKeys()
      .filter(({ slot }) => !slot.name || slot.name.trim().length === 0)
      .map(({ category, slot }) => `${category}/${slot.metricKey}`);
    expect(nameless).toEqual([]);
  });

  it("every category has between 3 and 10 metrics", () => {
    for (const category of ALL_CATEGORIES) {
      const count = EXPECTED_METRICS[category].length;
      expect(count, `${category} has ${count} metrics`).toBeGreaterThanOrEqual(3);
      expect(count, `${category} has ${count} metrics`).toBeLessThanOrEqual(10);
    }
  });

  it("expected categories are present", () => {
    const required = ["Economy", "Employment", "Education", "Crime", "Healthcare", "Defence"];
    for (const cat of required) {
      expect(ALL_CATEGORIES, `Missing category: ${cat}`).toContain(cat);
    }
  });

  it("no unexpected categories exist", () => {
    const allowed = new Set(["Economy", "Employment", "Education", "Crime", "Healthcare", "Defence"]);
    const unexpected = ALL_CATEGORIES.filter((c) => !allowed.has(c));
    expect(
      unexpected,
      `Unexpected categories found — add server allowed keys and tests for: ${unexpected.join(", ")}`,
    ).toEqual([]);
  });
});

// ─── Per-category key audits (exact key sets) ───────────────────────────────

describe("Scorecard consistency: exact key sets per category", () => {
  const CANONICAL_KEYS: Record<string, string[]> = {
    Economy: ["output_per_hour", "real_gdp_growth", "cpi_inflation", "public_sector_net_debt", "business_investment"],
    Employment: ["inactivity_rate", "real_wage_growth", "job_vacancy_ratio", "underemployment", "sickness_absence"],
    Education: ["attainment8", "neet_rate", "pupil_attendance", "apprenticeship_intensity"],
    Crime: ["street_confidence_index", "asb_low_level_crime", "serious_crime", "crown_court_backlog", "recall_rate"],
    Healthcare: ["a_e_wait_time", "elective_backlog", "ambulance_response_time", "gp_appt_access", "old_age_dependency_ratio"],
    Defence: ["sea_mass", "land_mass", "air_mass", "defence_industry_vitality", "defence_spending_gdp"],
  };

  for (const [category, expectedKeys] of Object.entries(CANONICAL_KEYS)) {
    it(`${category}: frontend keys match canonical set`, () => {
      const actual = EXPECTED_METRICS[category].map((s) => s.metricKey).sort();
      expect(actual).toEqual([...expectedKeys].sort());
    });

    it(`${category}: server allowed keys are a superset of canonical set`, () => {
      const allowed = SERVER_ALLOWED_KEYS[category];
      if (!allowed) return;
      const missing = expectedKeys.filter((k) => !allowed.has(k));
      expect(
        missing,
        `Server ALLOWED_METRIC_KEYS for ${category} is missing: ${missing.join(", ")}`,
      ).toEqual([]);
    });
  }
});

// ─── Python fetcher category alignment ──────────────────────────────────────

describe("Scorecard consistency: Python fetcher categories", () => {
  /**
   * This map is derived from all server/*_fetcher.py and server/*_cron.py files.
   * It represents what category the Python data pipeline writes into MongoDB.
   * If a metric moves between dashboard sections, this map AND the Python
   * fetcher must be updated — otherwise the metric will be invisible.
   *
   * IMPORTANT: Update this map whenever you move a metric between categories.
   */
  const PYTHON_FETCHER_CATEGORIES: Record<string, string> = {
    // Economy
    business_investment: "Economy",
    // Employment
    inactivity_rate: "Employment",
    real_wage_growth: "Employment",
    job_vacancy_ratio: "Employment",
    underemployment: "Employment",
    sickness_absence: "Employment",
    // Education
    attainment8: "Education",
    neet_rate: "Education",
    persistent_absence: "Education",
    apprentice_starts: "Education",
    // Crime
    crown_court_backlog: "Crime",
    recall_rate: "Crime",
    street_confidence_index: "Crime",
    asb_low_level_crime: "Crime",
    serious_crime: "Crime",
    // Healthcare
    a_e_wait_time: "Healthcare",
    ambulance_response_time: "Healthcare",
    elective_backlog: "Healthcare",
    gp_appt_access: "Healthcare",
    old_age_dependency_ratio: "Healthcare",
    // Defence
    sea_mass: "Defence",
    land_mass: "Defence",
    air_mass: "Defence",
    defence_industry_vitality: "Defence",
    defence_spending_gdp: "Defence",
  };

  it("every dashboard metric fetched by Python has the correct category in the fetcher", () => {
    const mismatches: string[] = [];
    for (const { category, slot } of allExpectedKeys()) {
      const fetcherCategory = PYTHON_FETCHER_CATEGORIES[slot.metricKey];
      if (!fetcherCategory) continue;
      if (fetcherCategory !== category) {
        mismatches.push(
          `${slot.metricKey}: dashboard says "${category}" but Python fetcher writes "${fetcherCategory}"`,
        );
      }
    }
    expect(
      mismatches,
      "Python fetcher category does not match dashboard category — update the fetcher .py file",
    ).toEqual([]);
  });

  it("python fetcher category map covers all dashboard metrics that have a fetcher", () => {
    const dashboardKeys = new Set(allExpectedKeys().map(({ slot }) => slot.metricKey));
    const fetcherKeys = new Set(Object.keys(PYTHON_FETCHER_CATEGORIES));
    const coveredByFetcher = [...dashboardKeys].filter((k) => fetcherKeys.has(k));
    expect(
      coveredByFetcher.length,
      "At least 20 dashboard metrics should be covered by Python fetchers",
    ).toBeGreaterThanOrEqual(20);
  });

});

// ─── Cron CATEGORIES alignment ──────────────────────────────────────────────

describe("Scorecard consistency: cron CATEGORIES vs dashboard sections", () => {
  const DASHBOARD_SECTIONS = Object.keys(EXPECTED_METRICS);

  it("daily_data_refresh_cron CATEGORIES only contains active dashboard sections", () => {
    const fs = require("fs");
    const path = require("path");
    const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
    const cronSource = fs.readFileSync(cronPath, "utf-8");

    // Extract only the main CATEGORIES block (ends at the closing ])
    const catBlockMatch = cronSource.match(/^CATEGORIES[^=]*=\s*\[[\s\S]*?\n\]/m);
    if (!catBlockMatch) {
      throw new Error("Could not find CATEGORIES block in daily_data_refresh_cron.py");
    }
    const catBlock = catBlockMatch[0];

    const categoryNames: string[] = [];
    const nameRegex = /"name":\s*"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = nameRegex.exec(catBlock)) !== null) {
      categoryNames.push(match[1]);
    }

    const staleCategories = categoryNames.filter(
      (name) => !DASHBOARD_SECTIONS.includes(name),
    );
    expect(
      staleCategories,
      `Cron CATEGORIES includes sections not on the dashboard: ${staleCategories.join(", ")}. ` +
      "Remove them from CATEGORIES in daily_data_refresh_cron.py — " +
      "metrics from removed sections will be written with the wrong category.",
    ).toEqual([]);
  });

  it("every dashboard section has a matching cron category or supplementary script", () => {
    const fs = require("fs");
    const path = require("path");
    const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
    const cronSource = fs.readFileSync(cronPath, "utf-8");

    for (const section of DASHBOARD_SECTIONS) {
      const hasCategory = cronSource.includes(`"name": "${section}"`);
      expect(
        hasCategory,
        `Dashboard section "${section}" has no matching CATEGORIES entry in daily_data_refresh_cron.py — ` +
        "its metrics won't be refreshed by the daily cron.",
      ).toBe(true);
    }
  });

  it("no dashboard metric is fetched by a script running under a different category name", () => {
    const fs = require("fs");
    const path = require("path");
    const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
    const cronSource = fs.readFileSync(cronPath, "utf-8");

    const categoryScriptPairs: Array<{ name: string; script: string }> = [];
    const blockRegex = /\{\s*"name":\s*"([^"]+)"[^}]*"script":\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(cronSource)) !== null) {
      categoryScriptPairs.push({ name: m[1], script: m[2] });
    }

    const dashboardKeysByCategory = new Map<string, Set<string>>();
    for (const { category, slot } of allExpectedKeys()) {
      if (!dashboardKeysByCategory.has(category)) {
        dashboardKeysByCategory.set(category, new Set());
      }
      dashboardKeysByCategory.get(category)!.add(slot.metricKey);
    }

    const mismatches: string[] = [];
    for (const { name, script } of categoryScriptPairs) {
      const scriptPath = path.join(__dirname, script);
      if (!fs.existsSync(scriptPath)) continue;
      const scriptSource = fs.readFileSync(scriptPath, "utf-8");

      const categoryRegex = /"category":\s*"([^"]+)"/g;
      let cm: RegExpExecArray | null;
      while ((cm = categoryRegex.exec(scriptSource)) !== null) {
        const outputCategory = cm[1];
        if (outputCategory !== name) {
          const context = scriptSource.slice(Math.max(0, cm.index - 100), cm.index + cm[0].length + 100);
          const keyMatch = context.match(/"metric_key":\s*"([^"]+)"/);
          const metricKey = keyMatch?.[1] ?? "unknown";

          const isOnDashboard = [...dashboardKeysByCategory.values()].some((keys) =>
            keys.has(metricKey),
          );
          if (isOnDashboard) {
            mismatches.push(
              `${script} runs under cron category "${name}" but outputs "${metricKey}" with category "${outputCategory}". ` +
              `Move the fetch function to the correct category's fetcher script.`,
            );
          }
        }
      }
    }

    expect(
      mismatches,
      "Metrics are fetched by a script running under the wrong cron category. " +
      "This will cause the cron to overwrite the category incorrectly.",
    ).toEqual([]);
  });
});
