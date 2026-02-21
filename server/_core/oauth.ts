import { COOKIE_NAME, DEFAULT_DEV_USER, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const ADMIN_OPENID = "admin-uk-rag-online";
// Admin credentials must be set via ADMIN_EMAIL and ADMIN_PASSWORD env vars (no defaults in code).

const ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 3;
const adminLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

function isAdminLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = adminLoginAttempts.get(ip);
  if (!entry) return false;
  if (now >= entry.resetAt) {
    adminLoginAttempts.delete(ip);
    return false;
  }
  return entry.count >= ADMIN_LOGIN_MAX_ATTEMPTS;
}

function recordAdminLoginAttempt(ip: string, success: boolean): void {
  const now = Date.now();
  if (success) {
    adminLoginAttempts.delete(ip);
    return;
  }
  const entry = adminLoginAttempts.get(ip);
  if (!entry) {
    adminLoginAttempts.set(ip, {
      count: 1,
      resetAt: now + ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS,
    });
  } else {
    entry.count += 1;
  }
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Admin login: only the single configured admin email/password can log in; no other accounts. Rate-limited.
  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isAdminLoginRateLimited(clientIp)) {
      res.status(429).json({ error: "Too many login attempts. Try again later." });
      return;
    }
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminEmail?.trim() || !adminPassword) {
        console.warn("[Auth] Admin login disabled: ADMIN_EMAIL and ADMIN_PASSWORD must be set");
        recordAdminLoginAttempt(clientIp, false);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }
      // Reject any email that is not the configured admin email (case-sensitive)
      if (email !== adminEmail.trim()) {
        recordAdminLoginAttempt(clientIp, false);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      if (password !== adminPassword.trim()) {
        recordAdminLoginAttempt(clientIp, false);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      recordAdminLoginAttempt(clientIp, true);
      const emailForDb = adminEmail.trim();
      await db.upsertUser({
        openId: ADMIN_OPENID,
        name: "Admin",
        email: emailForDb,
        loginMethod: "admin-login",
        lastSignedIn: new Date(),
        role: "admin",
      });
      const sessionToken = await sdk.createSessionToken(ADMIN_OPENID, {
        name: "Admin",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Auth] Admin login successful");
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Auth] Admin login failed", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  // Development login endpoint - creates a session when OAuth is not configured. Disabled in production so only admin-login (ADMIN_EMAIL/ADMIN_PASSWORD from .env) can sign in.
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).send("Not found");
      return;
    }
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
