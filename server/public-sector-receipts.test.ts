import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PublicSectorReceipts, PublicSectorReceiptsPeriod } from "./dataIngestion";

const EXPECTED_FIELDS: (keyof Omit<PublicSectorReceiptsPeriod, "period">)[] = [
  "vat",
  "fuel_duties",
  "business_rates",
  "stamp_duty_land_tax",
  "stamp_taxes_on_shares",
  "tobacco_duties",
  "alcohol_duties",
  "customs_duties",
  "vehicle_excise_business",
  "other_taxes_on_production",
  "income_tax",
  "corporation_tax",
  "petroleum_revenue_tax",
  "misc_taxes_income_wealth",
  "vehicle_excise_households",
  "bank_levy",
  "tv_licence_fee",
  "misc_other_taxes",
  "social_contributions",
  "council_tax",
  "other_local_govt_taxes",
  "interest_and_dividends",
  "gross_operating_surplus",
  "other_receipts",
];

function makePeriod(overrides?: Partial<PublicSectorReceiptsPeriod>): PublicSectorReceiptsPeriod {
  const base: PublicSectorReceiptsPeriod = {
    period: "2024 Q4",
    vat: 43200,
    fuel_duties: 6900,
    business_rates: 8100,
    stamp_duty_land_tax: 3700,
    stamp_taxes_on_shares: 1100,
    tobacco_duties: 2400,
    alcohol_duties: 3200,
    customs_duties: 800,
    vehicle_excise_business: 500,
    other_taxes_on_production: 2100,
    income_tax: 62300,
    corporation_tax: 22500,
    petroleum_revenue_tax: 0,
    misc_taxes_income_wealth: 900,
    vehicle_excise_households: 1800,
    bank_levy: 300,
    tv_licence_fee: 1000,
    misc_other_taxes: 400,
    social_contributions: 42100,
    council_tax: 11800,
    other_local_govt_taxes: -200,
    interest_and_dividends: 4100,
    gross_operating_surplus: 12400,
    other_receipts: 7500,
  };
  return { ...base, ...overrides };
}

describe("PublicSectorReceipts data shape", () => {
  it("should define exactly 24 revenue fields", () => {
    expect(EXPECTED_FIELDS).toHaveLength(24);
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

  it("period format matches 'YYYY QN' pattern", () => {
    const p = makePeriod({ period: "2025 Q1" });
    expect(p.period).toMatch(/^\d{4} Q[1-4]$/);
  });

  it("rejects periods with invalid quarter numbers", () => {
    expect("2025 Q0").not.toMatch(/^\d{4} Q[1-4]$/);
    expect("2025 Q5").not.toMatch(/^\d{4} Q[1-4]$/);
  });
});

describe("getPublicSectorReceipts (mocked)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns parsed data for valid JSON output", async () => {
    const mockData: PublicSectorReceipts = {
      periods: [makePeriod({ period: "2024 Q3" }), makePeriod({ period: "2024 Q4" })],
    };

    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify(mockData), stderr: "" });
      },
    }));

    const { getPublicSectorReceipts } = await import("./dataIngestion");
    const result = await getPublicSectorReceipts();

    expect(result).not.toBeNull();
    expect(result!.periods).toHaveLength(2);
    expect(result!.periods[0].period).toBe("2024 Q3");
    expect(result!.periods[1].income_tax).toBe(62300);
  });

  it("returns null for empty stdout", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "", stderr: "" });
      },
    }));

    const { getPublicSectorReceipts } = await import("./dataIngestion");
    const result = await getPublicSectorReceipts();
    expect(result).toBeNull();
  });

  it("returns null for empty object JSON", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "{}", stderr: "" });
      },
    }));

    const { getPublicSectorReceipts } = await import("./dataIngestion");
    const result = await getPublicSectorReceipts();
    expect(result).toBeNull();
  });

  it("returns null for empty periods array", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: null, result: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: JSON.stringify({ periods: [] }), stderr: "" });
      },
    }));

    const { getPublicSectorReceipts } = await import("./dataIngestion");
    const result = await getPublicSectorReceipts();
    expect(result).toBeNull();
  });

  it("returns null when subprocess throws", async () => {
    vi.doMock("child_process", () => ({
      exec: (_cmd: string, _opts: unknown, cb: (err: Error) => void) => {
        cb(new Error("python3 not found"));
      },
    }));

    const { getPublicSectorReceipts } = await import("./dataIngestion");
    const result = await getPublicSectorReceipts();
    expect(result).toBeNull();
  });
});

describe("getPublicSectorReceipts (integration)", () => {
  it(
    "returns real data with complete quarters from ONS",
    async () => {
      const { getPublicSectorReceipts } = await import("./dataIngestion");
      const result = await getPublicSectorReceipts();
      if (!result?.periods?.length) {
        return;
      }

      expect(result.periods.length).toBeGreaterThanOrEqual(10);

      for (const period of result.periods) {
        expect(period.period).toMatch(/^\d{4} Q[1-4]$/);
        for (const field of EXPECTED_FIELDS) {
          expect(period).toHaveProperty(field);
          expect(typeof period[field]).toBe("number");
          expect(Number.isFinite(period[field])).toBe(true);
        }
      }

      const lastPeriod = result.periods[result.periods.length - 1];
      const total = EXPECTED_FIELDS.reduce((sum, f) => sum + lastPeriod[f], 0);
      expect(total).toBeGreaterThan(50_000);

      const periods = result.periods.map((p) => p.period);
      const sorted = [...periods].sort();
      expect(periods).toEqual(sorted);
    },
    { timeout: 60_000, skip: process.env.SKIP_NETWORK_TESTS === "1" },
  );
});
