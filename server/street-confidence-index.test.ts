/**
 * Street Confidence Index (Perception of Safety) Tests
 *
 * Prevents the bug where the fetcher extracted an UnweightedCount (59)
 * from the wrong column/row of the CSEW "Perceptions Other" dataset
 * instead of real perception-of-safety data.  The metric should reflect
 * "% who feel Not very safe / Not safe at all walking alone" and use the
 * ONS Annual Supplementary Tables (Table B7).
 *
 * Layers:
 *   1. Fetcher structural checks: correct data source, no vague search
 *   2. RAG threshold alignment with dataIngestion.ts
 *   3. Fetcher output validation: values in expected range
 *   4. Database consistency: tile matches latest history
 *   5. Value sanity: no nonsensical values (UnweightedCount leak)
 */
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const FETCHER_PATH = path.join(__dirname, "crime_data_fetcher.py");
const CRON_PATH = path.join(__dirname, "daily_data_refresh_cron.py");
const INGESTION_PATH = path.join(__dirname, "dataIngestion.ts");

const fetcherSrc = fs.readFileSync(FETCHER_PATH, "utf-8");
const cronSrc = fs.readFileSync(CRON_PATH, "utf-8");
const ingestionSrc = fs.readFileSync(INGESTION_PATH, "utf-8");

// ─── 1. Fetcher structural checks ────────────────────────────────────────────

describe("street_confidence_index: fetcher structure", () => {
  it("fetcher uses Annual Supplementary Tables, not Perceptions Other", () => {
    expect(fetcherSrc).toContain("annualsupplementarytables");
    expect(fetcherSrc).not.toMatch(
      /perceptionsotherenglandandwales.*\.zip/,
    );
  });

  it("fetcher references Table B7", () => {
    expect(fetcherSrc).toContain("Table B7");
  });

  it("fetcher computes unsafe% as 100 minus safe%", () => {
    expect(fetcherSrc).toMatch(/100[\s.]*[0-]*\s*-\s*safe/i);
  });

  it("fetcher does NOT use vague keyword matching for row selection", () => {
    const hasSafeKeywordSearch = /if.*["']safe["'].*in.*row_str/.test(fetcherSrc) &&
      /if.*["']perception["'].*in.*row_str/.test(fetcherSrc);
    expect(hasSafeKeywordSearch).toBe(false);
  });

  it("fetcher does NOT have a hardcoded filter range 40-95", () => {
    expect(fetcherSrc).not.toMatch(/40\s*<=\s*v\s*<=\s*95/);
  });

  it("fetcher uses openpyxl (not generic pd.read_csv for this metric)", () => {
    expect(fetcherSrc).toContain("openpyxl");
  });

  it("fetcher returns a list (not a single dict)", () => {
    expect(fetcherSrc).toMatch(/return\s+results/);
    expect(fetcherSrc).not.toMatch(
      /return\s+\{[^}]*metric_key.*street_confidence/,
    );
  });

  it("main() uses extend (not append) for perception results", () => {
    expect(fetcherSrc).toMatch(/metrics\.extend\(perception/);
  });
});

// ─── 2. RAG threshold alignment ──────────────────────────────────────────────

describe("street_confidence_index: RAG thresholds", () => {
  it("dataIngestion.ts defines lower_better direction", () => {
    const match = ingestionSrc.match(
      /street_confidence_index\s*:\s*\{[^}]*direction\s*:\s*['"](\w+)['"]/,
    );
    expect(match).not.toBeNull();
    expect(match![1]).toBe("lower_better");
  });

  it("dataIngestion.ts greenMax is 20", () => {
    const match = ingestionSrc.match(
      /street_confidence_index\s*:\s*\{[^}]*greenMax\s*:\s*(\d+)/,
    );
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(20);
  });

  it("dataIngestion.ts amberMax is 30", () => {
    const match = ingestionSrc.match(
      /street_confidence_index\s*:\s*\{[^}]*amberMax\s*:\s*(\d+)/,
    );
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(30);
  });

  it("fetcher RAG treats street_confidence_index as lower_better", () => {
    expect(fetcherSrc).toMatch(
      /street_confidence_index.*lower.is.better/is,
    );
    const calcFn = fetcherSrc.match(
      /def calculate_rag_status[\s\S]*?(?=\ndef\s)/,
    );
    expect(calcFn).not.toBeNull();
    const fnBody = calcFn![0];
    expect(fnBody).not.toMatch(
      /["']charge_rate["'].*["']street_confidence_index["']/,
    );
  });

  it("fetcher RAG thresholds match centralised (green=20, amber=30)", () => {
    const thresholdBlock = fetcherSrc.match(
      /"street_confidence_index"\s*:\s*\{([^}]+)\}/,
    );
    expect(thresholdBlock).not.toBeNull();
    const block = thresholdBlock![1];
    const greenMatch = block.match(/"green"\s*:\s*([\d.]+)/);
    const amberMatch = block.match(/"amber"\s*:\s*([\d.]+)/);
    expect(greenMatch).not.toBeNull();
    expect(amberMatch).not.toBeNull();
    expect(Number(greenMatch![1])).toBe(20);
    expect(Number(amberMatch![1])).toBe(30);
  });
});

// ─── 3. Fetcher output validation ────────────────────────────────────────────

describe("street_confidence_index: fetcher output", () => {
  let fetcherOutput: Array<{
    metric_key: string;
    value: number;
    time_period: string;
    rag_status: string;
  }> = [];

  const runFetcher = () => {
    if (fetcherOutput.length > 0) return;
    try {
      const stdout = execSync(
        `python3 -c "
import sys, json
sys.path.insert(0, 'server')
from crime_data_fetcher import fetch_perception_of_safety_data
results = fetch_perception_of_safety_data()
print(json.dumps(results))
"`,
        { encoding: "utf-8", timeout: 60000, cwd: path.join(__dirname, "..") },
      );
      fetcherOutput = JSON.parse(stdout.trim().split("\n").pop()!);
    } catch {
      fetcherOutput = [];
    }
  };

  it("fetcher returns at least 10 data points", () => {
    runFetcher();
    expect(fetcherOutput.length).toBeGreaterThanOrEqual(10);
  });

  it("all values are between 0 and 50 (% feeling unsafe)", () => {
    runFetcher();
    if (fetcherOutput.length === 0) return; // tolerate network failure
    for (const row of fetcherOutput) {
      expect(row.value).toBeGreaterThan(0);
      expect(row.value).toBeLessThan(50);
    }
  });

  it("no value equals 59 (the old UnweightedCount bug)", () => {
    runFetcher();
    for (const row of fetcherOutput) {
      expect(row.value).not.toBe(59);
      expect(row.value).not.toBe(59.0);
    }
  });

  it("latest data point is from 2024 or later", () => {
    runFetcher();
    if (fetcherOutput.length === 0) return;
    const latest = fetcherOutput[fetcherOutput.length - 1];
    const yearMatch = latest.time_period.match(/(\d{4})/);
    expect(yearMatch).not.toBeNull();
    expect(Number(yearMatch![1])).toBeGreaterThanOrEqual(2024);
  });

  it("all time_period values are in YYYY QN format", () => {
    runFetcher();
    for (const row of fetcherOutput) {
      expect(row.time_period).toMatch(/^\d{4}\s+Q[1-4]$/);
    }
  });

  it("all rag_status values are valid", () => {
    runFetcher();
    for (const row of fetcherOutput) {
      expect(["green", "amber", "red"]).toContain(row.rag_status);
    }
  });

  it("RAG is correct for latest value given centralised thresholds", () => {
    runFetcher();
    if (fetcherOutput.length === 0) return;
    const latest = fetcherOutput[fetcherOutput.length - 1];
    let expected: string;
    if (latest.value <= 20) expected = "green";
    else if (latest.value <= 30) expected = "amber";
    else expected = "red";
    expect(latest.rag_status).toBe(expected);
  });
});

// ─── 4. Database consistency ─────────────────────────────────────────────────

describe("street_confidence_index: database consistency", () => {
  const runMongo = (script: string): string => {
    try {
      return execSync(`mongosh --quiet uk_rag_portal --eval '${script}'`, {
        encoding: "utf-8",
        timeout: 10000,
      }).trim();
    } catch {
      return "";
    }
  };

  it("tile exists in metrics collection", () => {
    const result = runMongo(
      'const t = db.metrics.findOne({metricKey:"street_confidence_index"}); print(t ? "found" : "missing")',
    );
    expect(result).toBe("found");
  });

  it("tile value matches latest history entry", () => {
    let stdout: string;
    try {
      stdout = execSync(
        `node -e "
const { MongoClient } = require('mongodb');
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await client.connect();
  const db = client.db('uk_rag_portal');
  const t = await db.collection('metrics').findOne({ metricKey: 'street_confidence_index' });
  const h = await db.collection('metricHistory').find({ metricKey: 'street_confidence_index' }).sort({ dataDate: -1 }).limit(1).toArray();
  await client.close();
  if (!t || !h[0]) { console.log('SKIP'); return; }
  console.log(t.value === h[0].value && t.dataDate === h[0].dataDate ? 'MATCH' : 'MISMATCH');
}
main();
"`,
        { encoding: "utf-8", timeout: 10000 },
      ).trim();
    } catch {
      stdout = "SKIP";
    }
    if (stdout === "SKIP") return;
    expect(stdout).toBe("MATCH");
  });

  it("tile value is not 59 (the old bug)", () => {
    const result = runMongo(
      'const t = db.metrics.findOne({metricKey:"street_confidence_index"}); print(t ? t.value : "N/A")',
    );
    expect(result).not.toBe("59");
    expect(result).not.toBe("59.0");
  });

  it("tile value is between 1 and 50", () => {
    const result = runMongo(
      'const t = db.metrics.findOne({metricKey:"street_confidence_index"}); print(t ? t.value : "N/A")',
    );
    if (result === "N/A") return;
    const val = parseFloat(result);
    expect(val).toBeGreaterThan(1);
    expect(val).toBeLessThan(50);
  });

  it("history has at least 10 entries", () => {
    const result = runMongo(
      'print(db.metricHistory.countDocuments({metricKey:"street_confidence_index"}))',
    );
    expect(Number(result)).toBeGreaterThanOrEqual(10);
  });

  it("no history entry has value 59", () => {
    const result = runMongo(
      'print(db.metricHistory.countDocuments({metricKey:"street_confidence_index", value:{$in:["59","59.0"]}}))',
    );
    expect(Number(result)).toBe(0);
  });

  it("all history values are between 1 and 50", () => {
    const result = runMongo(
      [
        'const docs = db.metricHistory.find({metricKey:"street_confidence_index"}).toArray();',
        "const bad = docs.filter(d => { const v = parseFloat(d.value); return v < 1 || v > 50; });",
        "print(bad.length);",
      ].join(" "),
    );
    expect(Number(result)).toBe(0);
  });

  it("tile ragStatus matches its value given centralised thresholds", () => {
    const result = runMongo(
      [
        'const t = db.metrics.findOne({metricKey:"street_confidence_index"});',
        "if (!t) { print('SKIP'); }",
        "else {",
        "  const v = parseFloat(t.value);",
        '  const expected = v <= 20 ? "green" : v <= 30 ? "amber" : "red";',
        '  print(t.ragStatus === expected ? "OK" : "MISMATCH expected=" + expected + " got=" + t.ragStatus + " value=" + v);',
        "}",
      ].join(" "),
    );
    if (result === "SKIP") return;
    expect(result).toBe("OK");
  });
});

// ─── 5. Value sanity: no nonsensical values ──────────────────────────────────

describe("street_confidence_index: value sanity guards", () => {
  it("fetcher does not extract values from UnweightedCount column", () => {
    expect(fetcherSrc).not.toMatch(/UnweightedCount/i);
    expect(fetcherSrc).not.toMatch(/40\s*<=\s*v\s*<=\s*95/);
  });

  it("fetcher searches for 'All people' row specifically", () => {
    expect(fetcherSrc).toMatch(/all.people/i);
  });

  it("fetcher converts safe% to unsafe% via subtraction from 100", () => {
    expect(fetcherSrc).toMatch(/100[\s.]*[0-]*\s*-\s*safe/i);
  });

  it("cron validation bounds allow street_confidence_index 0-100", () => {
    const match = cronSrc.match(
      /["']street_confidence_index["']\s*:\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/,
    );
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(0);
    expect(Number(match![2])).toBe(100);
  });
});
