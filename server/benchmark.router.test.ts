import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { BenchmarkSnapshot } from "./g20Benchmark";

const mockSnapshot: BenchmarkSnapshot = {
  refreshedAt: "2026-09-19T12:00:00.000Z",
  peerSet: "G20 economies + EU (World Bank + IMF WEO)",
  methodology: "test methodology",
  composite: {
    avgPercentileFromBest: 55,
    ragStatus: "red",
    scoredMeasures: 2,
    green: 0,
    amber: 1,
    red: 1,
    unknown: 0,
  },
  categories: [
    { category: "Economy", measureCount: 2, avgPercentileFromBest: 55, ragStatus: "red" },
  ],
  insights: [{ severity: "warn", text: "Weakest G20 relative position: CPI." }],
  measures: [],
  gaps: [],
};

vi.mock("./g20Benchmark", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./g20Benchmark")>();
  return {
    ...actual,
    getOrRefreshBenchmark: vi.fn(),
  };
});

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({}),
  };
});

import { getOrRefreshBenchmark } from "./g20Benchmark";

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

function createAnonContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    },
  };
}

describe("benchmark tRPC routes", () => {
  beforeEach(() => {
    vi.mocked(getOrRefreshBenchmark).mockReset();
    vi.mocked(getOrRefreshBenchmark).mockResolvedValue(mockSnapshot);
  });

  it("allows public read of cached/refreshed snapshot", async () => {
    const caller = appRouter.createCaller(createAnonContext().ctx);
    const result = await caller.benchmark.get();
    expect(result.composite.ragStatus).toBe("red");
    expect(getOrRefreshBenchmark).toHaveBeenCalledWith(false);
  });

  it("requires admin for refresh", async () => {
    const anon = appRouter.createCaller(createAnonContext().ctx);
    await expect(anon.benchmark.refresh()).rejects.toThrow();
  });

  it("admin refresh forces rebuild", async () => {
    const admin = appRouter.createCaller(createAdminContext().ctx);
    const result = await admin.benchmark.refresh();
    expect(result.peerSet).toContain("G20");
    expect(getOrRefreshBenchmark).toHaveBeenCalledWith(true);
  });
});
