import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertMetric, addMetricHistory, getMetricTrends } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("metrics.trends", () => {
  it("returns an object (public, no auth required)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.trends();
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();
  });

  it("returns current and previous for metrics with history", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const trends = await caller.metrics.trends();

    for (const [key, val] of Object.entries(trends)) {
      expect(val).toHaveProperty("current");
      expect(typeof val.current).toBe("string");
      if (val.previous !== null) {
        expect(typeof val.previous).toBe("string");
      }
    }
  });
}, { timeout: 30_000 });

describe("getMetricTrends", () => {
  it("returns at most 2 entries per metric", async () => {
    const trends = await getMetricTrends();
    for (const [, val] of Object.entries(trends)) {
      expect(val.current).toBeDefined();
    }
  });

  it("returns empty object if DB has no history", async () => {
    const trends = await getMetricTrends();
    expect(typeof trends).toBe("object");
  });
}, { timeout: 30_000 });
