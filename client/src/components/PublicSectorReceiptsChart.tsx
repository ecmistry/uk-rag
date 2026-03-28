import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

const SEGMENTS = [
  { key: "income_tax", label: "Income Tax", color: "hsl(220, 70%, 50%)" },
  { key: "vat", label: "VAT", color: "hsl(142, 65%, 42%)" },
  { key: "corporation_tax", label: "Corporation Tax", color: "hsl(262, 60%, 50%)" },
  { key: "social_contributions", label: "Social Contributions", color: "hsl(35, 90%, 50%)" },
  { key: "business_rates", label: "Business Rates", color: "hsl(0, 70%, 55%)" },
  { key: "fuel_duties", label: "Fuel Duties", color: "hsl(190, 70%, 45%)" },
  { key: "stamp_duty_land_tax", label: "Stamp Duty Land Tax", color: "hsl(310, 55%, 50%)" },
  { key: "tobacco_duties", label: "Tobacco Duties", color: "hsl(80, 55%, 42%)" },
  { key: "alcohol_duties", label: "Alcohol Duties", color: "hsl(15, 75%, 50%)" },
  { key: "other_taxes_on_production", label: "Other Production Taxes", color: "hsl(170, 60%, 40%)" },
  { key: "stamp_taxes_on_shares", label: "Stamp Taxes (Shares)", color: "hsl(240, 50%, 60%)" },
  { key: "customs_duties", label: "Customs Duties", color: "hsl(55, 70%, 45%)" },
  { key: "vehicle_excise_business", label: "Vehicle Excise (Business)", color: "hsl(120, 40%, 50%)" },
  { key: "vehicle_excise_households", label: "Vehicle Excise (Households)", color: "hsl(145, 50%, 55%)" },
  { key: "misc_taxes_income_wealth", label: "Misc Income/Wealth Taxes", color: "hsl(280, 45%, 55%)" },
  { key: "misc_other_taxes", label: "Misc Other Taxes", color: "hsl(200, 45%, 55%)" },
  { key: "interest_and_dividends", label: "Interest & Dividends", color: "hsl(350, 60%, 50%)" },
  { key: "gross_operating_surplus", label: "Gross Operating Surplus", color: "hsl(95, 50%, 45%)" },
  { key: "other_receipts", label: "Other Receipts", color: "hsl(30, 50%, 50%)" },
  { key: "petroleum_revenue_tax", label: "Petroleum Revenue Tax", color: "hsl(45, 80%, 40%)" },
  { key: "bank_levy", label: "Bank Levy", color: "hsl(210, 40%, 60%)" },
  { key: "tv_licence_fee", label: "TV Licence Fee", color: "hsl(330, 50%, 55%)" },
] as const;

const QUARTERS_TO_SHOW = 20;

function formatBillions(n: number): string {
  return `£${(n / 1000).toFixed(0)}bn`;
}

export default function PublicSectorReceiptsChart() {
  const { data, isLoading, error } = trpc.metrics.getPublicSectorReceipts.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Public Sector Current Receipts</CardTitle>
          <CardDescription>UK government revenue by source (ONS Appendix D), quarterly, GBP millions</CardDescription>
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
          <CardTitle>Public Sector Current Receipts</CardTitle>
          <CardDescription>UK government revenue by source (ONS Appendix D), quarterly, GBP millions</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-destructive text-sm">
            {error ? `Failed to load: ${error.message}` : "No receipts data available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const periods = data.periods.slice(-QUARTERS_TO_SHOW);
  const chartData = periods.map((p) => ({ ...p }));

  const customTooltip = ({
    payload,
    label,
  }: {
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (!payload || !payload.length) return null;
    const nonZero = payload.filter((e) => e.value !== 0).sort((a, b) => b.value - a.value);
    const total = nonZero.reduce((s, e) => s + e.value, 0);
    return (
      <div className="rounded border bg-background p-3 shadow-md text-xs max-h-[420px] overflow-y-auto">
        <div className="font-medium mb-2 text-sm">{label}</div>
        <ul className="space-y-0.5">
          {nonZero.map((entry) => {
            const pct = total ? ((entry.value / total) * 100).toFixed(1) : "0";
            return (
              <li key={entry.dataKey} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate max-w-[180px]">{entry.name}:</span>
                <span className="ml-auto font-mono tabular-nums">£{entry.value.toLocaleString()}m ({pct}%)</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 pt-2 border-t font-medium text-sm">Total: £{total.toLocaleString()}m</div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Sector Current Receipts</CardTitle>
        <CardDescription>
          UK government revenue by source, quarterly (calendar year). 22 categories from ONS Public Sector Finances Appendix D, not seasonally adjusted. Last {QUARTERS_TO_SHOW} quarters shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[480px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
            >
              <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={56} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => formatBillions(v)}
                width={52}
              />
              <Tooltip content={customTooltip} />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                iconSize={10}
              />
              {SEGMENTS.map((seg) => (
                <Bar
                  key={seg.key}
                  dataKey={seg.key}
                  name={seg.label}
                  stackId="a"
                  fill={seg.color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
