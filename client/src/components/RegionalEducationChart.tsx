import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2 } from "lucide-react";

/**
 * Regional Education Chart Component
 * 
 * Displays a bar chart comparing Attainment 8 scores across UK regions
 */
export default function RegionalEducationChart() {
  // Defer loading regional data - it's below the fold
  const { data: regionalData, isLoading, error } = trpc.metrics.getRegionalEducationData.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Define color gradient for bars (higher scores = greener)
  const getBarColor = (value: number) => {
    const national_avg = 45.9; // National average from our data
    if (value >= national_avg + 2) return 'hsl(142, 71%, 45%)'; // Green
    if (value >= national_avg - 2) return 'hsl(48, 96%, 53%)'; // Amber
    return 'hsl(0, 84%, 60%)'; // Red
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Education Comparison</CardTitle>
          <CardDescription>Attainment 8 scores by region</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Education Comparison</CardTitle>
          <CardDescription>Attainment 8 scores by region</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-destructive text-sm">Failed to load regional data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!regionalData || regionalData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Education Comparison</CardTitle>
          <CardDescription>Attainment 8 scores by region</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No regional data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Education Comparison</CardTitle>
        <CardDescription>
          Attainment 8 scores across UK regions for {regionalData[0]?.time_period || 'latest period'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={regionalData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="region" 
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis 
              label={{ value: 'Attainment 8 Score', angle: -90, position: 'insideLeft' }}
              domain={[0, 60]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [value.toFixed(1), 'Attainment 8']}
            />
            <Bar dataKey="attainment8" radius={[8, 8, 0, 0]}>
              {regionalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.attainment8)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }}></div>
            <span className="text-muted-foreground">Above Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(48, 96%, 53%)' }}></div>
            <span className="text-muted-foreground">Near Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}></div>
            <span className="text-muted-foreground">Below Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
