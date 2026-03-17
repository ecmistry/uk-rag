import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Timer } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

const AUTO_REFRESH_STORAGE_KEY = "uk-rag-auto-refresh-interval";

type AutoRefreshInterval = "off" | "1h" | "6h" | "12h" | "24h";

const INTERVALS: { value: AutoRefreshInterval; label: string; ms: number }[] = [
  { value: "off", label: "Off", ms: 0 },
  { value: "1h", label: "Every hour", ms: 60 * 60 * 1000 },
  { value: "6h", label: "Every 6 hours", ms: 6 * 60 * 60 * 1000 },
  { value: "12h", label: "Every 12 hours", ms: 12 * 60 * 60 * 1000 },
  { value: "24h", label: "Every day", ms: 24 * 60 * 60 * 1000 },
];

function getStoredInterval(): AutoRefreshInterval {
  if (typeof window === "undefined") return "off";
  const stored = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
  const valid = INTERVALS.some((i) => i.value === stored);
  return valid ? (stored as AutoRefreshInterval) : "off";
}

export default function DataRefreshPanel() {
  const [autoRefresh, setAutoRefresh] = useState<AutoRefreshInterval>(getStoredInterval);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshMutation = trpc.metrics.refresh.useMutation({
    onSuccess: () => {
      toast.success("Data refreshed successfully");
    },
    onError: (err) => {
      toast.error(`Refresh failed: ${err.message}`);
    },
  });

  const handleRefreshNow = () => {
    refreshMutation.mutate({ category: "All" });
  };

  // Persist choice
  useEffect(() => {
    localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, autoRefresh);
  }, [autoRefresh]);

  // Set up or clear auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const config = INTERVALS.find((i) => i.value === autoRefresh);
    if (!config || config.ms === 0) return;

    const runRefresh = () => {
      refreshMutation.mutate({ category: "All" });
    };
    intervalRef.current = setInterval(runRefresh, config.ms);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Refresh Control Panel</CardTitle>
        <CardDescription>
          Manually refresh all metrics or set an automatic refresh interval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <Button
            onClick={handleRefreshNow}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={refreshMutation.isPending ? "animate-spin" : ""} size={16} />
            <span className="ml-2">Refresh all now</span>
          </Button>
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-muted-foreground" />
            <Label htmlFor="auto-refresh" className="text-sm font-medium whitespace-nowrap">
              Auto refresh:
            </Label>
            <Select
              value={autoRefresh}
              onValueChange={(v) => setAutoRefresh(v as AutoRefreshInterval)}
            >
              <SelectTrigger id="auto-refresh" className="w-[180px]">
                <SelectValue placeholder="Off" />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          When auto refresh is on, all categories (Economy, Employment, Education, Crime,
          Healthcare, Defence, Population) are refreshed at the chosen interval. Your
          choice is saved for this browser.
        </p>
      </CardContent>
    </Card>
  );
}
