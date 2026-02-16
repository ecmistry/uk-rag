/**
 * Metric-specific copy for tiles (period subtitle) and detail page (history description).
 * Used so the UI can show e.g. "2025 Q4 vs 2024 Q4" for Real GDP Growth and explain the calculation.
 */

import {
  getRealGdpGrowthPeriodLabel,
  REAL_GDP_GROWTH_HISTORY_DESCRIPTION,
} from "./realGdpGrowthDisplay";

/**
 * Returns a short period label for the metric tile (e.g. "2025 Q4 vs 2024 Q4" for Real GDP Growth).
 * Return undefined to use the raw dataDate from the API.
 */
export function getMetricTileSubtitle(
  metricKey: string,
  dataDate: string
): string | undefined {
  if (metricKey === "real_gdp_growth") {
    return getRealGdpGrowthPeriodLabel(dataDate) ?? undefined;
  }
  return undefined;
}

/**
 * Returns a sentence describing how the historical values are calculated (shown on metric detail page).
 * Return undefined for no extra description.
 */
export function getMetricHistoryDescription(metricKey: string): string | undefined {
  if (metricKey === "real_gdp_growth") {
    return REAL_GDP_GROWTH_HISTORY_DESCRIPTION;
  }
  return undefined;
}
