/**
 * Script to load Education and Crime metrics into the database
 * Run with: tsx server/loadMetricsData.ts
 */

import "dotenv/config";
import { fetchEducationMetrics, fetchCrimeMetrics, fetchHealthcareMetrics, fetchDefenceMetrics, fetchEconomyMetrics, fetchEmploymentMetrics, fetchPopulationMetrics } from "./dataIngestion";
import { upsertMetric, addMetricHistory } from "./db";

// Helper function to compare time periods (newer = true)
function isNewerPeriod(period1: string, period2: string): boolean {
  try {
    // Try to parse as dates
    const d1 = new Date(period1);
    const d2 = new Date(period2);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      return d1 > d2;
    }
    // Fallback: string comparison (works for "2025 Nov" > "2014 Aug")
    return period1 > period2;
  } catch {
    return period1 > period2;
  }
}

async function loadMetrics() {
  console.log("=".repeat(60));
  console.log("Loading All Metrics (Economy, Education, Crime, Healthcare, Defence)");
  console.log("=".repeat(60));
  console.log();

  const results: Array<{ category: string; count: number; errors: string[] }> = [];

  // Fetch and store Economy metrics (with historical data)
  console.log("Fetching Economy metrics...");
  const economyResult = await fetchEconomyMetrics(true); // Historical mode
  
  if (economyResult.success && economyResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    // Process all economy metrics (including historical)
    for (const metricData of economyResult.data) {
      try {
        const unit = metricData.unit || '%';
        
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

        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        
        count++;
      } catch (error) {
        errors.push(`Failed to load ${metricData.metric_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    results.push({ category: "Economy", count, errors });
    console.log(`Economy: ${count} metrics loaded\n`);
  } else {
    results.push({ category: "Economy", count: 0, errors: [economyResult.error || "Failed to fetch economy metrics"] });
    console.log(`Economy: Failed to load metrics\n`);
  }

  // Fetch and store Employment metrics from Resolution Foundation
  console.log("Fetching Employment metrics from Resolution Foundation...");
  const employmentResult = await fetchEmploymentMetrics(true); // Historical mode
  
  if (employmentResult.success && employmentResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    // Group by metric_key to find latest for each metric
    const metricsByKey: Record<string, typeof employmentResult.data[0]> = {};
    const allHistory: typeof employmentResult.data = [];
    
    for (const metricData of employmentResult.data) {
      allHistory.push(metricData);
      const key = metricData.metric_key;
      
      // Keep track of latest data point for each metric
      if (!metricsByKey[key] || isNewerPeriod(metricData.time_period, metricsByKey[key].time_period)) {
        metricsByKey[key] = metricData;
      }
    }
    
    // First, add all historical data
    for (const metricData of allHistory) {
      try {
        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        count++;
      } catch (error) {
        errors.push(`Failed to add history for ${metricData.metric_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Then, update main metrics with latest values only
    for (const [key, metricData] of Object.entries(metricsByKey)) {
      try {
        const unit = metricData.unit || '%';
        
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
        
        console.log(`  ✓ Updated ${metricData.metric_name}: ${metricData.value}${unit} (${metricData.time_period})`);
      } catch (error) {
        errors.push(`Failed to update ${metricData.metric_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    results.push({ category: "Employment", count, errors });
    console.log(`Employment: ${count} history entries, ${Object.keys(metricsByKey).length} metrics updated\n`);
  } else {
    results.push({ category: "Employment", count: 0, errors: [employmentResult.error || "Failed to fetch employment metrics"] });
    console.log(`Employment: Failed to load metrics\n`);
  }

  // Fetch and store Education metrics
  console.log("Fetching Education metrics...");
  const educationResult = await fetchEducationMetrics();
  
  if (educationResult.success && educationResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    for (const metricData of educationResult.data) {
      try {
        // Determine unit based on metric key
        const unit = metricData.metric_key === 'attainment8' ? 'Score' :
                     metricData.metric_key === 'persistent_absence' ? '%' :
                     metricData.metric_key === 'apprentice_starts' ? '' :
                     metricData.metric_key.includes('rate') || metricData.metric_key.includes('vacancy') ? '%' : '';
        
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

        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        
        count++;
        console.log(`  ✓ ${metricData.metric_name}: ${metricData.value}${unit} (${metricData.rag_status})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${metricData.metric_name}: ${errorMsg}`);
        console.error(`  ✗ ${metricData.metric_name}: ${errorMsg}`);
      }
    }
    
    results.push({ category: 'Education', count, errors });
    console.log(`\nEducation: ${count} metrics loaded${errors.length > 0 ? `, ${errors.length} errors` : ''}`);
  } else {
    console.error(`Education fetch failed: ${educationResult.error}`);
    results.push({ category: 'Education', count: 0, errors: [educationResult.error || 'Unknown error'] });
  }

  console.log();

  // Fetch and store Crime metrics
  console.log("Fetching Crime metrics...");
  const crimeResult = await fetchCrimeMetrics();
  
  if (crimeResult.success && crimeResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    for (const metricData of crimeResult.data) {
      try {
        // Determine unit: % for rates and perception_of_safety, else count/empty
        const unit = (metricData.metric_key.includes('rate') || metricData.metric_key === 'perception_of_safety') ? '%' : '';
        
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

        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        
        count++;
        console.log(`  ✓ ${metricData.metric_name}: ${metricData.value}${unit} (${metricData.rag_status})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${metricData.metric_name}: ${errorMsg}`);
        console.error(`  ✗ ${metricData.metric_name}: ${errorMsg}`);
      }
    }
    
    results.push({ category: 'Crime', count, errors });
    console.log(`\nCrime: ${count} metrics loaded${errors.length > 0 ? `, ${errors.length} errors` : ''}`);
  } else {
    console.error(`Crime fetch failed: ${crimeResult.error}`);
    results.push({ category: 'Crime', count: 0, errors: [crimeResult.error || 'Unknown error'] });
  }

  console.log();

  // Fetch and store Healthcare metrics
  console.log("Fetching Healthcare metrics...");
  const healthcareResult = await fetchHealthcareMetrics();
  
  if (healthcareResult.success && healthcareResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    for (const metricData of healthcareResult.data) {
      try {
        // Determine unit based on metric key
        const unit = metricData.metric_key === 'a_e_wait_time' ? '%' :
                     metricData.metric_key === 'cancer_wait_time' ? ' days' :
                     metricData.metric_key === 'ambulance_response_time' ? ' minutes' :
                     (metricData.metric_key === 'gp_appt_access' || metricData.metric_key === 'staff_vacancy_rate') ? '%' : '';
        
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

        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        
        count++;
        console.log(`  ✓ ${metricData.metric_name}: ${metricData.value}${unit} (${metricData.rag_status})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${metricData.metric_name}: ${errorMsg}`);
        console.error(`  ✗ ${metricData.metric_name}: ${errorMsg}`);
      }
    }
    
    results.push({ category: 'Healthcare', count, errors });
    console.log(`\nHealthcare: ${count} metrics loaded${errors.length > 0 ? `, ${errors.length} errors` : ''}`);
  } else {
    console.error(`Healthcare fetch failed: ${healthcareResult.error}`);
    results.push({ category: 'Healthcare', count: 0, errors: [healthcareResult.error || 'Unknown error'] });
  }

  console.log();

  // Fetch and store Defence metrics
  console.log("Fetching Defence metrics...");
  const defenceResult = await fetchDefenceMetrics();
  
  if (defenceResult.success && defenceResult.data) {
    let count = 0;
    const errors: string[] = [];
    
    for (const metricData of defenceResult.data) {
      try {
        // Determine unit based on metric key
        const unit = (metricData.metric_key.includes('gdp') || metricData.metric_key.includes('readiness') ||
                     metricData.metric_key.includes('strength') || metricData.metric_key === 'equipment_spend' ||
                     metricData.metric_key === 'deployability') ? '%' : '';
        
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

        // Add to history
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        
        count++;
        console.log(`  ✓ ${metricData.metric_name}: ${metricData.value}${unit} (${metricData.rag_status})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${metricData.metric_name}: ${errorMsg}`);
        console.error(`  ✗ ${metricData.metric_name}: ${errorMsg}`);
      }
    }
    
    results.push({ category: 'Defence', count, errors });
    console.log(`\nDefence: ${count} metrics loaded${errors.length > 0 ? `, ${errors.length} errors` : ''}`);
  } else {
    console.error(`Defence fetch failed: ${defenceResult.error}`);
    results.push({ category: 'Defence', count: 0, errors: [defenceResult.error || 'Unknown error'] });
  }

  // Fetch and store Population metrics (Phase 4)
  console.log("Fetching Population metrics...");
  const populationResult = await fetchPopulationMetrics();
  if (populationResult.success && populationResult.data) {
    let count = 0;
    const errors: string[] = [];
    for (const metricData of populationResult.data) {
      try {
        const unit = metricData.unit ?? (metricData.metric_key === "total_population" ? "" : metricData.metric_key === "healthy_life_expectancy" ? " years" : "%");
        await upsertMetric({
          metricKey: metricData.metric_key,
          name: metricData.metric_name,
          category: metricData.category,
          value: metricData.value.toString(),
          unit,
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
          sourceUrl: metricData.source_url,
        });
        await addMetricHistory({
          metricKey: metricData.metric_key,
          value: metricData.value.toString(),
          ragStatus: metricData.rag_status,
          dataDate: metricData.time_period,
        });
        count++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    }
    results.push({ category: "Population", count, errors });
    console.log(`Population: ${count} metrics loaded\n`);
  } else {
    results.push({ category: "Population", count: 0, errors: [populationResult.error || "Failed to fetch population metrics"] });
    console.log("Population: Failed to load metrics\n");
  }

  console.log();
  console.log("=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  for (const result of results) {
    console.log(`${result.category}: ${result.count} metrics loaded`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.join(', ')}`);
    }
  }
  console.log("=".repeat(60));
}

loadMetrics()
  .then(() => {
    console.log("\n✓ Data loading complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Data loading failed:", error);
    process.exit(1);
  });
