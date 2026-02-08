# Quarterly data on metric detail pages – plan and phases

## Goal

Show **quarterly data only** on every metric detail page (Historical Data table and chart), so all metrics use a consistent quarterly view instead of mixing annual and quarterly.

## Current state

- **Output per hour (Economy):** Done. Backend fetches quarterly from ONS PRDY CSV; frontend filters to quarterly only.
- **Other Economy metrics:** ONS generators return annual (e.g. IHYP, NPEL, HF6X). Frontend can still filter to quarterly so that when we add quarterly sources, they display correctly.
- **Employment, Healthcare, Crime:** Some fetchers already use quarterly-style periods (e.g. "2024 Q3", "Q2 2025/26"). Frontend filter shows only those.
- **Education, Defence, Population:** Mostly annual (e.g. "2024", "2021-2023"). Filtering to quarterly would show no history until we add quarterly sources or keep showing annual.

## Phases

### Phase 1 – Output per hour (done)

- Backend: `output_per_hour` fetches from PRDY CSV (quarterly).
- Frontend: Metric detail page filters history to quarterly for `output_per_hour`.

### Phase 2 – All metric pages: show quarterly only (this phase)

- **Frontend:** Single rule for all metrics: **only show history rows where the period looks quarterly** (e.g. `YYYY Qn` or contains ` Q1`–` Q4`). One code path for every metric.
- **Effect:** Metrics that already have quarterly data (Economy output_per_hour, some Employment/Healthcare/Crime) show it; metrics with only annual data show no historical table/chart until Phase 3+.
- **Files:** `client/src/data/quarterlyMetrics.ts` (optional: pattern or allow-list), `client/src/pages/MetricDetail.tsx` (use shared pattern for all metrics).

### Phase 3 – Backend: more Economy metrics quarterly

- **business_investment:** Done. Fetches from ONS CXNV dataset CSV (NPEL column), quarterly levels → YoY % change; 111+ quarterly points.
- **real_gdp_growth:** ONS QNA CSV publishes IHYP (YoY GDP growth) only in annual rows, not quarterly; generator remains annual. Left as-is; metric detail will show no history until a quarterly source is found.
- **public_sector_net_debt:** ONS PUSF is annual; left as-is.
- **cpi_inflation:** Monthly (MM23); left as-is (monthly); frontend quarterly filter may show no history unless we aggregate.

### Phase 4 – Employment, Healthcare, Crime, Defence

- Healthcare and Crime fetchers already use quarterly-style periods (e.g. `YYYY Qn`, `Q2 2025/26`). Frontend quarterly pattern matches these.
- Employment: Resolution Foundation data may use `YYYY Qn`; placeholder uses current quarter. No change required for display.
- Defence: mix of annual and quarterly (personnel_strength); frontend filter shows any row matching `Q1`–`Q4` + year.

### Phase 5 – Education, Population (optional)

- Most DfE/ONS Population series are annual. Either leave as “show all” (no quarterly filter) for those categories, or add quarterly-only filter and accept empty history until sources change.

## Implementation (Phase 2)

- **Quarterly pattern:** Accept any `dataDate` that looks like a quarter, e.g.:
  - `2024 Q1`, `2025 Q2` (strict)
  - `Q2 2025/26`, `Q1 2024` (relaxed)
- **Single filter for all metrics:** In `MetricDetail.tsx`, filter `history` to rows where `dataDate` matches the quarterly pattern. Chart, table, and CSV export use this filtered list.
- **Copy:** “Historical Data” / “Quarterly values and trends” for all metrics (or “Quarterly data” where we filter).

## File changes (Phase 2)

| File | Change |
|------|--------|
| `client/src/data/quarterlyMetrics.ts` | Export `isQuarterlyPeriod(dataDate)` (or shared pattern). |
| `client/src/pages/MetricDetail.tsx` | Use shared quarterly check for all metrics; use `displayHistory` everywhere; card description “Quarterly values and trends” when filtering. |
