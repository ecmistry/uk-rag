import { describe, expect, it } from "vitest";
import { formatValue } from "./formatValue";

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
