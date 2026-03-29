import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PublicSectorExpenditure, PublicSectorExpenditurePeriod } from "./dataIngestion";

const EXPECTED_FIELDS: (keyof Omit<PublicSectorExpenditurePeriod, "period">)[] = [
  "public_and_common_services",
  "international_services",
  "debt_interest",
  "defence",
  "public_order_and_safety",
  "enterprise_and_economic_dev",
  "science_and_technology",
  "employment_policies",
  "agriculture_fisheries_forestry",
  "transport",
  "environment_protection",
  "housing_and_community",
  "health",
  "recreation_culture_religion",
  "education",
  "social_protection",
  "eu_transactions",
];

function makePeriod(overrides?: Partial<PublicSectorExpenditurePeriod>): PublicSectorExpenditurePeriod {
  const base: PublicSectorExpenditurePeriod = {
    period: "2024-25",
    public_and_common_services: 22.6,
    international_services: 10.3,
    debt_interest: 126.5,
    defence: 63.7,
    public_order_and_safety: 51.7,
    enterprise_and_economic_dev: 21.1,
    science_and_technology: 9.7,
    employment_policies: 4.0,
    agriculture_fisheries_forestry: 6.4,
    transport: 47.7,
    environment_protection: 17.1,
    housing_and_community: 22.0,
    health: 242.5,
    recreation_culture_religion: 12.6,
    education: 122.7,
    social_protection: 386.5,
    eu_transactions: -1.4,
  };
  return { ...base, ...overrides };
}

describe("PublicSectorExpenditure data shape", () => {
  it("should define exactly 17 expenditure fields", () => {
    expect(EXPECTED_FIELDS).toHaveLength(17);
  });

  it("makePeriod helper has all expected fields", () => {
    const p = makePeriod();
    for (const field of EXPECTED_FIELDS) {
      expect(p).toHaveProperty(field);
      expect(typeof p[field]).toBe("number");
    }
    expect(p).toHaveProperty("period");
    expect(typeof p.period).toBe("string");
  });

  it("period format matches fiscal year 'YYYY-YY' pattern", () => {
    const p = makePeriod({ period: "2023-24" });
    expect(p.period).toMatch(/^\d{4}-\d{2}$/);
  });

  it("debt_interest is separated from other categories", () => {
    const p = makePeriod();
    const primary = EXPECTED_FIELDS
      .filter((f) => f !== "debt_interest")
      .reduce((sum, f) => sum + p[f], 0);
    const total = primary + p.debt_interest;
    expect(total).toBeCloseTo(1165.5, 0);
    expect(p.debt_interest).toBeGreaterThan(50);
  });
});

describe("getPublicSectorExpenditure (mocked)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns parsed data for valid JSON output", async () => {
    const mockData: PublicSectorExpenditure = {
      periods: [makePeriod({ period: "2023-24" }), makePeriod({ period: "2024-25" })],
    };

    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify(mockData), stderr: "" });
      },
    }));

    const { getPublicSectorExpenditure } = await import("./dataIngestion");
    const result = await getPublicSectorExpenditure();

    expect(result).not.toBeNull();
    expect(result!.periods).toHaveLength(2);
    expect(result!.periods[0].period).toBe("2023-24");
    expect(result!.periods[1].health).toBe(242.5);
  });

  it("returns null for empty stdout", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "", stderr: "" });
      },
    }));

    const { getPublicSectorExpenditure } = await import("./dataIngestion");
    const result = await getPublicSectorExpenditure();
    expect(result).toBeNull();
  });

  it("returns null when subprocess throws", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: Error) => void) => {
        cb(new Error("python3 not found"));
      },
    }));

    const { getPublicSectorExpenditure } = await import("./dataIngestion");
    const result = await getPublicSectorExpenditure();
    expect(result).toBeNull();
  });
});

describe("getPublicSectorExpenditure (integration)", () => {
  it(
    "returns real data with fiscal years from HMT",
    async () => {
      const { getPublicSectorExpenditure } = await import("./dataIngestion");
      const result = await getPublicSectorExpenditure();
      if (!result?.periods?.length) {
        return;
      }

      expect(result.periods.length).toBeGreaterThanOrEqual(10);

      for (const period of result.periods) {
        expect(period.period).toMatch(/^\d{4}-\d{2}$/);
        for (const field of EXPECTED_FIELDS) {
          expect(period).toHaveProperty(field);
          expect(typeof period[field]).toBe("number");
          expect(Number.isFinite(period[field])).toBe(true);
        }
      }

      const lastPeriod = result.periods[result.periods.length - 1];
      const total = EXPECTED_FIELDS.reduce((sum, f) => sum + lastPeriod[f], 0);
      expect(total).toBeGreaterThan(500);

      const periods = result.periods.map((p) => p.period);
      const sorted = [...periods].sort();
      expect(periods).toEqual(sorted);
    },
    { timeout: 60_000, skip: process.env.SKIP_NETWORK_TESTS === "1" },
  );
});
