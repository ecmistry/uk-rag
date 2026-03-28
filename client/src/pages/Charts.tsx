import PopulationBreakdownChart from "@/components/PopulationBreakdownChart";

export default function Charts() {
  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Charts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visual breakdowns and trend analysis
        </p>
      </div>

      <PopulationBreakdownChart />
    </div>
  );
}
