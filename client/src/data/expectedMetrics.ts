/**
 * Expected metric slots per section. Used to always show the same number of cards;
 * when a metric is not in the API response, the card shows "No data available".
 */

export type ExpectedSlot = { metricKey: string; name: string };

export const EXPECTED_METRICS: Record<string, ExpectedSlot[]> = {
  Economy: [
    { metricKey: "output_per_hour", name: "Output per Hour" },
    { metricKey: "real_gdp_growth", name: "Real GDP Growth" },
    { metricKey: "cpi_inflation", name: "CPI Inflation" },
    { metricKey: "public_sector_net_debt", name: "Public Sector Net Debt" },
    { metricKey: "business_investment", name: "Business Investment" },
  ],
  Employment: [
    { metricKey: "inactivity_rate", name: "Inactivity Rate" },
    { metricKey: "real_wage_growth", name: "Real Wage Growth" },
    { metricKey: "job_vacancy_ratio", name: "Job Vacancy Ratio" },
    { metricKey: "underemployment", name: "Underemployment" },
    { metricKey: "sickness_absence", name: "Sickness Absence" },
  ],
  Education: [
    { metricKey: "attainment8", name: "Attainment 8 Score" },
    { metricKey: "teacher_vacancy_rate", name: "Teacher Vacancies" },
    { metricKey: "neet_rate", name: "NEET Rate (16-24)" },
    { metricKey: "persistent_absence", name: "Persistent Absence" },
    { metricKey: "apprentice_starts", name: "Apprentice Starts" },
  ],
  Crime: [
    { metricKey: "recorded_crime_rate", name: "Total Recorded Crime" },
    { metricKey: "charge_rate", name: "Charge Rate %" },
    { metricKey: "perception_of_safety", name: "Perception of Safety" },
    { metricKey: "crown_court_backlog", name: "Crown Court Backlog" },
    { metricKey: "reoffending_rate", name: "Reoffending Rate" },
  ],
  Healthcare: [
    { metricKey: "a_e_wait_time", name: "A&E 4-Hour Wait %" },
    { metricKey: "elective_backlog", name: "Elective Backlog" },
    { metricKey: "ambulance_response_time", name: "Ambulance (Cat 2)" },
    { metricKey: "gp_appt_access", name: "GP Appt. Access" },
    { metricKey: "staff_vacancy_rate", name: "Staff Vacancy Rate" },
  ],
  Defence: [
    { metricKey: "defence_spending_gdp", name: "Spend as % of GDP" },
    { metricKey: "personnel_strength", name: "Trained Strength" },
    { metricKey: "equipment_spend", name: "Equipment Spend" },
    { metricKey: "deployability", name: "Deployability %" },
    { metricKey: "equipment_readiness", name: "Force Readiness" },
  ],
  Population: [
    { metricKey: "natural_change", name: "Natural Change (Births vs Deaths)" },
    { metricKey: "old_age_dependency_ratio", name: "Old-Age Dependency Ratio" },
    { metricKey: "net_migration", name: "Net Migration (Long-term)" },
    { metricKey: "healthy_life_expectancy", name: "Healthy Life Expectancy" },
    { metricKey: "total_population", name: "Total Population" },
  ],
};
