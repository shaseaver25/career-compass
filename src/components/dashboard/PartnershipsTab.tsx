import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, GraduationCap } from "lucide-react";
import { MultiCheck } from "./MultiCheck";
import { SCHOOL_TYPES, RELATIONSHIP_TYPES } from "./enums";
import { toast } from "sonner";

const blank = {
  school_name: "", school_type: "high_school" as string,
  city: "", state: "MN", relationship_types: [] as string[],
};

export function PartnershipsTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-partnerships", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_partnerships").select("*").eq("company_id", companyId)
        .order("school_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) setForm({
      school_name: editing.school_name ?? "",
      school_type: editing.school_type ?? "high_school",
      city: editing.city ?? "",
      state: editing.state ?? "MN",
      relationship_types: editing.relationship_types ?? [],
    });
    else setForm({ ...blank });
  }, [open, editing]);

  const onSave = async () => {
    if (!form.school_name.trim()) { toast.error("School name is required"); return; }
    if (!form.city.trim() || !form.state.trim()) { toast.error("City and state required"); return; }
    if (form.relationship_types.length === 0) { toast.error("Select at least one relationship type"); return; }

    setSaving(true);
    try {
      const payload: any = {
        company_id: companyId,
        school_name: form.school_name.trim(),
        school_type: form.school_type as any,
        city: form.city.trim(),
        state: form.state.trim(),
        relationship_types: form.relationship_types as any,
      };
      if (editing) {
        const { error } = await supabase.from("school_partnerships").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("school_partnerships").insert(payload);
        if (error) throw error;
      }
      toast.success(editing ? "Partnership updated" : "Partnership added");
      qc.invalidateQueries({ queryKey: ["my-partnerships", companyId] });
      setOpen(false); setEditing(null);
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> School partnerships</h2>
          <p className="text-sm text-muted-foreground">Schools and colleges your company partners with.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1.5" /> New partnership</Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No partnerships yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {rows.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="font-semibold">{p.school_name}</div>
                <div className="text-xs text-muted-foreground">{SCHOOL_TYPES.find(s => s.value === p.school_type)?.label} · {p.city}, {p.state}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(p.relationship_types ?? []).map((r: string) => (
                    <Badge key={r} variant="secondary">{RELATIONSHIP_TYPES.find(x => x.value === r)?.label ?? r}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setOpen(true); }}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit partnership" : "New partnership"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>School name *</Label>
              <Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
            </div>
            <div>
              <Label>School type *</Label>
              <Select value={form.school_type} onValueChange={(v) => setForm({ ...form, school_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>State *</Label>
                <Input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Relationship types *</Label>
              <MultiCheck options={RELATIONSHIP_TYPES} value={form.relationship_types} onChange={(v) => setForm({ ...form, relationship_types: v })} columns={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? "Save changes" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}