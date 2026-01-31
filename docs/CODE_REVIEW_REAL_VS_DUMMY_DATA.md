# Code review: real data vs dummy/placeholder data

This document classifies what the dashboard shows: **real data** (from MongoDB, populated by live fetchers), **placeholders** (explicit “No data” tiles), or **fallback/dummy** values (hardcoded when a fetcher fails or isn’t implemented).

---

## 1. Data flow (confirmed)

- **List API** (`metrics.list` → `getMetrics()` in `server/db.ts`):
  - **Always reads from MongoDB** (no in-memory cache for the list).
  - Runs `collection.find(query).toArray()` and then applies placeholders only for missing keys (so each section can show five cards).
- **Population of MongoDB**:
  - **Refresh** (UI or API): runs Python/Node fetchers → `upsertMetric()` → MongoDB.
  - **Load script** (`npm run load:metrics`): same fetchers → `upsertMetric()` → MongoDB.

So the dashboard is **served from the database**; the only “dummy” behaviour is (a) explicit placeholders and (b) fallback values inside some fetchers when APIs fail or aren’t wired.

---

## 2. Placeholders (explicit “No data” – correct)

These are **not** real data. They exist so each section can show five cards; the UI treats them as “no data”.

| Location | What | How it’s shown |
|----------|------|------------------|
| `server/db.ts` | Economy: `public_sector_net_debt`, `business_investment` if missing from DB | `value: "placeholder"` → UI shows “—” and “No data” |
| `server/db.ts` | Population: all five keys if missing | Same |
| `server/db.ts` | Crime: `perception_of_safety`, `crown_court_backlog`, `reoffending_rate` if missing | Same |
| `server/db.ts` | Healthcare: `elective_backlog`, `gp_appt_access`, `staff_vacancy_rate` if missing | Same |
| `server/db.ts` | Defence: `equipment_spend`, `deployability` if missing | Same |

**UI** (`client/src/pages/Home.tsx`):

- `metric.value === "placeholder"` → display “—” and a “No data” line.
- So **placeholder metrics are clearly not real data** and are shown as such.

---

## 3. Real data (from live fetchers → MongoDB)

These metrics are **real** when the fetcher succeeds and writes to MongoDB:

| Category | Metric(s) | Fetcher | Source |
|----------|-----------|---------|--------|
| Economy | Output per Hour, Real GDP Growth, CPI Inflation | `economy_data_fetcher.py` (ONS) | ONS API |
| Employment | All 5 (Inactivity, Real Wage Growth, Job Vacancy Ratio, Underemployment, Sickness Absence) | `employment_data_fetcher.py` | Resolution Foundation / ONS |
| Education | Attainment 8, Persistent Absence, Apprentice Starts | `education_data_fetcher.py` | DfE (real APIs) |
| Crime | Recorded Crime Rate, Charge Rate | `crime_data_fetcher.py` | ONS Excel / parsing |
| Healthcare | A&E 4-Hour Wait %, Cancer Wait Time, Ambulance Response Time | `healthcare_data_fetcher.py` | NHS England |
| Defence | Defence Spending % GDP, Equipment Readiness, Personnel Strength | `defence_data_fetcher.py` | MOD/ONS |
| Population | From population fetcher (mix – see below) | `population_data_fetcher.py` | ONS + placeholders |

So **when the fetcher runs successfully and the value is not `"placeholder"`**, the number you see is **real data** from the database, originally from the external source.

---

## 4. Dummy / fallback values (look real but are hardcoded)

These are **not** live data; they are hardcoded when the fetcher fails or isn’t implemented. The dashboard shows them as normal numbers (no “No data” label).

### 4.1 Education (`server/education_data_fetcher.py`)

- **Teacher Vacancy Rate**: always returns `1.5` (comment: “Placeholder – actual URL needs to be found”).
- **NEET Rate (16-24)**: always returns `4.2` (same – placeholder).

So **Teacher Vacancies** and **NEET Rate (16-24)** are **dummy values**, not from a live DfE source, even though they are stored in MongoDB like real data.

### 4.2 Crime (`server/crime_data_fetcher.py`)

- **Recorded Crime Rate**: if parsing the ONS Excel fails, fallback `crime_rate = 89.5` (“Fallback estimate”).
- **Charge Rate**: if parsing fails, fallback `charge_rate = 7.2` (“Using estimated value”).

So when the Excel structure changes or the request fails, the dashboard can show **fallback estimates** that look like real data.

### 4.3 Economy (`server/economy_data_fetcher.py`)

- **Public Sector Net Debt** and **Business Investment**: fetcher returns `_placeholder_metric(...)` with `value: 'placeholder'` and `data_source: 'Placeholder'`. Those get written to MongoDB as `value: "placeholder"`, so the **UI correctly shows “—” and “No data”**. So these are **not** dummy numbers on the dashboard; they are explicit placeholders.

### 4.4 Other fetchers

- **Defence / Healthcare**: some code paths use “fallback” or “if parsing failed” values; any hardcoded number in those paths would be dummy when the primary source fails.
- **Population**: population fetcher returns a mix of real (e.g. Total Population from ONS) and `value: "placeholder"` for others; placeholders again show as “No data” in the UI.

---

## 5. Summary table

| Category | Real data (from API/DB) | Placeholder (“No data”) | Dummy/fallback (number but hardcoded) |
|----------|--------------------------|--------------------------|----------------------------------------|
| Economy | Output per Hour, Real GDP Growth, CPI Inflation | Public Sector Net Debt, Business Investment (if not in DB) | — |
| Employment | All 5 (when fetcher succeeds) | — | Possible if fetcher falls back to estimates |
| Education | Attainment 8, Persistent Absence, Apprentice Starts | — | **Teacher Vacancies (1.5), NEET Rate (4.2)** – always dummy until DfE wired |
| Crime | Recorded Crime, Charge Rate (when Excel parsing works) | Perception of Safety, Crown Court Backlog, Reoffending Rate (if not in DB) | **89.5 and 7.2** when parsing fails |
| Healthcare | A&E, Cancer Wait, Ambulance (when parsing works) | Elective Backlog, GP Appt, Staff Vacancy (if not in DB) | Any fallback numbers in fetcher on failure |
| Defence | Spending, Equipment Readiness, Personnel (when fetcher works) | Equipment Spend, Deployability (if not in DB) | Any fallback numbers on failure |
| Population | Whatever the fetcher returns as non-placeholder | All 5 if missing from DB; fetcher also emits placeholders | Depends on population fetcher implementation |

---

## 6. Recommendations

1. **Keep current behaviour for placeholders**  
   - DB placeholders use `value: "placeholder"` and the UI shows “—” and “No data”. No change needed for those.

2. **Mark dummy/fallback values in the fetchers**  
   - When a fetcher uses a hardcoded fallback (e.g. Teacher 1.5, NEET 4.2, crime 89.5/7.2), either:
     - Set `value: "placeholder"` and optionally a `data_source: "Estimate"` (or similar), so the UI can show “No data” or “Estimate”, or  
     - Add a field (e.g. `isEstimate: true` or `data_source: "Fallback"`) and surface it in the API and UI (e.g. “Estimate” or “Data unavailable”) so users don’t think it’s live data.

3. **Wire real sources where possible**  
   - **Teacher Vacancies** and **NEET Rate**: replace the fixed 1.5 and 4.2 with real DfE API/CSV when available.  
   - **Crime**: keep fallbacks for robustness but consider logging “Using fallback” and/or marking the metric as estimate when the fallback is used.

4. **Optional: expose “data quality” in the API**  
   - Add something like `dataSource: "ONS" | "Placeholder" | "Estimate"` (or `isPlaceholder`, `isEstimate`) on each metric so the UI can consistently show “Real data” vs “No data” vs “Estimate” without parsing the value string.

---

## 7. Conclusion

- **List is always from MongoDB**; there is no in-memory list cache, so the dashboard reflects the database.
- **Real data**: anything that comes from a successful run of the Python/Node fetchers and is stored with a numeric (non-placeholder) value is real from the perspective of the pipeline.
- **Placeholders**: all use `value: "placeholder"` and are correctly shown as “—” and “No data” on the dashboard.
- **Dummy/fallback data**: Education (Teacher 1.5, NEET 4.2) and Crime (89.5, 7.2 when parsing fails) can show numbers that are not live; the main improvement is to either replace them with real sources or mark them (e.g. “Estimate”) so it’s clear they are not real data.
