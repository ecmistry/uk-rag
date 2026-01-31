/**
 * Tooltip text for dashboard metric cards.
 * Source: Updated Data Sources UK RAG - Sheet2.csv ("Why it matters to you if it gets worse").
 * Used with QUERY_INFO_PATTERN: info icon on card, tooltip on hover.
 */

/** Economy section: metricKey -> tooltip text */
export const ECONOMY_TOOLTIPS: Record<string, string> = {
  output_per_hour:
    "Why it matters to you if it gets worse: Your wages won't keep up with the cost of living, making you permanently poorer. The UK is less competitive globally.",
  real_gdp_growth:
    "Why it matters to you if it gets worse: A recession. Fewer jobs, lower business investment, and cuts to public services like schools and hospitals.",
  cpi_inflation:
    "Why it matters to you if it gets worse: Your weekly shopping bill and energy costs spiral upwards, rapidly eroding the value of your savings and paycheque.",
  public_sector_net_debt:
    "Why it matters to you if it gets worse: Higher taxes (income or VAT) and/or future cuts to essential public services to pay the national credit card bill.",
  business_investment:
    "Why it matters to you if it gets worse: Fewer new factories, offices, and R&D labs, leading to slower job creation and a stagnant, low-tech economy.",
};

export function getEconomyTooltip(metricKey: string): string | undefined {
  return ECONOMY_TOOLTIPS[metricKey];
}

/** Employment section: metricKey -> tooltip text */
export const EMPLOYMENT_TOOLTIPS: Record<string, string> = {
  inactivity_rate:
    "Why it matters to you if it gets worse: Fewer people paying tax to fund the NHS and state pensions, putting a greater tax burden on the working population.",
  real_wage_growth:
    "Why it matters to you if it gets worse: You are working harder just to afford the same lifestyle, or worse, falling behind financially year after year.",
  job_vacancy_ratio:
    "Why it matters to you if it gets worse: Businesses cannot hire staff, leading to worse customer service, long waits (e.g., at restaurants, airports), and higher prices.",
  underemployment:
    "Why it matters to you if it gets worse: People who want full-time work are stuck with part-time or zero-hour contracts, making it impossible to budget or afford major purchases like a house.",
  sickness_absence:
    "Why it matters to you if it gets worse: More disruption at work, leading to lower productivity for everyone and potential delays or losses for your employer/business.",
};

export function getEmploymentTooltip(metricKey: string): string | undefined {
  return EMPLOYMENT_TOOLTIPS[metricKey];
}

/** Education section: metricKey -> tooltip text */
export const EDUCATION_TOOLTIPS: Record<string, string> = {
  attainment8:
    "Why it matters to you if it gets worse: Future generations lack the basic skills needed for higher education or skilled jobs, limiting their career prospects and national productivity.",
  teacher_vacancy_rate:
    "Why it matters to you if it gets worse: Class sizes increase, subjects are dropped, and your child's education suffers due to relying on non-specialist or temporary staff.",
  neet_rate:
    "Why it matters to you if it gets worse: A wasted generation who are not contributing to the economy and are at higher risk of long-term poverty, social exclusion, and crime.",
  persistent_absence:
    "Why it matters to you if it gets worse: Students fall behind, increasing social inequality, and leading to anti-social behaviour issues in the community.",
  apprentice_starts:
    "Why it matters to you if it gets worse: A shortage of plumbers, electricians, builders, and mechanics, making it harder and more expensive to hire a skilled tradesperson.",
};

export function getEducationTooltip(metricKey: string): string | undefined {
  return EDUCATION_TOOLTIPS[metricKey];
}

/** Crime section: metricKey -> tooltip text */
export const CRIME_TOOLTIPS: Record<string, string> = {
  recorded_crime_rate:
    "Why it matters to you if it gets worse: You and your neighbours are more likely to become victims of theft, violence, or fraud.",
  charge_rate:
    "Why it matters to you if it gets worse: Criminals feel safe to commit crimes because they know the police are unlikely to catch them, eroding trust in law enforcement.",
  perception_of_safety:
    "Why it matters to you if it gets worse: You feel less safe walking alone at night, restricting your freedom and reducing community life in your area.",
  crown_court_backlog:
    "Why it matters to you if it gets worse: Victims wait years for justice, and accused individuals (guilty or innocent) face extreme stress and delays in their lives.",
  reoffending_rate:
    "Why it matters to you if it gets worse: The same criminals are released and commit more crimes, meaning the prison system is failing to protect the public.",
};

export function getCrimeTooltip(metricKey: string): string | undefined {
  return CRIME_TOOLTIPS[metricKey];
}

/** Healthcare section: metricKey -> tooltip text */
export const HEALTHCARE_TOOLTIPS: Record<string, string> = {
  a_e_wait_time:
    "Why it matters to you if it gets worse: If you or a loved one have a medical emergency, you face dangerous delays sitting on a trolley, as there are no beds available.",
  elective_backlog:
    "Why it matters to you if it gets worse: Waiting years for necessary operations (like hip replacements or cataracts), leading to prolonged pain, disability, or inability to work.",
  ambulance_response_time:
    "Why it matters to you if it gets worse: Critical, time-sensitive emergencies take too long to respond to, potentially resulting in permanent damage or death.",
  gp_appt_access:
    "Why it matters to you if it gets worse: You can't see your family doctor when you need to, forcing minor issues into already overwhelmed A&E departments.",
  staff_vacancy_rate:
    "Why it matters to you if it gets worse: Less dedicated care for patients, burned-out staff making more errors, and entire departments struggling to function safely.",
};

export function getHealthcareTooltip(metricKey: string): string | undefined {
  return HEALTHCARE_TOOLTIPS[metricKey];
}

/** Defence section: metricKey -> tooltip text */
export const DEFENCE_TOOLTIPS: Record<string, string> = {
  defence_spending_gdp:
    "Why it matters to you if it gets worse: The UK's influence on the world stage decreases, making it less able to protect its citizens and interests abroad or deter foreign threats.",
  personnel_strength:
    "Why it matters to you if it gets worse: The armed forces cannot cover all necessary tasks (e.g., peace-keeping, disaster relief, conflict), leaving the nation vulnerable.",
  equipment_spend:
    "Why it matters to you if it gets worse: Military forces are left using outdated equipment, putting personnel at risk and making the UK incapable of fighting a modern war effectively.",
  deployability:
    "Why it matters to you if it gets worse: The UK has fewer available personnel to respond to a crisis, even if the total headcount seems high on paper.",
  equipment_readiness:
    "Why it matters to you if it gets worse: Critical assets needed for immediate response (like fighter jets or aircraft carriers) are stuck in maintenance or unserviceable when a crisis hits.",
};

export function getDefenceTooltip(metricKey: string): string | undefined {
  return DEFENCE_TOOLTIPS[metricKey];
}

/** Population section: metricKey -> tooltip text */
export const POPULATION_TOOLTIPS: Record<string, string> = {
  natural_change:
    "Why it matters to you if it gets worse: The local population shrinks, leading to school closures, fewer shops, and a gradual decline of rural and local communities.",
  old_age_dependency_ratio:
    "Why it matters to you if it gets worse: A tiny workforce must fund the pensions and healthcare for a huge number of retirees, leading to massive tax hikes or benefit cuts.",
  net_migration:
    "Why it matters to you if it gets worse: A rapid decline in the working-age population needed to fill essential jobs in the NHS, social care, and other key sectors.",
  healthy_life_expectancy:
    "Why it matters to you if it gets worse: You spend a greater proportion of your final years in poor health, becoming dependent on family and straining the NHS/care system.",
  total_population:
    "Why it matters to you if it gets worse: (Note: A shrinking population slows economic growth, while a rapidly growing population strains housing and infrastructure.)",
};

export function getPopulationTooltip(metricKey: string): string | undefined {
  return POPULATION_TOOLTIPS[metricKey];
}
