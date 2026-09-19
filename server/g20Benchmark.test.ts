import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  percentileFromBest,
  ragFromPercentile,
  parseWorldBankLatest,
  parseImfPanel,
  buildMeasure,
  buildHistoryFromPanel,
  computeComposite,
  computeCategoryRollups,
  buildInsights,
  MEASURE_DEFS,
  G20_ISO3,
  G7_ISO3,
  type MeasureDef,
  type PeerObservation,
} from "./g20Benchmark";

const gdpDef = MEASURE_DEFS.find((d) => d.key === "g20_real_gdp_growth")!;
const cpiDef = MEASURE_DEFS.find((d) => d.key === "g20_cpi_inflation")!;
const debtDef = MEASURE_DEFS.find((d) => d.key === "g20_gov_debt_gdp")!;

function peersFrom(values: Array<[string, number]>, year = 2025): PeerObservation[] {
  return values.map(([iso3, value]) => ({
    iso3,
    name: iso3,
    value,
    year,
  }));
}

describe("G20 percentile RAG thresholds", () => {
  it("ranks UK green when in top 20% (higher better)", () => {
    const peers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const pct = percentileFromBest(9, peers, "higher_better");
    expect(pct).toBeCloseTo(100 / 9, 5);
    expect(ragFromPercentile(pct)).toBe("green");
  });

  it("ranks UK amber in the 21–50% band", () => {
    const peers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const pct = percentileFromBest(8, peers, "higher_better");
    expect(pct).toBeCloseTo(200 / 9, 5);
    expect(ragFromPercentile(pct)).toBe("amber");
  });

  it("ranks UK red in the bottom half", () => {
    const peers = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const pct = percentileFromBest(4, peers, "higher_better");
    expect(pct).toBeCloseTo(600 / 9, 5);
    expect(ragFromPercentile(pct)).toBe("red");
  });

  it("inverts ranking for lower-better metrics", () => {
    const peers = [5, 4, 3, 2, 1];
    const pct = percentileFromBest(2, peers, "lower_better");
    expect(pct).toBeCloseTo(25, 5);
    expect(ragFromPercentile(pct)).toBe("amber");
  });

  it("treats best performer as green", () => {
    expect(ragFromPercentile(percentileFromBest(1, [1, 2, 3, 4, 5], "lower_better"))).toBe("green");
  });

  it("boundary: exactly 20% is green; just above is amber", () => {
    expect(ragFromPercentile(20)).toBe("green");
    expect(ragFromPercentile(20.1)).toBe("amber");
  });

  it("boundary: exactly 50% is amber; just above is red", () => {
    expect(ragFromPercentile(50)).toBe("amber");
    expect(ragFromPercentile(50.1)).toBe("red");
  });

  it("handles single-peer edge case without dividing by zero", () => {
    expect(percentileFromBest(3, [3], "higher_better")).toBe(0);
  });
});

describe("World Bank row parser", () => {
  it("keeps latest year per country and drops nulls / future years", () => {
    const rows = [
      { countryiso3code: "GBR", date: "2024", value: 1.1, country: { value: "United Kingdom" } },
      { countryiso3code: "GBR", date: "2025", value: 1.4, country: { value: "United Kingdom" } },
      { countryiso3code: "USA", date: "2025", value: 2.5, country: { value: "United States" } },
      { countryiso3code: "USA", date: "2027", value: 9.9, country: { value: "United States" } },
      { countryiso3code: "FRA", date: "2025", value: null, country: { value: "France" } },
    ];
    const peers = parseWorldBankLatest(rows, 2026);
    expect(peers).toHaveLength(2);
    const gbr = peers.find((p) => p.iso3 === "GBR")!;
    expect(gbr.value).toBe(1.4);
    expect(gbr.year).toBe(2025);
    expect(peers.find((p) => p.iso3 === "USA")!.year).toBe(2025);
  });
});

describe("IMF panel parser", () => {
  it("excludes forecast years beyond maxYear", () => {
    const series = {
      GBR: { "2024": 100, "2025": 103, "2030": 110 },
      USA: { "2024": 120, "2025": 122, "2030": 130 },
      DEU: { "2025": 65 },
    };
    const { latest, byYear } = parseImfPanel(series, ["GBR", "USA", "DEU"], 2026);
    expect(latest.find((p) => p.iso3 === "GBR")!.year).toBe(2025);
    expect(byYear.has(2030)).toBe(false);
    expect(byYear.get(2025)).toHaveLength(3);
  });
});

describe("buildMeasure", () => {
  it("marks unknown when fewer than 5 peers", () => {
    const m = buildMeasure(gdpDef, peersFrom([["GBR", 1], ["USA", 2], ["DEU", 3]]));
    expect(m.ragStatus).toBe("unknown");
    expect(m.coverageNote).toMatch(/below minimum/i);
  });

  it("marks unknown when UK missing", () => {
    const m = buildMeasure(
      gdpDef,
      peersFrom([
        ["USA", 2], ["DEU", 1], ["FRA", 1.5], ["JPN", 0.5], ["CAN", 1.2],
      ]),
    );
    expect(m.ragStatus).toBe("unknown");
    expect(m.coverageNote).toMatch(/UK observation missing/i);
  });

  it("sorts peers best-first for higher_better and lower_better", () => {
    const high = buildMeasure(
      gdpDef,
      peersFrom([
        ["GBR", 2], ["USA", 5], ["DEU", 1], ["FRA", 3], ["JPN", 4], ["ITA", 0],
      ]),
    );
    expect(high.peers[0].iso3).toBe("USA");
    expect(high.ragStatus).not.toBe("unknown");

    const low = buildMeasure(
      cpiDef,
      peersFrom([
        ["GBR", 3], ["USA", 2], ["DEU", 5], ["FRA", 4], ["JPN", 1], ["ITA", 6],
      ]),
    );
    expect(low.peers[0].iso3).toBe("JPN");
  });

  it("computes G7 lens alongside G20", () => {
    const m = buildMeasure(
      debtDef,
      peersFrom([
        ["GBR", 100],
        ["USA", 120],
        ["DEU", 60],
        ["FRA", 110],
        ["ITA", 140],
        ["JPN", 250],
        ["CAN", 90],
        ["AUS", 50],
        ["KOR", 55],
        ["CHN", 80],
      ]),
    );
    expect(m.g7PeerCount).toBe(7);
    expect(m.g7PercentileFromBest).not.toBeNull();
    expect(["green", "amber", "red"]).toContain(m.g7RagStatus);
  });
});

describe("history panel", () => {
  it("builds year points only when UK + enough peers exist", () => {
    const byYear = new Map<number, PeerObservation[]>([
      [2023, peersFrom([["GBR", 2], ["USA", 3], ["DEU", 1]], 2023)],
      [
        2024,
        peersFrom(
          [
            ["GBR", 2], ["USA", 4], ["DEU", 1], ["FRA", 3], ["JPN", 0.5], ["ITA", 1.5],
          ],
          2024,
        ),
      ],
      [
        2025,
        peersFrom(
          [
            ["GBR", 1], ["USA", 4], ["DEU", 2], ["FRA", 3], ["JPN", 0.5], ["ITA", 1.5],
          ],
          2025,
        ),
      ],
    ]);
    const hist = buildHistoryFromPanel(byYear, "higher_better", 5, 2026);
    expect(hist.map((h) => h.year)).toEqual([2024, 2025]);
    expect(hist[1].peerCount).toBe(6);
  });
});

describe("composite + categories + insights", () => {
  const sampleMeasures = [
    buildMeasure(
      gdpDef,
      peersFrom([
        ["GBR", 5], ["USA", 4], ["DEU", 3], ["FRA", 2], ["JPN", 1], ["ITA", 0],
      ]),
    ),
    buildMeasure(
      cpiDef,
      peersFrom([
        ["GBR", 8], ["USA", 2], ["DEU", 3], ["FRA", 4], ["JPN", 1], ["ITA", 5],
      ]),
    ),
  ];

  it("averages scored percentiles into a composite RAG", () => {
    const c = computeComposite(sampleMeasures);
    expect(c.scoredMeasures).toBe(2);
    expect(c.avgPercentileFromBest).not.toBeNull();
    expect(["green", "amber", "red"]).toContain(c.ragStatus);
    expect(c.green + c.amber + c.red).toBe(2);
  });

  it("rolls up by category", () => {
    const cats = computeCategoryRollups(sampleMeasures);
    expect(cats.some((c) => c.category === "Economy")).toBe(true);
  });

  it("emits strongest/weakest insights", () => {
    const insights = buildInsights(sampleMeasures);
    expect(insights.length).toBeGreaterThanOrEqual(2);
    expect(insights.some((i) => /Strongest/i.test(i.text))).toBe(true);
    expect(insights.some((i) => /Weakest/i.test(i.text))).toBe(true);
  });
});

describe("measure catalogue invariants", () => {
  it("includes G20 + G7 definitions and unique keys", () => {
    expect(G20_ISO3).toHaveLength(19);
    expect(G7_ISO3).toHaveLength(7);
    const keys = MEASURE_DEFS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(MEASURE_DEFS.some((d) => d.source === "imf_weo")).toBe(true);
    expect(MEASURE_DEFS.some((d) => d.key === "g20_gov_debt_gdp")).toBe(true);
    expect(MEASURE_DEFS.some((d) => d.key === "g20_defence_spend_gdp")).toBe(true);
  });
});

describe("cache refresh path with mocked network", () => {
  const cachePath = path.join(process.cwd(), "server", "g20_benchmark_cache.json");
  const backupPath = cachePath + ".testbak";

  beforeEach(() => {
    if (fs.existsSync(cachePath)) fs.copyFileSync(cachePath, backupPath);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, cachePath);
      fs.unlinkSync(backupPath);
    }
  });

  it("getOrRefreshBenchmark(force) writes a snapshot using mocked fetches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const u = String(url);
        if (u.includes("worldbank.org")) {
          const indicator = u.match(/indicator\/([^?]+)/)?.[1] ?? "X";
          const body = [
            {},
            [
              { countryiso3code: "GBR", date: "2025", value: 2, country: { value: "United Kingdom" } },
              { countryiso3code: "USA", date: "2025", value: 3, country: { value: "United States" } },
              { countryiso3code: "DEU", date: "2025", value: 1, country: { value: "Germany" } },
              { countryiso3code: "FRA", date: "2025", value: 1.5, country: { value: "France" } },
              { countryiso3code: "JPN", date: "2025", value: 0.5, country: { value: "Japan" } },
              { countryiso3code: "ITA", date: "2025", value: 0.8, country: { value: "Italy" } },
              { countryiso3code: "CAN", date: "2025", value: 1.2, country: { value: "Canada" } },
              // encode indicator so responses differ slightly
              { countryiso3code: "AUS", date: "2025", value: indicator.length % 7, country: { value: "Australia" } },
            ],
          ];
          return {
            ok: true,
            status: 200,
            json: async () => body,
          } as Response;
        }
        if (u.includes("imf.org")) {
          const series: Record<string, Record<string, number>> = {};
          for (const c of ["GBR", "USA", "DEU", "FRA", "JPN", "ITA", "CAN", "AUS", "KOR", "CHN"]) {
            series[c] = { "2024": 80 + c.charCodeAt(0) % 40, "2025": 85 + c.charCodeAt(0) % 40 };
          }
          const ind = u.split("/").pop()!;
          return {
            ok: true,
            status: 200,
            json: async () => ({ values: { [ind]: series } }),
          } as Response;
        }
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      }),
    );

    const { getOrRefreshBenchmark } = await import("./g20Benchmark");
    const snap = await getOrRefreshBenchmark(true);
    expect(snap.measures.length).toBe(MEASURE_DEFS.length);
    expect(snap.composite.scoredMeasures).toBeGreaterThan(0);
    expect(snap.categories.length).toBeGreaterThan(0);
    expect(snap.insights.length).toBeGreaterThan(0);
    expect(fs.existsSync(cachePath)).toBe(true);
  });
});

// silence unused import warning in some configs
void (0 as unknown as MeasureDef);
