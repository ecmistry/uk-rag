/**
 * MongoDB Database Operations
 * Replaces Drizzle ORM with native MongoDB driver
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { ENV } from "./_core/env";
import type {
  User,
  InsertUser,
  Metric,
  InsertMetric,
  MetricHistory,
  InsertMetricHistory,
  Commentary,
  InsertCommentary,
} from "./schema";

let _client: MongoClient | null = null;
let _db: Db | null = null;

// Collection names
const COLLECTIONS = {
  users: "users",
  metrics: "metrics",
  metricHistory: "metricHistory",
  commentary: "commentary",
} as const;

/**
 * Get MongoDB database connection
 */
export async function getDb(): Promise<Db | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!_db) {
    try {
      _client = new MongoClient(process.env.DATABASE_URL);
      await _client.connect();
      // Extract database name from connection string
      // Format: mongodb://host:port/database or mongodb://host/database
      const url = process.env.DATABASE_URL;
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

/**
 * Convert ObjectId to number for compatibility with existing code
 * Uses the timestamp portion of ObjectId to create a numeric ID
 */
function objectIdToNumber(id: ObjectId): number {
  // Use the timestamp (first 8 hex chars) converted to decimal
  return parseInt(id.toString().substring(0, 8), 16);
}

/**
 * Find ObjectId by numeric ID (searches by id field or converts)
 */
async function findObjectIdById(
  collection: Collection<any>,
  numericId: number
): Promise<ObjectId | null> {
  // First try to find by id field if it exists
  const doc = await collection.findOne({ id: numericId });
  if (doc) return doc._id;

  // Otherwise, try to find by _id using the numeric ID as hex
  // This is a fallback for documents without the id field
  try {
    const hexId = numericId.toString(16).padStart(24, "0");
    const objectId = new ObjectId(hexId);
    const doc2 = await collection.findOne({ _id: objectId });
    if (doc2) return doc2._id;
  } catch {
    // Invalid ObjectId format
  }

  return null;
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

    // Set role if owner or dev user
    if (user.openId === ENV.ownerOpenId || user.openId === "dev-user-local") {
      updateData.role = "admin";
    } else if (!updateData.role) {
      updateData.role = "user";
    }
    // If role is explicitly provided in user object, respect it (unless overridden above)
    if (user.role && user.openId !== ENV.ownerOpenId && user.openId !== "dev-user-local") {
      updateData.role = user.role;
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
  // Import cache dynamically to avoid circular dependencies
  const { cache } = await import("./cache");
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
  cache.delete(`metrics:all`);
  cache.delete(`metrics:${metric.category}`);
}

/**
 * Phase 3: Display name overrides so existing metrics show PDF names (Updated Data Sources UK RAG).
 * Applied when returning metrics; DB/fetchers unchanged until Phase 4.
 */
const DISPLAY_NAME_OVERRIDES: Partial<Record<string, string>> = {
  a_e_wait_time: "A&E 4-Hour Wait %",
  ambulance_response_time: "Ambulance (Cat 2)",
  elective_backlog: "Elective Backlog",
  gp_appt_access: "GP Appt. Access",
  staff_vacancy_rate: "Staff Vacancy Rate",
  recorded_crime_rate: "Total Recorded Crime",
  charge_rate: "Charge Rate %",
  perception_of_safety: "Perception of Safety",
  crown_court_backlog: "Crown Court Backlog",
  reoffending_rate: "Reoffending Rate",
  teacher_vacancy_rate: "Teacher Vacancies",
  neet_rate: "NEET Rate (16-24)",
  defence_spending_gdp: "Spend as % of GDP",
  personnel_strength: "Trained Strength",
  equipment_spend: "Equipment Spend",
  deployability: "Deployability %",
  equipment_readiness: "Force Readiness",
  real_gdp_growth: "Real GDP Growth",
  persistent_absence: "Persistent Absence",
  apprentice_starts: "Apprentice Starts",
};

function applyDisplayNameOverrides(m: Metric): Metric {
  const name = DISPLAY_NAME_OVERRIDES[m.metricKey];
  return name ? { ...m, name } : m;
}

/** Output per hour is % change per annum; normalize legacy "Index" unit to "%". */
function normalizeOutputPerHourUnit(m: Metric): Metric {
  const isOutputPerHour =
    m.metricKey === "output_per_hour" || m.metricKey === "productivity";
  if (isOutputPerHour && m.unit === "Index") {
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

/** Exclude only productivity (duplicate of output_per_hour); keep Output per Hour in Economy. Dedupe so only one GDP Growth card shows. */
function filterEconomyMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Economy") return metrics;
  const filtered = metrics.filter((m) => m.metricKey !== "productivity");
  return dedupeByMetricKey(filtered);
}

/** Employment section: only these five cards (and their detail pages). */
const EMPLOYMENT_ALLOWED_METRIC_KEYS = new Set([
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

/** Education section: only these five cards (and their detail pages). */
const EDUCATION_ALLOWED_METRIC_KEYS = new Set([
  "attainment8",
  "teacher_vacancy_rate",
  "neet_rate",
  "persistent_absence",
  "apprentice_starts",
]);

function filterEducationMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Education" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Education" || EDUCATION_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Crime section: only these five cards (and their detail pages). */
const CRIME_ALLOWED_METRIC_KEYS = new Set([
  "recorded_crime_rate",
  "charge_rate",
  "perception_of_safety",
  "crown_court_backlog",
  "reoffending_rate",
]);

function filterCrimeMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Crime" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Crime" || CRIME_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Healthcare section: only these five cards (and their detail pages). */
const HEALTHCARE_ALLOWED_METRIC_KEYS = new Set([
  "a_e_wait_time",
  "elective_backlog",
  "ambulance_response_time",
  "gp_appt_access",
  "staff_vacancy_rate",
]);

function filterHealthcareMetrics(metrics: Metric[], category?: string): Metric[] {
  if (category && category !== "Healthcare" && category !== "All") return metrics;
  return metrics.filter(
    (m) => m.category !== "Healthcare" || HEALTHCARE_ALLOWED_METRIC_KEYS.has(m.metricKey)
  );
}

/** Defence section: only these five cards (and their detail pages). */
const DEFENCE_ALLOWED_METRIC_KEYS = new Set([
  "defence_spending_gdp",
  "personnel_strength",
  "equipment_spend",
  "deployability",
  "equipment_readiness",
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

  // Dedupe by metricKey so duplicate cards never appear
  const merged = dedupeByMetricKey(metrics);

  // Economy: exclude only productivity; include Output per Hour
  const filtered = filterEconomyMetrics(merged, category);

  const withOverrides = filtered.map(applyDisplayNameOverrides);
  const result = dedupeByCategoryAndName(
    dropLegacyGdpGrowthLabel(filterEmploymentMetrics(filterEducationMetrics(filterCrimeMetrics(filterHealthcareMetrics(filterDefenceMetrics(withOverrides, category), category), category), category), category))
  );
  console.log(`[Metrics] list category=${category ?? "all"} source=db rawCount=${metrics.length} finalCount=${result.length}`);
  return result;
}

/**
 * Get a single metric by key
 * Uses caching to improve performance
 */
export async function getMetricByKey(metricKey: string): Promise<Metric | undefined> {
  // Import cache dynamically to avoid circular dependencies
  const { cache } = await import("./cache");
  
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
  // Education: only the five allowed metrics have detail pages; others 404
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
  // Defence: only the five allowed metrics have detail pages; others 404
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
export async function addMetricHistory(history: InsertMetricHistory): Promise<void> {
  // Import cache dynamically to avoid circular dependencies
  const { cache } = await import("./cache");
  const collection = await getCollection<MetricHistory>(COLLECTIONS.metricHistory);
  if (!collection) throw new Error("Database not available");

  const now = new Date();
  const recordedAt = history.recordedAt || now;

  await collection.findOneAndUpdate(
    { metricKey: history.metricKey, dataDate: history.dataDate },
    {
      $set: {
        value: history.value,
        ragStatus: history.ragStatus,
        recordedAt,
      },
    },
    { upsert: true }
  );

  // Invalidate cache for this metric's history
  // Clear all history caches for this metric (different limits)
  // Clear common limit values
  for (let i = 10; i <= 100; i += 10) {
    cache.delete(`metricHistory:${history.metricKey}:${i}`);
  }
  cache.delete(`metricHistory:${history.metricKey}:50`); // Default limit
  cache.delete(`metricHistory:${history.metricKey}:100`); // Common limit
  cache.delete(`metricHistory:${history.metricKey}:500`); // Max limit
}

/**
 * Get metric history for a specific metric
 * Uses caching to improve performance
 */
const METRIC_HISTORY_MAX_LIMIT = 500;

export async function getMetricHistory(metricKey: string, limit: number = 50): Promise<MetricHistory[]> {
  const cappedLimit = Math.min(Math.max(1, Math.floor(limit)), METRIC_HISTORY_MAX_LIMIT);

  // Import cache dynamically to avoid circular dependencies
  const { cache } = await import("./cache");
  
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
    recordedAt: h.recordedAt instanceof Date ? h.recordedAt : new Date(h.recordedAt),
  }));
  
  // Only cache if we have data (don't cache empty arrays to avoid stale empty results)
  if (normalizedHistory.length > 0) {
    cache.set(cacheKey, normalizedHistory, 5 * 60 * 1000);
  }
  
  return normalizedHistory;
}

// ============================================================================
// Commentary Operations
// ============================================================================

/**
 * Create a new commentary
 */
export async function createCommentary(data: InsertCommentary): Promise<number> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) throw new Error("Database not available");

  const now = new Date();
  const newId = new ObjectId();
  const numericId = objectIdToNumber(newId);

  // Convert authorId to ObjectId
  let authorId: ObjectId;
  if (data.authorId instanceof ObjectId) {
    authorId = data.authorId;
  } else if (typeof data.authorId === "number") {
    // For numeric authorId (legacy MySQL compatibility), try to find user
    // This should not happen in normal operation, but handles edge cases
    const usersCollection = await getCollection<User>(COLLECTIONS.users);
    if (usersCollection) {
      // Try to find a user - in practice, authorId should be ObjectId
      const user = await usersCollection.findOne({});
      authorId = user?._id || new ObjectId();
    } else {
      authorId = new ObjectId();
    }
  } else {
    authorId = new ObjectId();
  }

  const commentaryData: Commentary = {
    _id: newId,
    id: numericId, // Store numeric ID for compatibility
    title: data.title,
    content: data.content,
    period: data.period,
    authorId: authorId,
    status: data.status || "draft",
    publishedAt: data.publishedAt || null,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };

  await collection.insertOne(commentaryData);
  return numericId;
}

/**
 * Update a commentary
 */
export async function updateCommentary(id: number, data: Partial<InsertCommentary>): Promise<void> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) throw new Error("Database not available");

  const objectId = await findObjectIdById(collection, id);
  if (!objectId) {
    throw new Error(`Commentary with id ${id} not found`);
  }

  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  // Remove undefined values and fields that shouldn't be updated directly
  delete updateData._id;
  delete updateData.id;
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await collection.updateOne({ _id: objectId }, { $set: updateData });
}

/**
 * Delete a commentary
 */
export async function deleteCommentary(id: number): Promise<void> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) throw new Error("Database not available");

  const objectId = await findObjectIdById(collection, id);
  if (!objectId) {
    throw new Error(`Commentary with id ${id} not found`);
  }

  await collection.deleteOne({ _id: objectId });
}

/**
 * Get all published commentaries
 */
export async function getPublishedCommentaries(): Promise<Commentary[]> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) return [];

  return collection
    .find({ status: "published" })
    .sort({ publishedAt: -1 })
    .toArray();
}

/**
 * Get all commentaries (including drafts) - admin only
 */
export async function getAllCommentaries(): Promise<Commentary[]> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) return [];

  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * Get a single commentary by ID
 */
export async function getCommentaryById(id: number): Promise<Commentary | undefined> {
  const collection = await getCollection<Commentary>(COLLECTIONS.commentary);
  if (!collection) return undefined;

  const objectId = await findObjectIdById(collection, id);
  if (!objectId) return undefined;

  const commentary = await collection.findOne({ _id: objectId });
  return commentary || undefined;
}
