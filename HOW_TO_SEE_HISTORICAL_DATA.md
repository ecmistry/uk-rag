# How to See Historical Data on Metric Pages

## Issue
Historical data graphs may not be displaying even though data exists in the database.

## Solution Steps

### 1. Rebuild the Frontend (Required After Code Changes)
The frontend code has been updated. You need to rebuild:

```bash
cd /home/ec2-user/uk-rag-portal
npm run build
```

This rebuilds the client-side JavaScript files in `dist/public/assets/`.

### 2. Clear Browser Cache
After rebuilding, you **must** clear your browser cache to see the changes:

**Chrome/Edge:**
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or: Open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

**Firefox:**
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or: Press `Ctrl+F5`

**Safari:**
- Press `Cmd+Option+R`
- Or: Safari menu → Develop → Empty Caches

### 3. Verify the Data is Loading
1. Open browser DevTools (F12)
2. Go to the Network tab
3. Navigate to a metric detail page (e.g., `/metric/cpi_inflation`)
4. Look for a request to `metrics.getById` in the Network tab
5. Check the response - it should include a `history` array with data

### 4. Check Console for Errors
1. Open browser DevTools (F12)
2. Go to the Console tab
3. Look for any JavaScript errors
4. If you see errors about `parseFloat` or chart rendering, the data format might need adjustment

## What Was Fixed

1. **Deduplication**: Removed duplicate entries for the same `dataDate`
2. **Date Parsing**: Added proper parsing for date formats like "2025 Q4", "2025 SEP", "2024"
3. **Sorting**: Fixed sorting to use actual data periods, not recording timestamps
4. **Value Parsing**: Added validation for numeric values (handles negative values correctly)

## Troubleshooting

### If graphs still don't show:

1. **Check if data exists:**
   ```bash
   # Run this to verify data is in the database
   node -e "const { MongoClient } = require('mongodb'); (async () => { const client = new MongoClient('mongodb://localhost:27017/uk_rag_portal'); await client.connect(); const db = client.db('uk_rag_portal'); const count = await db.collection('metricHistory').countDocuments({ metricKey: 'productivity' }); console.log('Productivity history entries:', count); await client.close(); })();"
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check if `chartData` is populated in the Network response

3. **Verify the build:**
   ```bash
   ls -lh dist/public/assets/*.js
   # Should show recently updated files
   ```

4. **Restart the server:**
   ```bash
   sudo systemctl restart uk-rag-portal
   ```

## Expected Behavior

After rebuilding and clearing cache:
- Graphs should show a line connecting data points
- X-axis should show time periods (e.g., "2024 Q1", "2025 DEC")
- Y-axis should show the metric values
- Summary statistics should show: First Recorded, Latest, Data Points count

## Current Status

✅ Frontend code fixed (deduplication, date parsing, sorting)
✅ Build completed
⏳ **You need to hard refresh your browser to see the changes**
