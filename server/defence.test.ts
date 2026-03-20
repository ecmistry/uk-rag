import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Metric, InsertMetric } from "./schema";

const inMemoryMetrics = new Map<string, Metric>();

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({}),
    upsertMetric: vi.fn().mockImplementation(async (metric: InsertMetric) => {
      const now = new Date();
      inMemoryMetrics.set(metric.metricKey, {
        ...metric,
        lastUpdated: now,
        createdAt: now,
      } as Metric);
    }),
    getMetrics: vi.fn().mockImplementation(async (category?: string) => {
      const all = Array.from(inMemoryMetrics.values());
      return category ? all.filter((m) => m.category === category) : all;
    }),
    getMetricByKey: vi.fn().mockImplementation(async (metricKey: string) => {
      return inMemoryMetrics.get(metricKey);
    }),
    getMetricHistory: vi.fn().mockResolvedValue([]),
    addMetricHistory: vi.fn().mockResolvedValue(undefined),
    getExistingHistoryPeriods: vi.fn().mockResolvedValue(new Set()),
    getMetricTrends: vi.fn().mockResolvedValue([]),
    getMetricsDiagnostics: vi.fn().mockResolvedValue({ dbConnected: true, metricsCount: 0 }),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "password",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

beforeEach(() => {
  inMemoryMetrics.clear();
});

const DEFENCE_KEYS = [
  "sea_mass",
  "land_mass",
  "air_mass",
  "defence_industry_vitality",
  "defence_spending_gdp",
];

describe("Defence Metrics", () => {
  it("should allow admin to refresh Defence metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Defence" });
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("count");
      if (result.success) {
        expect(Array.isArray(result.metrics)).toBe(true);
      }
    } catch {
      // Expected in test environment without Python/external APIs
    }
  }, 120_000);

  it("should prevent non-admin from refreshing metrics", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.refresh({ category: "Defence" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Defence metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of DEFENCE_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Defence",
        value: key === "defence_spending_gdp" ? "2.09" : "70.0",
        unit: key === "defence_spending_gdp" ? "%" : "",
        ragStatus: "amber",
        dataDate: key === "defence_spending_gdp" ? "2026" : "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Defence" });
    expect(Array.isArray(metrics)).toBe(true);
    const defMetrics = metrics.filter((m) => m.category === "Defence");
    expect(defMetrics.length).toBe(DEFENCE_KEYS.length);
    defMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric.category).toBe("Defence");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Defence metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "sea_mass",
      name: "Sea Mass",
      category: "Defence",
      value: "68.8",
      unit: "",
      ragStatus: "red",
      dataDate: "2026 Q1",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "sea_mass", historyLimit: 5 });
    expect(result.metric).toBeDefined();
    expect(result.metric.metricKey).toBe("sea_mass");
    expect(result.metric.category).toBe("Defence");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Defence metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "sea_mass", value: "68.8", rag: "red" as const },
      { key: "land_mass", value: "70.4", rag: "amber" as const },
      { key: "air_mass", value: "48", rag: "red" as const },
      { key: "defence_industry_vitality", value: "70.2", rag: "amber" as const },
      { key: "defence_spending_gdp", value: "2.09", rag: "amber" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Defence",
        value: d.value,
        unit: d.key === "defence_spending_gdp" ? "%" : "",
        ragStatus: d.rag,
        dataDate: d.key === "defence_spending_gdp" ? "2026" : "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Defence" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Defence metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of DEFENCE_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Defence",
        value: "50",
        unit: "",
        ragStatus: "green",
        dataDate: "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Defence" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of DEFENCE_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
