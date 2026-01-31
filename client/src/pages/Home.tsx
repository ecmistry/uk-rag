import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { RefreshCw, ExternalLink, AlertCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';
import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import type { Metric } from '@shared/types';
import { getEconomyTooltip, getEmploymentTooltip, getEducationTooltip, getCrimeTooltip, getHealthcareTooltip, getDefenceTooltip, getPopulationTooltip } from "@/data/metricTooltips";
import { EXPECTED_METRICS } from "@/data/expectedMetrics";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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

  // Fetch published commentaries
  // Cache for 10 minutes - commentaries don't change frequently
  // Defer loading - not critical for initial render
  const { data: commentaries } = trpc.commentary.listPublished.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !metricsLoading, // Only fetch after metrics are loaded
  });
  const latestCommentary = commentaries?.[0];

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

  /** RAG card styling per UNIFORM_SCORECARD_PATTERN: pale bg/border + value colour */
  const getRAGCardClasses = (status: string) => {
    switch (status) {
      case 'green':
        return {
          card: 'bg-green-50 border-green-300 dark:bg-green-950/40 dark:border-green-800',
          value: 'text-green-700 dark:text-green-400',
        };
      case 'amber':
        return {
          card: 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
          value: 'text-amber-700 dark:text-amber-400',
        };
      case 'red':
        return {
          card: 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800',
          value: 'text-red-700 dark:text-red-400',
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
            'Education': 'Attainment 8 Score, Teacher Vacancies, NEET Rate (16-24), Persistent Absence, Apprentice Starts',
            'Crime': 'Total Recorded Crime, Charge Rate %, Perception of Safety, Crown Court Backlog, Reoffending Rate',
            'Healthcare': 'A&E 4-Hour Wait %, Elective Backlog, Ambulance (Cat 2), GP Appt. Access, Staff Vacancy Rate',
            'Defence': 'Spend as % of GDP, Trained Strength, Equipment Spend, Deployability %, Force Readiness',
            'Population': 'Natural Change (Births vs Deaths), Old-Age Dependency Ratio, Net Migration (Long-term), Healthy Life Expectancy, Total Population',
          };
          const shouldDefer = index >= 2 && metricsLoading;
          const dataCount = expectedSlots.filter((s) => metricsByKey[s.metricKey]).length;
          const hasNoData = dataCount === 0;
          const hasPartialData = dataCount > 0 && dataCount < expectedSlots.length;

          return (
            <section key={category} className="mb-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">{category}</h2>
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
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 grid-auto-rows-[4.25rem]">
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
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 grid-auto-rows-[4.25rem]">
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
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 grid-auto-rows-[4.25rem]">
                  {expectedSlots.map((slot) => {
                    const metric = metricsByKey[slot.metricKey];
                    if (!metric) {
                      return (
                        <Card key={slot.metricKey} className="gap-0 py-0 h-full min-h-[4.25rem] flex flex-col border bg-muted/30 border-muted-foreground/20">
                          <CardHeader className="py-0.5 px-1.5 text-center min-h-[1.75rem] flex flex-col justify-center items-center">
                            <CardTitle className="text-[11px] font-medium text-center line-clamp-2 leading-tight w-full text-muted-foreground whitespace-pre-line" title={slot.name}>
                              {formatCardTitle(slot.name)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0.5 px-1.5 pt-0 text-center flex-1 flex flex-col justify-center items-center min-h-[2rem]">
                            <div className="text-sm font-medium text-muted-foreground">No data available</div>
                          </CardContent>
                        </Card>
                      );
                    }
                    const rag = getRAGCardClasses(metric.ragStatus);
                    const cardTooltip = category === 'Economy' ? getEconomyTooltip(metric.metricKey) : category === 'Employment' ? getEmploymentTooltip(metric.metricKey) : category === 'Education' ? getEducationTooltip(metric.metricKey) : category === 'Crime' ? getCrimeTooltip(metric.metricKey) : category === 'Healthcare' ? getHealthcareTooltip(metric.metricKey) : category === 'Defence' ? getDefenceTooltip(metric.metricKey) : category === 'Population' ? getPopulationTooltip(metric.metricKey) : undefined;
                    const hasValue = metric.value != null && !Number.isNaN(parseFloat(String(metric.value)));
                    return (
                      <Link key={metric.metricKey} href={`/metric/${metric.metricKey}`} className="h-full min-h-[4.25rem]">
                        <Card
                          className={cn(
                            'gap-0 py-0 hover:shadow-md transition-shadow cursor-pointer h-full min-h-[4.25rem] flex flex-col border relative',
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
                            <div className={cn('text-sm font-bold text-center w-full leading-tight', rag.value)}>
                              {!hasValue
                                ? "—"
                                : metric.metricKey === "attainment8"
                                  ? parseFloat(metric.value).toFixed(1)
                                  : metric.metricKey === "apprentice_starts"
                                    ? parseInt(metric.value, 10).toLocaleString()
                                    : metric.metricKey === "total_population" && parseFloat(metric.value) >= 1e6
                                      ? `${(parseFloat(metric.value) / 1e6).toFixed(1)}m`
                                      : `${parseFloat(metric.value).toFixed(1)}${metric.unit}`}
                            </div>
                            {!hasValue && (
                              <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">No data</div>
                            )}
                          </CardContent>
                          {cardTooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="absolute bottom-0.5 left-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground"
                                  aria-label="Why this metric matters"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[280px] text-left text-xs whitespace-normal">
                                {cardTooltip}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Latest Commentary Section - Only show if loaded */}
        {commentaries && latestCommentary && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Latest Commentary</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Quarterly analysis and insights
                </p>
              </div>
              <Link href="/commentary">
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{latestCommentary.title}</CardTitle>
                    <CardDescription>
                      {latestCommentary.period} • Published {new Date(latestCommentary.publishedAt!).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>
                    {latestCommentary.content.length > 500
                      ? latestCommentary.content.substring(0, 500) + '...'
                      : latestCommentary.content}
                  </Streamdown>
                </div>
                {latestCommentary.content.length > 500 && (
                  <Link href={`/commentary/${latestCommentary.id}`}>
                    <Button variant="link" className="mt-4 px-0">
                      Read more →
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Data sourced from Office for National Statistics (ONS), Resolution Foundation, DfE, NHS England, and MOD</p>
          <p className="mt-1">Updated regularly to provide accurate insights</p>
        </div>
      </footer>
    </div>
  );
}
