# Loading Education and Crime Metrics

## Issue

The portal had no data for Education or Crime metrics in the database.

## Solution

Created a script (`server/loadMetricsData.ts`) to fetch and load Education and Crime metrics into MongoDB.

### Data Loaded

**Education Metrics (3):**
1. **Attainment 8 Score**: 45.9 (amber) - 202425
2. **Teacher Vacancy Rate**: 1.5% (amber) - 2024
3. **NEET Rate (16-17)**: 4.2% (amber) - 2024

**Crime Metrics (2):**
1. **Recorded Crime Rate**: 89.5% (amber) - 2024 Q1
2. **Charge Rate**: 7.2% (amber) - 2024 Q1

## How to Load Metrics

### Option 1: Using the Script

```bash
export DATABASE_URL="mongodb://localhost:27017/uk_rag_portal"
npx --yes pnpm@10.4.1 load:metrics
```

Or using the full command:
```bash
export DATABASE_URL="mongodb://localhost:27017/uk_rag_portal"
npx --yes tsx server/loadMetricsData.ts
```

### Option 2: Using the Admin API (if authenticated as admin)

The portal has a `metrics.refresh` endpoint that can be called via tRPC:
- Endpoint: `/api/trpc/metrics.refresh`
- Requires: Admin authentication
- Can refresh: Economy, Education, Crime, or All categories

## Verification

Check metrics in database:
```bash
mongosh uk_rag_portal --eval "db.metrics.find({}, {metric_name: 1, category: 1, value: 1}).toArray()"
```

Check via API:
```bash
# Education metrics
curl "http://13.135.206.128/api/trpc/metrics.list?input=%7B%22category%22%3A%22Education%22%7D"

# Crime metrics
curl "http://13.135.206.128/api/trpc/metrics.list?input=%7B%22category%22%3A%22Crime%22%7D"
```

## Data Sources

**Education Metrics:**
- DfE Key Stage 4 Performance (Attainment 8)
- DfE School Workforce Census (Teacher Vacancy Rate)
- DfE NEET Statistics (NEET Rate)

**Crime Metrics:**
- ONS Crime in England and Wales (Recorded Crime Rate)
- Police.uk Outcomes Data (Charge Rate)

## Future Updates

To refresh the data:
1. Run the load script again (it will update existing metrics)
2. Or use the admin refresh endpoint in the portal UI

The data is fetched from live APIs, so running the script will get the latest available data.
