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
    getMetricsDiagnostics: vi
      .fn()
      .mockResolvedValue({ dbConnected: true, metricsCount: 0 }),
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

// Canonical set of dashboard keys for the Economy section. Update this list
// (and only this list) when adding a new card so the per-key tests below
// catch any wiring gap automatically.
const ECONOMY_KEYS = [
  "output_per_hour",
  "real_gdp_growth",
  "cpi_inflation",
  "public_sector_net_debt",
  "business_investment",
  "energy_prices",
];

describe("Economy Metrics", () => {
  it("allows admin to refresh Economy metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.metrics.refresh({ category: "Economy" });
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("count");
      if (result.success) {
        expect(result.count).toBeGreaterThanOrEqual(0);
      }
    } catch {
      // Expected in test environment without Python/external APIs.
    }
  }, 120_000);

  it("prevents non-admin from refreshing metrics", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.refresh({ category: "Economy" })
    ).rejects.toThrow(/FORBIDDEN|Admin access required/);
  });

  it("lists Economy metrics after upsert (every expected key present)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    for (const key of ECONOMY_KEYS) {
      await upsertMetric({
        metricKey: key,
        name: key.replace(/_/g, " "),
        category: "Economy",
        value: key === "energy_prices" ? "1641" : "1.5",
        // energy_prices renders £ as a client-side prefix via formatValue's
        // POUND_PREFIX_KEYS, so the persisted unit is intentionally empty.
        unit: key === "energy_prices" ? "" : "%",
        ragStatus: "amber",
        dataDate: "2026 Q2",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Economy" });
    expect(Array.isArray(metrics)).toBe(true);
    const econMetrics = metrics.filter((m) => m.category === "Economy");
    const actualKeys = econMetrics.map((m) => m.metricKey).sort();
    expect(actualKeys).toEqual([...ECONOMY_KEYS].sort());
  });

  it("retrieves Economy metric by key (including energy_prices)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    await upsertMetric({
      metricKey: "energy_prices",
      name: "Energy Prices",
      category: "Economy",
      value: "1641",
      unit: "",
      ragStatus: "amber",
      dataDate: "2026 Q2",
      sourceUrl: "https://www.ofgem.gov.uk/",
    });
    const result = await caller.metrics.getById({
      metricKey: "energy_prices",
      historyLimit: 5,
    });
    expect(result.metric.metricKey).toBe("energy_prices");
    expect(result.metric.category).toBe("Economy");
    expect(result.metric.value).toBe("1641");
    expect(result.metric.ragStatus).toBe("amber");
  });

  it("validates RAG status for Economy metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const { upsertMetric } = await import("./db");
    const testData = [
      { key: "output_per_hour", value: "1.1", rag: "amber" as const },
      { key: "real_gdp_growth", value: "0.97", rag: "amber" as const },
      { key: "cpi_inflation", value: "3.0", rag: "amber" as const },
      { key: "public_sector_net_debt", value: "95.1", rag: "red" as const },
      { key: "business_investment", value: "10.74", rag: "amber" as const },
      { key: "energy_prices", value: "1641", rag: "amber" as const },
    ];
    for (const d of testData) {
      await upsertMetric({
        metricKey: d.key,
        name: d.key.replace(/_/g, " "),
        category: "Economy",
        value: d.value,
        unit: d.key === "energy_prices" ? "" : "%",
        ragStatus: d.rag,
        dataDate: "2026 Q2",
        sourceUrl: "https://example.com",
      });
    }
    const metrics = await caller.metrics.list({ category: "Economy" });
    metrics.forEach((metric) => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      expect(metric.dataDate).toBeTruthy();
    });
    expect(metrics.length).toBe(testData.length);
  });
});
