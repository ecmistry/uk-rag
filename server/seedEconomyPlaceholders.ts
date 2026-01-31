/**
 * Seed Public Sector Net Debt and Business Investment as Economy metrics (placeholder).
 * Run once to ensure these tiles appear in the Economy section.
 */

import "dotenv/config";
import { getDb } from "./db";

const PLACEHOLDER_METRICS = [
  {
    metricKey: "public_sector_net_debt",
    name: "Public Sector Net Debt",
    category: "Economy",
    value: "placeholder",
    unit: "%",
    ragStatus: "amber" as const,
    dataDate: `${new Date().getFullYear()} Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    sourceUrl: null as string | null,
  },
  {
    metricKey: "business_investment",
    name: "Business Investment",
    category: "Economy",
    value: "placeholder",
    unit: "%",
    ragStatus: "amber" as const,
    dataDate: `${new Date().getFullYear()} Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    sourceUrl: null as string | null,
  },
];

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL is not set or could not connect");
    process.exit(1);
  }

  const collection = db.collection("metrics");
  const now = new Date();

  for (const m of PLACEHOLDER_METRICS) {
    await collection.updateOne(
      { metricKey: m.metricKey },
      {
        $set: {
          name: m.name,
          category: m.category,
          value: m.value,
          unit: m.unit,
          ragStatus: m.ragStatus,
          dataDate: m.dataDate,
          sourceUrl: m.sourceUrl,
          lastUpdated: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );
    console.log(`Upserted: ${m.name} (${m.metricKey})`);
  }

  console.log("Economy placeholder tiles seeded.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
