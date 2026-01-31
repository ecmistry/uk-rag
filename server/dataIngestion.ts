import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

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
    employment_rate: 'https://www.resolutionfoundation.org/our-work/estimates-of-uk-employment/',
    employment_rate_16_64: 'https://www.resolutionfoundation.org/our-work/estimates-of-uk-employment/',
    unemployment_rate: 'https://www.resolutionfoundation.org/our-work/estimates-of-uk-employment/',
    inactivity_rate: 'https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/economicinactivity/timeseries/lf2s/lms',
    real_wage_growth: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/a3ww/lms',
    job_vacancy_ratio: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/ap2z/unem',
    attainment8: 'https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance',
    teacher_vacancy_rate: 'https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england',
    neet_rate: 'https://explore-education-statistics.service.gov.uk/find-statistics/neet-statistics-annual-brief',
  };
  return sources[metricKey] || '';
}
