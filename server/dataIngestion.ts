import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const MAX_BUFFER = 10 * 1024 * 1024; // 10 MB
const DEFAULT_EXEC_TIMEOUT_MS = 120_000; // 2 minutes — generous for network-calling Python scripts
const execAsync = (cmd: string, opts?: { timeout?: number }) =>
  promisify(exec)(cmd, { maxBuffer: MAX_BUFFER, timeout: opts?.timeout ?? DEFAULT_EXEC_TIMEOUT_MS });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root directory (where Python scripts are located)
// Use process.cwd() which is set to the project root by the start script
const getProjectRoot = () => {
  return process.cwd();
};

export interface MetricData {
  metric_name: string;
  metric_key: string;
  category: string;
  value: number;
  time_period: string;
  rag_status: 'red' | 'amber' | 'green';
  data_source: string;
  source_url: string;
  last_updated: string;
  unit?: string; // Optional unit field
}

export interface DataIngestionResult {
  success: boolean;
  data?: MetricData[];
  error?: string;
}

export interface RegionalEducationData {
  region: string;
  attainment8: number;
  time_period: string;
}

export interface RegionalDataResult {
  success: boolean;
  data?: RegionalEducationData[];
  error?: string;
}

/**
 * Fetch Economy metrics from ONS by executing the Python script
 */
export async function fetchEconomyMetrics(historical: boolean = false): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'economy_data_fetcher.py');
    const outputPath = path.join(projectRoot, 'server', 'economy_metrics.json');

    // Execute the Python script with historical flag if needed
    const command = historical 
      ? `python3 ${scriptPath} --historical`
      : `python3 ${scriptPath}`;
    
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('INFO')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Read the output JSON file
    const fs = await import('fs/promises');
    const rawData = await fs.readFile(outputPath, 'utf-8');
    const data: MetricData[] = JSON.parse(rawData);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch economy metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Education metrics from DfE by executing the Python script
 */
export async function fetchEducationMetrics(): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'education_data_fetcher.py');

    // Execute the Python script and capture JSON output
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr && !stderr.includes('INFO') && !stderr.includes('DtypeWarning')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from education script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch education metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Crime metrics from ONS and Police.uk by executing the Python script
 */
export async function fetchCrimeMetrics(): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'crime_data_fetcher.py');

    // Execute the Python script and capture JSON output
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr && !stderr.includes('INFO')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from crime script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch crime metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Healthcare metrics from NHS England by executing the Python script
 */
export async function fetchHealthcareMetrics(historical: boolean = false): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'healthcare_data_fetcher.py');

    // Execute the Python script with historical flag if needed
    const command = historical 
      ? `python3 ${scriptPath} --historical`
      : `python3 ${scriptPath}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('INFO') && !stderr.includes('DtypeWarning')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from healthcare script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch healthcare metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Defence metrics from MOD/ONS by executing the Python script
 */
export async function fetchDefenceMetrics(): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'defence_data_fetcher.py');

    // Execute the Python script and capture JSON output
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr && !stderr.includes('INFO') && !stderr.includes('DtypeWarning')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from defence script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch defence metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Employment metrics from Resolution Foundation by executing the Python script
 */
export async function fetchEmploymentMetrics(historical: boolean = false): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'employment_data_fetcher.py');

    // Execute the Python script with historical flag if needed
    const command = historical 
      ? `python3 ${scriptPath} --historical`
      : `python3 ${scriptPath}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('INFO') && !stderr.includes('DtypeWarning')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from employment script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch employment metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


/**
 * Fetch regional education data for visualization
 */
export async function fetchRegionalEducationData(): Promise<RegionalDataResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'regional_education_fetcher.py');

    // Execute the Python script and capture JSON output
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr && !stderr.includes('INFO') && !stderr.includes('DtypeWarning')) {
      console.warn('[Data Ingestion] Python script warnings:', stderr);
    }

    // Parse JSON from stdout (script outputs JSON at the end)
    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from regional education script');
    }

    const data: RegionalEducationData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch regional education data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface PopulationBreakdownPeriod {
  period: string;
  total: number;
  working: number;
  inactive: number;
  unemployed: number;
   underemployed: number;
  under16Over64: number;
}

export interface PopulationBreakdown {
  periods: PopulationBreakdownPeriod[];
}

/**
 * Returns true if at least one period has underemployed > 0.
 * Used in tests to catch regressions (e.g. ONS 429 causing EMP16 fetch to fail and all underemployed to be 0).
 */
export function hasNonZeroUnderemployed(data: PopulationBreakdown): boolean {
  if (!data?.periods?.length) return false;
  return data.periods.some((p) => Number(p.underemployed) > 0);
}

/**
 * Fetch population breakdown for stacked bar (historic quarters; UKPOP, MGRZ, LF2M, MGSX, LF24).
 * Runs population_data_fetcher.py --breakdown. EMP16 underemployment is fetched first to avoid ONS 429.
 */
export async function getPopulationBreakdown(): Promise<PopulationBreakdown | null> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'population_data_fetcher.py');
    const { stdout } = await execAsync(`python3 ${scriptPath} --breakdown`);
    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '{}') return null;
    const data = JSON.parse(trimmed) as PopulationBreakdown;
    if (!data.periods || !Array.isArray(data.periods) || data.periods.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export interface PublicSectorReceiptsPeriod {
  period: string;
  vat: number;
  fuel_duties: number;
  business_rates: number;
  stamp_duty_land_tax: number;
  stamp_taxes_on_shares: number;
  tobacco_duties: number;
  alcohol_duties: number;
  customs_duties: number;
  vehicle_excise_business: number;
  other_taxes_on_production: number;
  income_tax: number;
  corporation_tax: number;
  petroleum_revenue_tax: number;
  misc_taxes_income_wealth: number;
  vehicle_excise_households: number;
  bank_levy: number;
  tv_licence_fee: number;
  misc_other_taxes: number;
  social_contributions: number;
  council_tax: number;
  other_local_govt_taxes: number;
  interest_and_dividends: number;
  gross_operating_surplus: number;
  other_receipts: number;
}

export interface PublicSectorReceipts {
  periods: PublicSectorReceiptsPeriod[];
  fiscalYearTotals?: Record<string, number>;
}

/**
 * Fetch public sector current receipts (ONS Appendix D).
 * Runs public_sector_receipts_fetcher.py --chart, returns quarterly aggregated data.
 */
export async function getPublicSectorReceipts(): Promise<PublicSectorReceipts | null> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'public_sector_receipts_fetcher.py');
    const { stdout } = await execAsync(`python3 ${scriptPath} --chart`);
    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '{}') return null;
    const data = JSON.parse(trimmed) as PublicSectorReceipts;
    if (!data.periods || !Array.isArray(data.periods) || data.periods.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export interface PublicSectorExpenditurePeriod {
  period: string;
  public_and_common_services: number;
  international_services: number;
  debt_interest: number;
  defence: number;
  public_order_and_safety: number;
  enterprise_and_economic_dev: number;
  science_and_technology: number;
  employment_policies: number;
  agriculture_fisheries_forestry: number;
  transport: number;
  environment_protection: number;
  housing_and_community: number;
  health: number;
  recreation_culture_religion: number;
  education: number;
  social_protection: number;
  eu_transactions: number;
}

export interface PublicSectorExpenditure {
  periods: PublicSectorExpenditurePeriod[];
}

/**
 * Fetch public sector expenditure on services (HMT PSS Table 10, nominal).
 * Runs public_expenditure_fetcher.py --chart, returns fiscal year data.
 */
export async function getPublicSectorExpenditure(): Promise<PublicSectorExpenditure | null> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'public_expenditure_fetcher.py');
    const { stdout } = await execAsync(`python3 ${scriptPath} --chart`);
    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '{}') return null;
    const data = JSON.parse(trimmed) as PublicSectorExpenditure;
    if (!data.periods || !Array.isArray(data.periods) || data.periods.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Centralised RAG thresholds for every metric with documented tooltip thresholds.
 * Values must match the RAG section in metricTooltips.ts.
 *
 *  higher_better  – green > greenMin, amber >= amberMin, red below
 *  lower_better   – green < greenMax, amber <= amberMax, red above
 *  target_band    – green within [gMin, gMax], amber within [aMin, aMax], red outside
 */
type ThresholdDef =
  | { direction: 'higher_better'; greenMin: number; amberMin: number }
  | { direction: 'lower_better'; greenMax: number; amberMax: number }
  | { direction: 'target_band'; greenMin: number; greenMax: number; amberMin: number; amberMax: number };

export const RAG_THRESHOLDS: Record<string, ThresholdDef> = {
  // ── Economy ──────────────────────────────────────────────
  output_per_hour:      { direction: 'higher_better', greenMin: 1.5,  amberMin: 0.5 },
  real_gdp_growth:      { direction: 'higher_better', greenMin: 2.0,  amberMin: 0.5 },
  business_investment:  { direction: 'higher_better', greenMin: 12,   amberMin: 10 },
  public_sector_net_debt: { direction: 'lower_better', greenMax: 70,  amberMax: 85 },
  cpi_inflation:        { direction: 'target_band', greenMin: 1.5, greenMax: 2.5, amberMin: 0, amberMax: 4.0 },

  // ── Employment ───────────────────────────────────────────
  real_wage_growth:     { direction: 'higher_better', greenMin: 2.0,  amberMin: 1.0 },
  job_vacancy_ratio:    { direction: 'higher_better', greenMin: 3.5,  amberMin: 2.5 },
  inactivity_rate:      { direction: 'lower_better',  greenMax: 14,   amberMax: 20 },
  underemployment:      { direction: 'lower_better',  greenMax: 5.5,  amberMax: 8.5 },
  sickness_absence:     { direction: 'lower_better',  greenMax: 3.0,  amberMax: 4.5 },

  // ── Education ────────────────────────────────────────────
  attainment8:              { direction: 'higher_better', greenMin: 5.5,  amberMin: 4.5 },
  apprenticeship_intensity: { direction: 'higher_better', greenMin: 15,   amberMin: 10 },
  neet_rate:                { direction: 'lower_better',  greenMax: 8,    amberMax: 12 },
  pupil_attendance:         { direction: 'lower_better',  greenMax: 1.0,  amberMax: 1.5 },

  // ── Crime ────────────────────────────────────────────────
  crown_court_backlog:  { direction: 'lower_better',  greenMax: 60,   amberMax: 90 },
  recall_rate:          { direction: 'lower_better',  greenMax: 7.5,  amberMax: 11 },
  asb_low_level_crime:  { direction: 'lower_better',  greenMax: 800,  amberMax: 1200 },
  serious_crime:        { direction: 'lower_better',  greenMax: 400,  amberMax: 700 },
  street_confidence_index: { direction: 'lower_better', greenMax: 20, amberMax: 30 },

  // ── Healthcare ───────────────────────────────────────────
  a_e_wait_time:            { direction: 'higher_better', greenMin: 95,        amberMin: 90 },
  gp_appt_access:           { direction: 'higher_better', greenMin: 70,        amberMin: 55 },
  elective_backlog:         { direction: 'lower_better',  greenMax: 4_000_000, amberMax: 6_000_000 },
  ambulance_response_time:  { direction: 'lower_better',  greenMax: 7,         amberMax: 10 },
  old_age_dependency_ratio: { direction: 'lower_better',  greenMax: 300,       amberMax: 350 },

  // ── Defence ──────────────────────────────────────────────
  defence_spending_gdp:     { direction: 'higher_better', greenMin: 2.5,  amberMin: 2.0 },
  sea_mass:                 { direction: 'higher_better', greenMin: 90,   amberMin: 70 },
  land_mass:                { direction: 'higher_better', greenMin: 90,   amberMin: 70 },
  air_mass:                 { direction: 'higher_better', greenMin: 90,   amberMin: 70 },
  defence_industry_vitality: { direction: 'higher_better', greenMin: 90,  amberMin: 70 },
};

/**
 * Calculate RAG status using the centralised threshold table.
 * Falls back to 'amber' for metrics without defined thresholds.
 */
export function calculateRAGStatus(
  metricKey: string,
  value: number,
): 'red' | 'amber' | 'green' {
  const t = RAG_THRESHOLDS[metricKey];
  if (!t) return 'amber';

  switch (t.direction) {
    case 'higher_better':
      if (value > t.greenMin) return 'green';
      if (value >= t.amberMin) return 'amber';
      return 'red';
    case 'lower_better':
      if (value < t.greenMax) return 'green';
      if (value <= t.amberMax) return 'amber';
      return 'red';
    case 'target_band':
      if (value >= t.greenMin && value <= t.greenMax) return 'green';
      if (value >= t.amberMin && value <= t.amberMax) return 'amber';
      return 'red';
  }
}

/**
 * Get data source URL for a metric
 */
export function getDataSourceUrl(metricKey: string): string {
  const sources: Record<string, string> = {
    real_gdp_growth: 'https://www.ons.gov.uk/economy/grossdomesticproductgdp/timeseries/ihyp/qna',
    cpi_inflation: 'https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23',
    output_per_hour: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/labourproductivity/timeseries/lzvd/prdy',
    inactivity_rate: 'https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peoplenotinwork/economicinactivity/timeseries/lf2s/lms',
    real_wage_growth: 'https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/kab9/emp',
    job_vacancy_ratio: 'https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/ap2z/unem',
    attainment8: 'https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance',
    neet_rate: 'https://explore-education-statistics.service.gov.uk/find-statistics/neet-statistics-annual-brief',
    pupil_attendance: 'https://explore-education-statistics.service.gov.uk/find-statistics/pupil-absence-in-schools-in-england',
  };
  return sources[metricKey] || '';
}
