import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface MetricHistoryPoint {
  value: string;
  ragStatus: string;
  dataDate: string;
  recordedAt: string;
}

interface MetricHistoryChartProps {
  history: MetricHistoryPoint[];
  metricName: string;
  unit: string;
  isLoading?: boolean;
}

export default function MetricHistoryChart({
  history,
  metricName,
  unit,
  isLoading = false,
}: MetricHistoryChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Trends</CardTitle>
          <CardDescription>Loading historical data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Trends</CardTitle>
          <CardDescription>Historical data for {metricName}</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No historical data available</p>
        </CardContent>
      </Card>
    );
  }

  const parseDataDate = (dataDate: string): number => {
    const yearMatch = dataDate.match(/^(\d{4})/);
    if (!yearMatch) return 0;
    const year = parseInt(yearMatch[1]);
    const quarterMatch = dataDate.match(/Q(\d)/);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      const month = (quarter - 1) * 3 + 1;
      return new Date(year, month - 1, 15).getTime();
    }
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    for (let i = 0; i < monthNames.length; i++) {
      if (dataDate.includes(monthNames[i])) return new Date(year, i, 15).getTime();
    }
    return new Date(year, 5, 15).getTime();
  };

  const dataMap = new Map<string, { date: string; value: number; ragStatus: string; timestamp: number; recordedAt: number }>();
  history.forEach((point) => {
    const dataDate = point.dataDate;
    const recordedAt = new Date(point.recordedAt).getTime();
    const existing = dataMap.get(dataDate);
    const parsedValue = parseFloat(point.value);
    if (isNaN(parsedValue)) return;
    if (!existing || recordedAt > existing.recordedAt) {
      dataMap.set(dataDate, {
        date: dataDate,
        value: parsedValue,
        ragStatus: point.ragStatus,
        timestamp: parseDataDate(dataDate),
        recordedAt,
      });
    }
  });

  const chartData = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  let trendLineData: Array<{ date: string; value: number }> = [];
  if (chartData.length >= 2) {
    const n = chartData.length;
    const sumX = chartData.reduce((sum, _, i) => sum + i, 0);
    const sumY = chartData.reduce((sum, d) => sum + d.value, 0);
    const sumXY = chartData.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumX2 = chartData.reduce((sum, _, i) => sum + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    trendLineData = chartData.map((_, i) => ({
      date: chartData[i].date,
      value: intercept + slope * i,
    }));
  }

  const calculateTrend = () => {
    if (chartData.length < 2) return null;
    const n = chartData.length;
    const sumX = chartData.reduce((sum, _, i) => sum + i, 0);
    const sumY = chartData.reduce((sum, d) => sum + d.value, 0);
    const sumXY = chartData.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumX2 = chartData.reduce((sum, _, i) => sum + i * i, 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  };
  const trend = calculateTrend();
  const trendText = trend
    ? trend > 0
      ? `Trending up (+${trend.toFixed(2)}${unit} per period)`
      : `Trending down (${trend.toFixed(2)}${unit} per period)`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical Trends</CardTitle>
        <CardDescription>
          {metricName} over time {trendText && `• ${trendText}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData.map((d, i) => ({
              date: d.date,
              value: d.value,
              trendValue: trendLineData[i]?.value ?? null,
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} className="text-xs" />
            <YAxis label={{ value: `${metricName} (${unit})`, angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toFixed(2) + unit, "Value"]}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={metricName}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
              connectNulls={true}
              isAnimationActive={false}
            />
            {trendLineData.length > 0 && (
              <Line
                type="linear"
                dataKey="trendValue"
                name="Trend Line"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={false}
                connectNulls={true}
                legendType="line"
                isAnimationActive={false}
              />
            )}
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">First Recorded</div>
            <div className="font-semibold">{chartData[0]?.date || "N/A"}</div>
            <div className="text-muted-foreground text-xs">
              {chartData[0]?.value != null ? chartData[0].value.toFixed(2) + unit : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Latest</div>
            <div className="font-semibold">{chartData[chartData.length - 1]?.date || "N/A"}</div>
            <div className="text-muted-foreground text-xs">
              {chartData[chartData.length - 1]?.value != null
                ? chartData[chartData.length - 1].value.toFixed(2) + unit
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Data Points</div>
            <div className="font-semibold">{chartData.length}</div>
            <div className="text-muted-foreground text-xs">{chartData.length > 0 ? "Available" : "None"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
