import { describe, it, expect } from "vitest";
import { calculateRAGStatus, RAG_THRESHOLDS } from "./dataIngestion";
import { getOutputPerHourRagStatus, OUTPUT_PER_HOUR_RAG } from "./ragOutputPerHour";

describe("calculateRAGStatus", () => {
  describe("real_gdp_growth (higher is better)", () => {
    it("returns green for value >= 2.0", () => {
      expect(calculateRAGStatus("real_gdp_growth", 2.0)).toBe("green");
      expect(calculateRAGStatus("real_gdp_growth", 3.5)).toBe("green");
    });
    it("returns amber for value >= 1.0 and < 2.0", () => {
      expect(calculateRAGStatus("real_gdp_growth", 1.0)).toBe("amber");
      expect(calculateRAGStatus("real_gdp_growth", 1.5)).toBe("amber");
    });
    it("returns red for value < 1.0", () => {
      expect(calculateRAGStatus("real_gdp_growth", 0.9)).toBe("red");
      expect(calculateRAGStatus("real_gdp_growth", -1.0)).toBe("red");
    });
  });

  describe("cpi_inflation (target band)", () => {
    it("returns green for value within 1.5–2.5", () => {
      expect(calculateRAGStatus("cpi_inflation", 2.0)).toBe("green");
      expect(calculateRAGStatus("cpi_inflation", 1.5)).toBe("green");
      expect(calculateRAGStatus("cpi_inflation", 2.5)).toBe("green");
    });
    it("returns amber for value within 1.0–3.5 but outside green", () => {
      expect(calculateRAGStatus("cpi_inflation", 1.2)).toBe("amber");
      expect(calculateRAGStatus("cpi_inflation", 3.0)).toBe("amber");
      expect(calculateRAGStatus("cpi_inflation", 3.5)).toBe("amber");
    });
    it("returns red for value outside amber band", () => {
      expect(calculateRAGStatus("cpi_inflation", 0.5)).toBe("red");
      expect(calculateRAGStatus("cpi_inflation", 4.0)).toBe("red");
      expect(calculateRAGStatus("cpi_inflation", 10.0)).toBe("red");
    });
  });

  describe("inactivity_rate (lower is better)", () => {
    it("returns green for value < 14", () => {
      expect(calculateRAGStatus("inactivity_rate", 13.9)).toBe("green");
      expect(calculateRAGStatus("inactivity_rate", 10.0)).toBe("green");
    });
    it("returns amber for value 14–20", () => {
      expect(calculateRAGStatus("inactivity_rate", 14.0)).toBe("amber");
      expect(calculateRAGStatus("inactivity_rate", 20.0)).toBe("amber");
    });
    it("returns red for value > 20", () => {
      expect(calculateRAGStatus("inactivity_rate", 20.1)).toBe("red");
      expect(calculateRAGStatus("inactivity_rate", 25.0)).toBe("red");
    });
  });

  describe("real_wage_growth (higher is better)", () => {
    it("returns green for value > 2", () => {
      expect(calculateRAGStatus("real_wage_growth", 2.1)).toBe("green");
      expect(calculateRAGStatus("real_wage_growth", 5.0)).toBe("green");
    });
    it("returns amber for value 1–2", () => {
      expect(calculateRAGStatus("real_wage_growth", 1.0)).toBe("amber");
      expect(calculateRAGStatus("real_wage_growth", 2.0)).toBe("amber");
    });
    it("returns red for value < 1", () => {
      expect(calculateRAGStatus("real_wage_growth", 0.9)).toBe("red");
      expect(calculateRAGStatus("real_wage_growth", -0.5)).toBe("red");
    });
  });

  describe("job_vacancy_ratio (higher is better)", () => {
    it("returns green for value > 3.5", () => {
      expect(calculateRAGStatus("job_vacancy_ratio", 3.6)).toBe("green");
    });
    it("returns amber for value 2.5–3.5", () => {
      expect(calculateRAGStatus("job_vacancy_ratio", 2.5)).toBe("amber");
      expect(calculateRAGStatus("job_vacancy_ratio", 3.5)).toBe("amber");
    });
    it("returns red for value < 2.5", () => {
      expect(calculateRAGStatus("job_vacancy_ratio", 2.4)).toBe("red");
    });
  });

  describe("underemployment (lower is better)", () => {
    it("returns green for value < 5.5", () => {
      expect(calculateRAGStatus("underemployment", 5.4)).toBe("green");
      expect(calculateRAGStatus("underemployment", 3.0)).toBe("green");
    });
    it("returns amber for value 5.5–8.5", () => {
      expect(calculateRAGStatus("underemployment", 5.5)).toBe("amber");
      expect(calculateRAGStatus("underemployment", 8.5)).toBe("amber");
    });
    it("returns red for value > 8.5", () => {
      expect(calculateRAGStatus("underemployment", 8.6)).toBe("red");
      expect(calculateRAGStatus("underemployment", 12.0)).toBe("red");
    });
  });

  describe("unknown metric", () => {
    it("returns red for unrecognised metric key", () => {
      expect(calculateRAGStatus("totally_unknown", 50)).toBe("red");
    });
  });
});

describe("getOutputPerHourRagStatus", () => {
  it("returns green for value > 1.5", () => {
    expect(getOutputPerHourRagStatus(1.6)).toBe("green");
    expect(getOutputPerHourRagStatus(3.0)).toBe("green");
  });
  it("returns amber for value between 0.5 and 1.5 (exclusive/inclusive)", () => {
    expect(getOutputPerHourRagStatus(0.6)).toBe("amber");
    expect(getOutputPerHourRagStatus(1.0)).toBe("amber");
    expect(getOutputPerHourRagStatus(1.5)).toBe("amber");
  });
  it("returns red for value <= 0.5", () => {
    expect(getOutputPerHourRagStatus(0.5)).toBe("red");
    expect(getOutputPerHourRagStatus(0.0)).toBe("red");
    expect(getOutputPerHourRagStatus(-1.0)).toBe("red");
  });
  it("boundary: exactly 1.5 is amber (not green)", () => {
    expect(getOutputPerHourRagStatus(1.5)).toBe("amber");
  });
  it("boundary: exactly 0.5 is red (not amber)", () => {
    expect(getOutputPerHourRagStatus(0.5)).toBe("red");
  });
});

describe("RAG_THRESHOLDS", () => {
  it("exports threshold definitions for all expected metrics", () => {
    const expectedKeys = [
      "real_gdp_growth", "cpi_inflation", "output_per_hour",
      "inactivity_rate", "real_wage_growth", "job_vacancy_ratio", "underemployment",
    ];
    for (const key of expectedKeys) {
      expect(RAG_THRESHOLDS).toHaveProperty(key);
    }
  });
});
