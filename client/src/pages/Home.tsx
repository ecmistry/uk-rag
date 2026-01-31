import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { RefreshCw, ExternalLink, AlertCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';
import { useMemo } from 'react';
import { cn } from "@/lib/utils";
import type { Metric } from '@shared/types';

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

  // Group metrics by category (memoized for performance)
  const metricsByCategory = useMemo(() => {
    const grouped: Record<string, Metric[]> = {};
    if (metrics) {
      for (const metric of metrics) {
        if (!grouped[metric.category]) {
          grouped[metric.category] = [];
        }
        grouped[metric.category].push(metric);
      }
    }
    return grouped;
  }, [metrics]);

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
          const categoryDescriptions: Record<string, string> = {
            'Economy': 'Output per Hour, GDP Growth (Year on Year), CPI Inflation, Public Sector Net Debt, Business Investment',
            'Employment': 'Inactivity Rate, Real Wage Growth, Job Vacancy Ratio, Underemployment, Sickness Absence',
            'Education': 'Attainment 8 Score, Teacher Vacancies, NEET Rate (16-24), Persistent Absence, Apprentice Starts',
            'Crime': 'Total Recorded Crime, Charge Rate %, Perception of Safety, Crown Court Backlog, Reoffending Rate',
            'Healthcare': 'A&E 4-Hour Wait %, Elective Backlog, Ambulance (Cat 2), GP Appt. Access, Staff Vacancy Rate',
            'Defence': 'Spend as % of GDP, Trained Strength, Equipment Spend, Deployability %, Force Readiness',
            'Population': 'Natural Change (Births vs Deaths), Old-Age Dependency Ratio, Net Migration (Long-term), Healthy Life Expectancy, Total Population',
          };
          const shouldDefer = index >= 2 && metricsLoading;

          const hasNoData = categoryMetrics.length === 0;
          const isPlaceholderOrEmpty = (m: Metric) =>
            m.value === "placeholder" || Number.isNaN(parseFloat(String(m.value)));
          const allPlaceholders =
            categoryMetrics.length > 0 && categoryMetrics.every(isPlaceholderOrEmpty);
          const pendingCount = categoryMetrics.filter(isPlaceholderOrEmpty).length;
          const hasPartialData =
            categoryMetrics.length > 0 &&
            !allPlaceholders &&
            pendingCount > 0;
          const dataStatus =
            hasNoData ? "no-data" : allPlaceholders ? "placeholders-only" : hasPartialData ? "partial" : "ok";

          return (
            <section key={category} className="mb-4">
              {/* Section header: category name + optional data-status indicator */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">{category}</h2>
                {!metricsLoading && dataStatus === "no-data" && (
                  <Badge variant="secondary" className="text-[10px] font-normal gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No data — refresh to load
                  </Badge>
                )}
                {!metricsLoading && dataStatus === "placeholders-only" && (
                  <Badge variant="outline" className="text-[10px] font-normal gap-1">
                    <Info className="h-3 w-3" />
                    Placeholder data
                  </Badge>
                )}
                {!metricsLoading && dataStatus === "partial" && (
                  <Badge variant="outline" className="text-[10px] font-normal gap-1 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                    <Info className="h-3 w-3" />
                    {pendingCount === 1 ? '1 metric pending data' : `${pendingCount} metrics pending data`}
                  </Badge>
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
              ) : categoryMetrics.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 grid-auto-rows-[4.25rem]">
                  {categoryMetrics.map((metric: Metric) => {
                    const rag = getRAGCardClasses(metric.ragStatus);
                    return (
                      <Link key={metric.metricKey} href={`/metric/${metric.metricKey}`} className="h-full min-h-[4.25rem]">
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
                              {(() => {
                                let displayName = metric.name;
                                if (displayName.includes(" (Year on Year)"))
                                  displayName = displayName.replace(" (Year on Year)", "\n(Year on Year)");
                                if (displayName.includes(" (16-64)"))
                                  displayName = displayName.replace(" (16-64)", "\n(16-64)");
                                if (displayName.includes(" (16-24)"))
                                  displayName = displayName.replace(" (16-24)", "\n(16-24)");
                                if (displayName.includes(" (% of GDP)"))
                                  displayName = displayName.replace(" (% of GDP)", "\n(% of GDP)");
                                if (displayName.includes(" (Cat 2)"))
                                  displayName = displayName.replace(" (Cat 2)", "\n(Cat 2)");
                                return displayName;
                              })()}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-0.5 px-1.5 pt-0 text-center flex-1 flex flex-col justify-center items-center min-h-[2rem]">
                            <div className={cn('text-sm font-bold text-center w-full leading-tight', rag.value)}>
                              {metric.value === "placeholder" || Number.isNaN(parseFloat(metric.value))
                                ? "—"
                                : metric.metricKey === "attainment8"
                                  ? parseFloat(metric.value).toFixed(1)
                                  : metric.metricKey === "total_population" && parseFloat(metric.value) >= 1e6
                                    ? `${(parseFloat(metric.value) / 1e6).toFixed(1)}m`
                                    : `${parseFloat(metric.value).toFixed(1)}${metric.unit}`}
                            </div>
                            {(metric.value === "placeholder" || Number.isNaN(parseFloat(metric.value))) && (
                              <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">No data</div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : !metricsLoading ? (
                <Card className="gap-0 py-0">
                  <CardContent className="py-8 text-center p-4">
                    <p className="text-muted-foreground text-sm mb-3">No metrics data available for {category}</p>
                    {isAdmin && ['Economy', 'Employment', 'Education', 'Crime', 'Healthcare', 'Defence', 'Population'].includes(category) && (
                      <Button
                        size="sm"
                        onClick={() => refreshMutation.mutate({ category: category as 'Economy' | 'Employment' | 'Education' | 'Crime' | 'Healthcare' | 'Defence' | 'Population' })}
                        disabled={refreshMutation.isPending}
                      >
                        <RefreshCw className={cn('h-4 w-4 mr-2', refreshMutation.isPending && 'animate-spin')} />
                        Fetch {category} Data
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : null}
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
