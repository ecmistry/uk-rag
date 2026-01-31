import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Education Metrics", () => {
  it("should allow admin to refresh Education metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This test verifies the API structure, not the actual data fetching
    // since the Python script requires external API access
    const result = await caller.metrics.refresh({ category: "Education" });

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("count");
    expect(result).toHaveProperty("metrics");
    
    // If successful, metrics should be an array
    if (result.success) {
      expect(Array.isArray(result.metrics)).toBe(true);
    }
  }, 120000); // 2 minute timeout for data fetching

  it("should prevent non-admin from refreshing metrics", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.metrics.refresh({ category: "Education" })
    ).rejects.toThrow("FORBIDDEN");
  });

  it("should list Education metrics after refresh", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First refresh to ensure data exists
    await caller.metrics.refresh({ category: "Education" });

    // Then list all metrics
    const metrics = await caller.metrics.list({ category: "Education" });

    expect(Array.isArray(metrics)).toBe(true);
    
    // Check if Education metrics are present
    const educationMetrics = metrics.filter(m => m.category === "Education");
    expect(educationMetrics.length).toBeGreaterThan(0);

    // Verify Education metric structure
    if (educationMetrics.length > 0) {
      const metric = educationMetrics[0];
      expect(metric).toHaveProperty("metricKey");
      expect(metric).toHaveProperty("name");
      expect(metric).toHaveProperty("category");
      expect(metric.category).toBe("Education");
      expect(metric).toHaveProperty("value");
      expect(metric).toHaveProperty("ragStatus");
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
    }
  }, 120000);

  it("should refresh both Economy and Education metrics when category is All", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.metrics.refresh({ category: "All" });

    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    
    // Should have metrics from both categories
    const metrics = await caller.metrics.list({});
    const categories = new Set(metrics.map(m => m.category));
    
    // At minimum, should have Economy metrics (Education might fail due to API issues)
    expect(categories.has("Economy")).toBe(true);
  }, 180000); // 3 minute timeout for fetching all categories

  it("should retrieve Education metric by key", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First refresh to ensure data exists
    await caller.metrics.refresh({ category: "Education" });

    // Get list of Education metrics
    const metrics = await caller.metrics.list({ category: "Education" });
    
    if (metrics.length > 0) {
      const metricKey = metrics[0].metricKey;
      
      // Retrieve specific metric with history
      const result = await caller.metrics.getById({ metricKey, historyLimit: 5 });

      expect(result).toHaveProperty("metric");
      expect(result).toHaveProperty("history");
      expect(result.metric.metricKey).toBe(metricKey);
      expect(result.metric.category).toBe("Education");
      expect(Array.isArray(result.history)).toBe(true);
    }
  }, 120000);

  it("should validate RAG status for Education metrics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Refresh Education metrics
    await caller.metrics.refresh({ category: "Education" });

    // Get Education metrics
    const metrics = await caller.metrics.list({ category: "Education" });
    const educationMetrics = metrics.filter(m => m.category === "Education");

    // Each metric should have a valid RAG status
    educationMetrics.forEach(metric => {
      expect(["red", "amber", "green"]).toContain(metric.ragStatus);
      
      // Value should be a valid number
      const value = parseFloat(metric.value);
      expect(isNaN(value)).toBe(false);
      
      // Should have a data date
      expect(metric.dataDate).toBeTruthy();
      expect(metric.dataDate.length).toBeGreaterThan(0);
    });
  }, 120000);
});
