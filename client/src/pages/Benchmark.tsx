import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Globe2, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

function ragClasses(status: string) {
  switch (status) {
    case "green":
      return {
        card: "bg-green-100 border-green-400 dark:bg-green-950/60 dark:border-green-700",
        value: "text-green-800 dark:text-green-300",
        badge: "bg-green-600 text-white",
        bar: "bg-green-600",
      };
    case "amber":
      return {
        card: "bg-amber-100 border-amber-400 dark:bg-amber-950/60 dark:border-amber-700",
        value: "text-amber-800 dark:text-amber-300",
        badge: "bg-amber-500 text-white",
        bar: "bg-amber-500",
      };
    case "red":
      return {
        card: "bg-red-100 border-red-400 dark:bg-red-950/60 dark:border-red-700",
        value: "text-red-800 dark:text-red-300",
        badge: "bg-red-600 text-white",
        bar: "bg-red-600",
      };
    default:
      return {
        card: "bg-muted/40 border-border",
        value: "text-foreground",
        badge: "bg-muted text-foreground",
        bar: "bg-muted-foreground",
      };
  }
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function sourceLabel(source: string) {
  if (source === "imf_weo") return "IMF WEO";
  if (source === "world_bank") return "World Bank";
  return source;
}

/** Compact SVG sparkline of percentile-from-best over years (lower = better). */
function HistorySpark({
  history,
}: {
  history: Array<{ year: number; percentileFromBest: number; ragStatus: string }>;
}) {
  if (!history.length) return null;
  const w = 120;
  const h = 28;
  const pad = 2;
  const xs = history.map((_, i) =>
    history.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (history.length - 1),
  );
  const ys = history.map((p) => pad + (p.percentileFromBest / 100) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const last = history[history.length - 1];
  const lastStyle = ragClasses(last.ragStatus);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[140px] h-7" aria-hidden>
      <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} className="stroke-black/10 dark:stroke-white/10" strokeWidth={1} />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className={cn(lastStyle.value)} />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} className={cn(lastStyle.bar)} fill="currentColor" />
    </svg>
  );
}

export default function Benchmark() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [lens, setLens] = useState<"g20" | "g7">("g20");

  const { data, isLoading, isFetching, refetch } = trpc.benchmark.get.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  });

  const refreshMutation = trpc.benchmark.refresh.useMutation({
    onSuccess: async () => {
      toast.success("G20 benchmark refreshed from World Bank + IMF");
      await refetch();
    },
    onError: (err) => toast.error(`Refresh failed: ${err.message}`),
  });

  const byCategory = useMemo(() => {
    if (!data?.measures) return [] as Array<{ category: string; items: typeof data.measures }>;
    const map = new Map<string, typeof data.measures>();
    for (const m of data.measures) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [data]);

  const composite = data?.composite;
  const compositeStyles = ragClasses(composite?.ragStatus ?? "unknown");

  return (
    <div className="w-full max-w-6xl mx-auto px-1 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">G20 Benchmark</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            UK performance ranked against G20 economies (+ EU) on a shared percentile
            scale — distinct from absolute UK scorecard thresholds. Includes IMF debt and
            defence spend peers, G7 lens, and multi-year history.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            disabled={refreshMutation.isPending || isFetching}
            onClick={() => refreshMutation.mutate()}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", (refreshMutation.isPending || isFetching) && "animate-spin")} />
            Refresh peers
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-muted/20 p-4 mb-6 text-sm space-y-2">
        <p className="font-medium">Percentile RAG methodology</p>
        <ul className="grid sm:grid-cols-3 gap-2 text-muted-foreground">
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600 mr-2 align-middle" />Top 20% of peers → green</li>
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 align-middle" />21–50% → amber</li>
          <li><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 mr-2 align-middle" />Bottom 50% → red</li>
        </ul>
        {data && (
          <p className="text-xs text-muted-foreground pt-1">
            Peer set: {data.peerSet}. Last refreshed{" "}
            {formatDistanceToNow(new Date(data.refreshedAt), { addSuffix: true })}.
            {composite && (
              <>
                {" "}Scores: {composite.green} green · {composite.amber} amber · {composite.red} red
                {composite.unknown ? ` · ${composite.unknown} unknown` : ""}.
              </>
            )}
          </p>
        )}
      </div>

      {isLoading && !data && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {data && (
        <>
          {/* Composite + category rollups */}
          <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className={cn("rounded-lg border p-5", compositeStyles.card)}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Composite G20 position
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <p className={cn("text-4xl font-semibold tabular-nums", compositeStyles.value)}>
                  {formatPct(composite?.avgPercentileFromBest)}
                </p>
                <Badge className={cn("capitalize mb-1", compositeStyles.badge)}>
                  {composite?.ragStatus ?? "unknown"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Mean percentile-from-best across {composite?.scoredMeasures ?? 0} scored measures
                (0% = best peer, 100% = worst).
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Category rollups
              </p>
              {(data.categories ?? []).map((c) => {
                const styles = ragClasses(c.ragStatus);
                const width = c.avgPercentileFromBest == null ? 0 : Math.min(100, c.avgPercentileFromBest);
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.category}</span>
                      <span className={cn("tabular-nums text-xs", styles.value)}>
                        {formatPct(c.avgPercentileFromBest)} · {c.ragStatus}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full", styles.bar)} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Insights */}
          {data.insights?.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Key insights
              </h2>
              <ul className="space-y-2">
                {data.insights.map((ins, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      ins.severity === "good" && "border-green-300 bg-green-50 dark:bg-green-950/40",
                      ins.severity === "warn" && "border-amber-300 bg-amber-50 dark:bg-amber-950/40",
                    )}
                  >
                    {ins.text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Lens toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Peer lens</span>
            <div className="inline-flex rounded-md border p-0.5 text-sm">
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded",
                  lens === "g20" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                onClick={() => setLens("g20")}
              >
                G20 + EU
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1 rounded",
                  lens === "g7" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
                onClick={() => setLens("g7")}
              >
                G7 only
              </button>
            </div>
          </div>

          {/* Measures by category */}
          {byCategory.map(({ category, items }) => (
            <section key={category} className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => {
                  const status = lens === "g7" ? m.g7RagStatus : m.ragStatus;
                  const pct = lens === "g7" ? m.g7PercentileFromBest : m.percentileFromBest;
                  const peers = lens === "g7" ? m.g7PeerCount : m.peerCount;
                  const styles = ragClasses(status);
                  const open = expandedKey === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setExpandedKey(open ? null : m.key)}
                      className={cn(
                        "text-left rounded-lg border p-4 transition-colors hover:opacity-95",
                        styles.card,
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {sourceLabel(m.source)}
                          </p>
                          <p className="font-semibold leading-snug">{m.name}</p>
                        </div>
                        <Badge className={cn("shrink-0 capitalize", styles.badge)}>{status}</Badge>
                      </div>
                      <p className={cn("text-3xl font-semibold tabular-nums", styles.value)}>
                        {m.ukValue == null ? "—" : m.ukValue.toFixed(1)}
                        <span className="text-base font-normal ml-1">{m.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        UK · {m.ukYear ?? "—"} · {formatPct(pct)} from best among {peers}{" "}
                        {lens === "g7" ? "G7" : "peers"}
                      </p>
                      {m.history?.length > 1 && (
                        <div className="mt-2">
                          <HistorySpark history={m.history} />
                          <p className="text-[10px] text-muted-foreground">
                            {m.history[0].year}–{m.history[m.history.length - 1].year} percentile trend
                          </p>
                        </div>
                      )}
                      {open && (
                        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                          {m.history?.length > 0 && (
                            <div className="text-xs space-y-0.5">
                              <p className="font-medium">History (percentile from best)</p>
                              {m.history.map((h) => (
                                <div key={h.year} className="flex justify-between tabular-nums">
                                  <span>{h.year}</span>
                                  <span>
                                    {h.ukValue.toFixed(1)} · {formatPct(h.percentileFromBest)} · {h.ragStatus}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                            {m.peers
                              .filter((p) => lens === "g20" || ["CAN", "FRA", "DEU", "ITA", "JPN", "GBR", "USA"].includes(p.iso3))
                              .slice(0, 20)
                              .map((p, idx) => (
                                <div
                                  key={p.iso3}
                                  className={cn(
                                    "flex justify-between gap-2 py-0.5",
                                    p.iso3 === "GBR" && "font-semibold",
                                  )}
                                >
                                  <span>{idx + 1}. {p.name}</span>
                                  <span className="tabular-nums">{p.value.toFixed(1)} ({p.year})</span>
                                </div>
                              ))}
                          </div>
                          {m.coverageNote && (
                            <p className="text-xs text-amber-800 dark:text-amber-300 flex gap-1">
                              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              {m.coverageNote}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Feasibility gaps
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              These UK scorecards do not yet have a credible annual G20 peer series. Worth
              pursuing over time, but not forced into a weak comparison.
            </p>
            <div className="space-y-2">
              {data.gaps.map((g) => (
                <div key={g.ukMetricKey} className="rounded-md border px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-xs text-muted-foreground">{g.category}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{g.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
