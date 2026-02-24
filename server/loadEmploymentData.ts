/**
 * One-off: Fetch employment metrics (Inactivity Rate LF2S, Real Wage Growth KAB9 YoY; quarterly only)
 * and load into MongoDB (metrics + metricHistory).
 * Run after updating employment_data_fetcher.py or to refresh employment data.
 *
 * Usage: npx tsx server/loadEmploymentData.ts
 */

import "dotenv/config";
import { fetchEmploymentMetrics, calculateRAGStatus } from "./dataIngestion";
import { upsertMetric, addMetricHistory } from "./db";
import type { MetricData } from "./dataIngestion";

function sortByTimePeriod(a: MetricData, b: MetricData): number {
  const ta = a.time_period || "";
  const tb = b.time_period || "";
  return ta.localeCompare(tb);
}

async function main() {
  const result = await fetchEmploymentMetrics(true);
  if (!result.success || !result.data || result.data.length === 0) {
    console.error("Failed to fetch employment metrics:", result.error || "No data");
    process.exit(1);
  }

  const rows = result.data as MetricData[];
  const byKey = new Map<string, MetricData[]>();
  for (const row of rows) {
    const k = row.metric_key;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(row);
  }

  let metricsUpserted = 0;
  let historyCount = 0;

  for (const [metricKey, keyRows] of byKey) {
    const sorted = [...keyRows].sort(sortByTimePeriod);
    const latest = sorted[sorted.length - 1];

    const ragStatus =
      metricKey === "inactivity_rate"
        ? calculateRAGStatus("inactivity_rate", Number(latest.value))
        : metricKey === "real_wage_growth"
          ? calculateRAGStatus("real_wage_growth", Number(latest.value))
          : metricKey === "job_vacancy_ratio"
            ? calculateRAGStatus("job_vacancy_ratio", Number(latest.value))
            : metricKey === "underemployment"
              ? calculateRAGStatus("underemployment", Number(latest.value))
              : (latest.rag_status as "red" | "amber" | "green");

    await upsertMetric({
      metricKey: latest.metric_key,
      name: latest.metric_name,
      category: latest.category,
      value: String(latest.value),
      unit: latest.unit || "%",
      ragStatus,
      dataDate: latest.time_period,
      sourceUrl: latest.source_url || null,
    });
    metricsUpserted++;
    console.log(`Metric upserted: ${latest.metric_key} (${latest.time_period})`);

    for (const row of sorted) {
      const rag =
        row.metric_key === "inactivity_rate"
          ? calculateRAGStatus("inactivity_rate", Number(row.value))
          : row.metric_key === "real_wage_growth"
            ? calculateRAGStatus("real_wage_growth", Number(row.value))
            : row.metric_key === "job_vacancy_ratio"
              ? calculateRAGStatus("job_vacancy_ratio", Number(row.value))
              : row.metric_key === "underemployment"
                ? calculateRAGStatus("underemployment", Number(row.value))
                : (row.rag_status as "red" | "amber" | "green");
      await addMetricHistory({
        metricKey: row.metric_key,
        value: String(row.value),
        ragStatus: rag,
        dataDate: row.time_period,
      });
      historyCount++;
    }
  }

  console.log(`Metrics: ${metricsUpserted}. History: ${historyCount} rows upserted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
