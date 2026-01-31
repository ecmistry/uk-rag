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

    // Commentary collection indexes
    await db.collection("commentary").createIndex({ status: 1 });
    await db.collection("commentary").createIndex({ publishedAt: -1 });
    await db.collection("commentary").createIndex({ id: 1 });
    await db.collection("commentary").createIndex({ createdAt: -1 });
    console.log("✓ Created indexes on commentary");

    // File metadata collection indexes (for delta detection)
    await db.collection("fileMetadata").createIndex({ url: 1, metricKey: 1 }, { unique: true });
    await db.collection("fileMetadata").createIndex({ category: 1 });
    await db.collection("fileMetadata").createIndex({ lastChecked: -1 });
    console.log("✓ Created indexes on fileMetadata");

    console.log("\nAll indexes created successfully!");
  } catch (error) {
    console.error("Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupIndexes();
