/**
 * Shared logic for metric detail pages that show only quarterly historical data.
 * Used so all metric pages consistently show quarterly data where available.
 */

/** Matches "2024 Q1", "2025 Q2", "Q1 2024", "Q2 2025/26", etc. */
const QUARTERLY_PATTERN = /\bQ[1-4]\b.*\d{4}|\d{4}\s+Q[1-4]\b/i;

/**
 * Returns true if the given period string (e.g. dataDate) looks like a quarterly period.
 * Used to filter history so only quarterly points are shown on metric detail pages.
 */
export function isQuarterlyPeriod(dataDate: string): boolean {
  const s = String(dataDate).trim();
  if (!s) return false;
  return QUARTERLY_PATTERN.test(s);
}

/**
 * Filter history to only rows with quarterly periods.
 * When no quarterly periods exist (e.g. annual-only metrics),
 * returns the full history so annual data is still shown.
 * Safe to call with undefined/null history.
 */
export function filterToQuarterlyOnly<T extends { dataDate: string }>(
  history: T[] | undefined | null
): T[] {
  if (!history || !Array.isArray(history)) return [];
  const quarterly = history.filter((h) => isQuarterlyPeriod(h.dataDate));
  return quarterly.length > 0 ? quarterly : history;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Convert a dataDate string into a numeric value for chronological sorting.
 * Handles: "2025 Q4", "Q1 2025", "Nov 2025", "2025 JAN", "2025", "2024/25".
 * Returns a number where larger = more recent.
 */
function dateSortKey(dataDate: string): number {
  const s = String(dataDate).trim();

  // Quarterly: "2025 Q3" or "Q3 2025"
  const qMatch = s.match(/(\d{4})\s+Q([1-4])/i) || s.match(/Q([1-4])\s+(\d{4})/i);
  if (qMatch) {
    const year = parseInt(qMatch[1].length === 4 ? qMatch[1] : qMatch[2]);
    const q = parseInt(qMatch[1].length === 4 ? qMatch[2] : qMatch[1]);
    return year * 100 + q * 3;
  }

  // Monthly: "Nov 2025", "2025 JAN", "January 2025"
  for (const [abbr, num] of Object.entries(MONTH_MAP)) {
    const re = new RegExp(`\\b${abbr}[a-z]*\\b`, "i");
    const yearRe = s.match(/\b(\d{4})\b/);
    if (re.test(s) && yearRe) {
      return parseInt(yearRe[1]) * 100 + num;
    }
  }

  // Annual: "2025" or "2024/25"
  const yearMatch = s.match(/^(\d{4})/);
  if (yearMatch) return parseInt(yearMatch[1]) * 100;

  return 0;
}

/**
 * Deduplicate history so there is at most one row per period (normalised dataDate).
 * Keeps the entry with the latest recordedAt for each period so we don't show
 * duplicate rows for the same quarter (e.g. from different ingest runs).
 */
export function deduplicateByPeriod<T extends { dataDate: string; recordedAt: Date | string }>(
  history: T[]
): T[] {
  if (!history?.length) return [];
  const byPeriod = new Map<string, T>();
  for (const h of history) {
    const period = String(h.dataDate).trim();
    const recordedAt = typeof h.recordedAt === "string" ? new Date(h.recordedAt).getTime() : h.recordedAt.getTime();
    const existing = byPeriod.get(period);
    const existingTime = existing
      ? typeof existing.recordedAt === "string"
        ? new Date(existing.recordedAt).getTime()
        : existing.recordedAt.getTime()
      : 0;
    if (!existing || recordedAt > existingTime) {
      byPeriod.set(period, h);
    }
  }
  return Array.from(byPeriod.values()).sort((a, b) =>
    dateSortKey(b.dataDate) - dateSortKey(a.dataDate)
  );
}
