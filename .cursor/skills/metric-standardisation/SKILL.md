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
| Crime | `recorded_crime_rate`, `charge_rate`, `perception_of_safety`, `crown_court_backlog`, `reoffending_rate` |
| Healthcare | `a_e_wait_time`, `elective_backlog`, `ambulance_response_time`, `gp_appt_access`, `staff_vacancy_rate` |
| Defence | `sea_mass`, `land_mass`, `air_mass`, `defence_industry_vitality`, `defence_spending_gdp` |
| Population | `natural_change`, `old_age_dependency_ratio`, `net_migration`, `healthy_life_expectancy` |

## Formatting rules (MUST follow for every section)

These rules are already implemented in the shared code. Do NOT re-implement or override them. If a section's data looks wrong, the fix is almost always in the data, not the formatting code.

### Values: always 1 decimal place

- Every numeric value displays as `toFixed(1)` -- e.g. `3` becomes `3.0`, `0.97` becomes `1.0`
- This applies to: scorecards (Home.tsx), hero values, table cells, chart tooltips, chart Y-axis
- Only exceptions: `elective_backlog`/`crown_court_backlog` (comma integers), `total_population` >= 1M (e.g. `69.5m`)
- The shared function is `formatValue(metricKey, rawValue)` in `client/src/data/formatValue.ts`
- Do NOT use `parseFloat().toFixed()` inline anywhere -- always call `formatValue()`

### Periods: always human-readable

- 6-digit academic year codes like `202425` must display as `2024/25`
- The shared function is `formatPeriod(dataDate)` in `client/src/data/formatValue.ts`
- Already applied in MetricDetail.tsx chart X-axis and table Period cells
- During data audit, check for compact codes and note them -- `formatPeriod()` handles them automatically

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

### Filtering: match scorecard periodicity

- If scorecard `dataDate` is quarterly (matches `/\bQ[1-4]\b/`), show only quarterly history
- If scorecard `dataDate` is monthly/annual/other, show ALL history (skip `filterToQuarterlyOnly`)
- This prevents mismatches where scorecard shows a monthly value but table shows quarterly

## Key learnings (data and testing)

1. **Monthly dates don't sort lexicographically** -- "Sep" > "Nov" alphabetically. The `dateSortKey()` function in `quarterlyMetrics.ts` handles this. Do NOT sort by `String.localeCompare`.
2. **Test with upsert, not refresh** -- `metrics.refresh` calls Python fetchers needing external APIs. Use `upsertMetric` directly in tests and wrap refresh calls in try/catch.
3. **`getExistingHistoryPeriods` returns a Set** -- mock must return `new Set()`, not `[]`.
4. **`recordedAt` can be null** -- always handle with fallback in `db.ts`: `h.recordedAt instanceof Date ? h.recordedAt : new Date()`.
5. **Never touch tooltips** during standardisation -- tooltips are managed separately and are content-sensitive.
6. **Seed history when fetchers only return latest** -- some fetchers (e.g. attainment8, neet_rate) only return the current value. If the sub-page shows just 1 data point, seed published historical values manually via MongoDB insert.
7. **Verify after seeding** -- always re-run the data audit after inserting history to confirm scorecard still matches latest entry and no placeholders remain.
