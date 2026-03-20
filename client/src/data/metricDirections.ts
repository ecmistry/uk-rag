/**
 * Direction semantics for each metric.
 *
 * "higher_better" – a rising value is positive (green trend).
 * "lower_better"  – a falling value is positive (green trend).
 * "target_band"   – optimal value sits inside a range; moving towards it is
 *                   positive, moving away is negative.
 */

export type MetricDirection = "higher_better" | "lower_better" | "target_band";

interface TargetBand {
  lo: number;
  hi: number;
}

export const METRIC_DIRECTION: Record<string, MetricDirection> = {
  // Economy
  output_per_hour: "higher_better",
  real_gdp_growth: "higher_better",
  cpi_inflation: "target_band",
  public_sector_net_debt: "lower_better",
  business_investment: "higher_better",

  // Employment
  inactivity_rate: "lower_better",
  real_wage_growth: "higher_better",
  job_vacancy_ratio: "higher_better",
  underemployment: "lower_better",
  sickness_absence: "lower_better",

  // Education
  attainment8: "higher_better",
  neet_rate: "lower_better",
  pupil_attendance: "lower_better",
  apprenticeship_intensity: "higher_better",

  // Crime
  recorded_crime_rate: "lower_better",
  charge_rate: "higher_better",
  street_confidence_index: "lower_better",
  crown_court_backlog: "lower_better",
  reoffending_rate: "lower_better",
  asb_low_level_crime: "lower_better",
  serious_crime: "lower_better",

  // Healthcare
  a_e_wait_time: "higher_better",
  elective_backlog: "lower_better",
  ambulance_response_time: "lower_better",
  gp_appt_access: "higher_better",
  staff_vacancy_rate: "lower_better",

  // Defence
  sea_mass: "higher_better",
  land_mass: "higher_better",
  air_mass: "higher_better",
  defence_industry_vitality: "higher_better",
  defence_spending_gdp: "higher_better",

  // Population
  natural_change: "higher_better",
  old_age_dependency_ratio: "lower_better",
  net_migration: "target_band",
  healthy_life_expectancy: "higher_better",
};

const TARGET_BANDS: Record<string, TargetBand> = {
  cpi_inflation: { lo: 1.5, hi: 2.5 },
  net_migration: { lo: 0, hi: 300 },
};

/**
 * Given a metric key, current value, and previous value, return the trend
 * sentiment: "positive", "negative", or "neutral".
 *
 * - For higher_better / lower_better, a change in the "good" direction is positive.
 * - For target_band, moving closer to the band is positive; farther is negative.
 * - If the values are equal (or the metric is unknown), return "neutral".
 */
export function getTrendSentiment(
  metricKey: string,
  currentValue: number,
  previousValue: number,
): "positive" | "negative" | "neutral" {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) return "neutral";
  if (currentValue === previousValue) return "neutral";

  const direction = METRIC_DIRECTION[metricKey];
  if (!direction) return "neutral";

  if (direction === "higher_better") {
    return currentValue > previousValue ? "positive" : "negative";
  }

  if (direction === "lower_better") {
    return currentValue < previousValue ? "positive" : "negative";
  }

  // target_band
  const band = TARGET_BANDS[metricKey];
  if (!band) return "neutral";

  const distCurrent = currentValue < band.lo
    ? band.lo - currentValue
    : currentValue > band.hi
      ? currentValue - band.hi
      : 0;
  const distPrevious = previousValue < band.lo
    ? band.lo - previousValue
    : previousValue > band.hi
      ? previousValue - band.hi
      : 0;

  if (distCurrent < distPrevious) return "positive";
  if (distCurrent > distPrevious) return "negative";
  return "neutral";
}
