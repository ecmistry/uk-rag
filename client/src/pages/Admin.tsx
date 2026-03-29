import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // used by login form
import {
  Lock,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  CalendarClock,
  ScrollText,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr + " UTC").getTime();
  const diffMs = now - then;
  if (isNaN(diffMs) || diffMs < 0) return dateStr;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: "OK",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  unknown: {
    icon: HelpCircle,
    label: "Unknown",
    className:
      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
} as const;

function CronStatusBadge({ status }: { status: string }) {
  const config =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function statusColor(percent: number): string {
  if (percent < 60) return "text-green-600 dark:text-green-400";
  if (percent < 85) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function progressColor(percent: number): string {
  if (percent < 60) return "[&>div]:bg-green-500";
  if (percent < 85) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}


export default function Admin() {
  const { user, refresh } = useAuth();
  const isAdmin = user?.role === "admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Login failed");
        return;
      }
      await refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="w-full py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to access data management and server diagnostics
          </p>
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Sign in with your admin account to manage data and view server
              health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@uk-rag.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}

function DataRefreshSection({ cronSchedule }: { cronSchedule?: string }) {
  const utils = trpc.useUtils();
  const refreshMutation = trpc.metrics.refresh.useMutation({
    onSuccess: () => {
      toast.success("Data refreshed successfully");
      void utils.metrics.list.invalidate();
      void utils.metrics.trends.invalidate();
    },
    onError: (err) => {
      toast.error(`Refresh failed: ${err.message}`);
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Data Refresh</CardTitle>
        </div>
        <CardDescription>
          Dashboard data is refreshed automatically by a server-side cron job.
          Use the button below for an ad-hoc manual refresh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={() => refreshMutation.mutate({ category: "All" })}
            disabled={refreshMutation.isPending}
            size="sm"
          >
            <RefreshCw
              className={refreshMutation.isPending ? "animate-spin" : ""}
              size={14}
            />
            <span className="ml-2">Refresh all now</span>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>
              Automatic: <strong>{cronSchedule ?? "Daily at 06:00"}</strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } =
    trpc.metrics.serverHealth.useQuery(undefined, {
      refetchInterval: 60_000,
    });

  if (isLoading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load server health: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const memPercent = Math.round((data.mem.used / data.mem.total) * 100);
  const diskPercent = parseInt(data.disk.percent);
  const loadPercent = Math.round(
    (parseFloat(data.load.avg1) / data.load.cpuCount) * 100
  );

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data management, system resources, and cron status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Uptime: <strong>{formatUptime(data.uptimeSeconds)}</strong>
        </span>
      </div>

      {/* Data Refresh controls */}
      <DataRefreshSection
        cronSchedule={
          data.cronJobs.find(
            (j: { name: string; schedule: string }) =>
              j.name.toLowerCase().includes("dashboard") ||
              j.name.toLowerCase().includes("data refresh"),
          )?.schedule
        }
      />

      {/* Resource gauges */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Disk</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {data.disk.used} / {data.disk.total}
              </span>
              <span className={statusColor(diskPercent)}>
                {data.disk.percent}
              </span>
            </div>
            <Progress
              value={diskPercent}
              className={`h-2 ${progressColor(diskPercent)}`}
            />
            <p className="text-xs text-muted-foreground">
              {data.disk.available} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatBytes(data.mem.used)} / {formatBytes(data.mem.total)}
              </span>
              <span className={statusColor(memPercent)}>{memPercent}%</span>
            </div>
            <Progress
              value={memPercent}
              className={`h-2 ${progressColor(memPercent)}`}
            />
            <p className="text-xs text-muted-foreground">
              {formatBytes(data.mem.available)} available
              {data.appMem > 0 && (
                <> &middot; App: {formatBytes(data.appMem)}</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {data.load.avg1} / {data.load.cpuCount} cores
              </span>
              <span className={statusColor(loadPercent)}>
                {loadPercent}%
              </span>
            </div>
            <Progress
              value={Math.min(loadPercent, 100)}
              className={`h-2 ${progressColor(loadPercent)}`}
            />
            <p className="text-xs text-muted-foreground">
              Load avg: {data.load.avg1} · {data.load.avg5} · {data.load.avg15}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MongoDB */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">MongoDB</CardTitle>
          </div>
          <CardDescription>
            {data.mongo.collections} collections &middot;{" "}
            {data.mongo.documents.toLocaleString()} documents &middot; Data:{" "}
            {formatBytes(data.mongo.dataSize)} &middot; Indexes:{" "}
            {formatBytes(data.mongo.indexSize)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead className="text-right">Documents</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.mongo.collectionDetails
                .sort(
                  (a: { documents: number }, b: { documents: number }) =>
                    b.documents - a.documents
                )
                .map(
                  (col: {
                    name: string;
                    documents: number;
                    sizeKB: number;
                  }) => (
                    <TableRow key={col.name}>
                      <TableCell className="font-mono text-sm">
                        {col.name}
                        {col.documents === 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            empty
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {col.documents.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {col.sizeKB < 1
                          ? "< 1 KB"
                          : `${col.sizeKB.toLocaleString()} KB`}
                      </TableCell>
                    </TableRow>
                  )
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cron Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Scheduled Jobs</CardTitle>
          </div>
          <CardDescription>
            {data.cronJobs.length} active job
            {data.cronJobs.length !== 1 ? "s" : ""} &middot; Total log size:{" "}
            {formatBytes(data.logsBytes)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.cronJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No cron jobs configured
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cronJobs.map(
                  (
                    job: {
                      name: string;
                      schedule: string;
                      lastRun: string | null;
                      lastStatus: string;
                      lastMessage: string;
                      raw: string;
                    },
                    i: number
                  ) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">
                        {job.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {job.schedule}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {job.lastRun
                          ? formatRelativeTime(job.lastRun)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <CronStatusBadge status={job.lastStatus} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[300px] truncate">
                        {job.lastMessage || "\u2014"}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <RecentLogsSection logs={data.recentLogs ?? []} />
    </div>
  );
}

const LOG_LEVEL_CONFIG = {
  error: {
    icon: XCircle,
    label: "Error",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    rowClass: "bg-red-50/50 dark:bg-red-950/20",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rowClass: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  info: {
    icon: Info,
    label: "Info",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    rowClass: "",
  },
} as const;

type LogEntry = {
  timestamp: string;
  level: "error" | "warning" | "info";
  source: string;
  message: string;
};

function LogLevelBadge({ level }: { level: string }) {
  const config =
    LOG_LEVEL_CONFIG[level as keyof typeof LOG_LEVEL_CONFIG] ??
    LOG_LEVEL_CONFIG.info;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function RecentLogsSection({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<"all" | "error" | "warning">("all");

  const filtered =
    filter === "all"
      ? logs
      : logs.filter((l) => l.level === filter);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warningCount = logs.filter((l) => l.level === "warning").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Recent Logs</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "error", "warning"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? `All (${logs.length})`
                  : f === "error"
                    ? `Errors (${errorCount})`
                    : `Warnings (${warningCount})`}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Errors, warnings, and notable events from cron jobs and the Node.js
          service
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {filter === "all"
              ? "No recent errors or warnings — everything looks healthy"
              : `No recent ${filter}s`}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead className="w-[80px]">Level</TableHead>
                  <TableHead className="w-[160px]">Source</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, i) => {
                  const config =
                    LOG_LEVEL_CONFIG[
                      entry.level as keyof typeof LOG_LEVEL_CONFIG
                    ] ?? LOG_LEVEL_CONFIG.info;
                  return (
                    <TableRow key={i} className={config.rowClass}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {entry.timestamp
                          ? formatRelativeTime(entry.timestamp)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <LogLevelBadge level={entry.level} />
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {entry.source}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[400px]">
                        <span className="line-clamp-2">{entry.message}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
