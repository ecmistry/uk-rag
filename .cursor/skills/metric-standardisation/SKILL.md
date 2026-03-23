---
name: metric-standardisation
description: Standardise a dashboard metric section (Economy, Employment, Education, Crime, Healthcare, Defence, Population). Use when auditing, cleaning, or standardising metric detail pages, data, tables, charts, or tests.
---

# Metric Section Standardisation

Repeatable process for standardising one dashboard section at a time.

## Pre-requisites (done once, already complete)

These shared changes apply to all sections and only need doing once:

- **Table UI** (`client/src/pages/MetricDetail.tsx`): striped rows, hover, left-aligned, uppercase headers, centred Status column with `w-2.5 h-2.5` RAG dots
- **`formatValue()`** (`client/src/data/formatValue.ts`): all values 1dp via `toFixed(1)`, except backlog counts (comma-formatted) and population (millions)
- **Smart quarterly filter** (`MetricDetail.tsx`): if scorecard `dataDate` is not quarterly, skip `filterToQuarterlyOnly` so monthly/annual data shows
- **Chronological sort** (`client/src/data/quarterlyMetrics.ts`): `dateSortKey()` parses quarterly, monthly, and annual date strings for correct sort order
- **Chart tooltip** (`MetricDetail.tsx`): anchored to `position={{ y: 0 }}`, `offset={16}`, dashed cursor, drop shadow, 1dp values
- **Period formatting** (`client/src/data/formatValue.ts`): `formatPeriod()` converts 6-digit academic year codes like `202425` to `2024/25`. Used in chart X-axis data and table Period cells.
- **Y-axis width** (`MetricDetail.tsx`): `width={metric.unit ? 72 : 48}` to prevent label clipping for units like "Score", "%", "minutes"
- **Schema** (`server/schema.ts`): `information?: string` on `MetricHistory` and `InsertMetricHistory`
- **`addMetricHistory`** (`server/db.ts`): persists `information` field when provided
- **Refresh path** (`server/routers.ts`): passes `information` from fetcher data to `addMetricHistory`

## Per-section checklist

For each section (e.g. Employment), follow these steps in order:

### 1. Data audit

Run a MongoDB script against the 5 (or 4) metric keys for the section:

```
For each metricKey:
  - Get current metric from `metrics` collection (value, dataDate, ragStatus)
  - Count placeholder entries in `metricHistory`
  - Count null `recordedAt` entries
  - Count non-numeric values
  - Determine if scorecard is quarterly (regex: /\bQ[1-4]\b/)
  - Find latest relevant history entry (quarterly or all, depending on above)
  - Check: does latest history value === scorecard value?
  - Report total history count
```

### 2. Data cleanup

Fix any issues found:

- **Delete placeholders**: `deleteMany({ metricKey, value: 'placeholder' })`
- **Fix mismatches**: if scorecard value differs from latest history, upsert a matching entry: `findOneAndUpdate({ metricKey, dataDate: metric.dataDate }, { $set: { value, ragStatus, recordedAt: new Date(), dataDate } }, { upsert: true })`
- **Verify**: re-run audit to confirm all 5 metrics show `match=YES` and `placeholders=0`

### 3. Tests

Create `server/<section>.test.ts` following the established pattern:

```typescript
// Key pattern elements:
vi.mock("./db", async (importOriginal) => { /* in-memory Map mock */ });
// Use upsertMetric directly instead of calling refresh (avoids Python dependency)
// Tests: admin refresh (try/catch), list after upsert, getById, RAG validation, all expected keys
```

Also add/update client utility tests if any new helpers were created.

Run full suite: `npx vitest run` -- all tests must pass.

### 4. Rebuild and verify

```bash
npm run build
# Kill old server, start new:
lsof -ti:3000 | xargs kill -9; sleep 2
nohup node dist/index.js > /tmp/server.log 2>&1 &
```

Check each metric sub-page against this checklist:

- [ ] Scorecard hero value matches table's first row value (both 1dp)
- [ ] Table: left-aligned, striped rows, 1dp values, period formatted (no 6-digit codes)
- [ ] Table: RAG dots visible and centred in Status column
- [ ] Table: no "placeholder" or lone "—" values (information column "—" is OK if no data)
- [ ] Chart Y-axis: labels fully visible, not clipped on left edge
- [ ] Chart Y-axis: space between value and unit (e.g. "45.9 Score" not "45.9Score")
- [ ] Chart tooltip: anchored at top of chart, not overlapping data lines
- [ ] Chart tooltip: shows 1dp values consistent with table
- [ ] Chart X-axis: periods human-readable (2024/25 not 202425)
- [ ] History has more than 1 entry (seed if fetcher only returns latest)

### 5. Commit

```bash
git add -A && git commit -m "Standardise <Section> section: data cleanup, tests, verification"
git push origin main
```

## Metric keys by section

| Section | Keys |
|---------|------|
| Economy | `output_per_hour`, `real_gdp_growth`, `cpi_inflation`, `public_sector_net_debt`, `business_investment` |
| Employment | `inactivity_rate`, `real_wage_growth`, `job_vacancy_ratio`, `underemployment`, `sickness_absence` |
| Education | `attainment8`, `neet_rate`, `pupil_attendance`, `apprenticeship_intensity` |
| Crime | `perception_of_safety`, `asb_low_level_crime`, `serious_crime`, `crown_court_backlog`, `recall_rate` |
| Healthcare | `a_e_wait_time`, `elective_backlog`, `ambulance_response_time`, `gp_appt_access`, `staff_vacancy_rate` |
| Defence | `sea_mass`, `land_mass`, `air_mass`, `defence_industry_vitality`, `defence_spending_gdp` |
| Population | `natural_change`, `old_age_dependency_ratio`, `net_migration`, `healthy_life_expectancy` |

## Date format standard: canonical "YYYY QN"

**ALL dataDates MUST be in the format `YYYY QN`** (e.g. `"2025 Q4"`, `"2026 Q1"`).
This applies to both the `metrics` collection (scorecard) and `metricHistory` collection (history).

### How incoming dates are normalised

The `normaliseDataDate()` function in `server/db.ts` automatically converts any incoming date to canonical format:

| Input format | Example | Converts to |
|---|---|---|
| Monthly | `"Nov 2025"`, `"2026 JAN"` | `"2025 Q4"`, `"2026 Q1"` |
| Annual | `"2025"` | `"2025 Q4"` |
| Academic year | `"202425"` | `"2025 Q3"` |
| Financial year quarter | `"Q2 2025/26"` | `"2025 Q3"` |
| Month range | `"Oct-Dec 2023"` | `"2023 Q4"` |
| Year Ending | `"YE Jun 25 P"` | `"2025 Q2"` |
| Multi-year range | `"2021-2023"` | `"2023 Q4"` |
| Already canonical | `"2025 Q4"` | `"2025 Q4"` (no change) |

### Month-to-quarter mapping

- Jan/Feb/Mar → Q1
- Apr/May/Jun → Q2
- Jul/Aug/Sep → Q3
- Oct/Nov/Dec → Q4

### Aggregation rules for monthly → quarterly

When converting monthly data to quarterly (e.g. via `scripts/quarterly_normalise.cjs`):

- **Take the LAST available month** in each quarter (latest snapshot)
- If multiple entries exist for the same month within a quarter, keep the one with the latest `recordedAt`
- Do NOT average monthly values — use the end-of-quarter reading

### Financial year quarter conversion to calendar quarter

NHS/government financial year runs April–March:

| FY Quarter | Calendar months | Calendar quarter |
|---|---|---|
| FY Q1 | Apr–Jun | Q2 |
| FY Q2 | Jul–Sep | Q3 |
| FY Q3 | Oct–Dec | Q4 |
| FY Q4 | Jan–Mar | Q1 (next year) |

### Bulk normalisation script

`scripts/quarterly_normalise.cjs` processes ALL metrics in one pass:

1. Parses every history entry's `dataDate` to `{ year, quarter, monthInQuarter }`
2. Groups entries by canonical `"YYYY QN"` key
3. Picks the best entry per quarter (latest month, then latest `recordedAt`)
4. Replaces old entries with canonical entries
5. Updates scorecard `dataDate` to canonical format
6. Runs verification pass to confirm zero non-canonical entries remain

Run: `node scripts/quarterly_normalise.cjs`

### Important: adding new metrics or fetchers

When adding a new metric or fetcher, ensure:

1. The fetcher outputs `dataDate` in **any** parseable format — `normaliseDataDate()` in `db.ts` auto-converts on ingest
2. The fetcher aggregates to quarterly cadence where possible (e.g. take last month of each quarter)
3. After seeding history, run `node scripts/quarterly_normalise.cjs` to verify all entries are canonical

## Formatting rules (MUST follow for every section)

These rules are already implemented in the shared code. Do NOT re-implement or override them. If a section's data looks wrong, the fix is almost always in the data, not the formatting code.

### Values: always 1 decimal place

- Every numeric value displays as `toFixed(1)` -- e.g. `3` becomes `3.0`, `0.97` becomes `1.0`
- This applies to: scorecards (Home.tsx), hero values, table cells, chart tooltips, chart Y-axis
- Only exceptions: `elective_backlog` (comma integers), `total_population` >= 1M (e.g. `69.5m`)
- The shared function is `formatValue(metricKey, rawValue)` in `client/src/data/formatValue.ts`
- Do NOT use `parseFloat().toFixed()` inline anywhere -- always call `formatValue()`

### Periods: always canonical "YYYY QN"

- All period strings stored and displayed as `"YYYY QN"` (e.g. `"2025 Q4"`)
- The `formatPeriod(dataDate)` function in `client/src/data/formatValue.ts` passes through canonical format unchanged
- Legacy 6-digit academic year codes (`202425` → `2024/25`) handled as fallback but should not appear in new data
- Server-side `normaliseDataDate()` in `db.ts` converts any format on ingest

### Chart Y-axis: never clip labels

- Y-axis `width` is set to `72px` when the metric has a unit, `48px` without
- Labels include a space between value and unit: `"45.9 Score"` not `"45.9Score"`
- Do NOT hardcode `width={44}` -- this clips anything over ~3 digits

### Chart tooltip: anchored at top, never overlapping

- Tooltip uses `position={{ y: 0 }}` to stay above chart lines
- `offset={16}`, dashed vertical cursor, drop shadow, `pointerEvents: "none"`
- Values in tooltip use `toFixed(1)` -- consistent with everything else

### Table: left-aligned, striped, consistent

- All columns left-aligned (including Value -- do NOT right-align)
- Alternating row backgrounds: `bg-muted/25` on odd rows
- Hover effect: `hover:bg-muted/50 transition-colors`
- Uppercase column headers with `text-xs font-semibold uppercase tracking-wider`
- RAG dot: `w-2.5 h-2.5 rounded-full`, centred under "Status" header
- Period cell uses `formatPeriod()`, Value cell uses `formatValue()`

### Filtering: all data is quarterly

- Since all `dataDate` values are now canonical `"YYYY QN"`, `isQuarterlyPeriod()` matches every entry
- `filterToQuarterlyOnly()` returns the full dataset (no filtering needed)
- The `dateSortKey()` function in `quarterlyMetrics.ts` handles chronological sorting

## Key learnings (data and testing)

1. **All dates must be canonical `YYYY QN`** -- the server's `normaliseDataDate()` auto-converts, and the bulk script `quarterly_normalise.cjs` can fix existing data. Never store monthly, annual, or custom date formats.
2. **Test with upsert, not refresh** -- `metrics.refresh` calls Python fetchers needing external APIs. Use `upsertMetric` directly in tests and wrap refresh calls in try/catch.
3. **`getExistingHistoryPeriods` returns a Set** -- mock must return `new Set()`, not `[]`.
4. **`recordedAt` can be null** -- always handle with fallback in `db.ts`: `h.recordedAt instanceof Date ? h.recordedAt : new Date()`.
5. **Never touch tooltips** during standardisation -- tooltips are managed separately and are content-sensitive.
6. **Seed history when fetchers only return latest** -- some fetchers (e.g. attainment8, neet_rate) only return the current value. If the sub-page shows just 1 data point, seed published historical values manually via MongoDB insert.
7. **Verify after seeding** -- always re-run the data audit after inserting history to confirm scorecard still matches latest entry and no placeholders remain.
8. **Aggregation strategy** -- for monthly → quarterly, take the last available month value in each quarter (not average). This follows standard statistical agency practice.
