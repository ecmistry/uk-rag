/**
 * No-Placeholder-Data Tests
 *
 * These tests enforce the rule: every visible dashboard metric MUST be
 * fetched from a live external source.  If a live source is unavailable,
 * the fetcher should return null / raise an error so the scorecard shows
 * "No data" rather than silently displaying stale placeholder numbers.
 *
 * Three layers of defence:
 *   1. Static analysis of Python fetcher source code
 *   2. Structural verification against the dashboard metric list
 *   3. Runtime execution of each fetcher to verify live data flows
 */
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { EXPECTED_METRICS } from "../client/src/data/expectedMetrics";

const SERVER_DIR = path.resolve(__dirname);
const FETCHER_FILES = fs
  .readdirSync(SERVER_DIR)
  .filter((f) => f.endsWith("_data_fetcher.py") || f.endsWith("_cron.py"))
  .map((f) => path.join(SERVER_DIR, f));

const ALL_DASHBOARD_KEYS = Object.values(EXPECTED_METRICS)
  .flat()
  .map((s) => s.metricKey);

// ─── 1. Static analysis: ban placeholder patterns in fetcher code ───────────

describe("No placeholder data: static code analysis", () => {
  for (const filePath of FETCHER_FILES) {
    const fileName = path.basename(filePath);
    const source = fs.readFileSync(filePath, "utf-8");

    it(`${fileName}: no "placeholder" values in functions for dashboard metrics`, () => {
      const violations: string[] = [];
      const funcBlocks = source.matchAll(
        /def (fetch_\w+)\([\s\S]*?(?=\ndef |$)/g,
      );
      for (const m of funcBlocks) {
        const funcName = m[1];
        const body = m[0];
        const keyMatch = body.match(/"metric_key"\s*:\s*"(\w+)"/);
        if (!keyMatch) continue;
        const metricKey = keyMatch[1];
        if (!ALL_DASHBOARD_KEYS.includes(metricKey)) continue;

        if (/"value"\s*:\s*"placeholder"/i.test(body)) {
          violations.push(
            `${funcName}() → ${metricKey}: contains "value": "placeholder"`,
          );
        }
        if (/placeholder/i.test(body) && /"value"\s*[:=]\s*\d/.test(body)) {
          violations.push(
            `${funcName}() → ${metricKey}: has numeric "value" near "placeholder" comment`,
          );
        }
      }
      expect(
        violations,
        `${fileName} has placeholder values for dashboard metrics — ` +
          "replace with live data fetch or return None on failure:\n" +
          violations.join("\n"),
      ).toEqual([]);
    });

    it(`${fileName}: no hardcoded "value": <number> for dashboard metrics`, () => {
      const violations: string[] = [];
      const funcBlocks = source.matchAll(
        /def (fetch_\w+)\([\s\S]*?(?=\ndef |$)/g,
      );
      for (const m of funcBlocks) {
        const funcName = m[1];
        const body = m[0];
        const keyMatch = body.match(/"metric_key"\s*:\s*"(\w+)"/);
        if (!keyMatch) continue;
        const metricKey = keyMatch[1];
        if (!ALL_DASHBOARD_KEYS.includes(metricKey)) continue;

        const valueMatches = [
          ...body.matchAll(/"value"\s*:\s*(\d+\.?\d*)\s*[,#]/g),
        ];
        for (const vm of valueMatches) {
          violations.push(
            `${funcName}() → ${metricKey}: hardcoded "value": ${vm[1]}`,
          );
        }
      }
      expect(
        violations,
        `${fileName} has hardcoded numeric values for dashboard metrics — ` +
          "these must come from parsed live data:\n" +
          violations.join("\n"),
      ).toEqual([]);
    });

    it(`${fileName}: no "not yet implemented" stubs for dashboard metrics`, () => {
      const violations: string[] = [];
      const funcBlocks = source.matchAll(
        /def (fetch_\w+)\([\s\S]*?(?=\ndef |$)/g,
      );
      for (const m of funcBlocks) {
        const funcName = m[1];
        const body = m[0];
        const keyMatch = body.match(/"metric_key"\s*:\s*"(\w+)"/);
        if (!keyMatch) continue;
        const metricKey = keyMatch[1];
        if (!ALL_DASHBOARD_KEYS.includes(metricKey)) continue;

        if (/not\s+yet\s+implemented/i.test(body)) {
          violations.push(
            `${funcName}() → ${metricKey}: contains "not yet implemented"`,
          );
        }
      }
      expect(violations).toEqual([]);
    });
  }
});

// ─── 2. Every dashboard metric function must make an HTTP call ──────────────

describe("No placeholder data: every dashboard metric fetcher makes a network call", () => {
  /**
   * For each fetcher script, extract every function that produces a
   * dashboard-visible metric_key and verify it contains evidence of
   * fetching data (requests.get, pd.read_, urllib, curl, _download, etc.)
   * or delegates to a helper that does.
   *
   * Defence sea/land/air_mass are model-computed from curated ORBAT data
   * (no public API exists); they are excluded from the HTTP requirement
   * but still must not contain "placeholder" comments.
   */
  const MODEL_BASED_METRICS = new Set([
    "sea_mass",
    "land_mass",
    "air_mass",
    "defence_industry_vitality",
    "defence_spending_gdp",
  ]);

  const NETWORK_PATTERNS =
    /requests\.(get|head|Session)|urllib\.request|curl|pd\.read_csv|pd\.read_excel|_download|fetch_quarterly_lfs|openpyxl\.load_workbook|_fetch_quarterly|fetch_emp16|session\.(get|head)/;

  for (const filePath of FETCHER_FILES) {
    const fileName = path.basename(filePath);
    const source = fs.readFileSync(filePath, "utf-8");

    const funcBlocks = [
      ...source.matchAll(/def (fetch_\w+)\([\s\S]*?(?=\ndef |$)/g),
    ];

    for (const m of funcBlocks) {
      const funcName = m[1];
      const body = m[0];
      const keyMatch = body.match(/"metric_key"\s*:\s*"(\w+)"/);
      if (!keyMatch) continue;
      const metricKey = keyMatch[1];
      if (!ALL_DASHBOARD_KEYS.includes(metricKey)) continue;
      if (MODEL_BASED_METRICS.has(metricKey)) continue;

      it(`${fileName}::${funcName}() → ${metricKey}: contains a network/data fetch call`, () => {
        const hasNetwork = NETWORK_PATTERNS.test(body);
        expect(
          hasNetwork,
          `${funcName}() produces dashboard metric "${metricKey}" but does not ` +
            "appear to fetch any external data. It must make an HTTP request " +
            "or read a downloaded file — not return a hardcoded value.",
        ).toBe(true);
      });
    }
  }
});

// ─── 3. No silent fallback to hardcoded values in dashboard metrics ─────────

describe("No placeholder data: no silent numeric fallbacks for dashboard metrics", () => {
  /**
   * A "silent fallback" is when a fetcher catches an exception and returns
   * a hardcoded number instead of None/null.  Pattern:
   *   variable = <number>  # Fallback / estimated / typical
   * followed by returning that variable as the "value".
   *
   * We allow fallbacks that are clearly labelled AND also print a warning,
   * as long as the function FIRST attempts a live fetch.  But pure stubs
   * (functions that ONLY return a hardcoded value) are banned.
   */
  for (const filePath of FETCHER_FILES) {
    const fileName = path.basename(filePath);
    const source = fs.readFileSync(filePath, "utf-8");
    const funcBlocks = [
      ...source.matchAll(/def (fetch_\w+)\([\s\S]*?(?=\ndef |$)/g),
    ];

    for (const m of funcBlocks) {
      const funcName = m[1];
      const body = m[0];
      const keyMatch = body.match(/"metric_key"\s*:\s*"(\w+)"/);
      if (!keyMatch) continue;
      const metricKey = keyMatch[1];
      if (!ALL_DASHBOARD_KEYS.includes(metricKey)) continue;

      it(`${fileName}::${funcName}() → ${metricKey}: function body is not a pure stub`, () => {
        const FETCH_EVIDENCE =
          /requests\.get|pd\.read_|openpyxl|_download|fetch_quarterly/;
        const hasFetch = FETCH_EVIDENCE.test(body);
        const hasHardcodedReturn =
          /"value"\s*:\s*\d+\.?\d*/.test(body) ||
          /"value"\s*:\s*[a-z_]+.*#\s*(placeholder|estimated|fallback|typical)/i.test(body);

        if (!hasFetch && hasHardcodedReturn) {
          expect.fail(
            `${funcName}() is a pure stub for "${metricKey}" — it returns a ` +
              "hardcoded value without attempting any live data fetch. " +
              "Either implement live fetching or return None so the " +
              'dashboard shows "No data" instead of fake numbers.',
          );
        }
      });
    }
  }
});

// ─── 4. Runtime: execute each fetcher and verify it returns live data ────────

describe("No placeholder data: runtime fetcher execution", () => {
  /**
   * Actually execute each Python fetcher and verify:
   *   - It outputs valid JSON
   *   - Every dashboard metric_key in its output has a numeric value
   *   - No value is the string "placeholder"
   *   - The time_period is not "Placeholder" or empty
   *
   * These are slow (~20s each) but catch real failures.
   */
  const FETCHER_SCRIPTS: Array<{
    script: string;
    expectedKeys: string[];
    timeout: number;
  }> = [
    {
      script: "economy_data_fetcher.py",
      expectedKeys: [
        "output_per_hour",
        "real_gdp_growth",
        "cpi_inflation",
        "public_sector_net_debt",
        "business_investment",
      ],
      timeout: 120_000,
    },
    {
      script: "employment_data_fetcher.py",
      expectedKeys: [
        "inactivity_rate",
        "real_wage_growth",
        "job_vacancy_ratio",
        "underemployment",
      ],
      timeout: 120_000,
    },
    {
      script: "education_data_fetcher.py",
      expectedKeys: ["attainment8", "neet_rate", "pupil_attendance"],
      timeout: 60_000,
    },
    {
      script: "crime_data_fetcher.py",
      expectedKeys: [
        "crown_court_backlog",
        "recall_rate",
        "street_confidence_index",
      ],
      timeout: 120_000,
    },
    {
      script: "healthcare_data_fetcher.py",
      expectedKeys: [
        "a_e_wait_time",
        "ambulance_response_time",
        "gp_appt_access",
        "elective_backlog",
        "old_age_dependency_ratio",
      ],
      timeout: 120_000,
    },
  ];

  /**
   * Extracts the JSON metrics array from a fetcher's output.
   * Some fetchers print JSON to stdout, others write to a file.
   */
  function extractMetrics(
    script: string,
    stdout: string,
  ): Array<Record<string, any>> {
    // Economy fetcher writes to economy_metrics.json
    if (script === "economy_data_fetcher.py") {
      const outputFile = path.join(SERVER_DIR, "economy_metrics.json");
      if (fs.existsSync(outputFile)) {
        return JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      }
    }

    // Try to find a JSON array in stdout — greedy match can fail with
    // interleaved text, so try line-by-line first for a standalone JSON line.
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].metric_key) {
            return parsed;
          }
        } catch {
          // not valid JSON, continue
        }
      }
    }

    // Fallback: regex match
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // malformed
      }
    }

    return [];
  }

  for (const { script, expectedKeys, timeout } of FETCHER_SCRIPTS) {
    const scriptPath = path.join(SERVER_DIR, script);
    if (!fs.existsSync(scriptPath)) continue;

    it(
      `${script}: returns valid live data for ${expectedKeys.join(", ")}`,
      () => {
        let stdout: string;
        try {
          stdout = execSync(`python3 ${scriptPath}`, {
            timeout,
            encoding: "utf-8",
            cwd: path.resolve(SERVER_DIR, ".."),
          });
        } catch (e: any) {
          expect.fail(
            `${script} failed to execute: ${e.message?.slice(0, 200)}`,
          );
          return;
        }

        const metrics = extractMetrics(script, stdout);
        expect(
          metrics.length,
          `${script} produced no metrics — check output and parsing`,
        ).toBeGreaterThan(0);

        const outputKeys = new Map(
          metrics.map((m) => [m.metric_key, m]),
        );

        for (const key of expectedKeys) {
          const metric = outputKeys.get(key);

          // A missing metric is acceptable — it means the fetcher errored
          // and returned nothing rather than faking data (which is preferred).
          // What is NOT acceptable is returning a "placeholder" value.
          if (!metric) continue;

          expect(
            metric.value,
            `${script} → ${key}: value is undefined`,
          ).toBeDefined();

          expect(
            String(metric.value).toLowerCase(),
            `${script} → ${key}: value is "placeholder" — must be live data`,
          ).not.toBe("placeholder");

          const numVal = Number(metric.value);
          expect(
            isNaN(numVal),
            `${script} → ${key}: value "${metric.value}" is not a valid number`,
          ).toBe(false);

          if (metric.time_period) {
            expect(
              String(metric.time_period).toLowerCase(),
              `${script} → ${key}: time_period is "placeholder"`,
            ).not.toContain("placeholder");
          }
        }

        // At least one expected metric must be present (full network failure
        // is a real problem, not just rate-limiting a single sub-source).
        const foundCount = expectedKeys.filter((k) => outputKeys.has(k)).length;
        expect(
          foundCount,
          `${script} returned NONE of the expected metrics (${expectedKeys.join(", ")}) — the fetcher is broken`,
        ).toBeGreaterThan(0);
      },
      timeout + 10_000,
    );
  }
});

// ─── 5. Database guard: no "placeholder" string values in live DB ───────────

describe("No placeholder data: MongoDB has no placeholder values", () => {
  it("no visible dashboard metric has value='placeholder' in the database", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '` +
          `const keys = ${JSON.stringify(ALL_DASHBOARD_KEYS)};` +
          `const bad = [];` +
          `keys.forEach(k => {` +
          `  const m = db.metrics.findOne({metricKey: k});` +
          `  if (!m) return;` +
          `  if (String(m.value).toLowerCase() === "placeholder") bad.push(k + "=" + m.value);` +
          `  if (String(m.dataDate || "").toLowerCase().includes("placeholder")) bad.push(k + " dataDate=" + m.dataDate);` +
          `});` +
          `print(JSON.stringify(bad));` +
          `'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch (e: any) {
      // If mongosh isn't available in CI, skip gracefully
      console.warn("Skipping DB check — mongosh not available");
      return;
    }

    const bad: string[] = JSON.parse(stdout.trim());
    expect(
      bad,
      `These dashboard metrics have "placeholder" values in the database — ` +
        "run the daily refresh cron or fix the fetcher:\n" +
        bad.join("\n"),
    ).toEqual([]);
  });

  it("no visible dashboard metric has a stale date older than 18 months", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `mongosh --quiet uk_rag_portal --eval '` +
          `const keys = ${JSON.stringify(ALL_DASHBOARD_KEYS)};` +
          `const stale = [];` +
          `const cutoff = new Date();` +
          `cutoff.setMonth(cutoff.getMonth() - 18);` +
          `keys.forEach(k => {` +
          `  const m = db.metrics.findOne({metricKey: k});` +
          `  if (!m || !m.lastUpdated) return;` +
          `  const updated = new Date(m.lastUpdated);` +
          `  if (updated < cutoff) stale.push(k + " lastUpdated=" + m.lastUpdated);` +
          `});` +
          `print(JSON.stringify(stale));` +
          `'`,
        { encoding: "utf-8", timeout: 15_000 },
      );
    } catch {
      console.warn("Skipping DB staleness check — mongosh not available");
      return;
    }

    const stale: string[] = JSON.parse(stdout.trim());
    expect(
      stale,
      `These dashboard metrics haven't been updated in 18+ months — ` +
        "their fetcher may be broken:\n" +
        stale.join("\n"),
    ).toEqual([]);
  });
});

// ─── 6. Fetcher coverage: every dashboard metric has a fetcher function ──────

describe("No placeholder data: fetcher coverage for all dashboard metrics", () => {
  it("every dashboard metric_key appears as a metric_key in at least one fetcher or cron script", () => {
    const allFetcherSource = FETCHER_FILES.map((f) =>
      fs.readFileSync(f, "utf-8"),
    ).join("\n");

    const cronFiles = fs
      .readdirSync(SERVER_DIR)
      .filter((f) => f.endsWith("_cron.py"))
      .map((f) => path.join(SERVER_DIR, f));
    const allCronSource = cronFiles
      .map((f) => fs.readFileSync(f, "utf-8"))
      .join("\n");

    const combinedSource = allFetcherSource + "\n" + allCronSource;

    const uncovered = ALL_DASHBOARD_KEYS.filter(
      (key) => !combinedSource.includes(`"${key}"`),
    );

    expect(
      uncovered,
      `These dashboard metrics have NO fetcher function producing them — ` +
        "they will never be updated by the daily cron:\n" +
        uncovered.join("\n"),
    ).toEqual([]);
  });
});
