export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Track if we've already logged the OAuth warning to avoid spam
let oauthWarningLogged = false;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // If OAuth is not configured, return empty string to avoid Invalid URL error
  if (!oauthPortalUrl || !appId) {
    // Only log the warning once to avoid console spam
    if (!oauthWarningLogged) {
      console.debug("[Auth] OAuth not configured: VITE_OAUTH_PORTAL_URL or VITE_APP_ID missing. Authentication features will be disabled.");
      oauthWarningLogged = true;
    }
    // Return a special endpoint that creates a dev session when OAuth is not configured
    return "/api/auth/dev-login";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("[Auth] Failed to construct login URL:", error);
    return "/api/auth/dev-login";
  }
};
