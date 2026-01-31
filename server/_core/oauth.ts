import { COOKIE_NAME, DEFAULT_DEV_USER, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Development login endpoint - creates a session when OAuth is not configured
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    try {
      // Check if OAuth is configured
      const oauthServerUrl = process.env.OAUTH_SERVER_URL;
      if (oauthServerUrl) {
        // OAuth is configured, redirect to proper OAuth flow
        res.redirect(302, "/");
        return;
      }

      // Create a development user session
      // Use a consistent dev user ID so the same user is reused
      const devOpenId = "dev-user-local";
      await db.upsertUser({
        openId: devOpenId,
        name: DEFAULT_DEV_USER.name,
        email: DEFAULT_DEV_USER.email,
        loginMethod: "dev",
        lastSignedIn: new Date(),
        role: "admin", // Give dev user admin access
      });

      const sessionToken = await sdk.createSessionToken(devOpenId, {
        name: DEFAULT_DEV_USER.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Auth] Development login successful - OAuth not configured");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Development login failed", error);
      res.status(500).json({ error: "Development login failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
