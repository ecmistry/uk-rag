import { describe, expect, it, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({}),
    getUserByOpenId: vi.fn().mockImplementation(async (openId: string) => {
      if (openId === "admin-uk-rag-online") {
        return {
          id: 1,
          openId: "admin-uk-rag-online",
          name: "Admin",
          email: "admin@test.com",
          role: "admin",
          loginMethod: "admin-login",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        };
      }
      return null;
    }),
    upsertUser: vi.fn().mockResolvedValue(undefined),
  };
});

const { sdk } = await import("./_core/sdk");

const TEST_SECRET = "test-secret-at-least-16-chars-long";

describe("auth.session", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    vi.clearAllMocks();
  });

  describe("createSessionToken", () => {
    it("produces a valid JWT string", async () => {
      const token = await sdk.createSessionToken("test-user", { name: "Test" });
      expect(token).toBeTruthy();
      expect(token.split(".")).toHaveLength(3);
    });

    it("includes openId and name in payload", async () => {
      const token = await sdk.createSessionToken("user-123", { name: "Alice" });
      const result = await sdk.verifySession(token);
      expect(result).not.toBeNull();
      expect(result!.openId).toBe("user-123");
      expect(result!.name).toBe("Alice");
    });

    it("defaults appId to dev-app when APP_ID is unset", async () => {
      delete process.env.VITE_APP_ID;
      delete process.env.APP_ID;
      const token = await sdk.createSessionToken("user-456", { name: "Bob" });
      const result = await sdk.verifySession(token);
      expect(result!.appId).toBe("dev-app");
    });
  });

  describe("verifySession", () => {
    it("returns null for undefined cookie", async () => {
      const result = await sdk.verifySession(undefined);
      expect(result).toBeNull();
    });

    it("returns null for null cookie", async () => {
      const result = await sdk.verifySession(null);
      expect(result).toBeNull();
    });

    it("returns null for empty string", async () => {
      const result = await sdk.verifySession("");
      expect(result).toBeNull();
    });

    it("returns null for tampered token", async () => {
      const token = await sdk.createSessionToken("user-x", { name: "X" });
      const tampered = token.slice(0, -5) + "XXXXX";
      const result = await sdk.verifySession(tampered);
      expect(result).toBeNull();
    });

    it("returns null for token signed with wrong secret", async () => {
      const wrongSecret = new TextEncoder().encode("wrong-secret-1234567890");
      const fakeToken = await new SignJWT({ openId: "hacker", appId: "app", name: "Hacker" })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
        .sign(wrongSecret);

      const result = await sdk.verifySession(fakeToken);
      expect(result).toBeNull();
    });

    it("returns null for expired token", async () => {
      const token = await sdk.createSessionToken("user-exp", {
        name: "Expired",
        expiresInMs: -1000,
      });
      const result = await sdk.verifySession(token);
      expect(result).toBeNull();
    });

    it("accepts a valid token and returns session payload", async () => {
      const token = await sdk.createSessionToken("valid-user", { name: "Valid" });
      const result = await sdk.verifySession(token);
      expect(result).toEqual({
        openId: "valid-user",
        appId: expect.any(String),
        name: "Valid",
      });
    });
  });

  describe("authenticateRequest", () => {
    it("throws for request with no cookies", async () => {
      const req = { headers: {} } as any;
      await expect(sdk.authenticateRequest(req)).rejects.toThrow();
    });

    it("throws for request with invalid session cookie", async () => {
      const req = { headers: { cookie: "app_session_id=garbage" } } as any;
      await expect(sdk.authenticateRequest(req)).rejects.toThrow();
    });

    it("throws when user not found in DB", async () => {
      const token = await sdk.createSessionToken("nonexistent-user", { name: "Ghost" });
      const req = { headers: { cookie: `app_session_id=${token}` } } as any;
      await expect(sdk.authenticateRequest(req)).rejects.toThrow();
    });

    it("returns user for valid session with existing DB user", async () => {
      const token = await sdk.createSessionToken("admin-uk-rag-online", { name: "Admin" });
      const req = { headers: { cookie: `app_session_id=${token}` } } as any;
      const user = await sdk.authenticateRequest(req);
      expect(user.openId).toBe("admin-uk-rag-online");
      expect(user.role).toBe("admin");
    });
  });
});
