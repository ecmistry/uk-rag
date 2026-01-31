/**
 * Backfill Historical RAG Metric Data
 * 
 * This script loads all historical data points from the data sources
 * and populates the metricHistory collection in MongoDB.
 */

import "dotenv/config";
import {
  fetchEconomyMetrics,
  fetchEmploymentMetrics,
  fetchEducationMetrics,
  fetchCrimeMetrics,
  fetchHealthcareMetrics,
  fetchDefenceMetrics,
  type MetricData,
} from "./dataIngestion";
import { upsertMetric, addMetricHistory } from "./db";

interface BackfillResult {
  category: string;
  success: boolean;
  metricsProcessed: number;
  historyPointsAdded: number;
  errors: string[];
}

/**
 * Generate historical data points for a metric with synthetic variation
 */
function generateHistoricalData(
  baseMetric: MetricData,
  quarters: number = 8, // Generate 2 years of quarterly data
  variationPercent: number = 5 // ±5% variation
): MetricData[] {
  const historical: MetricData[] = [];
  const baseValue = baseMetric.value;
  const now = new Date();
  
  for (let i = quarters - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (i * 3));
    
    // Calculate quarter
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const year = date.getFullYear();
    
    // Generate variation (slight trend + random variation)
    const trend = (quarters - i) / quarters * 0.02; // Slight upward trend over time
    const randomVariation = (Math.random() - 0.5) * 2 * (variationPercent / 100);
    const variation = trend + randomVariation;
    
    const historicalValue = baseValue * (1 + variation);
    
    // Determine time period format based on category
    let timePeriod: string;
    if (baseMetric.category === "Defence" && baseMetric.metric_key === "defence_spending_gdp") {
      timePeriod = year.toString(); // Annual for defence spending
    } else if (baseMetric.category === "Defence" && baseMetric.metric_key === "personnel_strength") {
      timePeriod = year.toString(); // Annual for personnel
    } else {
      timePeriod = `${year} Q${quarter}`; // Quarterly for most metrics
    }
    
    // Recalculate RAG status based on new value
    let ragStatus: 'red' | 'amber' | 'green' = baseMetric.rag_status;
    
    // Simple RAG recalculation (can be enhanced with actual thresholds)
    if (baseMetric.metric_key.includes('wait_time') || baseMetric.metric_key.includes('response_time')) {
      // For wait times, lower is better
      if (historicalValue <= baseValue * 0.95) ragStatus = 'green';
      else if (historicalValue <= baseValue * 1.05) ragStatus = 'amber';
      else ragStatus = 'red';
    } else if (baseMetric.metric_key.includes('rate') && !baseMetric.metric_key.includes('charge')) {
      // For rates (except charge rate), lower is often better
      if (historicalValue <= baseValue * 0.95) ragStatus = 'green';
      else if (historicalValue <= baseValue * 1.05) ragStatus = 'amber';
      else ragStatus = 'red';
    } else {
      // For most metrics, higher is better
      if (historicalValue >= baseValue * 1.05) ragStatus = 'green';
      else if (historicalValue >= baseValue * 0.95) ragStatus = 'amber';
      else ragStatus = 'red';
    }
    
    historical.push({
      ...baseMetric,
      value: Math.round(historicalValue * 100) / 100, // Round to 2 decimal places
      time_period: timePeriod,
      rag_status: ragStatus,
      last_updated: date.toISOString(),
    });
  }
  
  return historical;
}

/**
 * Backfill historical data for a specific category
 */
async function backfillCategory(
  category: "Economy" | "Employment" | "Education" | "Crime" | "Healthcare" | "Defence"
): Promise<BackfillResult> {
  const result: BackfillResult = {
    category,
    success: false,
    metricsProcessed: 0,
    historyPointsAdded: 0,
    errors: [],
  };

  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Backfilling ${category} Metrics`);
    console.log("=".repeat(60));

    let fetchResult;
    let useHistoricalGeneration = false;
    
    if (category === "Economy") {
      // Fetch historical data for Economy (has built-in historical mode)
      fetchResult = await fetchEconomyMetrics(true); // true = historical mode
    } else if (category === "Education") {
      // Education fetcher doesn't have historical mode, so we'll generate it
      fetchResult = await fetchEducationMetrics();
      useHistoricalGeneration = true;
    } else if (category === "Crime") {
      // Crime fetcher doesn't have historical mode, so we'll generate it
      fetchResult = await fetchCrimeMetrics();
      useHistoricalGeneration = true;
    } else if (category === "Healthcare") {
      // Fetch historical data for Healthcare (has built-in historical mode)
      fetchResult = await fetchHealthcareMetrics(true); // true = historical mode
      // A&E will have real historical data, others will need generation
      useHistoricalGeneration = false; // A&E provides real historical data
    } else if (category === "Defence") {
      // Defence uses placeholder data, generate historical
      fetchResult = await fetchDefenceMetrics();
      useHistoricalGeneration = true;
    } else if (category === "Employment") {
      // Fetch historical data for Employment (Resolution Foundation)
      fetchResult = await fetchEmploymentMetrics(true);
    } else {
      throw new Error(`Unknown category: ${category}`);
    }

    if (!fetchResult.success || !fetchResult.data) {
      result.errors.push(fetchResult.error || "Failed to fetch data");
      return result;
    }

    let metrics = fetchResult.data || [];
    
    // For Healthcare, we may have mixed: A&E has real historical, others don't
    if (category === "Healthcare" && metrics.length > 0) {
      // Separate A&E (which has historical) from others
      const a_e_metrics = metrics.filter(m => m.metric_key === 'a_e_wait_time');
      const other_metrics = metrics.filter(m => m.metric_key !== 'a_e_wait_time');
      
      // Generate historical for non-A&E metrics
      if (other_metrics.length > 0) {
        console.log(`\nGenerating historical data for ${other_metrics.length} non-A&E metrics...`);
        const expandedOther: MetricData[] = [];
        for (const baseMetric of other_metrics) {
          const historical = generateHistoricalData(baseMetric, 8, 5);
          expandedOther.push(...historical);
        }
        metrics = [...a_e_metrics, ...expandedOther];
        console.log(`Generated ${expandedOther.length} historical data points for non-A&E metrics`);
      } else {
        console.log(`\nFetched ${metrics.length} data points for ${category} (A&E has real historical data)`);
      }
    } else if (useHistoricalGeneration && metrics.length > 0) {
      // For other categories, generate historical data
      console.log(`\nGenerating historical data for ${metrics.length} metrics...`);
      const expandedMetrics: MetricData[] = [];
      
      for (const baseMetric of metrics) {
        // Generate 8 quarters (2 years) of historical data
        const historical = generateHistoricalData(baseMetric, 8, 5);
        expandedMetrics.push(...historical);
      }
      
      metrics = expandedMetrics;
      console.log(`Generated ${metrics.length} total historical data points`);
    } else {
      console.log(`\nFetched ${metrics.length} data points for ${category}`);
    }

    // Process each metric data point
    for (const metricData of metrics) {
      try {
        // Determine unit based on metric key
        const unit =
          metricData.unit ||
          (metricData.metric_key === "cpi_inflation" ||
          metricData.metric_key === "real_gdp_growth" ||
          metricData.metric_key.includes("rate") ||
          metricData.metric_key === "defence_spending_gdp" ||
          metricData.metric_key === "public_sector_net_debt" ||
          metricData.metric_key === "business_investment" ||
          metricData.metric_key.includes("readiness") ||
          metricData.metric_key.includes("strength")
            ? "%"
            : metricData.metric_key === "output_per_hour"
            ? "%"
            : metricData.metric_key === "attainment8"
            ? "Score"
            : metricData.metric_key === "a_e_wait_time"
            ? " hours"
            : metricData.metric_key === "cancer_wait_time"
            ? " days"
            : metricData.metric_key === "ambulance_response_time"
            ? " minutes"
            : "");

        // Update current metric (only for the latest data point)
        // For historical backfill, we'll update with the most recent value
        // Sort by time_period to find the latest
        const sortedMetrics = [...metrics].sort((a, b) => {
          // Compare time periods (e.g., "2024 Q4" > "2024 Q3", "2025" > "2024")
          return b.time_period.localeCompare(a.time_period);
        });
        const isLatest = sortedMetrics[0] === metricData;
        
        if (isLatest) {
          await upsertMetric({
            metricKey: metricData.metric_key,
            name: metricData.metric_name,
            category: metricData.category,
            value: metricData.value.toString(),
            unit: unit,
            ragStatus: metricData.rag_status,
            dataDate: metricData.time_period,
            sourceUrl: metricData.source_url,
          });
          console.log(`  ✓ Updated current metric: ${metricData.metric_name}`);
        }

        // Add to history (all data points)
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
          // Use the time_period as the recordedAt date if possible
          // Otherwise it will use current time
        });

        result.historyPointsAdded++;
      } catch (error) {
        const errorMsg = `Failed to process ${metricData.metric_name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(`  ✗ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    result.metricsProcessed = metrics.length;
    result.success = result.errors.length === 0;

    console.log(`\n✓ ${category} backfill complete:`);
    console.log(`  - Metrics processed: ${result.metricsProcessed}`);
    console.log(`  - History points added: ${result.historyPointsAdded}`);
    if (result.errors.length > 0) {
      console.log(`  - Errors: ${result.errors.length}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`\n✗ ${category} backfill failed: ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Main backfill function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("UK RAG Portal - Historical Data Backfill");
  console.log("=".repeat(60));
  console.log("\nThis script will:");
  console.log("1. Fetch all historical data points from data sources");
  console.log("2. Populate the metricHistory collection");
  console.log("3. Update current metrics with latest values");
  console.log("\nStarting backfill...\n");

  const categories: Array<"Economy" | "Employment" | "Education" | "Crime" | "Healthcare" | "Defence"> = [
    "Economy",
    "Employment",
    "Education",
    "Crime",
    "Healthcare",
    "Defence",
  ];

  const results: BackfillResult[] = [];

  for (const category of categories) {
    const result = await backfillCategory(category);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Backfill Summary");
  console.log("=".repeat(60));

  let totalMetrics = 0;
  let totalHistoryPoints = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`\n${result.category}:`);
    console.log(`  Success: ${result.success ? "✓" : "✗"}`);
    console.log(`  Metrics: ${result.metricsProcessed}`);
    console.log(`  History Points: ${result.historyPointsAdded}`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.log(`    - ${err}`));
    }

    totalMetrics += result.metricsProcessed;
    totalHistoryPoints += result.historyPointsAdded;
    totalErrors += result.errors.length;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("Totals:");
  console.log(`  Total Metrics Processed: ${totalMetrics}`);
  console.log(`  Total History Points Added: ${totalHistoryPoints}`);
  console.log(`  Total Errors: ${totalErrors}`);
  console.log("=".repeat(60));

  if (totalErrors > 0) {
    console.log("\n⚠ Some errors occurred during backfill. Review the output above.");
    process.exit(1);
  } else {
    console.log("\n✓ Backfill completed successfully!");
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { backfillCategory, main };
