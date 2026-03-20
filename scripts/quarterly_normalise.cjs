/**
 * Comprehensive quarterly normalisation script.
 * Converts ALL metric history entries to canonical "YYYY QN" format.
 * For monthly data: aggregates to quarterly (keeps last-month-of-quarter value).
 * For annual data: maps to Q4 of that year.
 * For custom formats: converts to standard.
 * Deduplicates and updates scorecards to match.
 */

const { MongoClient } = require("mongodb");
const MONGO_URI = "mongodb://localhost:27017/uk_rag_portal";

const MONTH_NAMES = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function monthToQuarter(month) {
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

function lastMonthOfQuarter(q) {
  return q * 3;
}

/**
 * Parse any dataDate string into { year, quarter, monthInQuarter }.
 * monthInQuarter helps pick the "latest" entry within a quarter when aggregating monthly data.
 */
function parseToQuarter(dataDate) {
  const s = String(dataDate).trim();
  if (!s || s.toLowerCase() === "placeholder") return null;

  let m;

  // Already "YYYY QN"
  m = s.match(/^(\d{4})\s+Q([1-4])$/i);
  if (m) return { year: +m[1], quarter: +m[2], monthInQuarter: lastMonthOfQuarter(+m[2]) };

  // "QN YYYY"
  m = s.match(/^Q([1-4])\s+(\d{4})$/i);
  if (m) return { year: +m[2], quarter: +m[1], monthInQuarter: lastMonthOfQuarter(+m[1]) };

  // NHS financial year quarterly: "Q4 2024/25"
  m = s.match(/^Q([1-4])\s+(\d{4})\/(\d{2})$/i);
  if (m) {
    const fq = +m[1];
    const startYear = +m[2];
    // FY Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar(next year)
    const map = { 1: [startYear, 2], 2: [startYear, 3], 3: [startYear, 4], 4: [startYear + 1, 1] };
    const [yr, cq] = map[fq];
    return { year: yr, quarter: cq, monthInQuarter: lastMonthOfQuarter(cq) };
  }

  // Month range: "Oct-Dec 2023", "Jan-Mar 2024"
  m = s.match(/^(\w+)-(\w+)\s+(\d{4})/i);
  if (m) {
    const endMonth = MONTH_NAMES[m[2].toLowerCase()];
    const year = +m[3];
    if (endMonth) return { year, quarter: monthToQuarter(endMonth), monthInQuarter: endMonth };
  }

  // "Year Ending" format: "YE Jun 25 P" or "YE Jun 24"
  m = s.match(/^YE\s+(\w+)\s+(\d{2,4})/i);
  if (m) {
    const month = MONTH_NAMES[m[1].toLowerCase()];
    let year = +m[2];
    if (year < 100) year += 2000;
    if (month) return { year, quarter: monthToQuarter(month), monthInQuarter: month };
  }

  // Monthly: "Nov 2025" / "November 2025"
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (name.length < 3) continue; // skip single-char dupes
    const re1 = new RegExp(`^${name}[a-z]*\\s+(\\d{4})$`, "i");
    const m1 = s.match(re1);
    if (m1) return { year: +m1[1], quarter: monthToQuarter(num), monthInQuarter: num };
  }

  // Monthly: "2025 NOV" / "2025 Sep" / "2026 JAN"
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (name.length < 3) continue;
    const re2 = new RegExp(`^(\\d{4})\\s+${name}[a-z]*$`, "i");
    const m2 = s.match(re2);
    if (m2) return { year: +m2[1], quarter: monthToQuarter(num), monthInQuarter: num };
  }

  // Multi-year range: "2021-2023" → end year Q4
  m = s.match(/^(\d{4})-(\d{4})$/);
  if (m) return { year: +m[2], quarter: 4, monthInQuarter: 12 };

  // Academic year: "202425" → Q3 of end year (results published summer)
  m = s.match(/^(\d{4})(\d{2})$/);
  if (m) return { year: +m[1] + 1, quarter: 3, monthInQuarter: 9 };

  // Pure annual: "2025" → Q4
  m = s.match(/^(\d{4})$/);
  if (m) return { year: +m[1], quarter: 4, monthInQuarter: 12 };

  console.warn(`  [WARN] Cannot parse dataDate: "${s}"`);
  return null;
}

function toCanonical(year, quarter) {
  return `${year} Q${quarter}`;
}

async function run() {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db();
  const metrics = db.collection("metrics");
  const history = db.collection("metricHistory");

  const allMetricDocs = await metrics.find({}).toArray();
  const allKeys = [...new Set(allMetricDocs.map((m) => m.metricKey).filter(Boolean))].sort();

  console.log(`Processing ${allKeys.length} metrics...\n`);

  let totalConverted = 0;
  let totalDeleted = 0;

  for (const key of allKeys) {
    const histDocs = await history.find({ metricKey: key }).toArray();
    if (histDocs.length === 0) {
      console.log(`[${key}] No history — skipping`);
      continue;
    }

    // Check if already fully normalised
    const allAlreadyCanonical = histDocs.every((h) => /^\d{4}\s+Q[1-4]$/.test(String(h.dataDate).trim()));
    const hasDupes = new Set(histDocs.map((h) => h.dataDate)).size < histDocs.length;

    if (allAlreadyCanonical && !hasDupes) {
      console.log(`[${key}] Already canonical (${histDocs.length} entries) — no changes`);
      continue;
    }

    // Parse and group by quarter
    const grouped = new Map(); // "YYYY QN" → best entry
    let unparseable = 0;

    for (const doc of histDocs) {
      const parsed = parseToQuarter(doc.dataDate);
      if (!parsed) {
        unparseable++;
        continue;
      }
      const canonical = toCanonical(parsed.year, parsed.quarter);
      const existing = grouped.get(canonical);

      if (!existing) {
        grouped.set(canonical, { ...doc, _parsedMonth: parsed.monthInQuarter });
      } else {
        // Prefer the entry from the later month within the quarter
        if (parsed.monthInQuarter > existing._parsedMonth) {
          grouped.set(canonical, { ...doc, _parsedMonth: parsed.monthInQuarter });
        } else if (parsed.monthInQuarter === existing._parsedMonth) {
          // Same month: keep entry with latest recordedAt
          const existRec = existing.recordedAt ? new Date(existing.recordedAt).getTime() : 0;
          const newRec = doc.recordedAt ? new Date(doc.recordedAt).getTime() : 0;
          if (newRec > existRec) {
            grouped.set(canonical, { ...doc, _parsedMonth: parsed.monthInQuarter });
          }
        }
      }
    }

    const beforeCount = histDocs.length;
    const afterCount = grouped.size;
    const removed = beforeCount - afterCount;

    if (unparseable > 0) {
      console.log(`[${key}] WARNING: ${unparseable} entries could not be parsed`);
    }

    // Delete ALL old entries for this metric
    await history.deleteMany({ metricKey: key });
    totalDeleted += beforeCount;

    // Insert new quarterly entries
    const newDocs = [];
    for (const [canonical, doc] of grouped) {
      const newDoc = {
        metricKey: doc.metricKey,
        dataDate: canonical,
        value: doc.value,
        ragStatus: doc.ragStatus,
        recordedAt: doc.recordedAt || new Date(),
      };
      if (doc.information) newDoc.information = doc.information;
      if (doc.sourceUrl) newDoc.sourceUrl = doc.sourceUrl;
      if (doc.dataSource) newDoc.dataSource = doc.dataSource;
      if (doc.unit) newDoc.unit = doc.unit;
      newDocs.push(newDoc);
    }

    if (newDocs.length > 0) {
      await history.insertMany(newDocs);
    }
    totalConverted += newDocs.length;

    // Update scorecard to latest quarterly entry
    const sorted = newDocs.sort((a, b) => {
      const pa = parseToQuarter(a.dataDate);
      const pb = parseToQuarter(b.dataDate);
      if (!pa || !pb) return 0;
      return (pb.year * 10 + pb.quarter) - (pa.year * 10 + pa.quarter);
    });

    if (sorted.length > 0) {
      const latest = sorted[0];
      const scorecardDoc = allMetricDocs.find((m) => m.metricKey === key);
      const currentScorecardDate = scorecardDoc?.dataDate || "";
      const parsedCurrent = parseToQuarter(currentScorecardDate);
      const parsedLatest = parseToQuarter(latest.dataDate);

      if (parsedCurrent && parsedLatest) {
        const currentKey = parsedCurrent.year * 10 + parsedCurrent.quarter;
        const latestKey = parsedLatest.year * 10 + parsedLatest.quarter;

        if (currentKey <= latestKey && currentScorecardDate !== latest.dataDate) {
          await metrics.updateOne(
            { metricKey: key },
            { $set: { dataDate: latest.dataDate, lastUpdated: new Date() } }
          );
          console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard: "${currentScorecardDate}" → "${latest.dataDate}"`);
        } else {
          // Scorecard is already showing a more recent or same date but maybe wrong format
          if (!/^\d{4}\s+Q[1-4]$/.test(currentScorecardDate) && parsedCurrent) {
            const canonicalScorecard = toCanonical(parsedCurrent.year, parsedCurrent.quarter);
            await metrics.updateOne(
              { metricKey: key },
              { $set: { dataDate: canonicalScorecard, lastUpdated: new Date() } }
            );
            console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard format fix: "${currentScorecardDate}" → "${canonicalScorecard}"`);
          } else {
            console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard unchanged: "${currentScorecardDate}"`);
          }
        }
      } else {
        // Just format-fix the scorecard if it's not already canonical
        if (!/^\d{4}\s+Q[1-4]$/.test(currentScorecardDate)) {
          const parsed = parseToQuarter(currentScorecardDate);
          if (parsed) {
            const canonical = toCanonical(parsed.year, parsed.quarter);
            await metrics.updateOne(
              { metricKey: key },
              { $set: { dataDate: canonical, lastUpdated: new Date() } }
            );
            console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard format fix: "${currentScorecardDate}" → "${canonical}"`);
          } else {
            console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard unparseable: "${currentScorecardDate}"`);
          }
        } else {
          console.log(`[${key}] ${beforeCount} → ${afterCount} entries (${removed > 0 ? "-" + removed : "same"}). Scorecard unchanged.`);
        }
      }
    }
  }

  // Also fix scorecards for metrics with no history but non-canonical dates
  for (const doc of allMetricDocs) {
    if (!/^\d{4}\s+Q[1-4]$/.test(String(doc.dataDate || "").trim()) && doc.dataDate !== "Placeholder") {
      const parsed = parseToQuarter(doc.dataDate);
      if (parsed) {
        const canonical = toCanonical(parsed.year, parsed.quarter);
        const histCount = await history.countDocuments({ metricKey: doc.metricKey });
        if (histCount === 0) {
          await metrics.updateOne(
            { metricKey: doc.metricKey },
            { $set: { dataDate: canonical, lastUpdated: new Date() } }
          );
          console.log(`[${doc.metricKey}] No history. Scorecard format fix: "${doc.dataDate}" → "${canonical}"`);
        }
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total entries deleted: ${totalDeleted}`);
  console.log(`Total entries inserted: ${totalConverted}`);
  console.log(`Net change: ${totalConverted - totalDeleted}`);

  // Verification pass
  console.log(`\n=== VERIFICATION ===`);
  const allHistory = await history.find({}).toArray();
  const nonCanonical = allHistory.filter((h) => !/^\d{4}\s+Q[1-4]$/.test(String(h.dataDate).trim()));
  if (nonCanonical.length === 0) {
    console.log("✓ ALL history entries are in canonical YYYY QN format");
  } else {
    console.log(`✗ ${nonCanonical.length} entries still non-canonical:`);
    const byKey = {};
    for (const h of nonCanonical) {
      if (!byKey[h.metricKey]) byKey[h.metricKey] = [];
      byKey[h.metricKey].push(h.dataDate);
    }
    for (const [k, dates] of Object.entries(byKey)) {
      console.log(`  ${k}: ${dates.join(", ")}`);
    }
  }

  const allScorecard = await metrics.find({}).toArray();
  const nonCanonicalSC = allScorecard.filter(
    (m) => !/^\d{4}\s+Q[1-4]$/.test(String(m.dataDate || "").trim()) && m.dataDate !== "Placeholder"
  );
  if (nonCanonicalSC.length === 0) {
    console.log("✓ ALL scorecards are in canonical YYYY QN format (or Placeholder)");
  } else {
    console.log(`✗ ${nonCanonicalSC.length} scorecards still non-canonical:`);
    for (const m of nonCanonicalSC) {
      console.log(`  ${m.metricKey}: "${m.dataDate}"`);
    }
  }

  // Final count
  const finalHistCount = await history.countDocuments();
  console.log(`\nFinal history count: ${finalHistCount}`);

  await client.close();
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
