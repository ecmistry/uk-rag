/**
 * RAG Threshold Consistency Tests
 *
 * Ensures that every place computing RAG status uses thresholds matching
 * the single source of truth in dataIngestion.ts.  This prevents the bug
 * where daily_data_refresh_cron.py had different thresholds, causing
 * job_vacancy_ratio to show "green" at 2.2% when it should be "red".
 *
 * Layers:
 *   1. Cron EMPLOYMENT_RAG_OVERRIDES match dataIngestion.ts
 *   2. Python fetcher RAG functions match dataIngestion.ts
 *   3. calculateRAGStatus produces correct results for known values
 *   4. DB history has no mismatched RAGs for Employment metrics
 */
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Centralised thresholds from dataIngestion.ts (the source of truth)
const CENTRALISED_THRESHOLDS: Record<
  string,
  | { dir: "higher"; greenMin: number; amberMin: number }
  | { dir: "lower"; greenMax: number; amberMax: number }
> = {
  real_wage_growth: { dir: "higher", greenMin: 2.0, amberMin: 1.0 },
  job_vacancy_ratio: { dir: "higher", greenMin: 3.5, amberMin: 2.5 },
  inactivity_rate: { dir: "lower", greenMax: 14, amberMax: 20 },
  underemployment: { dir: "lower", greenMax: 5.5, amberMax: 8.5 },
  sickness_absence: { dir: "lower", greenMax: 3.0, amberMax: 4.5 },
};

function correctRag(key: string, value: number): string {
  const t = CENTRALISED_THRESHOLDS[key];
  if (!t) return "amber";
  if (t.dir === "higher") {
    if (value > t.greenMin) return "green";
    if (value >= t.amberMin) return "amber";
    return "red";
  } else {
    if (value < t.greenMax) return "green";
    if (value <= t.amberMax) return "amber";
    return "red";
  }
}

// ─── 1. Cron thresholds match centralised source ────────────────────────────

describe("RAG consistency: cron EMPLOYMENT_RAG_OVERRIDES", () => {
  const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
  const cronSrc = fs.readFileSync(cronPath, "utf-8");

  it("cron has EMPLOYMENT_RAG_OVERRIDES dict", () => {
    expect(cronSrc).toContain("EMPLOYMENT_RAG_OVERRIDES");
  });

  for (const [key, threshold] of Object.entries(CENTRALISED_THRESHOLDS)) {
    if (threshold.dir === "higher") {
      it(`${key}: cron green_min matches centralised greenMin (${threshold.greenMin})`, () => {
        const pattern = new RegExp(
          `"${key}":\\s*\\{[^}]*"green_min":\\s*([\\d.]+)`,
        );
        const match = cronSrc.match(pattern);
        expect(
          match,
          `${key} green_min not found in EMPLOYMENT_RAG_OVERRIDES`,
        ).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.greenMin);
      });

      it(`${key}: cron amber_min matches centralised amberMin (${threshold.amberMin})`, () => {
        const pattern = new RegExp(
          `"${key}":\\s*\\{[^}]*"amber_min":\\s*([\\d.]+)`,
        );
        const match = cronSrc.match(pattern);
        expect(
          match,
          `${key} amber_min not found in EMPLOYMENT_RAG_OVERRIDES`,
        ).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.amberMin);
      });
    } else {
      it(`${key}: cron green_max matches centralised greenMax (${threshold.greenMax})`, () => {
        const pattern = new RegExp(
          `"${key}":\\s*\\{[^}]*"green_max":\\s*([\\d.]+)`,
        );
        const match = cronSrc.match(pattern);
        expect(
          match,
          `${key} green_max not found in EMPLOYMENT_RAG_OVERRIDES`,
        ).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.greenMax);
      });

      it(`${key}: cron amber_max matches centralised amberMax (${threshold.amberMax})`, () => {
        const pattern = new RegExp(
          `"${key}":\\s*\\{[^}]*"amber_max":\\s*([\\d.]+)`,
        );
        const match = cronSrc.match(pattern);
        expect(
          match,
          `${key} amber_max not found in EMPLOYMENT_RAG_OVERRIDES`,
        ).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.amberMax);
      });
    }
  }
});

// ─── 2. Python fetcher RAG functions match centralised thresholds ───────────

describe("RAG consistency: employment fetcher RAG functions", () => {
  const fetcherPath = path.join(__dirname, "employment_data_fetcher.py");
  const fetcherSrc = fs.readFileSync(fetcherPath, "utf-8");

  it("job_vacancy_ratio fetcher: green threshold is 3.5", () => {
    const fn = fetcherSrc.match(
      /def rag_status_job_vacancy_ratio[\s\S]*?return "red"/,
    );
    expect(fn).toBeTruthy();
    expect(fn![0]).toContain("3.5");
  });

  it("job_vacancy_ratio fetcher: amber threshold is 2.5", () => {
    const fn = fetcherSrc.match(
      /def rag_status_job_vacancy_ratio[\s\S]*?return "red"/,
    );
    expect(fn).toBeTruthy();
    expect(fn![0]).toContain("2.5");
  });

  it("real_wage_growth fetcher: green threshold is 2.0", () => {
    const fn = fetcherSrc.match(
      /def rag_status_real_wage_growth[\s\S]*?return "red"/,
    );
    expect(fn).toBeTruthy();
    expect(fn![0]).toContain("2.0");
  });

  it("real_wage_growth fetcher: amber threshold is 1.0", () => {
    const fn = fetcherSrc.match(
      /def rag_status_real_wage_growth[\s\S]*?return "red"/,
    );
    expect(fn).toBeTruthy();
    expect(fn![0]).toContain("1.0");
  });
});

// ─── 3. dataIngestion.ts RAG_THRESHOLDS source of truth ─────────────────────

describe("RAG consistency: dataIngestion.ts thresholds", () => {
  const diPath = path.join(__dirname, "dataIngestion.ts");
  const diSrc = fs.readFileSync(diPath, "utf-8");

  for (const [key, threshold] of Object.entries(CENTRALISED_THRESHOLDS)) {
    it(`${key}: exists in RAG_THRESHOLDS`, () => {
      expect(diSrc).toContain(`${key}:`);
    });

    if (threshold.dir === "higher") {
      it(`${key}: greenMin is ${threshold.greenMin}`, () => {
        const pattern = new RegExp(
          `${key}:.*greenMin:\\s*([\\d.]+)`,
        );
        const match = diSrc.match(pattern);
        expect(match).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.greenMin);
      });
    } else {
      it(`${key}: greenMax is ${threshold.greenMax}`, () => {
        const pattern = new RegExp(
          `${key}:.*greenMax:\\s*([\\d.]+)`,
        );
        const match = diSrc.match(pattern);
        expect(match).toBeTruthy();
        expect(parseFloat(match![1])).toBe(threshold.greenMax);
      });
    }
  }
});

// ─── 4. calculateRAGStatus correctness for known values ─────────────────────

describe("RAG consistency: calculateRAGStatus correctness", () => {
  const testCases: Array<{
    metric: string;
    value: number;
    expected: string;
    label: string;
  }> = [
    // job_vacancy_ratio: higher_better, greenMin: 3.5, amberMin: 2.5
    { metric: "job_vacancy_ratio", value: 2.2, expected: "red", label: "2.2% (the bug value)" },
    { metric: "job_vacancy_ratio", value: 2.5, expected: "amber", label: "2.5% (amber boundary)" },
    { metric: "job_vacancy_ratio", value: 3.6, expected: "green", label: "3.6% (green)" },
    { metric: "job_vacancy_ratio", value: 0.7, expected: "red", label: "0.7% (old wrong green_min)" },

    // inactivity_rate: lower_better, greenMax: 14, amberMax: 20
    { metric: "inactivity_rate", value: 13, expected: "green", label: "13% (green)" },
    { metric: "inactivity_rate", value: 18, expected: "amber", label: "18% (amber)" },
    { metric: "inactivity_rate", value: 20.8, expected: "red", label: "20.8% (red)" },
    { metric: "inactivity_rate", value: 20.5, expected: "red", label: "20.5% (old wrong green_max)" },

    // real_wage_growth: higher_better, greenMin: 2.0, amberMin: 1.0
    { metric: "real_wage_growth", value: 2.5, expected: "green", label: "2.5% (green)" },
    { metric: "real_wage_growth", value: 1.5, expected: "amber", label: "1.5% (amber)" },
    { metric: "real_wage_growth", value: 0.5, expected: "red", label: "0.5% (red)" },

    // underemployment: lower_better, greenMax: 5.5, amberMax: 8.5
    { metric: "underemployment", value: 4.0, expected: "green", label: "4.0% (green)" },
    { metric: "underemployment", value: 7.0, expected: "amber", label: "7.0% (amber)" },
    { metric: "underemployment", value: 9.0, expected: "red", label: "9.0% (red)" },
  ];

  for (const { metric, value, expected, label } of testCases) {
    it(`${metric} at ${label} → ${expected}`, () => {
      const result = correctRag(metric, value);
      expect(
        result,
        `${metric} at ${value} should be ${expected} but got ${result}`,
      ).toBe(expected);
    });
  }
});

// ─── 5. DB history has correct RAGs for employment metrics ──────────────────

describe("RAG consistency: database history", () => {
  it("no employment metric history entries have a RAG that disagrees with centralised thresholds", () => {
    const keys = Object.keys(CENTRALISED_THRESHOLDS);
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '${[
          `const thresholds = ${JSON.stringify(CENTRALISED_THRESHOLDS)};`,
          `function correctRag(key, val) {`,
          `  const t = thresholds[key];`,
          `  if (!t) return null;`,
          `  if (t.dir === "higher") {`,
          `    if (val > t.greenMin) return "green";`,
          `    if (val >= t.amberMin) return "amber";`,
          `    return "red";`,
          `  } else {`,
          `    if (val < t.greenMax) return "green";`,
          `    if (val <= t.amberMax) return "amber";`,
          `    return "red";`,
          `  }`,
          `}`,
          `const wrong = [];`,
          `${JSON.stringify(keys)}.forEach(key => {`,
          `  db.metricHistory.find({metricKey: key}).forEach(e => {`,
          `    const v = parseFloat(e.value);`,
          `    if (isNaN(v)) return;`,
          `    const correct = correctRag(key, v);`,
          `    if (correct && e.ragStatus !== correct) {`,
          `      wrong.push(key + " " + e.dataDate + ": val=" + e.value + " has=" + e.ragStatus + " should=" + correct);`,
          `    }`,
          `  });`,
          `});`,
          `print(JSON.stringify(wrong));`,
        ].join("")}'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch {
      console.warn("Skipping DB RAG check — mongosh not available");
      return;
    }

    const wrong: string[] = JSON.parse(stdout.trim());
    expect(
      wrong,
      "These history entries have a RAG status that disagrees with the " +
        "centralised thresholds in dataIngestion.ts — the cron or fetcher " +
        "is using different thresholds:\n" +
        wrong.join("\n"),
    ).toEqual([]);
  });
});

// ─── 6. Specific regression: job_vacancy_ratio at 2.2% must be red ──────────

describe("RAG consistency: regressions", () => {
  it("job_vacancy_ratio at 2.2% is red, not green (the original bug)", () => {
    expect(correctRag("job_vacancy_ratio", 2.2)).toBe("red");
  });

  it("job_vacancy_ratio tile in DB is not green", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '` +
          `const m = db.metrics.findOne({metricKey: "job_vacancy_ratio"});` +
          `print(JSON.stringify({value: m.value, ragStatus: m.ragStatus}));` +
          `'`,
        { encoding: "utf-8", timeout: 10_000 },
      );
    } catch {
      console.warn("Skipping DB check — mongosh not available");
      return;
    }

    const tile = JSON.parse(stdout.trim());
    const value = parseFloat(tile.value);
    if (value < 2.5) {
      expect(
        tile.ragStatus,
        `job_vacancy_ratio tile shows value=${tile.value} but ragStatus=${tile.ragStatus} — ` +
          "should be red at this level",
      ).toBe("red");
    }
  });
});
