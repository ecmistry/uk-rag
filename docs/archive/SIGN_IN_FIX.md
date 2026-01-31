# Sign-In Issue Fixed ✅

## Problem

The sign-in button was redirecting back to the sign-in page in a loop because:
1. OAuth is not configured (`OAUTH_SERVER_URL` is empty)
2. When OAuth is not configured, `getLoginUrl()` returned an empty string
3. Clicking "Sign in" redirected to an empty URL, causing the page to reload
4. The app kept checking for authentication and redirecting back to sign-in

## Solution

Added a **development login endpoint** that works when OAuth is not configured:

### Changes Made

1. **Development Login Endpoint** (`/api/auth/dev-login`)
   - Created when OAuth is not configured
   - Creates a development user with admin privileges
   - Sets a valid session cookie
   - Redirects to the dashboard

2. **Updated `getLoginUrl()`**
   - When OAuth is not configured, redirects to `/api/auth/dev-login` instead of empty string
   - Allows sign-in to work even without OAuth setup

3. **Session Token Creation**
   - Uses default `appId: "dev-app"` when `VITE_APP_ID` is not set
   - Ensures session tokens are valid even in development mode

4. **Session Verification**
   - Allows empty `appId` in development mode (when OAuth is not configured)
   - Provides default `appId` for dev sessions

## How It Works

1. User clicks "Sign in" button
2. If OAuth is not configured, redirects to `/api/auth/dev-login`
3. Server creates a development user:
   - OpenId: `dev-user-local`
   - Name: "Development User"
   - Email: "dev@localhost"
   - Role: "admin"
4. Server creates a session token and sets a cookie
5. User is redirected to dashboard and is now authenticated

## Testing

To test the sign-in:
1. Click "Sign in" button on the portal
2. You should be redirected to the dashboard
3. You should see "Development User" in the sidebar
4. You should have admin access (can see admin controls)

## Production Setup

For production, configure OAuth:
1. Set `OAUTH_SERVER_URL` in `.env`
2. Set `VITE_OAUTH_PORTAL_URL` in `.env` (for client)
3. Set `VITE_APP_ID` in `.env` (for client)
4. The development login will be disabled when OAuth is configured

## Notes

- Development login only works when `OAUTH_SERVER_URL` is empty
- The development user has admin privileges for testing
- Session cookies are set with proper security settings
- The same development user is reused (openId: `dev-user-local`)
