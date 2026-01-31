# Database (MongoDB) Code Review: Performance & Security

**Scope:** UK RAG Portal server – MongoDB usage in `server/db.ts`, `server/fileMetadata.ts`, `server/setupIndexes.ts`, `server/routers.ts`, and related code.

**Note:** The portal uses **MongoDB** (no SQL). This review covers query patterns, indexes, input validation, and connection usage.

---

## Executive summary

- **Security:** Input validation is partially in place; category and `historyLimit` should be tightened to reduce abuse and NoSQL-injection surface.
- **Performance:** Indexes are well aligned with most queries; one compound index and a limit cap on history queries are recommended. `addMetricHistory` can be optimized from two round-trips to one.

---

## 1. Security

### 1.1 NoSQL injection

- **Finding:** Queries use object literals (e.g. `{ category }`, `{ metricKey }`) rather than string concatenation, which is good.
- **Risk:** If `category` or `metricKey` come from the client without validation, an attacker could pass values like `{ $gt: "" }` or other operators.
- **Current state:**
  - `metrics.list`: `category` is `z.string().optional()` – any string is allowed.
  - `metrics.getById`: `metricKey` is `z.string()` – no length or format limit.
- **Recommendation:**  
  - Restrict `metrics.list` to an allow-list: `z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population', 'All']).optional()`.  
  - For `metricKey`, at minimum add `.max(128)` and consider an allow-list of known metric keys if feasible.

### 1.2 Query result size / DoS

- **Finding:** `metrics.getById` accepts `historyLimit` with `z.number().optional().default(50)` but no upper bound.
- **Risk:** A client can send a very large `historyLimit` (e.g. 999999) and cause heavy load and memory use.
- **Recommendation:** Cap the value, e.g. `z.number().min(1).max(500).optional().default(50)` and enforce the same cap in `getMetricHistory(metricKey, limit)`.

### 1.3 Commentary update

- **Finding:** `updateCommentary(id, updateData)` spreads `updateData` from the router. The router only sends allowed fields (`title`, `content`, `period`, `status`) and the handler deletes `_id` and `id`.
- **Assessment:** Low risk; input is constrained by the tRPC schema. For extra safety, consider building `updateData` from an explicit allow-list in `db.ts` instead of spreading.

### 1.4 File metadata

- **Finding:** `fileMetadata.ts` builds queries with `url` and `metricKey`; these are supplied by server-side fetchers, not directly by the client.
- **Assessment:** Risk is low; no change required for injection, but ensure any future client-supplied inputs are validated and not interpolated into query objects.

---

## 2. Performance

### 2.1 Index usage

- **setupIndexes.ts** defines indexes that match most read paths:
  - **users:** `openId` (unique) – used by `getUserByOpenId`, `upsertUser`.
  - **metrics:** `metricKey` (unique), `category` – used by `getMetrics(category)`, `getMetricByKey`, `upsertMetric`.
  - **metricHistory:** `metricKey`, `recordedAt`, and compound `(metricKey, recordedAt)` – used by `getMetricHistory`, `addMetricHistory`.
  - **commentary:** `status`, `publishedAt`, `id`, `createdAt` – used by commentary reads and `findObjectIdById`.
  - **fileMetadata:** `(url, metricKey)` (unique), `category`, `lastChecked`.

### 2.2 getMetricHistory sort

- **Finding:** Query uses `.sort({ dataDate: -1, recordedAt: -1 })` but the compound index is `{ metricKey: 1, recordedAt: -1 }`. Sorting by `dataDate` first may prevent full use of the index.
- **Recommendation:** Add a compound index that matches the sort: `{ metricKey: 1, dataDate: -1, recordedAt: -1 }`. Then use this index in `getMetricHistory` (sort by `dataDate` then `recordedAt`). This keeps history queries efficient as the collection grows.

### 2.3 Limit cap in getMetricHistory

- **Finding:** `limit` is passed through from the client (after validation); the DB layer does not enforce a maximum.
- **Recommendation:** In `getMetricHistory`, clamp `limit` to a maximum (e.g. 500) so that even if validation is bypassed, the server does not return unbounded result sets.

### 2.4 addMetricHistory: two round-trips

- **Finding:** The function does `findOne` to check for an existing document, then either `updateOne` or `insertOne`. That is two round-trips per call.
- **Recommendation:** Use `findOneAndUpdate` with `upsert: true` and `$setOnInsert` / `$set` so that one round-trip handles both insert and update. This reduces latency and load under high write volume.

### 2.5 getMetrics without limit

- **Finding:** `getMetrics(category)` uses `collection.find(query, { projection }).toArray()` with no `.limit()`. The number of metrics is bounded by product design (fixed set of metrics per category).
- **Assessment:** Acceptable for current scale. If the metric set grows significantly, consider a safety limit (e.g. 1000) and/or pagination.

### 2.6 Connection management

- **Finding:** A single `MongoClient` is created and reused via `getDb()`. No explicit `maxPoolSize` or timeouts are set.
- **Recommendation:** For production, consider setting `maxPoolSize` (e.g. 10–50) and `serverSelectionTimeoutMS` in `MongoClient` options so that connection pool size and failure detection are predictable.

### 2.7 Caching

- **Finding:** `getMetricByKey` and `getMetricHistory` use an in-memory cache with TTL; list endpoints do not cache and always hit MongoDB.
- **Assessment:** Appropriate for ensuring the dashboard reflects the database. Cache invalidation on `upsertMetric` and `addMetricHistory` is correct.

---

## 3. Implemented fixes (summary)

The following changes are recommended and can be applied in code:

1. **Security**
   - Restrict `metrics.list` input to `category` allow-list (enum).
   - Cap `historyLimit` in the router (e.g. 1–500) and in `getMetricHistory`.
   - Add `metricKey` max length (e.g. 128) in `metrics.getById`.

2. **Performance**
   - Add compound index `{ metricKey: 1, dataDate: -1, recordedAt: -1 }` in `setupIndexes.ts`.
   - Cap `limit` inside `getMetricHistory` (e.g. max 500).
   - Refactor `addMetricHistory` to use `findOneAndUpdate` with upsert.

3. **Optional**
   - MongoClient options: `maxPoolSize`, `serverSelectionTimeoutMS`.
   - Explicit allow-list when building `updateData` in `updateCommentary`.

---

## 4. Files reviewed

| File | Purpose |
|------|--------|
| `server/db.ts` | Core MongoDB operations (users, metrics, metricHistory, commentary) |
| `server/setupIndexes.ts` | Index creation |
| `server/fileMetadata.ts` | File metadata collection queries |
| `server/routers.ts` | tRPC input validation and procedure handlers |
| `server/cache.ts` | In-memory cache (no DB; referenced for invalidation) |
| `server/schema.ts` | Type definitions (no queries) |

---

*Generated as part of database (MongoDB) code review for performance and security.*
