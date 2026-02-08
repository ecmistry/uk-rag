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
 * Safe to call with undefined/null history.
 */
export function filterToQuarterlyOnly<T extends { dataDate: string }>(
  history: T[] | undefined | null
): T[] {
  if (!history || !Array.isArray(history)) return [];
  return history.filter((h) => isQuarterlyPeriod(h.dataDate));
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
  // Return newest period first (e.g. 2026 Q1 before 2025 Q4)
  return Array.from(byPeriod.values()).sort((a, b) =>
    String(b.dataDate).trim().localeCompare(String(a.dataDate).trim())
  );
}
