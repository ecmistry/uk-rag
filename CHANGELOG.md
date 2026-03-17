# Changelog

All notable changes to the UK RAG Portal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.4] - 2026-03-17

### Added

- **Dashboard trend indicators** – Each metric tile shows a small directional arrow (up/down/flat) colour-coded by sentiment: green for positive change, red for negative, grey for neutral. Metrics where "down is good" (e.g. crime, absence rates) correctly show green when decreasing. Single-data-point metrics display a grey dot.
- **`metrics.trends` tRPC procedure** – Server-side endpoint returning the two most recent values per metric via MongoDB aggregation, with 10-minute cached TTL.
- **`metricDirections.ts`** – Centralised direction rules (higher_better / lower_better / target_band) and `getTrendSentiment()` for all metrics.
- **Test framework** – Vitest for TypeScript (client + server) with `@testing-library/react` and `jsdom`; Python `unittest` for defence computations. 137 tests total (85 TS + 52 Python).
- **Gzip compression** – Express `compression` middleware for all responses.
- **`.env.example`** – Reference file documenting all required and optional environment variables.
- **`cache.deleteByPrefix()`** – Efficient prefix-based cache invalidation.
- **`getExistingHistoryPeriods()`** – Batch history existence check eliminates N+1 queries during metrics refresh.
- **Startup env validation** – Production mode validates required `DATABASE_URL` and `JWT_SECRET` on boot.

### Changed

- **Info tooltip button** – Made transparent (removed white background); icon restored to 4×4 with standard padding after review.
- **Sea Mass tooltip** – Replaced short summary with comprehensive breakdown including pillar methodology, real-world impact, and RAG threshold definitions with traffic light symbols (provided by Rory).
- **Defence spending (`defence_spending_gdp`)** – RAG thresholds updated to reflect UK 2.5% GDP commitment (green >= 2.5%, amber >= 2.0%); rewrote fetcher to compute from ONS series KLYR/YBHA with published NATO/MOD annual fallback (2014–2025); current value corrected to 2.09% (amber).
- **Header navigation** – Removed duplicate "Data Refresh" button from header nav (refresh remains available on the Data Refresh page).
- **Defence/Education allow-lists** – Expanded `DEFENCE_ALLOWED_METRIC_KEYS` and `EDUCATION_ALLOWED_METRIC_KEYS` in `db.ts` to include new metric keys (sea_mass, land_mass, air_mass, defence_industry_vitality, pupil_attendance, apprenticeship_intensity).
- **`compute_sea_mass_score`** – Negative input values now clamped to zero for safety.
- **vitest.config.ts** – Extended to include client-side `.test.ts` / `.test.tsx` files with jsdom environment matching.
- **Metrics refresh** – Category fetches now run in parallel via `Promise.allSettled`; history deduplication uses batch query instead of per-metric lookups.
- **Server-side caching** – `metrics.list` (2 min TTL), `getPopulationBreakdown` (15 min TTL), `getRegionalEducationData` (15 min TTL) responses cached in memory.
- **`getMetrics()` filter chain** – Consolidated 10-pass filter chain into a single-pass loop with Set-based deduplication.
- **Home.tsx** – Extracted `formatCardTitle`, `getRAGCardClasses`, and `getTooltipForMetric` outside component to avoid re-creation on each render.
- **`useAuth`** – Moved localStorage side-effect out of `useMemo` into `useEffect` to prevent unexpected side-effects during render.
- **`updateInactivityRag.ts` / `updateUnderemploymentRag.ts`** – Replaced N+1 `updateOne` loops with `bulkWrite`.
- **Python fetchers** – Added error logging to 15+ silent `except` blocks; added type hints to 25+ functions; replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`; replaced `ExcelFile.parse()` with `pd.read_excel()` in `ons_emp16.py`.
- **Atomic cache writes** – `defence_industry_vitality_cron.py`, `sickness_absence_fetcher.py`, and `economy_data_fetcher.py` now write to temp file then rename to prevent corrupt reads.
- **Defence industry vitality** – Sub-pillar values clamped to [0, 1] to prevent negative scores.
- **Package.json** – Removed broken script references; added `update:underemployment-rag` and `update:inactivity-rag` scripts. Version bumped to 1.0.4.

### Fixed

- **Auth role persistence** – `upsertUser` no longer overwrites an admin user's role back to "user" on every request. Explicitly provided roles (e.g. from admin-login) are respected; default "user" only applies on first insertion.
- **Missing fetcher scripts** – Restored `crime_data_fetcher.py` and `education_data_fetcher.py` which are still referenced by `dataIngestion.ts`.
- **Map script loader** – `loadMapScript` now rejects promise on `onerror` instead of silently hanging.
- **Logout promise rejection** – Dashboard logout button now catches rejected promises to prevent unhandled rejection.
- **Sidebar NaN guard** – `parseInt` on corrupted localStorage value now falls back to default width.
- **Null safety** – `#root` element checked before `createRoot`; Map fallback URL removed (requires env var).
- **SSRF protection** – Voice transcription URL blocked for private IPs, localhost, and metadata endpoints.
- **Path traversal** – `storage.ts` `normalizeKey` rejects keys containing `..`; sickness absence cron validates publication slugs.
- **Accessibility** – Added `aria-label` to user menu, error boundary reload button; improved login dialog alt text.
- **Cache cleanup** – Wrapped `setInterval` cleanup in try/catch to prevent server crashes from cache errors.

### Removed

- **31 redundant files** – Deleted one-off fix logs, completion summaries, the entire `docs/archive/` directory, and obsolete nginx configs (`nginx-automate-workflows.conf`, `nginx-uk-rag-online-temp.conf`).

## [1.0.3] - 2026-03-16

### Added

- **Defence: Sea Mass, Land Mass, Air Mass** – New composite metrics using weighted pillar models (e.g. Strategic, Undersea, Escort, Support, Constabulary for Sea Mass). Each metric includes `information` text explaining score drivers and a "path to green" recommendation. Computation functions, tooltips, and RAG thresholds added to `defence_data_fetcher.py`.
- **Defence Industry Vitality** – Two-pillar index (Export Scale 50% + YoY Momentum 50%) using ONS international trade series via a daily cron (`server/defence_industry_vitality_cron.py`). Results cached to `defence_industry_vitality_cache.json` and read by the fetcher.
- **Apprenticeship Intensity** – Replaces raw Apprentice Starts with a rate per 1,000 working-age population. Daily cron (`server/apprenticeship_intensity_cron.py`) fetches DfE data and computes the metric.
- **Unauthorised Pupil Absence** – Replaces Persistent Absence as the attendance tile in Education.
- **Sickness Absence (Employment)** – New fetcher (`server/sickness_absence_fetcher.py`) and daily cron (`server/sickness_absence_cron.py`) that scrape NHS Digital monthly sickness rates and cache results.
- **MetricDetail: Information column** – History table now shows an `information` field per row when available (e.g. fleet breakdown for Sea Mass).
- **scripts/seed_sea_mass_information.py** – One-off script to backfill `information` and path-to-green text on existing Sea/Land/Air Mass history rows.

### Changed

- **Dashboard tiles (Home.tsx)** – Tooltip info button now appears on tiles with no data; button moved outside the `<Link>` wrapper to prevent navigation on click; icon enlarged to 4×4 with semi-transparent background for visibility; dialog body uses `min-h-0` for proper scrolling of long tooltips.
- **expectedMetrics.ts** – Education slots updated (removed Teacher Vacancies, Persistent Absence, Apprentice Starts; added Unauthorised Pupil Absence, Apprenticeship Intensity). Defence slots updated (removed Trained Strength, Equipment Spend, Deployability %, Force Readiness; added Sea Mass, Land Mass, Air Mass, Defence Industry Vitality).
- **metricTooltips.ts** – Added detailed tooltips for Sea Mass, Land Mass, Air Mass, Defence Industry Vitality, Unauthorised Pupil Absence, and Apprenticeship Intensity; removed old `apprentice_starts` tooltip.
- **vite.config.ts** – Added `Cache-Control: no-store` and `Pragma: no-cache` dev-server headers to prevent stale asset caching.

### Removed

- **server/crime_data_fetcher.py** – Removed (crime metrics now fetched by other pipelines).
- **server/education_data_fetcher.py** – Removed (replaced by Apprenticeship Intensity cron and updated Education fetcher logic).

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
