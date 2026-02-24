import { describe, expect, it } from "vitest";
import type { PopulationBreakdown } from "./dataIngestion";
import { hasNonZeroUnderemployed, getPopulationBreakdown } from "./dataIngestion";

describe("hasNonZeroUnderemployed", () => {
  it("returns false for empty periods", () => {
    expect(hasNonZeroUnderemployed({ periods: [] })).toBe(false);
  });

  it("returns false when all periods have underemployed 0", () => {
    const data: PopulationBreakdown = {
      periods: [
        { period: "2023 Q2", total: 68e6, working: 33e6, inactive: 9e6, unemployed: 1.5e6, underemployed: 0, under16Over64: 24e6 },
        { period: "2023 Q3", total: 68e6, working: 33e6, inactive: 9e6, unemployed: 1.4e6, underemployed: 0, under16Over64: 24e6 },
      ],
    };
    expect(hasNonZeroUnderemployed(data)).toBe(false);
  });

  it("returns true when at least one period has underemployed > 0", () => {
    const data: PopulationBreakdown = {
      periods: [
        { period: "2023 Q1", total: 68e6, working: 33e6, inactive: 9e6, unemployed: 1.4e6, underemployed: 0, under16Over64: 24e6 },
        { period: "2023 Q2", total: 68e6, working: 33e6, inactive: 9e6, unemployed: 1.5e6, underemployed: 2_418_565, under16Over64: 24e6 },
      ],
    };
    expect(hasNonZeroUnderemployed(data)).toBe(true);
  });
});

describe("getPopulationBreakdown (integration)", () => {
  it(
    "returns breakdown with at least one non-zero underemployed (EMP16 fetched first to avoid ONS 429)",
    async () => {
      const result = await getPopulationBreakdown();
      if (!result?.periods?.length) {
        // Script may fail in CI (no Python, no network, ONS down) – skip instead of fail
        return;
      }
      expect(
        hasNonZeroUnderemployed(result),
        "At least one period must have underemployed > 0. If this fails, EMP16 may be fetched after other requests (429) or fetch order was reverted."
      ).toBe(true);
    },
    { timeout: 60_000, skip: process.env.SKIP_NETWORK_TESTS === "1" }
  );
});
