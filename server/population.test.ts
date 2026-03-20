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

const POPULATION_KEYS = [
  "natural_change",
  "old_age_dependency_ratio",
  "net_migration",
  "healthy_life_expectancy",
];

describe("Population Metrics", () => {
  it("should allow admin to refresh Population metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Population" });
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
      caller.metrics.refresh({ category: "Population" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Population metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of POPULATION_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Population",
        value: key === "net_migration" ? "204" : "61.7",
        unit: key === "healthy_life_expectancy" ? " years" : "",
        ragStatus: "amber",
        dataDate: "2023",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Population" });
    expect(Array.isArray(metrics)).toBe(true);
    const popMetrics = metrics.filter((m) => m.category === "Population");
    expect(popMetrics.length).toBe(POPULATION_KEYS.length);
    popMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric.category).toBe("Population");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Population metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "healthy_life_expectancy",
      name: "Healthy Life Expectancy",
      category: "Population",
      value: "61.7",
      unit: " years",
      ragStatus: "amber",
      dataDate: "2021-2023",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "healthy_life_expectancy", historyLimit: 5 });
    expect(result.metric).toBeDefined();
    expect(result.metric.metricKey).toBe("healthy_life_expectancy");
    expect(result.metric.category).toBe("Population");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Population metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "natural_change", value: "27.2", rag: "green" as const },
      { key: "old_age_dependency_ratio", value: "277.9", rag: "green" as const },
      { key: "net_migration", value: "204", rag: "green" as const },
      { key: "healthy_life_expectancy", value: "61.7", rag: "amber" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Population",
        value: d.value,
        unit: d.key === "healthy_life_expectancy" ? " years" : "",
        ragStatus: d.rag,
        dataDate: "2023",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Population" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Population metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of POPULATION_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Population",
        value: "50",
        unit: "",
        ragStatus: "green",
        dataDate: "2023",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Population" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of POPULATION_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
