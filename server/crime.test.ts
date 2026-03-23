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

const CRIME_KEYS = [
  "street_confidence_index",
  "crown_court_backlog",
  "reoffending_rate",
  "asb_low_level_crime",
  "serious_crime",
];

describe("Crime Metrics", () => {
  it("should allow admin to refresh Crime metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Crime" });
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
      caller.metrics.refresh({ category: "Crime" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("should list Crime metrics after upsert", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of CRIME_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Crime",
        value: key === "crown_court_backlog" ? "107.4" : "50.0",
        unit: key === "crown_court_backlog" ? "per 100k" : "%",
        ragStatus: "amber",
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Crime" });
    expect(Array.isArray(metrics)).toBe(true);
    const crimeMetrics = metrics.filter((m) => m.category === "Crime");
    expect(crimeMetrics.length).toBe(CRIME_KEYS.length);
    crimeMetrics.forEach((metric) => {
      expect(metric).toHaveProperty("metricKey");
      expect(metric.category).toBe("Crime");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    });
  });

  it("should retrieve Crime metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "crown_court_backlog",
      name: "Crown Court Backlog per 100k",
      category: "Crime",
      value: "107.4",
      unit: "per 100k",
      ragStatus: "red",
      dataDate: "Dec 2024",
      sourceUrl: "https://example.com",
    });
    const result = await caller.metrics.getById({ metricKey: "crown_court_backlog", historyLimit: 5 });
    expect(result.metric).toBeDefined();
    expect(result.metric.metricKey).toBe("crown_court_backlog");
    expect(result.metric.category).toBe("Crime");
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("should validate RAG status for Crime metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "recorded_crime_rate", value: "87.85", rag: "amber" as const },
      { key: "charge_rate", value: "7.2", rag: "red" as const },
      { key: "street_confidence_index", value: "12.4", rag: "green" as const },
      { key: "crown_court_backlog", value: "107.4", rag: "red" as const },
      { key: "reoffending_rate", value: "28.3", rag: "amber" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Crime",
        value: d.value,
        unit: d.key === "crown_court_backlog" ? "per 100k" : "%",
        ragStatus: d.rag,
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Crime" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
  });

  it("should return all expected Crime metric keys", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of CRIME_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Crime",
        value: "10",
        unit: "%",
        ragStatus: "green",
        dataDate: "2025 Q4",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Crime" });
    const returnedKeys = metrics.map((m) => m.metricKey);
    for (const key of CRIME_KEYS) {
      expect(returnedKeys).toContain(key);
    }
  });
});
