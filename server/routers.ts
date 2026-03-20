import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getMetrics,
  getMetricByKey,
  getMetricHistory,
  getMetricsDiagnostics,
  getMetricTrends,
  getExistingHistoryPeriods,
  upsertMetric,
  addMetricHistory,
} from "./db";
import { fetchEconomyMetrics, fetchEducationMetrics, fetchCrimeMetrics, fetchHealthcareMetrics, fetchDefenceMetrics, fetchEmploymentMetrics, fetchPopulationMetrics, fetchRegionalEducationData, getPopulationBreakdown, getDataSourceUrl, calculateRAGStatus, type MetricData } from "./dataIngestion";
import { checkAndSendAlerts, validateDataQuality } from "./alertService";
import { cache } from "./cache";

function csvEscape(field: unknown): string {
  const s = String(field ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

const SKIP_METRIC_KEYS = new Set(["perception_of_safety"]);

const VALIDATION_RANGES: Record<string, [number, number]> = {
  real_gdp_growth: [-30, 30], cpi_inflation: [-5, 30], output_per_hour: [-20, 20],
  public_sector_net_debt: [0, 300], business_investment: [-50, 50],
  inactivity_rate: [0, 100], real_wage_growth: [-30, 30], job_vacancy_ratio: [0, 10],
  underemployment: [0, 100], attainment8: [0, 100], persistent_absence: [0, 100],
  apprentice_starts: [0, 5_000_000], pupil_attendance: [0, 100],
  recorded_crime_rate: [0, 500], charge_rate: [0, 100], street_confidence_index: [0, 100],
  crown_court_backlog: [0, 1_000_000], reoffending_rate: [0, 100],
  a_e_wait_time: [0, 100], cancer_wait_time: [0, 365], ambulance_response_time: [0, 120],
  nhs_vacancy_rate: [0, 100], sickness_absence: [0, 100],
  defence_spending_gdp: [0, 20], equipment_plan_risk: [0, 100],
  recruitment_gap: [-100, 100], morale_index: [0, 100], defence_industry_vitality: [0, 200],
  total_population: [50_000_000, 100_000_000], net_migration: [-2_000_000, 5_000_000],
  dependency_ratio: [0, 200], urbanisation_rate: [0, 100], population_density: [0, 2000],
};

function validateMetricValue(m: MetricData): { valid: boolean; warning?: string } {
  const val = Number(m.value);
  if (isNaN(val) && String(m.value).toLowerCase() !== 'placeholder') {
    return { valid: false, warning: `${m.metric_key}: value '${m.value}' is not numeric` };
  }
  if (isNaN(val)) return { valid: true };
  const range = VALIDATION_RANGES[m.metric_key];
  if (range && (val < range[0] || val > range[1])) {
    return { valid: true, warning: `${m.metric_key}: value ${val} outside expected range [${range[0]}, ${range[1]}]` };
  }
  return { valid: true };
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  metrics: router({
    /**
     * List all metrics, optionally filtered by category
     */
    /**
     * List all metrics (always read from MongoDB; no in-memory cache for list so portal reflects DB).
     */
    list: publicProcedure
      .input(z.object({
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population', 'All']).optional(),
      }).optional())
      .query(async ({ input }) => {
        const category = input?.category;
        const categoryForDb = category === 'All' ? undefined : category;
        const cacheKey = `metrics:list:${categoryForDb ?? "all"}`;
        const cached = cache.get<Awaited<ReturnType<typeof getMetrics>>>(cacheKey);
        if (cached) return cached;
        const metrics = await getMetrics(categoryForDb);
        const sorted = metrics.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        });
        cache.set(cacheKey, sorted, 2 * 60 * 1000);
        return sorted;
      }),

    /**
     * Clear metrics cache (admin only). Call after seeding or when tiles don't update.
     */
    clearCache: adminProcedure.mutation(async () => {
      cache.clear();
      console.log("[Metrics] All caches cleared");
      return { ok: true };
    }),

    /**
     * Diagnostics: DB connection and metrics count (public, for debugging dashboard not showing cards).
     */
    getDiagnostics: publicProcedure.query(async () => {
      return getMetricsDiagnostics();
    }),

    /**
     * Population breakdown for stacked bar (Total, Working, Inactive, Unemployed, Under 16 & Over 64).
     */
    getPopulationBreakdown: publicProcedure.query(async () => {
      const cacheKey = "populationBreakdown";
      const cached = cache.get<Awaited<ReturnType<typeof getPopulationBreakdown>>>(cacheKey);
      if (cached) return cached;
      const result = await getPopulationBreakdown();
      cache.set(cacheKey, result, 15 * 60 * 1000);
      return result;
    }),

    trends: publicProcedure.query(async () => {
      return getMetricTrends();
    }),

    /**
     * Get a single metric by key with its history
     */
    getById: publicProcedure
      .input(z.object({
        metricKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_]+$/, "metricKey must be alphanumeric or underscore"),
        historyLimit: z.number().min(1).max(500).optional().default(50),
      }))
      .query(async ({ input }) => {
        const metric = await getMetricByKey(input.metricKey);
        if (!metric) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Metric not found' });
        }

        const history = await getMetricHistory(input.metricKey, input.historyLimit);

        return {
          metric,
          history,
        };
      }),

    /**
     * Refresh metrics data from ONS and DfE (admin only)
     */
    refresh: adminProcedure
      .input(z.object({
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population', 'All']).optional().default('All'),
      }))
      .mutation(async ({ input }) => {
        const results: MetricData[] = [];
        const errors: string[] = [];

        type FetchResult = { success: boolean; data?: MetricData[]; error?: string };
        const fetchers: Array<{ category: string; fn: () => Promise<FetchResult> }> = [];

        if (input.category === 'Economy' || input.category === 'All')
          fetchers.push({ category: 'Economy', fn: () => fetchEconomyMetrics(true) });
        if (input.category === 'Employment' || input.category === 'All')
          fetchers.push({ category: 'Employment', fn: () => fetchEmploymentMetrics(true) });
        if (input.category === 'Education' || input.category === 'All')
          fetchers.push({ category: 'Education', fn: () => fetchEducationMetrics() });
        if (input.category === 'Crime' || input.category === 'All')
          fetchers.push({ category: 'Crime', fn: () => fetchCrimeMetrics() });
        if (input.category === 'Healthcare' || input.category === 'All')
          fetchers.push({ category: 'Healthcare', fn: () => fetchHealthcareMetrics(true) });
        if (input.category === 'Defence' || input.category === 'All')
          fetchers.push({ category: 'Defence', fn: () => fetchDefenceMetrics() });
        if (input.category === 'Population' || input.category === 'All')
          fetchers.push({ category: 'Population', fn: () => fetchPopulationMetrics() });

        const fetchResults = await Promise.allSettled(fetchers.map(f => f.fn()));

        for (let i = 0; i < fetchResults.length; i++) {
          const r = fetchResults[i];
          if (r.status === 'fulfilled' && r.value.success && r.value.data) {
            results.push(...r.value.data);
          } else {
            const errMsg = r.status === 'rejected'
              ? String(r.reason)
              : (r.value.error || 'Unknown error');
            errors.push(`${fetchers[i].category}: ${errMsg}`);
          }
        }

        if (results.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errors.join('; ') || 'Failed to fetch any metrics',
          });
        }

        // Filter superseded metrics and validate values
        const validated: MetricData[] = [];
        const validationWarnings: string[] = [];
        for (const m of results) {
          if (SKIP_METRIC_KEYS.has(m.metric_key)) continue;
          const check = validateMetricValue(m);
          if (!check.valid) {
            console.warn(`[Metrics Refresh] Rejected: ${check.warning}`);
            continue;
          }
          if (check.warning) {
            console.warn(`[Metrics Refresh] Warning: ${check.warning}`);
            validationWarnings.push(check.warning);
          }
          validated.push(m);
        }

        // Batch-check which history periods already exist (avoids N+1 queries)
        const existingPeriods = await getExistingHistoryPeriods(
          validated.map(m => ({ metricKey: m.metric_key, dataDate: m.time_period }))
        );

        for (const metricData of validated) {
          const ragStatus =
            metricData.metric_key === 'inactivity_rate'
              ? calculateRAGStatus('inactivity_rate', Number(metricData.value))
              : metricData.metric_key === 'real_wage_growth'
                ? calculateRAGStatus('real_wage_growth', Number(metricData.value))
                : metricData.metric_key === 'job_vacancy_ratio'
                  ? calculateRAGStatus('job_vacancy_ratio', Number(metricData.value))
                  : metricData.metric_key === 'underemployment'
                    ? calculateRAGStatus('underemployment', Number(metricData.value))
                    : metricData.rag_status;

          const unit = metricData.unit || (
            metricData.metric_key === 'cpi_inflation' || metricData.metric_key === 'real_gdp_growth' || metricData.metric_key.includes('rate') || metricData.metric_key.includes('vacancy') || metricData.metric_key === 'defence_spending_gdp' || metricData.metric_key === 'public_sector_net_debt' || metricData.metric_key === 'business_investment' || metricData.metric_key === 'persistent_absence' ? '%' :
            metricData.metric_key === 'output_per_hour' ? '%' :
            metricData.metric_key === 'attainment8' ? 'Score' :
            metricData.metric_key === 'apprentice_starts' ? '' :
            metricData.metric_key === 'a_e_wait_time' ? '%' :
            metricData.metric_key === 'cancer_wait_time' ? ' days' :
            metricData.metric_key === 'ambulance_response_time' ? ' minutes' : ''
          );

          await upsertMetric({
            metricKey: metricData.metric_key,
            name: metricData.metric_name,
            category: metricData.category,
            value: metricData.value.toString(),
            unit: unit,
            ragStatus,
            dataDate: metricData.time_period,
            sourceUrl: metricData.source_url,
          });

          if (!existingPeriods.has(`${metricData.metric_key}|${metricData.time_period}`)) {
            await addMetricHistory({
              metricKey: metricData.metric_key,
              value: metricData.value.toString(),
              ragStatus,
              dataDate: metricData.time_period,
              ...(metricData.information != null && { information: metricData.information }),
            });
            console.log(`  ✓ Added history: ${metricData.metric_name} - ${metricData.time_period}`);
          }
        }

        // Check for threshold breaches and send alerts
        try {
          await checkAndSendAlerts();
        } catch (alertError) {
          console.error('[Metrics Refresh] Failed to check alerts:', alertError);
        }

        return {
          success: true,
          count: validated.length,
          metrics: validated,
          errors: errors.length > 0 ? errors : undefined,
          validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
        };
      }),

    /**
     * Export metrics data as CSV
     */
    exportCsv: publicProcedure
      .input(z.object({
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population', 'All']).optional(),
        metricKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_]+$/).optional(),
      }).optional())
      .query(async ({ input }) => {
        let metrics: Awaited<ReturnType<typeof getMetrics>>;
        
        if (input?.metricKey) {
          const metric = await getMetricByKey(input.metricKey);
          if (!metric) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Metric not found' });
          }
          const history = await getMetricHistory(input.metricKey, 1000);
          // Return CSV format
          const csv = [
            ['Period', 'Value', 'Status', 'Recorded'].join(','),
            ...history.map(h => [
              h.dataDate,
              h.value,
              h.ragStatus,
              h.recordedAt.toISOString()
            ].join(','))
          ].join('\n');
          const safeMetricKey = input.metricKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'metric';
          return { csv, filename: `${safeMetricKey}_history.csv` };
        } else {
          metrics = await getMetrics(input?.category);
          const safeCategory = (input?.category ?? 'all').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'all';
          const csv = [
            ['Name', 'Category', 'Value', 'Unit', 'Status', 'Data Date', 'Last Updated'].join(','),
            ...metrics.map(m => [
              `"${m.name}"`,
              m.category,
              m.value,
              m.unit,
              m.ragStatus,
              m.dataDate,
              m.lastUpdated.toISOString()
            ].join(','))
          ].join('\n');
          return { csv, filename: `metrics_${safeCategory}.csv` };
        }
      }),

    /**
     * Check data quality (admin only)
     */
    checkDataQuality: adminProcedure.query(async () => {
      return validateDataQuality();
    }),

    /**
     * Manually trigger alert check (admin only)
     */
    checkAlerts: adminProcedure.mutation(async () => {
      await checkAndSendAlerts();
      return { success: true, message: 'Alert check completed' };
    }),

    /**
     * Get API documentation
     */
    apiDocs: publicProcedure.query(async () => {
      return {
        version: '1.0.0',
        endpoints: {
          'metrics.list': {
            method: 'GET',
            description: 'List all metrics, optionally filtered by category',
            parameters: {
              category: 'string (optional) - Filter by category (Economy, Employment, Education, Crime, Healthcare, Defence)'
            },
            example: '/api/trpc/metrics.list?input={"category":"Economy"}'
          },
          'metrics.getById': {
            method: 'GET',
            description: 'Get a single metric by key with its history',
            parameters: {
              metricKey: 'string (required) - The metric key identifier',
              historyLimit: 'number (optional, default: 50) - Maximum number of history points'
            },
            example: '/api/trpc/metrics.getById?input={"metricKey":"real_gdp_growth","historyLimit":20}'
          },
          'metrics.exportCsv': {
            method: 'GET',
            description: 'Export metrics data as CSV',
            parameters: {
              category: 'string (optional) - Filter by category',
              metricKey: 'string (optional) - Export history for specific metric'
            },
            example: '/api/trpc/metrics.exportCsv?input={"category":"Economy"}'
          },
          'metrics.getRegionalEducationData': {
            method: 'GET',
            description: 'Get regional education data for visualization',
            example: '/api/trpc/metrics.getRegionalEducationData'
          }
        }
      };
    }),

    /**
     * Get regional education data for visualization (public)
     */
    getRegionalEducationData: publicProcedure
      .query(async () => {
        const cacheKey = "regionalEducationData";
        const cached = cache.get<Awaited<ReturnType<typeof fetchRegionalEducationData>>["data"]>(cacheKey);
        if (cached) return cached;
        const result = await fetchRegionalEducationData();
        if (!result.success || !result.data) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to fetch regional education data',
          });
        }
        cache.set(cacheKey, result.data, 15 * 60 * 1000);
        return result.data;
      }),
  }),
});

export type AppRouter = typeof appRouter;
