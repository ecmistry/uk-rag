import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import TrendIndicator from "./TrendIndicator";

describe("TrendIndicator", () => {
  it("renders a grey dot when previousValue is null", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={2.0} previousValue={null} />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-label")).toBe("Single data point — no trend yet");
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("renders a trend arrow when previous value exists", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={3.0} previousValue={2.0} />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-label")).toContain("up");
    expect(svg?.getAttribute("aria-label")).toContain("positive");
  });

  it("renders green colour for positive higher_better trend (value up)", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={3.0} previousValue={2.0} />
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#16a34a");
  });

  it("renders red colour for negative higher_better trend (value down)", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={1.0} previousValue={2.0} />
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#dc2626");
  });

  it("renders green colour for positive lower_better trend (value down = good)", () => {
    const { container } = render(
      <TrendIndicator metricKey="crown_court_backlog" currentValue={70} previousValue={90} />
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#16a34a");
  });

  it("renders red colour for negative lower_better trend (value up = bad)", () => {
    const { container } = render(
      <TrendIndicator metricKey="crown_court_backlog" currentValue={95} previousValue={80} />
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#dc2626");
  });

  it("renders grey for flat trend (equal values)", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={2.0} previousValue={2.0} />
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#9ca3af");
  });

  it("renders grey dot when currentValue is NaN", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={NaN} previousValue={2.0} />
    );
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("renders grey dot when previousValue is Infinity", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={2.0} previousValue={Infinity} />
    );
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("returns null when no data at all (both null-ish)", () => {
    const { container } = render(
      <TrendIndicator metricKey="real_gdp_growth" currentValue={NaN} previousValue={null} />
    );
    expect(container.querySelector("circle")).toBeTruthy();
  });
});
