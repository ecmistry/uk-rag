const COMMA_FORMATTED_KEYS = new Set(["elective_backlog", "crown_court_backlog"]);

/**
 * Consistent numeric formatting for all metric values across the dashboard.
 *
 * Rules:
 *  - 1 decimal place for all metrics (e.g. 3 -> "3.0", 0.97 -> "1.0")
 *  - total_population >= 1M shown as e.g. "67.1m"
 *  - elective_backlog / crown_court_backlog shown as comma-formatted integers
 */
export function formatValue(metricKey: string, rawValue: string): string {
  const num = parseFloat(rawValue);
  if (isNaN(num)) return rawValue;

  if (COMMA_FORMATTED_KEYS.has(metricKey)) return Math.round(num).toLocaleString();

  if (metricKey === "total_population" && num >= 1e6)
    return `${(num / 1e6).toFixed(1)}m`;

  return num.toFixed(1);
}

/**
 * Format a dataDate period string for display.
 * Converts compact academic-year codes like "202425" to "2024/25",
 * and "201718" to "2017/18". Leaves other formats unchanged.
 */
export function formatPeriod(dataDate: string): string {
  const s = String(dataDate).trim();
  // 6-digit academic year: "202425" -> "2024/25"
  if (/^\d{6}$/.test(s)) {
    return `${s.slice(0, 4)}/${s.slice(4)}`;
  }
  return s;
}
