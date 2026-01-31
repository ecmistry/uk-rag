# DB Connection & Refresh Code Review

**Date:** 2026-01-31  
**Scope:** MongoDB connection, metrics refresh flow, and data written to the database.

---

## 1. Connection

- **Config:** The app uses `ENV.databaseUrl` (from `server/_core/env.ts`), which reads `DATABASE_URL` or `MONGODB_URI`. `getDb()` in `server/db.ts` now uses `ENV.databaseUrl` so both env vars work and config is consistent with `setupIndexes.ts`.
- **Lifecycle:** A single `MongoClient` is created on first use and reused. Failed initial connect clears `_db`/`_client`; the next `getDb()` will retry. The MongoDB Node driver handles reconnects for existing connections.
- **Checking connectivity:** Call `GET /api/trpc/metrics.getDiagnostics` (or use `getMetricsDiagnostics()` in code). It returns `{ dbConnected: boolean, metricsCount: number | null }`. If `dbConnected` is false, no collection was available (no URL or connect failed). If true, the DB is reachable; `metricsCount` may be null if the count query failed.

**Verdict:** Connection path is correct. Use `metrics.getDiagnostics` to confirm the DB is reachable.

---

## 2. Refresh flow (data from sources → DB)

1. **Trigger:** Admin calls `metrics.refresh` with optional `category` (or `All`).
2. **Fetch:** For each category, the server runs the relevant fetcher (e.g. `fetchEconomyMetrics`, `fetchEducationMetrics`, …). These run Python scripts or APIs and return `MetricData[]` (metric_key, metric_name, category, value, time_period, rag_status, source_url, etc.).
3. **Write:**
   - For each `MetricData`:
     - **upsertMetric** updates the `metrics` collection (by `metricKey`): metricKey, name, category, value (string), unit, ragStatus, dataDate, sourceUrl, lastUpdated; createdAt on insert.
     - **addMetricHistory** runs only if there is no existing history row for that metric + `time_period`. It upserts into `metricHistory`: metricKey, value, ragStatus, dataDate, recordedAt.
   - Unit is derived from metric_key when not provided (e.g. `%` for rates, “Score” for attainment8).
4. **After writes:** `checkAndSendAlerts()` runs for threshold checks.

**Verdict:** Refresh correctly writes current snapshot to `metrics` and, when the period is new, adds a point to `metricHistory`. No duplicate history for the same (metricKey, dataDate) thanks to the “periodExists” check and upsert in `addMetricHistory`.

---

## 3. Data written

| Source (MetricData) | metrics collection      | metricHistory (when period is new) |
|---------------------|-------------------------|-------------------------------------|
| metric_key          | metricKey               | metricKey                           |
| metric_name         | name                    | —                                   |
| category            | category                | —                                   |
| value               | value (string)          | value                               |
| (derived)           | unit                    | —                                   |
| rag_status          | ragStatus               | ragStatus                           |
| time_period         | dataDate                | dataDate                            |
| source_url          | sourceUrl               | —                                   |
| (server)            | lastUpdated, createdAt | recordedAt                          |

Types align with `server/schema.ts` (Metric, InsertMetric, MetricHistory, InsertMetricHistory). RAG is `'red' | 'amber' | 'green'`; category is one of the known categories.

**Verdict:** Data written on refresh matches the schema and intended use. Value is stored as string to preserve precision.

---

## 4. Error handling

- **No DB:** If `getDb()` returns null (no URL or connect failed), `getCollection()` returns null. `upsertMetric` / `addMetricHistory` throw “Database not available” so the refresh mutation fails and the client can show an error.
- **Partial refresh:** Writes are done in a loop; if one write throws, earlier metrics remain written. No transactional rollback; acceptable for this use case.
- **Fetcher errors:** Per-category errors are collected in `errors` and returned with `success: true` and `count` of successfully written metrics. If no category returns any data, the mutation throws.

**Verdict:** Behaviour is consistent and errors are visible to the caller.

---

## 5. Summary

- **Connection:** Good. Uses `ENV.databaseUrl`; use `metrics.getDiagnostics` to confirm the DB is up.
- **Refresh → DB:** Correct. Fetchers return `MetricData[]`; each item is written to `metrics` and, when the period is new, to `metricHistory`.
- **Data shape:** Matches schema; values and keys are correctly mapped.
- **Resilience:** Single client, reuse, and driver reconnects are fine for current usage. For production at scale, consider `maxPoolSize` and `serverSelectionTimeoutMS` in `MongoClient` options (see also `docs/DATABASE_CODE_REVIEW.md`).

No code changes required for correctness beyond the `getDb()` switch to `ENV.databaseUrl` already applied.
