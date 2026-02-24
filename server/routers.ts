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
  upsertMetric,
  addMetricHistory,
} from "./db";
import { fetchEconomyMetrics, fetchEducationMetrics, fetchCrimeMetrics, fetchHealthcareMetrics, fetchDefenceMetrics, fetchEmploymentMetrics, fetchPopulationMetrics, fetchRegionalEducationData, getPopulationBreakdown, getDataSourceUrl, calculateRAGStatus, type MetricData } from "./dataIngestion";
import { checkAndSendAlerts, validateDataQuality } from "./alertService";

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
        const metrics = await getMetrics(categoryForDb);
        // Sort by category and name for consistent ordering
        return metrics.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        });
      }),

    /**
     * Clear metrics cache (admin only). Call after seeding or when tiles don't update.
     */
    clearCache: adminProcedure.mutation(async () => {
      const { cache } = await import("./cache");
      const categories = ["all", "Economy", "Employment", "Education", "Crime", "Healthcare", "Defence", "Population"];
      for (const c of categories) {
        cache.delete(`metrics:${c}`);
      }
      console.log("[Metrics] Cache cleared for all categories");
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
      return getPopulationBreakdown();
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

        // Fetch Economy metrics if requested (5 metrics: Output per Hour, Real GDP Growth, CPI Inflation, Public Sector Net Debt, Business Investment)
        if (input.category === 'Economy' || input.category === 'All') {
          const economyResult = await fetchEconomyMetrics(true);
          if (economyResult.success && economyResult.data) {
            results.push(...economyResult.data);
          } else {
            errors.push(`Economy: ${economyResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Employment metrics if requested (Employment Rate 16+, Employment Rate 16-64)
        if (input.category === 'Employment' || input.category === 'All') {
          const employmentResult = await fetchEmploymentMetrics(true);
          if (employmentResult.success && employmentResult.data) {
            results.push(...employmentResult.data);
          } else {
            errors.push(`Employment: ${employmentResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Education metrics if requested
        if (input.category === 'Education' || input.category === 'All') {
          const educationResult = await fetchEducationMetrics();
          if (educationResult.success && educationResult.data) {
            results.push(...educationResult.data);
          } else {
            errors.push(`Education: ${educationResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Crime metrics if requested
        if (input.category === 'Crime' || input.category === 'All') {
          const crimeResult = await fetchCrimeMetrics();
          if (crimeResult.success && crimeResult.data) {
            results.push(...crimeResult.data);
          } else {
            errors.push(`Crime: ${crimeResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Healthcare metrics if requested (with historical data for A&E)
        if (input.category === 'Healthcare' || input.category === 'All') {
          const healthcareResult = await fetchHealthcareMetrics(true); // Historical mode
          if (healthcareResult.success && healthcareResult.data) {
            results.push(...healthcareResult.data);
          } else {
            errors.push(`Healthcare: ${healthcareResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Defence metrics if requested
        if (input.category === 'Defence' || input.category === 'All') {
          const defenceResult = await fetchDefenceMetrics();
          if (defenceResult.success && defenceResult.data) {
            results.push(...defenceResult.data);
          } else {
            errors.push(`Defence: ${defenceResult.error || 'Unknown error'}`);
          }
        }

        // Fetch Population metrics if requested (Phase 4)
        if (input.category === 'Population' || input.category === 'All') {
          const populationResult = await fetchPopulationMetrics();
          if (populationResult.success && populationResult.data) {
            results.push(...populationResult.data);
          } else {
            errors.push(`Population: ${populationResult.error || 'Unknown error'}`);
          }
        }

        if (results.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errors.join('; ') || 'Failed to fetch any metrics',
          });
        }

        // Update metrics in database
        for (const metricData of results) {
          // Recompute RAG for metrics that use server-side thresholds
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

          // Determine unit based on metric key
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

          // Add to history (only if this time period doesn't already exist)
          // Check if history entry already exists for this time period (limit 500 matches getMetricHistory cap)
          const existingHistory = await getMetricHistory(metricData.metric_key, 500);
          const periodExists = existingHistory.some(h => h.dataDate === metricData.time_period);
          
          if (!periodExists) {
            await addMetricHistory({
              metricKey: metricData.metric_key,
              value: metricData.value.toString(),
              ragStatus,
              dataDate: metricData.time_period,
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
          count: results.length,
          metrics: results,
          errors: errors.length > 0 ? errors : undefined,
        };
      }),

    /**
     * Export metrics data as CSV
     */
    exportCsv: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        metricKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_]+$/).optional(),
      }).optional())
      .query(async ({ input }) => {
        let metrics: any[];
        
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
        const result = await fetchRegionalEducationData();
        
        if (!result.success || !result.data) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'Failed to fetch regional education data',
          });
        }
        
        return result.data;
      }),
  }),
});

export type AppRouter = typeof appRouter;
