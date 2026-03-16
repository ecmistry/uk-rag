import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useMemo, useState } from 'react';
import { cn } from "@/lib/utils";
import type { Metric } from '@shared/types';
import { getEconomyTooltip, getEmploymentTooltip, getEducationTooltip, getCrimeTooltip, getHealthcareTooltip, getDefenceTooltip, getPopulationTooltip } from "@/data/metricTooltips";
import { EXPECTED_METRICS } from "@/data/expectedMetrics";
import PopulationBreakdownChart from "@/components/PopulationBreakdownChart";
import TrendIndicator from "@/components/TrendIndicator";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [metricInfoOpen, setMetricInfoOpen] = useState<{ title: string; content: string } | null>(null);

  // Fetch all metrics (no category filter to get all categories)
  // Cache for 5 minutes - data is relatively static
  // Use placeholderData for instant initial render
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.metrics.list.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      placeholderData: (previousData) => previousData, // Use cached data immediately
      refetchOnWindowFocus: true, // Refetch when returning to tab after e.g. Data Refresh
      refetchOnMount: true, // Refetch when navigating back to dashboard so post-refresh data appears
    }
  );

  // Fetch trend data (previous values for each metric)
  const { data: trends } = trpc.metrics.trends.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  // Refresh mutation (used by empty-state "Fetch X Data" buttons)
  const refreshMutation = trpc.metrics.refresh.useMutation({
    onSuccess: () => {
      toast.success('Metrics refreshed successfully');
      refetchMetrics();
    },
    onError: (error) => {
      toast.error(`Failed to refresh metrics: ${error.message}`);
    },
  });

  // Group metrics by category and by (category, metricKey) for slot lookup
  const { metricsByCategory, metricsByKeyByCategory } = useMemo(() => {
    const byCategory: Record<string, Metric[]> = {};
    const byKeyByCategory: Record<string, Record<string, Metric>> = {};
    if (metrics) {
      for (const metric of metrics) {
        if (!byCategory[metric.category]) byCategory[metric.category] = [];
        byCategory[metric.category].push(metric);
        if (!byKeyByCategory[metric.category]) byKeyByCategory[metric.category] = {};
        byKeyByCategory[metric.category][metric.metricKey] = metric;
      }
    }
    return { metricsByCategory: byCategory, metricsByKeyByCategory: byKeyByCategory };
  }, [metrics]);

  /** Format metric/slot name with line breaks for card title (e.g. "Natural Change\n(Births vs Deaths)"). */
  const formatCardTitle = (name: string) => {
    let out = name;
    if (out.includes(" (Year on Year)")) out = out.replace(" (Year on Year)", "\n(Year on Year)");
    if (out.includes(" (16-64)")) out = out.replace(" (16-64)", "\n(16-64)");
    if (out.includes(" (16-24)")) out = out.replace(" (16-24)", "\n(16-24)");
    if (out.includes(" (% of GDP)")) out = out.replace(" (% of GDP)", "\n(% of GDP)");
    if (out.includes(" (Cat 2)")) out = out.replace(" (Cat 2)", "\n(Cat 2)");
    if (out.includes(" (Births vs Deaths)")) out = out.replace(" (Births vs Deaths)", "\n(Births vs Deaths)");
    if (out.includes(" (Long-term)")) out = out.replace(" (Long-term)", "\n(Long-term)");
    return out;
  };

  /** RAG card styling per UNIFORM_SCORECARD_PATTERN: bolder bg/border + value colour */
  const getRAGCardClasses = (status: string) => {
    switch (status) {
      case 'green':
        return {
          card: 'bg-green-100 border-green-400 dark:bg-green-950/60 dark:border-green-700',
          value: 'text-green-800 dark:text-green-300 font-semibold',
        };
      case 'amber':
        return {
          card: 'bg-amber-100 border-amber-400 dark:bg-amber-950/60 dark:border-amber-700',
          value: 'text-amber-800 dark:text-amber-300 font-semibold',
        };
      case 'red':
        return {
          card: 'bg-red-100 border-red-400 dark:bg-red-950/60 dark:border-red-700',
          value: 'text-red-800 dark:text-red-300 font-semibold',
        };
      default:
        return {
          card: 'bg-muted/50 border-border',
          value: 'text-foreground',
        };
    }
  };

  return (
    <div className="w-full">
      <div>
        {/* Metrics by category – RAG-of-RAGs style: section label + dense grid of small scorecards */}
        {['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population'].map((category, index) => {
          const categoryMetrics = metricsByCategory[category] || [];
          const metricsByKey = metricsByKeyByCategory[category] ?? {};
          const expectedSlots = EXPECTED_METRICS[category] ?? [];
          const categoryDescriptions: Record<string, string> = {
            'Economy': 'Output per Hour, Real GDP Growth, CPI Inflation, Public Sector Net Debt, Business Investment',
            'Employment': 'Inactivity Rate, Real Wage Growth, Job Vacancy Ratio, Underemployment, Sickness Absence',
            'Education': 'Attainment 8 Score, NEET Rate (16-24), Unauthorised Pupil Absence, Apprenticeship Intensity',
            'Crime': 'Total Recorded Crime, Charge Rate %, Perception of Safety, Crown Court Backlog, Reoffending Rate',
            'Healthcare': 'A&E 4-Hour Wait %, Elective Backlog, Ambulance (Cat 2), GP Appt. Access, Staff Vacancy Rate',
            'Defence': 'Sea Mass, Land Mass, Air Mass, Defence Industry Vitality, Spend as % of GDP',
            'Population': 'Natural Change (Births vs Deaths), Old-Age Dependency Ratio, Net Migration (Long-term), Healthy Life Expectancy',
          };
          const shouldDefer = index >= 2 && metricsLoading;
          const dataCount = expectedSlots.filter((s) => metricsByKey[s.metricKey]).length;
          const hasNoData = dataCount === 0;
          const hasPartialData = dataCount > 0 && dataCount < expectedSlots.length;
          // Latest refresh time for this category (most recent lastUpdated among metrics)
          const lastRefreshedAt = categoryMetrics.length > 0
            ? categoryMetrics.reduce<Date | null>((latest, m) => {
                const t = m.lastUpdated ? new Date(m.lastUpdated) : null;
                if (!t) return latest;
                return !latest || t > latest ? t : latest;
              }, null)
            : null;

          return (
            <section key={category} className="mb-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">{category}</h2>
                {!metricsLoading && lastRefreshedAt != null && (
                  <>
                    <span
                      className="text-muted-foreground text-xs font-normal"
                      title={lastRefreshedAt.toLocaleString()}
                    >
                      Last refreshed {formatDistanceToNow(lastRefreshedAt, { addSuffix: true })}
                    </span>
                    <Link
                      href="/data-refresh"
                      className="text-xs text-primary hover:underline"
                    >
                      Refresh data
                    </Link>
                  </>
                )}
                {!metricsLoading && hasNoData && (
                  <Badge variant="secondary" className="text-[10px] font-normal gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No data — refresh to load
                  </Badge>
                )}
                {!metricsLoading && hasPartialData && (
                  <Badge variant="outline" className="text-[10px] font-normal gap-1 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                    <Info className="h-3 w-3" />
                    {dataCount} of {expectedSlots.length} metrics have data
                  </Badge>
                )}
                {!metricsLoading && (hasNoData || hasPartialData) && isAdmin && ['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population'].includes(category) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px]"
                    onClick={() => refreshMutation.mutate({ category: category as 'Economy' | 'Employment' | 'Education' | 'Crime' | 'Healthcare' | 'Defence' | 'Population' })}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className={cn('h-3 w-3 mr-1', refreshMutation.isPending && 'animate-spin')} />
                    Fetch {category} Data
                  </Button>
                )}
                <p className="text-muted-foreground text-[11px] mt-0.5 leading-tight w-full basis-full">{categoryDescriptions[category]}</p>
              </div>

              {shouldDefer ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 grid-auto-rows-[4.25rem]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="animate-pulse gap-0 py-0">
                      <CardHeader className="py-0.5 px-1.5">
                        <div className="h-2.5 bg-muted rounded w-full mx-auto max-w-[80%]" />
                      </CardHeader>
                      <CardContent className="p-1 pt-0 px-1.5">
                        <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : metricsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 grid-auto-rows-[4.25rem]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="animate-pulse gap-0 py-0">
                      <CardHeader className="py-0.5 px-1.5">
                        <div className="h-2.5 bg-muted rounded w-full mx-auto max-w-[80%]" />
                      </CardHeader>
                      <CardContent className="p-1 pt-0 px-1.5">
                        <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 grid-auto-rows-[4.25rem]">
                  {expectedSlots.map((slot) => {
                    const metric = metricsByKey[slot.metricKey];
                    const slotTooltip = category === 'Economy' ? getEconomyTooltip(slot.metricKey) : category === 'Employment' ? getEmploymentTooltip(slot.metricKey) : category === 'Education' ? getEducationTooltip(slot.metricKey) : category === 'Crime' ? getCrimeTooltip(slot.metricKey) : category === 'Healthcare' ? getHealthcareTooltip(slot.metricKey) : category === 'Defence' ? getDefenceTooltip(slot.metricKey) : category === 'Population' ? getPopulationTooltip(slot.metricKey) : undefined;
                    if (!metric) {
                      return (
                        <Card key={slot.metricKey} className="gap-0 py-0 h-full min-h-[4.25rem] flex flex-col border bg-muted/30 border-muted-foreground/20 relative">
                          <CardHeader className="py-0.5 px-1.5 text-center min-h-[1.75rem] flex flex-col justify-center items-center">
                            <CardTitle className="text-[11px] font-medium text-center line-clamp-2 leading-tight w-full text-muted-foreground whitespace-pre-line" title={slot.name}>
                              {formatCardTitle(slot.name)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0.5 px-1.5 pt-0 text-center flex-1 flex flex-col justify-center items-center min-h-[2rem]">
                            <div className="text-sm font-medium text-muted-foreground">No data available</div>
                          </CardContent>
                          {slotTooltip && (
                            <button
                              type="button"
                              className="absolute bottom-0.5 left-0.5 z-20 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground/60"
                              aria-label="Why this metric matters"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMetricInfoOpen({
                                  title: formatCardTitle(slot.name),
                                  content: slotTooltip,
                                });
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          )}
                        </Card>
                      );
                    }
                    const rag = getRAGCardClasses(metric.ragStatus);
                    // Prefer slot tooltip so each tile shows the correct text (e.g. Defence Industry Vitality tile always shows its tooltip)
                    const cardTooltip = slotTooltip ?? (category === 'Economy' ? getEconomyTooltip(metric.metricKey) : category === 'Employment' ? getEmploymentTooltip(metric.metricKey) : category === 'Education' ? getEducationTooltip(metric.metricKey) : category === 'Crime' ? getCrimeTooltip(metric.metricKey) : category === 'Healthcare' ? getHealthcareTooltip(metric.metricKey) : category === 'Defence' ? getDefenceTooltip(metric.metricKey) : category === 'Population' ? getPopulationTooltip(metric.metricKey) : undefined);
                    const hasValue = metric.value != null && !Number.isNaN(parseFloat(String(metric.value)));
                    return (
                      <div key={metric.metricKey} className="h-full min-h-[4.25rem] relative">
                        <Link href={`/metric/${metric.metricKey}`} className="block h-full min-h-[4.25rem]">
                          <Card
                            className={cn(
                              'gap-0 py-0 hover:shadow-md transition-shadow cursor-pointer h-full min-h-[4.25rem] flex flex-col border',
                              rag.card
                            )}
                          >
                            <CardHeader className="py-0.5 px-1.5 text-center min-h-[1.75rem] flex flex-col justify-center items-center">
                              <CardTitle
                                className="text-[11px] font-medium text-center line-clamp-2 leading-tight w-full whitespace-pre-line"
                                title={metric.name}
                              >
                                {formatCardTitle(metric.name ?? slot.name)}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-0.5 px-1.5 pt-0 text-center flex-1 flex flex-col justify-center items-center min-h-[2rem]">
                              <div className={cn('text-sm font-bold text-center w-full leading-tight flex items-center justify-center gap-0.5', rag.value)}>
                                <span>
                                  {!hasValue
                                    ? "—"
                                    : metric.metricKey === "attainment8"
                                      ? parseFloat(metric.value).toFixed(1)
                                      : metric.metricKey === "apprenticeship_intensity"
                                        ? parseFloat(metric.value) >= 1000
                                          ? `${parseInt(metric.value, 10).toLocaleString()}${metric.unit ? ` ${metric.unit}` : ""}`
                                          : `${parseFloat(metric.value).toFixed(1)}${metric.unit ? metric.unit : ""}`
                                        : metric.metricKey === "total_population" && parseFloat(metric.value) >= 1e6
                                          ? `${(parseFloat(metric.value) / 1e6).toFixed(1)}m`
                                          : `${parseFloat(metric.value).toFixed(1)}${metric.unit}`}
                                </span>
                                {hasValue && trends && (
                                  <TrendIndicator
                                    metricKey={metric.metricKey}
                                    currentValue={parseFloat(metric.value)}
                                    previousValue={trends[metric.metricKey]?.previous != null ? parseFloat(trends[metric.metricKey].previous!) : null}
                                  />
                                )}
                              </div>
                              {!hasValue && (
                                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">No data</div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                        {cardTooltip && (
                          <button
                            type="button"
                            className="absolute bottom-0.5 left-0.5 z-20 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground/60"
                            aria-label="Why this metric matters"
                            onClick={() => {
                              setMetricInfoOpen({
                                title: formatCardTitle(metric.name ?? slot.name),
                                content: cardTooltip,
                              });
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Population breakdown stacked bar (below Population tiles) */}
      <div className="container px-4 py-6">
        <PopulationBreakdownChart />
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Data sourced from Office for National Statistics (ONS), Resolution Foundation, DfE, NHS England, and MOD</p>
          <p className="mt-1">Updated regularly to provide accurate insights</p>
        </div>
      </footer>

      {/* Metric info dialog: click-on click-off, white bg, black text */}
      <Dialog open={!!metricInfoOpen} onOpenChange={(open) => !open && setMetricInfoOpen(null)}>
        <DialogContent className="bg-white text-black border border-gray-200 shadow-xl max-w-[min(480px,92vw)] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 border-b border-gray-200">
            <DialogTitle className="text-base font-bold text-black leading-tight pr-8">
              {metricInfoOpen?.title}
            </DialogTitle>
          </div>
          <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 text-sm text-black whitespace-pre-line">
            {metricInfoOpen?.content ?? ''}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
