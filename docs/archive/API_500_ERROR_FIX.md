# API 500 Error Fix

## Issue

The portal was showing 500 Internal Server Error when trying to fetch regional education data:
```
GET https://13.135.206.128/api/trpc/metrics.getRegionalEducationData 500 (Internal Server Error)
```

## Root Cause

The error was caused by incorrect Python script paths in `server/dataIngestion.ts`. The code was using `__dirname` which, in the compiled JavaScript (located in `dist/server/`), pointed to the wrong directory. The Python scripts are located in `server/` at the project root, not in `dist/server/`.

**Error Message:**
```
python3: can't open file '/home/ec2-user/uk-rag-portal/dist/regional_education_fetcher.py': [Errno 2] No such file or directory
```

## Solution

Updated all Python script paths in `server/dataIngestion.ts` to use `process.cwd()` instead of `__dirname`. The `process.cwd()` returns the project root directory (set by the start script), ensuring the paths resolve correctly in both development and production.

### Changes Made

1. **Added `getProjectRoot()` helper function:**
   ```typescript
   const getProjectRoot = () => {
     return process.cwd();
   };
   ```

2. **Updated all Python script paths:**
   - `fetchEconomyMetrics()`: Changed from `path.join(__dirname, 'economy_data_fetcher.py')` to `path.join(projectRoot, 'server', 'economy_data_fetcher.py')`
   - `fetchEducationMetrics()`: Changed from `path.join(__dirname, 'education_data_fetcher.py')` to `path.join(projectRoot, 'server', 'education_data_fetcher.py')`
   - `fetchCrimeMetrics()`: Changed from `path.join(__dirname, 'crime_data_fetcher.py')` to `path.join(projectRoot, 'server', 'crime_data_fetcher.py')`
   - `fetchRegionalEducationData()`: Changed from `path.join(__dirname, 'regional_education_fetcher.py')` to `path.join(projectRoot, 'server', 'regional_education_fetcher.py')`

3. **Updated output file path:**
   - `economy_metrics.json`: Changed from `path.join(__dirname, 'economy_metrics.json')` to `path.join(projectRoot, 'server', 'economy_metrics.json')`

## Verification

✅ **API Endpoint Working:**
```bash
curl https://automate-workflows.com/api/trpc/metrics.getRegionalEducationData
# Returns: {"result":{"data":{"json":[...]}}}
```

✅ **Python Scripts Found:**
- `/home/ec2-user/uk-rag-portal/server/regional_education_fetcher.py` ✓
- `/home/ec2-user/uk-rag-portal/server/economy_data_fetcher.py` ✓
- `/home/ec2-user/uk-rag-portal/server/education_data_fetcher.py` ✓
- `/home/ec2-user/uk-rag-portal/server/crime_data_fetcher.py` ✓

## Additional Notes

### OAuth Warnings

The console also shows OAuth warnings:
```
[Auth] OAuth not configured: VITE_OAUTH_PORTAL_URL or VITE_APP_ID missing
```

These are expected if OAuth is not configured. They don't affect functionality - the application will work without OAuth, but authentication features won't be available.

### API URL Issue

The browser console shows requests going to `https://13.135.206.128/api/trpc/...` instead of `https://automate-workflows.com/api/trpc/...`. This happens when:
- The page is accessed via IP address (`http://13.135.206.128/`)
- The tRPC client uses relative URLs (`/api/trpc`), which resolve to the current origin

**Solution:** Access the site via the domain name (`https://automate-workflows.com`) to ensure all API requests use the correct domain.

## Testing

Test the API endpoint:
```bash
# Test regional education data
curl https://automate-workflows.com/api/trpc/metrics.getRegionalEducationData

# Should return JSON with regional data
```

The API should now return data successfully without 500 errors.
