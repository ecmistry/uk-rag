import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

const SEGMENTS = [
  { key: "working" as const, label: "Working population", color: "hsl(142, 71%, 45%)" },
  { key: "underemployed" as const, label: "Underemployed (working)", color: "hsl(160, 80%, 55%)" },
  { key: "inactive" as const, label: "Economically inactive", color: "hsl(38, 92%, 50%)" },
  { key: "unemployed" as const, label: "Unemployed", color: "hsl(0, 84%, 60%)" },
  { key: "under16Over64" as const, label: "Under 16 & over 64", color: "hsl(220, 70%, 50%)" },
];

const QUARTERS_TO_SHOW = 20;

function formatThousands(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}m`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}

/** Simple linear regression: returns trend values (a + b*i) for each index i */
function linearTrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.slice();
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const a = (sumY - b * sumX) / n;
  return Array.from({ length: n }, (_, i) => a + b * i);
}

export default function PopulationBreakdownChart() {
  const { data, isLoading, error } = trpc.metrics.getPopulationBreakdown.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Population breakdown</CardTitle>
          <CardDescription>Total population by labour status (ONS), historic quarters</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.periods?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Population breakdown</CardTitle>
          <CardDescription>Total population by labour status (ONS), historic quarters</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-destructive text-sm">
            {error ? `Failed to load: ${error.message}` : "No breakdown data available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const periods = data.periods.slice(-QUARTERS_TO_SHOW);
  const totalValues = periods.map((p) => p.total);
  const trendTotal = linearTrend(totalValues);
  const trendByKey: Record<string, number[]> = {};
  for (const seg of SEGMENTS) {
    trendByKey[seg.key] = linearTrend(periods.map((p) => (p as Record<string, number>)[seg.key] ?? 0));
  }
  const chartData = periods.map((p, i) => ({
    name: p.period,
    ...p,
    trendTotal: trendTotal[i],
    ...Object.fromEntries(SEGMENTS.map((s) => [`trend_${s.key}`, trendByKey[s.key][i]])),
  }));

  const customTooltip = ({
    payload,
    label,
  }: {
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (!payload || !payload.length) return null;
    const barPayload = payload.filter((e) => !String(e.dataKey).startsWith("trend"));
    const total = barPayload.reduce((s, e) => s + e.value, 0);
    return (
      <div className="rounded border bg-background p-3 shadow-md text-sm">
        <div className="font-medium mb-2">{label}</div>
        <ul className="space-y-1">
          {barPayload.map((entry) => {
            const pct = total ? ((entry.value / total) * 100).toFixed(1) : "0";
            return (
              <li key={entry.dataKey} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                <span>
                  {entry.name}: {formatThousands(entry.value)} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 pt-2 border-t font-medium">Total: {formatThousands(total)}</div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Population breakdown</CardTitle>
        <CardDescription>
          UKPOP, MGRZ (working), LF2M (inactive), MGSX (unemployed); Under 16 & over 64 = Total − (working + inactive + unemployed). Dashed lines show linear trends. Last {QUARTERS_TO_SHOW} quarters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={56} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}m`} width={36} />
              <Tooltip content={customTooltip} />
              <Legend />
              {SEGMENTS.map((seg) => (
                <Bar
                  key={seg.key}
                  dataKey={seg.key}
                  name={seg.label}
                  stackId="a"
                  fill={seg.color}
                  barSize={24}
                />
              ))}
              <Line
                type="monotone"
                dataKey="trendTotal"
                name="Total (trend)"
                stroke="hsl(0, 0%, 30%)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
              {SEGMENTS.map((seg) => (
                <Line
                  key={`trend-${seg.key}`}
                  type="monotone"
                  dataKey={`trend_${seg.key}`}
                  name={`${seg.label} (trend)`}
                  stroke={seg.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
