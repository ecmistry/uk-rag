/**
 * Scheduled Data Pull Service
 * Orchestrates incremental data pulls with delta detection
 */

import {
  fetchEconomyMetrics,
  fetchEmploymentMetrics,
  fetchEducationMetrics,
  fetchCrimeMetrics,
  fetchHealthcareMetrics,
  fetchDefenceMetrics,
} from "./dataIngestion";
import { upsertMetric, addMetricHistory, getMetricHistory } from "./db";
import { getProcessedPeriods, addProcessedPeriods } from "./fileMetadata";

export interface PullResult {
  category: string;
  success: boolean;
  metricsProcessed: number;
  newDataPoints: number;
  skippedDataPoints: number;
  errors: string[];
}

/**
 * Pull data for a single category with delta detection
 */
export async function pullCategoryData(
  category: string,
  incremental: boolean = true
): Promise<PullResult> {
  const result: PullResult = {
    category,
    success: false,
    metricsProcessed: 0,
    newDataPoints: 0,
    skippedDataPoints: 0,
    errors: [],
  };

  try {
    let fetchResult;
    let useHistorical = false;

    // Fetch data based on category
    switch (category) {
      case "Economy":
        useHistorical = true; // Economy always uses historical mode
        fetchResult = await fetchEconomyMetrics(useHistorical);
        break;
      case "Education":
        fetchResult = await fetchEducationMetrics();
        break;
      case "Crime":
        fetchResult = await fetchCrimeMetrics();
        break;
      case "Healthcare":
        useHistorical = true; // Healthcare uses historical for A&E
        fetchResult = await fetchHealthcareMetrics(useHistorical);
        break;
      case "Defence":
        fetchResult = await fetchDefenceMetrics();
        break;
      case "Employment":
        useHistorical = true;
        fetchResult = await fetchEmploymentMetrics(useHistorical);
        break;
      default:
        result.errors.push(`Unknown category: ${category}`);
        return result;
    }

    if (!fetchResult.success || !fetchResult.data) {
      result.errors.push(fetchResult.error || "Failed to fetch data");
      return result;
    }

    // Process each metric
    for (const metricData of fetchResult.data) {
      try {
        // Get already processed periods for this metric
        const processedPeriods = incremental
          ? await getProcessedPeriods(metricData.metric_key, metricData.source_url)
          : [];

        // Check if this time period was already processed
        if (incremental && processedPeriods.includes(metricData.time_period)) {
          result.skippedDataPoints++;
          continue;
        }

        // Upsert the current metric value
        await upsertMetric({
          metricKey: metricData.metric_key,
          name: metricData.metric_name,
          category: metricData.category,
          value: metricData.value.toString(),
          unit: metricData.unit || "%",
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
          sourceUrl: metricData.source_url,
        });

        // Add to history (check for duplicates)
        const existingHistory = await getMetricHistory(metricData.metric_key, 1000);
        const periodExists = existingHistory.some(
          (h) => h.dataDate === metricData.time_period
        );

        if (!periodExists) {
          await addMetricHistory({
            metricKey: metricData.metric_key,
            value: metricData.value.toString(),
            ragStatus: metricData.rag_status,
            dataDate: metricData.time_period,
          });

          result.newDataPoints++;

          // Track processed period
          if (incremental && metricData.source_url) {
            await addProcessedPeriods(
              metricData.metric_key,
              metricData.source_url,
              [metricData.time_period]
            );
          }
        } else {
          result.skippedDataPoints++;
        }

        result.metricsProcessed++;
      } catch (error) {
        result.errors.push(
          `Error processing ${metricData.metric_name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(
      `Failed to pull ${category} data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  return result;
}

/**
 * Pull all categories with delta detection
 */
export async function pullAllCategories(
  incremental: boolean = true
): Promise<PullResult[]> {
  const categories = ["Economy", "Employment", "Education", "Crime", "Healthcare", "Defence"];
  const results: PullResult[] = [];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Scheduled Data Pull - ${incremental ? "Incremental" : "Full"}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  for (const category of categories) {
    console.log(`\nPulling ${category} data...`);
    const result = await pullCategoryData(category, incremental);
    results.push(result);

    if (result.success) {
      console.log(
        `  ✓ ${category}: ${result.metricsProcessed} metrics, ${result.newDataPoints} new points, ${result.skippedDataPoints} skipped`
      );
    } else {
      console.error(`  ✗ ${category}: ${result.errors.join(", ")}`);
    }
  }

  const totalNew = results.reduce((sum, r) => sum + r.newDataPoints, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skippedDataPoints, 0);

  console.log(`\n${"=".repeat(60)}`);
  console.log("Summary:");
  console.log(`  Total new data points: ${totalNew}`);
  console.log(`  Total skipped (already processed): ${totalSkipped}`);
  console.log(`  Completed: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  return results;
}

/**
 * Run scheduled pull (can be called from cron or scheduler)
 */
export async function runScheduledPull(): Promise<void> {
  try {
    await pullAllCategories(true); // Always use incremental mode for scheduled pulls
  } catch (error) {
    console.error("[Scheduled Pull] Fatal error:", error);
    process.exit(1);
  }
}

// If run directly, execute the pull
if (import.meta.url.endsWith(process.argv[1]?.replace(process.cwd(), '') || '') || process.argv[1]?.includes('scheduledDataPull')) {
  runScheduledPull().catch(console.error);
}
