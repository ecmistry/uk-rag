# Historical RAG Metric Data Loading Guide

## Portal Access

**The portal is accessible at:**
- **HTTPS URL**: https://automate-workflows.com
- **Internal Port**: 3000 (proxied through nginx on port 443)

The portal is running with MongoDB and is fully operational.

## Current Data Collection Process

### How It Works Now

1. **Python Data Fetchers** (`economy_data_fetcher.py`, `education_data_fetcher.py`, `crime_data_fetcher.py`)
   - Fetch the **latest** data point from ONS/DfE APIs
   - Calculate RAG status
   - Return single data point per metric

2. **Refresh Endpoint** (`metrics.refresh`)
   - Calls the Python fetchers
   - Updates the current metric value in the `metrics` collection
   - Adds the new data point to `metricHistory` collection

3. **Historical Data Storage**
   - Each time you run a refresh, the current value is added to history
   - Historical data accumulates over time as you run refreshes

### Current Limitation

**The Python scripts only fetch the LATEST data point**, not historical time series. This means:
- You get the current value and add it to history each refresh
- Historical data builds up over time as you run refreshes regularly
- You don't get past historical data in one go

## Loading Historical Data

### Option 1: Automatic Historical Build-up (Current Method)

**How it works:**
- Run the refresh endpoint regularly (daily, weekly, etc.)
- Each refresh adds the current value to history
- Over time, you build up a historical record

**To trigger a refresh:**
1. Log into the portal as admin
2. Go to the dashboard
3. Use the "Refresh" button in the control panel
4. Or call the API endpoint: `POST /api/trpc/metrics.refresh`

**API Example:**
```bash
curl -X POST https://automate-workflows.com/api/trpc/metrics.refresh \
  -H "Content-Type: application/json" \
  -d '{"category": "All"}'
```

### Option 2: Modify Python Scripts to Fetch All Historical Data

To load all historical data at once, you would need to modify the Python fetchers to:

1. **Parse all data points** from the CSV/time series (not just the latest)
2. **Return multiple data points** instead of just one
3. **Update the ingestion code** to handle multiple historical points

**Example modification for `economy_data_fetcher.py`:**

Currently, it does:
```python
# Get the latest value
latest = data_rows[-1]
return result  # Single data point
```

You could modify it to:
```python
# Return all historical data points
historical_results = []
for row in data_rows:
    historical_results.append({
        'metric': metric_name,
        'metric_key': metric_key,
        'value': row['value'],
        'date': row['date'],
        'unit': config['unit'],
        'rag_status': calculate_rag_status(metric_key, row['value']),
        'fetched_at': datetime.utcnow().isoformat()
    })
return historical_results  # All data points
```

Then update `dataIngestion.ts` to handle arrays of historical data and insert each point into `metricHistory`.

### Option 3: Create a Historical Backfill Script

Create a new script that:
1. Fetches all historical data points from the APIs
2. Inserts them all into `metricHistory` collection
3. Sets the latest one as the current metric

**Example script structure:**
```typescript
// server/backfillHistoricalData.ts
import { fetchEconomyMetrics } from './dataIngestion';
import { upsertMetric, addMetricHistory } from './db';

async function backfillHistorical() {
  // Fetch all historical points (would need modified Python script)
  const allData = await fetchAllHistoricalEconomyMetrics();
  
  for (const dataPoint of allData) {
    await addMetricHistory({
      metricKey: dataPoint.metric_key,
      value: dataPoint.value.toString(),
      ragStatus: dataPoint.rag_status,
      dataDate: dataPoint.date,
      recordedAt: new Date(dataPoint.date), // Use actual date from data
    });
  }
  
  // Set latest as current metric
  const latest = allData[allData.length - 1];
  await upsertMetric({
    metricKey: latest.metric_key,
    // ... other fields
  });
}
```

## Recommended Approach

**For immediate historical data loading:**

1. **Short-term**: Use the current refresh mechanism and run it regularly to build history
2. **Long-term**: Modify the Python scripts to fetch all historical data points and create a backfill script

**To modify the Python scripts for full historical data:**

1. Update `economy_data_fetcher.py` to return all data points from the CSV
2. Update `education_data_fetcher.py` similarly
3. Update `crime_data_fetcher.py` similarly
4. Modify `dataIngestion.ts` to handle arrays of historical data
5. Create a backfill script to load all historical data at once

## Current Data Status

Check your current data:
```bash
# Connect to MongoDB
mongosh uk_rag_portal

# Check metrics
db.metrics.find().pretty()

# Check history
db.metricHistory.find().sort({recordedAt: -1}).limit(10).pretty()

# Count historical records
db.metricHistory.countDocuments()
```

## Next Steps

1. **Immediate**: Run the refresh endpoint to start collecting current data
2. **Historical Backfill**: If you need past data, modify the Python scripts as described above
3. **Automation**: Set up a cron job or scheduled task to run refreshes regularly

## Portal Access Summary

- **Public URL**: https://automate-workflows.com
- **Internal Port**: 3000 (localhost only, proxied by nginx)
- **Database**: MongoDB on localhost:27017
- **Database Name**: uk_rag_portal
