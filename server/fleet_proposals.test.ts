import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";
import type {
  FleetChangeProposal,
  FleetInventoryItem,
  ProposalStatus,
} from "./schema";

// ──────────────────────────────────────────────────────────────────────────
// In-memory stand-ins for the two Mongo collections the router touches.
// ──────────────────────────────────────────────────────────────────────────

const inventory = new Map<string, FleetInventoryItem>();
const proposals = new Map<string, FleetChangeProposal>();
const fetchDefenceCallCount = { n: 0 };

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({}),
    upsertMetric: vi.fn().mockResolvedValue(undefined),
    addMetricHistory: vi.fn().mockResolvedValue(undefined),

    listFleetProposals: vi
      .fn()
      .mockImplementation(
        async (args?: { status?: ProposalStatus; limit?: number }) => {
          const list = [...proposals.values()];
          const filtered = args?.status
            ? list.filter((p) => p.status === args.status)
            : list;
          return filtered.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
        },
      ),

    getFleetProposalCounts: vi.fn().mockImplementation(async () => {
      const counts = {
        pending_review: 0,
        approved: 0,
        rejected: 0,
        auto_rejected: 0,
      };
      for (const p of proposals.values()) counts[p.status]++;
      return counts;
    }),

    approveFleetProposal: vi
      .fn()
      .mockImplementation(
        async (args: {
          proposalId: string;
          reviewerEmail: string;
          notes?: string;
        }) => {
          const p = proposals.get(args.proposalId);
          if (!p) return { ok: false, error: "Proposal not found" };
          if (p.status !== "pending_review")
            return { ok: false, error: `Proposal already ${p.status}` };
          const item = inventory.get(p.itemId);
          if (!item)
            return {
              ok: false,
              error: `Inventory item ${p.itemId} not found — cannot apply approval`,
            };
          // Flip inventory.
          item.status = p.proposedStatus;
          item.statusChangedAt = new Date();
          item.statusSourceUrl = p.articleUrl;
          // Mark proposal approved with audit fields.
          p.status = "approved";
          p.reviewedAt = new Date();
          p.reviewerEmail = args.reviewerEmail;
          if (args.notes) p.reviewNotes = args.notes;
          return { ok: true, proposal: p };
        },
      ),

    rejectFleetProposal: vi
      .fn()
      .mockImplementation(
        async (args: {
          proposalId: string;
          reviewerEmail: string;
          notes?: string;
        }) => {
          const p = proposals.get(args.proposalId);
          if (!p) return { ok: false, error: "Proposal not found" };
          if (p.status !== "pending_review")
            return { ok: false, error: `Proposal already ${p.status}` };
          p.status = "rejected";
          p.reviewedAt = new Date();
          p.reviewerEmail = args.reviewerEmail;
          if (args.notes) p.reviewNotes = args.notes;
          return { ok: true, proposal: p };
        },
      ),
  };
});

// Avoid invoking the real Python defence fetcher during tests.
vi.mock("./dataIngestion", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./dataIngestion")>();
  return {
    ...actual,
    fetchDefenceMetrics: vi.fn().mockImplementation(async () => {
      fetchDefenceCallCount.n++;
      return {
        success: true,
        data: [
          {
            metric_name: "Sea Mass",
            metric_key: "sea_mass",
            category: "Defence",
            value: 65.4,
            time_period: "2026 Q2",
            rag_status: "red" as const,
            data_source: "test",
            source_url: "https://example.test",
            last_updated: new Date().toISOString(),
            information: "updated narrative after approval",
          },
        ],
      };
    }),
  };
});

import { appRouter } from "./routers";

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
    ctx: { user, req: {} as never, res: {} as never } as TrpcContext,
  };
}

function createNonAdminContext(): { ctx: TrpcContext } {
  const { ctx } = createAdminContext();
  return { ctx: { ...ctx, user: { ...ctx.user!, role: "user" } } };
}

function seedProposal(overrides: Partial<FleetChangeProposal> = {}) {
  const id = overrides._id?.toString() ?? `proposal-${proposals.size + 1}`;
  const p: FleetChangeProposal = {
    _id: id as unknown as FleetChangeProposal["_id"],
    itemId: "hms-portland",
    vesselNameFromArticle: "HMS Portland",
    currentStatus: "low_readiness",
    proposedStatus: "refit",
    evidenceQuote:
      "HMS Portland has already spent much of 2025 in an unplanned docking period.",
    articleUrl:
      "https://www.navylookout.com/another-warship-quietly-withdrawn-royal-navy-now-down-to-just-5-frigates/",
    articleTitle: "Another warship quietly withdrawn",
    articleSource: "Navy Lookout",
    articlePublishedAt: new Date("2026-05-04"),
    confidence: 0.85,
    status: "pending_review",
    createdAt: new Date(),
    ...overrides,
  };
  proposals.set(id, p);
  return p;
}

function seedInventory(itemId: string, status: FleetInventoryItem["status"]) {
  const now = new Date();
  inventory.set(itemId, {
    _id: itemId as unknown as FleetInventoryItem["_id"],
    itemId,
    name: itemId.replace(/^hms-/, "HMS ").replace(/-/g, " "),
    className: "Type 23 Frigate",
    category: "sea_mass",
    role: "escort",
    status,
    statusChangedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

beforeEach(() => {
  inventory.clear();
  proposals.clear();
  fetchDefenceCallCount.n = 0;
});

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("fleetProposals router", () => {
  it("non-admin cannot list proposals", async () => {
    const caller = appRouter.createCaller(createNonAdminContext().ctx);
    await expect(caller.fleetProposals.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin can list pending proposals", async () => {
    seedProposal({ _id: "p1" as unknown as FleetChangeProposal["_id"] });
    seedProposal({
      _id: "p2" as unknown as FleetChangeProposal["_id"],
      status: "approved",
    });
    const caller = appRouter.createCaller(createAdminContext().ctx);
    const pending = await caller.fleetProposals.list({
      status: "pending_review",
    });
    expect(pending.length).toBe(1);
    expect(pending[0].itemId).toBe("hms-portland");
  });

  it("approve flips inventory status and refreshes Sea Mass", async () => {
    seedInventory("hms-portland", "low_readiness");
    seedProposal({ _id: "p1" as unknown as FleetChangeProposal["_id"] });
    const caller = appRouter.createCaller(createAdminContext().ctx);

    const result = await caller.fleetProposals.approve({ id: "p1" });
    expect(result.ok).toBe(true);
    expect(result.refreshed).toBe(true);
    expect(inventory.get("hms-portland")?.status).toBe("refit");
    expect(proposals.get("p1")?.status).toBe("approved");
    expect(proposals.get("p1")?.reviewerEmail).toBe("admin@example.com");
    expect(fetchDefenceCallCount.n).toBe(1);
  });

  it("reject marks proposal rejected and does NOT flip inventory", async () => {
    seedInventory("hms-portland", "low_readiness");
    seedProposal({ _id: "p1" as unknown as FleetChangeProposal["_id"] });
    const caller = appRouter.createCaller(createAdminContext().ctx);

    await caller.fleetProposals.reject({ id: "p1", notes: "rumour, not fact" });
    expect(inventory.get("hms-portland")?.status).toBe("low_readiness");
    const p = proposals.get("p1");
    expect(p?.status).toBe("rejected");
    expect(p?.reviewNotes).toBe("rumour, not fact");
    expect(fetchDefenceCallCount.n).toBe(0);
  });

  it("approve fails cleanly when inventory item is missing", async () => {
    // No seedInventory call — inventory is empty.
    seedProposal({ _id: "p1" as unknown as FleetChangeProposal["_id"] });
    const caller = appRouter.createCaller(createAdminContext().ctx);

    await expect(
      caller.fleetProposals.approve({ id: "p1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(proposals.get("p1")?.status).toBe("pending_review");
  });

  it("approving an already-approved proposal is rejected", async () => {
    seedInventory("hms-portland", "low_readiness");
    seedProposal({
      _id: "p1" as unknown as FleetChangeProposal["_id"],
      status: "approved",
    });
    const caller = appRouter.createCaller(createAdminContext().ctx);
    await expect(
      caller.fleetProposals.approve({ id: "p1" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("counts returns rollups per status", async () => {
    seedProposal({ _id: "p1" as unknown as FleetChangeProposal["_id"] });
    seedProposal({
      _id: "p2" as unknown as FleetChangeProposal["_id"],
      status: "approved",
    });
    seedProposal({
      _id: "p3" as unknown as FleetChangeProposal["_id"],
      status: "rejected",
    });
    const caller = appRouter.createCaller(createAdminContext().ctx);
    const counts = await caller.fleetProposals.counts();
    expect(counts.pending_review).toBe(1);
    expect(counts.approved).toBe(1);
    expect(counts.rejected).toBe(1);
    expect(counts.auto_rejected).toBe(0);
  });
});
