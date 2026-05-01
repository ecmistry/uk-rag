import { COOKIE_NAME, DEFAULT_DEV_USER, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const ADMIN_OPENID = "admin-uk-rag-online";

const ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 3;
const adminLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function getClientIp(req: Request): string {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
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

export function registerAuthRoutes(app: Express) {
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
      if (!safeEqual(email, adminEmail.trim()) || !safeEqual(password, adminPassword.trim())) {
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

  // Development-only login — disabled in production. Only admin-login works in prod.
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).send("Not found");
      return;
    }
    try {
      const devOpenId = "dev-user-local";
      await db.upsertUser({
        openId: devOpenId,
        name: DEFAULT_DEV_USER.name,
        email: DEFAULT_DEV_USER.email,
        loginMethod: "dev",
        lastSignedIn: new Date(),
        role: "admin",
      });

      const sessionToken = await sdk.createSessionToken(devOpenId, {
        name: DEFAULT_DEV_USER.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Auth] Development login successful");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Development login failed", error);
      res.status(500).json({ error: "Development login failed" });
    }
  });

}
