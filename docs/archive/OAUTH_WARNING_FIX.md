# OAuth Warning Suppression

## Issue

The browser console was showing repeated warnings:
```
[Auth] OAuth not configured: VITE_OAUTH_PORTAL_URL or VITE_APP_ID missing
```

This warning appeared every time `getLoginUrl()` was called, which happens multiple times during application initialization and user interactions.

## Solution

Updated `client/src/const.ts` to:
1. **Log the warning only once** - Added a flag to track if the warning has been logged
2. **Changed to `console.debug`** - Changed from `console.warn` to `console.debug` so it only appears when verbose logging is enabled

### Changes Made

```typescript
// Track if we've already logged the OAuth warning to avoid spam
let oauthWarningLogged = false;

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!oauthPortalUrl || !appId) {
    // Only log the warning once to avoid console spam
    if (!oauthWarningLogged) {
      console.debug("[Auth] OAuth not configured: VITE_OAUTH_PORTAL_URL or VITE_APP_ID missing. Authentication features will be disabled.");
      oauthWarningLogged = true;
    }
    return "";
  }
  // ... rest of function
};
```

## Result

- ✅ Warning only appears once (if at all, depending on console verbosity settings)
- ✅ Changed to `console.debug` so it's less intrusive
- ✅ Application functionality unchanged - OAuth is optional

## If You Want to Configure OAuth

If you want to enable OAuth authentication, add these to your `.env` file:

```bash
# OAuth Configuration
VITE_OAUTH_PORTAL_URL=https://your-oauth-server.com
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=your-open-id
```

Then rebuild the application:
```bash
npx --yes pnpm@10.4.1 build
sudo systemctl restart uk-rag-portal
```

## Note

OAuth is **optional** - the portal works fine without it. The application will function normally, but authentication features (like user-specific data, protected routes, etc.) won't be available.
