import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import MetricHistoryChart from "@/components/MetricHistoryChart";

export default function MetricDetail() {
  const [, params] = useRoute("/metric/:metricKey");
  const metricKey = params?.metricKey || '';

  const { data, isLoading, error } = trpc.metrics.getById.useQuery(
    {
      metricKey,
      historyLimit: 100, // Increased to show more historical data
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const getRAGClassName = (status: string) => {
    switch (status) {
      case 'green':
        return 'rag-green';
      case 'amber':
        return 'rag-amber';
      case 'red':
        return 'rag-red';
      default:
        return 'bg-muted';
    }
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <TrendingUp className="h-5 w-5" />;
      case 'amber':
        return <Minus className="h-5 w-5" />;
      case 'red':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getDataSourceName = (sourceUrl?: string | null, metricKey?: string): string => {
    if (!sourceUrl && !metricKey) {
      return 'Office for National Statistics (ONS)';
    }

    // Output per Hour: ONS labour productivity series LZVD
    if (metricKey === 'output_per_hour') {
      return 'ONS API: Series LZVD';
    }

    // Check sourceUrl for Resolution Foundation
    if (sourceUrl && sourceUrl.includes('resolutionfoundation.org')) {
      return 'Resolution Foundation';
    }

    // Check metricKey for employment metrics
    if (metricKey && (metricKey === 'employment_rate' || metricKey === 'employment_rate_16_64' || metricKey === 'unemployment_rate')) {
      return 'Resolution Foundation';
    }

    // Check sourceUrl for other sources
    if (sourceUrl) {
      if (sourceUrl.includes('explore-education-statistics')) {
        return 'Department for Education (DfE)';
      }
      if (sourceUrl.includes('england.nhs.uk') || sourceUrl.includes('nhs.uk')) {
        return 'NHS England';
      }
      if (sourceUrl.includes('gov.uk/government') && sourceUrl.includes('defence')) {
        return 'Ministry of Defence (MOD)';
      }
      if (sourceUrl.includes('ons.gov.uk')) {
        return 'Office for National Statistics (ONS)';
      }
    }

    // Default to ONS
    return 'Office for National Statistics (ONS)';
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full">
        <div className="container py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Metric not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { metric, history } = data;

  return (
    <div className="w-full">
      <div className="container py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Metric Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{metric.name}</CardTitle>
                <CardDescription className="text-base">
                  {metric.category} • as of {metric.dataDate}
                </CardDescription>
                {metric.metricKey === 'output_per_hour' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Measures efficiency. Vital for long-term wage growth.
                  </p>
                )}
              </div>
              <Badge className={`${getRAGClassName(metric.ragStatus)} text-lg px-4 py-2`}>
                {metric.ragStatus.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Current Value */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${getRAGClassName(metric.ragStatus)} p-3 rounded-full`}>
                    {getTrendIcon(metric.ragStatus)}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                    <div className="text-4xl font-bold">
                      {metric.value === "placeholder" || Number.isNaN(parseFloat(metric.value))
                        ? "—"
                        : metric.metricKey === "attainment8"
                          ? parseFloat(metric.value).toFixed(1)
                          : metric.metricKey === "total_population" && parseFloat(metric.value) >= 1e6
                            ? `${(parseFloat(metric.value) / 1e6).toFixed(1)} million`
                            : `${parseFloat(metric.value).toFixed(1)}${metric.unit}`}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(metric.lastUpdated).toLocaleString()}
                </div>
              </div>

              {/* Data Source */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Data Source</div>
                <div className="text-sm mb-4">{getDataSourceName(metric.sourceUrl, metric.metricKey)}</div>
                {metric.sourceUrl && (
                  <a
                    href={metric.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    View source data
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAG Status Explanation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>RAG Status Criteria</CardTitle>
            <CardDescription>How this metric is evaluated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-l-4 rag-border-green pl-4">
                <div className="font-semibold mb-1">Green (Good)</div>
                <div className="text-sm text-muted-foreground">
                  {metric.metricKey === 'real_gdp_growth' && '≥ 2.0% annual growth'}
                  {metric.metricKey === 'cpi_inflation' && '1.5% - 2.5% (target range)'}
                  {metric.metricKey === 'output_per_hour' && '≥ 1% year-on-year growth'}
                </div>
              </div>
              <div className="border-l-4 rag-border-amber pl-4">
                <div className="font-semibold mb-1">Amber (Moderate)</div>
                <div className="text-sm text-muted-foreground">
                  {metric.metricKey === 'real_gdp_growth' && '1.0% - 2.0% growth'}
                  {metric.metricKey === 'cpi_inflation' && '1.0% - 1.5% or 2.5% - 3.5%'}
                  {metric.metricKey === 'output_per_hour' && '0% to 1% growth'}
                </div>
              </div>
              <div className="border-l-4 rag-border-red pl-4">
                <div className="font-semibold mb-1">Red (Concern)</div>
                <div className="text-sm text-muted-foreground">
                  {metric.metricKey === 'real_gdp_growth' && '< 1.0% growth'}
                  {metric.metricKey === 'cpi_inflation' && '< 1.0% or > 3.5%'}
                  {metric.metricKey === 'output_per_hour' && '< 0% (declining)'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Trends Chart */}
        {history && history.length > 0 && (
          <div className="mb-8">
            <MetricHistoryChart 
              history={history.map(h => ({
                value: h.value,
                ragStatus: h.ragStatus,
                dataDate: h.dataDate,
                recordedAt: h.recordedAt instanceof Date ? h.recordedAt.toISOString() : String(h.recordedAt)
              }))} 
              metricName={metric.name}
              unit={metric.unit}
            />
          </div>
        )}

        {/* Historical Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>Recent values and trends</CardDescription>
              </div>
              {history && history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Export to CSV
                    const csv = [
                      ['Period', 'Value', 'Status', 'Recorded'].join(','),
                      ...history.map(h => [
                        h.dataDate,
                        h.value,
                        h.ragStatus,
                        new Date(h.recordedAt).toISOString()
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${metric.metricKey}_history.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Period</th>
                      <th className="text-left py-3 px-4 font-semibold">Value</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, index) => (
                      <tr key={record._id?.toString() || index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{record.dataDate}</td>
                        <td className="py-3 px-4 font-medium">
                          {parseFloat(record.value).toFixed(1)}{metric.unit}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`${getRAGClassName(record.ragStatus)} border-0`}
                          >
                            {record.ragStatus.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(record.recordedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No historical data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
