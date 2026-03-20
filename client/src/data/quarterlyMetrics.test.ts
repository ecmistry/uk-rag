import { describe, expect, it } from "vitest";
import {
  isQuarterlyPeriod,
  filterToQuarterlyOnly,
  deduplicateByPeriod,
} from "./quarterlyMetrics";

describe("isQuarterlyPeriod", () => {
  it("detects standard quarterly formats", () => {
    expect(isQuarterlyPeriod("2025 Q1")).toBe(true);
    expect(isQuarterlyPeriod("2025 Q4")).toBe(true);
    expect(isQuarterlyPeriod("Q2 2024")).toBe(true);
  });

  it("rejects non-quarterly formats", () => {
    expect(isQuarterlyPeriod("Nov 2025")).toBe(false);
    expect(isQuarterlyPeriod("2025")).toBe(false);
    expect(isQuarterlyPeriod("2025 JAN")).toBe(false);
    expect(isQuarterlyPeriod("")).toBe(false);
  });
});

describe("filterToQuarterlyOnly", () => {
  it("filters to quarterly when quarterly data exists", () => {
    const history = [
      { dataDate: "2025 Q4" },
      { dataDate: "Nov 2025" },
      { dataDate: "2025 Q3" },
    ];
    const result = filterToQuarterlyOnly(history);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.dataDate)).toEqual(["2025 Q4", "2025 Q3"]);
  });

  it("returns all history when no quarterly data exists", () => {
    const history = [
      { dataDate: "Nov 2025" },
      { dataDate: "Oct 2025" },
    ];
    const result = filterToQuarterlyOnly(history);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for null/undefined", () => {
    expect(filterToQuarterlyOnly(null)).toEqual([]);
    expect(filterToQuarterlyOnly(undefined)).toEqual([]);
  });
});

describe("deduplicateByPeriod", () => {
  it("removes duplicate periods keeping latest recordedAt", () => {
    const history = [
      { dataDate: "2025 Q4", recordedAt: new Date("2026-01-01"), value: "1" },
      { dataDate: "2025 Q4", recordedAt: new Date("2026-02-01"), value: "2" },
      { dataDate: "2025 Q3", recordedAt: new Date("2026-01-01"), value: "3" },
    ];
    const result = deduplicateByPeriod(history);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe("2"); // Q4 with later recordedAt
    expect(result[1].value).toBe("3"); // Q3
  });

  it("sorts quarterly dates chronologically (newest first)", () => {
    const history = [
      { dataDate: "2025 Q1", recordedAt: new Date(), value: "1" },
      { dataDate: "2025 Q4", recordedAt: new Date(), value: "4" },
      { dataDate: "2025 Q2", recordedAt: new Date(), value: "2" },
    ];
    const result = deduplicateByPeriod(history);
    expect(result.map((r) => r.dataDate)).toEqual(["2025 Q4", "2025 Q2", "2025 Q1"]);
  });

  it("sorts monthly dates chronologically (newest first)", () => {
    const history = [
      { dataDate: "Sep 2025", recordedAt: new Date(), value: "1" },
      { dataDate: "Nov 2025", recordedAt: new Date(), value: "2" },
      { dataDate: "Jan 2025", recordedAt: new Date(), value: "3" },
      { dataDate: "Mar 2025", recordedAt: new Date(), value: "4" },
    ];
    const result = deduplicateByPeriod(history);
    expect(result.map((r) => r.dataDate)).toEqual([
      "Nov 2025",
      "Sep 2025",
      "Mar 2025",
      "Jan 2025",
    ]);
  });

  it("sorts annual dates chronologically", () => {
    const history = [
      { dataDate: "2023", recordedAt: new Date(), value: "1" },
      { dataDate: "2025", recordedAt: new Date(), value: "2" },
      { dataDate: "2024", recordedAt: new Date(), value: "3" },
    ];
    const result = deduplicateByPeriod(history);
    expect(result.map((r) => r.dataDate)).toEqual(["2025", "2024", "2023"]);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateByPeriod([])).toEqual([]);
  });
});
