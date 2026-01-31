# UK RAG Dashboard – Data Source & Location (canonical)

This document is the single source of truth for which data source each metric must use. All fetchers must align with this table.

| Category   | Metric                      | Explanation                                                                 | Data Source & Location        |
|-----------|-----------------------------|-----------------------------------------------------------------------------|-------------------------------|
| Economy   | Output per Hour             | Measures efficiency. Vital for long-term wage growth.                       | ONS API: Series LZVD         |
| Economy   | Real GDP Growth             | High-level "speedometer" of the national economy.                           | ONS API: Series IHYP         |
| Economy   | CPI Inflation               | Tracks price stability and purchasing power.                                | ONS API: Series D7G7         |
| Economy   | Public Sector Net Debt      | Sustainability of government spending vs. GDP.                              | ONS API: Series HF6X         |
| Economy   | Business Investment         | Indicates corporate confidence in the UK's future.                          | ONS API: Series NPEL         |
| Employment| Inactivity Rate             | Tracks those "hidden" from the labor market (e.g., sick).                   | ONS API: Series LF2S         |
| Employment| Real Wage Growth            | Whether people are actually richer after inflation.                         | ONS API: Series A3WW         |
| Employment| Job Vacancy Ratio           | Measures labor shortages (vacancies per 100 jobs).                           | ONS API: Series AP2Y         |
| Employment| Underemployment             | % of workers wanting more hours than they have.                             | ONS API: Series I7C4         |
| Employment| Sickness Absence            | Labor health; % of hours lost to illness.                                   | ONS: Sickness absence in UK  |
| Healthcare| A&E 4-Hour Wait %           | Proxy for total system "flow" and bed availability.                         | NHS England: A&E Attendances |
| Healthcare| Elective Backlog            | The total "queue" for surgeries and specialists.                            | NHS England: RTT Waiting Times|
| Healthcare| Ambulance (Cat 2)           | Response speed for strokes/heart attacks.                                   | NHS England: Ambulance Quality|
| Healthcare| GP Appt. Access             | % of appointments held within 14 days.                                      | NHS Digital: Appointments in GP|
| Healthcare| Staff Vacancy Rate          | Warning light for burnout and service limits.                               | NHS Digital: Vacancies in NHS|
| Crime     | Total Recorded Crime        | High-level volume of police-reported incidents.                             | ONS: Crime in England & Wales|
| Crime     | Charge Rate %               | The "Detection Rate"—how many crimes are solved.                            | Gov.uk: Crime Outcomes      |
| Crime     | Perception of Safety        | Public confidence and the "fear of crime" gap.                              | ONS: Crime Survey (CSEW)     |
| Crime     | Crown Court Backlog         | Measures "Justice Timeliness"—the trial queue.                              | MoJ: Criminal Court Stats   |
| Crime     | Reoffending Rate            | Success of the rehabilitative prison system.                                | MoJ: Proven Reoffending      |
| Education | Attainment 8 Score          | Average GCSE-level academic performance.                                    | DfE: KS4 Performance        |
| Education | Teacher Vacancies           | Sustainability of the teaching workforce.                                   | DfE: School Workforce       |
| Education | NEET Rate (16-24)           | Young people detached from work or study.                                   | ONS: Young People NEET       |
| Education | Persistent Absence          | % of students missing 10%+ of school days.                                   | DfE: Pupil Absence           |
| Education | Apprentice Starts           | Health of the vocational and technical pipeline.                            | DfE: Apprenticeships & Training|
| Defence   | Spend as % of GDP           | Financial commitment to NATO/Security.                                      | MOD: Finance & Economics     |
| Defence   | Trained Strength            | Total headcount of deployable personnel.                                     | MOD: Service Personnel Stats |
| Defence   | Equipment Spend             | Investment in modernized hardware vs. upkeep.                                | MOD: Trade & Contracts       |
| Defence   | Deployability %             | % of forces medically fit for active operations.                            | MOD: Health & Wellbeing      |
| Defence   | Force Readiness             | % of high-readiness assets (ships/jets) available.                          | MOD: Annual Reports          |
| Population| Natural Change (Births vs Deaths)| The "Tipping Point" metric. Measures if the native population is growing or shrinking. | ONS: Vital Statistics / Series VVHM |
| Population| Old-Age Dependency Ratio    | The number of retirees (65+) per 1,000 workers. High ratios strain pensions/NHS. | ONS API: Population Projections |
| Population| Net Migration (Long-term)   | Since natural growth is flat, this is now the UK's only source of population growth. | ONS API: Series BBGM |
| Population| Healthy Life Expectancy     | Not just "how long we live," but how many years we live in good health.     | ONS: Health State Life Expectancy |
| Population| Total Population           | UK population level.                                                        | ONS: Total Population        |

Fetchers must:
- Use the **exact** Data Source & Location above (for `data_source` and for fetching).
- Pull data from the URLs/datasets that implement that source (ONS series, NHS England, Gov.uk, MoJ, DfE, MOD, etc.).
