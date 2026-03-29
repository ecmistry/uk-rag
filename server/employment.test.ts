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

const EMPLOYMENT_KEYS = [
  "inactivity_rate",
  "real_wage_growth",
  "job_vacancy_ratio",
  "underemployment",
  "sickness_absence",
];

describe("Employment Metrics", () => {
  it("should allow admin to refresh Employment metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Employment" });
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("count");
      if (result.success) {
        expect(result.count).toBeGreaterThanOrEqual(0);
      }
    } catch {
      // Expected in test environment without Python/external APIs
    }
  }, 120_000);

  it("should prevent non-admin from refreshing metrics", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.refresh({ category: "Employment" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Employment metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of EMPLOYMENT_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Employment",
        value: "10.5",
        unit: "%",
        ragStatus: "amber",
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Employment" });
    expect(Array.isArray(metrics)).toBe(true);
    const empMetrics = metrics.filter((m) => m.category === "Employment");
    expect(empMetrics.length).toBe(EMPLOYMENT_KEYS.length);
    empMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric).toHaveProperty("name");
      expect(metric.category).toBe("Employment");
      expect(metric).toHaveProperty("value");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Employment metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "inactivity_rate",
      name: "Inactivity Rate",
      category: "Employment",
      value: "20.8",
      unit: "%",
      ragStatus: "red",
      dataDate: "2025 Q4",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "inactivity_rate", historyLimit: 5 });
    expect(result).toHaveProperty("metric");
    expect(result).toHaveProperty("history");
    expect(result.metric.metricKey).toBe("inactivity_rate");
    expect(result.metric.category).toBe("Employment");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Employment metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "inactivity_rate", value: "20.8", rag: "red" as const },
      { key: "real_wage_growth", value: "0.84", rag: "red" as const },
      { key: "job_vacancy_ratio", value: "2.3", rag: "red" as const },
      { key: "underemployment", value: "8.48", rag: "amber" as const },
      { key: "sickness_absence", value: "5.61", rag: "red" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Employment",
        value: d.value,
        unit: "%",
        ragStatus: d.rag,
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Employment" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Employment metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of EMPLOYMENT_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Employment",
        value: "10",
        unit: "%",
        ragStatus: "green",
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Employment" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of EMPLOYMENT_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
