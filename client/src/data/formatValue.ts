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
