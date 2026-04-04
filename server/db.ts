/**
 * MongoDB Database Operations
 * Replaces Drizzle ORM with native MongoDB driver
 */

import { MongoClient, Db, Collection } from "mongodb";
import { ENV } from "./_core/env";
import { cache } from "./cache";
import type {
  User,
  InsertUser,
  Metric,
  InsertMetric,
  MetricHistory,
  InsertMetricHistory,
} from "./schema";

let _client: MongoClient | null = null;
let _db: Db | null = null;

// Collection names
const COLLECTIONS = {
  users: "users",
  metrics: "metrics",
  metricHistory: "metricHistory",
  settings: "settings",
  visitors: "visitors",
  visitorStats: "visitorStats",
} as const;

/**
 * Get MongoDB database connection.
 * Uses ENV.databaseUrl (DATABASE_URL or MONGODB_URI) so connection config is consistent across the app.
 */
export async function getDb(): Promise<Db | null> {
  const url = ENV.databaseUrl;
  if (!url) {
    return null;
  }

  if (!_db) {
    try {
      _client = new MongoClient(url);
      await _client.connect();
      // Extract database name from connection string
      // Format: mongodb://host:port/database or mongodb://host/database
      // Match database name after the last slash before query params
      const dbMatch = url.match(/\/\/(?:[^\/]+)\/([^?]+)/);
      const dbName = dbMatch ? dbMatch[1] : "uk_rag_portal";
      // If dbName looks like a host:port (contains :), it's wrong - use default
      const finalDbName = dbName.includes(":") ? "uk_rag_portal" : dbName;
      _db = _client.db(finalDbName);
      console.log("[Database] Connected to MongoDB");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }

  return _db;
}

/**
 * Get a collection
 */
async function getCollection<T extends { _id?: any }>(name: keyof typeof COLLECTIONS): Promise<Collection<T> | null> {
  const db = await getDb();
  if (!db) return null;
  return db.collection<T>(COLLECTIONS[name]);
}

/**
 * Diagnostics: DB connection and metrics count (for debugging "cards not appearing").
 */
export async function getMetricsDiagnostics(): Promise<{ dbConnected: boolean; metricsCount: number | null }> {
  const collection = await getCollection<Metric>(COLLECTIONS.metrics);
  if (!collection) {
    return { dbConnected: false, metricsCount: null };
  }
  try {
    const count = await collection.countDocuments();
    return { dbConnected: true, metricsCount: count };
  } catch (e) {
    console.warn("[Metrics] Diagnostics count failed:", e);
    return { dbConnected: true, metricsCount: null };
  }
}

// ============================================================================
// User Operations
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const collection = await getCollection<User>(COLLECTIONS.users);
  if (!collection) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const now = new Date();
    const updateData: Partial<User> = {
      ...user,
      updatedAt: now,
    };

    // Set role if owner or dev user (always admin)
    if (user.openId === ENV.ownerOpenId || user.openId === "dev-user-local") {
      updateData.role = "admin";
    } else if (user.role) {
      // Explicitly provided role (e.g. admin-login) -- respect it
      updateData.role = user.role;
    } else {
      // No role specified -- don't overwrite existing DB role on update;
      // default to "user" only on first insert (via $setOnInsert below)
      delete updateData.role;
    }

    // Set lastSignedIn if not provided
    if (!updateData.lastSignedIn) {
      updateData.lastSignedIn = now;
    }

    await collection.updateOne(
      { openId: user.openId },
      {
        $set: updateData,
        $setOnInsert: {
          createdAt: now,
          ...(!updateData.role ? { role: "user" } : {}),
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const collection = await getCollection<User>(COLLECTIONS.users);
  if (!collection) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const user = await collection.findOne({ openId });
  return user || undefined;
}

// ============================================================================
// Metrics Operations
// ============================================================================

/**
 * Upsert a metric (insert or update if exists)
 */
export async function upsertMetric(metric: InsertMetric): Promise<void> {
  const collection = await getCollection<Metric>(COLLECTIONS.metrics);
  if (!collection) throw new Error("Database not available");

  const now = new Date();
  const updateData: Partial<Metric> = {
    ...metric,
    lastUpdated: now,
  };

  await collection.updateOne(
    { metricKey: metric.metricKey },
    {
      $set: updateData,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  // Invalidate cache for this metric and all metrics lists
  cache.delete(`metric:${metric.metricKey}`);
  cache.delete(`metricTrends:all`);
  cache.deleteByPrefix("metrics:list:");
}

/**
 * Phase 3: Display name overrides so existing metrics show PDF names (Updated Data Sources UK RAG).
 * Applied when returning metrics; DB/fetchers unchanged until Phase 4.
 */
const DISPLAY_NAME_OVERRIDES: Partial<Record<string, string>> = {
  // Economy
  real_gdp_growth: "Real GDP Growth",
  // Crime
  street_confidence_index: "Perception of Safety",
  asb_low_level_crime: "Anti-Social Behaviour and Low Level Crime per capita",
  serious_crime: "Serious Crime per capita",
  crown_court_backlog: "Crown Court Backlog per 100k",
  recall_rate: "Recall Rate",
  // Healthcare
  a_e_wait_time: "A&E 4-Hour Wait %",
  ambulance_response_time: "Ambulance (Cat 2)",
  elective_backlog: "Elective Backlog",
  gp_appt_access: "GP Appt. Access",
  // Education
  neet_rate: "NEET Rate (16-24)",
  // Defence
  defence_spending_gdp: "Spend as % of GDP",
};

function applyDisplayNameOverrides(m: Metric): Metric {
  const name = DISPLAY_NAME_OVERRIDES[m.metricKey];
  return name ? { ...m, name } : m;
}

/** Output per hour is % change per annum; normalize legacy "Index" unit to "%". */
function normalizeOutputPerHourUnit(m: Metric): Metric {
  if (m.metricKey === "output_per_hour" && m.unit === "Index") {
    return { ...m, unit: "%" };
  }
  return m;
}

/** Dedupe by metricKey (keep first) so the same metric never appears twice (e.g. duplicate GDP Growth when category is "All"). */
function dedupeByMetricKey(metrics: Metric[]): Metric[] {
  const seen = new Set<string>();
  return metrics.filter((m) => {
    if (seen.has(m.metricKey)) return false;
    seen.add(m.metricKey);
    return true;
  });
}

/** After display names are applied: dedupe by (category, name) so we never show two cards with the same label. */
function dedupeByCategoryAndName(metrics: Metric[]): Metric[] {
  const seen = new Set<string>();
  return metrics.filter((m) => {
    const key = `${m.category}\0${m.name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Remove legacy "GDP Growth (Year on Year)" so only "Real GDP Growth" shows in Economy. */
function dropLegacyGdpGrowthLabel(metrics: Metric[]): Metric[] {
  return metrics.filter((m) => {
    const name = m.name ?? "";
    return !name.startsWith("GDP Growth (Year on");
  });
}


/** Employment section: only these five cards (and their detail pages). */
export const EMPLOYMENT_ALLOWED_METRIC_KEYS = new Set([
  "inactivity_rate",
  "real_wage_growth",
  "job_vacancy_ratio",
  "underemployment",
  "sickness_absence",
]);

function filterEmploymentMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Employment" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Employment" || EMPLOYMENT_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Education section: allowed metric keys (dashboard cards + detail pages). */
export const EDUCATION_ALLOWED_METRIC_KEYS = new Set([
  "attainment8",
  "teacher_vacancy_rate",
  "neet_rate",
  "persistent_absence",
  "apprentice_starts",
  "pupil_attendance",
  "apprenticeship_intensity",
]);

function filterEducationMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Education" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Education" || EDUCATION_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Crime section: only these five cards (and their detail pages). */
export const CRIME_ALLOWED_METRIC_KEYS = new Set([
  "street_confidence_index",
  "crown_court_backlog",
  "recall_rate",
  "asb_low_level_crime",
  "serious_crime",
]);

function filterCrimeMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Crime" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Crime" || CRIME_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Healthcare section: only these five cards (and their detail pages). */
export const HEALTHCARE_ALLOWED_METRIC_KEYS = new Set([
  "a_e_wait_time",
  "elective_backlog",
  "ambulance_response_time",
  "gp_appt_access",
  "old_age_dependency_ratio",
]);

function filterHealthcareMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Healthcare" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Healthcare" || HEALTHCARE_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Defence section: allowed metric keys (dashboard cards + detail pages). */
export const DEFENCE_ALLOWED_METRIC_KEYS = new Set([
  "defence_spending_gdp",
  "personnel_strength",
  "equipment_spend",
  "deployability",
  "equipment_readiness",
  "sea_mass",
  "land_mass",
  "air_mass",
  "defence_industry_vitality",
]);

function filterDefenceMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Defence" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Defence" || DEFENCE_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/**
 * Get all metrics, optionally filtered by category.
 * Always reads from MongoDB so the dashboard reflects the database; no in-memory cache for the list.
 * No placeholder metrics: only real data from DB. Client shows "no data available" for missing slots.
 */
export async function getMetrics(category?: string): Promise<Metric[]> {
  const collection = await getCollection<Metric>(COLLECTIONS.metrics);
  if (!collection) {
    console.warn("[Metrics] list DB unavailable, returning empty list");
    return [];
  }

  const query = category ? { category } : {};
  const metrics = await collection.find(query, {
    projection: {
      _id: 1,
      metricKey: 1,
      name: 1,
      category: 1,
      value: 1,
      unit: 1,
      ragStatus: 1,
      dataDate: 1,
      lastUpdated: 1,
      sourceUrl: 1,
      createdAt: 1,
    },
  }).toArray();

  const ALLOWED_BY_CATEGORY: Record<string, Set<string>> = {
    Employment: EMPLOYMENT_ALLOWED_METRIC_KEYS,
    Education: EDUCATION_ALLOWED_METRIC_KEYS,
    Crime: CRIME_ALLOWED_METRIC_KEYS,
    Healthcare: HEALTHCARE_ALLOWED_METRIC_KEYS,
    Defence: DEFENCE_ALLOWED_METRIC_KEYS,
  };

  const seenKey = new Set<string>();
  const seenCategoryName = new Set<string>();
  const result: Metric[] = [];

  for (const raw of metrics) {
    if (raw.metricKey === "productivity") continue;
    if ((raw.name ?? "").startsWith("GDP Growth (Year on")) continue;

    const allowed = ALLOWED_BY_CATEGORY[raw.category];
    if (allowed && !allowed.has(raw.metricKey)) continue;

    if (seenKey.has(raw.metricKey)) continue;
    seenKey.add(raw.metricKey);

    const m = normalizeOutputPerHourUnit(applyDisplayNameOverrides(raw));

    const cnKey = `${m.category}\0${m.name ?? ""}`;
    if (seenCategoryName.has(cnKey)) continue;
    seenCategoryName.add(cnKey);

    result.push(m);
  }
  if (process.env.DEBUG) {
    console.debug(`[Metrics] list category=${category ?? "all"} source=db rawCount=${metrics.length} finalCount=${result.length}`);
  }
  return result;
}

/**
 * Get a single metric by key
 * Uses caching to improve performance
 */
export async function getMetricByKey(metricKey: string): Promise<Metric | undefined> {
  
  // Check cache first
  const cacheKey = `metric:${metricKey}`;
  const cached = cache.get<Metric>(cacheKey);
  if (cached) {
    const withOverrides = applyDisplayNameOverrides(cached);
    if (withOverrides.category === "Employment" && !EMPLOYMENT_ALLOWED_METRIC_KEYS.has(withOverrides.metricKey)) {
      return undefined;
    }
    if (withOverrides.category === "Education" && !EDUCATION_ALLOWED_METRIC_KEYS.has(withOverrides.metricKey)) {
      return undefined;
    }
    if (withOverrides.category === "Crime" && !CRIME_ALLOWED_METRIC_KEYS.has(withOverrides.metricKey)) {
      return undefined;
    }
    if (withOverrides.category === "Healthcare" && !HEALTHCARE_ALLOWED_METRIC_KEYS.has(withOverrides.metricKey)) {
      return undefined;
    }
    if (withOverrides.category === "Defence" && !DEFENCE_ALLOWED_METRIC_KEYS.has(withOverrides.metricKey)) {
      return undefined;
    }
    return withOverrides;
  }

  // Fetch from database
  const collection = await getCollection<Metric>(COLLECTIONS.metrics);
  if (!collection) return undefined;

  const metric = await collection.findOne({ metricKey });
  if (!metric) {
    return undefined;
  }

  // Employment: only the five allowed metrics have detail pages; others 404
  if (metric.category === "Employment" && !EMPLOYMENT_ALLOWED_METRIC_KEYS.has(metric.metricKey)) {
    return undefined;
  }
  if (metric.category === "Education" && !EDUCATION_ALLOWED_METRIC_KEYS.has(metric.metricKey)) {
    return undefined;
  }
  // Crime: only the five allowed metrics have detail pages; others 404
  if (metric.category === "Crime" && !CRIME_ALLOWED_METRIC_KEYS.has(metric.metricKey)) {
    return undefined;
  }
  // Healthcare: only the five allowed metrics have detail pages; others 404
  if (metric.category === "Healthcare" && !HEALTHCARE_ALLOWED_METRIC_KEYS.has(metric.metricKey)) {
    return undefined;
  }
  if (metric.category === "Defence" && !DEFENCE_ALLOWED_METRIC_KEYS.has(metric.metricKey)) {
    return undefined;
  }

  const normalized = normalizeOutputPerHourUnit(metric);
  cache.set(cacheKey, normalized, 5 * 60 * 1000);
  return applyDisplayNameOverrides(normalized);
}

/**
 * Add a metric history entry
 */
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function monthToQuarter(m: number): number {
  if (m <= 3) return 1;
  if (m <= 6) return 2;
  if (m <= 9) return 3;
  return 4;
}

/**
 * Normalise any period string to canonical "YYYY QN" format.
 * Handles monthly ("Nov 2025", "2026 JAN"), annual ("2025"), academic year
 * ("202425"), financial year quarters ("Q2 2025/26"), month ranges ("Oct-Dec 2023"),
 * and "Year Ending" ("YE Jun 25 P"). Falls back to trimmed string if unparseable.
 */
function normaliseDataDate(dataDate: string): string {
  const s = String(dataDate).trim();
  if (!s || s.toLowerCase() === "placeholder") return s;

  // Already canonical
  if (/^\d{4}\s+Q[1-4]$/.test(s)) return s;

  let m: RegExpMatchArray | null;

  // "QN YYYY"
  m = s.match(/^Q([1-4])\s+(\d{4})$/i);
  if (m) return `${m[2]} Q${m[1]}`;

  // NHS financial year quarterly: "Q4 2024/25"
  m = s.match(/^Q([1-4])\s+(\d{4})\/(\d{2})$/i);
  if (m) {
    const fq = +m[1], startYear = +m[2];
    const map: Record<number, [number, number]> = {
      1: [startYear, 2], 2: [startYear, 3], 3: [startYear, 4], 4: [startYear + 1, 1],
    };
    const [yr, cq] = map[fq];
    return `${yr} Q${cq}`;
  }

  // Month range: "Oct-Dec 2023"
  m = s.match(/^(\w+)-(\w+)\s+(\d{4})/i);
  if (m) {
    const endMonth = MONTH_MAP[m[2].toLowerCase()];
    if (endMonth) return `${m[3]} Q${monthToQuarter(endMonth)}`;
  }

  // "Year Ending": "YE Jun 25 P"
  m = s.match(/^YE\s+(\w+)\s+(\d{2,4})/i);
  if (m) {
    const month = MONTH_MAP[m[1].toLowerCase()];
    let year = +m[2];
    if (year < 100) year += 2000;
    if (month) return `${year} Q${monthToQuarter(month)}`;
  }

  // Monthly: "Nov 2025" / "2025 NOV"
  for (const [abbr, num] of Object.entries(MONTH_MAP)) {
    const re1 = new RegExp(`^${abbr}[a-z]*\\s+(\\d{4})$`, "i");
    const m1 = s.match(re1);
    if (m1) return `${m1[1]} Q${monthToQuarter(num)}`;

    const re2 = new RegExp(`^(\\d{4})\\s+${abbr}[a-z]*$`, "i");
    const m2 = s.match(re2);
    if (m2) return `${m2[1]} Q${monthToQuarter(num)}`;
  }

  // Multi-year range: "2021-2023"
  m = s.match(/^(\d{4})-(\d{4})$/);
  if (m) return `${m[2]} Q4`;

  // Academic year: "202425"
  m = s.match(/^(\d{4})(\d{2})$/);
  if (m) return `${+m[1] + 1} Q3`;

  // Pure annual: "2025"
  m = s.match(/^(\d{4})$/);
  if (m) return `${m[1]} Q4`;

  return s;
}

export async function addMetricHistory(history: InsertMetricHistory): Promise<void> {
  const collection = await getCollection<MetricHistory>(COLLECTIONS.metricHistory);
  if (!collection) throw new Error("Database not available");

  const now = new Date();
  const recordedAt = history.recordedAt || now;
  const dataDate = normaliseDataDate(history.dataDate);

  await collection.findOneAndUpdate(
    { metricKey: history.metricKey, dataDate },
    {
      $set: {
        value: history.value,
        ragStatus: history.ragStatus,
        recordedAt,
        dataDate,
        ...(history.information != null && { information: history.information }),
      },
    },
    { upsert: true }
  );

  cache.deleteByPrefix(`metricHistory:${history.metricKey}:`);
  cache.delete(`metricTrends:all`);
}

/**
 * Batch-check which metricKey+dataDate pairs already exist in history.
 * Uses targeted $or query matching only the exact pairs requested.
 */
export async function getExistingHistoryPeriods(
  pairs: Array<{ metricKey: string; dataDate: string }>
): Promise<Set<string>> {
  if (pairs.length === 0) return new Set();
  const collection = await getCollection<MetricHistory>(COLLECTIONS.metricHistory);
  if (!collection) return new Set();

  const uniquePairs = Array.from(
    new Map(pairs.map(p => [`${p.metricKey}|${p.dataDate}`, p])).values()
  );

  const docs = await collection
    .find(
      { $or: uniquePairs.map(p => ({ metricKey: p.metricKey, dataDate: p.dataDate })) },
      { projection: { metricKey: 1, dataDate: 1 } }
    )
    .toArray();

  const existing = new Set<string>();
  for (const d of docs) {
    existing.add(`${d.metricKey}|${d.dataDate}`);
  }
  return existing;
}

/**
 * Get metric history for a specific metric
 * Uses caching to improve performance
 */
const METRIC_HISTORY_MAX_LIMIT = 500;

export async function getMetricHistory(metricKey: string, limit: number = 50): Promise<MetricHistory[]> {
  const cappedLimit = Math.min(Math.max(1, Math.floor(limit)), METRIC_HISTORY_MAX_LIMIT);

  
  // Check cache first
  const cacheKey = `metricHistory:${metricKey}:${cappedLimit}`;
  const cached = cache.get<MetricHistory[]>(cacheKey);
  if (cached && cached.length > 0) {
    // Only use cache if it has data (don't cache empty arrays)
    return cached;
  }

  // Fetch from database
  const collection = await getCollection<MetricHistory>(COLLECTIONS.metricHistory);
  if (!collection) {
    console.warn(`[getMetricHistory] Database collection not available for metricKey: ${metricKey}`);
    return [];
  }

  const history = await collection
    .find({ metricKey })
    .sort({ dataDate: -1, recordedAt: -1 }) // Compound index (metricKey, dataDate, recordedAt) supports this
    .limit(cappedLimit)
    .toArray();
  
  // Ensure recordedAt is a Date object (MongoDB may return it as string in some cases)
  const normalizedHistory = history.map(h => ({
    ...h,
    recordedAt: h.recordedAt instanceof Date ? h.recordedAt : h.recordedAt ? new Date(h.recordedAt) : (h.createdAt instanceof Date ? h.createdAt : new Date()),
  }));
  
  // Only cache if we have data (don't cache empty arrays to avoid stale empty results)
  if (normalizedHistory.length > 0) {
    cache.set(cacheKey, normalizedHistory, 5 * 60 * 1000);
  }
  
  return normalizedHistory;
}

export async function getMetricTrends(): Promise<
  Record<string, { current: string; previous: string | null }>
> {
  const cacheKey = "metricTrends:all";
  const cached = cache.get<Record<string, { current: string; previous: string | null }>>(cacheKey);
  if (cached) return cached;

  const collection = await getCollection<MetricHistory>(COLLECTIONS.metricHistory);
  if (!collection) return {};

  const pipeline = [
    {
      $group: {
        _id: "$metricKey",
        topTwo: {
          $topN: {
            n: 2,
            sortBy: { dataDate: -1 as const, recordedAt: -1 as const },
            output: "$value",
          },
        },
      },
    },
    {
      $project: {
        current: { $arrayElemAt: ["$topTwo", 0] },
        previous: {
          $cond: {
            if: { $gte: [{ $size: "$topTwo" }, 2] },
            then: { $arrayElemAt: ["$topTwo", 1] },
            else: null,
          },
        },
      },
    },
  ];

  const results = await collection.aggregate(pipeline).toArray();
  const trends: Record<string, { current: string; previous: string | null }> = {};

  for (const doc of results) {
    const key = doc._id as string;
    trends[key] = {
      current: doc.current as string,
      previous: (doc.previous as string) ?? null,
    };
  }

  cache.set(cacheKey, trends, 10 * 60 * 1000);
  return trends;
}

// ============================================================================
// Dashboard Section Visibility Settings
// ============================================================================

const ALL_DASHBOARD_CATEGORIES = [
  "Economy", "Employment", "Education", "Crime", "Healthcare", "Defence",
] as const;

const DEFAULT_SECTIONS: Record<string, boolean> = Object.fromEntries(
  ALL_DASHBOARD_CATEGORIES.map((c) => [c, true]),
);

export async function getDashboardSections(): Promise<Record<string, boolean>> {
  const collection = await getCollection(COLLECTIONS.settings);
  if (!collection) return { ...DEFAULT_SECTIONS };

  const doc = await collection.findOne({ _id: "dashboardSections" as any });
  if (!doc || !doc.sections) return { ...DEFAULT_SECTIONS };

  const result: Record<string, boolean> = {};
  for (const cat of ALL_DASHBOARD_CATEGORIES) {
    result[cat] = doc.sections[cat] !== false;
  }
  return result;
}

export async function setDashboardSections(
  sections: Record<string, boolean>,
): Promise<void> {
  const collection = await getCollection(COLLECTIONS.settings);
  if (!collection) throw new Error("Database not available");

  const value: Record<string, boolean> = {};
  for (const cat of ALL_DASHBOARD_CATEGORIES) {
    value[cat] = sections[cat] !== false;
  }

  await collection.updateOne(
    { _id: "dashboardSections" as any },
    { $set: { sections: value, updatedAt: new Date() } },
    { upsert: true },
  );
}

// ============================================================================
// Visitor Tracking
// ============================================================================

/**
 * Record a unique visitor (one doc per IP-hash per day).
 * Fire-and-forget — callers should not await or let errors propagate.
 */
export async function recordVisit(ipHash: string, date: string): Promise<void> {
  const collection = await getCollection<{ ipHash: string; date: string; createdAt: Date }>(
    COLLECTIONS.visitors,
  );
  if (!collection) return;

  await collection.updateOne(
    { ipHash, date },
    { $setOnInsert: { ipHash, date, createdAt: new Date() } },
    { upsert: true },
  );
}

/**
 * Ensure TTL + compound indexes exist on the visitors collection.
 * Called once at server startup.
 */
export async function ensureVisitorIndexes(): Promise<void> {
  const collection = await getCollection<{ ipHash: string; date: string; createdAt: Date }>(
    COLLECTIONS.visitors,
  );
  if (!collection) return;

  try {
    await collection.createIndex({ ipHash: 1, date: 1 }, { unique: true });
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });
    await collection.createIndex({ date: 1 });
  } catch {
    // indexes may already exist
  }
}

export interface DailyVisitorCount {
  date: string;
  uniqueVisitors: number;
}

/**
 * Aggregate raw visitor docs into per-day unique counts and persist
 * them in the visitorStats collection.
 */
export async function aggregateDailyVisitors(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const pipeline = [
    { $group: { _id: "$date", uniqueVisitors: { $sum: 1 } } },
    { $sort: { _id: -1 as const } },
  ];
  const results = await db.collection(COLLECTIONS.visitors).aggregate(pipeline).toArray();

  const statsCol = db.collection(COLLECTIONS.visitorStats);
  let upserted = 0;
  for (const row of results) {
    await statsCol.updateOne(
      { date: row._id },
      { $set: { date: row._id, uniqueVisitors: row.uniqueVisitors, updatedAt: new Date() } },
      { upsert: true },
    );
    upserted++;
  }
  return upserted;
}

/**
 * Get visitor stats for the last N days.
 * Merges pre-aggregated stats with a live count from the raw visitors
 * collection so that today's visitors appear immediately (without waiting
 * for the daily cron to aggregate).
 */
export async function getVisitorStats(days: number = 30): Promise<DailyVisitorCount[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [aggregatedDocs, liveCounts] = await Promise.all([
    db
      .collection(COLLECTIONS.visitorStats)
      .find({ date: { $gte: cutoffStr } })
      .sort({ date: -1 })
      .toArray(),
    db
      .collection(COLLECTIONS.visitors)
      .aggregate([
        { $match: { date: { $gte: cutoffStr } } },
        { $group: { _id: "$date", uniqueVisitors: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const merged = new Map<string, number>();

  for (const d of aggregatedDocs) {
    merged.set(d.date as string, d.uniqueVisitors as number);
  }
  // Live counts override pre-aggregated (they include any visits since last aggregation)
  for (const d of liveCounts) {
    const date = d._id as string;
    const existing = merged.get(date) ?? 0;
    if (d.uniqueVisitors > existing) {
      merged.set(date, d.uniqueVisitors as number);
    }
  }

  return [...merged.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, uniqueVisitors]) => ({ date, uniqueVisitors }));
}
