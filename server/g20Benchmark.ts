/**
 * G20 (+ EU) comparative benchmarking for the UK RAG portal.
 *
 * RAG is percentile-based across peer economies, not absolute UK thresholds:
 *   Top 20% of peers → green
 *   21–50%           → amber
 *   Bottom 50%       → red
 *
 * Sources:
 *   - World Bank Indicators API (annual, realised years)
 *   - IMF World Economic Outlook DataMapper (annual; forecasts excluded)
 */

import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "server", "g20_benchmark_cache.json");

/** G20 members + EU. World Bank uses EUU; IMF uses EU. */
export const G20_ISO3 = [
  "ARG", "AUS", "BRA", "CAN", "CHN", "FRA", "DEU", "IND", "IDN", "ITA",
  "JPN", "KOR", "MEX", "RUS", "SAU", "ZAF", "TUR", "GBR", "USA",
] as const;

export const G7_ISO3 = ["CAN", "FRA", "DEU", "ITA", "JPN", "GBR", "USA"] as const;

export const WB_EU = "EUU";
export const IMF_EU = "EU";

export type Direction = "higher_better" | "lower_better";
export type PercentileRag = "green" | "amber" | "red";
export type DataSource = "world_bank" | "imf_weo";

export type PeerObservation = {
  iso3: string;
  name: string;
  value: number;
  year: number;
};

export type YearPoint = {
  year: number;
  ukValue: number;
  percentileFromBest: number;
  ragStatus: PercentileRag;
  peerCount: number;
};

export type BenchmarkMeasure = {
  key: string;
  name: string;
  category: string;
  unit: string;
  direction: Direction;
  source: DataSource;
  sourceId: string;
  description: string;
  ukValue: number | null;
  ukYear: number | null;
  /** 0 = best among peers, 100 = worst. */
  percentileFromBest: number | null;
  ragStatus: PercentileRag | "unknown";
  peerCount: number;
  peers: PeerObservation[];
  g7PercentileFromBest: number | null;
  g7RagStatus: PercentileRag | "unknown";
  g7PeerCount: number;
  history: YearPoint[];
  sourceUrl: string;
  coverageNote?: string;
};

export type FeasibilityGap = {
  ukMetricKey: string;
  name: string;
  category: string;
  reason: string;
};

export type CategoryRollup = {
  category: string;
  measureCount: number;
  avgPercentileFromBest: number | null;
  ragStatus: PercentileRag | "unknown";
};

export type BenchmarkInsight = {
  severity: "info" | "warn" | "good";
  text: string;
};

export type BenchmarkSnapshot = {
  refreshedAt: string;
  peerSet: string;
  methodology: string;
  composite: {
    avgPercentileFromBest: number | null;
    ragStatus: PercentileRag | "unknown";
    scoredMeasures: number;
    green: number;
    amber: number;
    red: number;
    unknown: number;
  };
  categories: CategoryRollup[];
  insights: BenchmarkInsight[];
  measures: BenchmarkMeasure[];
  gaps: FeasibilityGap[];
};

export type MeasureDef = {
  key: string;
  name: string;
  category: string;
  unit: string;
  direction: Direction;
  source: DataSource;
  sourceId: string;
  description: string;
};

export const MEASURE_DEFS: MeasureDef[] = [
  {
    key: "g20_real_gdp_growth",
    name: "Real GDP Growth",
    category: "Economy",
    unit: "%",
    direction: "higher_better",
    source: "world_bank",
    sourceId: "NY.GDP.MKTP.KD.ZG",
    description: "Annual real GDP growth (%). Higher is better.",
  },
  {
    key: "g20_cpi_inflation",
    name: "CPI Inflation",
    category: "Economy",
    unit: "%",
    direction: "lower_better",
    source: "world_bank",
    sourceId: "FP.CPI.TOTL.ZG",
    description: "Annual consumer price inflation (%). Lower is better for this peer ranking.",
  },
  {
    key: "g20_gov_debt_gdp",
    name: "General Government Debt (% of GDP)",
    category: "Economy",
    unit: "%",
    direction: "lower_better",
    source: "imf_weo",
    sourceId: "GGXWDG_NGDP",
    description: "IMF WEO general government gross debt (% of GDP). Lower is better. Forecast years excluded.",
  },
  {
    key: "g20_investment_gdp",
    name: "Investment (% of GDP)",
    category: "Economy",
    unit: "%",
    direction: "higher_better",
    source: "world_bank",
    sourceId: "NE.GDI.FTOT.ZS",
    description: "Gross fixed capital formation (% of GDP). Peer proxy for business investment intensity.",
  },
  {
    key: "g20_rd_gdp",
    name: "R&D Spend (% of GDP)",
    category: "Economy",
    unit: "%",
    direction: "higher_better",
    source: "world_bank",
    sourceId: "GB.XPD.RSDV.GD.ZS",
    description: "Research and development expenditure (% of GDP).",
  },
  {
    key: "g20_unemployment",
    name: "Unemployment Rate",
    category: "Employment",
    unit: "%",
    direction: "lower_better",
    source: "world_bank",
    sourceId: "SL.UEM.TOTL.ZS",
    description: "ILO unemployment rate (%). Closest harmonised peer for labour-market slack.",
  },
  {
    key: "g20_defence_spend_gdp",
    name: "Defence Spending (% of GDP)",
    category: "Defence",
    unit: "%",
    direction: "higher_better",
    source: "world_bank",
    sourceId: "MS.MIL.XPND.GD.ZS",
    description: "Military expenditure (% of GDP, SIPRI via World Bank). Higher spend ranked as stronger defence effort.",
  },
];

export const FEASIBILITY_GAPS: FeasibilityGap[] = [
  {
    ukMetricKey: "output_per_hour",
    name: "Output per Hour",
    category: "Economy",
    reason: "OECD productivity flash estimates are not published for the full G20 (notably China, India, Indonesia, Saudi Arabia).",
  },
  {
    ukMetricKey: "inactivity_rate",
    name: "Economic Inactivity",
    category: "Employment",
    reason: "No single ILO inactivity rate is published consistently for all G20 members; unemployment is the labour peer.",
  },
  {
    ukMetricKey: "a_e_wait_time",
    name: "A&E / Elective waits",
    category: "Healthcare",
    reason: "NHS operational metrics have no standardised G20 equivalent.",
  },
  {
    ukMetricKey: "crown_court_backlog",
    name: "Court backlog / ASB / serious crime",
    category: "Crime",
    reason: "Crime definitions and recording practices are not internationally comparable at scorecard granularity.",
  },
  {
    ukMetricKey: "sea_mass",
    name: "Defence mass / readiness scores",
    category: "Defence",
    reason: "Fleet inventory composites are UK-constructed; defence spend % GDP is the peer proxy included above.",
  },
  {
    ukMetricKey: "attainment8",
    name: "Attainment 8 / pupil absence",
    category: "Education",
    reason: "National school assessments are not cross-walked across G20 curricula (PISA is periodic, not annual).",
  },
];

const COUNTRY_LABELS: Record<string, string> = {
  ARG: "Argentina", AUS: "Australia", BRA: "Brazil", CAN: "Canada", CHN: "China",
  FRA: "France", DEU: "Germany", IND: "India", IDN: "Indonesia", ITA: "Italy",
  JPN: "Japan", KOR: "Korea, Rep.", MEX: "Mexico", RUS: "Russian Federation",
  SAU: "Saudi Arabia", ZAF: "South Africa", TUR: "Türkiye", GBR: "United Kingdom",
  USA: "United States", EUU: "European Union", EU: "European Union",
};

export function currentCalendarYear(now = new Date()): number {
  return now.getUTCFullYear();
}

/**
 * Rank UK among peers. Returns percentile-from-best in [0, 100]
 * where 0 = best performer and 100 = worst.
 */
export function percentileFromBest(
  ukValue: number,
  peerValues: number[],
  direction: Direction,
): number {
  if (peerValues.length <= 1) return 0;
  const worseIsBetter = direction === "lower_better";
  const betterCount = peerValues.filter((v) =>
    worseIsBetter ? v < ukValue : v > ukValue,
  ).length;
  return (betterCount / (peerValues.length - 1)) * 100;
}

export function ragFromPercentile(percentileFromBest: number): PercentileRag {
  if (percentileFromBest <= 20) return "green";
  if (percentileFromBest <= 50) return "amber";
  return "red";
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type WbRow = {
  countryiso3code?: string;
  date?: string;
  value?: number | null;
  country?: { value?: string };
};

/** Pure parser: latest observation per country from World Bank rows. */
export function parseWorldBankLatest(
  rows: WbRow[],
  maxYear = currentCalendarYear(),
): PeerObservation[] {
  const latest = new Map<string, PeerObservation>();
  for (const row of rows) {
    if (row.value == null || !row.countryiso3code || !row.date) continue;
    const year = Number(row.date);
    if (!Number.isFinite(year) || year > maxYear) continue;
    const iso3 = row.countryiso3code;
    const prev = latest.get(iso3);
    if (!prev || year > prev.year) {
      latest.set(iso3, {
        iso3,
        name: row.country?.value || COUNTRY_LABELS[iso3] || iso3,
        value: Number(row.value),
        year,
      });
    }
  }
  return Array.from(latest.values());
}

/** Pure parser: panel of country→year→value from IMF DataMapper payload. */
export function parseImfPanel(
  seriesByCountry: Record<string, Record<string, number | null | undefined>>,
  isoCodes: string[],
  maxYear = currentCalendarYear(),
): { latest: PeerObservation[]; byYear: Map<number, PeerObservation[]> } {
  const byYear = new Map<number, PeerObservation[]>();
  const latest = new Map<string, PeerObservation>();

  for (const iso3 of isoCodes) {
    const series = seriesByCountry[iso3];
    if (!series) continue;
    for (const [yearStr, raw] of Object.entries(series)) {
      if (raw == null) continue;
      const year = Number(yearStr);
      if (!Number.isFinite(year) || year > maxYear) continue;
      const obs: PeerObservation = {
        iso3,
        name: COUNTRY_LABELS[iso3] || iso3,
        value: Number(raw),
        year,
      };
      const list = byYear.get(year) ?? [];
      list.push(obs);
      byYear.set(year, list);
      const prev = latest.get(iso3);
      if (!prev || year > prev.year) latest.set(iso3, obs);
    }
  }
  return { latest: Array.from(latest.values()), byYear };
}

export function buildHistoryFromPanel(
  byYear: Map<number, PeerObservation[]>,
  direction: Direction,
  yearsBack = 5,
  maxYear = currentCalendarYear(),
): YearPoint[] {
  const years = [...byYear.keys()]
    .filter((y) => y <= maxYear)
    .sort((a, b) => a - b);
  const recent = years.slice(-yearsBack);
  const out: YearPoint[] = [];
  for (const year of recent) {
    const peers = byYear.get(year) ?? [];
    const uk = peers.find((p) => p.iso3 === "GBR");
    if (!uk || peers.length < 5) continue;
    const pct = percentileFromBest(uk.value, peers.map((p) => p.value), direction);
    out.push({
      year,
      ukValue: round2(uk.value),
      percentileFromBest: round1(pct),
      ragStatus: ragFromPercentile(pct),
      peerCount: peers.length,
    });
  }
  return out;
}

export function buildMeasure(
  def: MeasureDef,
  peers: PeerObservation[],
  history: YearPoint[] = [],
): BenchmarkMeasure {
  const sourceUrl =
    def.source === "imf_weo"
      ? `https://www.imf.org/external/datamapper/${def.sourceId}`
      : `https://api.worldbank.org/v2/country/all/indicator/${def.sourceId}`;

  const base = {
    key: def.key,
    name: def.name,
    category: def.category,
    unit: def.unit,
    direction: def.direction,
    source: def.source,
    sourceId: def.sourceId,
    description: def.description,
    sourceUrl,
    history,
    g7PercentileFromBest: null as number | null,
    g7RagStatus: "unknown" as PercentileRag | "unknown",
    g7PeerCount: 0,
  };

  if (peers.length < 5) {
    return {
      ...base,
      ukValue: null,
      ukYear: null,
      percentileFromBest: null,
      ragStatus: "unknown",
      peerCount: peers.length,
      peers: [...peers].sort((a, b) => a.name.localeCompare(b.name)),
      coverageNote: `Only ${peers.length} peers returned — below minimum for percentile RAG.`,
    };
  }

  const uk = peers.find((p) => p.iso3 === "GBR");
  const sortedPeers = [...peers].sort((a, b) =>
    def.direction === "higher_better" ? b.value - a.value : a.value - b.value,
  );

  if (!uk) {
    return {
      ...base,
      ukValue: null,
      ukYear: null,
      percentileFromBest: null,
      ragStatus: "unknown",
      peerCount: peers.length,
      peers: sortedPeers,
      coverageNote: "UK observation missing from source response.",
    };
  }

  const pct = percentileFromBest(uk.value, peers.map((p) => p.value), def.direction);
  const g7Peers = peers.filter((p) => (G7_ISO3 as readonly string[]).includes(p.iso3));
  let g7PercentileFromBest: number | null = null;
  let g7RagStatus: PercentileRag | "unknown" = "unknown";
  if (g7Peers.length >= 4 && g7Peers.some((p) => p.iso3 === "GBR")) {
    g7PercentileFromBest = round1(
      percentileFromBest(uk.value, g7Peers.map((p) => p.value), def.direction),
    );
    g7RagStatus = ragFromPercentile(g7PercentileFromBest);
  }

  return {
    ...base,
    ukValue: round2(uk.value),
    ukYear: uk.year,
    percentileFromBest: round1(pct),
    ragStatus: ragFromPercentile(pct),
    peerCount: peers.length,
    peers: sortedPeers,
    g7PercentileFromBest,
    g7RagStatus,
    g7PeerCount: g7Peers.length,
  };
}

export function computeComposite(measures: BenchmarkMeasure[]) {
  const scored = measures.filter((m) => m.percentileFromBest != null);
  const green = scored.filter((m) => m.ragStatus === "green").length;
  const amber = scored.filter((m) => m.ragStatus === "amber").length;
  const red = scored.filter((m) => m.ragStatus === "red").length;
  const unknown = measures.length - scored.length;
  const avg =
    scored.length === 0
      ? null
      : round1(
          scored.reduce((s, m) => s + (m.percentileFromBest as number), 0) /
            scored.length,
        );
  return {
    avgPercentileFromBest: avg,
    ragStatus: (avg == null ? "unknown" : ragFromPercentile(avg)) as PercentileRag | "unknown",
    scoredMeasures: scored.length,
    green,
    amber,
    red,
    unknown,
  };
}

export function computeCategoryRollups(measures: BenchmarkMeasure[]): CategoryRollup[] {
  const byCat = new Map<string, BenchmarkMeasure[]>();
  for (const m of measures) {
    const list = byCat.get(m.category) ?? [];
    list.push(m);
    byCat.set(m.category, list);
  }
  return [...byCat.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, list]) => {
      const scored = list.filter((m) => m.percentileFromBest != null);
      const avg =
        scored.length === 0
          ? null
          : round1(
              scored.reduce((s, m) => s + (m.percentileFromBest as number), 0) /
                scored.length,
            );
      return {
        category,
        measureCount: list.length,
        avgPercentileFromBest: avg,
        ragStatus: (avg == null ? "unknown" : ragFromPercentile(avg)) as PercentileRag | "unknown",
      };
    });
}

export function buildInsights(measures: BenchmarkMeasure[]): BenchmarkInsight[] {
  const insights: BenchmarkInsight[] = [];
  const scored = measures.filter((m) => m.percentileFromBest != null);
  if (scored.length === 0) {
    insights.push({ severity: "warn", text: "No scored peer measures yet — refresh data sources." });
    return insights;
  }

  const best = [...scored].sort(
    (a, b) => (a.percentileFromBest as number) - (b.percentileFromBest as number),
  )[0];
  const worst = [...scored].sort(
    (a, b) => (b.percentileFromBest as number) - (a.percentileFromBest as number),
  )[0];

  insights.push({
    severity: best.ragStatus === "green" ? "good" : "info",
    text: `Strongest G20 relative position: ${best.name} (${best.percentileFromBest}% from best, ${best.ragStatus}).`,
  });
  insights.push({
    severity: worst.ragStatus === "red" ? "warn" : "info",
    text: `Weakest G20 relative position: ${worst.name} (${worst.percentileFromBest}% from best, ${worst.ragStatus}).`,
  });

  for (const m of scored) {
    if (
      m.g7PercentileFromBest != null &&
      m.percentileFromBest != null &&
      Math.abs(m.g7PercentileFromBest - m.percentileFromBest) >= 15
    ) {
      const betterIn =
        m.g7PercentileFromBest < m.percentileFromBest ? "G7" : "full G20";
      insights.push({
        severity: "info",
        text: `${m.name}: UK looks better vs the ${betterIn} lens (G20 ${m.percentileFromBest}% from best · G7 ${m.g7PercentileFromBest}%).`,
      });
    }
  }

  for (const m of scored) {
    if (m.history.length >= 3) {
      const first = m.history[0];
      const last = m.history[m.history.length - 1];
      const delta = round1(last.percentileFromBest - first.percentileFromBest);
      if (Math.abs(delta) >= 10) {
        insights.push({
          severity: delta < 0 ? "good" : "warn",
          text: `${m.name}: UK peer rank ${delta < 0 ? "improved" : "worsened"} by ${Math.abs(delta)}pp from ${first.year}→${last.year}.`,
        });
      }
    }
  }

  return insights.slice(0, 8);
}

async function fetchWorldBankRows(indicator: string): Promise<WbRow[]> {
  const ids = [...G20_ISO3, WB_EU].join(";");
  const url =
    `https://api.worldbank.org/v2/country/${ids}/indicator/${indicator}` +
    `?format=json&per_page=2000&date=2015:2026`;
  const res = await fetch(url, {
    headers: { "User-Agent": "UK-RAG-Portal-G20-Benchmark/1.0" },
  });
  if (!res.ok) throw new Error(`World Bank ${indicator}: HTTP ${res.status}`);
  const data = (await res.json()) as [unknown, WbRow[] | null];
  return data[1] ?? [];
}

async function fetchImfSeries(
  indicator: string,
): Promise<Record<string, Record<string, number | null | undefined>>> {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "UK-RAG-Portal-G20-Benchmark/1.0" },
  });
  if (!res.ok) throw new Error(`IMF WEO ${indicator}: HTTP ${res.status}`);
  const data = (await res.json()) as {
    values?: Record<string, Record<string, Record<string, number | null>>>;
  };
  return data.values?.[indicator] ?? {};
}

function historyFromWorldBankRows(
  rows: WbRow[],
  direction: Direction,
  maxYear = currentCalendarYear(),
): YearPoint[] {
  const byYear = new Map<number, PeerObservation[]>();
  for (const row of rows) {
    if (row.value == null || !row.countryiso3code || !row.date) continue;
    const year = Number(row.date);
    if (!Number.isFinite(year) || year > maxYear) continue;
    const iso3 = row.countryiso3code;
    const list = byYear.get(year) ?? [];
    list.push({
      iso3,
      name: row.country?.value || COUNTRY_LABELS[iso3] || iso3,
      value: Number(row.value),
      year,
    });
    byYear.set(year, list);
  }
  return buildHistoryFromPanel(byYear, direction, 5, maxYear);
}

export async function buildBenchmarkSnapshot(
  maxYear = currentCalendarYear(),
): Promise<BenchmarkSnapshot> {
  const measures: BenchmarkMeasure[] = [];

  for (const def of MEASURE_DEFS) {
    if (def.source === "world_bank") {
      const rows = await fetchWorldBankRows(def.sourceId);
      const peers = parseWorldBankLatest(rows, maxYear);
      const history = historyFromWorldBankRows(rows, def.direction, maxYear);
      measures.push(buildMeasure(def, peers, history));
    } else {
      const series = await fetchImfSeries(def.sourceId);
      const isoCodes = [...G20_ISO3, IMF_EU];
      const { latest, byYear } = parseImfPanel(series, isoCodes, maxYear);
      const history = buildHistoryFromPanel(byYear, def.direction, 5, maxYear);
      measures.push(buildMeasure(def, latest, history));
    }
  }

  const composite = computeComposite(measures);
  const categories = computeCategoryRollups(measures);
  const insights = buildInsights(measures);

  return {
    refreshedAt: new Date().toISOString(),
    peerSet: "G20 economies + EU (World Bank + IMF WEO)",
    methodology:
      "UK RAG from peer percentile: top 20% green, 21–50% amber, bottom 50% red. " +
      "Direction-aware. IMF forecast years beyond the current calendar year are excluded. " +
      "G7 lens reported alongside full G20 where enough peers exist.",
    composite,
    categories,
    insights,
    measures,
    gaps: FEASIBILITY_GAPS,
  };
}

export function readBenchmarkCache(): BenchmarkSnapshot | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as BenchmarkSnapshot;
  } catch {
    return null;
  }
}

export function writeBenchmarkCache(snapshot: BenchmarkSnapshot): void {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(snapshot, null, 2), "utf-8");
}

export async function getOrRefreshBenchmark(
  force = false,
): Promise<BenchmarkSnapshot> {
  if (!force) {
    const cached = readBenchmarkCache();
    // Require composite field so old caches are refreshed once.
    if (cached?.measures?.length && cached.composite) return cached;
  }
  const snapshot = await buildBenchmarkSnapshot();
  writeBenchmarkCache(snapshot);
  return snapshot;
}
