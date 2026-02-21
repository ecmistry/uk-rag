/**
 * Tooltip text for dashboard metric cards.
 * Source: Updated Data Sources UK RAG - Updated Tool Tips.csv
 * Used with info icon on card, tooltip on hover.
 */

/** Economy section: metricKey -> tooltip text */
export const ECONOMY_TOOLTIPS: Record<string, string> = {
  output_per_hour: `Output per Hour (Labour Productivity) measures how much value the country creates for every hour of work put in.

Think of it like this - If you are baking a cake, you can get more cake in two ways:

Work longer: Spend 4 hours in the kitchen instead of 2.

Work smarter: Get a better mixer, a faster oven, or a more efficient recipe so you can bake the same cake in just 1 hour.

Output per Hour tracks the second option. It doesn't ask "Are we working hard?" (most people in the UK work very hard); it asks "Is our hard work actually paying off?" It reveals if our tools, technology, and systems are helping us produce more without simply burning ourselves out with more hours.

The Real-World Impact on You

Even though "Productivity" sounds like corporate jargon, it is a vitally important factor for your quality of life over the long term. The concept is that if companies make more money for the time they put in (greater productivity) this increase in money will be distributed to staff in the form of increased wages, thus increasing your quality of life. When you sum up this effect for a whole nation and a country becomes productive, the government collects more tax from the same amount of work. This money pays for new MRI machines in the NHS or better equipment in schools without having to hike your tax rates.

Why the RAG Thresholds were chosen

🟢 Green - Above 1.5% - This was the UK's average growth rate for decades before 2008. At this speed, living standards double every generation. It is considered the 'healthy' benchmark for advanced economies and is currently (as of 2025) where the USA is performing.

🟡 Amber - 0.5% – 1.5% - This is the "Sluggish" zone the UK has been stuck in since the 2008 crisis. It's enough to keep things ticking over, but not enough to significantly improve public services or raise real wages.

🔴 Red - Below 0.5% / Negative - This is a "Productivity Crisis." It means the country is essentially standing still or getting less efficient. In this zone, the only way to grow the economy is to make everyone work longer hours or bring in more people, which strains housing and infrastructure. This is dangerous territory as lack of productivity points to a lack of innovation, which over time, means you will be less competitive on a global stage and less likely to have well paid jobs in the advancing sectors of the global economy.`,
  real_gdp_growth: `Real GDP Growth measures the country's economic growth after stripping away the noise of rising prices (inflation).

Think of it as the "Size of the National Pie." GDP is the total value of everything the UK produces—every coffee sold, every car manufactured, and every hour of legal advice given.

"Real" means we've adjusted for inflation. If the pie looks 5% bigger just because prices went up by 5%, nobody is actually eating more. "Real" growth means there is actually more pie to go around. When the economy grows, it generally means businesses are selling more, which gives them the confidence to expand.

The Real-World Impact on You

Even though GDP feels like a number for billionaires and bankers, it dictates the "vibe" of your daily financial life in three major ways:

1. Job Security and "The Hiring Shield"

When GDP is growing, companies are usually making more profit. This acts as a shield for your job. When the pie is expanding, businesses look to hire more people to keep up with demand. If GDP is shrinking (a recession), businesses go into "survival mode," which often leads to pay freezes or redundancies.

2. Better Public Services (Without Tax Hikes)

A growing economy is the government's best friend. When people earn more and businesses sell more, the government automatically collects more tax (VAT, Income Tax, Corporation Tax). This allows them to spend more on schools, the NHS, and police without having to ask you for a higher percentage of your paycheck.

3. Consumer Confidence

Ever noticed how high-street shops seem busier and people seem more willing to book holidays when the news says the economy is "doing well"? That's the GDP effect. Growth creates a cycle of confidence: you feel safer in your job, so you spend a bit more; because you spend more, a local business survives and hires someone else, who then goes out and spends their new wage.

Why the RAG Thresholds were chosen:

🟢 Green - Above 2.0% - This is the "Prosperity Zone." Historically, the UK averaged around 2.2%–2.5% in the latter half of the 20th century. At this rate, the government can easily fund public services and debt interest while people feel a noticeable rise in their standard of living.

🟡 Amber - 0.5% – 1.5% - This is the "Stagnation Trap." For 2026, the UK is currently forecast to grow at about 1.2%. This is enough to stay out of a recession, but because the population is also growing, the "pie per person" barely changes. It feels like "running to stay in the same place."

🔴 Red - Below 0.5% / Negative - This is the "Recession Danger Zone." Growth this low is usually a sign that the economy is about to contract. It leads to rising unemployment and "fiscal black holes" where the government has to choose between massive borrowing or deep spending cuts.`,
  cpi_inflation: `Think of it as the "Cost of Living Ticker." To calculate it, the government tracks a giant "shopping basket" of over 700 items that a typical UK household buys—everything from a loaf of bread and a liter of petrol to Netflix subscriptions and smartwatches. Inflation is simply the percentage change in the total cost of that basket compared to one year ago.

The Real-World Impact on You

Inflation is often called the "hidden tax" because it affects your wealth without you ever seeing a bill. It hits the person on the street in three direct ways:

1. The "Shrinking Pound" (Purchasing Power)

When inflation is high, your money loses its "muscle." If inflation is 10%, a £100 shop last year now costs £110. If your bank account hasn't grown by that same amount, you are effectively poorer, even if the number on your screen hasn't changed. You are forced to buy fewer items or switch to cheaper brands.

2. The Interest Rate "Tug-of-War"

The Bank of England uses interest rates as a brake for inflation. If inflation is too high: They raise interest rates to make borrowing expensive and saving attractive. This cools down spending but means your mortgage payments or car loans get more expensive. If inflation is low: They can lower interest rates, making it cheaper for you to borrow and spend.

3. Savings Erosion

If you have £1,000 in a savings account earning 2% interest, but inflation is 5%, you are actually losing money. Your "real" return is -3%. Over several years, high inflation can quietly eat away the value of a house deposit or a retirement fund.

Why the RAG Thresholds were chosen:

🟢 Green - 1.5% – 2.5% This is the "Goldilocks Zone." It is low enough that prices feel stable, but high enough to avoid Deflation (falling prices), which can cause people to stop spending and lead to job losses.

🟡 Amber - 2.6% – 4.0% This is the "Warning Zone." In February 2026, the UK is sitting in this bracket (roughly 3.0%). It signals that the cost of living is rising faster than the target, putting pressure on the Bank of England to keep interest rates higher for longer.

🔴 Red - Above 4.0% OR Below 0% This is the "Crisis Zone." High inflation (as seen in 2022-23) causes rapid hardship. Conversely, negative inflation (Deflation) is a red flag for a deep economic depression. Both require urgent, aggressive intervention.`,
  public_sector_net_debt: `Public Sector Net Debt is the total amount of money the government has borrowed over the years that it hasn't paid back yet.

Think of the UK like a massive household. Every year, it has money coming in (mostly from our taxes) and money going out (spending on schools, hospitals, and police). If it spends more than it earns in a year, it has to use a "national credit card" to cover the gap. The debt is the total balance sitting on that credit card.

Why is this a valuable metric?
It tells us if the country is living within its means or if it is building up a bill that will be harder to pay later.

If the debt gets too high (into the "Red" zone), the government has to spend a huge portion of its income just paying off the interest on that credit card, rather than spending it on things we actually see and use. In 2026, the UK is expected to spend roughly £114 billion just on interest—that is money that isn't going to the NHS or schools.

Real impact on the "Person on the Street"

Even though you don't personally owe this debt, it affects your wallet and your life in three major ways:

1. The "Tax Tug-of-War"

When debt is high, the government has less "wiggle room." To pay the interest and keep the debt from spiralling, they often have to do one of two things:

Raise Taxes: You might see higher Income Tax or National Insurance, or "stealth taxes" like frozen tax thresholds (where you pay more as your wages rise).

Cut Spending: You might notice longer wait times for a GP, fewer potholes being fixed, or less funding for your local library.

2. Mortgage and Loan Rates

The "National Debt" sets the tone for all other borrowing. If lenders (big international banks) get nervous that the UK has too much debt, they will charge the government higher interest. This often ripples out into the economy, making it more expensive for you to get a mortgage, a car loan, or a business loan.

3. Protection Against "Rainy Days"

National debt is like a buffer. If a new crisis hits (like a pandemic or an energy spike), a country with low debt can easily borrow money to support its citizens (e.g., furlough schemes or energy bill support). A country already "maxed out" on its credit card might not be able to afford to help you when you need it most.

Summary for your Dashboard

When this metric is Green, the government has the "firepower" to invest in the future or lower your taxes. When it is Red, it means the country is in "survival mode"—prioritizing debt payments over the things that make your daily life better.

🟢 Green - < 70% - Returns the UK to the lower end of G7 debt levels; provides "crisis headroom."

🟡 Amber - 70% – 85% - Debt is high but "stable." Interest payments are high but not yet spiraling.

🔴 Red - > 85% - Psychological and market "danger zone." Violates current UK fiscal sustainability rules.`,
  business_investment: `In layman's terms, this is the "Reinvestment Rate." Imagine you run a delivery business. At the end of the year, you have a choice: you can take all your profit and spend it on a luxury holiday (Consumption), or you can use a portion of it to buy a new, faster van (Investment).

The "Level" (£) is just the price of the van.

The "% of GDP" is how much of your total income you are willing to sacrifice today to make sure your business is better tomorrow.

If the UK's investment as a % of GDP is high, it means we are prioritizing long-term strength over short-term spending.

How it is Calculated

This metric is a ratio of two major ONS data points: The Numerator (Business Investment): The ONS surveys ~24,500 businesses quarterly to see what they spent on "Fixed Assets." These are items that last more than one year, such as assembly line robots, fleet vehicles, software development (Intellectual Property), and new factories. The Denominator (GDP): The total value of all goods and services produced in the UK in that same period.

The Real-World Impact on You

When this percentage drops, the "Person on the Street" feels it as a slow decay of the world around them.

Stagnant Wages: If your employer only reinvests 5% of their income into new tech, you are stuck using old, slow tools. You can't become more productive, so the company can't afford to give you a "real" pay rise.

The "Rusting" High Street: Low investment means companies aren't building new facilities or upgrading shops. You see older equipment, slower service, and a general lack of innovation in the products you buy.

National Competitiveness: If French or American companies are reinvesting 13% of their GDP while the UK only does 9%, their products eventually become better and cheaper than ours. This leads to UK businesses closing and jobs being moved abroad.

Why the RAG Thresholds were chosen

🟢 Green - Above 12% - The Prosperity Zone: This matches the long-term average of high-performing economies like the US. At this level, the UK is actively modernizing and likely to see future wage growth.

🟡 Amber - 10% – 12% - The "Muddling Through" Zone: This is where the UK has sat for much of the last decade. It's enough to keep the lights on, but it isn't enough to "level up" the economy or fix the productivity crisis.

🔴 Red - Below 10% - The Decay Zone: In this zone, we aren't even replacing what is wearing out. This is a "Health Crisis" for the economy that leads to falling living standards in the years to follow.`,
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
