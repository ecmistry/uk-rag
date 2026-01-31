# Chart Line and Trend Line Fix

## Issue
Charts were only showing dots (scatter plot) instead of connected lines, and the trend line was not visible.

## Root Cause
1. **Recharts limitation**: All `Line` components in a `LineChart` must use the same data source
2. **Previous implementation**: Trend line was trying to use a separate `data` prop, which Recharts doesn't support
3. **Data structure**: Trend values needed to be part of the main dataset

## Solution

### Fixed Implementation
1. **Calculate trend values** and add them as `trendValue` property to each data point
2. **Use same data source**: Both the main line and trend line now use the same `chartData` array
3. **Proper data keys**: 
   - Main line uses `dataKey="value"`
   - Trend line uses `dataKey="trendValue"`

### Code Changes

```typescript
// Calculate trend line values and add to chartData
const trendLineData = chartData.map((_, i) => ({
  date: chartData[i].date,
  value: intercept + slope * i,
}));

// Merge trend values into main data
<LineChart
  data={chartData.map((d, i) => ({
    ...d,
    trendValue: trendLineData[i]?.value,
  }))}
>
  <Line dataKey="value" ... />  {/* Main data line */}
  <Line dataKey="trendValue" ... />  {/* Trend line */}
</LineChart>
```

## What You Should See Now

After hard refreshing your browser:

1. **Connected Line Chart**: 
   - Smooth curved line connecting all data points
   - Uses `type="monotone"` for smooth curves
   - Dots visible at each data point

2. **Dashed Trend Line**:
   - Straight dashed line showing overall trend direction
   - Uses `type="linear"` for straight line
   - `strokeDasharray="8 4"` for dashed appearance
   - Gray color (`hsl(var(--muted-foreground))`)

3. **Legend**:
   - Shows both lines with labels
   - "CPI Annual Inflation Rate" (or metric name) for main line
   - "Trend Line" for the trend line

## Build Status

✅ **Build completed**: Jan 25 08:09
✅ **Server restarted**: Latest build active
✅ **Code verified**: TypeScript checks pass

## Next Steps

**CRITICAL**: You must hard refresh your browser to see the changes:

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

Or:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## Verification

After refreshing, navigate to any metric detail page. You should see:
- ✅ Connected line between all data points
- ✅ Dashed trend line showing overall direction
- ✅ Legend with both lines labeled
- ✅ Smooth curves (not just dots)

If you still see only dots:
1. Check browser console for errors (F12)
2. Verify you did a hard refresh (not just regular refresh)
3. Try a different browser or incognito mode
4. Check Network tab to ensure new JavaScript files are loading
