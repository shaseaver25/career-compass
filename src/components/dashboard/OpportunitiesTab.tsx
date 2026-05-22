import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Briefcase } from "lucide-react";
import { OpportunityFormDialog } from "./OpportunityFormDialog";
import { OPPORTUNITY_STATUSES, OPPORTUNITY_TYPES, WORK_FORMATS } from "./enums";

const labelOf = (arr: readonly { value: string; label: string }[], v: string) =>
  arr.find(x => x.value === v)?.label ?? v;

export function OpportunitiesTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ["my-opportunities", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, opportunity_sub_cluster_tags(sub_cluster_id, is_primary)")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const grouped: Record<string, any[]> = {};
  for (const s of OPPORTUNITY_STATUSES) grouped[s.value] = [];
  for (const o of opps) (grouped[o.status] ??= []).push(o);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Opportunities</h2>
          <p className="text-sm text-muted-foreground">Internships, apprenticeships, job shadows, and entry-level roles open to students.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> New opportunity
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : opps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No opportunities yet. Create your first one to be discoverable by students.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {OPPORTUNITY_STATUSES.map((s) => grouped[s.value].length > 0 && (
            <div key={s.value}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{s.label} <span className="text-muted-foreground/60">({grouped[s.value].length})</span></h3>
              <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
                {grouped[s.value].map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{o.title}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="secondary">{labelOf(OPPORTUNITY_TYPES, o.type)}</Badge>
                        <Badge variant="outline">{labelOf(WORK_FORMATS, o.format)}</Badge>
                        {o.application_deadline && (
                          <Badge variant="outline">Apply by {new Date(o.application_deadline).toLocaleDateString()}</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(o); setOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <OpportunityFormDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        companyId={companyId}
        editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["my-opportunities", companyId] })}
      />
    </div>
  );
}