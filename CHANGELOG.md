# Changelog

All notable changes to the UK RAG Portal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.2] - 2026-02-24

### Added

- **docs/DATABASE_USAGE_AND_REDUNDANCY.md** – Documents the three MongoDB collections in use (users, metrics, metricHistory) and notes that commentary and fileMetadata were removed.
- **docs/TESTING.md** – How to run tests with `DATABASE_URL`, `SKIP_NETWORK_TESTS`, and test DB.
- **server/dropUnusedCollections.ts** – One-off script to drop unused `commentary` and `fileMetadata` collections; run with `pnpm run db:drop-unused`.
- **server/population-breakdown.test.ts** – Unit tests for `hasNonZeroUnderemployed` and integration test for `getPopulationBreakdown()`.
- **npm script** `db:drop-unused` – Runs the drop-unused-collections script.

### Changed

- **Metrics refresh** – Uses `getMetricHistory(metric_key, 500)` instead of 1000 when checking for existing history (aligns with `METRIC_HISTORY_MAX_LIMIT`).
- **docs/CODE_REVIEW_SECURITY_AND_PERFORMANCE.md** – Updated optional recommendations (refresh limit, cache size, drop-unused script).
- **server/dataIngestion.ts** – Exported `hasNonZeroUnderemployed` helper; docstring for `getPopulationBreakdown` updated (EMP16 fetch order).
- **server/population_data_fetcher.py** – EMP16 fetched first before ONS CSV series to avoid 429 when requesting population breakdown.
- **server/education.test.ts** – Non-admin refresh error assertion now matches `/FORBIDDEN|Admin access required/`.
- **server/metrics.test.ts** – `metrics.refresh` called with `{}` input; admin refresh test timeout set to 120s.

### Removed

- **Commentary** – Commentary router, all commentary procedures in `server/routers.ts`; commentary collection and helpers in `server/db.ts`; `Commentary` / `InsertCommentary` in `server/schema.ts`; commentary indexes in `server/setupIndexes.ts`; `server/commentary.test.ts`. No client used the feature.
- **fileMetadata / fileChangeDetector** – `server/fileChangeDetector.ts`, `server/fileMetadata.ts`, and fileMetadata indexes in `server/setupIndexes.ts` (delta detection was never wired into refresh).

### Fixed

- **.gitignore** – Added `**/__pycache__/` so Python cache directories are not committed.

## [1.0.1] - 2026-02-16

### Added

- **metricDescriptions.ts** – metric-specific copy for tile period subtitles and detail-page history descriptions (e.g. Real GDP Growth “2025 Q4 vs 2024 Q4”).
- **realGdpGrowthDisplay.ts** – display helpers for Real GDP Growth quarterly YoY labels and history description.
- **server/loadEconomyFromJson.ts** – one-off script to load `economy_metrics.json` into MongoDB (metrics + metricHistory).
- **server/ragOutputPerHour.ts** – RAG thresholds and helper for Output per Hour (labour productivity).

### Changed

- **Dashboard tiles (Home.tsx):** Reverted look-and-feel by fixing Tailwind class typos (`text-base`, `w-full`, `basis-full`, `sm:grid-cols-*`, etc.) so category headings, grid layout, and card styling render correctly again.
- **DataRefreshPanel** – replaced with minimal placeholder; data refresh remains via CLI/scripts.
- **MetricDetail** – refactored to use new metric description helpers; history presentation updated.
- **Documentation** – content reduced/simplified.
- **economy_data_fetcher.py** – simplified; economy metrics load path updated.
- **metricTooltips.ts** and **quarterlyMetrics.ts** – small updates.

### Removed

- **DATA_SOURCES_VERIFICATION.md**
- **MetricHistoryChart.tsx**
- **server/backfillHistoricalData.ts**, **employment_data_fetcher.py**, **loadMetricsData.ts**, **migrateEmploymentCategory.ts**, **scheduledDataPull.ts**, **seedEconomyPlaceholders.ts** (removed as part of economy-focused data pipeline).

### Fixed

- **Production build:** Restored `server/db.ts`, `server/routers.ts`, `server/dataIngestion.ts`, and `server/alertService.ts` so the server bundle builds and the app can be built and deployed.

## [1.0.0] - 2026-01-31

### Added

- **useHidePreviewBanner** hook to hide host-injected "Preview mode" banners via MutationObserver.
- **LoginDialog** component (generic sign-in dialog; replaces Manus-specific dialog).
- **authTypes.ts** for OAuth/session types (replaces manusTypes).
- **docs/DATABASE_CODE_REVIEW.md** documenting MongoDB usage, security, and performance.
- Compound index `{ metricKey: 1, dataDate: -1, recordedAt: -1 }` on `metricHistory` for faster history queries.

### Changed

- **Layout / full-width:** Main content area now uses full window width:
  - `html`, `body`, `#root` set to `width: 100%`, `min-height: 100vh` so the app fills the viewport.
  - **SidebarInset** and main content use `min-w-0` / `w-full` so the main pane fills space to the right of the sidebar.
  - Sidebar wrapper uses `min-w-0 max-w-full` for correct flex behaviour.
- **Auth / Manus removal:**
  - Renamed `manusTypes.ts` → `authTypes.ts`; all imports and comments updated.
  - Renamed `ManusDialog.tsx` → `LoginDialog.tsx` with generic "Sign in" copy.
  - `useAuth` now uses `uk-rag-user-info` in localStorage (replaced `manus-runtime-user-info`).
  - Removed `vite-plugin-manus-runtime` from dependencies and Vite config; removed debug collector and `__manus__` public folder.
  - Removed Manus fallback URL from `server/_core/llm.ts`.
  - Server comments in `storage.ts`, `notification.ts`, `map.ts`, `dataApi.ts` updated to drop Manus references.
- **Database:**
  - `metrics.list` input `category` restricted to an allow-list (enum).
  - `metrics.getById` input validation: `metricKey` min/max length, `historyLimit` capped 1–500.
  - `addMetricHistory` refactored to `findOneAndUpdate` with `upsert: true` (single round-trip).
  - Cache invalidation for metric history updated for new max limit (500).
- **Tests:** All auth-related test mocks use `loginMethod: "password"` instead of `"manus"`.

### Removed

- **Manus:** All references to Manus, `vite-plugin-manus-runtime`, `__manus__/debug-collector.js`, and `manusTypes`.
- **client/public/__manus__/** directory and its contents.

### Fixed

- **useHidePreviewBanner** was referenced in `App.tsx` but not defined; hook added in `client/src/hooks/useHidePreviewBanner.ts` and imported in `App.tsx`.
- Production build no longer depends on removed `vite-plugin-manus-runtime` (server bundle rebuilt with current vite.config).
