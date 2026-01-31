# Healthcare and Defence Metrics Added ✅

## Issue

The portal was missing Healthcare and Defence metrics, and Education/Crime metrics weren't displaying properly due to frontend query filtering.

## Solution

### 1. Fixed Frontend Query
- **Problem**: Frontend was only querying 'Economy' category metrics
- **Fix**: Changed query to fetch all metrics (no category filter)
- **File**: `client/src/pages/Home.tsx`

### 2. Added Healthcare Data Fetcher
- **File**: `server/healthcare_data_fetcher.py`
- **Metrics**:
  1. **A&E Wait Time**: 4.5 hours (amber) - Target: 4 hours
  2. **Cancer Wait Time**: 68 days (amber) - Target: 62 days
  3. **Ambulance Response Time**: 8.5 minutes (amber) - Target: 7 minutes

### 3. Added Defence Data Fetcher
- **File**: `server/defence_data_fetcher.py`
- **Metrics**:
  1. **Defence Spending (% of GDP)**: 2.1% (green) - NATO target: 2%
  2. **Equipment Readiness**: 78% (amber)
  3. **Personnel Strength**: 92% (amber)

### 4. Updated Backend
- Added `fetchHealthcareMetrics()` and `fetchDefenceMetrics()` to `server/dataIngestion.ts`
- Updated `metrics.refresh` endpoint to support Healthcare and Defence categories
- Updated unit handling for new metric types

### 5. Updated Frontend
- Added Healthcare and Defence to category list in `Home.tsx`
- Added category descriptions
- Updated `DataRefreshPanel` to include Healthcare and Defence refresh buttons

### 6. Updated Load Script
- `server/loadMetricsData.ts` now loads all 4 categories (Education, Crime, Healthcare, Defence)

## Data Loaded

**Education (3 metrics):**
- Attainment 8 Score: 45.9 Score (amber)
- Teacher Vacancy Rate: 1.5% (amber)
- NEET Rate (16-17): 4.2% (amber)

**Crime (2 metrics):**
- Recorded Crime Rate: 89.5% (amber)
- Charge Rate: 7.2% (amber)

**Healthcare (3 metrics):**
- A&E Wait Time: 4.5 hours (amber)
- Cancer Wait Time: 68 days (amber)
- Ambulance Response Time: 8.5 minutes (amber)

**Defence (3 metrics):**
- Defence Spending (% of GDP): 2.1% (green)
- Equipment Readiness: 78% (amber)
- Personnel Strength: 92% (amber)

## How to Refresh Data

**Using the script:**
```bash
export DATABASE_URL="mongodb://localhost:27017/uk_rag_portal"
npx --yes pnpm@10.4.1 load:metrics
```

**Using the admin API** (if authenticated as admin):
- Use the refresh buttons in the portal UI
- Or call `/api/trpc/metrics.refresh` with category parameter

## Note on Data Sources

The Healthcare and Defence fetchers currently use placeholder data. To get live data:
- **Healthcare**: Connect to NHS England API endpoints
- **Defence**: Connect to MOD/ONS API endpoints

The scripts are structured to easily integrate with real APIs when available.

## Verification

All metrics are now accessible via the API and should display in the portal:
- Education: 3 metrics ✅
- Crime: 2 metrics ✅
- Healthcare: 3 metrics ✅
- Defence: 3 metrics ✅

Refresh your browser to see all categories displayed.
