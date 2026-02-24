/**
 * One-off script: drop MongoDB collections that are no longer used by the app
 * (commentary, fileMetadata). Run after removing commentary and fileMetadata code.
 *
 * Usage: pnpm run db:drop-unused
 * Requires: DATABASE_URL or MONGODB_URI in .env or environment
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import { ENV } from "./_core/env";

const UNUSED_COLLECTIONS = ["commentary", "fileMetadata"] as const;

async function main() {
  if (!ENV.databaseUrl) {
    console.error("DATABASE_URL (or MONGODB_URI) is not set");
    process.exit(1);
  }

  const client = new MongoClient(ENV.databaseUrl);
  try {
    await client.connect();
    const db = client.db();
    const existing = await db.listCollections().toArray();
    const names = new Set(existing.map((c) => c.name));

    for (const name of UNUSED_COLLECTIONS) {
      if (names.has(name)) {
        await db.collection(name).drop();
        console.log(`Dropped collection: ${name}`);
      } else {
        console.log(`Collection not present (skip): ${name}`);
      }
    }
    console.log("Done.");
  } catch (error) {
    console.error("Error dropping collections:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
