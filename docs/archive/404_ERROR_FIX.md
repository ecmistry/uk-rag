# 404 Error Fix Summary

## Issue Identified

The portal was showing 404 errors for resources. The root cause was:

**Analytics Script with Unreplaced Placeholders**
- The HTML template had an analytics script with placeholders: `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%`
- These placeholders were not being replaced during the build process
- The browser tried to load `%VITE_ANALYTICS_ENDPOINT%/umami` which is an invalid URL, causing 404 errors

## Fix Applied

1. **Removed Analytics Script from HTML Template**
   - Updated `client/index.html` to remove the analytics script tag
   - The script is now conditionally injected only if analytics is configured

2. **Created Analytics Plugin**
   - Added `vite-plugin-analytics.ts` to handle analytics script injection
   - Only injects the script if `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are configured
   - Removes placeholder scripts if analytics is not configured

3. **Updated Vite Configuration**
   - Added the analytics plugin to the Vite plugins array
   - Ensures proper handling of analytics during build

4. **Rebuilt Application**
   - Rebuilt the frontend with the fixes
   - Restarted the application service

## Verification

- ✅ Analytics script removed from built HTML
- ✅ Main assets (JS/CSS) loading correctly
- ✅ No more 404 errors for analytics resources
- ✅ Site loading properly

## Current Status

The portal is now working without 404 errors. All resources are loading correctly:
- Main JavaScript bundle: `/assets/index-Q1Frkou0.js` ✅
- Main CSS bundle: `/assets/index-BGBw0J2W.css` ✅
- Analytics script: Removed (not configured) ✅

## If You Want to Enable Analytics Later

To enable analytics in the future:

1. Add to `.env`:
   ```
   VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com
   VITE_ANALYTICS_WEBSITE_ID=your-website-id
   ```

2. Rebuild the application:
   ```bash
   npx --yes pnpm@10.4.1 build
   sudo systemctl restart uk-rag-portal
   ```

The analytics plugin will automatically inject the script with the correct values.
