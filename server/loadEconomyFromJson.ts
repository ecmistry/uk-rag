/**
 * One-off: load server/economy_metrics.json into MongoDB (metrics + metricHistory).
 * Run after: python3 server/economy_data_fetcher.py --historical
 * Then restart the app (or clear metrics cache) so the dashboard shows new data.
 *
 * Usage: npx tsx server/loadEconomyFromJson.ts
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join } from "path";
import { ENV } from "./_core/env";

const ECONOMY_JSON_PATH = join(process.cwd(), "server", "economy_metrics.json");

type JsonRow = {
  metric_name: string;
  metric_key: string;
  category: string;
  value: number | string;
  time_period: string;
  unit: string;
  rag_status: string;
  data_source?: string;
  source_url?: string;
  last_updated?: string;
};

function isPlaceholder(row: JsonRow): boolean {
  return row.value === "placeholder" || row.data_source === "Placeholder";
}

function toMetricDoc(row: JsonRow, now: Date) {
  return {
    metricKey: row.metric_key,
    name: row.metric_name,
    category: row.category,
    value: String(row.value),
    unit: row.unit ?? "%",
    ragStatus: row.rag_status as "red" | "amber" | "green",
    dataDate: row.time_period || new Date().getFullYear().toString(),
    sourceUrl: row.source_url ?? null,
    lastUpdated: now,
    createdAt: now,
  };
}

function toHistoryDoc(row: JsonRow, now: Date) {
  return {
    metricKey: row.metric_key,
    value: String(row.value),
    ragStatus: row.rag_status as "red" | "amber" | "green",
    dataDate: row.time_period,
    recordedAt: now,
  };
}

async function main() {
  if (!ENV.databaseUrl) {
    console.error("DATABASE_URL (or MONGODB_URI) is not set");
    process.exit(1);
  }

  const raw = readFileSync(ECONOMY_JSON_PATH, "utf-8");
  const rows: JsonRow[] = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("No data in economy_metrics.json");
    process.exit(1);
  }

  const now = new Date();
  const client = new MongoClient(ENV.databaseUrl);

  try {
    await client.connect();
    const db = client.db();

    const metricsCol = db.collection("metrics");
    const historyCol = db.collection("metricHistory");

    // Group by metric_key; for each key, latest by time_period is the current metric
    const byKey = new Map<string, JsonRow[]>();
    for (const row of rows) {
      const key = row.metric_key;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(row);
    }

    let metricsUpserted = 0;
    let historyUpserted = 0;

    for (const [metricKey, keyRows] of byKey) {
      // Sort by time_period desc (empty last); take first as latest
      const sorted = [...keyRows].sort((a, b) => {
        const ta = a.time_period || "";
        const tb = b.time_period || "";
        return tb.localeCompare(ta);
      });
      const latest = sorted[0];
      const metricDoc = toMetricDoc(latest, now);
      await metricsCol.updateOne(
        { metricKey },
        { $set: metricDoc },
        { upsert: true }
      );
      metricsUpserted++;

      // History: all rows that have a valid time_period (skip placeholders for history)
      for (const row of keyRows) {
        if (isPlaceholder(row) || !row.time_period) continue;
        const histDoc = toHistoryDoc(row, now);
        await historyCol.updateOne(
          { metricKey: row.metric_key, dataDate: row.time_period },
          { $set: histDoc },
          { upsert: true }
        );
        historyUpserted++;
      }
    }

    console.log(`Metrics: ${metricsUpserted} upserted. History: ${historyUpserted} upserted.`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
