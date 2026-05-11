const COMMA_FORMATTED_KEYS = new Set(["elective_backlog"]);

// Metrics whose value is a £ amount and should be rendered with the symbol
// as a prefix (so the tile reads "£1,641" rather than "1,641 £"). The
// fetcher emits unit="" for these keys so downstream renderers don't try
// to append the symbol a second time as a suffix.
const POUND_PREFIX_KEYS = new Set(["energy_prices"]);

/**
 * Consistent numeric formatting for all metric values across the dashboard.
 *
 * Rules:
 *  - 1 decimal place for all metrics (e.g. 3 -> "3.0", 0.97 -> "1.0")
 *  - elective_backlog shown as comma-formatted integers
 *  - energy_prices shown as "£1,641" (currency prefix + comma-formatted)
 */
export function formatValue(metricKey: string, rawValue: string): string {
  const num = parseFloat(rawValue);
  if (isNaN(num)) return rawValue;

  if (POUND_PREFIX_KEYS.has(metricKey)) {
    return `\u00a3${Math.round(num).toLocaleString()}`;
  }

  if (COMMA_FORMATTED_KEYS.has(metricKey)) return Math.round(num).toLocaleString();

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
