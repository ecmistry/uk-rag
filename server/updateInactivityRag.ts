/**
 * One-off: Recompute and update RAG status for inactivity_rate in MongoDB
 * using thresholds: Green < 14%, Amber 14%–20%, Red > 20%.
 * Run after changing inactivity RAG thresholds so existing data reflects the new rules.
 *
 * Usage: npx tsx server/updateInactivityRag.ts
 */

import "dotenv/config";
import { getDb } from "./db";
import { calculateRAGStatus } from "./dataIngestion";

const METRIC_KEY = "inactivity_rate";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available.");
    process.exit(1);
  }

  const metricsCol = db.collection<{ metricKey: string; value: string; ragStatus: string }>("metrics");
  const historyCol = db.collection<{ metricKey: string; value: string; ragStatus: string; dataDate: string }>("metricHistory");

  // Update current metric document
  const metric = await metricsCol.findOne({ metricKey: METRIC_KEY });
  if (metric) {
    const value = Number(metric.value);
    if (!Number.isNaN(value)) {
      const rag = calculateRAGStatus(METRIC_KEY, value);
      await metricsCol.updateOne({ metricKey: METRIC_KEY }, { $set: { ragStatus: rag } });
      console.log(`Updated metrics.${METRIC_KEY}: value=${value} -> ragStatus=${rag}`);
    } else {
      console.warn(`Metric ${METRIC_KEY} has non-numeric value: ${metric.value}`);
    }
  } else {
    console.log(`No metric found for ${METRIC_KEY}, skipping metrics update.`);
  }

  // Update all history documents for this metric
  const history = await historyCol.find({ metricKey: METRIC_KEY }).toArray();
  let updated = 0;
  for (const h of history) {
    const value = Number(h.value);
    if (Number.isNaN(value)) continue;
    const rag = calculateRAGStatus(METRIC_KEY, value);
    if (rag !== h.ragStatus) {
      await historyCol.updateOne(
        { metricKey: METRIC_KEY, dataDate: h.dataDate },
        { $set: { ragStatus: rag } }
      );
      updated++;
    }
  }
  console.log(`Updated ${updated} of ${history.length} metricHistory rows for ${METRIC_KEY}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
