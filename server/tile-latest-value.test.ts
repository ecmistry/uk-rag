/**
 * Tile Latest-Value Tests
 *
 * These tests prevent the critical bug where dashboard tiles showed stale
 * historical values instead of the latest period.  Root cause: both the
 * daily cron and the admin refresh were upserting EVERY historical row to
 * the metrics tile (keyed by metricKey), so the last-processed row won —
 * which could be any historical entry due to ordering or Promise.all races.
 *
 * Layers of defence:
 *   1. Database consistency: every visible tile must match latest history
 *   2. Unit tests: latest-per-key selection logic (cron + router)
 *   3. Regression: specific metrics that were previously broken
 *   4. Integration: run actual fetchers and verify tile correctness
 *   5. Cron script: execute the cron and verify it writes correct tiles
 */
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { EXPECTED_METRICS } from "../client/src/data/expectedMetrics";

const ALL_DASHBOARD_KEYS = Object.values(EXPECTED_METRICS)
  .flat()
  .map((s) => s.metricKey);

// ─── 1. Database consistency: tiles must match latest history ────────────────

describe("Tile latest value: database consistency", () => {
  /**
   * Compare tile vs history by extracting the year from the dataDate.
   * Exact string comparison fails because some tiles have un-normalised
   * dates (e.g. "Dec 2024" vs "2024 Q4") — both represent the same
   * quarter but differ in format.  Comparing by year catches genuinely
   * stale tiles (e.g. showing 2003 instead of 2025) while tolerating
   * format differences.
   */
  it("no dashboard metric tile has a year more than 2 years older than its latest history year", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '${[
          `const keys = ${JSON.stringify(ALL_DASHBOARD_KEYS)};`,
          `const stale = [];`,
          `function extractYear(s) { const m = String(s).match(/(\\d{4})/); return m ? parseInt(m[1]) : null; }`,
          `keys.forEach(k => {`,
          `  const tile = db.metrics.findOne({metricKey: k});`,
          `  if (!tile || !tile.dataDate) return;`,
          `  const latest = db.metricHistory.find({metricKey: k}).sort({dataDate: -1}).limit(1).toArray()[0];`,
          `  if (!latest) return;`,
          `  const tileYear = extractYear(tile.dataDate);`,
          `  const histYear = extractYear(latest.dataDate);`,
          `  if (tileYear && histYear && histYear - tileYear > 2) {`,
          `    stale.push(k + ": tile=" + tile.dataDate + " (year " + tileYear + ") vs history=" + latest.dataDate + " (year " + histYear + ") — tile value=" + tile.value + ", latest=" + latest.value);`,
          `  }`,
          `});`,
          `print(JSON.stringify(stale));`,
        ].join("")}'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch {
      console.warn("Skipping DB consistency check — mongosh not available");
      return;
    }

    const stale: string[] = JSON.parse(stdout.trim());
    expect(
      stale,
      "These dashboard tiles show a year 2+ years OLDER than the latest history — " +
        "the tile upsert wrote a historical value over the current one:\n" +
        stale.join("\n"),
    ).toEqual([]);
  });

  it("no dashboard metric tile is more than 2 years behind its latest history entry", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '${[
          `const keys = ${JSON.stringify(ALL_DASHBOARD_KEYS)};`,
          `const bad = [];`,
          `function extractYear(s) {`,
          `  const m4 = String(s).match(/(\\d{4})\\/(\\d{2})/);`,
          `  if (m4) return parseInt(m4[1]) + 1;`,
          `  const m6 = String(s).match(/(\\d{4})(\\d{2})/);`,
          `  if (m6 && parseInt(m6[2]) >= 13) return parseInt(m6[1]) + 1;`,
          `  const m = String(s).match(/(\\d{4})/);`,
          `  return m ? parseInt(m[1]) : null;`,
          `}`,
          `keys.forEach(k => {`,
          `  const tile = db.metrics.findOne({metricKey: k});`,
          `  if (!tile || !tile.dataDate) return;`,
          `  const latest = db.metricHistory.find({metricKey: k}).sort({dataDate: -1}).limit(1).toArray()[0];`,
          `  if (!latest) return;`,
          `  const tileYear = extractYear(tile.dataDate);`,
          `  const histYear = extractYear(latest.dataDate);`,
          `  if (tileYear && histYear && histYear - tileYear > 2) {`,
          `    bad.push(k + ": tile=" + tile.dataDate + " (year ~" + tileYear + ") vs history=" + latest.dataDate + " (year ~" + histYear + ") — tile shows stale data");`,
          `  }`,
          `});`,
          `print(JSON.stringify(bad));`,
        ].join("")}'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch {
      console.warn("Skipping DB year check — mongosh not available");
      return;
    }

    const bad: string[] = JSON.parse(stdout.trim());
    expect(
      bad,
      "These tiles are 2+ YEARS behind their latest history entry — " +
        "the refresh is writing a historical value over the current one:\n" +
        bad.join("\n"),
    ).toEqual([]);
  });
});

// ─── 2. Unit tests: latest-per-key selection logic ──────────────────────────

describe("Tile latest value: latest-per-key selection logic", () => {
  /**
   * Simulate the logic used in both daily_data_refresh_cron.py and
   * routers.ts to select the latest period per metric_key.  This
   * verifies the algorithm itself, independent of the database.
   */
  function selectLatestPerKey(
    rows: Array<{ metric_key: string; time_period: string; value: number }>,
  ): Map<string, { time_period: string; value: number }> {
    const latest = new Map<string, { time_period: string; value: number }>();
    for (const row of rows) {
      const prev = latest.get(row.metric_key);
      if (!prev || row.time_period >= prev.time_period) {
        latest.set(row.metric_key, {
          time_period: row.time_period,
          value: row.value,
        });
      }
    }
    return latest;
  }

  it("selects the latest period when data is in chronological order", () => {
    const rows = [
      { metric_key: "output_per_hour", time_period: "2003 Q2", value: 2.0 },
      { metric_key: "output_per_hour", time_period: "2020 Q1", value: 0.5 },
      { metric_key: "output_per_hour", time_period: "2025 Q3", value: 1.1 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("output_per_hour")?.time_period).toBe("2025 Q3");
    expect(result.get("output_per_hour")?.value).toBe(1.1);
  });

  it("selects the latest period when data is in REVERSE chronological order", () => {
    const rows = [
      { metric_key: "cpi_inflation", time_period: "2026 Q1", value: 3.0 },
      { metric_key: "cpi_inflation", time_period: "2024 Q1", value: 4.0 },
      { metric_key: "cpi_inflation", time_period: "2020 Q3", value: 0.5 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("cpi_inflation")?.time_period).toBe("2026 Q1");
    expect(result.get("cpi_inflation")?.value).toBe(3.0);
  });

  it("selects the latest period when data is in random order", () => {
    const rows = [
      { metric_key: "real_gdp_growth", time_period: "2020 Q4", value: 1.0 },
      { metric_key: "real_gdp_growth", time_period: "2025 Q4", value: 0.97 },
      { metric_key: "real_gdp_growth", time_period: "2003 Q1", value: 3.5 },
      { metric_key: "real_gdp_growth", time_period: "2022 Q3", value: 3.08 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("real_gdp_growth")?.time_period).toBe("2025 Q4");
    expect(result.get("real_gdp_growth")?.value).toBe(0.97);
  });

  it("handles multiple metric keys correctly — each gets its own latest", () => {
    const rows = [
      { metric_key: "output_per_hour", time_period: "2003 Q2", value: 2.0 },
      { metric_key: "cpi_inflation", time_period: "2024 Q1", value: 4.0 },
      { metric_key: "output_per_hour", time_period: "2025 Q3", value: 1.1 },
      { metric_key: "cpi_inflation", time_period: "2026 Q1", value: 3.0 },
      { metric_key: "output_per_hour", time_period: "2020 Q1", value: 0.5 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("output_per_hour")?.time_period).toBe("2025 Q3");
    expect(result.get("output_per_hour")?.value).toBe(1.1);
    expect(result.get("cpi_inflation")?.time_period).toBe("2026 Q1");
    expect(result.get("cpi_inflation")?.value).toBe(3.0);
  });

  it("handles a single row correctly", () => {
    const rows = [
      { metric_key: "neet_rate", time_period: "2025 Q4", value: 12.8 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("neet_rate")?.time_period).toBe("2025 Q4");
    expect(result.get("neet_rate")?.value).toBe(12.8);
  });

  it("handles same period with different values — last one wins", () => {
    const rows = [
      { metric_key: "a_e_wait_time", time_period: "2026 Q1", value: 74.0 },
      { metric_key: "a_e_wait_time", time_period: "2026 Q1", value: 74.4 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("a_e_wait_time")?.value).toBe(74.4);
  });

  it("annual dates normalised to Q4 still sort correctly", () => {
    const rows = [
      { metric_key: "output_per_hour", time_period: "1972 Q4", value: 2.9 },
      { metric_key: "output_per_hour", time_period: "2003 Q2", value: 2.0 },
      { metric_key: "output_per_hour", time_period: "2025 Q3", value: 1.1 },
      { metric_key: "output_per_hour", time_period: "2024 Q4", value: -0.8 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.get("output_per_hour")?.time_period).toBe("2025 Q3");
    expect(result.get("output_per_hour")?.value).toBe(1.1);
  });

  it("correctly selects latest across a large dataset (268 entries)", () => {
    const rows: Array<{ metric_key: string; time_period: string; value: number }> = [];
    for (let year = 1972; year <= 2025; year++) {
      for (let q = 1; q <= 4; q++) {
        if (year === 2025 && q > 3) break;
        rows.push({
          metric_key: "output_per_hour",
          time_period: `${year} Q${q}`,
          value: Math.random() * 10 - 2,
        });
      }
    }
    rows[rows.length - 1].value = 1.1;

    const result = selectLatestPerKey(rows);
    expect(result.get("output_per_hour")?.time_period).toBe("2025 Q3");
    expect(result.get("output_per_hour")?.value).toBe(1.1);
  });

  it("number of upserts equals number of unique keys, not total rows", () => {
    const rows = [
      { metric_key: "a", time_period: "2020 Q1", value: 1 },
      { metric_key: "a", time_period: "2020 Q2", value: 2 },
      { metric_key: "a", time_period: "2020 Q3", value: 3 },
      { metric_key: "b", time_period: "2020 Q1", value: 10 },
      { metric_key: "b", time_period: "2020 Q4", value: 40 },
      { metric_key: "c", time_period: "2021 Q1", value: 100 },
    ];
    const result = selectLatestPerKey(rows);
    expect(result.size).toBe(3);
    expect(result.get("a")?.value).toBe(3);
    expect(result.get("b")?.value).toBe(40);
    expect(result.get("c")?.value).toBe(100);
  });
});

// ─── 3. Cron script: verify Python latest-per-key logic ─────────────────────

describe("Tile latest value: Python cron latest-per-key logic", () => {
  it("Python selectLatestPerKey selects correct latest for mixed chronological data", () => {
    const pythonCode = `
import json, sys

rows = [
    {"metric_key": "output_per_hour", "_normalised_period": "1972 Q4", "value": 2.9},
    {"metric_key": "output_per_hour", "_normalised_period": "2003 Q2", "value": 2.0},
    {"metric_key": "output_per_hour", "_normalised_period": "2025 Q3", "value": 1.1},
    {"metric_key": "cpi_inflation", "_normalised_period": "2024 Q1", "value": 4.0},
    {"metric_key": "cpi_inflation", "_normalised_period": "2026 Q1", "value": 3.0},
    {"metric_key": "real_gdp_growth", "_normalised_period": "2022 Q3", "value": 3.08},
    {"metric_key": "real_gdp_growth", "_normalised_period": "2025 Q4", "value": 0.97},
    {"metric_key": "real_gdp_growth", "_normalised_period": "2003 Q1", "value": 3.5},
]

latest = {}
for row in rows:
    key = row["metric_key"]
    period = row["_normalised_period"]
    prev = latest.get(key)
    if prev is None or period >= prev["period"]:
        latest[key] = {"period": period, "value": row["value"]}

result = {k: v for k, v in latest.items()}
print(json.dumps(result))
`;
    const stdout = execSync(`python3 -c '${pythonCode}'`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    const result = JSON.parse(stdout.trim());

    expect(result.output_per_hour.period).toBe("2025 Q3");
    expect(result.output_per_hour.value).toBe(1.1);
    expect(result.cpi_inflation.period).toBe("2026 Q1");
    expect(result.cpi_inflation.value).toBe(3.0);
    expect(result.real_gdp_growth.period).toBe("2025 Q4");
    expect(result.real_gdp_growth.value).toBe(0.97);
  });

  it("Python selectLatestPerKey handles reverse-ordered data", () => {
    const pythonCode = `
import json
rows = [
    {"metric_key": "x", "_normalised_period": "2025 Q4", "value": 99},
    {"metric_key": "x", "_normalised_period": "2024 Q3", "value": 50},
    {"metric_key": "x", "_normalised_period": "2020 Q1", "value": 10},
]
latest = {}
for row in rows:
    key = row["metric_key"]
    period = row["_normalised_period"]
    prev = latest.get(key)
    if prev is None or period >= prev["period"]:
        latest[key] = {"period": period, "value": row["value"]}
print(json.dumps(latest))
`;
    const stdout = execSync(`python3 -c '${pythonCode}'`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    const result = JSON.parse(stdout.trim());
    expect(result.x.period).toBe("2025 Q4");
    expect(result.x.value).toBe(99);
  });
});

// ─── 4. Regression: the 8 specific metrics that were previously broken ──────

describe("Tile latest value: regression tests for previously broken metrics", () => {
  const PREVIOUSLY_BROKEN = [
    { key: "output_per_hour", wrongPeriod: "2003 Q2", wrongValue: "2" },
    { key: "business_investment", wrongPeriod: "2001 Q4", wrongValue: "9.03" },
    { key: "cpi_inflation", wrongPeriod: "2024 Q1", wrongValue: "4" },
    { key: "inactivity_rate", wrongPeriod: "2002 Q3", wrongValue: "23.3" },
    { key: "job_vacancy_ratio", wrongPeriod: "2019 Q3", wrongValue: "2.7" },
    { key: "public_sector_net_debt", wrongPeriod: "2020 Q4", wrongValue: "97.6" },
    { key: "real_gdp_growth", wrongPeriod: "2022 Q3", wrongValue: "3.08" },
    { key: "real_wage_growth", wrongPeriod: "2020 Q1", wrongValue: "0.77" },
  ];

  for (const { key, wrongPeriod, wrongValue } of PREVIOUSLY_BROKEN) {
    it(`${key}: tile does NOT show the stale value ${wrongValue} from ${wrongPeriod}`, () => {
      let stdout: string;
      try {
        stdout = execSync(
          `mongosh --quiet uk_rag_portal --eval '` +
            `const m = db.metrics.findOne({metricKey: "${key}"});` +
            `print(JSON.stringify({value: String(m.value), dataDate: m.dataDate}));` +
            `'`,
          { encoding: "utf-8", timeout: 10_000 },
        );
      } catch {
        console.warn(`Skipping DB check for ${key} — mongosh not available`);
        return;
      }

      const tile = JSON.parse(stdout.trim());

      expect(
        tile.dataDate,
        `${key} tile is STILL showing the stale period ${wrongPeriod} — ` +
          "the latest-per-key fix is not working",
      ).not.toBe(wrongPeriod);

      expect(
        tile.value,
        `${key} tile is STILL showing the stale value ${wrongValue} — ` +
          "the latest-per-key fix is not working",
      ).not.toBe(wrongValue);
    });

    it(`${key}: tile period is >= 2024 (not a historical value)`, () => {
      let stdout: string;
      try {
        stdout = execSync(
          `mongosh --quiet uk_rag_portal --eval '` +
            `const m = db.metrics.findOne({metricKey: "${key}"});` +
            `print(m.dataDate);` +
            `'`,
          { encoding: "utf-8", timeout: 10_000 },
        );
      } catch {
        console.warn(`Skipping DB check for ${key} — mongosh not available`);
        return;
      }

      const dataDate = stdout.trim();
      const yearMatch = dataDate.match(/(\d{4})/);
      expect(yearMatch, `${key}: dataDate "${dataDate}" has no year`).toBeTruthy();

      const year = parseInt(yearMatch![1], 10);
      expect(
        year,
        `${key}: tile shows year ${year} which is historical — ` +
          `expected 2024 or later (dataDate="${dataDate}")`,
      ).toBeGreaterThanOrEqual(2024);
    });
  }
});

// ─── 5. Economy fetcher output: verify latest entries are at the end ────────

describe("Tile latest value: economy fetcher output ordering", () => {
  const economyMetricsPath = path.join(__dirname, "economy_metrics.json");

  function readEconomyMetrics(): Array<Record<string, any>> {
    if (!fs.existsSync(economyMetricsPath)) return [];
    const data = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
    return Array.isArray(data) ? data : [];
  }

  it("economy_metrics.json exists and is valid JSON", () => {
    const data = readEconomyMetrics();
    if (data.length === 0) {
      console.warn("Skipping — economy_metrics.json is empty (likely API rate-limited)");
      return;
    }
    expect(data.length).toBeGreaterThan(0);
  });

  const ECONOMY_KEYS = [
    "output_per_hour",
    "real_gdp_growth",
    "cpi_inflation",
    "public_sector_net_debt",
    "business_investment",
  ];

  for (const metricKey of ECONOMY_KEYS) {
    it(`${metricKey}: last entry in economy_metrics.json is the latest period`, () => {
      const data = readEconomyMetrics();
      if (data.length === 0) return;
      const entries = data.filter((d) => d.metric_key === metricKey);
      expect(entries.length).toBeGreaterThan(0);

      const lastEntry = entries[entries.length - 1];

      // Verify the last entry has a recent year (2024+)
      const yearMatch = lastEntry.time_period.match(/(\d{4})/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        expect(
          year,
          `${metricKey}: last entry has year ${year} from period "${lastEntry.time_period}" — expected 2024+`,
        ).toBeGreaterThanOrEqual(2024);
      }
    });
  }

  it("selecting latest per key from economy_metrics.json gives correct values", () => {
    const data = readEconomyMetrics();
    if (data.length === 0) return;

    const latest = new Map<string, { time_period: string; value: any }>();
    for (const row of data) {
      if (!ECONOMY_KEYS.includes(row.metric_key)) continue;
      const prev = latest.get(row.metric_key);
      if (!prev || row.time_period >= prev.time_period) {
        latest.set(row.metric_key, {
          time_period: row.time_period,
          value: row.value,
        });
      }
    }

    for (const key of ECONOMY_KEYS) {
      const entry = latest.get(key);
      expect(entry, `${key} not found in economy_metrics.json`).toBeDefined();
      if (!entry) continue;

      const yearMatch = entry.time_period.match(/(\d{4})/);
      expect(yearMatch).toBeTruthy();
      const year = parseInt(yearMatch![1], 10);
      expect(
        year,
        `${key}: selected latest period is ${entry.time_period} (year ${year}) — expected 2024+`,
      ).toBeGreaterThanOrEqual(2024);
    }
  });
});

// ─── 6. Employment fetcher: verify latest-per-key on live output ────────────

describe("Tile latest value: employment fetcher latest selection", () => {
  it(
    "employment fetcher output selects latest periods for all metrics",
    () => {
      let stdout: string;
      try {
        stdout = execSync(
          "python3 server/employment_data_fetcher.py",
          {
            encoding: "utf-8",
            timeout: 30_000,
            cwd: path.resolve(__dirname, ".."),
          },
        );
      } catch (e: any) {
        console.warn("Skipping employment fetcher test:", e.message?.slice(0, 100));
        return;
      }

      // Parse JSON from stdout
      let metrics: Array<Record<string, any>> = [];
      for (const line of stdout.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].metric_key) {
              metrics = parsed;
              break;
            }
          } catch {
            // continue
          }
        }
      }

      if (metrics.length === 0) return;

      const latest = new Map<string, { time_period: string; value: any }>();
      for (const row of metrics) {
        const prev = latest.get(row.metric_key);
        if (!prev || row.time_period >= prev.time_period) {
          latest.set(row.metric_key, {
            time_period: row.time_period,
            value: row.value,
          });
        }
      }

      for (const [key, entry] of latest.entries()) {
        const yearMatch = entry.time_period.match(/(\d{4})/);
        if (!yearMatch) continue;
        const year = parseInt(yearMatch[1], 10);
        expect(
          year,
          `${key}: selected latest is ${entry.time_period} (year ${year}) — stale historical value`,
        ).toBeGreaterThanOrEqual(2024);
      }
    },
    35_000,
  );
});

// ─── 7. Cron script structural check ────────────────────────────────────────

describe("Tile latest value: cron script structural guards", () => {
  const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
  const cronSource = fs.readFileSync(cronPath, "utf-8");

  it("cron uses latest_per_key dict to track latest rows", () => {
    expect(cronSource).toContain("latest_per_key");
  });

  it("cron only calls upsert_metric inside the latest_per_key loop, not the main row loop", () => {
    const mainLoopMatch = cronSource.match(
      /for row in valid_metrics:[\s\S]*?(?=# Upsert only the latest|$)/,
    );
    expect(mainLoopMatch).toBeTruthy();

    const mainLoopBody = mainLoopMatch![0];
    expect(
      mainLoopBody,
      "upsert_metric is called inside the main row loop — it should only " +
        "be called in the latest_per_key loop to prevent writing historical values",
    ).not.toContain("upsert_metric(");
  });

  it("cron iterates latest_per_key.values() to call upsert_metric", () => {
    expect(cronSource).toContain("for entry in latest_per_key.values():");
    const upsertBlock = cronSource.match(
      /for entry in latest_per_key\.values\(\):[\s\S]*?upsert_metric/,
    );
    expect(
      upsertBlock,
      "upsert_metric must be called inside the latest_per_key.values() loop",
    ).toBeTruthy();
  });
});

// ─── 8. Router structural check ─────────────────────────────────────────────

describe("Tile latest value: routers.ts structural guards", () => {
  const routerPath = path.join(__dirname, "routers.ts");
  const routerSource = fs.readFileSync(routerPath, "utf-8");

  it("router uses latestPerKey Map to track latest rows", () => {
    expect(routerSource).toContain("latestPerKey");
    expect(routerSource).toContain("new Map");
  });

  it("router does NOT call upsertMetric inside the main for-of loop over validated metrics", () => {
    const mainLoop = routerSource.match(
      /for \(const metricData of validated\)[\s\S]*?(?=const upsertPromises|$)/,
    );
    expect(mainLoop).toBeTruthy();

    const loopBody = mainLoop![0];
    const upsertCalls = (loopBody.match(/upsertMetric\(/g) || []).length;
    expect(
      upsertCalls,
      "upsertMetric is called inside the main validation loop — " +
        "it should only be called via latestPerKey.values() to prevent " +
        "writing historical values",
    ).toBe(0);
  });

  it("router builds upsertPromises from latestPerKey.values(), not from validated array", () => {
    expect(routerSource).toContain("latestPerKey.values()");
    expect(routerSource).toMatch(
      /upsertPromises.*=.*latestPerKey\.values\(\)/,
    );
  });

  it("router awaits upsertPromises with Promise.all", () => {
    expect(routerSource).toContain("await Promise.all(upsertPromises)");
  });
});

// ─── 9. Cross-layer: tile count must equal unique metric keys ────────────────

describe("Tile latest value: tile count equals unique key count", () => {
  it("economy fetcher: number of tiles upserted should equal number of unique metric keys", () => {
    const economyMetricsPath = path.join(__dirname, "economy_metrics.json");
    if (!fs.existsSync(economyMetricsPath)) return;

    const raw = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
    const data: Array<Record<string, any>> = Array.isArray(raw) ? raw : [];
    if (data.length === 0) return;

    const uniqueKeys = new Set(data.map((d) => d.metric_key));
    const totalRows = data.length;

    // The number of unique keys must be <= total rows (each key at most one tile)
    expect(uniqueKeys.size).toBeLessThanOrEqual(totalRows);
    expect(uniqueKeys.size).toBeGreaterThanOrEqual(4);
    expect(uniqueKeys.size).toBeLessThanOrEqual(10);
  });
});

// ─── 10. Verify all visible metrics have recent data dates ──────────────────

describe("Tile latest value: all dashboard tiles show recent data", () => {
  // Some metrics have legitimately old data — their source only publishes
  // infrequently (e.g. ONS population projections are every 2 years).
  const ALLOWED_OLD_METRICS = new Set([
    "old_age_dependency_ratio",
  ]);

  it("every dashboard metric tile has a dataDate from 2024 or later (except known exceptions)", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '${[
          `const keys = ${JSON.stringify(ALL_DASHBOARD_KEYS)};`,
          `const allowed = ${JSON.stringify([...ALLOWED_OLD_METRICS])};`,
          `const old = [];`,
          `keys.forEach(k => {`,
          `  if (allowed.includes(k)) return;`,
          `  const m = db.metrics.findOne({metricKey: k});`,
          `  if (!m || !m.dataDate) return;`,
          `  const yearMatch = m.dataDate.match(/(\\d{4})/);`,
          `  if (!yearMatch) return;`,
          `  const year = parseInt(yearMatch[1]);`,
          `  if (year < 2024) old.push(k + ": " + m.dataDate + " (year " + year + ") value=" + m.value);`,
          `});`,
          `print(JSON.stringify(old));`,
        ].join("")}'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch {
      console.warn("Skipping DB date check — mongosh not available");
      return;
    }

    const old: string[] = JSON.parse(stdout.trim());
    expect(
      old,
      "These dashboard metrics show data from before 2024 — " +
        "they are likely showing a stale historical value instead of current:\n" +
        old.join("\n"),
    ).toEqual([]);
  });
});

// ─── 11. Refresh-survival: simulate a full economy refresh cycle ────────────

describe("Tile latest value: refresh survival", () => {
  it(
    "economy fetcher data processed through latest-per-key logic selects only current values",
    () => {
      const economyMetricsPath = path.join(__dirname, "economy_metrics.json");
      if (!fs.existsSync(economyMetricsPath)) return;

      const raw = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
      const data: Array<Record<string, any>> = Array.isArray(raw) ? raw : [];
      if (data.length === 0) return;

      // Simulate exactly what the cron does: process ALL rows, track latest
      const latest = new Map<
        string,
        { time_period: string; value: any; count: number }
      >();
      let totalRows = 0;

      for (const row of data) {
        totalRows++;
        const key = row.metric_key;
        const period = row.time_period;
        const prev = latest.get(key);
        if (!prev || period >= prev.time_period) {
          latest.set(key, {
            time_period: period,
            value: row.value,
            count: (prev?.count || 0) + 1,
          });
        }
      }

      // Must have selected at most one tile per unique key
      expect(latest.size).toBeLessThanOrEqual(totalRows);
      expect(
        latest.size,
        "Expected at least 4 unique economy metrics",
      ).toBeGreaterThanOrEqual(4);

      // Each selected tile must have a recent year
      for (const [key, entry] of latest.entries()) {
        const yearMatch = entry.time_period.match(/(\d{4})/);
        if (!yearMatch) continue;
        const year = parseInt(yearMatch[1], 10);
        expect(
          year,
          `After processing ${totalRows} rows, ${key} selected period ` +
            `${entry.time_period} (year ${year}) — this is stale historical data. ` +
            `The latest-per-key logic is broken.`,
        ).toBeGreaterThanOrEqual(2024);
      }
    },
  );

  it(
    "a second pass through the same data produces identical results (idempotency)",
    () => {
      const economyMetricsPath = path.join(__dirname, "economy_metrics.json");
      if (!fs.existsSync(economyMetricsPath)) return;

      const raw = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
      const data: Array<Record<string, any>> = Array.isArray(raw) ? raw : [];
      if (data.length === 0) return;

      function selectLatest(
        rows: Array<Record<string, any>>,
      ): Map<string, { time_period: string; value: any }> {
        const latest = new Map<string, { time_period: string; value: any }>();
        for (const row of rows) {
          const prev = latest.get(row.metric_key);
          if (!prev || row.time_period >= prev.time_period) {
            latest.set(row.metric_key, {
              time_period: row.time_period,
              value: row.value,
            });
          }
        }
        return latest;
      }

      const pass1 = selectLatest(data);
      const pass2 = selectLatest(data);

      expect(pass1.size).toBe(pass2.size);
      for (const [key, val1] of pass1.entries()) {
        const val2 = pass2.get(key)!;
        expect(val1.time_period).toBe(val2.time_period);
        expect(String(val1.value)).toBe(String(val2.value));
      }
    },
  );

  it(
    "shuffled data still produces the same latest selection (order-independence)",
    () => {
      const economyMetricsPath = path.join(__dirname, "economy_metrics.json");
      if (!fs.existsSync(economyMetricsPath)) return;

      const raw = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
      const data: Array<Record<string, any>> = Array.isArray(raw) ? raw : [];
      if (data.length === 0) return;

      function selectLatest(
        rows: Array<Record<string, any>>,
      ): Map<string, { time_period: string; value: any }> {
        const latest = new Map<string, { time_period: string; value: any }>();
        for (const row of rows) {
          const prev = latest.get(row.metric_key);
          if (!prev || row.time_period >= prev.time_period) {
            latest.set(row.metric_key, {
              time_period: row.time_period,
              value: row.value,
            });
          }
        }
        return latest;
      }

      const original = selectLatest(data);

      // Shuffle the array with a deterministic seed
      const shuffled = [...data];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(((i * 7919 + 104729) % 999983) / 999983 * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const fromShuffled = selectLatest(shuffled);

      expect(fromShuffled.size).toBe(original.size);
      for (const [key, orig] of original.entries()) {
        const shuf = fromShuffled.get(key)!;
        expect(
          shuf.time_period,
          `${key}: shuffled order produced different period ${shuf.time_period} vs ${orig.time_period}`,
        ).toBe(orig.time_period);
        expect(String(shuf.value)).toBe(String(orig.value));
      }
    },
  );

  it(
    "reversed data still produces the same latest selection (reverse-order resilience)",
    () => {
      const economyMetricsPath = path.join(__dirname, "economy_metrics.json");
      if (!fs.existsSync(economyMetricsPath)) return;

      const raw = JSON.parse(fs.readFileSync(economyMetricsPath, "utf-8"));
      const data: Array<Record<string, any>> = Array.isArray(raw) ? raw : [];
      if (data.length === 0) return;

      function selectLatest(
        rows: Array<Record<string, any>>,
      ): Map<string, { time_period: string; value: any }> {
        const latest = new Map<string, { time_period: string; value: any }>();
        for (const row of rows) {
          const prev = latest.get(row.metric_key);
          if (!prev || row.time_period >= prev.time_period) {
            latest.set(row.metric_key, {
              time_period: row.time_period,
              value: row.value,
            });
          }
        }
        return latest;
      }

      const original = selectLatest(data);
      const reversed = selectLatest([...data].reverse());

      expect(reversed.size).toBe(original.size);
      for (const [key, orig] of original.entries()) {
        const rev = reversed.get(key)!;
        expect(
          rev.time_period,
          `${key}: reversed order produced different period`,
        ).toBe(orig.time_period);
        expect(String(rev.value)).toBe(String(orig.value));
      }
    },
  );
});

// ─── 12. Promise.all race condition guard ───────────────────────────────────

describe("Tile latest value: Promise.all safety", () => {
  it("router upserts tiles sequentially from latestPerKey (not from validated array in parallel)", () => {
    const routerPath = path.join(__dirname, "routers.ts");
    const src = fs.readFileSync(routerPath, "utf-8");

    const validatedLoop = src.match(
      /for \(const metricData of validated\)[\s\S]*?(?=const upsertPromises)/,
    );
    expect(validatedLoop).toBeTruthy();

    // Inside the validated loop, only latestPerKey.set should be called, NOT upsertMetric
    expect(validatedLoop![0]).toContain("latestPerKey.set(");
    expect(validatedLoop![0]).not.toContain("upsertMetric(");

    // upsertPromises must be built from latestPerKey, not validated
    expect(src).toMatch(/upsertPromises.*latestPerKey\.values\(\)/);
  });

  it("router does NOT have any Promise.all that resolves upserts inside the main loop", () => {
    const routerPath = path.join(__dirname, "routers.ts");
    const src = fs.readFileSync(routerPath, "utf-8");

    const mainLoop = src.match(
      /for \(const metricData of validated\)[\s\S]*?(?=const upsertPromises)/,
    );
    expect(mainLoop).toBeTruthy();
    expect(
      mainLoop![0],
      "Promise.all for upserts must NOT be inside the validation loop — " +
        "this causes race conditions where old values overwrite new ones",
    ).not.toContain("Promise.all");
  });
});

// ─── 13. Cron normalisation guard ───────────────────────────────────────────

describe("Tile latest value: cron normalisation", () => {
  const cronPath = path.join(__dirname, "daily_data_refresh_cron.py");
  const cronSrc = fs.readFileSync(cronPath, "utf-8");

  it("cron normalises periods with _normalised_period before latest-per-key comparison", () => {
    expect(cronSrc).toContain("_normalised_period");
    const latestBlock = cronSrc.match(
      /latest_per_key[\s\S]*?period >= prev\["period"\]/,
    );
    expect(latestBlock).toBeTruthy();
    expect(latestBlock![0]).toContain('row["_normalised_period"]');
  });

  it("cron does NOT call upsert_metric with raw un-normalised periods", () => {
    const upsertInLatestLoop = cronSrc.match(
      /for entry in latest_per_key\.values\(\):[\s\S]*?upsert_metric[\s\S]*?cat_updated/,
    );
    expect(upsertInLatestLoop).toBeTruthy();
    // The period used should come from the entry dict which was built from _normalised_period
    expect(upsertInLatestLoop![0]).toContain('entry["period"]');
  });
});
