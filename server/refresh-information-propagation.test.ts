/**
 * Regression tests for the `information` field propagating end-to-end
 * through the tRPC refresh path.
 *
 * Why this exists: there was a latent bug in the cron upsert path where the
 * `information` blurb was silently dropped on subsequent refreshes (only
 * carried on the initial insert). The Sea Mass tile then showed "17 escorts"
 * narrative even after the value was updated to reflect 16. These tests
 * pin the propagation behaviour at the tRPC layer so the same class of bug
 * cannot regress.
 *
 * Surface covered:
 *   - `metrics.refresh` for a category that uses model-based metrics
 *     (Defence: sea_mass, land_mass, air_mass) whose fetcher returns a
 *     rich `information` blurb.
 *   - First refresh inserts the citation onto metricHistory.
 *   - Second refresh with updated citation OVERWRITES the previous one
 *     (the bug was that it preserved stale text).
 *   - When a fetcher returns information=null/undefined, the field is
 *     not touched on existing rows.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { Metric, MetricHistory, InsertMetricHistory } from "./schema";
import type { MetricData } from "./dataIngestion";

// ─── In-memory Mongo stand-ins ─────────────────────────────────────────────

const inMemoryMetrics = new Map<string, Metric>();
const inMemoryHistory = new Map<string, MetricHistory>();
const historyKey = (key: string, dataDate: string) => `${key}|${dataDate}`;

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({}),
    upsertMetric: vi.fn().mockImplementation(async (metric) => {
      const now = new Date();
      inMemoryMetrics.set(metric.metricKey, {
        ...metric,
        lastUpdated: now,
        createdAt: now,
      } as Metric);
    }),
    addMetricHistory: vi
      .fn()
      .mockImplementation(async (h: InsertMetricHistory) => {
        const k = historyKey(h.metricKey, h.dataDate);
        const existing = inMemoryHistory.get(k);
        // Mirror addMetricHistory's $set semantics: only update `information`
        // if explicitly provided (matches db.ts).
        const next: MetricHistory = {
          ...(existing ?? ({} as MetricHistory)),
          metricKey: h.metricKey,
          value: h.value,
          ragStatus: h.ragStatus,
          dataDate: h.dataDate,
          recordedAt: h.recordedAt ?? new Date(),
          ...(h.information != null ? { information: h.information } : {}),
        } as MetricHistory;
        inMemoryHistory.set(k, next);
      }),
    getMetrics: vi
      .fn()
      .mockImplementation(async (category?: string) => {
        const all = Array.from(inMemoryMetrics.values());
        return category ? all.filter((m) => m.category === category) : all;
      }),
    getMetricByKey: vi
      .fn()
      .mockImplementation(async (metricKey: string) =>
        inMemoryMetrics.get(metricKey),
      ),
    getMetricHistory: vi.fn().mockImplementation(async (metricKey: string) => {
      return Array.from(inMemoryHistory.values()).filter(
        (h) => h.metricKey === metricKey,
      );
    }),
    getExistingHistoryPeriods: vi
      .fn()
      .mockImplementation(async (pairs: Array<{ metricKey: string; dataDate: string }>) => {
        const set = new Set<string>();
        for (const p of pairs) {
          if (inMemoryHistory.has(historyKey(p.metricKey, p.dataDate))) {
            set.add(`${p.metricKey}|${p.dataDate}`);
          }
        }
        return set;
      }),
    getMetricTrends: vi.fn().mockResolvedValue([]),
    getMetricsDiagnostics: vi
      .fn()
      .mockResolvedValue({ dbConnected: true, metricsCount: 0 }),
  };
});

// ─── Patched Defence fetcher so we control what's emitted per refresh ──────

let mockDefencePayload: MetricData[] = [];

vi.mock("./dataIngestion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./dataIngestion")>();
  return {
    ...actual,
    fetchDefenceMetrics: vi.fn().mockImplementation(async () => ({
      success: true,
      data: mockDefencePayload,
    })),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function adminCtx(): TrpcContext {
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
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function seaMassPayload(value: number, information: string | undefined): MetricData[] {
  return [
    {
      metric_name: "Sea Mass",
      metric_key: "sea_mass",
      category: "Defence",
      value,
      time_period: "2026 Q2",
      rag_status: "red",
      data_source: "test",
      source_url: "https://example.test/seamass",
      last_updated: new Date().toISOString(),
      unit: "%",
      ...(information !== undefined ? { information } : {}),
    },
  ];
}

beforeEach(() => {
  inMemoryMetrics.clear();
  inMemoryHistory.clear();
  mockDefencePayload = [];
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("Refresh: information-field propagation", () => {
  it("persists the information blurb onto metricHistory on first refresh", async () => {
    mockDefencePayload = seaMassPayload(64.6, "First citation");
    const caller = appRouter.createCaller(adminCtx());

    await caller.metrics.refresh({ category: "Defence" });

    const h = inMemoryHistory.get(historyKey("sea_mass", "2026 Q2"));
    expect(h, "history row should exist after refresh").toBeDefined();
    expect(h?.information).toBe("First citation");
  });

  it("OVERWRITES the existing information when a subsequent refresh provides a different blurb", async () => {
    mockDefencePayload = seaMassPayload(64.6, "First citation");
    const caller = appRouter.createCaller(adminCtx());
    await caller.metrics.refresh({ category: "Defence" });

    // Simulate a follow-up refresh: same period, updated narrative.
    mockDefencePayload = seaMassPayload(67.9, "UPDATED citation with HMS Iron Duke");
    await caller.metrics.refresh({ category: "Defence" });

    const h = inMemoryHistory.get(historyKey("sea_mass", "2026 Q2"));
    expect(h?.information).toBe("UPDATED citation with HMS Iron Duke");
    expect(h?.information).not.toContain("First citation");
  });

  it("preserves existing information when a subsequent refresh omits the field", async () => {
    mockDefencePayload = seaMassPayload(64.6, "Preserved citation");
    const caller = appRouter.createCaller(adminCtx());
    await caller.metrics.refresh({ category: "Defence" });

    // Simulate a refresh where the fetcher returned the metric but did NOT
    // emit an information field (e.g. an upstream content source is down).
    mockDefencePayload = seaMassPayload(67.9, undefined);
    await caller.metrics.refresh({ category: "Defence" });

    const h = inMemoryHistory.get(historyKey("sea_mass", "2026 Q2"));
    expect(h?.information).toBe("Preserved citation");
  });

  it("does not silently drop information when refresh runs twice in quick succession (regression for cron bug)", async () => {
    // The original cron bug only manifested on the SECOND pass — first
    // insert worked, second pass dropped information. Replay that exact
    // ordering: same period, same value, fresh information each call.
    const caller = appRouter.createCaller(adminCtx());

    mockDefencePayload = seaMassPayload(64.6, "narrative A");
    await caller.metrics.refresh({ category: "Defence" });
    mockDefencePayload = seaMassPayload(64.6, "narrative B");
    await caller.metrics.refresh({ category: "Defence" });

    const h = inMemoryHistory.get(historyKey("sea_mass", "2026 Q2"));
    expect(h?.information, "second refresh must reflect the new narrative")
      .toBe("narrative B");
  });

  it("propagates information to a brand-new period (insert path)", async () => {
    // Different dataDate -> separate history row. Confirms the conditional
    // information spread doesn't only work on update, but also insert.
    mockDefencePayload = [
      {
        metric_name: "Sea Mass",
        metric_key: "sea_mass",
        category: "Defence",
        value: 64.6,
        time_period: "2026 Q3",
        rag_status: "red",
        data_source: "test",
        source_url: "https://example.test/seamass",
        last_updated: new Date().toISOString(),
        unit: "%",
        information: "Q3 narrative",
      },
    ];
    const caller = appRouter.createCaller(adminCtx());
    await caller.metrics.refresh({ category: "Defence" });

    const h = inMemoryHistory.get(historyKey("sea_mass", "2026 Q3"));
    expect(h?.information).toBe("Q3 narrative");
  });
});
