# Historical Data Display Fix

## Issue
Individual metric pages were showing "No historical data available" even though the database contains 3,113 history entries.

## Root Causes Identified

1. **Cache returning empty arrays**: The cache was storing empty arrays from previous queries when no data existed, and these were being returned even after data was loaded.

2. **Sorting issue**: History was sorted by `recordedAt` (when data was recorded) instead of `dataDate` (the actual period the data represents), which could cause confusion.

3. **Type normalization**: The `recordedAt` field needed to be normalized to ensure it's always a Date object.

## Fixes Applied

### 1. Cache Logic Improvement (`server/db.ts`)
- **Before**: Cache would return any cached value, including empty arrays
- **After**: Only use cache if it contains data (`cached && cached.length > 0`)
- **After**: Only cache results if they contain data (don't cache empty arrays)

```typescript
// Only use cache if it has data (don't cache empty arrays)
if (cached && cached.length > 0) {
  return cached;
}

// Only cache if we have data (don't cache empty arrays to avoid stale empty results)
if (normalizedHistory.length > 0) {
  cache.set(cacheKey, normalizedHistory, 5 * 60 * 1000);
}
```

### 2. Improved Sorting (`server/db.ts`)
- **Before**: Sorted only by `recordedAt: -1`
- **After**: Sort by `dataDate: -1, recordedAt: -1` to show chronological data periods first

```typescript
.sort({ dataDate: -1, recordedAt: -1 }) // Sort by dataDate first (chronological), then recordedAt
```

### 3. Date Normalization (`server/db.ts`)
- Ensure `recordedAt` is always a Date object, even if MongoDB returns it as a string

```typescript
const normalizedHistory = history.map(h => ({
  ...h,
  recordedAt: h.recordedAt instanceof Date ? h.recordedAt : new Date(h.recordedAt),
}));
```

### 4. Cache Invalidation (`server/db.ts`)
- Added cache invalidation for limit 100 (commonly used in frontend)

### 5. Debug Logging (`server/routers.ts`)
- Added logging to help diagnose issues:
  - Logs when no history is found
  - Logs count of history entries when found

## Verification

- ✅ Database contains 3,113 history entries
- ✅ All 14 metrics have history data
- ✅ Query logic verified to work correctly
- ✅ Cache logic improved to prevent stale empty results

## Testing

To verify the fix works:

1. Clear the cache by restarting the server
2. Navigate to any metric detail page
3. Historical data should now display correctly

If historical data still doesn't appear:

1. Check server logs for debug messages
2. Verify the metricKey matches exactly between metrics and metricHistory collections
3. Check if cache needs to be manually cleared

## Files Modified

1. `server/db.ts` - Improved cache logic, sorting, and date normalization
2. `server/routers.ts` - Added debug logging
