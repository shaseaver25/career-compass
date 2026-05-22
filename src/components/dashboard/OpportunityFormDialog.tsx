import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiCheck, StringList } from "./MultiCheck";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STATUSES, WORK_FORMATS, GRADE_LEVELS } from "./enums";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SubTag = { sub_cluster_id: string; is_primary: boolean };

const blank = {
  title: "",
  type: "internship" as string,
  grade_level_eligibility: [] as string[],
  format: "in_person" as string,
  location_city: "",
  location_state: "MN",
  duration: "",
  hours_per_week_min: "" as string | number,
  hours_per_week_max: "" as string | number,
  paid: true,
  compensation: "",
  description: "",
  responsibilities: [] as string[],
  preferred_skills: [] as string[],
  requirements: [] as string[],
  application_url: "",
  application_deadline: "",
  start_date: "",
  positions_available: "" as string | number,
  status: "draft" as string,
};

export function OpportunityFormDialog({
  open, onOpenChange, companyId, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  editing: any | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...blank });
  const [subTags, setSubTags] = useState<SubTag[]>([]);
  const [saving, setSaving] = useState(false);

  // Sub-clusters grouped by cluster
  const { data: subs = [] } = useQuery({
    queryKey: ["acte-subs-grouped"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acte_sub_clusters")
        .select("id, name, cluster_id, acte_clusters!inner(name, display_order)")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title ?? "",
        type: editing.type ?? "internship",
        grade_level_eligibility: editing.grade_level_eligibility ?? [],
        format: editing.format ?? "in_person",
        location_city: editing.location_city ?? "",
        location_state: editing.location_state ?? "MN",
        duration: editing.duration ?? "",
        hours_per_week_min: editing.hours_per_week_min ?? "",
        hours_per_week_max: editing.hours_per_week_max ?? "",
        paid: editing.paid ?? true,
        compensation: editing.compensation ?? "",
        description: editing.description ?? "",
        responsibilities: editing.responsibilities ?? [],
        preferred_skills: editing.preferred_skills ?? [],
        requirements: editing.requirements ?? [],
        application_url: editing.application_url ?? "",
        application_deadline: editing.application_deadline ?? "",
        start_date: editing.start_date ?? "",
        positions_available: editing.positions_available ?? "",
        status: editing.status ?? "draft",
      });
      setSubTags(editing.opportunity_sub_cluster_tags ?? []);
    } else {
      setForm({ ...blank });
      setSubTags([]);
    }
  }, [open, editing]);

  const toggleSub = (id: string) => {
    setSubTags((prev) => {
      const exists = prev.find(t => t.sub_cluster_id === id);
      if (exists) return prev.filter(t => t.sub_cluster_id !== id);
      const next = [...prev, { sub_cluster_id: id, is_primary: prev.length === 0 }];
      return next;
    });
  };
  const setPrimary = (id: string) => {
    setSubTags((prev) => prev.map(t => ({ ...t, is_primary: t.sub_cluster_id === id })));
  };

  // Group subs by cluster name
  const grouped: Record<string, { id: string; name: string }[]> = {};
  for (const s of subs as any[]) {
    const k = s.acte_clusters?.name ?? "Other";
    (grouped[k] ??= []).push({ id: s.id, name: s.name });
  }

  const onSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.duration.trim()) { toast.error("Duration is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (!form.application_url.trim()) { toast.error("Application URL is required"); return; }
    if (form.grade_level_eligibility.length === 0) { toast.error("Select at least one grade level"); return; }
    if (form.format !== "remote" && (!form.location_city.trim() || !form.location_state.trim())) {
      toast.error("City and state are required for non-remote roles"); return;
    }
    if (form.paid && !form.compensation.trim()) { toast.error("Compensation is required for paid roles"); return; }
    if (form.title.length > 100) { toast.error("Title must be ≤100 chars"); return; }
    if (form.description.length > 1500) { toast.error("Description must be ≤1500 chars"); return; }

    setSaving(true);
    try {
      const payload: any = {
        company_id: companyId,
        title: form.title.trim(),
        type: form.type as any,
        grade_level_eligibility: form.grade_level_eligibility as any,
        format: form.format as any,
        location_city: form.format === "remote" ? null : (form.location_city.trim() || null),
        location_state: form.format === "remote" ? null : (form.location_state.trim() || null),
        duration: form.duration.trim(),
        hours_per_week_min: form.hours_per_week_min === "" ? null : Number(form.hours_per_week_min),
        hours_per_week_max: form.hours_per_week_max === "" ? null : Number(form.hours_per_week_max),
        paid: form.paid,
        compensation: form.paid ? form.compensation.trim() : null,
        description: form.description.trim(),
        responsibilities: form.responsibilities.filter(s => s.trim()),
        preferred_skills: form.preferred_skills.filter(s => s.trim()),
        requirements: form.requirements.filter(s => s.trim()),
        application_url: form.application_url.trim(),
        application_deadline: form.application_deadline || null,
        start_date: form.start_date || null,
        positions_available: form.positions_available === "" ? null : Number(form.positions_available),
        status: form.status as any,
      };

      let oppId = editing?.id as string | undefined;
      if (oppId) {
        const { error } = await supabase.from("opportunities").update(payload).eq("id", oppId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("opportunities").insert(payload).select("id").single();
        if (error) throw error;
        oppId = data.id;
      }

      // Sync sub-cluster tags
      await supabase.from("opportunity_sub_cluster_tags").delete().eq("opportunity_id", oppId!);
      if (subTags.length > 0) {
        const hasPrimary = subTags.some(t => t.is_primary);
        const rows = subTags.map((t, i) => ({
          opportunity_id: oppId!,
          sub_cluster_id: t.sub_cluster_id,
          is_primary: hasPrimary ? t.is_primary : i === 0,
        }));
        const { error } = await supabase.from("opportunity_sub_cluster_tags").insert(rows);
        if (error) throw error;
      }

      toast.success(editing ? "Opportunity updated" : "Opportunity created");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Could not save opportunity");
    } finally {
      setSaving(false);
    }
  };

  const selectedSubNames = subTags.map(t => {
    const found = (subs as any[]).find(s => s.id === t.sub_cluster_id);
    return found ? { id: t.sub_cluster_id, name: found.name, primary: t.is_primary } : null;
  }).filter(Boolean) as { id: string; name: string; primary: boolean }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit opportunity" : "New opportunity"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="o-title">Title *</Label>
            <Input id="o-title" maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <Label>Type *</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Format *</Label>
            <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORK_FORMATS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.format !== "remote" && (
            <div className="md:col-span-2 grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label htmlFor="o-city">Location city *</Label>
                <Input id="o-city" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="o-state">State *</Label>
                <Input id="o-state" maxLength={2} value={form.location_state} onChange={(e) => setForm({ ...form, location_state: e.target.value.toUpperCase() })} />
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <Label>Grade level eligibility *</Label>
            <MultiCheck options={GRADE_LEVELS} value={form.grade_level_eligibility} onChange={(v) => setForm({ ...form, grade_level_eligibility: v })} columns={3} />
          </div>

          <div>
            <Label htmlFor="o-duration">Duration *</Label>
            <Input id="o-duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="10 weeks, summer 2026, school year…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="o-hmin">Hours/week min</Label>
              <Input id="o-hmin" type="number" min={0} value={form.hours_per_week_min} onChange={(e) => setForm({ ...form, hours_per_week_min: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="o-hmax">Hours/week max</Label>
              <Input id="o-hmax" type="number" min={0} value={form.hours_per_week_max} onChange={(e) => setForm({ ...form, hours_per_week_max: e.target.value })} />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="o-paid" className="font-semibold">Paid</Label>
              <p className="text-xs text-muted-foreground">Compensation required if on.</p>
            </div>
            <Switch id="o-paid" checked={form.paid} onCheckedChange={(v) => setForm({ ...form, paid: v })} />
          </div>

          {form.paid && (
            <div className="md:col-span-2">
              <Label htmlFor="o-comp">Compensation *</Label>
              <Input id="o-comp" value={form.compensation} onChange={(e) => setForm({ ...form, compensation: e.target.value })} placeholder="$22/hr, $5k stipend, etc." />
            </div>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="o-desc">Description *</Label>
            <Textarea id="o-desc" rows={4} maxLength={1500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">{form.description.length}/1500</p>
          </div>

          <div className="md:col-span-2">
            <Label>Responsibilities</Label>
            <StringList value={form.responsibilities} onChange={(v) => setForm({ ...form, responsibilities: v })} placeholder="What they'll actually do" />
          </div>
          <div className="md:col-span-2">
            <Label>Preferred skills</Label>
            <StringList value={form.preferred_skills} onChange={(v) => setForm({ ...form, preferred_skills: v })} placeholder="Python, CAD, customer service…" />
          </div>
          <div className="md:col-span-2">
            <Label>Requirements</Label>
            <StringList value={form.requirements} onChange={(v) => setForm({ ...form, requirements: v })} placeholder="Driver's license, 16+, etc." />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="o-url">Application URL *</Label>
            <Input id="o-url" type="url" value={form.application_url} onChange={(e) => setForm({ ...form, application_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="o-deadline">Application deadline</Label>
            <Input id="o-deadline" type="date" value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="o-start">Start date</Label>
            <Input id="o-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="o-pos">Positions available</Label>
            <Input id="o-pos" type="number" min={1} value={form.positions_available} onChange={(e) => setForm({ ...form, positions_available: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_STATUSES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>ACTE sub-cluster tags</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  {selectedSubNames.length === 0 ? "Select sub-clusters…" : `${selectedSubNames.length} selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] p-0" align="start">
                <ScrollArea className="h-80">
                  <div className="p-3 space-y-3">
                    {Object.entries(grouped).map(([cluster, items]) => (
                      <div key={cluster}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{cluster}</div>
                        <div className="space-y-1">
                          {items.map((it) => {
                            const checked = subTags.some(t => t.sub_cluster_id === it.id);
                            return (
                              <label key={it.id} className="flex items-center gap-2 text-sm rounded px-2 py-1 hover:bg-accent cursor-pointer">
                                <Checkbox checked={checked} onCheckedChange={() => toggleSub(it.id)} />
                                <span>{it.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {selectedSubNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedSubNames.map((s) => (
                  <Badge
                    key={s.id}
                    variant={s.primary ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setPrimary(s.id)}
                    title={s.primary ? "Primary" : "Click to mark as primary"}
                  >
                    {s.name}{s.primary && " ★"}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Click a tag to mark it as primary.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? "Save changes" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}