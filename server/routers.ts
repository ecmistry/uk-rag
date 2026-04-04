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
  getDashboardSections,
  setDashboardSections,
  getVisitorStats,
  aggregateDailyVisitors,
} from "./db";
import { fetchEconomyMetrics, fetchEducationMetrics, fetchCrimeMetrics, fetchHealthcareMetrics, fetchDefenceMetrics, fetchEmploymentMetrics, fetchRegionalEducationData, getPopulationBreakdown, getPublicSectorReceipts, getPublicSectorExpenditure, getDataSourceUrl, calculateRAGStatus, RAG_THRESHOLDS, type MetricData } from "./dataIngestion";
import { checkAndSendAlerts, validateDataQuality } from "./alertService";
import { cache } from "./cache";
import { diagnose as runDiagnosis, chat as runChat, type ChatMessage } from "./diagnosis";

function csvEscape(field: unknown): string {
  let s = String(field ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

const SKIP_METRIC_KEYS = new Set(["recorded_crime_rate", "charge_rate"]);

const VALIDATION_RANGES: Record<string, [number, number]> = {
  // Economy
  real_gdp_growth: [-30, 30], cpi_inflation: [-5, 30], output_per_hour: [-20, 20],
  public_sector_net_debt: [0, 300], business_investment: [-50, 50],
  // Employment
  inactivity_rate: [0, 100], real_wage_growth: [-30, 30], job_vacancy_ratio: [0, 10],
  underemployment: [0, 100], sickness_absence: [0, 100],
  // Education
  attainment8: [0, 100], neet_rate: [0, 100], pupil_attendance: [0, 100],
  apprenticeship_intensity: [0, 200],
  // Crime
  street_confidence_index: [0, 100], crown_court_backlog: [0, 500], recall_rate: [0, 100],
  asb_low_level_crime: [0, 10_000], serious_crime: [0, 10_000],
  // Healthcare
  a_e_wait_time: [0, 100], ambulance_response_time: [0, 120],
  elective_backlog: [0, 20_000_000], gp_appt_access: [0, 100],
  old_age_dependency_ratio: [0, 1000],
  // Defence
  defence_spending_gdp: [0, 20], defence_industry_vitality: [0, 200],
  sea_mass: [0, 100], land_mass: [0, 100], air_mass: [0, 100],
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

  settings: router({
    getDashboardSections: publicProcedure.query(async () => {
      return getDashboardSections();
    }),

    updateDashboardSections: adminProcedure
      .input(z.record(z.string(), z.boolean()))
      .mutation(async ({ input }) => {
        await setDashboardSections(input);
        return { success: true } as const;
      }),
  }),
  
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
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'All']).optional(),
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

    getDiagnostics: adminProcedure.query(async () => {
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

    getPublicSectorReceipts: publicProcedure.query(async () => {
      const cacheKey = "publicSectorReceipts";
      const cached = cache.get<Awaited<ReturnType<typeof getPublicSectorReceipts>>>(cacheKey);
      if (cached) return cached;
      const result = await getPublicSectorReceipts();
      cache.set(cacheKey, result, 15 * 60 * 1000);
      return result;
    }),

    getPublicSectorExpenditure: publicProcedure.query(async () => {
      const cacheKey = "publicSectorExpenditure";
      const cached = cache.get<Awaited<ReturnType<typeof getPublicSectorExpenditure>>>(cacheKey);
      if (cached) return cached;
      const result = await getPublicSectorExpenditure();
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
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'All']).optional().default('All'),
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

        const PCT_KEYS = new Set(['cpi_inflation', 'real_gdp_growth', 'output_per_hour', 'defence_spending_gdp', 'public_sector_net_debt', 'business_investment', 'a_e_wait_time']);
        const UNIT_MAP: Record<string, string> = { attainment8: 'Score', ambulance_response_time: ' minutes' };

        const historyPromises: Promise<void>[] = [];
        let newHistoryCount = 0;

        // Track only the latest period per metric for the dashboard tile.
        // History gets ALL rows, but the tile must show the most recent.
        const latestPerKey = new Map<string, {
          metricKey: string; name: string; category: string;
          value: string; unit: string; ragStatus: string;
          dataDate: string; sourceUrl: string;
        }>();

        for (const metricData of validated) {
          const ragStatus = RAG_THRESHOLDS[metricData.metric_key]
            ? calculateRAGStatus(metricData.metric_key, Number(metricData.value))
            : metricData.rag_status;

          const unit = metricData.unit
            || UNIT_MAP[metricData.metric_key]
            || (PCT_KEYS.has(metricData.metric_key) || metricData.metric_key.includes('rate') || metricData.metric_key.includes('vacancy') ? '%' : '');

          const prev = latestPerKey.get(metricData.metric_key);
          if (!prev || metricData.time_period >= prev.dataDate) {
            latestPerKey.set(metricData.metric_key, {
              metricKey: metricData.metric_key,
              name: metricData.metric_name,
              category: metricData.category,
              value: metricData.value.toString(),
              unit,
              ragStatus,
              dataDate: metricData.time_period,
              sourceUrl: metricData.source_url,
            });
          }

          if (!existingPeriods.has(`${metricData.metric_key}|${metricData.time_period}`)) {
            historyPromises.push(addMetricHistory({
              metricKey: metricData.metric_key,
              value: metricData.value.toString(),
              ragStatus,
              dataDate: metricData.time_period,
              ...(metricData.information != null && { information: metricData.information }),
            }));
            newHistoryCount++;
          }
        }

        const upsertPromises = [...latestPerKey.values()].map(entry => upsertMetric(entry));
        // Always update history for the latest period per metric so revised
        // data sources don't leave tile and history out of sync.
        const latestHistoryPromises = [...latestPerKey.values()].map(entry =>
          addMetricHistory({
            metricKey: entry.metricKey,
            value: entry.value,
            ragStatus: entry.ragStatus,
            dataDate: entry.dataDate,
          }),
        );
        await Promise.all(upsertPromises);
        await Promise.all([...historyPromises, ...latestHistoryPromises]);
        console.log(`[Metrics Refresh] ${upsertPromises.length} tiles upserted, ${newHistoryCount} new history entries`);

        try {
          await checkAndSendAlerts();
        } catch (alertError) {
          console.error('[Metrics Refresh] Failed to check alerts:', alertError);
        }

        return {
          success: true,
          count: validated.length,
          newHistory: newHistoryCount,
          errors: errors.length > 0 ? errors : undefined,
          validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
        };
      }),

    /**
     * Export metrics data as CSV
     */
    exportCsv: publicProcedure
      .input(z.object({
        category: z.enum(['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'All']).optional(),
        metricKey: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_]+$/).optional(),
      }).optional())
      .query(async ({ input }) => {
        let metrics: Awaited<ReturnType<typeof getMetrics>>;
        
        if (input?.metricKey) {
          const metric = await getMetricByKey(input.metricKey);
          if (!metric) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Metric not found' });
          }
          const history = await getMetricHistory(input.metricKey, 500);
          const csv = [
            ['Period', 'Value', 'Status', 'Recorded'].join(','),
            ...history.map(h => [
              csvEscape(h.dataDate),
              csvEscape(h.value),
              csvEscape(h.ragStatus),
              csvEscape(h.recordedAt.toISOString()),
            ].join(','))
          ].join('\n');
          const safeMetricKey = input.metricKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'metric';
          return { csv, filename: `${safeMetricKey}_history.csv` };
        } else {
          const cat = input?.category === 'All' ? undefined : input?.category;
          metrics = await getMetrics(cat);
          const safeCategory = (input?.category ?? 'all').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) || 'all';
          const csv = [
            ['Name', 'Category', 'Value', 'Unit', 'Status', 'Data Date', 'Last Updated'].join(','),
            ...metrics.map(m => [
              csvEscape(m.name),
              csvEscape(m.category),
              csvEscape(m.value),
              csvEscape(m.unit),
              csvEscape(m.ragStatus),
              csvEscape(m.dataDate),
              csvEscape(m.lastUpdated.toISOString()),
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

    serverHealth: adminProcedure.query(async () => {
      const { execSync } = await import('child_process');
      const run = (cmd: string) => execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();

      const diskRaw = run("df -h / | tail -1");
      const diskParts = diskRaw.split(/\s+/);
      const disk = { total: diskParts[1], used: diskParts[2], available: diskParts[3], percent: diskParts[4] };

      const memRaw = run("free -b | grep Mem");
      const memParts = memRaw.split(/\s+/);
      const mem = { total: Number(memParts[1]), used: Number(memParts[2]), available: Number(memParts[6]) };

      const loadRaw = run("cat /proc/loadavg");
      const loadParts = loadRaw.split(/\s+/);
      const cpuCount = Number(run("nproc"));
      const load = { avg1: loadParts[0], avg5: loadParts[1], avg15: loadParts[2], cpuCount };

      let uptimeSeconds = 0;
      try {
        const activeTs = run("systemctl show uk-rag-portal --property=ActiveEnterTimestamp").replace('ActiveEnterTimestamp=', '').trim();
        if (activeTs) {
          uptimeSeconds = Math.floor((Date.now() - new Date(activeTs).getTime()) / 1000);
        }
      } catch {
        uptimeSeconds = Number(run("cat /proc/uptime").split(" ")[0]);
      }

      const appPidLine = run("pgrep -f 'node dist/index.js' | head -1");
      let appMem = 0;
      if (appPidLine) {
        try { appMem = Number(run(`ps -o rss= -p ${appPidLine}`)) * 1024; } catch { /* */ }
      }

      let mongo = { dataSize: 0, storageSize: 0, indexSize: 0, collections: 0, documents: 0, collectionDetails: [] as { name: string; documents: number; sizeKB: number }[] };
      try {
        const mongoJson = run(`mongosh --quiet uk_rag_portal --eval '
          const s = db.stats();
          const cols = db.getCollectionNames().map(c => {
            const cs = db[c].stats();
            return { name: c, documents: db[c].countDocuments(), sizeKB: Math.round(cs.size / 1024 * 10) / 10 };
          });
          print(JSON.stringify({ dataSize: s.dataSize, storageSize: s.storageSize, indexSize: s.indexSize, collections: Number(s.collections), collectionDetails: cols }));
        '`);
        const parsed = JSON.parse(mongoJson);
        mongo = { ...parsed, documents: parsed.collectionDetails.reduce((s: number, c: { documents: number }) => s + c.documents, 0) };
      } catch { /* */ }

      const logsRaw = run("du -sb /home/ec2-user/uk-rag-portal/logs/ 2>/dev/null || echo '0'");
      const logsBytes = Number(logsRaw.split(/\s/)[0]);

      const cronLines = run("crontab -l 2>/dev/null || echo ''").split("\n").filter(l => l.trim() && !l.startsWith("#"));

      const CRON_LABELS: Record<string, string> = {
        'ensure-uk-rag-portal-up': 'Service Watchdog',
        'daily_data_refresh_cron': 'Dashboard Data Refresh',
        'public_sector_receipts_fetcher': 'Charts Data (Receipts)',
        'public_expenditure_fetcher': 'Charts Data (Expenditure)',
      };

      const CRON_SCHEDULE_LABELS: Record<string, string> = {
        '*/5 * * * *': 'Every 5 min',
        '0 6 * * *': 'Daily at 06:00',
        '30 6 * * *': 'Daily at 06:30',
        '0 7 * * *': 'Daily at 07:00',
        '30 7 * * *': 'Daily at 07:30',
        '0 8 * * *': 'Daily at 08:00',
      };

      const { statSync } = await import('fs');
      const cronJobs = cronLines.map(line => {
        const schedParts = line.match(/^([*/0-9,\-\s]{9,})\s+(.*)$/);
        const schedule = schedParts?.[1]?.trim() ?? '';
        const command = schedParts?.[2]?.trim() ?? line;
        const scheduleLabel = CRON_SCHEDULE_LABELS[schedule] ?? schedule;

        let name = 'Unknown Job';
        for (const [key, label] of Object.entries(CRON_LABELS)) {
          if (command.includes(key)) { name = label; break; }
        }

        const logMatch = command.match(/>> (.+\.log)/);
        const logFile = logMatch?.[1] ?? null;

        let lastRun: string | null = null;
        let lastStatus: 'success' | 'warning' | 'error' | 'unknown' = 'unknown';
        let lastMessage = '';

        if (logFile) {
          try {
            const tail = execSync(`tail -30 ${logFile} 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 });
            const lines = tail.split('\n').filter(Boolean);
            const stripPrefix = (l: string) => l.replace(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC \[\w+\]\s*/, '').replace(/^\[[\w]+\]\s*/, '').trim();

            const timestampLines = lines.filter(l => /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(l));
            if (timestampLines.length > 0) {
              const lastLine = timestampLines[timestampLines.length - 1];
              const tsMatch = lastLine.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
              lastRun = tsMatch?.[1] ?? null;
            } else {
              try {
                const mtime = statSync(logFile).mtime;
                lastRun = mtime.toISOString().replace('T', ' ').slice(0, 19);
              } catch { /* */ }
            }

            const tailStr = lines.slice(-15).join('\n');

            const isRealError = (line: string) => {
              if (/errors?:\s*0\b/i.test(line)) return false;
              return /\berror\b|exception|traceback|failed|✗/i.test(line);
            };

            const hasRealErrors = lines.slice(-15).some(isRealError);

            const isRealWarning = (line: string) => {
              if (/warnings?\s*:\s*0\b/i.test(line)) return false;
              return /⚠|(?<!\w)warning(?!s?\s*:\s*0)/i.test(line);
            };

            if (hasRealErrors) {
              lastStatus = 'error';
              const errLine = lines.filter(isRealError).pop();
              lastMessage = errLine ? stripPrefix(errLine) : 'Error detected';
            } else if (lines.slice(-15).some(isRealWarning)) {
              lastStatus = 'warning';
              const warnLine = lines.filter(isRealWarning).pop();
              lastMessage = warnLine ? stripPrefix(warnLine) : 'Completed with warnings';
            } else if (timestampLines.length > 0 || lines.length > 0) {
              lastStatus = 'success';
              const statusLine = lines[lines.length - 1];
              lastMessage = statusLine ? stripPrefix(statusLine) : 'Completed';
            }
          } catch { /* log file unreadable */ }
        } else {
          try {
            const scriptSnippet = command.split('/').pop()?.split(' ')[0] ?? '';
            if (scriptSnippet) {
              const journalLine = execSync(
                `journalctl -t CROND --no-pager -n 50 2>/dev/null | grep '${scriptSnippet}' | grep 'CMDEND\\|CMD ' | tail -1`,
                { encoding: 'utf-8', timeout: 3000 }
              ).trim();
              if (journalLine) {
                const tsMatch = journalLine.match(/^(\w+\s+\d+\s+\d+:\d+:\d+)/);
                if (tsMatch) {
                  const parsed = new Date(`${tsMatch[1]} ${new Date().getFullYear()}`);
                  if (!isNaN(parsed.getTime())) {
                    lastRun = parsed.toISOString().replace('T', ' ').slice(0, 19);
                  }
                }
                lastStatus = 'success';
                lastMessage = 'Health check';
              }
            }
          } catch { /* */ }
        }

        return { name, schedule: scheduleLabel, lastRun, lastStatus, lastMessage, raw: line };
      });

      const LOG_SOURCES: Record<string, string> = {
        'daily_data_refresh_cron.log': 'Daily Refresh',
        'watchdog.log': 'Watchdog',
        'public_sector_receipts.log': 'Public Sector Receipts',
        'public_expenditure.log': 'Public Expenditure',
        'crime_per_capita_cron.log': 'Crime Per-Capita',
        'apprenticeship_intensity_cron.log': 'Apprenticeship Intensity',
        'sickness_absence_cron.log': 'Sickness Absence',
      };

      type LogEntry = { timestamp: string; level: 'error' | 'warning' | 'info'; source: string; message: string };
      const recentLogs: LogEntry[] = [];
      const LOGS_DIR = '/home/ec2-user/uk-rag-portal/logs';

      for (const [file, source] of Object.entries(LOG_SOURCES)) {
        try {
          const tail = execSync(`tail -100 ${LOGS_DIR}/${file} 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 });
          for (const line of tail.split('\n').filter(Boolean)) {
            const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
            const ts = tsMatch?.[1]?.replace('T', ' ') ?? '';

            const stripped = line
              .replace(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}\+?\d*:?\d*\s*/, '')
              .replace(/^UTC\s*/, '')
              .replace(/^\[\w+\]\s*/, '')
              .trim();

            if (!stripped || /^[─═]+$/.test(stripped)) continue;
            if (!ts) continue;
            if (/^(VALIDATION )?WARNINGS?:\s*$/i.test(stripped)) continue;
            if (/^\w+:\s+\d+$/.test(stripped)) continue;

            const isError = /\berror\b|exception|traceback|failed|✗/i.test(line) && !/errors?:\s*0\b/i.test(line);
            const isWarning = /⚠|outside expected range/i.test(line);
            const isRestart = /restarting|not responding/i.test(line);

            if (isError) {
              recentLogs.push({ timestamp: ts, level: 'error', source, message: stripped });
            } else if (isWarning) {
              recentLogs.push({ timestamp: ts, level: 'warning', source, message: stripped });
            } else if (isRestart) {
              recentLogs.push({ timestamp: ts, level: 'error', source, message: stripped });
            }
          }
        } catch { /* log file unreadable */ }
      }

      try {
        const journal = execSync(
          "sudo journalctl -u uk-rag-portal --no-pager -n 100 --output=short-iso 2>/dev/null || journalctl -u uk-rag-portal --no-pager -n 100 --output=short-iso 2>/dev/null",
          { encoding: 'utf-8', timeout: 5000 }
        );
        for (const line of journal.split('\n').filter(Boolean)) {
          const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
          const ts = tsMatch?.[1]?.replace('T', ' ') ?? '';
          const msg = line.replace(/^\S+\s+\S+\s+\S+\s+/, '').trim();

          if (/crontab|LIST\b/.test(line)) continue;
          if (/\berror\b/i.test(line) && !/errors?:\s*0/i.test(line)) {
            recentLogs.push({ timestamp: ts, level: 'error', source: 'Node.js Service', message: msg });
          } else if (/Started.*uk-rag-portal/i.test(line)) {
            recentLogs.push({ timestamp: ts, level: 'info', source: 'Node.js Service', message: 'Service restarted' });
          }
        }
      } catch { /* journal unreadable */ }

      recentLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const seen = new Set<string>();
      const dedupedLogs = recentLogs.filter(entry => {
        const normMsg = entry.message.replace(/^⚠\s*(WARNING:\s*)?/i, '').slice(0, 60);
        const day = entry.timestamp.slice(0, 10);
        const key = `${day}|${entry.level}|${normMsg}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const trimmedLogs = dedupedLogs.slice(0, 50);

      return { disk, mem, load, uptimeSeconds, appMem, mongo, logsBytes, cronJobs, recentLogs: trimmedLogs };
    }),

    visitorStats: adminProcedure.query(async () => {
      const days = await getVisitorStats(30);
      const today = new Date().toISOString().slice(0, 10);

      const todayCount = days.find((d) => d.date === today)?.uniqueVisitors ?? 0;

      const cutoff7 = new Date();
      cutoff7.setDate(cutoff7.getDate() - 7);
      const cutoff7Str = cutoff7.toISOString().slice(0, 10);
      const last7 = days.filter((d) => d.date >= cutoff7Str).reduce((s, d) => s + d.uniqueVisitors, 0);

      const last30 = days.reduce((s, d) => s + d.uniqueVisitors, 0);

      return { today: todayCount, last7, last30, daily: days };
    }),

    aggregateVisitors: adminProcedure.mutation(async () => {
      const count = await aggregateDailyVisitors();
      return { success: true, daysAggregated: count };
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

  diagnosis: router({
    assess: adminProcedure
      .input(
        z.object({
          symptoms: z.string().min(3).max(2000),
          age: z.number().int().min(0).max(150),
          gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
          duration: z.string().min(1).max(200),
          medicalHistory: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return runDiagnosis(input);
      }),

    chat: adminProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            }),
          ),
          conditionContext: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const reply = await runChat(
          input.messages as ChatMessage[],
          input.conditionContext,
        );
        return { reply };
      }),
  }),
});

export type AppRouter = typeof appRouter;
