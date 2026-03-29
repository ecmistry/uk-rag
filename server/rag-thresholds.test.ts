import { describe, it, expect } from "vitest";
import { calculateRAGStatus, RAG_THRESHOLDS } from "./dataIngestion";
import { getOutputPerHourRagStatus, OUTPUT_PER_HOUR_RAG } from "./ragOutputPerHour";
import { METRIC_DIRECTION } from "../client/src/data/metricDirections";
import {
  ECONOMY_TOOLTIPS,
  EMPLOYMENT_TOOLTIPS,
  EDUCATION_TOOLTIPS,
  CRIME_TOOLTIPS,
  HEALTHCARE_TOOLTIPS,
  DEFENCE_TOOLTIPS,
} from "../client/src/data/metricTooltips";

const ALL_TOOLTIPS: Record<string, string> = {
  ...ECONOMY_TOOLTIPS,
  ...EMPLOYMENT_TOOLTIPS,
  ...EDUCATION_TOOLTIPS,
  ...CRIME_TOOLTIPS,
  ...HEALTHCARE_TOOLTIPS,
  ...DEFENCE_TOOLTIPS,
};

describe("RAG_THRESHOLDS coverage", () => {
  it("every metric with a tooltip containing RAG thresholds has an entry in RAG_THRESHOLDS", () => {
    const missing: string[] = [];
    for (const [key, text] of Object.entries(ALL_TOOLTIPS)) {
      if (/🟢|🟡|🔴/.test(text) && !RAG_THRESHOLDS[key]) {
        missing.push(key);
      }
    }
    expect(missing, `Missing RAG_THRESHOLDS for: ${missing.join(", ")}`).toEqual([]);
  });

  it("every RAG_THRESHOLDS entry has a matching tooltip", () => {
    const orphaned: string[] = [];
    for (const key of Object.keys(RAG_THRESHOLDS)) {
      if (!ALL_TOOLTIPS[key]) {
        orphaned.push(key);
      }
    }
    expect(orphaned, `RAG_THRESHOLDS keys without tooltips: ${orphaned.join(", ")}`).toEqual([]);
  });

  it("direction in RAG_THRESHOLDS matches METRIC_DIRECTION for every metric", () => {
    const mismatched: string[] = [];
    for (const [key, threshold] of Object.entries(RAG_THRESHOLDS)) {
      const dir = METRIC_DIRECTION[key];
      if (!dir) continue;
      if (threshold.direction !== dir) {
        mismatched.push(`${key}: threshold=${threshold.direction}, metricDirections=${dir}`);
      }
    }
    expect(mismatched, `Direction mismatches:\n${mismatched.join("\n")}`).toEqual([]);
  });
});

describe("calculateRAGStatus — Economy", () => {
  describe("output_per_hour (higher_better: green >= 1.5, amber >= 0.5)", () => {
    it("green", () => {
      expect(calculateRAGStatus("output_per_hour", 1.5)).toBe("green");
      expect(calculateRAGStatus("output_per_hour", 3.0)).toBe("green");
    });
    it("amber", () => {
      expect(calculateRAGStatus("output_per_hour", 0.5)).toBe("amber");
      expect(calculateRAGStatus("output_per_hour", 1.1)).toBe("amber");
      expect(calculateRAGStatus("output_per_hour", 1.49)).toBe("amber");
    });
    it("red", () => {
      expect(calculateRAGStatus("output_per_hour", 0.4)).toBe("red");
      expect(calculateRAGStatus("output_per_hour", -1.0)).toBe("red");
    });
  });

  describe("real_gdp_growth (higher_better: green >= 2.0, amber >= 0.5)", () => {
    it("green", () => {
      expect(calculateRAGStatus("real_gdp_growth", 2.0)).toBe("green");
      expect(calculateRAGStatus("real_gdp_growth", 3.5)).toBe("green");
    });
    it("amber", () => {
      expect(calculateRAGStatus("real_gdp_growth", 0.5)).toBe("amber");
      expect(calculateRAGStatus("real_gdp_growth", 0.97)).toBe("amber");
      expect(calculateRAGStatus("real_gdp_growth", 1.5)).toBe("amber");
    });
    it("red", () => {
      expect(calculateRAGStatus("real_gdp_growth", 0.4)).toBe("red");
      expect(calculateRAGStatus("real_gdp_growth", -1.0)).toBe("red");
    });
  });

  describe("cpi_inflation (target_band: green 1.5–2.5, amber 0–4.0)", () => {
    it("green", () => {
      expect(calculateRAGStatus("cpi_inflation", 2.0)).toBe("green");
      expect(calculateRAGStatus("cpi_inflation", 1.5)).toBe("green");
      expect(calculateRAGStatus("cpi_inflation", 2.5)).toBe("green");
    });
    it("amber", () => {
      expect(calculateRAGStatus("cpi_inflation", 1.2)).toBe("amber");
      expect(calculateRAGStatus("cpi_inflation", 3.0)).toBe("amber");
      expect(calculateRAGStatus("cpi_inflation", 3.9)).toBe("amber");
      expect(calculateRAGStatus("cpi_inflation", 4.0)).toBe("amber");
    });
    it("red", () => {
      expect(calculateRAGStatus("cpi_inflation", -0.1)).toBe("red");
      expect(calculateRAGStatus("cpi_inflation", 4.1)).toBe("red");
      expect(calculateRAGStatus("cpi_inflation", 10.0)).toBe("red");
    });
  });

  describe("public_sector_net_debt (lower_better: green < 70, amber <= 85)", () => {
    it("green", () => {
      expect(calculateRAGStatus("public_sector_net_debt", 69.9)).toBe("green");
      expect(calculateRAGStatus("public_sector_net_debt", 50)).toBe("green");
    });
    it("amber", () => {
      expect(calculateRAGStatus("public_sector_net_debt", 70)).toBe("amber");
      expect(calculateRAGStatus("public_sector_net_debt", 85)).toBe("amber");
    });
    it("red", () => {
      expect(calculateRAGStatus("public_sector_net_debt", 85.1)).toBe("red");
      expect(calculateRAGStatus("public_sector_net_debt", 95.1)).toBe("red");
    });
  });

  describe("business_investment (higher_better: green >= 12, amber >= 10)", () => {
    it("green", () => { expect(calculateRAGStatus("business_investment", 12)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("business_investment", 10.74)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("business_investment", 9.9)).toBe("red"); });
  });
});

describe("calculateRAGStatus — Employment", () => {
  describe("inactivity_rate (lower_better: green < 14, amber <= 20)", () => {
    it("green", () => { expect(calculateRAGStatus("inactivity_rate", 13.9)).toBe("green"); });
    it("amber", () => {
      expect(calculateRAGStatus("inactivity_rate", 14.0)).toBe("amber");
      expect(calculateRAGStatus("inactivity_rate", 20.0)).toBe("amber");
    });
    it("red", () => { expect(calculateRAGStatus("inactivity_rate", 20.8)).toBe("red"); });
  });

  describe("real_wage_growth (higher_better: green >= 2.0, amber >= 1.0)", () => {
    it("green", () => { expect(calculateRAGStatus("real_wage_growth", 2.0)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("real_wage_growth", 1.5)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("real_wage_growth", 0.84)).toBe("red"); });
  });

  describe("job_vacancy_ratio (higher_better: green >= 3.5, amber >= 2.5)", () => {
    it("green", () => { expect(calculateRAGStatus("job_vacancy_ratio", 3.5)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("job_vacancy_ratio", 3.0)).toBe("amber"); });
    it("red — 2.2% must be red, not green", () => {
      expect(calculateRAGStatus("job_vacancy_ratio", 2.2)).toBe("red");
    });
  });

  describe("underemployment (lower_better: green < 5.5, amber <= 8.5)", () => {
    it("green", () => { expect(calculateRAGStatus("underemployment", 5.4)).toBe("green"); });
    it("amber — 8.48% is amber, not red", () => {
      expect(calculateRAGStatus("underemployment", 8.48)).toBe("amber");
      expect(calculateRAGStatus("underemployment", 8.5)).toBe("amber");
    });
    it("red", () => { expect(calculateRAGStatus("underemployment", 8.6)).toBe("red"); });
  });

  describe("sickness_absence (lower_better: green < 3.0, amber <= 4.5)", () => {
    it("green", () => { expect(calculateRAGStatus("sickness_absence", 2.9)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("sickness_absence", 4.31)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("sickness_absence", 4.6)).toBe("red"); });
  });
});

describe("calculateRAGStatus — Education", () => {
  describe("attainment8 (higher_better: green >= 5.5, amber >= 4.5)", () => {
    it("green", () => { expect(calculateRAGStatus("attainment8", 5.5)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("attainment8", 4.6)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("attainment8", 4.4)).toBe("red"); });
  });

  describe("neet_rate (lower_better: green < 8, amber <= 12)", () => {
    it("green", () => { expect(calculateRAGStatus("neet_rate", 7.9)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("neet_rate", 10)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("neet_rate", 12.5)).toBe("red"); });
  });

  describe("pupil_attendance (lower_better: green < 1.0, amber <= 1.5)", () => {
    it("green", () => { expect(calculateRAGStatus("pupil_attendance", 0.9)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("pupil_attendance", 1.2)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("pupil_attendance", 2.29)).toBe("red"); });
  });

  describe("apprenticeship_intensity (higher_better: green >= 15, amber >= 10)", () => {
    it("green", () => { expect(calculateRAGStatus("apprenticeship_intensity", 15)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("apprenticeship_intensity", 12.2)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("apprenticeship_intensity", 9.9)).toBe("red"); });
  });
});

describe("calculateRAGStatus — Crime", () => {
  describe("crown_court_backlog (lower_better: green < 60, amber <= 90)", () => {
    it("green", () => { expect(calculateRAGStatus("crown_court_backlog", 59)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("crown_court_backlog", 75)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("crown_court_backlog", 107.4)).toBe("red"); });
  });

  describe("recall_rate (lower_better: green < 7.5, amber <= 11)", () => {
    it("green", () => { expect(calculateRAGStatus("recall_rate", 7.0)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("recall_rate", 9.0)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("recall_rate", 14.7)).toBe("red"); });
  });

  describe("street_confidence_index (lower_better: green < 20, amber <= 30)", () => {
    it("green", () => { expect(calculateRAGStatus("street_confidence_index", 15)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("street_confidence_index", 25)).toBe("amber"); });
    it("red — 59% must be red", () => {
      expect(calculateRAGStatus("street_confidence_index", 59)).toBe("red");
    });
  });

  describe("asb_low_level_crime (lower_better: green < 800, amber <= 1200)", () => {
    it("green", () => { expect(calculateRAGStatus("asb_low_level_crime", 750)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("asb_low_level_crime", 1103)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("asb_low_level_crime", 1300)).toBe("red"); });
  });

  describe("serious_crime (lower_better: green < 400, amber <= 700)", () => {
    it("green", () => { expect(calculateRAGStatus("serious_crime", 350)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("serious_crime", 500)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("serious_crime", 925)).toBe("red"); });
  });
});

describe("calculateRAGStatus — Healthcare", () => {
  describe("a_e_wait_time (higher_better: green >= 95, amber >= 90)", () => {
    it("green", () => { expect(calculateRAGStatus("a_e_wait_time", 95)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("a_e_wait_time", 92)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("a_e_wait_time", 74.4)).toBe("red"); });
  });

  describe("elective_backlog (lower_better: green < 4M, amber <= 6M)", () => {
    it("green", () => { expect(calculateRAGStatus("elective_backlog", 3_500_000)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("elective_backlog", 4_186_974)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("elective_backlog", 7_000_000)).toBe("red"); });
  });

  describe("ambulance_response_time (lower_better: green < 7, amber <= 10)", () => {
    it("green", () => { expect(calculateRAGStatus("ambulance_response_time", 6.5)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("ambulance_response_time", 8.5)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("ambulance_response_time", 11)).toBe("red"); });
  });

  describe("gp_appt_access (higher_better: green >= 70, amber >= 55)", () => {
    it("green", () => { expect(calculateRAGStatus("gp_appt_access", 70)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("gp_appt_access", 65)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("gp_appt_access", 50)).toBe("red"); });
  });

  describe("old_age_dependency_ratio (lower_better: green < 300, amber <= 350)", () => {
    it("green", () => { expect(calculateRAGStatus("old_age_dependency_ratio", 277.9)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("old_age_dependency_ratio", 320)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("old_age_dependency_ratio", 360)).toBe("red"); });
  });
});

describe("calculateRAGStatus — Defence", () => {
  describe("defence_spending_gdp (higher_better: green >= 2.5, amber >= 2.0)", () => {
    it("green", () => { expect(calculateRAGStatus("defence_spending_gdp", 2.5)).toBe("green"); });
    it("amber", () => { expect(calculateRAGStatus("defence_spending_gdp", 2.09)).toBe("amber"); });
    it("red", () => { expect(calculateRAGStatus("defence_spending_gdp", 1.9)).toBe("red"); });
  });

  for (const key of ["sea_mass", "land_mass", "air_mass", "defence_industry_vitality"] as const) {
    describe(`${key} (higher_better: green >= 90, amber >= 70)`, () => {
      it("green", () => { expect(calculateRAGStatus(key, 90)).toBe("green"); });
      it("amber", () => { expect(calculateRAGStatus(key, 75)).toBe("amber"); });
      it("red", () => { expect(calculateRAGStatus(key, 48)).toBe("red"); });
    });
  }
});

describe("calculateRAGStatus — unknown metrics", () => {
  it("returns amber for unrecognised metric key", () => {
    expect(calculateRAGStatus("totally_unknown", 50)).toBe("amber");
  });
});

describe("calculateRAGStatus — current live values produce correct RAG", () => {
  const liveValues: Array<[string, number, "red" | "amber" | "green"]> = [
    ["output_per_hour", 1.1, "amber"],
    ["real_gdp_growth", 0.97, "amber"],
    ["cpi_inflation", 3.0, "amber"],
    ["public_sector_net_debt", 95.1, "red"],
    ["business_investment", 10.74, "amber"],
    ["inactivity_rate", 20.8, "red"],
    ["real_wage_growth", 0.84, "red"],
    ["job_vacancy_ratio", 2.2, "red"],
    ["underemployment", 8.48, "amber"],
    ["sickness_absence", 4.31, "amber"],
    ["attainment8", 4.6, "amber"],
    ["pupil_attendance", 2.29, "red"],
    ["apprenticeship_intensity", 12.2, "amber"],
    ["crown_court_backlog", 107.4, "red"],
    ["recall_rate", 14.7, "red"],
    ["street_confidence_index", 59.0, "red"],
    ["asb_low_level_crime", 1103.1, "amber"],
    ["serious_crime", 925.6, "red"],
    ["a_e_wait_time", 74.4, "red"],
    ["elective_backlog", 4186974, "amber"],
    ["ambulance_response_time", 8.5, "amber"],
    ["gp_appt_access", 65.0, "amber"],
    ["old_age_dependency_ratio", 277.9, "green"],
    ["defence_spending_gdp", 2.09, "amber"],
    ["sea_mass", 68.8, "red"],
    ["land_mass", 70.4, "amber"],
    ["air_mass", 48.0, "red"],
    ["defence_industry_vitality", 70.2, "amber"],
  ];

  for (const [key, value, expected] of liveValues) {
    it(`${key} = ${value} → ${expected}`, () => {
      expect(calculateRAGStatus(key, value)).toBe(expected);
    });
  }
});

describe("getOutputPerHourRagStatus (legacy helper)", () => {
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
});
