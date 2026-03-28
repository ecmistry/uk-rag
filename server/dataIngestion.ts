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
 * Fetch Population metrics (Phase 4). Runs population_data_fetcher.py; outputs 5 metrics (placeholder until ONS wired).
 */
export async function fetchPopulationMetrics(): Promise<DataIngestionResult> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'population_data_fetcher.py');

    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);

    if (stderr) {
      console.warn('[Data Ingestion] Population script stderr:', stderr);
    }

    const jsonMatch = stdout.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON output from population script');
    }

    const data: MetricData[] = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Data Ingestion] Failed to fetch population metrics:', error);
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
  interest_and_dividends: number;
  gross_operating_surplus: number;
  other_receipts: number;
}

export interface PublicSectorReceipts {
  periods: PublicSectorReceiptsPeriod[];
}

/**
 * Fetch public sector current receipts (ONS Appendix D).
 * Runs public_sector_receipts_fetcher.py --chart, returns quarterly aggregated data.
 */
export async function getPublicSectorReceipts(): Promise<PublicSectorReceipts | null> {
  try {
    const projectRoot = getProjectRoot();
    const scriptPath = path.join(projectRoot, 'server', 'public_sector_receipts_fetcher.py');
    const { stdout } = await execAsync(`python3 ${scriptPath} --chart`, { timeout: 30_000 });
    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '{}') return null;
    const data = JSON.parse(trimmed) as PublicSectorReceipts;
    if (!data.periods || !Array.isArray(data.periods) || data.periods.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * RAG threshold definitions for each metric
 */
export const RAG_THRESHOLDS = {
  real_gdp_growth: {
    green: 2.0,
    amber: 1.0,
  },
  cpi_inflation: {
    green_min: 1.5,
    green_max: 2.5,
    amber_min: 1.0,
    amber_max: 3.5,
  },
  output_per_hour: {
    green: 1.0,   // >= 1% year-on-year growth
    amber: 0.0,   // 0% to 1% growth
  },
  /** Inactivity rate: lower is better. Green < 14%, Amber 14%–20%, Red > 20% */
  inactivity_rate: {
    green_max: 14,
    amber_max: 20,
  },
  /** Real wage growth: Green > 2%, Amber 1%–2%, Red < 1% */
  real_wage_growth: {
    green_min: 2,
    amber_min: 1,
    amber_max: 2,
  },
  /** Job vacancy ratio: Green > 3.5%, Amber 2.5%–3.5%, Red < 2.5% */
  job_vacancy_ratio: {
    green_min: 3.5,
    amber_min: 2.5,
    amber_max: 3.5,
  },
  /** Underemployment: lower is better. Green < 5.5%, Amber 5.5%–8.5%, Red > 8.5% */
  underemployment: {
    green_max: 5.5,
    amber_max: 8.5,
  },
} as const;

/**
 * Calculate RAG status for a given metric
 */
export function calculateRAGStatus(
  metricKey: string,
  value: number
): 'red' | 'amber' | 'green' {
  if (metricKey === 'cpi_inflation') {
    const t = RAG_THRESHOLDS.cpi_inflation;
    if (value >= t.green_min && value <= t.green_max) return 'green';
    if (value >= t.amber_min && value <= t.amber_max) return 'amber';
    return 'red';
  }

  /** Inactivity rate: lower is better. Green < 14%, Amber 14%–20%, Red > 20% */
  if (metricKey === 'inactivity_rate') {
    const t = RAG_THRESHOLDS.inactivity_rate;
    if (value < t.green_max) return 'green';
    if (value <= t.amber_max) return 'amber';
    return 'red';
  }

  /** Real wage growth: Green > 2%, Amber 1%–2%, Red < 1% */
  if (metricKey === 'real_wage_growth') {
    const t = RAG_THRESHOLDS.real_wage_growth;
    if (value > t.green_min) return 'green';
    if (value >= t.amber_min && value <= t.amber_max) return 'amber';
    return 'red';
  }

  /** Job vacancy ratio: Green > 3.5%, Amber 2.5%–3.5%, Red < 2.5% */
  if (metricKey === 'job_vacancy_ratio') {
    const t = RAG_THRESHOLDS.job_vacancy_ratio;
    if (value > t.green_min) return 'green';
    if (value >= t.amber_min && value <= t.amber_max) return 'amber';
    return 'red';
  }

  /** Underemployment: lower is better. Green < 5.5%, Amber 5.5%–8.5%, Red > 8.5% */
  if (metricKey === 'underemployment') {
    const t = RAG_THRESHOLDS.underemployment;
    if (value < t.green_max) return 'green';
    if (value <= t.amber_max) return 'amber';
    return 'red';
  }

  const thresholds = RAG_THRESHOLDS[metricKey as keyof typeof RAG_THRESHOLDS];
  if (!thresholds || !('green' in thresholds)) return 'red';

  if (value >= thresholds.green) return 'green';
  if (value >= thresholds.amber) return 'amber';
  return 'red';
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
