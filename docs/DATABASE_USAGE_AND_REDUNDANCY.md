# Database usage and redundancy

## What the database is used for

MongoDB is used for **three collections**, all defined in `server/db.ts`:

| Collection       | Purpose | Used by |
|------------------|--------|--------|
| **users**        | Auth: who is logged in (openId, name, email, role). Created/updated on admin login, OAuth callback, and dev login. | `server/db.ts` (upsertUser, getUserByOpenId), `server/_core/oauth.ts`, `server/_core/sdk.ts` |
| **metrics**      | Dashboard metric cards: current value, category, RAG status, data date, source URL. Written by metrics refresh (Python scripts → upsertMetric). | `server/db.ts` (getMetrics, getMetricByKey, upsertMetric), `server/routers.ts`, `server/alertService.ts`, `server/dataIngestion.ts` (via refresh) |
| **metricHistory**| Time series for each metric (value, RAG, dataDate per period). Used on metric detail pages and for charts. | `server/db.ts` (getMetricHistory, addMetricHistory), `server/routers.ts` |

In short:

- **users** → login and session identity.
- **metrics** + **metricHistory** → dashboard tiles and metric detail/charts.

---

## Redundancy removed (Jan 2025)

The following were removed as redundant or unused:

1. **Commentary** – Commentary API (router), DB helpers, schema types, and indexes were removed; no client used them. The **commentary** collection is no longer used by the app.

2. **fileMetadata / fileChangeDetector** – The file-change detection module (`server/fileChangeDetector.ts`, `server/fileMetadata.ts`) and **fileMetadata** indexes were removed; they were never wired into the data refresh flow. The **fileMetadata** collection is no longer used by the app.

**Dropping unused collections (optional):** To free space, drop the `commentary` and `fileMetadata` collections. From the project root, run:

```bash
pnpm run db:drop-unused
```

This uses `DATABASE_URL` (or `MONGODB_URI`) from your environment or `.env` and only drops those two collections if they exist. Use the same database URL as your running app (e.g. production or staging); do not point it at a test DB if you still need that data.

There is no remaining redundant DB usage in the codebase.
