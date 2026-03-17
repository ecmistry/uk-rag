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
  inactivity_rate: `Think of this as the "Missing Workers" metric. It measures the percentage of people who are of working age but have dropped out of the workforce entirely. It is different from unemployment: an unemployed person is like someone standing on the sidelines of a football pitch, kit on, waiting to be subbed in. An "Inactive" person has left the stadium. They aren't working, and they aren't looking for work. This group includes students, retirees, and stay-at-home parents, but in 2026, the biggest concern for the UK is the millions of people who are inactive because they are too sick to work. If this number is high, the "engine" of the country is running on fewer cylinders.

How it is Calculated

The Office for National Statistics (ONS) calculates this using a massive ongoing study called the Labour Force Survey. They look at the total number of people in the UK aged between 16 and 64 and then subtract everyone who currently has a job and everyone who is actively looking for one. The people left over are classified as "Economically Inactive." The final metric is simply the percentage of the total working-age population that these "leftover" people represent. It provides a much more honest picture of the nation's health than the unemployment rate alone, because it captures those who have given up on finding work or are physically unable to do so.

Real Impact on the Person on the Street

When Inactivity is high, it hits your wallet and your daily life through "The Tax Squeeze." A smaller group of workers is left to generate the tax money needed to fund the entire country. If 1 in 5 people are inactive, the remaining 4 have to work harder and pay more to keep the NHS, schools, and pensions running. You also feel it through "Service Slowdowns"—it is the reason you see "Help Wanted" signs in every shop window and why it takes longer to get a GP appointment or a plumber. Finally, when long-term sickness is the main driver of inactivity it is a sign that the general health of your community is declining, which puts more pressure on the local services you rely on.

Why the RAG Thresholds were chosen:

The thresholds are based on the UK's "Sustainability Limit"—the point at which the number of workers can no longer comfortably support the number of non-workers.

🟢 Green - (Below 14%): This is the "Global Leader" zone. It matches Iceland's performance, indicating a society with world-class parental support, health rehabilitation, and flexible working that keeps almost the entire population active.

🟡 Amber - (14% – 20%): This is the "High Performance" zone. It's better than most of the G7 and represents a significant improvement for the UK. It signals that the country is successfully fixing its long-term sickness and childcare barriers.

🔴 Red - (Above 20%): This is the "Systemic Failure" zone. This would signal that the country is suffering from a deep health and labor crisis that puts it at a massive disadvantage compared to the world's most efficient economies.`,
  real_wage_growth: `Think of this as the "True Pay Rise" metric. It measures whether your paycheck is actually winning the race against the rising cost of living. If your boss gives you a 3% pay rise, but the price of milk, rent, and electricity has gone up by 5%, you are actually poorer than you were last year despite having more money in your bank account. "Real" wage growth only happens when your pay increases faster than inflation. It is the difference between feeling like you are getting ahead and feeling like you are running up a down-escalator.

How it is Calculated:

The Office for National Statistics (ONS) calculates this by taking the "Average Weekly Earnings" data (which they get from surveying thousands of UK businesses about what they pay their staff) and UK RAG then uses CPI Inflation data we collect to adjust for inflation. This essentially "strips away" the effect of price rises from your pay rise. If the resulting number is positive, peoples "purchasing power" has grown; if it is negative, peoples wages are "shrinking" in real terms, even if the number on your payslip has stayed the same or gone up slightly.

Real Impact on the Person on the Street:

When Real Wage Growth is positive, it feels like "Breathing Room." It means that after you've paid for your essentials—food, housing, and bills—you have more money left over for things that improve your life, like holidays, savings, or a meal out. When it is negative, you experience a "Cost of Living Squeeze." You find yourself making "triage" decisions at the supermarket, cancelling subscriptions, or dipping into savings just to cover the basics. Over several years, negative or flat real wage growth leads to a "standard of living crisis," where the nation feels poorer and more stressed, regardless of what the headline economic growth figures say.

Why the RAG Thresholds were chosen:

These thresholds are based on the need for the UK to recover from the "lost decade" of wage growth following the 2008 financial crisis.

🟢 Green - (Above 2.0%): This is the "Prosperity Zone." It represents a healthy, productive economy where workers are seeing a clear and meaningful improvement in their standard of living every single year.

🟡 Amber - (1.0% – 2.0%): This is the "Low Growth Zone." Most workers in 2026 find themselves here. It means you aren't falling behind, but you aren't significantly moving forward either. It feels like "standing still."

🔴 Red - (Below 1.0%): This is the "Squeeze Zone." Anything below 1.0% is too close to zero for comfort, and negative numbers represent an active decline in the nation's health. In this zone, the person on the street is becoming poorer in real-time.`,
  job_vacancy_ratio: `What it is in Layman's Terms:

Think of this as the "Help Wanted" in the shop front meter for the entire country. It measures how many empty jobs there are for every 100 filled ones. When this number is high, it's a "Job Hunter's Market"—you have the power to ask for better pay and perks because employers are desperate to hire. When it's low, it's an "Employer's Market"—openings are rare, and finding a new role or a promotion becomes much harder.

How it is Calculated:

The Office for National Statistics (ONS) calculates this by surveying around 6,000 businesses every month to count how many positions they are actively trying to fill (The Vacancy Survey). They then compare this number to the total number of "Workforce Jobs" (everyone currently employed). By dividing the vacancies by the total jobs and multiplying by 100, we get a simple ratio: the number of available openings for every 100 existing jobs. It provides a more accurate "vibe check" of the economy than unemployment because it shows the actual real-time demand for labor across all sectors.

Real Impact on the Person on the Street:

For you, this metric is about "Choice and Power." In a high-ratio economy like the Netherlands (which maintains a ratio of over 4% and considered the gold standard for mature economies), workers feel safe and confident; if they don't like their boss or their commute, they can move almost immediately. If this measure gets worse and moves toward amber and red you might feel "stuck" in your current role because there are fewer alternatives to jump to. For young people and graduates, a Red status means their first step onto the career ladder is much steeper and more competitive, often leading to people taking jobs they are overqualified for just to secure an income.

Why the RAG Thresholds were chosen:

These thresholds are calibrated against the Global Gold Standard (The Netherlands ~4.1%) to show how the UK compares to the world's most dynamic and efficient labor markets.

🟢 Green - (Above 3.5%): The "Growth Leader" zone. Matches the world's best-performing economies, where labor demand is consistently high and workers have maximum leverage for pay rises.

🟡 Amber - (2.5% – 3.5%): The "Competitive Zone." Represents a healthy, balanced advanced economy with a good level of opportunity and professional movement.

🔴 Red - (Below 2.5%): The "Stagnation Zone." This is a clear Red against global benchmarks, signaling a lack of economic "hunger" and a difficult environment for those seeking career progression.`,
  underemployment: `Think of this as the "Hidden Unemployment" metric. It doesn't look at people who are out of work, but at people who are already in work but are effectively being "wasted." It primarily captures "time-related underemployment"—people who are working part-time hours but desperately want and are available to work more. It is the difference between someone having "a job" and someone having "enough work" to actually pay their bills. When this number is high, it means the economy is full of "zombie roles" that don't provide a living wage, even if the headline unemployment figure looks good.

How it is Calculated:

This metric is calculated by identifying individuals who meet three specific criteria: they are currently in employment, they want to work more hours (either in their current job, a second job, or a new job), and they are available to start those extra hours within a short timeframe (usually two weeks). To turn this into a rate, the number of these "underemployed" people is divided by the total number of people currently in the labor force. This provides a percentage that shows the "slack" or unused capacity sitting inside the workforce that isn't being captured by standard unemployment figures.

Real Impact on the Person on the Street:

For the person on the street, high underemployment feels like "Financial Limbo." You are officially "employed," so you don't show up in the crisis headlines, but you aren't earning enough to cover your rent or rising food costs. It leads to the "Working Poor" phenomenon, where people are working multiple small jobs just to survive. In a healthy economy (Green), a part-time job is usually a choice (like for students or parents); in an underemployed economy (Red), part-time work is often a trap that leaves you with too much month at the end of your money. It also impacts mental health, as the constant search for more hours creates a permanent state of job insecurity and prevents long-term life planning.

Why the RAG Thresholds were chosen:

These thresholds are calibrated against "Gold Standard" mature, flexible labor markets (such as the Netherlands or the USA's "U-6" measure), where underemployment is historically kept low through high labor demand and efficient job matching.

🟢 Green (Below 5.5%): The "Global Leader" zone. This matches top-performing mature economies where labor markets are highly efficient. It indicates a "High-Quality" market where almost everyone in work is getting the amount of work they actually desire.

🟡 Amber (5.5% – 8.5%): The "Muddling Through" zone. This signals that while the economy is creating jobs, a significant minority of the workforce is "stuck" in roles that do not meet their financial needs, creating a drag on national productivity and spending power.

🔴 Red (Above 8.5%): The "Hidden Crisis" zone. At this level, the labor market is failing to provide adequate hours for a large portion of its workers. It signals a systemic issue where jobs exist but aren't "proper" roles that sustain a household, leading to widespread financial strain despite a seemingly "low" headline unemployment rate.`,
  sickness_absence: `Think of this as the "Nation's Sick Note" metric. It measures the percentage of Full-Time Equivalent (FTE) working days lost to sickness or injury across the NHS workforce every month. If the rate is 5%, it means that for every 100 days of work that should have happened, 5 were lost because staff were off sick. It is one of the most powerful early-warning signals for the health of the country because the NHS is the UK's single largest employer (approximately 1.4 million staff). When the people who look after everyone else are themselves too sick to come to work, it tells you something profound about the state of the nation's health.

How it is Calculated

NHS Digital compiles this data from the Electronic Staff Record (ESR) system—the payroll and HR database used by virtually every NHS organisation in England. Every month, each trust reports the total number of FTE days its staff were available to work and the total number of FTE days lost to sickness. The national rate is then calculated as: (Total FTE Days Sick ÷ Total FTE Days Available) × 100. The data is broken down by organisation type (acute trusts, mental health trusts, ambulance trusts), by region, and crucially by cause of absence. This is not a survey or an estimate—it is drawn directly from actual payroll records, making it one of the most accurate workforce health metrics available. Data is published approximately four months after the reference period.

Real Impact on the Person on the Street

When the NHS sickness absence rate rises, you feel it directly in three ways:

1. Longer Waits and Cancelled Appointments

Every percentage point of absence translates into tens of thousands of lost staff-days per month. When nurses, doctors, and paramedics are off sick, there are simply fewer people to see you. This means longer waits in A&E, cancelled operations, and delayed GP referrals. The recent surge in absence has been a direct contributor to the NHS backlog crisis.

2. The "Burnout Spiral"

High absence creates a vicious cycle. When one colleague is off sick, the remaining staff have to cover their workload. This leads to longer shifts, higher stress, and eventually more sickness among the people who stayed. Ambulance trusts—which consistently report the highest rates (often above 6.5%)—are a stark example of this spiral in action.

3. The £150 Billion Warning Sign

The NHS workforce is a bellwether for the entire country. Ill health currently costs the UK economy an estimated £150 billion per year. The causes driving NHS absence—anxiety, stress, depression (accounting for nearly 30% of all lost days), musculoskeletal disorders, and post-viral conditions—are the same conditions forcing 2.8 million people out of the wider workforce entirely. If the people trained to manage their own health are struggling, it signals a systemic problem that affects every employer, every business, and every public service in the country.

Why the RAG Thresholds were chosen

The thresholds are based on pre-pandemic NHS performance benchmarks, when the workforce was considered to be functioning at a sustainable (if stretched) level, calibrated against comparable international public-sector healthcare systems.

🟢 Green (Below 3.0%): This is the "Healthy Workforce" zone. Before 2020, the NHS consistently achieved rates between 2.4% and 3.0%. At this level, seasonal illnesses (colds, flu) are the primary driver and absence is manageable without systemic disruption to patient care. It indicates that preventive health measures, occupational support, and working conditions are functioning well.

🟡 Amber (3.0% – 4.5%): This is the "Chronic Pressure" zone. Absence at this level signals that something beyond seasonal illness is at work—typically rising mental health conditions, long COVID aftereffects, or mounting workplace stress. The NHS can still function, but it is relying heavily on bank and agency staff (at significant extra cost) to fill the gaps. This is where most months have sat since late 2021, indicating a workforce under sustained strain.

🔴 Red (Above 4.5%): This is the "Workforce Crisis" zone. At this level, absence is so high that safe staffing levels are regularly breached. Trusts are forced to close wards, divert ambulances, and cancel elective procedures. Winter peaks in 2021-22 saw rates exceed 5.5%, directly contributing to the worst A&E performance and longest ambulance response times on record. A rate this high is not just an HR problem—it is a patient safety issue.`,
};

export function getEmploymentTooltip(metricKey: string): string | undefined {
  return EMPLOYMENT_TOOLTIPS[metricKey];
}

/** Education section: metricKey -> tooltip text */
export const EDUCATION_TOOLTIPS: Record<string, string> = {
  attainment8: `Think of this as the "School Report Card" for the entire country. Attainment 8 measures the average achievement of pupils across 8 GCSE-level qualifications at Key Stage 4 (age 16). Rather than the old system that only asked "Did you get 5 good GCSEs?", this score captures how well a pupil performed across a broad range of subjects. A score of 50 means the average pupil achieved roughly a Grade 5 (a "strong pass") across all 8 subjects. It is the single most important measure of whether the education system is giving the next generation the foundation they need to succeed.

How it is Calculated

The Department for Education calculates this by summing point scores across 8 qualifying subjects, divided into four "buckets": English (double-weighted, counting in two slots), Maths (double-weighted, counting in two slots), three English Baccalaureate subjects (sciences, computing, history, geography, or languages), and three further approved qualifications from an "open bucket." Each grade earns points: Grade 9 = 9 points, Grade 1 = 1 point, U (ungraded) = 0. The maximum possible score is 90. A pupil's total is divided by 10 (the number of slots, including the double-weighted English and Maths) to produce their Attainment 8 score. The national figure is simply the average of all pupils' individual scores. Data is published annually by the DfE and broken down by school, region, gender, ethnicity, and crucially, disadvantage status (pupils eligible for Free School Meals).

Real Impact on the Person on the Street

Attainment 8 might sound like a number that only matters to teachers and politicians, but it directly shapes the country you live in:

1. Your Children's Life Chances

A pupil's Attainment 8 score is the strongest single predictor of whether they will go on to further education, secure a skilled apprenticeship, or enter a well-paid career. The gap between disadvantaged pupils and their peers remains stubbornly wide—typically 13-14 points—meaning a child born into poverty is statistically likely to leave school with significantly weaker qualifications, locking in inequality for a generation.

2. Local Economic Health

Areas with consistently low Attainment 8 scores tend to have weaker local economies. If young people leave school without strong foundational skills, local employers struggle to fill skilled roles, businesses are less likely to invest in the area, and the cycle of deprivation deepens. High-performing areas attract investment; low-performing areas lose it.

3. The National Skills Pipeline

At a national level, Attainment 8 is the "intake valve" for the entire skills system. If the average score is falling, it means fewer young people are entering the workforce with the literacy, numeracy, and scientific understanding needed for a modern economy. This feeds directly into the UK's chronic productivity problem and its ability to compete globally in technology, engineering, and advanced manufacturing.

Why the RAG Thresholds were chosen

The thresholds are based on DfE national averages and the level of attainment considered necessary for a young person to access meaningful post-16 pathways (sixth form, college, or quality apprenticeships).

🟢 Green (Above 48): This is the "Strong Foundation" zone. A national average above 48 indicates that the typical pupil is achieving solid Grade 5s across all subjects—the level universities and employers consider a "strong pass." At this level, the education system is broadly delivering for the majority of young people.

🟡 Amber (44 – 48): This is the "Underperformance" zone. The national average hovers here in recent years (around 46). It means the average pupil is achieving between Grade 4 and Grade 5—a "standard pass" but not a strong one. While functional, it signals that a significant proportion of pupils are leaving school without the depth of knowledge needed for higher-level study or competitive apprenticeships.

🔴 Red (Below 44): This is the "Skills Crisis" zone. An average below 44 would indicate that the typical pupil is not achieving a solid standard pass across their core subjects. At this level, the country is systematically failing to equip the next generation with basic competencies, with severe long-term consequences for economic productivity, social mobility, and public service quality.`,
  teacher_vacancy_rate: `Teacher Vacancies measures the number and rate of unfilled teaching positions across state-funded schools in England. The Department for Education calculates this from the annual School Workforce Census, conducted each November, where schools report posts that are vacant or temporarily filled. The vacancy rate is: (vacancies ÷ total posts) × 100. Data is broken down by phase (primary/secondary), subject, and region. Certain subjects face acute shortages: physics, computing, modern foreign languages, and design technology regularly recruit below target. High vacancy rates correlate with increased class sizes, subject non-availability, and reliance on non-specialist or supply teachers. Retention is equally problematic, with significant proportions leaving within 5 years.

Data Source: DfE: School Workforce

Why it matters to you if it gets worse: Class sizes increase, subjects are dropped, and your child's education suffers due to relying on non-specialist or temporary staff.`,
  neet_rate: `Think of this as the "Lost Generation" metric. It measures the percentage of young people aged 16–24 who are Not in Education, Employment, or Training—they are not at school, not at college, not in a job, and not doing an apprenticeship. They have effectively dropped off every ladder that society offers. An unemployed graduate searching for work is not NEET (they are "unemployed but active"). A NEET is someone who has stopped engaging with the system entirely. When this number is high, it means the country is wasting the potential of its youngest citizens at the exact moment when their habits, skills, and confidence are being formed for life.

How it is Calculated

The Office for National Statistics (ONS) calculates this from the Labour Force Survey—a quarterly household survey of approximately 80,000 individuals. They identify everyone aged 16–24 and classify them into three groups: (a) in education or training, (b) in employment, or (c) neither. The NEET rate is: (those in group C ÷ total 16–24 population) × 100. The data is broken down by age band (16–17 and 18–24), sex, region, and reason for inactivity. It is important to note that the majority of NEETs (around 59%) are not "unemployed" in the traditional sense—they are economically inactive, meaning they are not even looking for work, often due to long-term health conditions (27%), caring responsibilities (13%), or discouragement. Current estimates place approximately 957,000 young people in NEET status across the UK—nearly one million.

Real Impact on the Person on the Street

The NEET rate might seem like someone else's problem, but its effects ripple through every community:

1. The "Scarring Effect"

Research consistently shows that a period of NEET status in your late teens or early twenties leaves a permanent mark on your earnings and career. Nearly half (48%) of young people who become NEET remain NEET a year later, and 58% of NEET young people have never had a paid job. This isn't a temporary blip—it is the start of a lifetime of lower wages, worse health, and greater reliance on the welfare system, all of which are funded by your taxes.

2. Community Decline and Anti-Social Behaviour

High NEET concentrations in a local area correlate with higher rates of anti-social behaviour, substance abuse, and mental health crises. When young people have no structure, no income, and no purpose, the social fabric of a neighbourhood deteriorates. You see it in boarded-up high streets, rising local crime, and overstretched community services.

3. The Fiscal Black Hole

Every NEET young person represents a double cost to the taxpayer: they are not contributing to the economy through work and taxes, and they are drawing on public services (benefits, healthcare, housing, and eventually the criminal justice system). The estimated lifetime cost to the public purse of a single young person who remains long-term NEET is over £100,000. Multiply that by nearly a million and the scale of the fiscal challenge becomes clear.

Why the RAG Thresholds were chosen

The thresholds are calibrated against the performance of the best-performing advanced economies and the UK's own pre-2008 track record, when youth engagement was significantly higher.

🟢 Green (Below 3.0%): This is the "Full Engagement" zone. It matches the performance of countries like the Netherlands, Germany, and the Nordic nations, where virtually every young person is either studying, training, or working. At this level, NEET status is limited to short transitional periods (e.g. between finishing a course and starting a job), not a chronic condition.

🟡 Amber (3.0% – 5.0%): This is the "Structural Gap" zone. The UK currently sits in this bracket. It indicates that while the majority of young people are engaged, a persistent minority—often concentrated in deprived areas or among those with health conditions—are falling through the cracks. The system is functioning but not reaching everyone.

🔴 Red (Above 5.0%): This is the "Systemic Failure" zone. At this level, more than 1 in 20 young people have disengaged entirely. It signals fundamental problems with the education-to-employment pipeline—whether that is inadequate careers guidance, a lack of entry-level jobs, unaffordable further education, or a youth mental health crisis that the system cannot contain.`,
  persistent_absence: `Persistent Absence measures the percentage of pupils who miss 10% or more of their possible school sessions (typically 38+ sessions per year, where one session = half a day). The Department for Education calculates this from termly school census returns, which record authorised absences (illness, appointments, religious observance) and unauthorised absences (truancy, holidays in term time). A pupil crossing the 10% threshold is classified as 'persistently absent.' Chronic absence severely impacts educational outcomes—missing 10% equates to approximately 19 school days or nearly 4 weeks. Post-pandemic persistent absence rates roughly doubled, with particular increases among disadvantaged pupils and those with special educational needs.

Data Source: DfE: Pupil Absence

Why it matters to you if it gets worse: Students fall behind, increasing social inequality, and leading to anti-social behaviour issues in the community.`,
  pupil_attendance: `Think of this as the "School Truancy Alarm." It measures the percentage of school sessions missed for unauthorised reasons—truancy, term-time holidays, unexplained absences, and other unexcused non-attendance. Unlike authorised absence (illness, medical appointments), unauthorised absence signals active disengagement: families or pupils choosing not to attend school without a valid reason. Each "session" is half a school day, so if this rate is 2%, it means 2 out of every 100 half-day sessions across all schools are being missed without permission. It is one of the most direct indicators of whether the education system is holding the attention and engagement of its pupils.

How it is Calculated

The Department for Education (DfE) calculates this from mandatory termly school census returns. Every state-funded school in England must record, for every pupil, every session (morning and afternoon) and mark it as either present, authorised absent, or unauthorised absent. The national unauthorised absence rate is then: (total unauthorised absence sessions ÷ total possible sessions) × 100. Data is published termly and broken down by school phase (primary/secondary), region, local authority, and pupil characteristics (Free School Meals eligibility, special educational needs, ethnicity). The DfE distinguishes between types of unauthorised absence: truancy, holidays not agreed by the school, arriving late after registration closes, and "other unauthorised" (no explanation provided). Approximately 80% of unauthorised absence spells last a single day, but long-duration absences (two weeks or more) account for 15–22% of total unauthorised absence.

Real Impact on the Person on the Street

Rising unauthorised absence is not just a headteacher's problem—it has consequences you can see in your community:

1. The Attainment Collapse

Every day of unauthorised absence directly damages a pupil's chances of academic success. Research shows that pupils with high levels of unauthorised absence are significantly less likely to achieve Grade 4 or above in English and Maths. The post-pandemic surge—unauthorised absence in secondary schools has nearly doubled compared to pre-2020 levels—means an entire cohort of young people is accumulating gaps in their education that will be extremely difficult to fill later.

2. Safeguarding and Vulnerability

Children who are not in school are invisible to the systems designed to protect them. Persistent unauthorised absence is a key warning sign for safeguarding concerns—including exploitation, neglect, and mental health crises. When absence rates climb, schools and local authorities lose sight of the children who may need help the most.

3. The Anti-Social Behaviour Connection

Young people not in school during school hours are disproportionately involved in anti-social behaviour, petty crime, and gang recruitment. Communities with high unauthorised absence rates often see the effects directly: groups of school-age children in town centres during the day, increased shoplifting, and a general erosion of public order that affects local businesses and residents.

Why the RAG Thresholds were chosen

The thresholds are based on pre-pandemic DfE benchmarks, when unauthorised absence was at manageable levels, and reflect the point at which absence begins to cause systemic damage to pupil outcomes and community safety.

🟢 Green (Below 1.0%): This is the "Strong Engagement" zone. Before 2020, primary schools consistently achieved unauthorised absence rates below 1.0%, and the best-performing secondary schools were close to this level. At this rate, absence is limited to isolated incidents and the vast majority of pupils attend school as expected.

🟡 Amber (1.0% – 1.5%): This is the "Emerging Problem" zone. Unauthorised absence at this level signals that a growing minority of families or pupils are disengaging from school. It is manageable with targeted intervention (attendance officers, family support) but indicates the system is under strain.

🔴 Red (Above 1.5%): This is the "Systemic Disengagement" zone. The UK has been firmly in this territory since 2021, with secondary school unauthorised absence nearly doubling from pre-pandemic levels. At this rate, schools are losing control of attendance for a significant proportion of their pupils, with cascading effects on attainment, safeguarding, and community cohesion.`,
  apprenticeship_intensity: `Think of this as the "Skills Pipeline Pressure Gauge." It measures the number of apprenticeship starts per 1,000 people in the working-age population, providing a population-adjusted rate of how actively the country is training its next generation of skilled workers. Raw apprenticeship start numbers can be misleading—a country with a bigger population naturally has more starts. By expressing it as a rate per 1,000 workers, we get a true measure of "training intensity." When this number is high, it means employers are investing in people and the country is actively building the skills it needs. When it is low, it means the skills pipeline is drying up, and the country will pay the price in shortages, higher costs, and lost competitiveness.

How it is Calculated

The Department for Education (DfE) publishes apprenticeship starts data from Individualised Learner Records (ILR)—the administrative system that tracks every learner in further education and apprenticeships in England. This gives the total number of people who began an apprenticeship in a given academic year, broken down by level (Intermediate, Advanced, Higher), age group, sector, and region. To calculate the "intensity" rate, this total is divided by the ONS working-age population estimate (people aged 16–64) and multiplied by 1,000. Data is published quarterly by the DfE and covers all apprenticeship types funded through the Apprenticeship Levy (paid by large employers) and government co-investment for smaller employers.

Real Impact on the Person on the Street

Apprenticeship intensity might sound like a policy metric, but it directly affects the services you use and the opportunities available in your community:

1. The Skilled Worker Shortage

When apprenticeship intensity is low, the country is not producing enough electricians, plumbers, nurses, engineers, and IT technicians to replace those who retire. You experience this as longer waits for tradespeople, higher quotes for home repairs, and an NHS that cannot fill specialist nursing and allied health roles. The construction industry alone estimates it needs 225,000 new workers by 2027—and apprenticeships are the primary route to filling that gap.

2. Youth Opportunity and Social Mobility

For young people who are not suited to or cannot afford university, apprenticeships are the most powerful route into a well-paid career. High intensity means more doors are open: more local employers offering positions, more sectors available, and more pathways from entry-level to advanced qualifications. Low intensity means young people in non-university areas face a barren landscape of low-skilled, low-paid work with no progression route—fuelling the NEET problem and regional inequality.

3. Employer Competitiveness

The Apprenticeship Levy requires large employers to invest in training, but its effectiveness depends on the volume and quality of starts it generates. When intensity is high, it signals that businesses are actively developing their workforce, which drives innovation, productivity, and the ability to compete internationally. When it is low, it suggests employers are either hoarding levy funds, converting them to non-apprenticeship training, or simply not investing in skills—a warning sign for long-term economic stagnation.

Why the RAG Thresholds were chosen

The thresholds are based on the apprenticeship uptake rates needed to sustain the UK's skilled workforce pipeline, benchmarked against countries with strong vocational training systems (Germany, Switzerland, Austria) and adjusted for the UK's population and economic structure.

🟢 Green (Above 15 per 1,000): This is the "Skills Investment" zone. At this rate, the country is producing enough apprentices to sustain and grow its skilled workforce. It indicates a healthy training culture where employers see apprenticeships as a core business investment, not just a levy obligation.

🟡 Amber (10 – 15 per 1,000): This is the "Skills Maintenance" zone. The UK currently sits in this bracket. It means apprenticeship starts are sufficient to replace some of the retiring skilled workforce, but not enough to close existing gaps or expand into new sectors. The system is ticking over but not delivering the step-change in skills that the economy needs.

🔴 Red (Below 10 per 1,000): This is the "Skills Erosion" zone. At this rate, the country is not training enough people to replace those leaving the workforce. Trade shortages become acute, wage inflation in skilled sectors drives up costs for everyone, and the UK falls further behind competitor nations that have invested heavily in vocational education.`,
};

export function getEducationTooltip(metricKey: string): string | undefined {
  return EDUCATION_TOOLTIPS[metricKey];
}

/** Crime section: metricKey -> tooltip text */
export const CRIME_TOOLTIPS: Record<string, string> = {
  recorded_crime_rate: `Think of this as the "Safety Barometer" for the country. It measures the total number of criminal offences recorded by the 43 police forces in England and Wales, expressed as a rate per 1,000 people in the population. If the rate is 90, it means that for every 1,000 people in your area, 90 crimes were recorded by police in a year. It covers everything from shoplifting and burglary to violence, sexual offences, and fraud. This is the most comprehensive single number for answering the question: "Is crime getting worse or better where I live?"

How it is Calculated

The 43 police forces in England and Wales record crimes according to the Home Office Counting Rules (HOCR)—a strict, standardised set of definitions that determines what counts as a "crime" and how each offence is categorised. When a crime is reported by the public or discovered through police activity, it is logged on the force's crime recording system. Forces submit this data to the Home Office, and the ONS publishes it quarterly alongside the Crime Survey for England and Wales (CSEW)—a complementary household survey of approximately 35,000 adults that captures crimes people experienced but may not have reported to police. The rate per 1,000 is calculated as: (total recorded offences ÷ mid-year population estimate) × 1,000. It is important to understand that police recorded crime is influenced by two factors: actual crime levels and recording practices. Changes in police recording standards, public willingness to report, and the inclusion of new offence types (such as online fraud) can all shift the headline number without the underlying reality necessarily changing.

Real Impact on the Person on the Street

A rising crime rate is not an abstract statistic—it changes how you live, work, and feel in your community:

1. Personal Victimisation Risk

The most direct impact is the increased likelihood that you, your family, or your neighbours will become victims of crime. A rate above 100 per 1,000 means, statistically, roughly 1 in 10 people will experience a recorded crime in a given year. The recent surge in shoplifting—up 20% to a record 530,643 offences in the year to March 2025—pushes up costs for retailers, which are passed on to you in higher prices. Vehicle theft, residential burglary, and fraud all erode your sense of security and can cause lasting financial and emotional harm.

2. The "Broken Windows" Effect

High crime rates degrade the quality of life in a neighbourhood. When anti-social behaviour, vandalism, and petty crime go unchecked, the visible signs of disorder—graffiti, litter, damaged property—signal to residents that the area is declining. This drives down property values, discourages businesses from investing, and causes those who can afford to leave to do so, deepening the cycle of deprivation for those who remain.

3. The Policing Resource Squeeze

Every recorded crime generates a workload: an investigation, a crime reference number, victim contact, and often court preparation. When the overall rate is high, police forces are stretched thinner across more cases, meaning each individual crime receives less attention. This is one reason charge rates have collapsed—officers simply have too many cases and too little time. The result is that many victims never see justice, which further erodes trust in the system.

Why the RAG Thresholds were chosen

The thresholds are based on historical crime rate trends and the level at which police forces can realistically investigate and respond to reported crime without being overwhelmed.

🟢 Green (Below 80 per 1,000): This is the "Safe Community" zone. It reflects the lower crime rates achieved in the mid-2010s when overall recorded crime was in sustained decline. At this level, police resources are sufficient to investigate the majority of crimes effectively, and most residents feel their neighbourhood is a safe place to live.

🟡 Amber (80 – 100 per 1,000): This is the "Rising Pressure" zone. The UK currently sits in this bracket. Crime is at a level where police are managing but under strain. Certain categories—shoplifting, fraud, and online crime—are rising faster than resources can keep pace. Residents may notice more visible crime in their daily lives but still broadly feel safe.

🔴 Red (Above 100 per 1,000): This is the "Crisis" zone. At this rate, more than 1 in 10 people are victims of recorded crime annually. Police forces cannot keep up with demand, investigation quality drops sharply, and public confidence in law enforcement collapses. Communities experience visible deterioration and the "broken windows" effect accelerates.`,
  charge_rate: `Think of this as the "Justice Delivery Rate." It measures the percentage of all recorded crimes that result in a suspect being formally charged or summonsed to court. If the charge rate is 7%, it means that for every 100 crimes reported to police, only 7 end with someone being charged. The remaining 93 cases result in no prosecution—either because no suspect was identified, the victim withdrew, or the case was closed for evidential reasons. This is arguably the single most important metric for understanding whether the criminal justice system is actually working, because a crime that is recorded but never solved delivers no justice to the victim and no deterrent to the offender.

How it is Calculated

The Home Office collects "crime outcomes" data from all 43 police forces in England and Wales. When a recorded crime is concluded, the force assigns it one of several outcome codes: Outcome 1 (charged or summonsed), Outcome 2 (caution), Outcome 3 (community resolution), or various "no further action" codes (suspect not identified, evidential difficulties, victim withdraws, etc.). The charge rate is then: (Outcome 1 cases ÷ total recorded crimes) × 100. Data is published annually in the "Crime Outcomes in England and Wales" statistical bulletin, broken down by offence type, police force area, and outcome category. The charge rate varies dramatically by crime type—homicide has a charge rate above 80%, while theft, criminal damage, and fraud often fall below 5%.

Real Impact on the Person on the Street

A falling charge rate does not just affect statistics; it changes the country you live in:

1. The "Consequence-Free" Culture

When only 7 out of every 100 crimes result in a charge, criminals learn—rationally—that offending carries almost no risk of prosecution. This is the driving force behind the epidemic of brazen shoplifting, with thieves openly filling bags and walking out of shops knowing that police are unlikely to attend, let alone charge anyone. The same logic applies to bike theft, car crime, and low-level assault. For the person on the street, this manifests as a creeping sense that "nobody cares" and "nothing happens" when you report a crime.

2. The Collapse of Public Confidence

In 2015, 62% of the public said their local police were doing a good or excellent job. By 2025, that figure had dropped to 49%. The charge rate is the primary driver of this decline. When victims take the time and emotional energy to report a crime—filling out statements, providing evidence, reliving the experience—and then receive a letter saying "no further action," it destroys trust in the entire system. Many people simply stop reporting crime altogether, which means the true scale of offending becomes invisible.

3. The Investigative Spiral

The charge rate has halved in a decade, from 15.5% in 2015 to 7.3% in 2024/25. The causes are structural: police funding remains 5% below 2009/10 levels in real terms; the shift toward complex, evidence-heavy crimes (domestic abuse, sexual offences, online fraud) demands more investigative time per case; and the explosion of digital evidence—phones, CCTV, social media—has created a forensic bottleneck that most forces lack the specialist staff to clear. The result is a vicious circle: fewer charges mean less deterrence, which means more crime, which means even more cases for the same number of officers.

Why the RAG Thresholds were chosen

The thresholds are based on the charge rates needed to maintain public confidence in policing and provide a meaningful deterrent to offending, calibrated against both historical UK performance and comparable international systems.

🟢 Green (Above 10%): This is the "Effective Deterrence" zone. While still below the 15% achieved a decade ago, a charge rate above 10% indicates that police forces are investigating effectively and the criminal justice system is delivering consequences for a meaningful proportion of offenders. At this level, most victims can expect their case to be properly investigated.

🟡 Amber (7% – 10%): This is the "Eroding Confidence" zone. The UK currently sits near the bottom of this bracket. Police are solving some crimes, particularly violent and sexual offences, but the vast majority of volume crime (theft, criminal damage, fraud) goes uncharged. Public trust is declining and offenders are becoming bolder.

🔴 Red (Below 7%): This is the "Justice Failure" zone. At this level, fewer than 1 in 14 crimes result in a charge. The criminal justice system has effectively ceased to function as a deterrent for most offence types. Victims have no realistic expectation of seeing justice, and the cycle of consequence-free offending becomes self-reinforcing.`,
  perception_of_safety: `Think of this as the "Freedom After Dark" metric. It measures the percentage of adults who feel "very safe" or "fairly safe" walking alone in their local area after dark. Unlike recorded crime statistics—which tell you what has happened—this metric captures how safe you actually feel. That distinction matters enormously, because fear of crime restricts people's lives just as powerfully as crime itself. A woman who avoids walking home alone after 7pm, a pensioner who will not answer the door after dark, a teenager who takes a longer route to avoid a particular estate—these are all real consequences of low perceived safety, regardless of whether the official crime statistics are going up or down.

How it is Calculated

The Crime Survey for England and Wales (CSEW)—a large-scale household survey run by the ONS—interviews approximately 35,000 adults annually in their homes. Respondents are asked the standardised question: "How safe do you feel walking alone in your area after dark?" with response options ranging from "very safe" to "very unsafe." The headline figure is the percentage who answer "very safe" or "fairly safe." Results are broken down by sex, age, ethnicity, disability status, area deprivation, and whether the respondent has been a victim of crime. This survey-based approach captures the "dark figure" of fear that never shows up in police data. It is important to note that perception and reality often diverge: some of the safest neighbourhoods (by recorded crime) have high fear levels due to media coverage or environmental factors (poor street lighting, derelict buildings), while some high-crime areas have residents who feel relatively safe because they know the local dynamics.

Real Impact on the Person on the Street

When the perception of safety falls, the effects are immediate and deeply personal:

1. The "Curfew Effect"

Low perceived safety imposes an invisible curfew on millions of people—particularly women, older people, and disabled individuals. Research consistently shows that around half of all women feel unsafe walking alone after dark, compared to roughly one in seven men. When 40% of people who feel unsafe after dark actively change their behaviour—avoiding certain streets, not going out alone, taking taxis they cannot afford—it is a direct loss of personal freedom. Evening economies suffer, community events lose attendance, and public spaces become deserted after dark, which paradoxically makes them less safe.

2. The Gender and Inequality Gap

Perception of safety is one of the starkest inequality metrics in the UK. The gap between men (approximately 88% feeling safe) and women (approximately 68%) represents a 20-percentage-point divide in the freedom to move through public space. The gap widens further for women in deprived areas (65% feel safe) compared to affluent areas (88%). Disabled people report significantly lower safety perceptions than non-disabled people. When large segments of the population feel unable to use public space freely, it entrenches social exclusion and limits economic participation.

3. The Property and Investment Signal

Estate agents, businesses, and investors all track perceived safety. Areas with low safety perceptions struggle to attract new shops, restaurants, and employers. House prices stagnate or fall. Young professionals and families leave, replaced by transient populations with less stake in the community. This "fear-driven flight" can hollow out a neighbourhood far more effectively than actual crime, creating the very decline that residents feared.

Why the RAG Thresholds were chosen

The thresholds are based on CSEW historical data and the levels achieved by the safest comparable European nations, where public space is widely accessible to all demographics after dark.

🟢 Green (Above 70%): This is the "Community Confidence" zone. It indicates that a clear majority of the population—including most women and older people—feel comfortable using their local area after dark. Public spaces are lively, evening economies thrive, and the "invisible curfew" applies to only a small minority. The best-performing areas in the UK and the safest European countries consistently achieve this level.

🟡 Amber (55% – 70%): This is the "Divided Safety" zone. The UK currently sits in this bracket. While the majority still feel safe, a substantial minority—disproportionately women, older people, disabled individuals, and those in deprived areas—do not. This is the zone where behavioural changes become widespread: people avoid certain routes, refuse to go out alone, and restrict their social lives. The evening economy is weakened and community cohesion is under strain.

🔴 Red (Below 55%): This is the "Fear Dominance" zone. When fewer than 55% of people feel safe walking alone after dark, fear of crime has become the dominant experience. Public spaces are effectively abandoned after dark, women and vulnerable groups face severe restrictions on their freedom of movement, and the social and economic life of communities atrophies. This level would represent a fundamental failure of policing, urban design, and community safety.`,
  crown_court_backlog: `Think of this as the "Justice Queue." It measures the total number of outstanding criminal cases waiting to be heard in the Crown Courts of England and Wales—the courts that handle the most serious offences, including murder, rape, robbery, serious assault, and large-scale fraud. If the backlog is 75,000, it means 75,000 defendants are awaiting trial, and 75,000 victims are waiting for their day in court. Some of those cases are already scheduled for trial dates in 2028 or 2029. For every month a case sits in the queue, witnesses' memories fade, victims' trauma deepens, and the chance of a fair and effective trial diminishes. This is the ultimate stress test of whether the justice system can deliver justice at all.

How it is Calculated

The Ministry of Justice (MoJ) calculates the backlog from the Common Platform and XHIBIT case management systems used by Crown Courts across England and Wales. A case enters the backlog when a defendant is sent or committed to the Crown Court for trial and exits when the case reaches a conclusion (conviction, acquittal, or discontinuation). The headline figure is the total "open caseload"—all cases that have entered the system but not yet concluded. The MoJ also tracks the median age of open cases (how long the average case has been waiting), the median time from charge to completion, and breakdowns by offence type and court location. Data is published quarterly in the "Criminal Court Statistics Quarterly" bulletin. The backlog is a cumulative measure: it rises when more cases enter than exit, and falls only when courts clear more cases than they receive.

Real Impact on the Person on the Street

The Crown Court backlog is not an administrative inconvenience—it causes real suffering to real people:

1. Victims Trapped in Limbo

The Victims' Commissioner's 2025 report described the backlog's impact as "devastating." Victims of serious crimes—sexual assault, domestic violence, grievous bodily harm—are forced to live in a state of suspended trauma for years while awaiting trial. They cannot move on with their lives, their relationships suffer, and their mental health deteriorates. Many victims withdraw from cases entirely because they simply cannot endure the wait, which means their attacker faces no consequences. Nearly two-thirds (62%) of the backlog comprises violent, sexual, and drug offences—the most traumatic crime types for victims to relive.

2. Justice Delayed is Justice Denied

As of September 2025, the median time from charge to completion was 179 days—nearly six months. Over 20,000 cases had been open for more than a year, a record. When witnesses are asked to recall events from two or three years ago, their evidence is inherently weaker. CCTV footage may have been overwritten. Co-operating witnesses may have moved away. The quality of justice itself is degraded by delay, making wrongful acquittals and wrongful convictions both more likely.

3. The Taxpayer Cost

Every day a remand prisoner sits in jail awaiting trial costs the taxpayer approximately £130. With thousands of defendants on remand for months or years, the financial burden is enormous. Meanwhile, judges, court staff, and barristers are paid whether cases proceed or are adjourned. The government has committed a record 110,000 Crown Court sitting days for 2025–26, but even this has not been sufficient to reduce the queue. If defendants exceed their custody time limits due to delays, they must be released—potentially putting dangerous individuals back on the streets.

Why the RAG Thresholds were chosen

The thresholds are based on the Crown Court's pre-pandemic operating capacity and the level at which the system can deliver timely justice without causing unacceptable harm to victims and witnesses.

🟢 Green (Below 40,000 cases): This is the "Functioning Justice" zone. Before the COVID-19 pandemic, the Crown Court backlog sat at approximately 39,000 cases. At this level, most cases are heard within a reasonable timeframe, victims are not subjected to years of waiting, and the quality of evidence remains strong. Courts have sufficient capacity to handle seasonal fluctuations and complex multi-week trials.

🟡 Amber (40,000 – 60,000 cases): This is the "Strained System" zone. At this level, waiting times are noticeably longer, some victims experience delays of over a year, and courts are forced to prioritise the most serious cases at the expense of "lesser" offences. The system is functioning but under significant pressure, and any disruption (such as a barrister strike or further pandemic) could push it into crisis.

🔴 Red (Above 60,000 cases): This is the "Justice Crisis" zone. The UK has been firmly in this territory since 2021, with the backlog reaching a record 79,619 in September 2025. At this level, the system cannot clear cases faster than they arrive. Victims wait years, witnesses forget, and public confidence in the courts collapses. The Victims' Commissioner has described the current situation as an "unacceptable" denial of justice.`,
  reoffending_rate: `Think of this as the "Revolving Door" metric. It measures the percentage of offenders who commit another crime within one year of being released from prison or starting a community sentence—and where that new offence is subsequently proven by a court conviction or caution. If the rate is 28%, it means that for every 100 offenders who leave prison or begin a community order, 28 of them will be back in the system within a year. It is the most direct measure of whether the criminal justice system is actually rehabilitating people or simply cycling them through a revolving door of offending, punishment, release, and reoffending.

How it is Calculated

The Ministry of Justice (MoJ) tracks a "cohort" of offenders—everyone who was released from custody, received a non-custodial conviction, or received a caution in a given quarter. Each offender is then followed for one year using the Police National Computer (PNC) to see if they commit any further offences. A six-month "waiting period" is added after the one-year follow-up to allow time for court proceedings to conclude, meaning the data has an 18-month lag. The headline rate is: (offenders who committed at least one proven reoffence ÷ total cohort) × 100. The MoJ also publishes a "frequency rate"—the average number of reoffences per reoffender—which captures prolific offending. Data is broken down by sentence type, sentence length, age, sex, and offence category. This allows analysis of which interventions are working and which are failing.

Real Impact on the Person on the Street

High reoffending rates are not just a problem for the justice system—they directly affect your safety and your wallet:

1. The Same Offenders, Again and Again

When reoffending is high, the victims of crime are disproportionately created by a relatively small group of prolific repeat offenders. A shoplifter released on a Friday who is stealing again by Monday, a domestic abuser who assaults a new partner within weeks of release, a burglar who returns to the same neighbourhood—these are not hypothetical scenarios. They are the lived reality of communities where reoffending is entrenched. For every repeat offender who is not rehabilitated, there are new victims who would not otherwise have been harmed.

2. The £18 Billion Bill

Reoffending costs the UK economy an estimated £18 billion per year when you account for the costs of re-arrest, re-prosecution, re-imprisonment, victim services, healthcare, and lost economic output. The most alarming statistic is that offenders sentenced to less than 12 months in prison have a reoffending rate of 66%—two out of three are back in the system within a year. These short sentences are too brief for meaningful rehabilitation programmes but long enough to disrupt employment, housing, and family relationships, making reoffending more likely. It is, in effect, the worst of both worlds: expensive enough to strain the public purse but too short to change behaviour.

3. The Prison Population Spiral

England and Wales hold approximately 87,000 prisoners—one of the highest incarceration rates in Western Europe. High reoffending drives this number relentlessly upward, as the same individuals cycle through the system repeatedly. The prison estate is overcrowded, underfunded, and struggling to deliver rehabilitation programmes. When prisons are so full that inmates spend 23 hours a day in their cells with no access to education, training, or mental health support, the conditions that drive reoffending are reinforced rather than addressed. The government has been forced to implement early release schemes to manage capacity, which itself risks increasing reoffending.

Why the RAG Thresholds were chosen

The thresholds are based on the reoffending rates achieved by the most effective criminal justice systems internationally and the level at which the UK system can be considered to be successfully rehabilitating offenders rather than simply warehousing them.

🟢 Green (Below 25%): This is the "Effective Rehabilitation" zone. It indicates that the criminal justice system is successfully breaking the cycle for three out of four offenders. Countries with strong rehabilitation programmes—such as Norway and the Netherlands—consistently achieve rates in this range. At this level, prison and community sentences are genuinely changing behaviour, and the downstream benefits (fewer victims, lower costs, safer communities) are substantial.

🟡 Amber (25% – 30%): This is the "Persistent Challenge" zone. The UK currently sits in this bracket at approximately 28–29%. While the majority of offenders do not reoffend within a year, a stubborn minority continue to cycle through the system. The most concerning subgroups—short-sentence prisoners, young adult males, and those with substance abuse or mental health issues—reoffend at far higher rates than the headline figure suggests.

🔴 Red (Above 30%): This is the "Systemic Failure" zone. At this level, nearly one in three offenders is back in the system within a year, and prolific reoffenders are generating a disproportionate share of all crime. It signals that rehabilitation programmes are inadequate, prison conditions are counterproductive, and the transition support (housing, employment, mental health) that ex-offenders need to stay out of trouble is failing. The justice system is consuming vast resources simply to process the same people repeatedly, with diminishing returns for public safety.`,
};

export function getCrimeTooltip(metricKey: string): string | undefined {
  return CRIME_TOOLTIPS[metricKey];
}

/** Healthcare section: metricKey -> tooltip text */
export const HEALTHCARE_TOOLTIPS: Record<string, string> = {
  a_e_wait_time: `Think of this as the "NHS Front Door" metric. It measures the percentage of patients who arrive at an Accident & Emergency department and are admitted to a ward, transferred, or discharged within 4 hours. If the figure is 75%, it means that one in four patients waited longer than 4 hours—some for 8, 10, or even 12+ hours. This single number is widely regarded as the best overall indicator of how well the entire NHS is functioning, because A&E performance is not just about the emergency department itself. When hospital wards are full, patients cannot be admitted from A&E. When social care is overwhelmed, patients who are medically fit cannot be discharged. The bottleneck backs up through the entire system and manifests as queues in A&E. When this metric is red, it means the NHS is in crisis.

How it is Calculated

NHS England collects mandatory returns from all emergency departments in England—Type 1 (major A&E departments), Type 2 (specialist emergency departments, such as eye hospitals), and Type 3 (minor injury units and urgent treatment centres). Every patient's arrival time and departure time are recorded. The headline figure is: (patients seen within 4 hours ÷ total attendances) × 100. Data is published monthly and broken down by trust, department type, and time band. The operational standard, set in 2004, is that 95% of patients should be seen within 4 hours. This target has not been met nationally since July 2015. NHS England also tracks "12-hour trolley waits"—patients who wait more than 12 hours from the decision to admit to actual admission to a ward—as a marker of extreme system failure.

Real Impact on the Person on the Street

When A&E performance drops, it is not an abstract NHS management problem—it is a direct threat to your health and your family's safety:

1. "Corridor Care" and Patient Safety

In 2025, one in ten patients at major A&E departments waited more than 12 hours, totalling 1.75 million people in a single year. Over 50,000 patients in November 2025 alone experienced 12-hour waits after the decision to admit—the worst November on record. Many of these patients were treated in corridors, store cupboards, and makeshift areas because there were simply no beds. This is not an inconvenience; it is a clinical safety crisis. Over 16,600 patient deaths in a single year were associated with long waits. When you are having a heart attack or a stroke, every minute of delay increases the risk of permanent damage or death.

2. The "Exit Block" Cascade

The root cause of A&E overcrowding is rarely A&E itself. It is "exit block"—the inability to move patients out of A&E into hospital wards because those wards are full of patients who are medically fit for discharge but have nowhere to go (no care home place, no social care package, no family support). On any given day, over 13,000 hospital bed days are lost to delayed discharges. This cascading failure means that even if you arrive at A&E with a genuine emergency, you may wait hours on a trolley because the bed you need is occupied by someone who should have gone home days ago.

3. Ambulance Handover Gridlock

When A&E is full, ambulances cannot hand over their patients. Paramedics are forced to wait outside the hospital—sometimes for hours—acting as de facto corridor staff. This means those ambulances are not available to respond to the next 999 call. It creates a deadly chain reaction: your neighbour's heart attack call goes unanswered because the ambulance that should be racing to them is parked outside a hospital waiting for a bed to become free.

Why the RAG Thresholds were chosen

The thresholds are based on the NHS constitutional standard and the clinical evidence for what constitutes safe emergency care.

🟢 Green (Above 95%): This is the "Safe Emergency Care" zone. The 95% target was set based on clinical evidence that the vast majority of emergency patients should be assessed, treated, and moved within 4 hours to avoid clinical deterioration. The NHS consistently achieved this standard between 2004 and 2013. At this level, corridor care is virtually eliminated and ambulance handovers happen promptly.

🟡 Amber (90% – 95%): This is the "Pressure" zone. Performance in this range indicates the system is under significant strain but still broadly managing. Some patients experience extended waits, particularly during winter pressures, but the most serious cases are prioritised effectively. This was the typical performance range from 2014 to 2019.

🔴 Red (Below 90%): This is the "System Failure" zone. The NHS has been in this territory since early 2020, with current performance around 74–76%. At this level, corridor care is routine, 12-hour waits are commonplace, ambulance handovers are severely delayed, and patient safety is systematically compromised. The gap between current performance and the 95% target is so large that it represents a fundamental breakdown in the capacity of the health and social care system.`,
  elective_backlog: `Think of this as the "NHS Queue." It measures the total number of patients in England who have been referred by their GP for consultant-led treatment and are still waiting for that treatment to begin. If the backlog is 7 million, it means roughly 1 in 8 people in England is on a waiting list for a hospital procedure—a hip replacement, a cataract operation, a hernia repair, a diagnostic scan, or one of thousands of other planned treatments. These are not emergencies; they are conditions that cause chronic pain, disability, anxiety, and inability to work. The longer the queue, the longer you suffer.

How it is Calculated

NHS England collects mandatory monthly returns from every NHS trust in England using the Referral to Treatment (RTT) dataset. When your GP refers you to a hospital consultant, a "pathway" is opened. It remains "incomplete" (open) until you receive your first definitive treatment—an operation, a procedure, or in some cases a decision that treatment is not needed. The backlog is simply the total count of all incomplete pathways at a given point in time. The NHS constitutional standard, set in 2008, states that 92% of patients should wait no longer than 18 weeks from referral to treatment. NHS England also tracks patients waiting over 52 weeks ("year-long waiters") and over 65 weeks as markers of extreme delay. It is important to note that the figure counts pathways, not unique patients—one patient with two conditions on two separate lists counts as two pathways.

Real Impact on the Person on the Street

The elective backlog is not a bureaucratic number—it represents millions of people living in pain, anxiety, and diminished quality of life:

1. Living in Pain While You Wait

A patient waiting 18 months for a hip replacement is not simply "inconvenienced." They are living with chronic pain that prevents them from sleeping, walking, working, and enjoying life. They become dependent on painkillers—contributing to the prescription opioid problem. They lose fitness and muscle mass, which makes the eventual surgery more complex and recovery slower. For conditions like cataracts, delayed treatment means progressive loss of independence: you cannot drive, you cannot read, you become isolated. The human cost of each month of delay is immense and cumulative.

2. The Economic Drain

People on waiting lists are disproportionately of working age. A construction worker waiting for knee surgery, an office worker waiting for carpal tunnel release, a teacher waiting for a diagnostic scan—these people are either working in pain (reducing their productivity) or off work entirely (costing their employer and the benefits system). The NHS Confederation has estimated that addressing the backlog requires systemic reform, not just additional appointments—the government's target of 2 million extra appointments per year addresses only about 15% of the underlying requirement.

3. The Inequality Amplifier

The backlog falls hardest on those least able to cope. Wealthier patients can pay for private treatment and jump the queue; poorer patients cannot. Deprived areas tend to have longer waits due to lower hospital capacity relative to need. Older patients, who are more likely to need elective procedures, deteriorate faster while waiting, leading to more complex and expensive treatment when they finally reach the front of the queue—or emergency admission if their condition becomes critical.

Why the RAG Thresholds were chosen

The thresholds are based on the NHS's pre-pandemic operating capacity and the level at which the system can deliver timely care without causing unacceptable suffering to patients.

🟢 Green (Below 4 million): This is the "Manageable Queue" zone. Before the pandemic, the waiting list sat at approximately 4.4 million but was broadly stable, with the vast majority of patients treated within 18 weeks. A list below 4 million would indicate the NHS is clearing referrals at a sustainable rate and most patients experience acceptable waiting times.

🟡 Amber (4 – 6 million): This is the "Chronic Backlog" zone. The UK currently sits in this bracket. At this level, a significant minority of patients wait well beyond 18 weeks, year-long waits number in the hundreds of thousands, and the system is treating record numbers but cannot reduce the queue because demand continues to rise. The NHS is functioning but failing to meet its own standards for a substantial proportion of patients.

🔴 Red (Above 6 million): This is the "System Overwhelmed" zone. At its post-pandemic peak, the backlog exceeded 7.6 million pathways. At this level, the queue is so large that even record treatment volumes cannot make a meaningful dent. Patients are routinely waiting over a year, conditions deteriorate while waiting, and emergency admissions rise as planned care is delayed too long. The NHS is in sustained failure against its constitutional commitments.`,
  ambulance_response_time: `Think of this as the "999 Lifeline" metric. It measures the average time, in minutes, between a 999 call being connected and an ambulance arriving at the scene. When someone is having a heart attack, a stroke, or a severe allergic reaction, every minute of delay increases the risk of permanent brain damage, heart damage, or death. For a stroke patient, approximately 1.9 million neurons die every minute without treatment. For a cardiac arrest, survival rates drop by roughly 10% for every minute without defibrillation. This metric is, quite literally, the difference between life and death.

How it is Calculated

NHS England collects data from the Computer Aided Dispatch (CAD) systems operated by all 10 ambulance trusts in England. Every 999 call is triaged and assigned one of four categories: Category 1 (life-threatening, e.g. cardiac arrest—target 7 minutes mean), Category 2 (emergency, e.g. heart attack, stroke—target 18 minutes mean), Category 3 (urgent, e.g. falls, abdominal pain—target 2 hours), and Category 4 (less urgent—target 3 hours). The response time is measured from the moment the call is connected to the 999 system to the moment the first ambulance resource arrives on scene. NHS England publishes monthly data showing the mean and 90th percentile response times for each category, broken down by ambulance trust and Integrated Care Board area. Category 2 calls account for approximately 60% of all emergency ambulance demand and are the most commonly reported headline figure.

Real Impact on the Person on the Street

Ambulance response times are arguably the most immediately consequential healthcare metric—they determine outcomes in your most vulnerable moments:

1. The "Golden Hour" and the "Golden Minutes"

For the most time-critical conditions—heart attack, stroke, major trauma, severe bleeding—clinical outcomes are directly determined by how quickly treatment begins. A heart attack patient who receives treatment within 60 minutes has a significantly better chance of survival and recovery than one who waits two hours. A stroke patient treated within the first hour retains far more brain function than one treated after three hours. When average Category 2 response times reach 47 minutes—as they did in December 2024—patients with suspected heart attacks and strokes are systematically receiving treatment too late, leading to preventable deaths and permanent disability.

2. The Ambulance Handover Trap

Slow response times are rarely caused by ambulances driving slowly. The primary driver is "handover delays"—ambulances arriving at hospital but being unable to transfer their patient to A&E because the department is full. Paramedics are forced to wait outside the hospital for hours, effectively acting as an extension of the A&E queue. While they wait, their ambulance is unavailable for new 999 calls. In some areas during winter 2024–25, ambulances were queuing for over an hour at hospital doors, with the worst-performing region (East Midlands) recording average Category 2 response times of 66 minutes.

3. The Rural and Deprived Penalty

Response times vary enormously by location. Urban areas with ambulance stations nearby may see times close to target, while rural areas—where the nearest ambulance may be 20 or 30 miles away—routinely experience much longer waits. Deprived areas, where 999 call volumes are highest due to worse population health, also tend to experience longer waits because local ambulance capacity is overwhelmed. This geographic lottery means your postcode can be the deciding factor in whether you survive a medical emergency.

Why the RAG Thresholds were chosen

The thresholds are based on the clinical evidence for time-critical emergency conditions and the response times needed to give patients the best chance of survival and full recovery.

🟢 Green (Below 7 minutes): This is the "Rapid Response" zone. A mean response time under 7 minutes meets the Category 1 (life-threatening) standard and indicates that the ambulance service has sufficient capacity to reach the most critical patients in time to make a clinical difference. At this level, cardiac arrest survival rates are maximised and stroke patients receive treatment within the critical early window.

🟡 Amber (7 – 10 minutes): This is the "Acceptable Delay" zone. Response times in this range are longer than ideal but still within a window where clinical outcomes for most emergency conditions remain reasonable. The current UK average sits in this bracket. It indicates that the system is under pressure—likely due to handover delays or demand surges—but is still broadly functioning for the majority of calls.

🔴 Red (Above 10 minutes): This is the "Clinical Risk" zone. At this level, patients with time-critical conditions are systematically waiting too long. Cardiac arrest survival drops sharply, stroke patients lose critical treatment windows, and severe trauma patients face increased mortality. When average response times exceed 10 minutes as a norm (rather than an occasional peak), it signals a systemic failure in ambulance capacity, hospital flow, or both.`,
  gp_appt_access: `Think of this as the "NHS Front Gate" metric. While A&E is the NHS's "front door" for emergencies, your GP surgery is the "front gate" for everything else—the first point of contact for 90% of all NHS interactions. This metric measures the percentage of GP appointments that take place within 14 days of the patient requesting them. If the figure is 65%, it means roughly one in three appointments are booked more than two weeks out. For a patient who has found a lump, developed chest pain, or is struggling with worsening mental health, being told "the next available appointment is in three weeks" is not just frustrating—it can be dangerous. Poor GP access is also the single biggest driver of A&E overcrowding, because patients who cannot see their GP go to A&E instead.

How it is Calculated

NHS England Digital collects General Practice Appointment Data (GPAD) from GP practice clinical systems across England, covering approximately 30 million appointments per month. For each appointment, the system records the date it was booked and the date it took place. The access metric is then: (appointments occurring within 14 days of booking ÷ total appointments) × 100. Data is published monthly and broken down by practice, Integrated Care Board area, appointment type (face-to-face, telephone, online), and healthcare professional type (GP, nurse, pharmacist, physiotherapist). The data captures all appointment types including same-day urgent slots, routine appointments, and advance bookings for long-term condition reviews. It excludes COVID vaccinations and some specialist clinics.

Real Impact on the Person on the Street

GP access is the metric you are most likely to experience personally—everyone needs their GP at some point:

1. The Early Detection Problem

General practice is where cancers are spotted early, where diabetes is caught before it causes damage, and where mental health crises are intercepted before they escalate. When access is poor and patients wait weeks for an appointment, conditions that could have been caught and treated quickly are allowed to progress. A "two-week wait" cancer referral cannot happen if you cannot see your GP in the first place. By the time a delayed patient finally gets seen, their condition may have advanced from treatable to serious—or they may have given up trying and present months later as an emergency.

2. The A&E Pressure Valve

Every patient who cannot get a GP appointment is a potential A&E attendance. Research consistently shows that a significant proportion of A&E visits—estimated at 15–30%—could have been managed in primary care if timely access were available. When GP access falls, A&E departments absorb the overflow: patients with ear infections, back pain, urinary tract infections, and anxiety attacks sit alongside genuine emergencies, clogging the system for everyone. Improving GP access is therefore one of the most effective ways to reduce pressure on hospitals.

3. The 8am Scramble

For millions of patients, the daily reality of GP access is the "8am lottery"—frantically redialling the surgery from the moment the phone lines open, competing with hundreds of other callers for a handful of same-day slots. Those who get through are seen quickly; those who do not are told to try again tomorrow. This system is stressful, excludes people who cannot sit on the phone for 45 minutes (those at work, caring for children, or with hearing difficulties), and creates the false impression of availability. The appointment data may show that 80% of appointments happen within 14 days, but it does not capture the thousands of patients who never got through the phone line at all.

Why the RAG Thresholds were chosen

The thresholds are based on the NHS's stated ambition for primary care access and the level at which GP services can function as an effective gatekeeper, preventing conditions from escalating and reducing pressure on hospitals.

🟢 Green (Above 70%): This is the "Accessible Primary Care" zone. At this level, the vast majority of patients who need to see a GP can do so within two weeks. Urgent cases are seen same-day, routine cases within a week, and advance bookings for long-term conditions are manageable. Primary care is functioning as intended: catching problems early, managing chronic conditions, and keeping patients out of hospital.

🟡 Amber (55% – 70%): This is the "Access Gap" zone. The UK currently sits in this bracket. While the majority of appointments happen within 14 days, a substantial minority of patients—particularly those with non-urgent but important conditions—face unacceptable waits. The "8am scramble" is the daily norm, patient satisfaction is declining, and the overflow into A&E is measurable. The system is coping but not delivering the access that patients expect and need.

🔴 Red (Below 55%): This is the "Primary Care Collapse" zone. At this level, nearly half of appointments are booked more than two weeks out. Patients routinely give up trying to access their GP, conditions deteriorate without oversight, and A&E becomes the de facto primary care provider for a significant proportion of the population. This level would indicate a fundamental breakdown in the GP workforce, capacity, or both.`,
  staff_vacancy_rate: `Think of this as the "Workforce Hole" metric. It measures the percentage of funded NHS positions that are currently unfilled—posts that the NHS has the budget to fill but cannot recruit anyone into. If the vacancy rate is 7%, it means that for every 100 positions the NHS needs, 7 are empty. With a workforce of 1.37 million, that translates to approximately 100,000 unfilled posts across England. These are not hypothetical positions; they are real gaps on real wards, in real clinics, and in real ambulance stations. Every vacancy means the remaining staff have to work harder, patients receive less attention, and the risk of errors rises.

How it is Calculated

NHS England Digital publishes quarterly NHS Vacancy Statistics using data from every NHS trust in England. Each trust reports its "funded establishment"—the total number of full-time equivalent (FTE) positions it has budget approval for—and the number of those positions that are currently vacant and being actively recruited to. The vacancy rate is then: (vacant FTE posts ÷ total funded establishment) × 100. Data is broken down by staff group (nursing and midwifery, medical, allied health professionals, ambulance, administrative, scientific and technical, etc.), by trust, by region, and by specialty. A "vacancy" specifically means a funded post that the trust is trying to fill; it does not include posts that have been deliberately frozen or removed from the establishment.

Real Impact on the Person on the Street

NHS vacancies are not a human resources problem—they directly determine the quality and safety of the care you receive:

1. The "Doing More With Less" Burnout Spiral

When a ward has 20 funded nursing posts but only 17 are filled, the 17 remaining nurses must cover the work of 20. Shifts become longer, breaks are skipped, patient observations are delayed, and the cumulative exhaustion leads to clinical errors—wrong medication doses, missed deterioration signs, falls that could have been prevented. Research consistently links higher nurse vacancy rates to increased patient mortality, longer hospital stays, and higher rates of hospital-acquired infections. The nurses who remain become burned out, which drives more of them to leave, deepening the vacancy problem in a vicious cycle.

2. The £10 Billion Agency Bill

When permanent staff cannot be recruited, trusts turn to agency and bank (temporary) staff to fill the gaps. Agency nurses and doctors cost significantly more per shift than permanent staff—sometimes two or three times as much—and they are less familiar with local protocols, systems, and patients. The NHS has spent billions on agency staff in recent years. The government has targeted a 40% reduction in agency spending by 2026, but achieving this without filling underlying vacancies would simply mean more unfilled shifts and less care.

3. The Specialty Desert

Vacancy rates are not evenly distributed. Mental health nursing, learning disability services, community nursing, and certain medical specialties (psychiatry, emergency medicine, radiology) have persistently higher vacancies than average. This creates "specialty deserts" where entire services are understaffed, leading to longer waits, reduced opening hours, or services being withdrawn from certain areas altogether. If your local trust cannot recruit a dermatologist or a paediatric consultant, you face a longer journey to a different hospital—or a longer wait for a telephone consultation from an overstretched clinician elsewhere.

Why the RAG Thresholds were chosen

The thresholds are based on the vacancy levels at which the NHS can safely staff its services and the point at which patient care begins to be systematically compromised.

🟢 Green (Below 5%): This is the "Healthy Workforce" zone. A vacancy rate below 5% is considered operationally manageable—trusts can cover short-term gaps through internal bank staff without relying heavily on expensive agencies, and the workload on permanent staff remains sustainable. Pre-2018 vacancy rates were in this range, and the best-staffed comparable healthcare systems (Germany, Scandinavia) maintain rates below 5%.

🟡 Amber (5% – 8%): This is the "Workforce Strain" zone. The NHS currently sits in this bracket at approximately 6.7%, down from 7.4% the previous year. At this level, trusts are managing but relying significantly on temporary staff, staff workload is above sustainable levels, and specific specialties and regions face acute shortages. Patient care is being delivered, but the margin for error is thin and staff wellbeing is under pressure.

🔴 Red (Above 8%): This is the "Staffing Crisis" zone. At this level, the NHS cannot safely staff a significant proportion of its services with permanent employees. Agency dependency soars, costs spiral, and patient safety incidents increase. Entire services may need to be temporarily closed or consolidated. At the peak of the post-pandemic workforce crisis, overall vacancy rates exceeded 9%, with nursing vacancies above 11% and some trusts reporting specialty vacancy rates above 20%.`,
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
  sea_mass: `Sea Mass represents a nation's "Maritime Weight." It is not just about the number of hulls in the water, but the total physical scale and combat power of a navy. Think of it like comparing a fleet of delivery vans to a fleet of heavy-duty armored trucks; "Mass" tells you how much punch the navy can pack and how much damage it can absorb. For a global power, Sea Mass is the ultimate measure of Naval Reach — it determines whether a country can protect its trade routes across the entire world simultaneously or is restricted to guarding its own beaches.

How is it Calculated?

Sea Mass is calculated by measuring the Total Aggregate Displacement (the total weight of water the ship pushes aside) of the "Surface and Sub-Surface Fleet." To capture true Tier 1 capability, this metric is divided into two primary pillars, weighted to favor the ships that project the most power.

Pillar 1: Blue Water Capability (70% Weighting) — This measures the "Heavy Hitters." It is divided into two sub-pillars:
• Sub-Pillar 1.1: Strategic Platforms (50% of Pillar 1): Focuses on aircraft carriers and nuclear-powered submarines. These are the most valuable because they provide independent global reach and a nuclear deterrent.
• Sub-Pillar 1.2: Surface Combatants (50% of Pillar 1): Focuses on destroyers and frigates. These are the "workhorses" that escort carriers and protect trade routes.

Pillar 2: Auxiliary & Support Resilience (30% Weighting) — This measures the "Logistical Stamina."
• Sub-Pillar 2.1: Fleet Auxiliaries (100% of Pillar 2): Focuses on tankers and supply ships. A navy can only stay at sea as long as it has fuel and food; without these, "Mass" is stuck in port.

Real-World Impact: Why should you care?

For the person on the street, Sea Mass is the silent guardian of your daily life:
• Price Stability: Over 90% of global trade travels by sea. High Sea Mass prevents hostile nations from closing "Choke Points" (like the Suez Canal), keeping the price of your fuel, food, and electronics stable.
• National Influence: A navy with significant mass can provide disaster relief or evacuate citizens from war zones without firing a single shot.
• Industrial Jobs: Maintaining a high Sea Mass sustains a domestic industrial ecosystem of shipyards and high-tech engineering firms, providing thousands of high-wage jobs.

RAG Threshold Logic

The RAG thresholds are determined by comparing a nation's total displacement against the Gold Standard of a mature, advanced Tier 1 naval power on a population-proportional basis.

🟢 Green (> 90% of Standard) — Global Projection: The navy can maintain a permanent presence in multiple global theaters simultaneously and protect all major trade routes independently.

🟡 Amber (70% – 90% of Standard) — Regional Focus: The navy is capable of significant operations but lacks "Deep Mass." It may have to choose between protecting trade abroad or defending its home territory.

🔴 Red (< 70% of Standard) — Littoral Limitation: The navy has lost its "Blue Water" weight. It is effectively a coastal defense force dependent on allies to protect its merchant shipping.

Data Source: UK Defence Journal, Navy Lookout, RUSI, IISS`,
  land_mass: `Land Mass measures the UK's land force structure as a weighted composite of four pillars: Armoured Strike (MBTs, AFVs), Personnel Mass (regulars), Indirect Fires (artillery, air defence), and Depth (reserves, recallable veterans, logistics). Each pillar is scored against Tier 1 benchmarks. Green: 90%+, Amber: 70–89%, Red: <70%.

Data Source: Janes, RUSI, IISS Military Balance, MOD statistics

Why it matters to you if it gets worse: The Army cannot sustain prolonged operations or regenerate after conflict.`,
  air_mass: `Air Mass measures the UK's air power as a weighted composite of four pillars: Combat Strike (multi-role fighters), Force Multipliers (tankers, AEW), Strategic Lift (transports), and Autonomous Mass (loyal wingman-type platforms). Each pillar is scored against Tier 1 benchmarks. Green: 90%+, Amber: 70–89%, Red: <70%.

Data Source: FlightGlobal, RUSI, IISS Military Balance

Why it matters to you if it gets worse: The UK loses air superiority, strike capability, and strategic mobility.`,
  defence_industry_vitality: `Defence Industry Vitality is a measure of a nation's "Sovereign Industrial Stamina." In the defense world, "Sustainability" measures—which attempt to calculate exactly how many days a country can sustain a high-intensity war against a peer adversary—are often impossible to track because stockpile data is strictly confidential and open-source estimates are highly unreliable. Consequently, we use Industry Vitality as a high-confidence proxy. Instead of guessing what is currently in a warehouse, we measure the health of the "Machine that builds the Machine."

To ensure the data is not skewed by one-off large contracts or seasonal fluctuations, this metric is calculated using a four-quarter rolling average. By looking at the average performance over the last twelve months, we gain a true reflection of the industrial base's consistent "muscle." If the factories are large, active, and growing on a rolling basis, the nation has the stamina to create supplies faster than they are consumed. High vitality means the country can replace combat losses independently; low vitality means the country is a "Security Consumer" that would likely run out of equipment in days without foreign intervention.

How is it Calculated?
The index is calculated by balancing the physical size of the industry with its growth speed, both measured as a four-quarter rolling average. The targets are based on a "Proportional Tier 1 Standard," using benchmarks from US institutions like the Heritage Foundation and CSIS to determine the industrial output required for a leading economy to maintain "Freedom of Action" relative to its population size.

Pillar 1: Export Scale (50% Weighting): This measures the "Mass" of the industrial base. Because total production data can be obscured, we use Export Output as a proxy for "Warm Production Lines." This pillar is divided into two equally weighted sub-pillars, both calculated on a four-quarter rolling average:

Sub-Pillar 1.1: Weapons & Ammunition (50% of Pillar 1): The target is a rolling average of £1,000 million per quarter in exports. This ensures the industrial base is consistently large enough to produce the "consumables" of war (shells and missiles).

Sub-Pillar 1.2: Military Fighting Vehicles (50% of Pillar 1): The target is a rolling average of £975 million per quarter in exports. This represents the sustained capacity to build and modernize heavy armor.

Source: These targets are derived by taking the US-Standard "Sovereign Floor" (approx. 1.75% of GDP) and adjusting for a standard 40% export-to-domestic production ratio.

Pillar 2: Year-on-Year Momentum (50% Weighting): This measures the "Speed" of the industrial engine. It compares the current four-quarter rolling average of export turnover to the four-quarter rolling average from the same period in the previous year. The target is 5.0% annual growth.

Source: This benchmark is derived from Janes Defence Industry Intelligence, which defines 5% as the "Mobilisation Threshold" required for a mature economy to transition from peacetime idling to active readiness.

Real-World Impact: Why should you care?
For the person on the street, Defence Industry Vitality is the ultimate insurance policy for National Resilience:

Economic Security: A high score indicates a thriving high-tech sector, providing thousands of stable, high-wage engineering and manufacturing jobs.

Conflict Prevention: Factories are a form of deterrence. An adversary is far less likely to challenge a nation if they see its "industrial engine" is already warmed up and capable of out-producing them.

Budgetary Protection: Strong domestic vitality means the government does not have to "panic-buy" equipment from abroad at premium prices during a crisis, which protects the national treasury.

RAG Threshold Logic
The RAG thresholds are determined by comparing the nation's combined Scale and Momentum (calculated via four-quarter rolling averages) against the Gold Standard of a mature, advanced Tier 1 economy (such as the USA or leading Western European industrial powers).

🟢 Green: The Sovereign Arsenal (>90% of Standard)
The nation possesses a massive industrial base that is actively and consistently expanding. It has the physical factory space and workforce to replace heavy combat losses and sustain a high-intensity conflict independently for an extended period.

🟡 Amber: Maintenance Mode (70% - 90% of Standard)
The industry is in "Just-in-Time" mode. While stable over the year, it lacks "Surge Depth." The nation can support peacetime training, but would likely exhaust manufactured supplies quickly in a major war and struggle to restart "cold" production lines.

🔴 Red: Industrial Atrophy (<70% of Standard)
The defense sector is either critically undersized or is actively shrinking on a rolling basis. This represents a loss of sovereign capability; the nation has lost the technical skills to build its own safety and is entirely dependent on foreign powers for its survival.`,
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
