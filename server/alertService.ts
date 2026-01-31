/**
 * Alert Service for Metric Threshold Breaches
 * Sends email alerts when metrics cross RAG thresholds
 */

import { getMetrics } from "./db";
import { notifyOwner } from "./_core/notification";
import type { Metric } from "./schema";

interface AlertRule {
  metricKey: string;
  threshold: 'red' | 'amber' | 'green';
  notifyOn: 'breach' | 'recovery'; // breach = when entering threshold, recovery = when leaving
}

/**
 * Check metrics for threshold breaches and send alerts
 */
export async function checkAndSendAlerts(): Promise<void> {
  try {
    const metrics = await getMetrics();
    const alerts: Array<{ metric: Metric; message: string }> = [];

    // Define alert rules - notify when metrics go red
    const alertRules: AlertRule[] = [
      { metricKey: 'real_gdp_growth', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'cpi_inflation', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'output_per_hour', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'attainment8', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'recorded_crime_rate', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'a_e_wait_time', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'cancer_wait_time', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'ambulance_response_time', threshold: 'red', notifyOn: 'breach' },
      { metricKey: 'defence_spending_gdp', threshold: 'red', notifyOn: 'breach' },
    ];

    for (const rule of alertRules) {
      const metric = metrics.find(m => m.metricKey === rule.metricKey);
      if (!metric) continue;

      if (metric.ragStatus === rule.threshold) {
        const message = `${metric.name} (${metric.category}) is currently ${rule.threshold.toUpperCase()}. ` +
          `Current value: ${metric.value}${metric.unit} as of ${metric.dataDate}. ` +
          `This requires immediate attention.`;
        
        alerts.push({ metric, message });
      }
    }

    // Send alerts
    for (const alert of alerts) {
      try {
        await notifyOwner({
          title: `RAG Alert: ${alert.metric.name} - ${alert.metric.ragStatus.toUpperCase()}`,
          content: alert.message,
        });
        console.log(`[Alert] Sent alert for ${alert.metric.metricKey}`);
      } catch (error) {
        console.error(`[Alert] Failed to send alert for ${alert.metric.metricKey}:`, error);
      }
    }

    if (alerts.length > 0) {
      console.log(`[Alert] Sent ${alerts.length} threshold breach alerts`);
    }
  } catch (error) {
    console.error('[Alert] Error checking alerts:', error);
  }
}

/**
 * Validate data quality for metrics
 */
export async function validateDataQuality(): Promise<{
  valid: number;
  invalid: number;
  issues: string[];
}> {
  const issues: string[] = [];
  let valid = 0;
  let invalid = 0;

  try {
    const metrics = await getMetrics();

    for (const metric of metrics) {
      // Check for missing required fields
      if (!metric.metricKey || !metric.name || !metric.value) {
        issues.push(`${metric.name || 'Unknown'}: Missing required fields`);
        invalid++;
        continue;
      }

      // Check for invalid numeric values
      const numValue = parseFloat(metric.value);
      if (isNaN(numValue)) {
        issues.push(`${metric.name}: Invalid numeric value "${metric.value}"`);
        invalid++;
        continue;
      }

      // Check for invalid RAG status
      if (!['red', 'amber', 'green'].includes(metric.ragStatus)) {
        issues.push(`${metric.name}: Invalid RAG status "${metric.ragStatus}"`);
        invalid++;
        continue;
      }

      // Check for very old data (older than 2 years)
      const dataDate = metric.dataDate;
      const currentYear = new Date().getFullYear();
      const yearMatch = dataDate.match(/\d{4}/);
      if (yearMatch) {
        const dataYear = parseInt(yearMatch[0]);
        if (currentYear - dataYear > 2) {
          issues.push(`${metric.name}: Data is more than 2 years old (${dataDate})`);
        }
      }

      valid++;
    }

    return { valid, invalid, issues };
  } catch (error) {
    console.error('[Data Quality] Error validating data:', error);
    return { valid: 0, invalid: 0, issues: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown')] };
  }
}
