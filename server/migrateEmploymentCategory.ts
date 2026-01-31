/**
 * One-time migration: set category to "Employment" for employment metrics
 * that are still stored with category "Economy" in the database.
 */

import "dotenv/config";
import { getDb } from "./db";

const EMPLOYMENT_METRIC_KEYS = ["employment_rate", "employment_rate_16_64"];

async function migrate() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL is not set or could not connect");
    process.exit(1);
  }

  const collection = db.collection("metrics");
  const result = await collection.updateMany(
    { metricKey: { $in: EMPLOYMENT_METRIC_KEYS }, category: "Economy" },
    { $set: { category: "Employment" } }
  );

  console.log(`Updated ${result.modifiedCount} metric(s) to category "Employment".`);
  if (result.matchedCount === 0) {
    console.log("No metrics had category Economy (already correct or not present).");
  }
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
