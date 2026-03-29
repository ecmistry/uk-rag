# Changelog

All notable changes to the UK RAG Portal are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.14] - 2026-03-29

### Changed

- **Fiscal data always fetched live** – Both `public_expenditure_fetcher.py` and `public_sector_receipts_fetcher.py` now always download fresh Excel data from gov.uk/ONS in `--chart` mode instead of falling back to stale local files. Combined with 15-minute server-side caching and 120s subprocess timeout (was 30s), this ensures the charts show the latest published data.
- **Population breakdown chart simplified** – Removed linear trend overlay lines and switched from `ComposedChart` to `BarChart`.

### Fixed

- **Stale data in production** – Removed three development xlsx files left in the project root (`PSS_Feb_2026_TES.xlsx`, `PSS_Feb_2026_TES (1).xlsx`, `publicsectorcurrentreceiptsappendixdfinal.xlsx`) that were being served instead of live downloads.
- **Subprocess timeout too short** – Increased fiscal fetcher timeout from 30s to the standard 120s, preventing timeouts during live xlsx downloads from ONS and gov.uk.
- **Stale docstrings** – Fixed references to "Table_10a" in `public_expenditure_fetcher.py` and `dataIngestion.ts` (code correctly reads Table_10 nominal data).
- **Redundant type cast** – Removed unnecessary `as` cast for `officialFYTotals` in `FiscalOverviewChart.tsx`; the `PublicSectorReceipts` interface already defines the field.

## [1.0.13] - 2026-03-29

### Added

- **Fiscal Overview chart** – Replaced the quarterly stacked-bar Public Sector Receipts chart with a new "UK Public Finances" section on the Charts page showing two side-by-side pie charts (Income and Expenditure) aligned to fiscal years.
- **Expenditure data pipeline** – New `public_expenditure_fetcher.py` parses HMT PSS Table 10 (nominal, 17 categories: 16 yellow + 1 blue debt interest cell) with `--chart` and `--cron` modes, matching the existing receipts fetcher pattern.
- **Expenditure tRPC endpoint** – `metrics.getPublicSectorExpenditure` procedure with 15-minute cache; new `PublicSectorExpenditurePeriod` TypeScript interface.
- **Expenditure cron job** – Daily at 07:00 UTC with 512 MB memory cap; auto-discovers latest PSS release from gov.uk collection page.
- **Year selector** – Dropdown (top-right) listing fiscal years from 2002-03 to 2024-25, defaulting to the latest year with data on both sides.
- **Interest payments toggle** – "Include interest payments" checkbox adds/removes Public Sector Debt Interest (£126.5bn in 2024-25) from the expenditure pie and deficit calculation, showing primary vs overall fiscal position.
- **Surplus/Deficit summary boxes** – Two boxes to the right of the pie charts: absolute amount (green for surplus, red for deficit) and as a percentage of income, updating live with year/toggle changes.
- **Live ONS ANBT totals** – Income total in deficit boxes uses the live ONS ANBT time series (aggregated to fiscal years) for accuracy, falling back to summing 24 Appendix D categories if the API is unavailable.
- **8 new expenditure tests** – `public-expenditure.test.ts` covering data shape, mocked subprocess, and integration (all 198 tests pass).

### Fixed

- **Missing Council Tax in receipts** – Added Council Tax (col BR, £47.4bn/yr) and Other Local Govt Taxes (col BS) to ONS Appendix D extraction. Income total went from £1,092bn to £1,139bn, now matching the official ONS total (column BY). This corrected the apparent deficit from £74bn to £27bn.
- **Nominal vs real terms mismatch** – Switched expenditure source from Table_10a (real terms, inflation-adjusted to 2024-25 prices) to Table_10 (nominal/cash terms), matching the nominal ONS receipts data. Fixes historical year comparisons where real-terms inflated values by up to 77%.
- **Negative categories excluded from deficit** – The surplus/deficit calculation now includes all categories (including negative values like petroleum revenue tax and EU transactions) rather than only positive pie-chart slices.

## [1.0.12] - 2026-03-29

### Added

- **Consolidated Admin page** – Merged the separate "Data Refresh" and "Server Health" pages into a single "Admin" page at `/admin`. Shows login form, data refresh controls, system resources (disk/memory/CPU), MongoDB stats, and cron job status in one view.
- **Service uptime** – Admin page now shows service uptime (time since last Node.js restart) instead of system uptime (EC2 instance uptime).
- **Cron schedule indicator** – Data Refresh card shows "Automatic: Daily at 06:00" pulled from actual cron configuration, replacing the misleading client-side "Auto refresh: Off" dropdown.
- **Defence Industry Vitality in daily refresh** – Added `defence_industry_vitality_cron.py` to supplementary scripts so it runs as part of the daily orchestrator.
- **3 new scorecard consistency tests** (35 total) – Guards against cron-category mismatches: validates CATEGORIES only contains active dashboard sections, every dashboard section has a cron entry, and no fetcher outputs a metric with a mismatched category.

### Changed

- **Old-Age Dependency Ratio fetch moved to healthcare** – `fetch_old_age_dependency_ratio()` moved from `population_data_fetcher.py` into `healthcare_data_fetcher.py` where it belongs. Eliminates the recurring category mismatch bug at the source.
- **Population category removed from cron** – The "Population" dashboard section was removed previously but its cron entry remained, causing `old_age_dependency_ratio` to be overwritten with `category: "Population"`. Now removed from CATEGORIES list entirely.
- **Cron respects per-metric categories** – `daily_data_refresh_cron.py` now uses `row.get("category", cat["name"])` as a safety net, so metrics that specify their own category are never overwritten.
- **VALIDATION_RANGES aligned** – Removed 10 stale keys (legacy defence/population metrics), added 7 missing keys (`neet_rate`, `elective_backlog`, `gp_appt_access`, `staff_vacancy_rate`, `old_age_dependency_ratio`, `land_mass`, `air_mass`). Fixed `nhs_vacancy_rate` → `staff_vacancy_rate` key mismatch. Aligned `apprenticeship_intensity` range to [0, 200] across TS and Python.
- **PERCENTAGE_KEYS cleaned** – Removed stale keys (`charge_rate`, `recorded_crime_rate`, `nhs_vacancy_rate`, `diagnostic_wait_time`, `equipment_plan_risk`, `recruitment_gap`, `morale_index`, `urbanisation_rate`, `dependency_ratio`). Added correct keys (`neet_rate`, `staff_vacancy_rate`, `gp_appt_access`). Fixed `reoffending_rate` → `recall_rate`.
- **exportCsv bug fix** – `category: 'All'` now correctly maps to all categories instead of matching nothing in MongoDB.
- **Test assertions fixed** – 6 test files were asserting `result.metrics` on the refresh response which doesn't exist; corrected to assert `result.count`.

### Removed

- **Unused UI components** – Deleted `RegionalEducationChart.tsx`, `LoginDialog.tsx`, `AIChatBox.tsx`, `Map.tsx` (none were imported anywhere).
- **Unused npm packages** – Removed `@hookform/resolvers`, `framer-motion`, `add`, `@types/google.maps` from package.json.
- **Dead code** – Removed `fetchPopulationMetrics()` export from `dataIngestion.ts`, `filterEconomyMetrics()` from `db.ts`, `sickness_absence_fetcher.py` (superseded by `sickness_absence_cron.py`), `DataRefresh.tsx`, `DataRefreshPanel.tsx`.
- **Stale markdown files** – Deleted 15 outdated documentation files (implementation notes, old code reviews, tooltip backups, completed plan docs).
- **Empty MongoDB collections** – Dropped unused `commentary` and `fileMetadata` collections.
- **Unused `activeMenuItem` variable** from `DashboardLayout.tsx`.

## [1.0.11] - 2026-03-28

### Added

- **Public Sector Receipts chart** – Stacked bar chart on the Charts tab showing UK government revenue broken down by 22 ONS Appendix D categories (Income Tax, VAT, Corporation Tax, etc.), aggregated to calendar quarters. Data sourced live from ONS Public Sector Finances dataset.
- **Public Sector Receipts fetcher** (`server/public_sector_receipts_fetcher.py`) – Python script with `--chart` mode (JSON to stdout for tRPC) and `--cron` mode (daily MongoDB upsert). Only publishes quarters with all 3 months of data.
- **Daily cron job** (06:30 UTC) – Fetches fresh ONS Appendix D Excel daily, detects new monthly data, and upserts complete quarters into MongoDB `publicSectorReceipts` collection.
- **tRPC endpoint** `metrics.getPublicSectorReceipts` – Public procedure with 15-minute server-side cache.
- **Scorecard consistency tests** (`server/scorecard-consistency.test.ts`, 32 tests) – Cross-checks frontend expectedMetrics, server ALLOWED_METRIC_KEYS, metricDirections, metricTooltips, and Python fetcher categories. Catches the class of bug where a metric moves between sections but only some layers are updated.
- **Public sector receipts tests** (`server/public-sector-receipts.test.ts`, 10 tests) – Data shape validation, mocked unit tests for error handling, and integration test against live ONS data.
- **Log rotation** (`config/logrotate-uk-rag-portal.conf`) – Rotates all cron log files at 5MB with 4 compressed backups via `copytruncate`.
- **Subprocess timeout** – All Python subprocess calls now have a 120s timeout (30s for local-file chart mode) to prevent hangs.

### Changed

- **Old-Age Dependency Ratio category** – Fixed category mismatch: Python fetcher and MongoDB record updated from `"Population"` to `"Healthcare"` so the metric is visible on the dashboard after section move.
- **Old-Age Dependency Ratio tooltip** – Moved from `POPULATION_TOOLTIPS` into `HEALTHCARE_TOOLTIPS` (no longer needs fallback lookup).
- **Download validation** – `download_excel()` in the receipts fetcher now validates minimum file size (10KB) and logs structured errors on ONS download failures.
- **Chart tooltip rendering** – Switched from `.map()` with null returns to `.filter()` then `.map()` for cleaner rendering of non-zero segments.

### Removed

- **Legacy metric references** – Comprehensive cleanup of all stale code from removed metrics and sections:
  - `staff_vacancy_rate`, `employment_rate`, `unemployment_rate`, `cancer_wait_time`, `recorded_crime_rate`, `charge_rate`, `persistent_absence`, `apprentice_starts`, `teacher_vacancy_rate`, `total_population` removed from DISPLAY_NAME_OVERRIDES, VALIDATION_RANGES, tooltips, source URLs, and alert rules.
  - `personnel_strength`, `equipment_spend`, `deployability`, `equipment_readiness` removed from DISPLAY_NAME_OVERRIDES.
  - `Population` removed from tRPC z.enum categories and refresh fetcher.
  - `net_migration` target band removed from metricDirections.
  - `total_population` special-case formatting removed from `formatValue.ts`.
  - Legacy Population subtitle handlers removed from `Home.tsx`.
  - `POPULATION_TOOLTIPS` emptied (5 tooltip entries totalling ~130 lines removed).
  - `server/population.test.ts` deleted (tested removed Population category).
  - Bundle size reduced from 71.9kb to 70.3kb.

## [1.0.10] - 2026-03-23

### Added

- **Charts page** – New `/charts` route with sidebar navigation entry (BarChart3 icon). Population Breakdown chart relocated here from the main dashboard.

### Changed

- **Old-Age Dependency Ratio moved to Healthcare** – Metric relocated from Population to Healthcare section, including category update in MongoDB, expected metrics, metric directions, server-side allowed keys, and tooltip fallback.
- **Healthcare description updated** – Category description now lists: A&E 4-Hour Wait %, Elective Backlog, Ambulance (Cat 2), GP Appt. Access, Old-Age Dependency Ratio.

### Removed

- **Population section** – Removed from the dashboard categories array, expected metrics, metric directions, category descriptions, and sidebar. Data and fetchers remain in the database for future use.
- **Staff Vacancy Rate** (`staff_vacancy_rate`) – Tile hidden from Healthcare section by removing from expected metrics, metric directions, server-side allowed keys, and category description. Data and fetcher remain intact.
- **Reoffending Rate cron** (`server/reoffending_cron.py`) – Superseded by Recall Rate logic in `crime_data_fetcher.py`.

## [1.0.9] - 2026-03-20

### Added

- **Anti-Social Behaviour and Low Level Crime per capita** – New Crime scorecard sourcing monthly street-level crime data from all 43 police forces via data.police.uk cumulative archive. Aggregates 9 crime types (Anti-social behaviour, Shoplifting, Bicycle theft, Other theft, Theft from the person, Vehicle crime, Public order, Other crime, Criminal damage and arson) quarterly and expresses as a rate per 100,000 population. 11 quarters of history seeded (2023 Q2 – 2025 Q4).
- **Serious Crime per capita** – New Crime scorecard aggregating 5 serious crime types (Violence and sexual offences, Robbery, Burglary, Drugs, Possession of weapons) from the same data.police.uk archive, also per 100,000 population with 11 quarters of history.
- **`server/crime_per_capita_cron.py`** – Daily cron (08:00 UTC) downloads the cumulative data.police.uk archive (~1.7 GB, 1,566 force-level CSVs), categorises street crime, aggregates quarterly, calculates per-capita rates, and upserts to MongoDB. Supports `--seed` flag for full historical backfill.
- **Tooltips and directions** – Full tooltip text for both new metrics covering methodology, real-world impact, and RAG threshold rationale. Both set to `lower_better` direction.

### Changed

- **Chart tooltip positioning** – Tooltip now pinned above the chart area (`position={{ y: -50 }}` with 60px top margin) so it never overlaps data lines or trend lines on any metric detail page.

### Fixed

- **React error #310 on MetricDetail** – Moved `useMemo` hook before early returns to fix "Rendered more hooks than during the previous render" caused by conditional hook execution when `isLoading` was true.
- **Moving average line** – Fixed `showMovingAvg12m` undefined reference in JSX; variable now correctly returned from `useMemo` and used in the chart for `real_wage_growth`.

### Removed

- **Total Recorded Crime** (`recorded_crime_rate`) – Tile, tooltip, direction, validation range, and all database data (metric + 8 history entries) removed. Added to `SKIP_METRIC_KEYS` to prevent re-ingestion.
- **Charge Rate %** (`charge_rate`) – Tile, tooltip, direction, validation range, and all database data (metric + 8 history entries) removed. Added to `SKIP_METRIC_KEYS` to prevent re-ingestion.

## [1.0.8] - 2026-03-20

### Changed

- **Canonical date format "YYYY QN"** – All 48 metric scorecards and 2,355 history entries normalised to a single canonical `YYYY QN` format (e.g. `"2025 Q4"`). Monthly data aggregated to quarterly (last-month-of-quarter value), annual data mapped to Q4, custom formats (NHS financial year, academic year, month ranges, "Year Ending") all converted. Net reduction of 3,423 duplicate/monthly entries.
- **Server-side auto-normalisation** – `normaliseDataDate()` in `server/db.ts` now automatically converts any incoming date format to canonical `YYYY QN` on ingest, preventing format drift from future fetcher runs.
- **Bulk normalisation script** – Added `scripts/quarterly_normalise.cjs` for repeatable one-pass conversion of all metrics to canonical quarterly format with verification.
- **Metric standardisation skill updated** – Added comprehensive date format standard documentation including conversion tables, aggregation rules, financial year mapping, and instructions for new metrics.

## [1.0.7] - 2026-03-20

### Changed

- **Sickness Absence tooltip** – Replaced NHS-specific framing with whole-workforce "Health Thermometer" perspective, covering CIPD correlation analysis, the "Stagnation Tax" and "Burnout Cycle" concepts, and Gold Standard benchmarks (Switzerland).
- **Sickness Absence CIPD adjustment** – Applied -1.3 percentage point adjustment to all 199 history entries and scorecard to convert from NHS-only rates to an economy-wide estimate (Pearson r ≈ 0.72 vs CIPD over 15+ years). Scorecard moved from 5.61% (red) to 4.31% (amber). Both `sickness_absence_fetcher.py` and `sickness_absence_cron.py` now apply `CIPD_ADJUSTMENT = 1.3` automatically on future runs.
- **Attainment 8 tooltip** – Replaced with "Educational Decathlon" framing, including grade-to-points mapping (9.0 = High A* to 3.0 = D), three-pillar calculation method, and Average Score basis RAG thresholds (Green > 5.5, Amber 4.5–5.5, Red < 4.5).
- **Attainment 8 values** – Divided all values by 10 to convert from DfE total-points scale (0–90) to per-subject Average Score scale (0–9), aligning with the updated tooltip thresholds. Scorecard: 45.9 → 4.6 (amber). Education fetcher updated to output divided values.
- **Attainment 8 quarterly data** – Replaced 7 annual entries with 29 quarterly entries (2018 Q3 to 2025 Q3) using linear interpolation between annual DfE data points for a smoother chart trend.
- **NEET Rate tooltip** – Replaced with "Wasted Potential" framing, covering wage scarring, Economic Gravity concept, and revised RAG thresholds calibrated against Gold Standard economies (Green < 8%, Amber 8–12%, Red > 12%).

### Fixed

- **NEET Rate data correction** – Previous data showed an incorrect 4.2% annual figure from a wrong measure/age group. Replaced with 33 correct quarterly entries from the ONS Labour Force Survey (16–24 age group, 2017 Q1 to 2025 Q1). Scorecard corrected from 4.2% (amber) to 12.5% (red) for 2025 Q1, reflecting the actual UK youth disconnection rate.
- **Attainment 8 quarterly conversion** – Replaced 7 annual entries with 29 interpolated quarterly entries (2018 Q3 to 2025 Q3) to match dashboard quarterly standard. Database-only change; values remain on the corrected 0–9 Average Score scale.

## [1.0.6] - 2026-03-20

### Changed

- **Standardised all 7 metric sections** – Completed systematic data audit, cleanup, history seeding, and test coverage across Economy, Employment, Education, Crime, Healthcare, Defence, and Population. Every metric sub-page now follows the same visual and data conventions.

### Added

- **Historical data seeded for 18 metrics** – Metrics whose fetchers only return the latest value now have full historical time series seeded from published government sources:
  - Crime: `perception_of_safety` (11 quarterly), `crown_court_backlog` (20 monthly from Mar 2020), `reoffending_rate` (20 quarterly from Jan 2019)
  - Healthcare: `a_e_wait_time` (26 quarterly from 2019 Q4), `elective_backlog` (20 from Feb 2020), `gp_appt_access` (25 quarterly from 2020 Q1), `staff_vacancy_rate` (25 quarterly from Q2 2019/20)
  - Population: `natural_change` (11 annual from 2011), `old_age_dependency_ratio` (12 annual from 2011), `net_migration` (10 entries from YE Jun 16), `healthy_life_expectancy` (13 entries from 2009-2011)
- **Section test suites** – Created standardised test files for Crime (`crime.test.ts`, 6 tests), Healthcare (`healthcare.test.ts`, 6 tests), Defence (`defence.test.ts`, 6 tests), and Population (`population.test.ts`, 6 tests). All use in-memory DB mocks with `vi.mock("./db")` pattern. Total: 151 tests across 19 files, all passing.
- **Metric-standardisation skill** (`.cursor/skills/metric-standardisation/SKILL.md`) – Comprehensive repeatable process capturing all formatting rules, a 10-point visual verification checklist, and key learnings from all 7 sections.

### Fixed

- **Crime data quality** – Removed 3 `recorded_crime_rate` entries with paragraph-length dataDates; deduplicated 19 entries across `recorded_crime_rate` and `charge_rate`; fixed `charge_rate` scorecard from stale "year" period to latest quarterly.
- **Healthcare data quality** – Deleted 6 bad `a_e_wait_time` entries (values ~5 instead of ~74%); deduplicated 11 `ambulance_response_time` entries.
- **Defence data quality** – Removed suspicious `defence_industry_vitality` 2026 Q1 = 100.0 outlier entry.
- **Population data quality** – Deleted 4 placeholder entries (one per Population metric).
- **Education history** – Seeded `attainment8` (7 entries from 2017/18) and `neet_rate` (8 entries from 2017) with published historical data; fixed `formatPeriod()` for 6-digit academic year codes (e.g. `202425` → `2024/25`).
- **Employment chronological sort** – Introduced `dateSortKey()` to correctly sort monthly, quarterly, and annual date strings chronologically instead of lexicographically (fixing `sickness_absence` and similar metrics).
- **Chart Y-axis clipping** – Dynamic width (`72px` with unit, `48px` without) prevents label truncation for metrics with units like "Score", "%", or "minutes".
- **`recordedAt` null safety** – `getMetricHistory` in `db.ts` now falls back to `createdAt` or `new Date()` when `recordedAt` is null, preventing client-side SuperJSON deserialisation crashes.

## [1.0.5] - 2026-03-20

### Changed

- **Modernised metric detail tables** – Redesigned history tables across all metric sub-pages with alternating striped rows (`bg-muted/25`), hover highlights, increased cell padding, uppercase column headers with tracking, and a centred "Status" column with slightly larger RAG dots (`w-2.5 h-2.5`).
- **Consistent 1 decimal place formatting** – Created shared `formatValue()` helper (`client/src/data/formatValue.ts`) used by Home.tsx scorecards, MetricDetail.tsx hero values, table cells, chart tooltips, and chart Y-axis. All numeric values now display with exactly 1 decimal place, with exceptions for comma-formatted backlog counts and population shown in millions.
- **Left-aligned table values** – Value column changed from right-aligned to left-aligned to match the Period column for visual consistency.
- **Smart quarterly filtering** – Metric detail pages now show monthly history data when the scorecard's latest value is monthly (e.g. CPI), preventing mismatches where the scorecard showed a monthly figure but the table only displayed quarterly data.
- **Chart tooltip positioning** – Tooltip anchored to top of chart area (`position={{ y: 0 }}`) with dashed vertical cursor line, drop shadow, and pointer-events disabled to prevent overlap with data lines.
- **Chart tooltip precision** – Changed from 2 decimal places to 1 decimal place for consistency with all other displays.

### Added

- **`information` field on metric history** – Added optional `information` field to `MetricHistory` and `InsertMetricHistory` schemas; `addMetricHistory` in `db.ts` and the refresh path in `routers.ts` now persist this field when provided by fetchers.

### Fixed

- **Economy data cleanup** – Removed 4 placeholder history entries and corrected `public_sector_net_debt` latest history value to match the current scorecard (95%).

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
