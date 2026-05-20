import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type FilterKey = "all" | "matched" | "unmatched" | "removed";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; variant: any }> = {
    success: { label: "Success", variant: "default" },
    skipped_unchanged: { label: "No change", variant: "secondary" },
    error: { label: "Error", variant: "destructive" },
  };
  const m = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export const DeedDataTab = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const lastSync = useQuery({
    queryKey: ["deed-last-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deed_sync_log")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const syncLog = useQuery({
    queryKey: ["deed-sync-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deed_sync_log")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const employers = useQuery({
    queryKey: ["deed-employers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deed_employers")
        .select("id, rank, organization, mn_employees, removed_from_source, matched_company_id, acte_clusters(name, acte_cluster_groupings(color_hex)), companies!deed_employers_matched_company_id_fkey(slug)")
        .order("rank");
      if (error) throw error;
      return data ?? [];
    },
  });

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-deed-employers", {
        headers: { "x-triggered-by": `manual:${user?.email ?? "unknown"}` },
      });
      if (error) throw error;
      const d: any = data;
      if (d.status === "success") {
        toast.success(`Sync complete: +${d.added} added · ${d.updated} updated · ${d.removed} removed · ${d.unchanged} unchanged`);
      } else if (d.status === "skipped_unchanged") {
        toast.info("DEED file unchanged since last sync.");
      } else {
        toast.error(`Sync error: ${d.error ?? "unknown"}`);
      }
      qc.invalidateQueries({ queryKey: ["deed-last-sync"] });
      qc.invalidateQueries({ queryKey: ["deed-sync-log"] });
      qc.invalidateQueries({ queryKey: ["deed-employers"] });
    } catch (e: any) {
      toast.error(e.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const filtered = (employers.data ?? []).filter((e: any) => {
    if (filter === "matched") return e.matched_company_id && !e.removed_from_source;
    if (filter === "unmatched") return !e.matched_company_id && !e.removed_from_source;
    if (filter === "removed") return e.removed_from_source;
    return true;
  });

  return (
    <div className="grid gap-6">
      {/* Last sync card */}
      <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-lg">DEED Top Employers sync</h2>
            <p className="text-sm text-muted-foreground">
              Pulls Minnesota's Top Companies & Employers spreadsheet from mn.gov/deed and mirrors it into the catalog.
            </p>
          </div>
          <Button onClick={runSync} disabled={syncing}>
            {syncing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            Sync DEED now
          </Button>
        </div>
        {lastSync.data ? (
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Last run</div>
              <div className="font-medium">{fmtRelative(lastSync.data.ran_at)}</div>
              <div className="text-xs text-muted-foreground">{lastSync.data.triggered_by}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Status</div>
              <StatusBadge status={lastSync.data.status} />
            </div>
            <div><div className="text-xs uppercase text-muted-foreground">Added</div><div className="font-medium">{lastSync.data.rows_added}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Updated</div><div className="font-medium">{lastSync.data.rows_updated}</div></div>
            <div><div className="text-xs uppercase text-muted-foreground">Removed</div><div className="font-medium">{lastSync.data.rows_removed}</div></div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">No sync runs recorded yet.</div>
        )}
      </article>

      {/* Employers list */}
      <article className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 border-b border-border flex-wrap">
          <div>
            <h3 className="font-bold">DEED employers</h3>
            <p className="text-sm text-muted-foreground">{filtered.length} of {employers.data?.length ?? 0} shown</p>
          </div>
          <div className="flex gap-1.5">
            {(["all", "matched", "unmatched", "removed"] as FilterKey[]).map((k) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                {k === "all" ? "All" : k === "matched" ? "In catalog" : k === "unmatched" ? "Not matched" : "Removed from source"}
              </Button>
            ))}
          </div>
        </div>
        {employers.isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">#</th>
                  <th className="text-left px-4 py-2.5 font-medium">Organization</th>
                  <th className="text-right px-4 py-2.5 font-medium">MN employees</th>
                  <th className="text-left px-4 py-2.5 font-medium">Suggested cluster</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => {
                  const color = e.acte_clusters?.acte_cluster_groupings?.color_hex;
                  return (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{e.rank}</td>
                      <td className="px-4 py-3 font-medium">
                        {e.companies?.slug ? (
                          <Link to={`/companies/${e.companies.slug}`} className="hover:text-primary inline-flex items-center gap-1">
                            {e.organization} <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : e.organization}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{e.mn_employees.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {e.acte_clusters?.name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            {e.acte_clusters.name}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {e.removed_from_source ? <Badge variant="destructive">Removed from source</Badge>
                          : e.matched_company_id ? <Badge variant="default">In catalog</Badge>
                          : <Badge variant="outline">Not matched</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* Sync log */}
      <article className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold">Recent sync log</h3>
          <p className="text-sm text-muted-foreground">Last 10 sync runs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">When</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Counts</th>
                <th className="text-left px-4 py-2.5 font-medium">Triggered by</th>
                <th className="text-right px-4 py-2.5 font-medium">Duration</th>
                <th className="text-left px-4 py-2.5 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {(syncLog.data ?? []).map((row: any) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">{fmtRelative(row.ran_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-xs">+{row.rows_added} · ~{row.rows_updated} · −{row.rows_removed} · ={row.rows_unchanged}</td>
                  <td className="px-4 py-3 text-xs">{row.triggered_by}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs">{row.duration_ms ? `${row.duration_ms}ms` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-destructive max-w-xs truncate" title={row.error_message ?? undefined}>{row.error_message ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};