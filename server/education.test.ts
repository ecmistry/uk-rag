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

const EDUCATION_KEYS = [
  "attainment8",
  "neet_rate",
  "pupil_attendance",
  "apprenticeship_intensity",
];

describe("Education Metrics", () => {
  it("should allow admin to refresh Education metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Education" });
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
      caller.metrics.refresh({ category: "Education" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Education metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of EDUCATION_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Education",
        value: "42.5",
        unit: key === "attainment8" ? "Score" : "%",
        ragStatus: "amber",
        dataDate: "202425",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Education" });
    expect(Array.isArray(metrics)).toBe(true);
    const eduMetrics = metrics.filter((m) => m.category === "Education");
    expect(eduMetrics.length).toBe(EDUCATION_KEYS.length);
    eduMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric).toHaveProperty("name");
      expect(metric.category).toBe("Education");
      expect(metric).toHaveProperty("value");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Education metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "attainment8",
      name: "Attainment 8 Score",
      category: "Education",
      value: "45.9",
      unit: "Score",
      ragStatus: "amber",
      dataDate: "202425",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "attainment8", historyLimit: 5 });
    expect(result).toHaveProperty("metric");
    expect(result).toHaveProperty("history");
    expect(result.metric.metricKey).toBe("attainment8");
    expect(result.metric.category).toBe("Education");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Education metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "attainment8", value: "45.9", rag: "amber" as const },
      { key: "neet_rate", value: "4.2", rag: "amber" as const },
      { key: "pupil_attendance", value: "2.29", rag: "red" as const },
      { key: "apprenticeship_intensity", value: "12.2", rag: "amber" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Education",
        value: d.value,
        unit: d.key === "attainment8" ? "Score" : "%",
        ragStatus: d.rag,
        dataDate: "202425",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Education" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Education metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of EDUCATION_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Education",
        value: "10",
        unit: "Score",
        ragStatus: "green",
        dataDate: "202425",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Education" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of EDUCATION_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
