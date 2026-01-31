/**
 * Tooltip text for dashboard metric cards.
 * Source: Updated Data Sources UK RAG - Updated Tool Tips.csv
 * Used with info icon on card, tooltip on hover.
 */

/** Economy section: metricKey -> tooltip text */
export const ECONOMY_TOOLTIPS: Record<string, string> = {
  output_per_hour: `Output per hour is the UK's primary measure of labour productivity, calculated by dividing the total economic output (GDP) by the total hours worked across the economy. The ONS calculates this by taking the chained volume measure of GDP and dividing it by the total actual hours worked in the reference period. It's expressed as an index (with a base year = 100) or as a percentage change. Higher productivity means workers are generating more value per hour, which is the fundamental driver of sustainable wage increases and living standard improvements. The UK has historically lagged behind peer economies like Germany, France, and the US on this measure—a phenomenon economists call the 'productivity puzzle.'

Data Source: ONS API: Series LZVD

Why it matters to you if it gets worse: Your wages won't keep up with the cost of living, making you permanently poorer. The UK is less competitive globally.`,
  real_gdp_growth: `Real GDP (Gross Domestic Product) Growth measures the percentage change in the total value of goods and services produced in the UK economy, adjusted for inflation. The ONS calculates this using the 'output approach' (summing value added across all industries), the 'expenditure approach' (consumption + investment + government spending + net exports), and the 'income approach' (wages + profits + rents). The 'real' adjustment strips out price changes using a GDP deflator, showing genuine economic expansion or contraction. Quarterly figures are seasonally adjusted to remove predictable patterns. Two consecutive quarters of negative growth officially constitutes a recession.

Data Source: ONS API: Series IHYP

Why it matters to you if it gets worse: A recession. Fewer jobs, lower business investment, and cuts to public services like schools and hospitals.`,
  cpi_inflation: `The Consumer Price Index (CPI) measures the average change in prices paid by consumers for a representative 'basket' of around 700 goods and services. The ONS collects approximately 180,000 price quotes monthly from retailers across the UK, weighting items by their share of typical household spending (e.g., housing costs are weighted more heavily than cinema tickets). The index is calculated using a geometric mean formula that accounts for consumer substitution behaviour. CPI is expressed as an annual percentage change—if CPI is 3%, prices are on average 3% higher than 12 months ago. The Bank of England targets 2% CPI inflation as optimal for economic stability.

Data Source: ONS API: Series D7G7

Why it matters to you if it gets worse: Your weekly shopping bill and energy costs spiral upwards, rapidly eroding the value of your savings and paycheque.`,
  public_sector_net_debt: `Public Sector Net Debt (PSND) measures the total amount the government owes to external creditors minus its liquid financial assets. It's calculated by summing all outstanding government bonds (gilts), National Savings products, and other borrowing instruments, then subtracting holdings of foreign exchange reserves and other liquid assets. The ONS expresses this as a percentage of GDP to contextualise the debt burden relative to the economy's ability to service it. The figure excludes public sector pension liabilities and Bank of England operations. As of recent years, UK PSND has exceeded 100% of GDP—levels not seen since the post-WWII period.

Data Source: ONS API: Series HF6X

Why it matters to you if it gets worse: Higher taxes (income or VAT) and/or future cuts to essential public services to pay the national credit card bill.`,
  business_investment: `Business Investment measures the total capital expenditure by private sector companies on assets that will be used for future production—including machinery, equipment, buildings, vehicles, and intellectual property (like software and R&D). The ONS calculates this through quarterly surveys of businesses and administrative data, expressing it in chained volume measures to remove inflation effects. It's a subset of Gross Fixed Capital Formation (GFCF) that excludes government and household investment. This metric is a leading indicator of corporate confidence: when businesses invest, they're betting on future UK economic conditions being favourable for returns.

Data Source: ONS API: Series NPEL

Why it matters to you if it gets worse: Fewer new factories, offices, and R&D labs, leading to slower job creation and a stagnant, low-tech economy.`,
};

export function getEconomyTooltip(metricKey: string): string | undefined {
  return ECONOMY_TOOLTIPS[metricKey];
}

/** Employment section: metricKey -> tooltip text */
export const EMPLOYMENT_TOOLTIPS: Record<string, string> = {
  inactivity_rate: `The Economic Inactivity Rate measures the percentage of the working-age population (16-64) who are neither employed nor actively seeking work—making them 'economically inactive.' The ONS calculates this through the Labour Force Survey (LFS), a rolling quarterly survey of approximately 80,000 households. Inactive individuals include students, those looking after family, the long-term sick or disabled, early retirees, and discouraged workers. Unlike unemployment (which counts those actively job-seeking), inactivity captures the 'hidden' labour supply. Post-pandemic, the UK has seen a concerning rise in inactivity due to long-term sickness, particularly among the 50-64 age group.

Data Source: ONS API: Series LF2S

Why it matters to you if it gets worse: Fewer people paying tax to fund the NHS and state pensions, putting a greater tax burden on the working population.`,
  real_wage_growth: `Real Wage Growth measures the change in average earnings after adjusting for inflation, showing whether workers' purchasing power is actually increasing. The ONS calculates this by taking Average Weekly Earnings (AWE) data—collected from around 9,000 employers covering 14 million employees—and deflating it by CPI or CPIH inflation. The result shows the 'real' percentage change in what workers can actually buy with their wages. Positive real wage growth means living standards are rising; negative means workers are getting poorer despite nominal pay increases. The UK experienced historically rare prolonged periods of negative real wage growth following both the 2008 financial crisis and the 2022 inflation spike.

Data Source: ONS API: Series A3WW

Why it matters to you if it gets worse: You are working harder just to afford the same lifestyle, or worse, falling behind financially year after year.`,
  job_vacancy_ratio: `The Job Vacancy Ratio measures the number of unfilled job vacancies per 100 employee jobs in the economy, indicating the tightness of the labour market. The ONS calculates this using the Vacancy Survey, which samples approximately 6,000 businesses monthly, combined with employee jobs data. A high ratio indicates labour shortages—more positions than available workers—while a low ratio suggests slack in the labour market. The ratio spiked to historic highs post-pandemic as businesses struggled to recruit following Brexit-related migration changes and workers leaving certain sectors permanently. Sectoral breakdowns reveal particular shortages in hospitality, healthcare, and logistics.

Data Source: ONS API: Series AP2Y

Why it matters to you if it gets worse: Businesses cannot hire staff, leading to worse customer service, long waits (e.g., at restaurants, airports), and higher prices.`,
  underemployment: `Underemployment measures the percentage of employed workers who want to work more hours than they currently have. The ONS calculates this through the Labour Force Survey by identifying workers who: (a) are working part-time but want full-time work, or (b) want additional hours in their current role. It's expressed as a percentage of total employment. This metric captures 'hidden' labour market slack that unemployment figures miss—someone working 10 hours a week counts as 'employed' but may be struggling financially. High underemployment often indicates an economy creating low-quality, insecure jobs rather than stable full-time positions. Zero-hours contracts and the gig economy have contributed to this measure.

Data Source: ONS API: Series I7C4

Why it matters to you if it gets worse: People who want full-time work are stuck with part-time or zero-hour contracts, making it impossible to budget or afford major purchases like a house.`,
  sickness_absence: `The Sickness Absence Rate measures the percentage of total working hours lost to employee sickness or injury. The ONS calculates this annually using Labour Force Survey data, asking respondents whether they had any time off work due to illness in the reference week and for how long. The rate is calculated as: (hours lost to sickness ÷ total usual hours) × 100. Data is broken down by sector, age, sex, and cause of absence. Common causes include minor illnesses (colds, flu), musculoskeletal problems (back pain), and increasingly, mental health conditions (stress, anxiety, depression). The metric is a proxy for workforce health and can indicate broader public health trends.

Data Source: ONS: Sickness absence in UK

Why it matters to you if it gets worse: More disruption at work, leading to lower productivity for everyone and potential delays or losses for your employer/business.`,
};

export function getEmploymentTooltip(metricKey: string): string | undefined {
  return EMPLOYMENT_TOOLTIPS[metricKey];
}

/** Education section: metricKey -> tooltip text */
export const EDUCATION_TOOLTIPS: Record<string, string> = {
  attainment8: `Attainment 8 measures the average achievement of pupils across 8 qualifications at Key Stage 4 (GCSEs, typically age 16). The Department for Education calculates this by summing points for each pupil's 8 qualifying subjects: English (double-weighted), Maths (double-weighted), 3 English Baccalaureate subjects (sciences, languages, humanities), and 3 further approved qualifications. Grade 9 = 9 points, Grade 1 = 1 point, U = 0. The maximum score is 90 (9×8 + double weighting). National and school-level averages are published annually. Attainment 8 replaced the previous '5 A*-C including English and Maths' measure to provide a broader picture of achievement across the ability range and reduce focus on the C/D borderline.

Data Source: DfE: KS4 Performance

Why it matters to you if it gets worse: Future generations lack the basic skills needed for higher education or skilled jobs, limiting their career prospects and national productivity.`,
  teacher_vacancy_rate: `Teacher Vacancies measures the number and rate of unfilled teaching positions across state-funded schools in England. The Department for Education calculates this from the annual School Workforce Census, conducted each November, where schools report posts that are vacant or temporarily filled. The vacancy rate is: (vacancies ÷ total posts) × 100. Data is broken down by phase (primary/secondary), subject, and region. Certain subjects face acute shortages: physics, computing, modern foreign languages, and design technology regularly recruit below target. High vacancy rates correlate with increased class sizes, subject non-availability, and reliance on non-specialist or supply teachers. Retention is equally problematic, with significant proportions leaving within 5 years.

Data Source: DfE: School Workforce

Why it matters to you if it gets worse: Class sizes increase, subjects are dropped, and your child's education suffers due to relying on non-specialist or temporary staff.`,
  neet_rate: `The NEET Rate measures the percentage of young people aged 16-24 who are Not in Education, Employment, or Training. The ONS calculates this from the Labour Force Survey, identifying individuals in this age group who are neither: (a) in any form of education or training (full-time, part-time, formal, or informal), nor (b) in employment (including self-employment). The rate is expressed as: (NEET young people ÷ total 16-24 population) × 100. NEET status is a major social indicator, strongly associated with poor long-term outcomes including lower lifetime earnings, worse health, and higher welfare dependency. The measure is broken down by age bands (16-17, 18-24) since compulsory education/training applies to 16-17 year-olds.

Data Source: ONS: Young People NEET

Why it matters to you if it gets worse: A wasted generation who are not contributing to the economy and are at higher risk of long-term poverty, social exclusion, and crime.`,
  persistent_absence: `Persistent Absence measures the percentage of pupils who miss 10% or more of their possible school sessions (typically 38+ sessions per year, where one session = half a day). The Department for Education calculates this from termly school census returns, which record authorised absences (illness, appointments, religious observance) and unauthorised absences (truancy, holidays in term time). A pupil crossing the 10% threshold is classified as 'persistently absent.' Chronic absence severely impacts educational outcomes—missing 10% equates to approximately 19 school days or nearly 4 weeks. Post-pandemic persistent absence rates roughly doubled, with particular increases among disadvantaged pupils and those with special educational needs.

Data Source: DfE: Pupil Absence

Why it matters to you if it gets worse: Students fall behind, increasing social inequality, and leading to anti-social behaviour issues in the community.`,
  apprentice_starts: `Apprenticeship Starts measures the number of people beginning an apprenticeship programme in England during the academic year. The Department for Education calculates this from Individualised Learner Records submitted by training providers, counting new starts on approved apprenticeship frameworks or standards. Data is broken down by level (Intermediate/Level 2, Advanced/Level 3, Higher/Level 4-5, Degree/Level 6-7), sector, age, and employer size. The Apprenticeship Levy (0.5% of payroll for employers with £3m+ wage bills) funds the system. Starts declined significantly following levy introduction in 2017, with particular drops in lower-level and SME apprenticeships, while higher-level (often management) apprenticeships grew—raising concerns about whether the system serves its original purpose.

Data Source: DfE: Apprenticeships & Training

Why it matters to you if it gets worse: A shortage of plumbers, electricians, builders, and mechanics, making it harder and more expensive to hire a skilled tradesperson.`,
};

export function getEducationTooltip(metricKey: string): string | undefined {
  return EDUCATION_TOOLTIPS[metricKey];
}

/** Crime section: metricKey -> tooltip text */
export const CRIME_TOOLTIPS: Record<string, string> = {
  recorded_crime_rate: `Total Recorded Crime measures the number of offences recorded by the 43 police forces in England and Wales according to the Home Office Counting Rules (HOCR). Police record crimes when reported by the public or discovered through police activity, following strict definitions for each offence type. Data is submitted to the Home Office and published quarterly by the ONS. The total includes violence against the person, sexual offences, robbery, theft, criminal damage, drug offences, and other categories. Importantly, recorded crime reflects both actual crime levels AND reporting/recording practices—increased confidence in police can paradoxically increase recorded crime. The Crime Survey for England and Wales (CSEW) provides a complementary victim-based measure.

Data Source: ONS: Crime in England & Wales

Why it matters to you if it gets worse: You and your neighbours are more likely to become victims of theft, violence, or fraud.`,
  charge_rate: `The Charge Rate (also called Detection Rate or Outcome Rate) measures the percentage of recorded crimes that result in a suspect being charged or summonsed to court. The Home Office calculates this from police-recorded 'crime outcomes' data: (crimes resulting in charge/summons ÷ total crimes recorded) × 100. Other outcomes include out-of-court disposals (cautions, penalty notices), cases where the suspect is identified but not prosecuted (e.g., victim withdraws), and cases with no suspect identified. The charge rate has declined significantly over the past decade, falling from around 15% to under 6% for many crime types. Theft and burglary charge rates are particularly low (often under 5%), contributing to perceptions of consequence-free offending.

Data Source: Gov.uk: Crime Outcomes

Why it matters to you if it gets worse: Criminals feel safe to commit crimes because they know the police are unlikely to catch them, eroding trust in law enforcement.`,
  perception_of_safety: `Perception of Safety measures public feelings about crime and personal safety, derived from the Crime Survey for England and Wales (CSEW)—a large-scale household survey of approximately 35,000 adults annually. The ONS asks standardised questions including 'How safe do you feel walking alone in your area after dark?' with responses on a scale from 'very safe' to 'very unsafe.' Results are expressed as percentages feeling safe/unsafe and can be broken down by demographics, area type, and victimisation experience. This subjective measure often diverges from objective crime statistics—the 'fear of crime' can exceed actual risk, influenced by media coverage, local environmental factors, and personal vulnerability. Both high crime AND high fear of crime reduce quality of life.

Data Source: ONS: Crime Survey (CSEW)

Why it matters to you if it gets worse: You feel less safe walking alone at night, restricting your freedom and reducing community life in your area.`,
  crown_court_backlog: `The Crown Court Backlog measures the number of outstanding (untried) cases waiting to be heard in Crown Courts, which handle serious criminal matters including murder, rape, robbery, and either-way offences. The Ministry of Justice calculates this from the Common Platform and XHIBIT case management systems, counting cases where a defendant has been sent/committed for trial but the trial has not yet concluded. The backlog is reported as a total caseload and median waiting time (weeks from sending to completion). COVID-19 court closures caused the backlog to exceed 60,000 cases—approximately double pre-pandemic levels. Cases involving custody time limits create particular pressure, as defendants may be released if trials are delayed too long.

Data Source: MoJ: Criminal Court Stats

Why it matters to you if it gets worse: Victims wait years for justice, and accused individuals (guilty or innocent) face extreme stress and delays in their lives.`,
  reoffending_rate: `The Proven Reoffending Rate measures the percentage of offenders who commit a further offence within one year of release from custody or starting a community order, where that offence is subsequently proven by a court conviction or caution. The Ministry of Justice calculates this from the Police National Computer, tracking a cohort of offenders and matching them to subsequent proven offences. The rate is expressed as: (reoffenders ÷ total cohort) × 100, with an additional measure of 'frequency' (average reoffences per reoffender). Short prison sentences have particularly high reoffending rates (over 50%), raising questions about rehabilitation effectiveness. The metric has a significant time lag (approximately 18 months) due to court processing times.

Data Source: MoJ: Proven Reoffending

Why it matters to you if it gets worse: The same criminals are released and commit more crimes, meaning the prison system is failing to protect the public.`,
};

export function getCrimeTooltip(metricKey: string): string | undefined {
  return CRIME_TOOLTIPS[metricKey];
}

/** Healthcare section: metricKey -> tooltip text */
export const HEALTHCARE_TOOLTIPS: Record<string, string> = {
  a_e_wait_time: `The A&E 4-Hour Wait percentage measures the proportion of patients attending Accident & Emergency departments who are admitted, transferred, or discharged within 4 hours of arrival. NHS England calculates this from mandatory returns submitted by all Type 1 (major A&E), Type 2 (specialist), and Type 3 (minor injury units) departments. The operational standard target is 95% of patients within 4 hours. Performance is calculated as: (patients seen within 4 hours ÷ total attendances) × 100. This metric is considered the best single proxy for overall NHS 'flow'—when hospitals are full and cannot discharge patients, A&E backs up. Performance has declined significantly since 2015, with the 95% target not met nationally for years.

Data Source: NHS England: A&E Attendances

Why it matters to you if it gets worse: If you or a loved one have a medical emergency, you face dangerous delays sitting on a trolley, as there are no beds available.`,
  elective_backlog: `The Elective Backlog (RTT Waiting List) measures the total number of patients waiting to start consultant-led elective (non-emergency) treatment. NHS England calculates this from mandatory monthly returns from all NHS trusts, counting 'incomplete pathways'—patients referred by their GP who are still waiting for their first definitive treatment. The Referral to Treatment (RTT) standard states 92% of patients should wait no longer than 18 weeks. The backlog is reported as a total number and broken down by waiting time bands (0-18 weeks, 18-52 weeks, 52+ weeks). Post-pandemic, the backlog exceeded 7 million pathways—an unprecedented level representing roughly 1 in 8 of the English population.

Data Source: NHS England: RTT Waiting Times

Why it matters to you if it gets worse: Waiting years for necessary operations (like hip replacements or cataracts), leading to prolonged pain, disability, or inability to work.`,
  ambulance_response_time: `Category 2 Ambulance Response Time measures how quickly ambulances respond to emergency calls classified as 'Category 2'—serious conditions requiring rapid assessment and transport, such as suspected strokes, heart attacks, and severe breathing difficulties. NHS England calculates the mean (average) and 90th percentile response times from 999 call connection to ambulance arrival. The national standard is a mean response of 18 minutes and 90th percentile of 40 minutes. Data comes from Computer Aided Dispatch systems across all 10 English ambulance trusts. Category 2 represents approximately 60% of all emergency ambulance calls. Response times have significantly deteriorated, with means often exceeding 30-40 minutes in winter pressures.

Data Source: NHS England: Ambulance Quality

Why it matters to you if it gets worse: Critical, time-sensitive emergencies take too long to respond to, potentially resulting in permanent damage or death.`,
  gp_appt_access: `GP Appointment Access measures the percentage of GP appointments that take place within 14 days of booking. NHS Digital calculates this from the General Practice Appointment Data (GPAD) collected from GP practice systems across England, covering approximately 30 million appointments monthly. The metric is calculated as: (appointments occurring within 14 days of booking ÷ total appointments) × 100. Data excludes COVID vaccinations and some specialist clinics. This metric indicates primary care accessibility—the 'front door' of the NHS. Poor GP access has knock-on effects as patients present to A&E for conditions that could have been managed earlier. The government target is for patients to see a GP within 2 weeks.

Data Source: NHS Digital: Appointments in GP

Why it matters to you if it gets worse: You can't see your family doctor when you need to, forcing minor issues into already overwhelmed A&E departments.`,
  staff_vacancy_rate: `The NHS Staff Vacancy Rate measures the percentage of funded full-time equivalent (FTE) positions that are unfilled across NHS trusts. NHS Digital calculates this quarterly using the NHS Vacancy Statistics: (vacant posts ÷ total funded establishment) × 100. Data is broken down by staff group (nurses, doctors, allied health professionals, etc.) and by region/trust. A 'vacancy' is a funded position actively being recruited to. High vacancy rates indicate recruitment and retention problems, often leading to expensive agency staff usage, increased workload on existing staff, and potential service reductions. Nursing vacancies have been persistently high (10%+), with some specialties like mental health nursing exceeding 15%.

Data Source: NHS Digital: Vacancies in NHS

Why it matters to you if it gets worse: Less dedicated care for patients, burned-out staff making more errors, and entire departments struggling to function safely.`,
};

export function getHealthcareTooltip(metricKey: string): string | undefined {
  return HEALTHCARE_TOOLTIPS[metricKey];
}

/** Defence section: metricKey -> tooltip text */
export const DEFENCE_TOOLTIPS: Record<string, string> = {
  defence_spending_gdp: `Defence Spending as a Percentage of GDP measures the UK's total military expenditure relative to the size of its economy. The Ministry of Defence calculates this using NATO-agreed definitions of defence spending (which include military pensions, war pensions, and some intelligence spending not in the core MOD budget) divided by nominal GDP from ONS figures. The percentage is expressed as: (total defence spending ÷ GDP) × 100. The NATO target of 2% GDP was set at the 2014 Wales Summit. Calculation methodology matters—different definitions can shift the figure by 0.1-0.2%. Real-terms spending (adjusted for inflation) and per-capita spending provide additional context. The UK has typically hovered around the 2% threshold, though recent commitments aim for 2.5%.

Data Source: MOD: Finance & Economics

Why it matters to you if it gets worse: The UK's influence on the world stage decreases, making it less able to protect its citizens and interests abroad or deter foreign threats.`,
  personnel_strength: `Trained Strength measures the total number of fully trained military personnel across the British Army, Royal Navy, and Royal Air Force who have completed their initial training and are available for operational deployment. The MOD publishes quarterly statistics counting Regular Forces personnel who have passed relevant trade training. The figure excludes untrained recruits, reservists (reported separately), and civilian staff. Trained Strength is measured against 'Requirement' (the established need) to show manning balance. All three services have consistently undershot recruitment targets while outflow (personnel leaving) has increased, creating structural undermanning. The Army has been particularly affected, shrinking to its smallest size since Napoleonic times.

Data Source: MOD: Service Personnel Stats

Why it matters to you if it gets worse: The armed forces cannot cover all necessary tasks (e.g., peace-keeping, disaster relief, conflict), leaving the nation vulnerable.`,
  equipment_spend: `Equipment Spending measures the MOD's capital expenditure on military hardware, divided into 'Equipment Procurement' (new platforms, weapons systems, vehicles) and 'Equipment Support' (maintenance, upgrades, spares). Data comes from MOD annual reports and the Equipment Plan, a 10-year costed programme. The balance between procurement and support indicates whether forces are modernising or merely sustaining legacy systems. Major programmes (aircraft carriers, F-35s, Dreadnought submarines) span decades and billions of pounds. The Equipment Plan has repeatedly been assessed by the NAO as unaffordable within allocated budgets, requiring capability cuts or delays. 'Hollowing out'—maintaining platforms without sufficient munitions, spare parts, or trained personnel—is a persistent risk.

Data Source: MOD: Trade & Contracts

Why it matters to you if it gets worse: Military forces are left using outdated equipment, putting personnel at risk and making the UK incapable of fighting a modern war effectively.`,
  deployability: `Deployability Rate measures the percentage of military personnel who are medically and administratively cleared for operational deployment. The MOD calculates this from the Joint Personnel Administration (JPA) system, categorising personnel as: 'Medically Fully Deployable' (MFD), 'Medically Limited Deployability' (MLD), or 'Medically Non-Deployable' (MND). The rate is: (MFD personnel ÷ total trained strength) × 100. Non-deployable personnel may have temporary restrictions (injury recovery) or permanent ones (chronic conditions). High rates of mental health conditions, musculoskeletal problems, and chronic illness can significantly reduce the deployable proportion. A service might have 80,000 trained personnel but only 70,000 actually available to deploy—a critical distinction for operational planning.

Data Source: MOD: Health & Wellbeing

Why it matters to you if it gets worse: The UK has fewer available personnel to respond to a crisis, even if the total headcount seems high on paper.`,
  equipment_readiness: `Force Readiness measures the percentage of high-priority military assets (ships, aircraft, vehicles, units) that are available for immediate operational deployment at required notice. The MOD assesses this against 'readiness levels'—how quickly forces can deploy (days to months). Readiness is affected by maintenance cycles, spare parts availability, trained crew numbers, and equipment serviceability. Data is partially classified, but aggregate assessments appear in Annual Reports and Defence Committee evidence. 'Availability' rates for major platforms (e.g., Type 45 destroyers, Typhoon aircraft) indicate whether the notional fleet strength translates to actual capability. Readiness gaps mean even if the UK owns an asset, it cannot necessarily use it when needed.

Data Source: MOD: Annual Reports

Why it matters to you if it gets worse: Critical assets needed for immediate response (like fighter jets or aircraft carriers) are stuck in maintenance or unserviceable when a crisis hits.`,
};

export function getDefenceTooltip(metricKey: string): string | undefined {
  return DEFENCE_TOOLTIPS[metricKey];
}

/** Population section: metricKey -> tooltip text */
export const POPULATION_TOOLTIPS: Record<string, string> = {
  natural_change: `Natural Change measures the difference between live births and deaths in a given period, indicating whether the population is growing or shrinking from demographic factors alone (excluding migration). The ONS calculates this from civil registration data: Natural Change = Births − Deaths. A positive figure means more births than deaths (natural increase); negative means more deaths than births (natural decrease). The UK's natural change has declined dramatically—from +200,000+ annually in the 2000s to near-zero or negative in recent years. This reflects falling birth rates (Total Fertility Rate now ~1.5 children per woman, well below the 2.1 replacement level) combined with an ageing population producing more deaths. Some regions and countries within the UK already show natural decrease.

Data Source: ONS: Vital Statistics / Series VVHM

Why it matters to you if it gets worse: The local population shrinks, leading to school closures, fewer shops, and a gradual decline of rural and local communities.`,
  old_age_dependency_ratio: `The Old-Age Dependency Ratio measures the number of people aged 65 and over per 1,000 people of working age (16-64). The ONS calculates this from mid-year population estimates and projections: (Population 65+ ÷ Population 16-64) × 1,000. A ratio of 300 means 300 retirees per 1,000 workers, or roughly 1 retiree per 3 workers. The ratio is rising due to increased life expectancy and lower birth rates—it's projected to exceed 400 by 2050. This metric indicates the 'support burden' on the working population: fewer workers funding more pensioners' state pensions, healthcare, and social care through taxation. Higher ratios put pressure on public finances and may require raising pension ages, increasing taxes, or reducing benefits.

Data Source: ONS API: Population Projections

Why it matters to you if it gets worse: A tiny workforce must fund the pensions and healthcare for a huge number of retirees, leading to massive tax hikes or benefit cuts.`,
  net_migration: `Long-Term International Migration (LTIM) Net Migration measures the difference between people immigrating to the UK (for 12+ months) and those emigrating from the UK (for 12+ months). The ONS calculates this primarily from administrative data (visa records, National Insurance registrations, GP registrations) combined with survey data: Net Migration = Immigration − Emigration. Positive net migration means more arrivals than departures. Since the 2000s, net migration has become the primary driver of UK population growth as natural change declined. Annual net migration has varied from ~150,000 to over 700,000, influenced by EU freedom of movement, points-based immigration policy, humanitarian crises (Ukraine, Hong Kong), and student visa numbers. The metric is highly politically sensitive.

Data Source: ONS API: Series BBGM

Why it matters to you if it gets worse: A rapid decline in the working-age population needed to fill essential jobs in the NHS, social care, and other key sectors.`,
  healthy_life_expectancy: `Healthy Life Expectancy (HLE) measures the average number of years a person can expect to live in 'good' or 'very good' health, based on self-reported health status. The ONS calculates this using the Sullivan method, combining mortality data (life tables) with health prevalence data from the Annual Population Survey. HLE is lower than total Life Expectancy—the gap represents years lived in poor health. In England, HLE at birth is approximately 63 years for both sexes, while total LE is ~80 years, meaning ~17 years are typically spent in poor health. Significant inequalities exist: the most deprived areas have HLE roughly 19 years lower than the least deprived. HLE has stagnated or declined in recent years, particularly for women and disadvantaged groups.

Data Source: ONS: Health State Life Expectancy

Why it matters to you if it gets worse: You spend a greater proportion of your final years in poor health, becoming dependent on family and straining the NHS/care system.`,
  total_population: `Total Population measures the number of usual residents in the UK at a given point, typically reported as mid-year estimates (30 June). The ONS calculates this by starting with the most recent Census count, then annually updating using the 'cohort component method': adding births and inward migration, subtracting deaths and outward migration. Estimates are produced for the UK total and broken down by country (England, Scotland, Wales, Northern Ireland), local authority, age, and sex. Population projections extend these trends into the future under various assumptions. The UK population is approximately 67 million and growing slowly, primarily through net migration. Population distribution matters as much as total—some areas grow rapidly while others decline.

Data Source: ONS: Total Population

Why it matters to you if it gets worse: (Note: A shrinking population slows economic growth, while a rapidly growing population strains housing and infrastructure.)`,
};

export function getPopulationTooltip(metricKey: string): string | undefined {
  return POPULATION_TOOLTIPS[metricKey];
}
