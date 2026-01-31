import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
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
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("commentary.listPublished", () => {
  it("returns array of published commentaries", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.commentary.listPublished();

    expect(Array.isArray(result)).toBe(true);
    // All returned commentaries should be published
    result.forEach((commentary) => {
      expect(commentary.status).toBe("published");
    });
  });
});

describe("commentary.listAll", () => {
  it("requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.commentary.listAll()).rejects.toThrow("Admin access required");
  });

  it("allows admin to list all commentaries", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.commentary.listAll();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("commentary.create", () => {
  it("requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.commentary.create({
        title: "Test Commentary",
        content: "Test content",
        period: "Q1 2025",
        status: "draft",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("allows admin to create commentary", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.commentary.create({
      title: "Test Commentary",
      content: "## Overview\n\nThis is a test commentary with markdown.",
      period: "Q1 2025",
      status: "draft",
    });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("creates published commentary with publishedAt timestamp", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.commentary.create({
      title: "Published Commentary",
      content: "This should be published immediately.",
      period: "Q1 2025",
      status: "published",
    });

    expect(result.id).toBeDefined();

    // Fetch the created commentary to verify publishedAt
    const commentary = await caller.commentary.getById({ id: result.id });
    expect(commentary.status).toBe("published");
    expect(commentary.publishedAt).toBeDefined();
  });
});

describe("commentary.update", () => {
  it("requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.commentary.update({
        id: 1,
        title: "Updated Title",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("allows admin to update commentary", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a commentary
    const created = await caller.commentary.create({
      title: "Original Title",
      content: "Original content",
      period: "Q1 2025",
      status: "draft",
    });

    // Then update it
    const result = await caller.commentary.update({
      id: created.id,
      title: "Updated Title",
      content: "Updated content",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.commentary.getById({ id: created.id });
    expect(updated.title).toBe("Updated Title");
    expect(updated.content).toBe("Updated content");
  });

  it("sets publishedAt when status changes to published", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a draft
    const created = await caller.commentary.create({
      title: "Draft Commentary",
      content: "Draft content",
      period: "Q1 2025",
      status: "draft",
    });

    // Publish it
    await caller.commentary.update({
      id: created.id,
      status: "published",
    });

    // Verify publishedAt is set
    const published = await caller.commentary.getById({ id: created.id });
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeDefined();
  });
});

describe("commentary.delete", () => {
  it("requires admin role", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.commentary.delete({ id: 1 })
    ).rejects.toThrow("Admin access required");
  });

  it("allows admin to delete commentary", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a commentary
    const created = await caller.commentary.create({
      title: "To Be Deleted",
      content: "This will be deleted",
      period: "Q1 2025",
      status: "draft",
    });

    // Delete it
    const result = await caller.commentary.delete({ id: created.id });
    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(
      caller.commentary.getById({ id: created.id })
    ).rejects.toThrow("Commentary not found");
  });
});
