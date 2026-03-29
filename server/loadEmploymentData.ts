/**
 * One-off: Fetch employment metrics (Inactivity Rate LF2S, Real Wage Growth KAB9 YoY; quarterly only)
 * and load into MongoDB (metrics + metricHistory).
 * Run after updating employment_data_fetcher.py or to refresh employment data.
 *
 * Usage: npx tsx server/loadEmploymentData.ts
 */

import "dotenv/config";
import { fetchEmploymentMetrics, calculateRAGStatus, RAG_THRESHOLDS } from "./dataIngestion";
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

    const ragStatus = RAG_THRESHOLDS[metricKey]
      ? calculateRAGStatus(metricKey, Number(latest.value))
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
      const rag = RAG_THRESHOLDS[row.metric_key]
        ? calculateRAGStatus(row.metric_key, Number(row.value))
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
