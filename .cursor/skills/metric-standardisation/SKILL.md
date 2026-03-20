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

Check each metric sub-page:
- Scorecard value matches table's first row
- Table is left-aligned, striped, 1dp formatted
- Chart tooltip shows 1dp, anchored at top
- No placeholder or "—" values in the table

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

## Key learnings

1. **Monthly dates don't sort lexicographically** -- "Sep" > "Nov" alphabetically. Always use `dateSortKey()` for chronological sorting.
2. **Quarterly filter must be conditional** -- metrics with monthly scorecards (e.g. CPI, sickness_absence) must show monthly history, not filtered quarterly.
3. **Test with upsert, not refresh** -- `metrics.refresh` calls Python fetchers needing external APIs. Use `upsertMetric` directly in tests and wrap refresh calls in try/catch.
4. **`getExistingHistoryPeriods` returns a Set** -- mock must return `new Set()`, not `[]`.
5. **`recordedAt` can be null** -- always handle with fallback: `h.recordedAt instanceof Date ? h.recordedAt : new Date()`.
6. **Never touch tooltips** during standardisation -- tooltips are managed separately.
