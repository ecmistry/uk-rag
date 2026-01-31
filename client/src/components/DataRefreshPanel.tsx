import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { RefreshCw, CheckCircle2, AlertCircle, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface CategoryRefreshState {
  isRefreshing: boolean;
  lastRefresh?: Date;
  error?: string;
}

/**
 * Data Refresh Panel Component
 * 
 * Provides admin controls for manually refreshing data by category
 */
export default function DataRefreshPanel() {
  const utils = trpc.useUtils();
  
  // Check data quality query (lazy)
  const qualityQuery = trpc.metrics.checkDataQuality.useQuery(undefined, {
    enabled: false, // Only fetch when manually triggered
  });
  
  const [refreshStates, setRefreshStates] = useState<Record<string, CategoryRefreshState>>({
    Economy: { isRefreshing: false },
    Employment: { isRefreshing: false },
    Education: { isRefreshing: false },
    Crime: { isRefreshing: false },
    Healthcare: { isRefreshing: false },
    Defence: { isRefreshing: false },
    Population: { isRefreshing: false },
  });

  // Refresh mutation
  const refreshMutation = trpc.metrics.refresh.useMutation({
    onSuccess: (data, variables) => {
      const category = variables.category as string;
      setRefreshStates(prev => ({
        ...prev,
        [category]: {
          isRefreshing: false,
          lastRefresh: new Date(),
          error: undefined,
        },
      }));
      
      toast.success(`${category} metrics refreshed successfully`, {
        description: `Fetched ${data.count} metrics`,
      });
      
      // Invalidate metrics query to refetch
      utils.metrics.list.invalidate();
    },
    onError: (error, variables) => {
      const category = variables.category as string;
      setRefreshStates(prev => ({
        ...prev,
        [category]: {
          isRefreshing: false,
          error: error.message,
        },
      }));
      
      toast.error(`Failed to refresh ${category} metrics`, {
        description: error.message,
      });
    },
  });

  const handleRefresh = (category: 'Economy' | 'Employment' | 'Education' | 'Crime' | 'Healthcare' | 'Defence' | 'Population' | 'All') => {
    if (category === 'All') {
      // Refresh all categories
      setRefreshStates({
        Economy: { isRefreshing: true },
        Employment: { isRefreshing: true },
        Education: { isRefreshing: true },
        Crime: { isRefreshing: true },
        Healthcare: { isRefreshing: true },
        Defence: { isRefreshing: true },
        Population: { isRefreshing: true },
      });
    } else {
      setRefreshStates(prev => ({
        ...prev,
        [category]: { ...prev[category], isRefreshing: true },
      }));
    }
    
    refreshMutation.mutate({ category });
  };

  const categories: Array<{ name: 'Economy' | 'Employment' | 'Education' | 'Crime' | 'Healthcare' | 'Defence' | 'Population'; description: string }> = [
    { name: 'Economy', description: 'Output per Hour, Real GDP Growth, CPI Inflation, Public Sector Net Debt, Business Investment' },
    { name: 'Employment', description: 'Inactivity Rate, Real Wage Growth, Job Vacancy Ratio, Underemployment, Sickness Absence' },
    { name: 'Education', description: 'Attainment 8 Score, Teacher Vacancies, NEET Rate (16-24)' },
    { name: 'Crime', description: 'Crime rates and outcomes' },
    { name: 'Healthcare', description: 'NHS performance indicators' },
    { name: 'Defence', description: 'Defence spending and readiness' },
    { name: 'Population', description: 'Natural Change (Births vs Deaths), Old-Age Dependency Ratio, Net Migration (Long-term), Healthy Life Expectancy, Total Population' },
  ];

  // Export all metrics to CSV
  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/trpc/metrics.exportCsv?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D');
      const data = await response.json();
      const csvData = data[0]?.result?.data?.json?.csv;
      const filename = data[0]?.result?.data?.json?.filename || 'metrics.csv';
      
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Metrics exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export metrics');
      console.error('Export error:', error);
    }
  };

  const handleCheckQuality = () => {
    qualityQuery.refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Refresh Control Panel</CardTitle>
        <CardDescription>
          Manually trigger data updates for each category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Admin Actions */}
          <div className="pb-4 border-b space-y-2">
            <Button
              onClick={() => handleRefresh('All')}
              disabled={refreshMutation.isPending}
              size="lg"
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh All Categories
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleExportAll}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleCheckQuality}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Check Quality
              </Button>
            </div>
            {qualityQuery.data && (
              <div className="mt-2 p-3 bg-muted rounded text-sm">
                <div className="font-semibold mb-1">Data Quality Check</div>
                <div>Valid: {qualityQuery.data.valid} | Invalid: {qualityQuery.data.invalid}</div>
                {qualityQuery.data.issues.length > 0 && (
                  <div className="mt-2 text-xs text-destructive">
                    Issues: {qualityQuery.data.issues.slice(0, 3).join(', ')}
                    {qualityQuery.data.issues.length > 3 && ` +${qualityQuery.data.issues.length - 3} more`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Individual Category Refresh Controls */}
          <div className="grid gap-4 md:grid-cols-5">
            {categories.map(({ name, description }) => {
              const state = refreshStates[name];
              
              return (
                <Card key={name} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{name}</CardTitle>
                      {state.lastRefresh && !state.error && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {state.error && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => handleRefresh(name)}
                      disabled={state.isRefreshing}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <RefreshCw className={`h-3 w-3 mr-2 ${state.isRefreshing ? 'animate-spin' : ''}`} />
                      {state.isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    
                    {state.lastRefresh && (
                      <div className="text-xs text-muted-foreground text-center">
                        Last refreshed:{' '}
                        {state.lastRefresh.toLocaleTimeString()}
                      </div>
                    )}
                    
                    {state.error && (
                      <Badge variant="destructive" className="w-full text-xs">
                        Error
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
