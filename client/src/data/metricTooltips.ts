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
  sickness_absence: `Think of this as the "Health Thermometer" of the entire workforce. It measures the percentage of total working time lost because employees are too unwell to perform their roles. While a small amount of sickness is a natural part of life, a high rate suggests deeper systemic issues, such as widespread burnout, poor mental health, or a population struggling with chronic physical conditions. When this number is high, the "engine" of the economy is effectively losing power because a significant portion of its strength is sitting on the sidelines recovering rather than contributing.

How it is Calculated

The rate is calculated by using the NHS sickness absence rates data and comparing the total number of "scheduled" working days against the number of days actually missed due to illness. To find the rate, you take the total days lost and divide them by the total days that were available for work across the entire labor force. This provides a percentage that allows for a fair comparison between different industries or even different countries. It captures everything from short-term minor illnesses to long-term absences lasting several months, providing a comprehensive view of how much human potential is being "drained" by ill health. NHS data was used as the data set size is such that it is considered to provide a reflection of the UK workforce health overall. This data set was compared to the CIPD data for workplace health which looks at all sectors of the UK, not just NHS. The NHS data was chosen as it is published monthly, where CIPD and ONS data is annual, and when excluding the impact of covid the pearson correlation coefficient of 0.72 for the two data sets over the past 15+ years suggests they track each other well, however, NHS absence rates are on average approximately 1-1.5% consistently higher than that of the economy as a whole in the CIPD survey.

Real Impact on the Person on the Street

For the person on the street, high sickness absence isn't just a health issue; it's a wealth issue. When the national absence rate is high, it creates a "Stagnation Tax." Businesses facing high absence costs have less money to invest in technology or pay rises, directly suppressing your Real Wage Growth. On a macroeconomic level, if the rate improved to match global "Gold Standards," the result would be a massive "Productivity Dividend"—effectively adding billions to the economy without raising taxes. This would manifest as more stable public finances, better-funded infrastructure, and lower inflation as the supply of goods and services becomes more reliable. Conversely, a high rate traps everyone in a "Burnout Cycle": those at work must cover for those who are absent, increasing their own stress and eventually making them more likely to fall ill, further dragging down national prosperity.

Why the RAG Thresholds were chosen

These thresholds are calibrated against "Gold Standard" high-productivity, high-wellbeing economies (such as Switzerland), where sickness absence is kept low through proactive occupational health and efficient labor markets.

🟢 Green (Below 3.0%): The "Gold Standard" Zone. This represents a world-class, resilient workforce. At this level, sickness is rare and manageable, allowing for maximum national output, higher business profits, and the strongest potential for wage growth.

🟡 Amber (3.0% – 4.5%): The "Strained" Zone. This indicates a workforce that is functioning but vulnerable. It suggests that while the economy is moving, underlying pressure points like stress or seasonal illness are starting to chip away at national productivity and individual spending power.

🔴 Red (Above 4.5%): The "Crisis" Zone. In 2026, the current proxy data for the wider workforce sits in this zone (approx. 5.3%). At this level, absence is systemic rather than incidental. It signals a "Productivity Leak" that prevents the economy from growing, leading to higher costs for consumers and a persistent "wellbeing debt" that hampers long-term national health.`,
};

export function getEmploymentTooltip(metricKey: string): string | undefined {
  return EMPLOYMENT_TOOLTIPS[metricKey];
}

/** Education section: metricKey -> tooltip text */
export const EDUCATION_TOOLTIPS: Record<string, string> = {
  attainment8: `Attainment 8 is a measure of a student's "Academic Breadth and Depth." It represents how well a young person performs across a wide range of subjects, rather than just focusing on one or two areas. Think of it as an "Educational Decathlon"—to get a high score, a student cannot just be good at sprinting (Maths); they must also perform well in endurance (English), throwing (Sciences), and jumping (Arts or Humanities). It is the primary way we measure whether a school system is producing well-rounded, capable citizens ready for the modern workforce.

How is it Measured

Attainment 8 takes a student's grades in eight specific subjects and turns them into points. To ensure "core" skills are prioritized, the subjects are divided into four "buckets." To understand the points, use this mapping to traditional letter grades:
9.0 = High A*
7.0 = A
5.5 = High B
5.0 = B / Strong Pass
4.5 = Average Pass / C+
4.0 = Standard Pass / C
3.0 = D

The Calculation Method:

Pillar 1: The Core (Double Weighted): English and Maths. Because these are foundational, their individual point scores are doubled.

Pillar 2: The Academic Foundation: The best three scores from the Sciences, History, Geography, and Languages are added.

Pillar 3: The Specialist Breadth (Open): The three highest scores from any other approved subjects (Vocational, Arts, or Music) are added.

The Final Score: The total points from all 10 available "slots" are added together and then divided by 10 to get the final Attainment 8 Average Score.

RAG Threshold Logic (Average Score Basis)

These thresholds are based on the Average Score (the result after dividing by 10), comparing performance against the Gold Standard of a mature, advanced economy.

🟢 Green (Above 5.5): Elite Performance. The average student is achieving a "High B / A" grade across all subjects. This represents a world-leading education system producing a highly competitive, top-tier workforce.

🟡 Amber (4.5 – 5.5): Solid Competency. The average student is achieving between a "Strong Pass" and a "High B." The system is functional and stable but lacks the "top-end" excellence found in elite global tiers.

🔴 Red (Below 4.5): Critical Skill Gap. The average performance is below a "Strong Pass" (4.5) across the board. This indicates a "hollowing out" of the talent pool and a potential long-term economic dependency.`,
  teacher_vacancy_rate: `Teacher Vacancies measures the number and rate of unfilled teaching positions across state-funded schools in England. The Department for Education calculates this from the annual School Workforce Census, conducted each November, where schools report posts that are vacant or temporarily filled. The vacancy rate is: (vacancies ÷ total posts) × 100. Data is broken down by phase (primary/secondary), subject, and region. Certain subjects face acute shortages: physics, computing, modern foreign languages, and design technology regularly recruit below target. High vacancy rates correlate with increased class sizes, subject non-availability, and reliance on non-specialist or supply teachers. Retention is equally problematic, with significant proportions leaving within 5 years.

Data Source: DfE: School Workforce

Why it matters to you if it gets worse: Class sizes increase, subjects are dropped, and your child's education suffers due to relying on non-specialist or temporary staff.`,
  neet_rate: `Think of the NEET rate as the "Wasted Potential" index. It tracks the percentage of young people (typically aged 16–24) who are currently "parked" on the sidelines of society—they aren't in a classroom, they aren't learning a trade, and they aren't earning a paycheck. While some people in this group are taking a temporary break or caring for family, a high NEET rate usually signals a "disconnection" from the future. It is a warning light that a generation is failing to gain the experience they need to become the productive taxpayers and innovators of tomorrow.

How it is Calculated

This metric is primarily derived from national labor force surveys, which interview a large, representative sample of households to determine the work and study status of residents. To calculate the rate, we look at the total population of young people within a specific age bracket. First, we identify everyone in that group who is not currently enrolled in any form of formal education or training. From that sub-group, we then remove anyone who is currently in a job (even part-time). The remaining number—those who are neither learning nor working—is divided by the total number of young people in that age group to produce a percentage. This gives a clear view of how much of the "youth engine" is currently idle.

Real Impact on the Person on the Street

For the person on the street, the NEET rate is a massive Economic Gravity metric. When young people are NEET for long periods, they suffer from "wage scarring"—they never fully catch up on the earnings they missed, which means they spend less in local shops and pay less tax over their lifetime. For you, this means a lower national tax base, which leads to higher individual taxes or poorer public services. On a community level, high NEET rates often correlate with higher crime and a sense of social decay. Economically, a "lost generation" represents a multi-billion pound loss in future GDP; it's like a factory where 10% or 15% of the machinery is permanently switched off, but the owner still has to pay the rent and maintenance for the whole building.

Why the RAG Thresholds were chosen

These thresholds are calibrated against "Gold Standard" advanced economies with high-functioning apprenticeship and vocational systems (such as Germany, Switzerland, or the Netherlands), where youth unemployment and disconnection are kept historically low.

🟢 Green (Below 8.0%): The "High-Aspiration" Standard. This represents a world-class economy where the transition from school to work is seamless. It indicates that almost every young person is either building skills or contributing to the economy, ensuring long-term national growth.

🟡 Amber (8.0% – 12.0%): The "Fractured" Zone. This is the average for many developed nations. It suggests that while the majority are moving forward, a significant minority is "falling through the cracks," creating a long-term economic burden and a future shortage of skilled workers.

🔴 Red (Above 12.0%): The "Scarring" Zone. At this level, the country faces a systemic crisis of youth disconnection. This predicts a future of low productivity, higher social costs, and a struggle to attract high-wage employers. It signals that the "talent pipeline" is broken and the economy will struggle to remain competitive.`,
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
  crown_court_backlog: `Think of this as the "Justice Queue per head of population." It measures outstanding criminal cases waiting to be heard in the Crown Courts of England and Wales—per 100,000 people. The Crown Courts handle the most serious offences: murder, rape, robbery, serious assault, and large-scale fraud. A value of 107.4 means that for every 100,000 residents, roughly 107 defendants are awaiting trial and 107 victims are waiting for their day in court. The per-capita framing makes it comparable across time periods as the population grows and across jurisdictions of different sizes.

How it is Calculated

The Ministry of Justice (MoJ) calculates the raw backlog from the Common Platform and XHIBIT case management systems used by Crown Courts across England and Wales. A case enters the backlog when a defendant is sent or committed to the Crown Court for trial and exits when the case reaches a conclusion (conviction, acquittal, or discontinuation). The headline figure is the total "open caseload"—all cases that have entered the system but not yet concluded. We divide that raw count by the mid-year England & Wales population estimate and multiply by 100,000 to produce the per-capita rate shown here. The MoJ also tracks the median age of open cases, the median time from charge to completion, and breakdowns by offence type and court location. Data is published quarterly in the "Criminal Court Statistics Quarterly" bulletin.

Real Impact on the Person on the Street

The Crown Court backlog is not an administrative inconvenience—it causes real suffering to real people:

1. Victims Trapped in Limbo

The Victims' Commissioner's 2025 report described the backlog's impact as "devastating." Victims of serious crimes—sexual assault, domestic violence, grievous bodily harm—are forced to live in a state of suspended trauma for years while awaiting trial. They cannot move on with their lives, their relationships suffer, and their mental health deteriorates. Many victims withdraw from cases entirely because they simply cannot endure the wait, which means their attacker faces no consequences. Nearly two-thirds (62%) of the backlog comprises violent, sexual, and drug offences—the most traumatic crime types for victims to relive.

2. Justice Delayed is Justice Denied

As of September 2025, the median time from charge to completion was 179 days—nearly six months. Over 20,000 cases had been open for more than a year, a record. When witnesses are asked to recall events from two or three years ago, their evidence is inherently weaker. CCTV footage may have been overwritten. Co-operating witnesses may have moved away. The quality of justice itself is degraded by delay, making wrongful acquittals and wrongful convictions both more likely.

3. The Taxpayer Cost

Every day a remand prisoner sits in jail awaiting trial costs the taxpayer approximately £130. With thousands of defendants on remand for months or years, the financial burden is enormous. Meanwhile, judges, court staff, and barristers are paid whether cases proceed or are adjourned. The government has committed a record 110,000 Crown Court sitting days for 2025–26, but even this has not been sufficient to reduce the queue. If defendants exceed their custody time limits due to delays, they must be released—potentially putting dangerous individuals back on the streets.

Why the RAG Thresholds were chosen

The thresholds are derived from the Crown Court's pre-pandemic operating capacity, converted to per-100,000 population to remain meaningful as the population changes.

🟢 Green (Below 57.6 per 100k — equivalent to ~40,000 cases): This is the "Functioning Justice" zone. Before the COVID-19 pandemic, the Crown Court backlog sat at approximately 39,000 cases. At this level, most cases are heard within a reasonable timeframe, victims are not subjected to years of waiting, and the quality of evidence remains strong.

🟡 Amber (57.6 – 86.3 per 100k — equivalent to ~40,000–60,000 cases): This is the "Strained System" zone. Waiting times are noticeably longer, some victims experience delays of over a year, and courts are forced to prioritise the most serious cases at the expense of "lesser" offences.

🔴 Red (Above 86.3 per 100k — equivalent to >60,000 cases): This is the "Justice Crisis" zone. The UK has been firmly in this territory since 2021, with the backlog reaching a record 79,619 cases (≈114.6 per 100k) in September 2025. At this level, the system cannot clear cases faster than they arrive. Victims wait years, witnesses forget, and public confidence in the courts collapses.`,
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

  street_confidence_index: `This is the "Street Confidence Index." It measures the percentage of the population that feels "Not very safe" or "Not safe at all" walking alone in their local area — effectively capturing the real-time psychological state of the nation. Unlike official crime statistics, which only track reported incidents, this metric reflects the impact of police visibility, street lighting, and the presence of anti-social behaviour on daily life. A lower percentage means more people feel safe.

How is it Measured?

This metric is tracked through high-frequency, representative surveys (the YouGov Personal Safety Tracker).

The Methodology: Participants are asked: "Generally speaking, how safe or unsafe do you feel walking on the street during the day in your area?"

The Calculation: We combine the "Not very safe" and "Not safe at all" responses, excluding "Don't know" and "Prefer not to say", to create the percentage of the population living with a restrictive fear of crime.

Frequency: The YouGov tracker is biannual (February and August). Quarterly values are interpolated between waves to provide a smoother trend, allowing the state to react to emerging anxieties before they become entrenched.

Real-World Impact: Why should you care?

Economic Vitality: When people feel safe, they use public transport and visit high streets. A low "feeling unsafe" percentage is a prerequisite for a thriving "24-hour" economy and local retail growth.

The "Fear Tax": When this metric rises, citizens pay a "Fear Tax" — spending more on private taxis, home security, or avoiding certain areas, which reduces overall disposable income and freedom of movement.

Social Cohesion: Low perceived insecurity indicates a strong social contract. It suggests that the "person on the street" trusts their neighbours and the authorities to maintain order.

RAG Threshold Logic (International Gold Standard)

The RAG thresholds are benchmarked against Gold Standard mature economies — specifically The Netherlands, Denmark, and Singapore — where high-density urban safety is a core pillar of national identity. In these nations, the combined "feeling unsafe" percentage consistently tracks below 15%.

🟢 Green (Below 20% feeling unsafe / above 80% feeling safe): Social Harmony. Aligned with the Gold Standard (e.g., Netherlands). Safety is a "background fact." The public feels no restriction on movement, and trust in the state's ability to maintain order is strong.

🟡 Amber (20% – 30% feeling unsafe / 70–80% feeling safe): Emerging Anxiety. The nation is beginning to decouple from the Gold Standard. While the majority feel safe, a significant minority are changing their behaviours (avoiding certain routes or times) due to perceived risks.

🔴 Red (Above 30% feeling unsafe / below 70% feeling safe): Systemic Fear. A critical breakdown in the social contract. Fear of crime is actively suppressing economic activity and civic engagement. The state is perceived as having lost control of the "public square."`,

  asb_low_level_crime: `This metric tracks the quarterly rate of Anti-Social Behaviour and Low-Level Crime incidents per 100,000 population across England and Wales. It aggregates nine categories of street-level crime recorded by all 43 police forces: Anti-social behaviour, Shoplifting, Bicycle theft, Other theft, Theft from the person, Vehicle crime, Public order offences, Other crime, and Criminal damage and arson.

How is it Calculated?

Source: Police-recorded crime data published monthly by data.police.uk, which covers all 43 territorial police forces in England and Wales.

The Calculation: All incidents matching the nine included crime types are summed for each calendar quarter (Q1: Jan–Mar, Q2: Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec). The total is then expressed as a rate per 100,000 population using the latest ONS mid-year population estimate.

Frequency: Updated quarterly from monthly police data releases. Each month's data is typically published with a 2–3 month lag.

Real-World Impact:

These are the crimes that most directly shape the day-to-day experience of living in a neighbourhood. A rising rate of ASB and low-level crime erodes community confidence, depresses property values, and drives the "broken windows" cycle where visible disorder invites more serious offending. Shoplifting losses alone cost UK retailers over £1 billion annually, costs which are passed on to consumers through higher prices.

RAG Thresholds (per 100,000 population per quarter):

🟢 Green (Below 800): Low-level crime is well controlled. Communities feel orderly and safe.

🟡 Amber (800 – 1,200): Elevated disorder. Noticeable impact on quality of life in affected areas.

🔴 Red (Above 1,200): Widespread disorder indicating systemic pressures on neighbourhood policing.`,

  serious_crime: `This metric tracks the quarterly rate of Serious Crime incidents per 100,000 population across England and Wales. It aggregates five categories of the most harmful street-level crime: Violence and sexual offences, Robbery, Burglary, Drugs offences, and Possession of weapons.

How is it Calculated?

Source: Police-recorded crime data published monthly by data.police.uk, which covers all 43 territorial police forces in England and Wales.

The Calculation: All incidents matching the five included serious crime types are summed for each calendar quarter (Q1: Jan–Mar, Q2: Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec). The total is then expressed as a rate per 100,000 population using the latest ONS mid-year population estimate.

Frequency: Updated quarterly from monthly police data releases. Each month's data is typically published with a 2–3 month lag.

Real-World Impact:

These crimes represent the most severe threats to personal safety and community wellbeing. Violence and sexual offences alone account for roughly a third of all recorded crime. Rising serious crime rates signal a breakdown in both deterrence and prevention, with consequences that extend far beyond the immediate victims — affecting community trust, economic investment, and the long-term mental health of entire neighbourhoods.

RAG Thresholds (per 100,000 population per quarter):

🟢 Green (Below 400): Serious crime is well contained. Strong deterrent effect from policing and justice system.

🟡 Amber (400 – 700): Elevated serious crime. Certain communities are experiencing disproportionate harm.

🔴 Red (Above 700): Critical levels of serious crime indicating systemic failures in prevention and deterrence.`,
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
  defence_spending_gdp: `Think of this as the "National Insurance Premium" for the country's physical security. It measures how much of the UK's total economic output is spent on defence—the armed forces, their equipment, their training, and their operations. If the figure is 2.1%, it means that for every £100 the UK economy generates, £2.10 goes to defence. It is the single most important indicator of whether a country is serious about its own security, because military capability is ultimately a function of sustained investment. Equipment rusts, personnel leave, and skills atrophy without consistent funding. In a world where Russia has invaded Ukraine, China is expanding militarily, and global instability is rising, this number determines whether the UK can defend itself and its allies—or whether it is relying on others to do it.

How it is Calculated

The Ministry of Defence reports UK defence expenditure using NATO-agreed definitions, which are broader than the core MOD budget alone. NATO definitions include: military personnel costs, equipment procurement and research, military operations, military pensions and war pensions, and certain intelligence and security spending. This total is then divided by nominal GDP as published by the ONS. The percentage is: (total defence spending under NATO definitions ÷ GDP) × 100. Calculation methodology matters significantly—different accounting treatments can shift the headline figure by 0.1–0.2 percentage points. The UK government also reports defence spending in real terms (adjusted for inflation) and as per-capita spending, which provide additional context. Data is published in the MOD Annual Report and Accounts and cross-referenced with NATO's own published spending figures for member states.

Real Impact on the Person on the Street

Defence spending might feel remote from daily life, but it determines the security environment you live in:

1. The Deterrence Dividend

The primary purpose of defence spending is not to fight wars—it is to prevent them. A well-funded military deters potential aggressors from challenging the UK or its allies. Russia's invasion of Ukraine in 2022 was a stark reminder that conventional warfare has returned to Europe. If the UK's military is visibly underfunded—with hollowed-out regiments, mothballed ships, and ageing aircraft—it sends a signal to adversaries that aggression may go unchallenged. The cost of deterrence is measured in billions; the cost of a war that deterrence failed to prevent is measured in lives and economic devastation.

2. Trade Route Protection and Price Stability

The UK is an island trading nation. Over 90% of its goods arrive by sea, and its energy supplies depend on secure pipelines and shipping lanes. Defence spending funds the Royal Navy's ability to keep these routes open. When Houthi rebels disrupted Red Sea shipping in 2024, it was allied naval forces—funded by defence budgets—that protected commercial vessels. Without this capability, shipping costs spike, supply chains break, and the price of everything from fuel to food on your supermarket shelf rises.

3. The Industrial and Jobs Multiplier

Defence spending is not money that vanishes into a black hole. It sustains a domestic industrial base of shipyards (BAE Systems, Babcock), aerospace firms (Rolls-Royce, Leonardo), and thousands of small and medium-sized engineering companies. The defence sector directly employs over 200,000 people in the UK and supports many more indirectly. When defence spending rises, these industries invest in apprenticeships, research, and facilities; when it falls, skilled jobs disappear and sovereign manufacturing capability erodes—capability that is extremely difficult and expensive to rebuild once lost.

Why the RAG Thresholds were chosen

The thresholds are based on the UK government's stated commitments, NATO alliance obligations, and the spending levels assessed as necessary to maintain a credible Tier 1 military capability.

🟢 Green (Above 2.5%): This is the "Credible Deterrence" zone. The UK government committed in February 2025 to reaching 2.5% of GDP by 2027—described as "the biggest sustained increase in defence spending since the end of the Cold War." At this level, the armed forces can begin to reverse years of capability cuts, invest in next-generation platforms (Dreadnought submarines, GCAP sixth-generation fighters, autonomous systems), and maintain credible conventional deterrence alongside the nuclear deterrent.

🟡 Amber (2.0% – 2.5%): This is the "Minimum Commitment" zone. The UK currently sits in this bracket at approximately 2.1%. The 2% figure is the NATO baseline agreed at the 2014 Wales Summit, but it is increasingly seen as insufficient given the current threat environment. At this level, the UK meets its alliance obligations on paper but is forced to make difficult trade-offs between equipment programmes, leading to delayed procurements, reduced training, and stretched personnel.

🔴 Red (Below 2.0%): This is the "Capability Erosion" zone. Falling below the NATO 2% commitment would represent a political and strategic failure. It would signal to allies that the UK is not serious about collective defence, embolden adversaries, and accelerate the hollowing-out of military capability. Several NATO members have been criticised for spending below 2%, and the UK dropping into this category would severely damage its credibility as a leading member of the alliance.`,
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
  land_mass: `Think of this as the "Army Muscle Test." It measures the fighting weight of the UK's land forces—the British Army's ability to deploy credible, war-winning ground power. It is not a single equipment count or a manpower figure; it is a weighted composite score that combines four pillars of land capability into a single percentage, benchmarked against what a Tier 1 "Global Power" standard requires. If the score is 70%, it means the Army has 70% of the land force structure it would need to fight and sustain a high-intensity conflict against a peer adversary. This metric exists because modern warfare is won or lost on the ground. Air power can shape a battle and sea power can control supply lines, but only land forces can take and hold territory. The UK's ability to contribute meaningfully to a NATO Article 5 operation, or to conduct independent expeditionary operations, rests entirely on the strength measured here.

How it is Calculated

The Land Mass score is built from four weighted pillars, each normalised against a Tier 1 benchmark representing the minimum inventory a serious global power should maintain:

Pillar 1 – Armoured Strike (35% weighting): This measures heavy manoeuvre capability. It counts the UK's main battle tanks (MBTs)—currently 288 Challenger 2s—against a benchmark of 450, and armoured fighting vehicles (AFVs)—currently approximately 1,055—against a benchmark of 1,000. MBTs contribute 60% and AFVs 40% of this pillar. Armoured Strike is weighted highest because peer-on-peer warfare is ultimately decided by the ability to concentrate protected firepower.

Pillar 2 – Personnel Mass (30% weighting): This measures the number of full-time, trade-trained regular personnel available for deployment—currently approximately 125,680 against a benchmark of 150,000. No amount of advanced equipment matters without the trained soldiers to operate and sustain it. The British Army has been shrinking steadily since the 2010 Strategic Defence and Security Review, and recruitment and retention remain significant challenges.

Pillar 3 – Indirect Fires (20% weighting): This measures the Army's ability to deliver long-range firepower. It combines modern artillery systems (M270 MLRS, Archer, and equivalent)—currently approximately 75 against a benchmark of 300—with ground-based air defence batteries (Sky Sabre / Land Ceptor)—currently 7 against a benchmark of 12. Artillery contributes 70% and air defence 30%. The war in Ukraine has demonstrated that artillery is the dominant casualty-producing weapon in conventional warfare, and the UK's indirect fire capacity is significantly below peer-level requirements.

Pillar 4 – Depth / Reserves (15% weighting): This measures the Army's ability to regenerate and sustain operations over time. It combines active trained reserves (approximately 29,000 against a benchmark of 50,000), high-utility recallable veterans (approximately 25,000 against 30,000), and logistics mass (assessed at approximately 90% of requirement). Active reserves contribute 50%, recallable veterans 30%, and logistics 20%. Depth is essential because no army can fight a prolonged conflict with only its peacetime establishment—it must be able to call up trained reserves and sustain supply lines under fire.

The four pillar scores are combined using their weightings to produce a single 0–100 percentage score. Data sources include Janes ORBATs and equipment data, RUSI analysis, IISS Military Balance, MOD "UK Armed Forces Equipment and Formations 2025," and MOD Quarterly Service Personnel Statistics.

Real Impact on the Person on the Street

The Army's fighting weight might seem abstract, but it has very real consequences:

1. The NATO Warfighting Commitment

The UK is committed to leading a NATO warfighting division—a formation of 15,000–20,000 troops with full armoured capability—as its core contribution to the alliance's defence of Europe. General Sir Roly Walker, head of the Army, has stated the ambition to "double the Army's fighting power in three years and triple it by the end of the decade." If the Land Mass score is low, the UK cannot deliver on this commitment. In a scenario where Russia threatens a NATO member, the UK would be unable to deploy a credible ground force, leaving allies exposed and undermining the collective deterrence that keeps the peace.

2. The Ukraine Lesson

The war in Ukraine has provided a brutal, real-time education in what modern ground warfare demands. Armoured vehicles are being destroyed at rates not seen since the Second World War. Artillery ammunition is consumed in quantities that have emptied NATO stockpiles. Personnel casualties in a single year exceed the UK's entire regular Army. If the UK had to fight a similar conflict, a low Land Mass score would mean running out of tanks, guns, and trained soldiers within weeks—not months. The score measures whether the country has the physical mass to fight, absorb losses, and continue fighting.

3. The Sovereign Choice

A weak land force does not just limit what the UK can do alongside allies—it limits what it can do alone. Whether responding to a crisis in a British Overseas Territory, conducting an evacuation operation, or providing humanitarian assistance at scale, the Army is the instrument of last resort. A hollowed-out Army means the government has fewer options in a crisis and is more dependent on the goodwill and availability of allies. National sovereignty is, in part, the ability to act independently when you must.

Why the RAG Thresholds were chosen

The thresholds are based on the Tier 1 benchmarks used in the composite calculation. They represent the levels at which the UK's land forces can be considered credible, strained, or inadequate for high-intensity operations.

🟢 Green (90% and above): This is the "War-Ready" zone. At this level, the Army meets or approaches the Tier 1 Global Power standard across all four pillars. It can deploy a full warfighting division, sustain operations for an extended period, absorb combat losses, and regenerate. This is the standard the UK should aspire to as a permanent member of the UN Security Council, a nuclear-weapon state, and one of NATO's framework nations.

🟡 Amber (70% – 89%): This is the "Capable but Strained" zone. The UK currently sits in this bracket. The Army can deploy a credible force for a limited operation, but it lacks the depth and mass for a sustained high-intensity conflict. Key capability gaps—particularly in indirect fires, air defence, and reserve depth—would become critical weaknesses in a peer-on-peer scenario. Equipment programmes like Challenger 3, Ajax, and Boxer are in progress but have not yet delivered at scale.

🔴 Red (Below 70%): This is the "Hollow Force" zone. At this level, the Army's structure is seriously deficient in one or more pillars. It could not sustain a major operation without significant allied support and would struggle to meet its NATO commitments. Critical mass has been lost in armour, artillery, or personnel to the point where the force is no longer credible as a Tier 1 land force. Rebuilding from this level takes a decade or more and costs far more than sustained investment would have done.`,
  air_mass: `Think of this as the "Air Power Balance Sheet." It measures the fighting strength of the UK's air combat capability—the Royal Air Force's ability to control the skies, strike targets on the ground, project power at distance, and adapt to the age of autonomous warfare. Like Land Mass, it is a weighted composite score combining four pillars into a single percentage, benchmarked against a Tier 1 "Global Power" standard. If the score is 48%, it means the RAF has less than half the air power structure a leading military power needs. Air superiority is the foundation upon which all other military operations depend. Without it, naval forces cannot operate safely, ground forces are exposed to devastating attack from above, and the UK cannot move troops or supplies to where they are needed. Every major conflict since 1945 has confirmed the same lesson: the side that controls the air wins.

How it is Calculated

The Air Mass score is built from four weighted pillars, each normalised against Tier 1 benchmarks:

Pillar 1 – Combat Strike (40% weighting): This measures the RAF's ability to achieve air superiority and deliver precision strike. It counts mission-ready multi-role fighters—currently approximately 120 aircraft (a mix of Eurofighter Typhoon FGR4 and F-35B Lightning)—against a benchmark of 300. This pillar carries the highest weighting because air-to-air and air-to-ground combat capability is the irreducible core of air power. The UK has 37 F-35B aircraft in service as of mid-2025, with a total commitment to purchase 138, although only 48 are currently on contract. The Typhoon fleet provides the backbone of day-to-day air defence and NATO Quick Reaction Alert duties.

Pillar 2 – Force Multipliers (25% weighting): This measures the support aircraft that make fighters effective over long distances. It combines tanker aircraft (14 Voyager KC2/KC3s) and airborne early warning aircraft (3 E-7 Wedgetail, replacing the retired E-3D Sentry)—a total of 17 against a benchmark of 25. Without tankers, fighters cannot reach distant targets or sustain combat air patrols. Without airborne early warning, fighters are blind to threats beyond their own radar horizon. Force multipliers are the difference between a home-defence air force and one capable of expeditionary operations.

Pillar 3 – Strategic Lift (20% weighting): This measures the RAF's ability to move troops, equipment, and supplies over strategic distances. It counts heavy and medium transport aircraft—currently 30 (8 C-17 Globemaster III and 22 A400M Atlas)—against a benchmark of 40. Strategic airlift is the physical embodiment of global reach. When British citizens need evacuating from a crisis zone, when humanitarian aid must be delivered to a disaster, or when an armoured battle group must deploy to Eastern Europe, it is the transport fleet that makes it happen.

Pillar 4 – Autonomous Mass (15% weighting): This is the most forward-looking pillar and measures the UK's investment in autonomous combat platforms—"loyal wingman" aircraft, uncrewed combat air vehicles, and other Autonomous Collaborative Platforms (ACPs). Currently, the UK has effectively zero operational platforms against a benchmark of 150. This pillar reflects the reality that the future of air combat is being reshaped by autonomy. The 2025 Strategic Defence Review stated that "the primacy of crewed aircraft is being fundamentally challenged" and committed to accelerating ACP development alongside the GCAP sixth-generation fighter programme with Japan and Italy. Nations that fail to develop autonomous air capability risk being outmatched by adversaries fielding large numbers of cheaper, expendable uncrewed systems.

The four pillar scores are combined using their weightings to produce a single 0–100 percentage score. Data sources include FlightGlobal, RUSI Airpower analysis, IISS Military Balance, MOD equipment statistics, and the 2025 Strategic Defence Review.

Real Impact on the Person on the Street

Air power may seem distant from daily life, but it is the invisible shield that enables everything else:

1. The Air Defence of the United Kingdom

The RAF maintains 24/7 Quick Reaction Alert (QRA), with armed Typhoon fighters on standby at RAF Coningsby and RAF Lossiemouth to intercept unidentified aircraft approaching UK airspace. Russian military aircraft routinely probe NATO airspace—there were dozens of such intercepts in 2024 alone. If the Combat Strike pillar is weak, there are fewer aircraft to maintain QRA, cover training, and deploy overseas simultaneously. The maths is unforgiving: fighters in maintenance cannot fly, fighters deployed abroad cannot defend the homeland, and a shrinking fleet means impossible choices between commitments.

2. Strike Capability and Deterrence

Air power provides the UK's fastest conventional response option. When the UK participated in strikes against Houthi targets in Yemen in 2024, it was RAF Typhoons, supported by Voyager tankers, that delivered the capability from thousands of miles away. The ability to strike precisely, at range, and at short notice is a powerful deterrent. A weak air force—one that cannot operate beyond its own borders without allied support—signals to adversaries that the UK's military reach is limited and its threats are hollow.

3. The Autonomous Revolution

The war in Ukraine has demonstrated that cheap, mass-produced drones can destroy equipment worth millions and change the balance of an entire battlefield. The UK's current score of zero in the Autonomous Mass pillar is a stark indicator of a capability gap that adversaries—including China, the US, and even mid-tier powers—are filling rapidly. If the UK does not invest in autonomous combat platforms, it risks fielding an air force that is technologically outmatched within a decade. The platforms being developed today—under programmes like GCAP and the Autonomous Collaborative Platform initiative—will determine whether the RAF remains a world-class air force or becomes a legacy force flying increasingly vulnerable crewed aircraft against swarms of uncrewed ones.

Why the RAG Thresholds were chosen

The thresholds are based on the Tier 1 benchmarks used in the composite calculation and reflect the levels at which the UK's air forces are credible, strained, or inadequate for high-intensity operations.

🟢 Green (90% and above): This is the "Air Dominance" zone. At this level, the RAF meets or approaches the Tier 1 standard across all four pillars. It can achieve air superiority in a contested environment, sustain combat operations, project power globally, and is investing credibly in autonomous capability. This is the standard expected of a nation that operates aircraft carriers, maintains a nuclear deterrent, and leads NATO air operations.

🟡 Amber (70% – 89%): This is the "Capable but Stretched" zone. At this level, the RAF can conduct effective air operations but faces trade-offs between commitments. Fighter numbers are sufficient for peacetime QRA and limited expeditionary operations but would be strained in a sustained high-intensity conflict. Force multiplier and strategic lift shortfalls limit operational reach and endurance.

🔴 Red (Below 70%): This is the "Capability Crisis" zone. The UK currently sits in this bracket, driven largely by the zero score in the Autonomous Mass pillar. At this level, significant gaps exist in one or more pillars. The fighter fleet is below the critical mass needed for concurrent home defence and overseas operations. Force multiplier and lift shortfalls constrain the ability to operate at distance. The absence of autonomous platforms means the UK is not keeping pace with the technological direction of modern air warfare. Recovering from this position requires sustained investment over a decade or more.`,
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
  natural_change: `Think of this as the "Demographic Pulse." It measures the difference between the number of babies born and the number of people who die in the UK each year—the most fundamental indicator of whether a population is sustaining itself or slowly fading. If the figure is +27,200, it means 27,200 more people were born than died. If it turns negative, the population is shrinking from within, regardless of migration. This metric strips away the political noise around immigration and asks the simplest possible question: is the country producing enough children to replace the people who die? For most of the post-war period, the answer was comfortably yes. Today, the answer is barely—and the trajectory is heading towards no.

How it is Calculated

The ONS calculates Natural Change from civil registration data—every birth and death in the UK must be legally registered. The formula is straightforward: Natural Change = Live Births − Deaths. Data is drawn from the ONS Vital Statistics series (VVHM) and published in the mid-year population estimates. For the year to mid-2024, there were approximately 662,100 births and 645,900 deaths in the UK, producing a natural change of just +16,200—a vanishingly small positive figure for a population of 69 million. The Total Fertility Rate (TFR) for England and Wales fell to 1.41 children per woman in 2024, the lowest on record for the third consecutive year and far below the 2.1 "replacement level" needed to maintain a stable population without migration. The TFR has been in continuous decline since 2010. Meanwhile, the number of deaths is rising as the large post-war baby-boom generation ages. The collision of falling births and rising deaths is steadily compressing natural change towards zero.

Real Impact on the Person on the Street

Natural change might sound like an abstract demographic statistic, but it shapes the country you live in:

1. The Vanishing Community

When natural change turns negative in a local area—when more people die than are born—the effects are tangible and irreversible without intervention. Schools close because there are not enough children to fill them. GP surgeries and maternity units are consolidated or shut. Shops, pubs, and post offices lose customers and close. The local tax base shrinks, meaning fewer resources for roads, parks, and libraries. Several regions and local authorities in the UK already experience natural decrease, and the trend is spreading. For communities in rural and coastal areas, negative natural change accelerates a spiral of decline that is extremely difficult to reverse.

2. The Workforce Pipeline

Every baby born today is a future worker, taxpayer, soldier, nurse, or engineer in 20 years' time. When the birth rate falls persistently below replacement, the pipeline of young people entering the labour force narrows. This creates a structural dependency on immigration to fill essential roles—from NHS staff to care workers to construction labourers. If immigration is also restricted, the result is labour shortages, wage inflation in some sectors, and an economy that cannot grow because there are simply not enough people to do the work.

3. The Fiscal Time Bomb

Natural change is directly linked to the old-age dependency ratio. When births fall and life expectancy remains high, the ratio of working-age people to retirees deteriorates. Fewer workers must fund the pensions, healthcare, and social care of a growing elderly population through taxation. The Office for Budget Responsibility has identified this demographic shift as one of the most significant long-term fiscal risks facing the UK. A sustained period of negative natural change would intensify this pressure dramatically, requiring either significant tax rises, benefit cuts, or a fundamental redesign of the welfare state.

Why the RAG Thresholds were chosen

The thresholds are based on the demographic reality that positive natural change indicates a self-sustaining population, while negative natural change signals structural decline.

🟢 Green (Positive — above zero): This indicates that births exceed deaths—the population is at least partially sustaining itself through natural reproduction. The UK currently sits just in this zone, but only barely. A positive natural change, even a small one, provides a demographic buffer and reduces total dependence on migration for population maintenance.

🟡 Amber (At or near zero): This is the "Demographic Stall" zone. When natural change hovers around zero, the population has effectively stopped reproducing itself. Any small fluctuation—a bad flu season, a further dip in fertility—can tip the balance into natural decrease. The country is entirely dependent on net migration for any population growth. Planning for public services becomes more difficult because the underlying population trajectory is uncertain.

🔴 Red (Negative — below zero): This is the "Population Decline" zone. More people are dying than being born. Without significant net migration, the population shrinks. Communities hollow out, the workforce contracts, and the fiscal burden on remaining workers intensifies. Several European countries (Italy, Greece, Japan) have been in this zone for years, and the consequences—depopulating villages, strained pension systems, economic stagnation—are well documented.`,
  old_age_dependency_ratio: `Think of this as the "Shoulder Burden" metric. It measures how many retired people each group of working-age people must financially support. Expressed as the number of people aged 65 and over per 1,000 people of working age (16–64), it answers a brutally simple question: how many shoulders are carrying the load? If the ratio is 278, it means there are 278 retirees for every 1,000 workers—roughly one pensioner for every 3.6 workers. In the 1970s, there were five workers for every retiree. By 2050, projections suggest there could be fewer than 2.5. This is not a distant abstraction—it determines how much of your pay packet goes to taxes that fund state pensions, the NHS, and social care for the elderly. It is the single most important metric for understanding the long-term sustainability of the welfare state.

How it is Calculated

The ONS calculates the Old-Age Dependency Ratio (OADR) from mid-year population estimates and national population projections. The formula is: (Population aged 65 and over ÷ Population aged 16 to 64) × 1,000. This uses the same data sources as the mid-year population estimates—updated annually from Census base counts using births, deaths, and migration data through the cohort component method. The ONS also publishes projections under multiple scenarios (principal projection, high-migration variant, low-migration variant) to show how the ratio changes under different assumptions about fertility, mortality, and migration. The ratio is published for the UK as a whole and broken down by country (England, Scotland, Wales, Northern Ireland) and by local authority. The state pension age is a critical companion variable—as the pension age rises (currently 66, rising to 67 by 2028 and potentially 68 thereafter), the denominator changes, which mechanically lowers the ratio even if the underlying demographics have not improved.

Real Impact on the Person on the Street

This ratio directly determines the financial pressure on every working person in the country:

1. The Tax Squeeze

State pensions are not funded from a savings pot—they are paid from current taxation under a "pay as you go" system. When the ratio rises, fewer workers are paying the taxes that fund more pensioners' retirement income. The state pension currently costs over £130 billion per year and is protected by the "triple lock" (rising each year by the highest of inflation, average earnings growth, or 2.5%). As the ratio worsens, the government faces an impossible trilemma: raise taxes on workers, cut pension entitlements for retirees, or borrow more. The Office for Budget Responsibility has identified the ageing population as the single largest long-term fiscal risk, projecting that age-related spending (pensions, health, social care) will consume an ever-growing share of GDP.

2. The NHS and Social Care Crunch

People aged 65 and over account for approximately 40% of NHS hospital spending despite being roughly 19% of the population. As the ratio rises, demand for healthcare—hip replacements, cataract surgery, cancer treatment, dementia care—increases faster than the tax base that funds it. Social care is even more strained: over 1.5 million older people in England have unmet care needs, and the social care workforce has a vacancy rate above 8%. A rising dependency ratio means more people needing care, fewer working-age people to provide it, and less tax revenue to pay for it.

3. The Intergenerational Contract

The dependency ratio is ultimately a measure of intergenerational fairness. Today's workers fund today's pensioners on the implicit promise that future workers will fund their retirement in turn. When the ratio deteriorates, each successive generation of workers bears a heavier burden. Younger generations already face higher housing costs, larger student debts, and lower rates of home ownership than their parents. Adding significantly higher taxes to fund a growing elderly population risks a breakdown in the social contract between generations—a political and social tension that is already visible in debates about the triple lock, inheritance tax, and intergenerational wealth transfer.

Why the RAG Thresholds were chosen

The thresholds are based on the levels at which the dependency ratio remains manageable, becomes strained, or creates unsustainable fiscal pressure, informed by ONS projections and OBR fiscal sustainability analysis.

🟢 Green (Below 300 per 1,000): This is the "Sustainable Balance" zone. At this level, there are more than 3.3 workers per retiree. The tax base is broad enough to fund pensions, healthcare, and social care without imposing excessive burdens on workers. The UK currently sits just within this zone at approximately 278 per 1,000, but the trajectory is upward.

🟡 Amber (300 – 350 per 1,000): This is the "Growing Pressure" zone. At this level, there are between 2.9 and 3.3 workers per retiree. The fiscal burden on working-age people is noticeably higher. Governments are forced into difficult trade-offs: raising the pension age, means-testing benefits, or increasing National Insurance contributions. Public services for the elderly begin to show visible strain.

🔴 Red (Above 350 per 1,000): This is the "Fiscal Crisis" zone. At this level, there are fewer than 2.9 workers per retiree. The tax base cannot sustainably fund existing commitments to pensions, health, and social care without either radical reforms or significant borrowing. ONS projections suggest the UK could approach this level by the 2040s under some scenarios, particularly if net migration falls significantly. Countries like Japan, which already have ratios above 500, provide a warning of what this looks like in practice: a society where the working population is visibly overwhelmed by the cost of supporting the elderly.`,
  net_migration: `Think of this as the "Population Tap." It measures the difference between the number of people moving to the UK for the long term (12 months or more) and the number leaving—the single largest driver of UK population change in the 21st century. If the figure is +204,000, it means 204,000 more people arrived than left. Unlike natural change, which moves slowly over decades, net migration can shift dramatically from year to year in response to policy changes, global crises, and economic conditions. It swung from approximately 150,000 in 2012 to over 860,000 in the year ending December 2023, then fell back to 204,000 by mid-2025. No other demographic variable has the power to reshape the size, age structure, and skill mix of the population so rapidly. It is simultaneously the most economically significant and the most politically contested statistic in the UK.

How it is Calculated

The ONS calculates Long-Term International Migration (LTIM) net migration primarily from administrative data sources—Home Office visa records, the Department for Work and Pensions National Insurance number registrations, and NHS GP registration data—supplemented by the International Passenger Survey where gaps remain. The formula is: Net Migration = Immigration − Emigration, where both terms count only people intending to stay or leave for 12 months or more. For the year ending June 2025, total immigration was approximately 898,000 and total emigration was approximately 693,000, giving a net figure of 204,000. The ONS breaks the data down by nationality group (British, EU, non-EU), reason for migration (work, study, family, humanitarian), and country of origin. Methodology has changed significantly in recent years—the ONS moved from survey-based to administrative-data-based estimation after the 2021 Census revealed the International Passenger Survey had been undercounting both immigration and emigration. This means historical comparisons must be made with caution, as the improved methodology has revised some past figures substantially.

Real Impact on the Person on the Street

Net migration is not an abstract number—it shapes the country you live in, the services you use, and the economy you work in:

1. The Workforce Engine

The UK economy depends heavily on migrant labour to fill roles that the domestic population cannot or will not fill. The NHS employs over 200,000 staff who trained overseas—roughly one in six of its workforce. Social care relies on migrant workers for approximately 30% of its staff. Construction, hospitality, agriculture, and logistics all have significant dependence on international labour. When net migration falls sharply, these sectors face acute staffages that cannot be filled quickly from domestic sources, because training a doctor takes a decade and retraining a workforce takes years. The sharp fall from 860,000 to 204,000 in just 18 months is already creating visible pressures in care homes and seasonal agriculture.

2. The Housing and Infrastructure Squeeze

Every additional person needs somewhere to live, a GP, a school place, and transport. When net migration is high, demand for housing—already in chronic undersupply—intensifies. The UK has consistently built fewer than 250,000 homes per year against a need estimated at 300,000–380,000. High net migration accelerates the shortfall, pushing up rents and house prices, particularly in London and the South East. GP patient lists grow, school class sizes increase, and transport networks become more congested. The infrastructure was not built for the population the UK now has, let alone the one it is gaining.

3. The Fiscal and Cultural Balance

The fiscal impact of migration is hotly debated but well studied. Working-age migrants—particularly those in skilled employment—are net fiscal contributors, paying more in taxes than they consume in public services. However, the fiscal balance depends heavily on the age, skill level, and employment status of migrants. Large numbers of dependants, students who do not enter the workforce, or migrants who work in low-wage sectors contribute less. Beyond economics, rapid population change in local areas can strain social cohesion, particularly when housing, school places, and GP appointments are already scarce. Managing migration at a level that maximises economic benefit while maintaining public consent and infrastructure capacity is one of the most difficult policy challenges any government faces.

Why the RAG Thresholds were chosen

The thresholds are based on the range within which net migration provides economic benefit without overwhelming infrastructure and public services, informed by ONS data, OBR fiscal analysis, and the government's own stated policy ambitions.

🟢 Green (0 – 300,000): This is the "Managed Migration" zone. At this level, net migration supplements the domestic workforce, helps offset the ageing population, and is broadly absorbable by housing and public service infrastructure—provided investment keeps pace. The UK currently sits in this zone at approximately 204,000 following significant policy tightening on dependant visas and student routes.

🟡 Amber (300,000 – 500,000): This is the "Pressure Building" zone. At this level, net migration is generating significant additional demand for housing, healthcare, and school places that infrastructure investment is struggling to match. The economic benefits remain substantial, but public concern about pace of change and service pressure is elevated. Governments in this zone face growing political pressure to tighten controls.

🔴 Red (Above 500,000): This is the "Unsustainable Pace" zone. The UK experienced net migration above this level in 2022–2024, driven by post-pandemic recovery, the Ukraine and Hong Kong humanitarian schemes, and a surge in student and health-worker visas. At this level, housing demand far outstrips supply, GP and school capacity is overwhelmed in high-immigration areas, and the pace of population change exceeds the capacity of local communities and infrastructure to adapt. The sharp policy corrections that followed demonstrate that this level is not politically or practically sustainable over the medium term.`,
  healthy_life_expectancy: `Think of this as the "Quality Years Clock." It measures the average number of years a person born today can expect to live in "good" or "very good" health—not just alive, but genuinely well. If the figure is 61.7 years, it means the average person will enjoy roughly 62 years of good health before chronic illness, disability, or frailty takes hold, even though they may live to 80 or beyond. The gap between healthy life expectancy and total life expectancy—currently around 17–19 years—represents the years spent in poor health: years of pain, dependency, restricted mobility, and declining quality of life. This metric matters more than life expectancy alone because living longer is only a success if those extra years are healthy ones. The UK has been adding years of life but not years of health, and this gap is widening—particularly for women and for people living in the most deprived communities.

How it is Calculated

The ONS calculates Healthy Life Expectancy (HLE) using the Sullivan method, which combines two data sources. First, period life tables—derived from registered death data—provide the probability of surviving from one age to the next. Second, health prevalence data from the Annual Population Survey (APS) provides the proportion of people at each age who report their general health as "very good" or "good" (as opposed to "fair," "bad," or "very bad"). By multiplying the person-years lived at each age by the proportion in good health, the Sullivan method partitions total life expectancy into years in good health and years in poor health. HLE is published for males and females separately, at birth and at age 65, and broken down by UK country, English region, and local authority. For 2022–2024, UK male HLE at birth was 60.7 years and female HLE was 60.9 years—both the lowest since the series began in 2011–2013, and representing declines of 1.8 and 2.5 years respectively compared with the pre-pandemic period.

Real Impact on the Person on the Street

Healthy Life Expectancy affects your life more directly and personally than almost any other metric on this dashboard:

1. The "Years in Misery" Gap

The difference between total life expectancy (~80 years) and healthy life expectancy (~61 years) represents roughly 17–19 years that the average person will spend in poor health. These are years of chronic pain, limited mobility, heart disease, diabetes, respiratory conditions, arthritis, or cognitive decline. For many people, they are years of dependency—on family carers, on the NHS, on social care services that are chronically underfunded and overstretched. The gap is not distributed equally: men in the most deprived areas of England spend only 70% of their lives in good health, compared with 85% in the least deprived areas. For women in deprived areas, the figure is just 65%. The postcode you are born in can determine whether you get 20 years of healthy retirement or 20 years of illness.

2. The Working-Life Squeeze

The state pension age is 66 and rising to 67 by 2028, with further increases to 68 under consideration. If healthy life expectancy is 61 years, millions of people are being asked to work for five or more years after their health has deteriorated significantly. This creates a cruel gap: too ill to work effectively but too young to retire. Employers face higher sickness absence, reduced productivity, and the human cost of people struggling to do physically or mentally demanding jobs when their bodies are failing. The economy loses output, the benefits system picks up the cost of incapacity, and individuals lose the retirement years they had hoped to enjoy in good health.

3. The NHS and Social Care Avalanche

Every year of poor health generates demand for NHS services—GP appointments, hospital admissions, prescriptions, physiotherapy, mental health support—and for social care services like home visits, residential care, and supported living. When HLE falls while total life expectancy stays roughly flat, the number of years per person requiring intensive health and care support increases. Multiply that by a population of 69 million and an ageing demographic, and the result is a tidal wave of demand that the NHS and social care system are visibly failing to meet. The 7.5-million-strong NHS waiting list, the crisis in adult social care funding, and the collapse of dentistry in many areas are all symptoms of a population that is living longer but not living healthier.

Why the RAG Thresholds were chosen

The thresholds are based on the levels at which healthy life expectancy supports a functioning economy and welfare state, informed by ONS historical data, international comparisons, and the relationship between HLE and the state pension age.

🟢 Green (63 years and above): This is the "Healthy Working Life" zone. At this level, the average person can expect to remain in good health until at least two or three years before the state pension age. Most people can work productively throughout their career, enjoy a period of healthy retirement, and place manageable demands on health and social care services. The least deprived areas of England (South East, South West) currently achieve this level.

🟡 Amber (60 – 63 years): This is the "Health Deficit" zone. The UK currently sits in this bracket at approximately 61 years. At this level, many people experience the onset of poor health several years before they can retire, creating a painful gap between health reality and pension policy. Demand on the NHS and social care is elevated, and significant regional and socioeconomic inequalities in healthy ageing are visible. The decline from 63+ to below 61 since the pandemic represents a genuine deterioration, not just statistical noise.

🔴 Red (Below 60 years): This is the "Premature Decline" zone. At this level, the average person loses good health before the age of 60—potentially a full decade before they can access the state pension. The implications are severe: widespread incapacity in the workforce, soaring demand for disability benefits, and an NHS and social care system overwhelmed by a population that is ageing badly. The most deprived areas of England—parts of the North East, North West, and Midlands—already have HLE below 57 years, meaning residents of these areas are effectively living in a "red" zone while the national average masks their reality.`,
  total_population: `Total Population measures the number of usual residents in the UK at a given point, typically reported as mid-year estimates (30 June). The ONS calculates this by starting with the most recent Census count, then annually updating using the 'cohort component method': adding births and inward migration, subtracting deaths and outward migration. Estimates are produced for the UK total and broken down by country (England, Scotland, Wales, Northern Ireland), local authority, age, and sex. Population projections extend these trends into the future under various assumptions. The UK population is approximately 67 million and growing slowly, primarily through net migration. Population distribution matters as much as total—some areas grow rapidly while others decline.

Data Source: ONS: Total Population

Why it matters to you if it gets worse: (Note: A shrinking population slows economic growth, while a rapidly growing population strains housing and infrastructure.)`,
};

export function getPopulationTooltip(metricKey: string): string | undefined {
  return POPULATION_TOOLTIPS[metricKey];
}
