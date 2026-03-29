import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";

const INCOME_SEGMENTS = [
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

const EXPENDITURE_SEGMENTS = [
  { key: "social_protection", label: "Social Protection", color: "hsl(0, 70%, 55%)" },
  { key: "health", label: "Health", color: "hsl(142, 65%, 42%)" },
  { key: "education", label: "Education", color: "hsl(220, 70%, 50%)" },
  { key: "defence", label: "Defence", color: "hsl(262, 60%, 50%)" },
  { key: "public_order_and_safety", label: "Public Order & Safety", color: "hsl(35, 90%, 50%)" },
  { key: "transport", label: "Economic Affairs: Transport", color: "hsl(190, 70%, 45%)" },
  { key: "public_and_common_services", label: "General Public Services: Public & Common", color: "hsl(310, 55%, 50%)" },
  { key: "housing_and_community", label: "Housing & Community", color: "hsl(80, 55%, 42%)" },
  { key: "enterprise_and_economic_dev", label: "Economic Affairs: Enterprise", color: "hsl(15, 75%, 50%)" },
  { key: "environment_protection", label: "Environment Protection", color: "hsl(170, 60%, 40%)" },
  { key: "recreation_culture_religion", label: "Recreation, Culture & Religion", color: "hsl(240, 50%, 60%)" },
  { key: "international_services", label: "General Public Services: International", color: "hsl(55, 70%, 45%)" },
  { key: "science_and_technology", label: "Economic Affairs: Science & Tech", color: "hsl(120, 40%, 50%)" },
  { key: "agriculture_fisheries_forestry", label: "Economic Affairs: Agriculture", color: "hsl(145, 50%, 55%)" },
  { key: "employment_policies", label: "Economic Affairs: Employment", color: "hsl(280, 45%, 55%)" },
  { key: "eu_transactions", label: "EU Transactions", color: "hsl(200, 45%, 55%)" },
] as const;

const DEBT_INTEREST_SEGMENT = {
  key: "debt_interest",
  label: "Public Sector Debt Interest",
  color: "hsl(210, 80%, 60%)",
} as const;

type ReceiptPeriod = Record<string, number | string>;
type ExpenditurePeriod = Record<string, number | string>;

function aggregateReceiptsToFiscalYears(
  quarters: ReceiptPeriod[],
): Record<string, ReceiptPeriod> {
  const result: Record<string, Record<string, number>> = {};

  for (const q of quarters) {
    const period = q.period as string;
    const match = period.match(/^(\d{4})\s+Q(\d)$/);
    if (!match) continue;
    const year = parseInt(match[1]);
    const quarter = parseInt(match[2]);

    let fy: string;
    if (quarter >= 2) {
      fy = `${year}-${String(year + 1).slice(-2)}`;
    } else {
      fy = `${year - 1}-${String(year).slice(-2)}`;
    }

    if (!result[fy]) result[fy] = {};
    for (const [k, v] of Object.entries(q)) {
      if (k === "period") continue;
      const num = typeof v === "number" ? v : 0;
      result[fy][k] = (result[fy][k] || 0) + num;
    }
  }

  const out: Record<string, ReceiptPeriod> = {};
  for (const [fy, values] of Object.entries(result)) {
    out[fy] = { period: fy, ...values };
  }
  return out;
}

interface PieSlice {
  name: string;
  value: number;
  color: string;
  key: string;
}

function buildPieData(
  period: Record<string, number | string>,
  segments: ReadonlyArray<{ key: string; label: string; color: string }>,
  convertTobn?: boolean,
): PieSlice[] {
  return segments
    .map((seg) => {
      const raw = Number(period[seg.key] || 0);
      const value = convertTobn ? Math.round((raw / 1000) * 10) / 10 : raw;
      return { name: seg.label, value, color: seg.color, key: seg.key };
    })
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

function PieTooltip({
  payload,
  total,
}: {
  payload?: Array<{ name: string; value: number; payload: PieSlice }>;
  total: number;
}) {
  if (!payload?.length) return null;
  const entry = payload[0];
  const pct = total ? ((entry.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded border bg-background p-2.5 shadow-md text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-sm shrink-0"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-medium">{entry.name}</span>
      </div>
      <div className="font-mono tabular-nums">
        £{entry.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        bn ({pct}%)
      </div>
    </div>
  );
}

export default function FiscalOverviewChart() {
  const [includeInterest, setIncludeInterest] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");

  const receiptsQuery = trpc.metrics.getPublicSectorReceipts.useQuery(
    undefined,
    { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  );
  const expenditureQuery = trpc.metrics.getPublicSectorExpenditure.useQuery(
    undefined,
    { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  );

  const isLoading = receiptsQuery.isLoading || expenditureQuery.isLoading;
  const error = receiptsQuery.error || expenditureQuery.error;

  const fiscalReceipts = useMemo(() => {
    if (!receiptsQuery.data?.periods) return {};
    return aggregateReceiptsToFiscalYears(receiptsQuery.data.periods);
  }, [receiptsQuery.data]);

  const expenditurePeriods = useMemo(() => {
    if (!expenditureQuery.data?.periods) return {};
    const map: Record<string, ExpenditurePeriod> = {};
    for (const p of expenditureQuery.data.periods) {
      map[p.period as string] = p;
    }
    return map;
  }, [expenditureQuery.data]);

  const availableYears = useMemo(() => {
    const receiptYears = new Set(Object.keys(fiscalReceipts));
    const expendYears = new Set(Object.keys(expenditurePeriods));
    const common = [...receiptYears].filter((y) => expendYears.has(y)).sort();
    return common;
  }, [fiscalReceipts, expenditurePeriods]);

  const activeYear = selectedYear && availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[availableYears.length - 1] || "";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UK Public Finances</CardTitle>
          <CardDescription>Income vs Expenditure by fiscal year</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !availableYears.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UK Public Finances</CardTitle>
          <CardDescription>Income vs Expenditure by fiscal year</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-destructive text-sm">
            {error ? `Failed to load: ${error.message}` : "No fiscal data available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const incomePeriod = fiscalReceipts[activeYear];
  const expendPeriod = expenditurePeriods[activeYear];

  const incomeData = incomePeriod ? buildPieData(incomePeriod, INCOME_SEGMENTS, true) : [];
  const expSegments = includeInterest
    ? [...EXPENDITURE_SEGMENTS, DEBT_INTEREST_SEGMENT]
    : EXPENDITURE_SEGMENTS;
  const expendData = expendPeriod ? buildPieData(expendPeriod, expSegments) : [];

  const incomeTotal = incomeData.reduce((s, d) => s + d.value, 0);
  const expendTotal = expendData.reduce((s, d) => s + d.value, 0);
  const surplus = Math.round((incomeTotal - expendTotal) * 10) / 10;
  const ratio = incomeTotal ? ((surplus / incomeTotal) * 100).toFixed(1) : "0";
  const isSurplus = surplus >= 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>UK Public Finances</CardTitle>
            <CardDescription>
              Income (ONS) vs Expenditure (HM Treasury) by fiscal year, GBP
              billions
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-interest"
                checked={includeInterest}
                onCheckedChange={(v) => setIncludeInterest(v === true)}
              />
              <label
                htmlFor="include-interest"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Include interest payments
              </label>
            </div>
            <Select value={activeYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((fy) => (
                  <SelectItem key={fy} value={fy}>
                    {fy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-6 items-start">
          {/* Income Pie */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">
              Income — £{incomeTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}bn
            </h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="85%"
                    strokeWidth={1}
                  >
                    {incomeData.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<PieTooltip total={incomeTotal} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <PieLegend data={incomeData} total={incomeTotal} />
          </div>

          {/* Expenditure Pie */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-center">
              Expenditure — £{expendTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}bn
              {!includeInterest && (
                <span className="font-normal text-muted-foreground text-xs ml-1">
                  (excl. debt interest)
                </span>
              )}
            </h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expendData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="85%"
                    strokeWidth={1}
                  >
                    {expendData.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<PieTooltip total={expendTotal} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <PieLegend data={expendData} total={expendTotal} />
          </div>

          {/* Summary Boxes */}
          <div className="flex flex-row lg:flex-col gap-4 justify-center lg:min-w-[160px]">
            <div
              className={`rounded-lg border-2 p-4 text-center ${
                isSurplus
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {isSurplus ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {includeInterest ? "Overall" : "Primary"}
                </span>
              </div>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  isSurplus
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {isSurplus ? "+" : ""}£{Math.abs(surplus).toLocaleString(undefined, { maximumFractionDigits: 1 })}bn
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isSurplus ? "Surplus" : "Deficit"}
              </div>
            </div>

            <div
              className={`rounded-lg border-2 p-4 text-center ${
                isSurplus
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
              }`}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                % of Income
              </div>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  isSurplus
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {isSurplus ? "+" : ""}
                {ratio}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PieLegend({
  data,
  total,
}: {
  data: PieSlice[];
  total: number;
}) {
  if (!data.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] leading-tight max-h-[100px] overflow-y-auto">
      {data.map((d) => {
        const pct = total ? ((d.value / total) * 100).toFixed(1) : "0";
        return (
          <span key={d.key} className="flex items-center gap-1 whitespace-nowrap">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">
              {d.name} ({pct}%)
            </span>
          </span>
        );
      })}
    </div>
  );
}
