import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMetricTileSubtitle,
  getMetricHistoryDescription,
} from "@/data/metricDescriptions";
import {
  filterToQuarterlyOnly,
  deduplicateByPeriod,
} from "@/data/quarterlyMetrics";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useParams, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** Linear regression: returns { slope, intercept } for y ≈ intercept + slope * x (x = index). */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const slope = n * sumXX - sumX * sumX !== 0
    ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    : 0;
  const intercept = sumY / n - slope * (sumX / n);
  return { slope, intercept };
}

type HistoryRow = {
  value: string;
  dataDate: string;
  ragStatus: string;
  recordedAt: Date | string;
  information?: string;
};

export default function MetricDetail() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const { data, isLoading, error } = trpc.metrics.getById.useQuery(
    { metricKey: metricKey ?? "", historyLimit: 500 },
    { enabled: !!metricKey }
  );

  if (!metricKey) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        No metric selected.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.metric) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-muted-foreground">
          {error?.message ?? "Metric not found."}
        </p>
        <Link href="/" className="text-primary hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const metric = data.metric as {
    metricKey: string;
    name: string;
    category: string;
    value: string;
    unit: string;
    ragStatus: string;
    dataDate: string;
  };
  const rawHistory = (data.history ?? []) as HistoryRow[];
  const filtered = filterToQuarterlyOnly(rawHistory);
  const history = deduplicateByPeriod(filtered);
  const periodSubtitle = getMetricTileSubtitle(metric.metricKey, metric.dataDate ?? "");
  const periodLabel = periodSubtitle ?? metric.dataDate ?? null;
  const historyDescription = getMetricHistoryDescription(metric.metricKey);

  // Chart: chronological order (oldest first), numeric value, plus trend line
  const chartDataChronological = [...history].reverse();
  const chartDataWithValue = chartDataChronological.map((row) => ({
    date: row.dataDate,
    value: parseFloat(String(row.value)),
  }));
  const validIndices: number[] = [];
  const validValues: number[] = [];
  chartDataWithValue.forEach((d, i) => {
    if (!Number.isNaN(d.value)) {
      validIndices.push(i);
      validValues.push(d.value);
    }
  });
  const { slope, intercept } = linearRegression(validValues);
  const showMovingAvg12m = metricKey === "real_wage_growth";
  const WINDOW = 4;
  const movingAvg12m = showMovingAvg12m
    ? chartDataWithValue.map((_, i) => {
        if (i < WINDOW - 1) return undefined;
        const slice = chartDataWithValue.slice(i - WINDOW + 1, i + 1).map((d) => d.value);
        if (slice.some((v) => Number.isNaN(v))) return undefined;
        return slice.reduce((a, b) => a + b, 0) / WINDOW;
      })
    : [];
  const chartData = chartDataWithValue.map((d, i) => ({
    ...d,
    value: Number.isNaN(d.value) ? undefined : d.value,
    trendValue: validValues.length > 0 ? intercept + slope * i : undefined,
    ...(showMovingAvg12m && { movingAvg12m: movingAvg12m[i] }),
  }));
  const trendPerPeriod = slope;
  const trendSubtitle =
    history.length > 0
      ? `Trending ${trendPerPeriod >= 0 ? "up" : "down"} (${trendPerPeriod >= 0 ? "+" : ""}${trendPerPeriod.toFixed(2)}% per period)`
      : null;

  return (
    <div className="w-full space-y-8">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>

      <Card
        className={cn(
          metric.ragStatus === "red" && "border-red-200 dark:border-red-900/50",
          metric.ragStatus === "amber" &&
            "border-amber-200 dark:border-amber-900/50",
          metric.ragStatus === "green" &&
            "border-green-200 dark:border-green-900/50"
        )}
      >
        <CardHeader>
          <CardTitle>{metric.name}</CardTitle>
          {periodLabel && (
            <CardDescription>
              {periodLabel}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">
            {metric.value}
            <span className="text-base font-normal text-muted-foreground ml-2">
              {metric.unit}
            </span>
          </p>
        </CardContent>
      </Card>

      {historyDescription && (
        <p className="text-sm text-muted-foreground">{historyDescription}</p>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical trends</CardTitle>
            <CardDescription>
              {metric.name} over time
              {trendSubtitle ? ` • ${trendSubtitle}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 8, bottom: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    angle={-45}
                    textAnchor="end"
                    height={56}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => (metric.unit ? `${v}${metric.unit}` : String(v))}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: number, name: string) => [
                      typeof value === "number" && !Number.isNaN(value) ? `${value.toFixed(2)}${metric.unit}` : "—",
                      name === "trendValue" ? "Trend line" : name === "movingAvg12m" ? "12-month moving average" : metric.name,
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) =>
                      value === "trendValue" ? "Trend line" : value === "movingAvg12m" ? "12-month moving average" : metric.name
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={metric.name}
                    stroke="hsl(215, 20%, 25%)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  {showMovingAvg12m && (
                    <Line
                      type="monotone"
                      dataKey="movingAvg12m"
                      name="movingAvg12m"
                      stroke="hsl(262, 52%, 47%)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      connectNulls
                    />
                  )}
                  <Line
                    type="linear"
                    dataKey="trendValue"
                    name="trendValue"
                    stroke="hsl(25, 65%, 45%)"
                    strokeWidth={1.5}
                    strokeDasharray="8 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historical data</CardTitle>
          <CardDescription>
            {history.length > 0
              ? "Quarterly values and trends."
              : "No historical data available."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="min-w-[280px] max-w-md">Information</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row, i) => (
                    <TableRow key={`${row.dataDate}-${i}`}>
                      <TableCell className="font-medium">{row.dataDate}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.value} {metric.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm align-top whitespace-pre-line">
                        {row.information ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-block w-2 h-2 rounded-full",
                            row.ragStatus === "red" && "bg-red-500",
                            row.ragStatus === "amber" && "bg-amber-500",
                            row.ragStatus === "green" && "bg-green-500"
                          )}
                          aria-hidden
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4">
              No historical data available for this metric.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
