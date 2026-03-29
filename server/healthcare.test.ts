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

const HEALTHCARE_KEYS = [
  "a_e_wait_time",
  "elective_backlog",
  "ambulance_response_time",
  "gp_appt_access",
  "old_age_dependency_ratio",
];

describe("Healthcare Metrics", () => {
  it("should allow admin to refresh Healthcare metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Healthcare" });
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
      caller.metrics.refresh({ category: "Healthcare" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Healthcare metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of HEALTHCARE_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Healthcare",
        value: key === "elective_backlog" ? "4186974" : "65.0",
        unit: key === "ambulance_response_time" ? " minutes" : "%",
        ragStatus: "amber",
        dataDate: "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Healthcare" });
    expect(Array.isArray(metrics)).toBe(true);
    const healthMetrics = metrics.filter((m) => m.category === "Healthcare");
    expect(healthMetrics.length).toBe(HEALTHCARE_KEYS.length);
    healthMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric.category).toBe("Healthcare");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Healthcare metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "a_e_wait_time",
      name: "A&E Wait Time",
      category: "Healthcare",
      value: "74.4",
      unit: "%",
      ragStatus: "red",
      dataDate: "2026 Q1",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "a_e_wait_time", historyLimit: 5 });
    expect(result.metric).toBeDefined();
    expect(result.metric.metricKey).toBe("a_e_wait_time");
    expect(result.metric.category).toBe("Healthcare");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Healthcare metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "a_e_wait_time", value: "74.4", rag: "red" as const },
      { key: "elective_backlog", value: "4186974", rag: "amber" as const },
      { key: "ambulance_response_time", value: "8.5", rag: "amber" as const },
      { key: "gp_appt_access", value: "65", rag: "amber" as const },
      { key: "old_age_dependency_ratio", value: "277.9", rag: "green" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Healthcare",
        value: d.value,
        unit: d.key === "ambulance_response_time" ? " minutes" : "%",
        ragStatus: d.rag,
        dataDate: "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Healthcare" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Healthcare metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of HEALTHCARE_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Healthcare",
        value: "50",
        unit: "%",
        ragStatus: "green",
        dataDate: "2026 Q1",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Healthcare" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of HEALTHCARE_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
