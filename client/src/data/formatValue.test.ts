import { describe, expect, it } from "vitest";
import { formatValue, formatPeriod } from "./formatValue";

describe("formatValue", () => {
  it("formats standard metrics to 1 decimal place", () => {
    expect(formatValue("cpi_inflation", "3")).toBe("3.0");
    expect(formatValue("output_per_hour", "1.1")).toBe("1.1");
    expect(formatValue("real_gdp_growth", "0.97")).toBe("1.0");
    expect(formatValue("public_sector_net_debt", "95")).toBe("95.0");
    expect(formatValue("business_investment", "10.74")).toBe("10.7");
    expect(formatValue("inactivity_rate", "20.8")).toBe("20.8");
    expect(formatValue("sickness_absence", "5.61")).toBe("5.6");
  });

  it("formats backlog metrics as comma-separated integers", () => {
    expect(formatValue("elective_backlog", "4186974")).toBe("4,186,974");
    expect(formatValue("crown_court_backlog", "74651")).toBe("74,651");
  });

  it("formats total_population in millions", () => {
    expect(formatValue("total_population", "69487000")).toBe("69.5m");
  });

  it("returns raw value for non-numeric input", () => {
    expect(formatValue("some_metric", "N/A")).toBe("N/A");
    expect(formatValue("some_metric", "placeholder")).toBe("placeholder");
  });

  it("handles negative values", () => {
    expect(formatValue("real_gdp_growth", "-1.23")).toBe("-1.2");
  });

  it("handles zero", () => {
    expect(formatValue("cpi_inflation", "0")).toBe("0.0");
  });
});

describe("formatPeriod", () => {
  it("converts 6-digit academic year codes to year/yy format", () => {
    expect(formatPeriod("202425")).toBe("2024/25");
    expect(formatPeriod("201718")).toBe("2017/18");
    expect(formatPeriod("202021")).toBe("2020/21");
    expect(formatPeriod("202223")).toBe("2022/23");
  });

  it("leaves quarterly periods unchanged", () => {
    expect(formatPeriod("2025 Q4")).toBe("2025 Q4");
    expect(formatPeriod("2024 Q1")).toBe("2024 Q1");
  });

  it("leaves annual periods unchanged", () => {
    expect(formatPeriod("2024")).toBe("2024");
    expect(formatPeriod("2017")).toBe("2017");
  });

  it("leaves monthly periods unchanged", () => {
    expect(formatPeriod("Nov 2025")).toBe("Nov 2025");
    expect(formatPeriod("2026 JAN")).toBe("2026 JAN");
  });
});
