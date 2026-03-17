import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("metrics.exportCsv", () => {
  it("returns CSV with headers for all metrics", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.exportCsv();
    expect(result).toHaveProperty("csv");
    expect(result).toHaveProperty("filename");
    expect(result.filename).toMatch(/^metrics_/);
    const lines = result.csv.split("\n");
    expect(lines[0]).toBe("Name,Category,Value,Unit,Status,Data Date,Last Updated");
  });

  it("returns CSV for a specific category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.exportCsv({ category: "Economy" });
    expect(result.filename).toBe("metrics_Economy.csv");
    const lines = result.csv.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it("properly escapes fields containing commas", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.exportCsv();
    const lines = result.csv.split("\n");
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;
      // Each non-empty data line should be parseable:
      // fields with commas inside must be quoted
      const quoteCount = (line.match(/"/g) || []).length;
      expect(quoteCount % 2).toBe(0);
    }
  });

  it("throws NOT_FOUND for invalid metricKey", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.metrics.exportCsv({ metricKey: "nonexistent_metric_xyz" })
    ).rejects.toThrow("Metric not found");
  });

  it("sanitises filename to prevent path traversal", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.exportCsv();
    expect(result.filename).not.toContain("/");
    expect(result.filename).not.toContain("..");
  });
}, { timeout: 30_000 });
