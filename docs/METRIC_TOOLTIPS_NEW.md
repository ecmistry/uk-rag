# Metric Tooltips (New)

> **Source file:** `client/src/data/metricTooltips.ts`
>
> **Last updated:** 2026-03-17
>
> This is the working copy of all dashboard metric tooltip text reflecting the latest updates.

---

## Economy

### Output per Hour (`output_per_hour`)

Output per Hour (Labour Productivity) measures how much value the country creates for every hour of work put in.

Think of it like this - If you are baking a cake, you can get more cake in two ways:

Work longer: Spend 4 hours in the kitchen instead of 2.

Work smarter: Get a better mixer, a faster oven, or a more efficient recipe so you can bake the same cake in just 1 hour.

Output per Hour tracks the second option. It doesn't ask "Are we working hard?" (most people in the UK work very hard); it asks "Is our hard work actually paying off?" It reveals if our tools, technology, and systems are helping us produce more without simply burning ourselves out with more hours.

The Real-World Impact on You

Even though "Productivity" sounds like corporate jargon, it is a vitally important factor for your quality of life over the long term. The concept is that if companies make more money for the time they put in (greater productivity) this increase in money will be distributed to staff in the form of increased wages, thus increasing your quality of life. When you sum up this effect for a whole nation and a country becomes productive, the government collects more tax from the same amount of work. This money pays for new MRI machines in the NHS or better equipment in schools without having to hike your tax rates.

Why the RAG Thresholds were chosen

🟢 Green - Above 1.5% - This was the UK's average growth rate for decades before 2008. At this speed, living standards double every generation. It is considered the 'healthy' benchmark for advanced economies and is currently (as of 2025) where the USA is performing.

🟡 Amber - 0.5% – 1.5% - This is the "Sluggish" zone the UK has been stuck in since the 2008 crisis. It's enough to keep things ticking over, but not enough to significantly improve public services or raise real wages.

🔴 Red - Below 0.5% / Negative - This is a "Productivity Crisis." It means the country is essentially standing still or getting less efficient. In this zone, the only way to grow the economy is to make everyone work longer hours or bring in more people, which strains housing and infrastructure. This is dangerous territory as lack of productivity points to a lack of innovation, which over time, means you will be less competitive on a global stage and less likely to have well paid jobs in the advancing sectors of the global economy.

---

### Real GDP Growth (`real_gdp_growth`)

Real GDP Growth measures the country's economic growth after stripping away the noise of rising prices (inflation).

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

🔴 Red - Below 0.5% / Negative - This is the "Recession Danger Zone." Growth this low is usually a sign that the economy is about to contract. It leads to rising unemployment and "fiscal black holes" where the government has to choose between massive borrowing or deep spending cuts.

---

### CPI Inflation (`cpi_inflation`)

Think of it as the "Cost of Living Ticker." To calculate it, the government tracks a giant "shopping basket" of over 700 items that a typical UK household buys—everything from a loaf of bread and a liter of petrol to Netflix subscriptions and smartwatches. Inflation is simply the percentage change in the total cost of that basket compared to one year ago.

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

🔴 Red - Above 4.0% OR Below 0% This is the "Crisis Zone." High inflation (as seen in 2022-23) causes rapid hardship. Conversely, negative inflation (Deflation) is a red flag for a deep economic depression. Both require urgent, aggressive intervention.

---

### Public Sector Net Debt (`public_sector_net_debt`)

Public Sector Net Debt is the total amount of money the government has borrowed over the years that it hasn't paid back yet.

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

🔴 Red - > 85% - Psychological and market "danger zone." Violates current UK fiscal sustainability rules.

---

### Business Investment (`business_investment`)

In layman's terms, this is the "Reinvestment Rate." Imagine you run a delivery business. At the end of the year, you have a choice: you can take all your profit and spend it on a luxury holiday (Consumption), or you can use a portion of it to buy a new, faster van (Investment).

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

🔴 Red - Below 10% - The Decay Zone: In this zone, we aren't even replacing what is wearing out. This is a "Health Crisis" for the economy that leads to falling living standards in the years to follow.

---

## Employment

### Inactivity Rate (`inactivity_rate`)

Think of this as the "Missing Workers" metric. It measures the percentage of people who are of working age but have dropped out of the workforce entirely. It is different from unemployment: an unemployed person is like someone standing on the sidelines of a football pitch, kit on, waiting to be subbed in. An "Inactive" person has left the stadium. They aren't working, and they aren't looking for work. This group includes students, retirees, and stay-at-home parents, but in 2026, the biggest concern for the UK is the millions of people who are inactive because they are too sick to work. If this number is high, the "engine" of the country is running on fewer cylinders.

How it is Calculated

The Office for National Statistics (ONS) calculates this using a massive ongoing study called the Labour Force Survey. They look at the total number of people in the UK aged between 16 and 64 and then subtract everyone who currently has a job and everyone who is actively looking for one. The people left over are classified as "Economically Inactive." The final metric is simply the percentage of the total working-age population that these "leftover" people represent. It provides a much more honest picture of the nation's health than the unemployment rate alone, because it captures those who have given up on finding work or are physically unable to do so.

Real Impact on the Person on the Street

When Inactivity is high, it hits your wallet and your daily life through "The Tax Squeeze." A smaller group of workers is left to generate the tax money needed to fund the entire country. If 1 in 5 people are inactive, the remaining 4 have to work harder and pay more to keep the NHS, schools, and pensions running. You also feel it through "Service Slowdowns"—it is the reason you see "Help Wanted" signs in every shop window and why it takes longer to get a GP appointment or a plumber. Finally, when long-term sickness is the main driver of inactivity it is a sign that the general health of your community is declining, which puts more pressure on the local services you rely on.

Why the RAG Thresholds were chosen:

The thresholds are based on the UK's "Sustainability Limit"—the point at which the number of workers can no longer comfortably support the number of non-workers.

🟢 Green - (Below 14%): This is the "Global Leader" zone. It matches Iceland's performance, indicating a society with world-class parental support, health rehabilitation, and flexible working that keeps almost the entire population active.

🟡 Amber - (14% – 20%): This is the "High Performance" zone. It's better than most of the G7 and represents a significant improvement for the UK. It signals that the country is successfully fixing its long-term sickness and childcare barriers.

🔴 Red - (Above 20%): This is the "Systemic Failure" zone. This would signal that the country is suffering from a deep health and labor crisis that puts it at a massive disadvantage compared to the world's most efficient economies.

---

### Real Wage Growth (`real_wage_growth`)

Think of this as the "True Pay Rise" metric. It measures whether your paycheck is actually winning the race against the rising cost of living. If your boss gives you a 3% pay rise, but the price of milk, rent, and electricity has gone up by 5%, you are actually poorer than you were last year despite having more money in your bank account. "Real" wage growth only happens when your pay increases faster than inflation. It is the difference between feeling like you are getting ahead and feeling like you are running up a down-escalator.

How it is Calculated:

The Office for National Statistics (ONS) calculates this by taking the "Average Weekly Earnings" data (which they get from surveying thousands of UK businesses about what they pay their staff) and UK RAG then uses CPI Inflation data we collect to adjust for inflation. This essentially "strips away" the effect of price rises from your pay rise. If the resulting number is positive, peoples "purchasing power" has grown; if it is negative, peoples wages are "shrinking" in real terms, even if the number on your payslip has stayed the same or gone up slightly.

Real Impact on the Person on the Street:

When Real Wage Growth is positive, it feels like "Breathing Room." It means that after you've paid for your essentials—food, housing, and bills—you have more money left over for things that improve your life, like holidays, savings, or a meal out. When it is negative, you experience a "Cost of Living Squeeze." You find yourself making "triage" decisions at the supermarket, cancelling subscriptions, or dipping into savings just to cover the basics. Over several years, negative or flat real wage growth leads to a "standard of living crisis," where the nation feels poorer and more stressed, regardless of what the headline economic growth figures say.

Why the RAG Thresholds were chosen:

These thresholds are based on the need for the UK to recover from the "lost decade" of wage growth following the 2008 financial crisis.

🟢 Green - (Above 2.0%): This is the "Prosperity Zone." It represents a healthy, productive economy where workers are seeing a clear and meaningful improvement in their standard of living every single year.

🟡 Amber - (1.0% – 2.0%): This is the "Low Growth Zone." Most workers in 2026 find themselves here. It means you aren't falling behind, but you aren't significantly moving forward either. It feels like "standing still."

🔴 Red - (Below 1.0%): This is the "Squeeze Zone." Anything below 1.0% is too close to zero for comfort, and negative numbers represent an active decline in the nation's health. In this zone, the person on the street is becoming poorer in real-time.

---

### Job Vacancy Ratio (`job_vacancy_ratio`)

What it is in Layman's Terms:

Think of this as the "Help Wanted" in the shop front meter for the entire country. It measures how many empty jobs there are for every 100 filled ones. When this number is high, it's a "Job Hunter's Market"—you have the power to ask for better pay and perks because employers are desperate to hire. When it's low, it's an "Employer's Market"—openings are rare, and finding a new role or a promotion becomes much harder.

How it is Calculated:

The Office for National Statistics (ONS) calculates this by surveying around 6,000 businesses every month to count how many positions they are actively trying to fill (The Vacancy Survey). They then compare this number to the total number of "Workforce Jobs" (everyone currently employed). By dividing the vacancies by the total jobs and multiplying by 100, we get a simple ratio: the number of available openings for every 100 existing jobs. It provides a more accurate "vibe check" of the economy than unemployment because it shows the actual real-time demand for labor across all sectors.

Real Impact on the Person on the Street:

For you, this metric is about "Choice and Power." In a high-ratio economy like the Netherlands (which maintains a ratio of over 4% and considered the gold standard for mature economies), workers feel safe and confident; if they don't like their boss or their commute, they can move almost immediately. If this measure gets worse and moves toward amber and red you might feel "stuck" in your current role because there are fewer alternatives to jump to. For young people and graduates, a Red status means their first step onto the career ladder is much steeper and more competitive, often leading to people taking jobs they are overqualified for just to secure an income.

Why the RAG Thresholds were chosen:

These thresholds are calibrated against the Global Gold Standard (The Netherlands ~4.1%) to show how the UK compares to the world's most dynamic and efficient labor markets.

🟢 Green - (Above 3.5%): The "Growth Leader" zone. Matches the world's best-performing economies, where labor demand is consistently high and workers have maximum leverage for pay rises.

🟡 Amber - (2.5% – 3.5%): The "Competitive Zone." Represents a healthy, balanced advanced economy with a good level of opportunity and professional movement.

🔴 Red - (Below 2.5%): The "Stagnation Zone." This is a clear Red against global benchmarks, signaling a lack of economic "hunger" and a difficult environment for those seeking career progression.

---

### Underemployment (`underemployment`)

Think of this as the "Hidden Unemployment" metric. It doesn't look at people who are out of work, but at people who are already in work but are effectively being "wasted." It primarily captures "time-related underemployment"—people who are working part-time hours but desperately want and are available to work more. It is the difference between someone having "a job" and someone having "enough work" to actually pay their bills. When this number is high, it means the economy is full of "zombie roles" that don't provide a living wage, even if the headline unemployment figure looks good.

How it is Calculated:

This metric is calculated by identifying individuals who meet three specific criteria: they are currently in employment, they want to work more hours (either in their current job, a second job, or a new job), and they are available to start those extra hours within a short timeframe (usually two weeks). To turn this into a rate, the number of these "underemployed" people is divided by the total number of people currently in the labor force. This provides a percentage that shows the "slack" or unused capacity sitting inside the workforce that isn't being captured by standard unemployment figures.

Real Impact on the Person on the Street:

For the person on the street, high underemployment feels like "Financial Limbo." You are officially "employed," so you don't show up in the crisis headlines, but you aren't earning enough to cover your rent or rising food costs. It leads to the "Working Poor" phenomenon, where people are working multiple small jobs just to survive. In a healthy economy (Green), a part-time job is usually a choice (like for students or parents); in an underemployed economy (Red), part-time work is often a trap that leaves you with too much month at the end of your money. It also impacts mental health, as the constant search for more hours creates a permanent state of job insecurity and prevents long-term life planning.

Why the RAG Thresholds were chosen:

These thresholds are calibrated against "Gold Standard" mature, flexible labor markets (such as the Netherlands or the USA's "U-6" measure), where underemployment is historically kept low through high labor demand and efficient job matching.

🟢 Green (Below 5.5%): The "Global Leader" zone. This matches top-performing mature economies where labor markets are highly efficient. It indicates a "High-Quality" market where almost everyone in work is getting the amount of work they actually desire.

🟡 Amber (5.5% – 8.5%): The "Muddling Through" zone. This signals that while the economy is creating jobs, a significant minority of the workforce is "stuck" in roles that do not meet their financial needs, creating a drag on national productivity and spending power.

🔴 Red (Above 8.5%): The "Hidden Crisis" zone. At this level, the labor market is failing to provide adequate hours for a large portion of its workers. It signals a systemic issue where jobs exist but aren't "proper" roles that sustain a household, leading to widespread financial strain despite a seemingly "low" headline unemployment rate.

---

### Sickness Absence (`sickness_absence`)

Think of this as the "Nation's Sick Note" metric. It measures the percentage of Full-Time Equivalent (FTE) working days lost to sickness or injury across the NHS workforce every month. If the rate is 5%, it means that for every 100 days of work that should have happened, 5 were lost because staff were off sick. It is one of the most powerful early-warning signals for the health of the country because the NHS is the UK's single largest employer (approximately 1.4 million staff). When the people who look after everyone else are themselves too sick to come to work, it tells you something profound about the state of the nation's health.

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

🔴 Red (Above 4.5%): This is the "Workforce Crisis" zone. At this level, absence is so high that safe staffing levels are regularly breached. Trusts are forced to close wards, divert ambulances, and cancel elective procedures. Winter peaks in 2021-22 saw rates exceed 5.5%, directly contributing to the worst A&E performance and longest ambulance response times on record. A rate this high is not just an HR problem—it is a patient safety issue.

---

## Education

### Attainment 8 Score (`attainment8`)

Attainment 8 measures the average achievement of pupils across 8 qualifications at Key Stage 4 (GCSEs, typically age 16). The Department for Education calculates this by summing points for each pupil's 8 qualifying subjects: English (double-weighted), Maths (double-weighted), 3 English Baccalaureate subjects (sciences, languages, humanities), and 3 further approved qualifications. Grade 9 = 9 points, Grade 1 = 1 point, U = 0. The maximum score is 90 (9×8 + double weighting). National and school-level averages are published annually. Attainment 8 replaced the previous '5 A\*-C including English and Maths' measure to provide a broader picture of achievement across the ability range and reduce focus on the C/D borderline.

Data Source: DfE: KS4 Performance

Why it matters to you if it gets worse: Future generations lack the basic skills needed for higher education or skilled jobs, limiting their career prospects and national productivity.

---

### NEET Rate 16-24 (`neet_rate`)

The NEET Rate measures the percentage of young people aged 16-24 who are Not in Education, Employment, or Training. The ONS calculates this from the Labour Force Survey, identifying individuals in this age group who are neither: (a) in any form of education or training (full-time, part-time, formal, or informal), nor (b) in employment (including self-employment). The rate is expressed as: (NEET young people ÷ total 16-24 population) × 100. NEET status is a major social indicator, strongly associated with poor long-term outcomes including lower lifetime earnings, worse health, and higher welfare dependency. The measure is broken down by age bands (16-17, 18-24) since compulsory education/training applies to 16-17 year-olds.

Data Source: ONS: Young People NEET

Why it matters to you if it gets worse: A wasted generation who are not contributing to the economy and are at higher risk of long-term poverty, social exclusion, and crime.

---

### Unauthorised Pupil Absence (`pupil_attendance`)

Unauthorised Pupil Absence measures the percentage of school sessions missed due to unauthorised reasons (truancy, holidays in term time, etc.), as opposed to authorised absences (illness, appointments). The Department for Education calculates this from termly school census returns. A lower percentage indicates better attendance. High unauthorised absence correlates with poorer educational outcomes and is a key indicator of engagement.

Data Source: DfE: Pupil Absence

Why it matters to you if it gets worse: More pupils missing school without good reason leads to lower attainment and increased risk of disengagement.

---

### Apprenticeship Intensity (`apprenticeship_intensity`)

Apprenticeship Intensity measures the number of apprenticeship starts per 1,000 people in the working-age population, providing a comparable rate of apprenticeship uptake. The Department for Education calculates this from Individualised Learner Records and ONS workforce data. Higher intensity indicates stronger employer investment in skills development.

Data Source: DfE: Apprenticeships & Training

Why it matters to you if it gets worse: Fewer apprenticeships mean a shortage of skilled tradespeople and technicians, making it harder and more expensive to hire for technical roles.

---

### Teacher Vacancy Rate (`teacher_vacancy_rate`) *(not currently on dashboard)*

Teacher Vacancies measures the number and rate of unfilled teaching positions across state-funded schools in England. The Department for Education calculates this from the annual School Workforce Census, conducted each November, where schools report posts that are vacant or temporarily filled. The vacancy rate is: (vacancies ÷ total posts) × 100. Data is broken down by phase (primary/secondary), subject, and region. Certain subjects face acute shortages: physics, computing, modern foreign languages, and design technology regularly recruit below target. High vacancy rates correlate with increased class sizes, subject non-availability, and reliance on non-specialist or supply teachers. Retention is equally problematic, with significant proportions leaving within 5 years.

Data Source: DfE: School Workforce

Why it matters to you if it gets worse: Class sizes increase, subjects are dropped, and your child's education suffers due to relying on non-specialist or temporary staff.

---

### Persistent Absence (`persistent_absence`) *(not currently on dashboard)*

Persistent Absence measures the percentage of pupils who miss 10% or more of their possible school sessions (typically 38+ sessions per year, where one session = half a day). The Department for Education calculates this from termly school census returns, which record authorised absences (illness, appointments, religious observance) and unauthorised absences (truancy, holidays in term time). A pupil crossing the 10% threshold is classified as 'persistently absent.' Chronic absence severely impacts educational outcomes—missing 10% equates to approximately 19 school days or nearly 4 weeks. Post-pandemic persistent absence rates roughly doubled, with particular increases among disadvantaged pupils and those with special educational needs.

Data Source: DfE: Pupil Absence

Why it matters to you if it gets worse: Students fall behind, increasing social inequality, and leading to anti-social behaviour issues in the community.

---

## Crime

### Total Recorded Crime (`recorded_crime_rate`)

Total Recorded Crime measures the number of offences recorded by the 43 police forces in England and Wales according to the Home Office Counting Rules (HOCR). Police record crimes when reported by the public or discovered through police activity, following strict definitions for each offence type. Data is submitted to the Home Office and published quarterly by the ONS. The total includes violence against the person, sexual offences, robbery, theft, criminal damage, drug offences, and other categories. Importantly, recorded crime reflects both actual crime levels AND reporting/recording practices—increased confidence in police can paradoxically increase recorded crime. The Crime Survey for England and Wales (CSEW) provides a complementary victim-based measure.

Data Source: ONS: Crime in England & Wales

Why it matters to you if it gets worse: You and your neighbours are more likely to become victims of theft, violence, or fraud.

---

### Charge Rate % (`charge_rate`)

The Charge Rate (also called Detection Rate or Outcome Rate) measures the percentage of recorded crimes that result in a suspect being charged or summonsed to court. The Home Office calculates this from police-recorded 'crime outcomes' data: (crimes resulting in charge/summons ÷ total crimes recorded) × 100. Other outcomes include out-of-court disposals (cautions, penalty notices), cases where the suspect is identified but not prosecuted (e.g., victim withdraws), and cases with no suspect identified. The charge rate has declined significantly over the past decade, falling from around 15% to under 6% for many crime types. Theft and burglary charge rates are particularly low (often under 5%), contributing to perceptions of consequence-free offending.

Data Source: Gov.uk: Crime Outcomes

Why it matters to you if it gets worse: Criminals feel safe to commit crimes because they know the police are unlikely to catch them, eroding trust in law enforcement.

---

### Perception of Safety (`perception_of_safety`)

Perception of Safety measures public feelings about crime and personal safety, derived from the Crime Survey for England and Wales (CSEW)—a large-scale household survey of approximately 35,000 adults annually. The ONS asks standardised questions including 'How safe do you feel walking alone in your area after dark?' with responses on a scale from 'very safe' to 'very unsafe.' Results are expressed as percentages feeling safe/unsafe and can be broken down by demographics, area type, and victimisation experience. This subjective measure often diverges from objective crime statistics—the 'fear of crime' can exceed actual risk, influenced by media coverage, local environmental factors, and personal vulnerability. Both high crime AND high fear of crime reduce quality of life.

Data Source: ONS: Crime Survey (CSEW)

Why it matters to you if it gets worse: You feel less safe walking alone at night, restricting your freedom and reducing community life in your area.

---

### Crown Court Backlog (`crown_court_backlog`)

The Crown Court Backlog measures the number of outstanding (untried) cases waiting to be heard in Crown Courts, which handle serious criminal matters including murder, rape, robbery, and either-way offences. The Ministry of Justice calculates this from the Common Platform and XHIBIT case management systems, counting cases where a defendant has been sent/committed for trial but the trial has not yet concluded. The backlog is reported as a total caseload and median waiting time (weeks from sending to completion). COVID-19 court closures caused the backlog to exceed 60,000 cases—approximately double pre-pandemic levels. Cases involving custody time limits create particular pressure, as defendants may be released if trials are delayed too long.

Data Source: MoJ: Criminal Court Stats

Why it matters to you if it gets worse: Victims wait years for justice, and accused individuals (guilty or innocent) face extreme stress and delays in their lives.

---

### Reoffending Rate (`reoffending_rate`)

The Proven Reoffending Rate measures the percentage of offenders who commit a further offence within one year of release from custody or starting a community order, where that offence is subsequently proven by a court conviction or caution. The Ministry of Justice calculates this from the Police National Computer, tracking a cohort of offenders and matching them to subsequent proven offences. The rate is expressed as: (reoffenders ÷ total cohort) × 100, with an additional measure of 'frequency' (average reoffences per reoffender). Short prison sentences have particularly high reoffending rates (over 50%), raising questions about rehabilitation effectiveness. The metric has a significant time lag (approximately 18 months) due to court processing times.

Data Source: MoJ: Proven Reoffending

Why it matters to you if it gets worse: The same criminals are released and commit more crimes, meaning the prison system is failing to protect the public.

---

## Healthcare

### A&E 4-Hour Wait % (`a_e_wait_time`)

The A&E 4-Hour Wait percentage measures the proportion of patients attending Accident & Emergency departments who are admitted, transferred, or discharged within 4 hours of arrival. NHS England calculates this from mandatory returns submitted by all Type 1 (major A&E), Type 2 (specialist), and Type 3 (minor injury units) departments. The operational standard target is 95% of patients within 4 hours. Performance is calculated as: (patients seen within 4 hours ÷ total attendances) × 100. This metric is considered the best single proxy for overall NHS 'flow'—when hospitals are full and cannot discharge patients, A&E backs up. Performance has declined significantly since 2015, with the 95% target not met nationally for years.

Data Source: NHS England: A&E Attendances

Why it matters to you if it gets worse: If you or a loved one have a medical emergency, you face dangerous delays sitting on a trolley, as there are no beds available.

---

### Elective Backlog (`elective_backlog`)

The Elective Backlog (RTT Waiting List) measures the total number of patients waiting to start consultant-led elective (non-emergency) treatment. NHS England calculates this from mandatory monthly returns from all NHS trusts, counting 'incomplete pathways'—patients referred by their GP who are still waiting for their first definitive treatment. The Referral to Treatment (RTT) standard states 92% of patients should wait no longer than 18 weeks. The backlog is reported as a total number and broken down by waiting time bands (0-18 weeks, 18-52 weeks, 52+ weeks). Post-pandemic, the backlog exceeded 7 million pathways—an unprecedented level representing roughly 1 in 8 of the English population.

Data Source: NHS England: RTT Waiting Times

Why it matters to you if it gets worse: Waiting years for necessary operations (like hip replacements or cataracts), leading to prolonged pain, disability, or inability to work.

---

### Ambulance Response Time - Category 2 (`ambulance_response_time`)

Category 2 Ambulance Response Time measures how quickly ambulances respond to emergency calls classified as 'Category 2'—serious conditions requiring rapid assessment and transport, such as suspected strokes, heart attacks, and severe breathing difficulties. NHS England calculates the mean (average) and 90th percentile response times from 999 call connection to ambulance arrival. The national standard is a mean response of 18 minutes and 90th percentile of 40 minutes. Data comes from Computer Aided Dispatch systems across all 10 English ambulance trusts. Category 2 represents approximately 60% of all emergency ambulance calls. Response times have significantly deteriorated, with means often exceeding 30-40 minutes in winter pressures.

Data Source: NHS England: Ambulance Quality

Why it matters to you if it gets worse: Critical, time-sensitive emergencies take too long to respond to, potentially resulting in permanent damage or death.

---

### GP Appointment Access (`gp_appt_access`)

GP Appointment Access measures the percentage of GP appointments that take place within 14 days of booking. NHS Digital calculates this from the General Practice Appointment Data (GPAD) collected from GP practice systems across England, covering approximately 30 million appointments monthly. The metric is calculated as: (appointments occurring within 14 days of booking ÷ total appointments) × 100. Data excludes COVID vaccinations and some specialist clinics. This metric indicates primary care accessibility—the 'front door' of the NHS. Poor GP access has knock-on effects as patients present to A&E for conditions that could have been managed earlier. The government target is for patients to see a GP within 2 weeks.

Data Source: NHS Digital: Appointments in GP

Why it matters to you if it gets worse: You can't see your family doctor when you need to, forcing minor issues into already overwhelmed A&E departments.

---

### Staff Vacancy Rate (`staff_vacancy_rate`)

The NHS Staff Vacancy Rate measures the percentage of funded full-time equivalent (FTE) positions that are unfilled across NHS trusts. NHS Digital calculates this quarterly using the NHS Vacancy Statistics: (vacant posts ÷ total funded establishment) × 100. Data is broken down by staff group (nurses, doctors, allied health professionals, etc.) and by region/trust. A 'vacancy' is a funded position actively being recruited to. High vacancy rates indicate recruitment and retention problems, often leading to expensive agency staff usage, increased workload on existing staff, and potential service reductions. Nursing vacancies have been persistently high (10%+), with some specialties like mental health nursing exceeding 15%.

Data Source: NHS Digital: Vacancies in NHS

Why it matters to you if it gets worse: Less dedicated care for patients, burned-out staff making more errors, and entire departments struggling to function safely.

---

## Defence

### Defence Spending as % of GDP (`defence_spending_gdp`)

Defence Spending as a Percentage of GDP measures the UK's total military expenditure relative to the size of its economy. The Ministry of Defence calculates this using NATO-agreed definitions of defence spending (which include military pensions, war pensions, and some intelligence spending not in the core MOD budget) divided by nominal GDP from ONS figures. The percentage is expressed as: (total defence spending ÷ GDP) × 100. The NATO target of 2% GDP was set at the 2014 Wales Summit. Calculation methodology matters—different definitions can shift the figure by 0.1-0.2%. Real-terms spending (adjusted for inflation) and per-capita spending provide additional context. The UK has typically hovered around the 2% threshold, though recent commitments aim for 2.5%.

Data Source: MOD: Finance & Economics

Why it matters to you if it gets worse: The UK's influence on the world stage decreases, making it less able to protect its citizens and interests abroad or deter foreign threats.

---

### Sea Mass (`sea_mass`)

Sea Mass represents a nation's "Maritime Weight." It is not just about the number of hulls in the water, but the total physical scale and combat power of a navy. Think of it like comparing a fleet of delivery vans to a fleet of heavy-duty armored trucks; "Mass" tells you how much punch the navy can pack and how much damage it can absorb. For a global power, Sea Mass is the ultimate measure of Naval Reach — it determines whether a country can protect its trade routes across the entire world simultaneously or is restricted to guarding its own beaches.

How is it Calculated?

Sea Mass is calculated by measuring the Total Aggregate Displacement (the total weight of water the ship pushes aside) of the "Surface and Sub-Surface Fleet." To capture true Tier 1 capability, this metric is divided into two primary pillars, weighted to favor the ships that project the most power.

Pillar 1: Blue Water Capability (70% Weighting) — This measures the "Heavy Hitters." It is divided into two sub-pillars:
- Sub-Pillar 1.1: Strategic Platforms (50% of Pillar 1): Focuses on aircraft carriers and nuclear-powered submarines. These are the most valuable because they provide independent global reach and a nuclear deterrent.
- Sub-Pillar 1.2: Surface Combatants (50% of Pillar 1): Focuses on destroyers and frigates. These are the "workhorses" that escort carriers and protect trade routes.

Pillar 2: Auxiliary & Support Resilience (30% Weighting) — This measures the "Logistical Stamina."
- Sub-Pillar 2.1: Fleet Auxiliaries (100% of Pillar 2): Focuses on tankers and supply ships. A navy can only stay at sea as long as it has fuel and food; without these, "Mass" is stuck in port.

Real-World Impact: Why should you care?

For the person on the street, Sea Mass is the silent guardian of your daily life:
- Price Stability: Over 90% of global trade travels by sea. High Sea Mass prevents hostile nations from closing "Choke Points" (like the Suez Canal), keeping the price of your fuel, food, and electronics stable.
- National Influence: A navy with significant mass can provide disaster relief or evacuate citizens from war zones without firing a single shot.
- Industrial Jobs: Maintaining a high Sea Mass sustains a domestic industrial ecosystem of shipyards and high-tech engineering firms, providing thousands of high-wage jobs.

RAG Threshold Logic

The RAG thresholds are determined by comparing a nation's total displacement against the Gold Standard of a mature, advanced Tier 1 naval power on a population-proportional basis.

🟢 Green (> 90% of Standard) — Global Projection: The navy can maintain a permanent presence in multiple global theaters simultaneously and protect all major trade routes independently.

🟡 Amber (70% – 90% of Standard) — Regional Focus: The navy is capable of significant operations but lacks "Deep Mass." It may have to choose between protecting trade abroad or defending its home territory.

🔴 Red (< 70% of Standard) — Littoral Limitation: The navy has lost its "Blue Water" weight. It is effectively a coastal defense force dependent on allies to protect its merchant shipping.

Data Source: UK Defence Journal, Navy Lookout, RUSI, IISS

---

### Land Mass (`land_mass`)

Land Mass measures the UK's land force structure as a weighted composite of four pillars: Armoured Strike (MBTs, AFVs), Personnel Mass (regulars), Indirect Fires (artillery, air defence), and Depth (reserves, recallable veterans, logistics). Each pillar is scored against Tier 1 benchmarks. Green: 90%+, Amber: 70–89%, Red: <70%.

Data Source: Janes, RUSI, IISS Military Balance, MOD statistics

Why it matters to you if it gets worse: The Army cannot sustain prolonged operations or regenerate after conflict.

---

### Air Mass (`air_mass`)

Air Mass measures the UK's air power as a weighted composite of four pillars: Combat Strike (multi-role fighters), Force Multipliers (tankers, AEW), Strategic Lift (transports), and Autonomous Mass (loyal wingman-type platforms). Each pillar is scored against Tier 1 benchmarks. Green: 90%+, Amber: 70–89%, Red: <70%.

Data Source: FlightGlobal, RUSI, IISS Military Balance

Why it matters to you if it gets worse: The UK loses air superiority, strike capability, and strategic mobility.

---

### Defence Industry Vitality (`defence_industry_vitality`)

Defence Industry Vitality is a measure of a nation's "Sovereign Industrial Stamina." In the defense world, "Sustainability" measures—which attempt to calculate exactly how many days a country can sustain a high-intensity war against a peer adversary—are often impossible to track because stockpile data is strictly confidential and open-source estimates are highly unreliable. Consequently, we use Industry Vitality as a high-confidence proxy. Instead of guessing what is currently in a warehouse, we measure the health of the "Machine that builds the Machine."

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
The defense sector is either critically undersized or is actively shrinking on a rolling basis. This represents a loss of sovereign capability; the nation has lost the technical skills to build its own safety and is entirely dependent on foreign powers for its survival.

---

### Personnel Strength (`personnel_strength`) *(not currently on dashboard)*

Trained Strength measures the total number of fully trained military personnel across the British Army, Royal Navy, and Royal Air Force who have completed their initial training and are available for operational deployment. The MOD publishes quarterly statistics counting Regular Forces personnel who have passed relevant trade training. The figure excludes untrained recruits, reservists (reported separately), and civilian staff. Trained Strength is measured against 'Requirement' (the established need) to show manning balance. All three services have consistently undershot recruitment targets while outflow (personnel leaving) has increased, creating structural undermanning. The Army has been particularly affected, shrinking to its smallest size since Napoleonic times.

Data Source: MOD: Service Personnel Stats

Why it matters to you if it gets worse: The armed forces cannot cover all necessary tasks (e.g., peace-keeping, disaster relief, conflict), leaving the nation vulnerable.

---

### Equipment Spend (`equipment_spend`) *(not currently on dashboard)*

Equipment Spending measures the MOD's capital expenditure on military hardware, divided into 'Equipment Procurement' (new platforms, weapons systems, vehicles) and 'Equipment Support' (maintenance, upgrades, spares). Data comes from MOD annual reports and the Equipment Plan, a 10-year costed programme. The balance between procurement and support indicates whether forces are modernising or merely sustaining legacy systems. Major programmes (aircraft carriers, F-35s, Dreadnought submarines) span decades and billions of pounds. The Equipment Plan has repeatedly been assessed by the NAO as unaffordable within allocated budgets, requiring capability cuts or delays. 'Hollowing out'—maintaining platforms without sufficient munitions, spare parts, or trained personnel—is a persistent risk.

Data Source: MOD: Trade & Contracts

Why it matters to you if it gets worse: Military forces are left using outdated equipment, putting personnel at risk and making the UK incapable of fighting a modern war effectively.

---

### Deployability % (`deployability`) *(not currently on dashboard)*

Deployability Rate measures the percentage of military personnel who are medically and administratively cleared for operational deployment. The MOD calculates this from the Joint Personnel Administration (JPA) system, categorising personnel as: 'Medically Fully Deployable' (MFD), 'Medically Limited Deployability' (MLD), or 'Medically Non-Deployable' (MND). The rate is: (MFD personnel ÷ total trained strength) × 100. Non-deployable personnel may have temporary restrictions (injury recovery) or permanent ones (chronic conditions). High rates of mental health conditions, musculoskeletal problems, and chronic illness can significantly reduce the deployable proportion. A service might have 80,000 trained personnel but only 70,000 actually available to deploy—a critical distinction for operational planning.

Data Source: MOD: Health & Wellbeing

Why it matters to you if it gets worse: The UK has fewer available personnel to respond to a crisis, even if the total headcount seems high on paper.

---

### Force Readiness / Equipment Readiness (`equipment_readiness`) *(not currently on dashboard)*

Force Readiness measures the percentage of high-priority military assets (ships, aircraft, vehicles, units) that are available for immediate operational deployment at required notice. The MOD assesses this against 'readiness levels'—how quickly forces can deploy (days to months). Readiness is affected by maintenance cycles, spare parts availability, trained crew numbers, and equipment serviceability. Data is partially classified, but aggregate assessments appear in Annual Reports and Defence Committee evidence. 'Availability' rates for major platforms (e.g., Type 45 destroyers, Typhoon aircraft) indicate whether the notional fleet strength translates to actual capability. Readiness gaps mean even if the UK owns an asset, it cannot necessarily use it when needed.

Data Source: MOD: Annual Reports

Why it matters to you if it gets worse: Critical assets needed for immediate response (like fighter jets or aircraft carriers) are stuck in maintenance or unserviceable when a crisis hits.

---

## Population

### Natural Change (`natural_change`)

Natural Change measures the difference between live births and deaths in a given period, indicating whether the population is growing or shrinking from demographic factors alone (excluding migration). The ONS calculates this from civil registration data: Natural Change = Births − Deaths. A positive figure means more births than deaths (natural increase); negative means more deaths than births (natural decrease). The UK's natural change has declined dramatically—from +200,000+ annually in the 2000s to near-zero or negative in recent years. This reflects falling birth rates (Total Fertility Rate now ~1.5 children per woman, well below the 2.1 replacement level) combined with an ageing population producing more deaths. Some regions and countries within the UK already show natural decrease.

Data Source: ONS: Vital Statistics / Series VVHM

Why it matters to you if it gets worse: The local population shrinks, leading to school closures, fewer shops, and a gradual decline of rural and local communities.

---

### Old-Age Dependency Ratio (`old_age_dependency_ratio`)

The Old-Age Dependency Ratio measures the number of people aged 65 and over per 1,000 people of working age (16-64). The ONS calculates this from mid-year population estimates and projections: (Population 65+ ÷ Population 16-64) × 1,000. A ratio of 300 means 300 retirees per 1,000 workers, or roughly 1 retiree per 3 workers. The ratio is rising due to increased life expectancy and lower birth rates—it's projected to exceed 400 by 2050. This metric indicates the 'support burden' on the working population: fewer workers funding more pensioners' state pensions, healthcare, and social care through taxation. Higher ratios put pressure on public finances and may require raising pension ages, increasing taxes, or reducing benefits.

Data Source: ONS API: Population Projections

Why it matters to you if it gets worse: A tiny workforce must fund the pensions and healthcare for a huge number of retirees, leading to massive tax hikes or benefit cuts.

---

### Net Migration (`net_migration`)

Long-Term International Migration (LTIM) Net Migration measures the difference between people immigrating to the UK (for 12+ months) and those emigrating from the UK (for 12+ months). The ONS calculates this primarily from administrative data (visa records, National Insurance registrations, GP registrations) combined with survey data: Net Migration = Immigration − Emigration. Positive net migration means more arrivals than departures. Since the 2000s, net migration has become the primary driver of UK population growth as natural change declined. Annual net migration has varied from ~150,000 to over 700,000, influenced by EU freedom of movement, points-based immigration policy, humanitarian crises (Ukraine, Hong Kong), and student visa numbers. The metric is highly politically sensitive.

Data Source: ONS API: Series BBGM

Why it matters to you if it gets worse: A rapid decline in the working-age population needed to fill essential jobs in the NHS, social care, and other key sectors.

---

### Healthy Life Expectancy (`healthy_life_expectancy`)

Healthy Life Expectancy (HLE) measures the average number of years a person can expect to live in 'good' or 'very good' health, based on self-reported health status. The ONS calculates this using the Sullivan method, combining mortality data (life tables) with health prevalence data from the Annual Population Survey. HLE is lower than total Life Expectancy—the gap represents years lived in poor health. In England, HLE at birth is approximately 63 years for both sexes, while total LE is ~80 years, meaning ~17 years are typically spent in poor health. Significant inequalities exist: the most deprived areas have HLE roughly 19 years lower than the least deprived. HLE has stagnated or declined in recent years, particularly for women and disadvantaged groups.

Data Source: ONS: Health State Life Expectancy

Why it matters to you if it gets worse: You spend a greater proportion of your final years in poor health, becoming dependent on family and straining the NHS/care system.

---

### Total Population (`total_population`) *(not currently on dashboard)*

Total Population measures the number of usual residents in the UK at a given point, typically reported as mid-year estimates (30 June). The ONS calculates this by starting with the most recent Census count, then annually updating using the 'cohort component method': adding births and inward migration, subtracting deaths and outward migration. Estimates are produced for the UK total and broken down by country (England, Scotland, Wales, Northern Ireland), local authority, age, and sex. Population projections extend these trends into the future under various assumptions. The UK population is approximately 67 million and growing slowly, primarily through net migration. Population distribution matters as much as total—some areas grow rapidly while others decline.

Data Source: ONS: Total Population

Why it matters to you if it gets worse: (Note: A shrinking population slows economic growth, while a rapidly growing population strains housing and infrastructure.)
