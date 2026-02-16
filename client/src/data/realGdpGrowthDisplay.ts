/**
 * Display helpers for Real GDP Growth when using quarterly YoY data.
 * Tile shows: most recent quarter vs same quarter previous year.
 * History: each point is that quarter vs same quarter previous year.
 */

/** Matches "2025 Q2", "1956 Q1" etc. */
const QUARTERLY_LABEL = /^(\d{4})\s+Q([1-4])$/i;

/**
 * Returns a period label for the tile: e.g. "2025 Q4" -> "2025 Q4 vs 2024 Q4".
 * For non-quarterly dataDate returns undefined (caller can fall back to dataDate as-is).
 */
export function getRealGdpGrowthPeriodLabel(dataDate: string): string | undefined {
  const s = String(dataDate).trim();
  const m = s.match(QUARTERLY_LABEL);
  if (!m) return undefined;
  const year = parseInt(m[1], 10);
  const q = m[2];
  return `${year} Q${q} vs ${year - 1} Q${q}`;
}

/** Description shown above the historical data table/chart on the metric detail page. */
export const REAL_GDP_GROWTH_HISTORY_DESCRIPTION =
  "Each value is year-on-year growth: that quarter compared with the same quarter in the previous year.";
