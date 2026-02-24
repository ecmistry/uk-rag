/**
 * Setup MongoDB indexes for optimal performance
 */

import { MongoClient } from "mongodb";
import { ENV } from "./_core/env";

async function setupIndexes() {
  if (!ENV.databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new MongoClient(ENV.databaseUrl);
  
  try {
    await client.connect();
    const db = client.db();

    console.log("Setting up MongoDB indexes...");

    // Users collection indexes
    await db.collection("users").createIndex({ openId: 1 }, { unique: true });
    console.log("✓ Created index on users.openId");

    // Metrics collection indexes
    await db.collection("metrics").createIndex({ metricKey: 1 }, { unique: true });
    await db.collection("metrics").createIndex({ category: 1 });
    await db.collection("metrics").createIndex({ ragStatus: 1 });
    console.log("✓ Created indexes on metrics");

    // Metric history collection indexes
    await db.collection("metricHistory").createIndex({ metricKey: 1 });
    await db.collection("metricHistory").createIndex({ recordedAt: -1 });
    await db.collection("metricHistory").createIndex({ metricKey: 1, recordedAt: -1 });
    await db.collection("metricHistory").createIndex({ metricKey: 1, dataDate: -1, recordedAt: -1 });
    console.log("✓ Created indexes on metricHistory");

    console.log("\nAll indexes created successfully!");
  } catch (error) {
    console.error("Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupIndexes();
