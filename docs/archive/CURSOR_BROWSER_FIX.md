# Cursor Browser Cookie Fix

## Issue

Cursor browser was not working with the portal when accessing via IP address (`http://13.135.206.128/`), while Chrome browser worked fine.

## Root Cause

The cookie configuration had an invalid combination:
- `sameSite: "none"` was set for all requests
- `secure: false` for HTTP requests (when accessing via IP)
- **Modern browsers (including Cursor) reject `sameSite: "none"` cookies that don't have `secure: true`**

Chrome might be more lenient with this, but Cursor browser (which may use a stricter Chromium version) correctly rejects this invalid cookie combination.

## Solution

Updated `server/_core/cookies.ts` to:
- Use `sameSite: "none"` only when `secure: true` (HTTPS requests)
- Use `sameSite: "lax"` when `secure: false` (HTTP requests)

This ensures valid cookie combinations for both HTTP and HTTPS access.

### Code Change

```typescript
const secure = isSecureRequest(req);

// sameSite: "none" requires secure: true
// For HTTP requests, use "lax" instead
const sameSite: "none" | "lax" | "strict" = secure ? "none" : "lax";

return {
  httpOnly: true,
  path: "/",
  sameSite,
  secure,
};
```

## Result

✅ **Cursor browser now works** with HTTP access (`http://13.135.206.128/`)
✅ **Chrome browser continues to work** (both HTTP and HTTPS)
✅ **HTTPS access** (`https://automate-workflows.com`) uses `sameSite: "none"` with `secure: true` (for cross-site compatibility)
✅ **HTTP access** uses `sameSite: "lax"` with `secure: false` (valid for same-site requests)

## Testing

Test with Cursor browser:
1. Open `http://13.135.206.128/` in Cursor browser
2. Portal should load correctly
3. No cookie-related errors in console

Test with Chrome:
1. Open `http://13.135.206.128/` in Chrome
2. Portal should continue to work as before

## Cookie Behavior

- **HTTPS requests**: `sameSite: "none"`, `secure: true` (allows cross-site cookies)
- **HTTP requests**: `sameSite: "lax"`, `secure: false` (same-site only, but works for direct access)

This is the correct behavior according to browser cookie security standards.
