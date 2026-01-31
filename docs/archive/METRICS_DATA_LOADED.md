# Education and Crime Metrics Data Loaded ✅

## Status

Education and Crime metrics have been successfully loaded into the database.

### Data Loaded

**Education Metrics (3):**
1. **Attainment 8 Score**: 45.9 Score (amber) - 202425
2. **Teacher Vacancy Rate**: 1.5% (amber) - 2024
3. **NEET Rate (16-17)**: 4.2% (amber) - 2024

**Crime Metrics (2):**
1. **Recorded Crime Rate**: 89.5% (amber) - 2024 Q1
2. **Charge Rate**: 7.2% (amber) - 2024 Q1

### Verification

The data is accessible via the API:
- Total metrics in database: 7 (3 Education + 2 Crime + 1 Economy + 1 Test)
- Education metrics: 3
- Crime metrics: 2

### How to Reload/Refresh Data

**Option 1: Using the script**
```bash
export DATABASE_URL="mongodb://localhost:27017/uk_rag_portal"
npx --yes pnpm@10.4.1 load:metrics
```

**Option 2: Using the admin API** (if authenticated as admin)
- Use the `metrics.refresh` endpoint in the portal UI
- Or call: `/api/trpc/metrics.refresh` with category parameter

### Data Sources

**Education:**
- DfE Key Stage 4 Performance (Attainment 8)
- DfE School Workforce Census (Teacher Vacancy Rate)
- DfE NEET Statistics (NEET Rate)

**Crime:**
- ONS Crime in England and Wales (Recorded Crime Rate)
- Police.uk Outcomes Data (Charge Rate)

The portal should now display Education and Crime metrics in the dashboard.
