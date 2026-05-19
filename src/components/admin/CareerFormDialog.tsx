import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const TECH_TAG_PRESETS = [
  "software_engineering", "data_science", "ai_ml", "cybersecurity", "cloud",
  "devops", "embedded", "robotics", "product_design", "data_engineering",
  "ml_ops", "security_engineering", "web_development", "mobile_development", "qa_testing",
];

const EDUCATION_LEVELS = ["high_school", "certificate", "associate", "bachelor", "graduate"] as const;
const GROWTH_OUTLOOKS = ["declining", "stable", "growing", "high_growth"] as const;
const STATUSES = ["draft", "pending", "published", "changes_requested"] as const;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export type CareerEditing = {
  id?: string;
  title?: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  industry?: string | null;
  median_salary?: number | null;
  growth_outlook?: string | null;
  education_level?: string | null;
  skills?: string[];
  tech_tags?: string[];
  primary_cluster_id?: string | null;
  primary_sub_cluster_id?: string | null;
  status?: string;
} | null;

export function CareerFormDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: CareerEditing;
}) {
  const qc = useQueryClient();
  const clusters = useQuery({
    queryKey: ["acte_clusters_grouped"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acte_clusters")
        .select("id, name, slug, display_order, grouping_id, acte_cluster_groupings(id, name, color_hex, is_cross_cutting, display_order)")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const subClusters = useQuery({
    queryKey: ["acte_sub_clusters_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acte_sub_clusters")
        .select("id, name, slug, cluster_id, display_order")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [industry, setIndustry] = useState("");
  const [salary, setSalary] = useState<string>("");
  const [growth, setGrowth] = useState<string>("stable");
  const [education, setEducation] = useState<string>("high_school");
  const [status, setStatus] = useState<string>("draft");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [techTags, setTechTags] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [primaryClusterId, setPrimaryClusterId] = useState<string>("");
  const [secondaryClusterIds, setSecondaryClusterIds] = useState<string[]>([]);
  const [primarySubClusterId, setPrimarySubClusterId] = useState<string>("");
  const [secondarySubClusterIds, setSecondarySubClusterIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Hydrate when editing changes
  useEffect(() => {
    if (!open) return;
    const e = editing ?? {};
    setTitle(e.title ?? "");
    setSlug(e.slug ?? "");
    setSlugTouched(!!e.slug);
    setShortDesc(e.short_description ?? "");
    setDesc(e.description ?? "");
    setIndustry(e.industry ?? "");
    setSalary(e.median_salary != null ? String(e.median_salary) : "");
    setGrowth(e.growth_outlook ?? "stable");
    setEducation(e.education_level ?? "high_school");
    setStatus(e.status ?? "draft");
    setSkills(e.skills ?? []);
    setTechTags(e.tech_tags ?? []);
    setPrimaryClusterId(e.primary_cluster_id ?? "");
    setPrimarySubClusterId(e.primary_sub_cluster_id ?? "");
    setSkillInput(""); setTechInput("");
    // Load secondary tags if editing
    if (e.id) {
      supabase.from("career_cluster_tags").select("cluster_id, is_primary").eq("career_id", e.id).then(({ data }) => {
        const secondary = (data ?? []).filter((r: any) => !r.is_primary).map((r: any) => r.cluster_id as string);
        setSecondaryClusterIds(secondary);
      });
      supabase.from("career_sub_cluster_tags").select("sub_cluster_id, is_primary").eq("career_id", e.id).then(({ data }) => {
        const secondary = (data ?? []).filter((r: any) => !r.is_primary).map((r: any) => r.sub_cluster_id as string);
        setSecondarySubClusterIds(secondary);
      });
    } else {
      setSecondaryClusterIds([]);
      setSecondarySubClusterIds([]);
    }
  }, [editing, open]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const groupedClusters = useMemo(() => {
    const rows = clusters.data ?? [];
    const map = new Map<string, { name: string; color: string; isCross: boolean; order: number; items: any[] }>();
    for (const r of rows as any[]) {
      const g = r.acte_cluster_groupings;
      if (!g) continue;
      const key = g.id;
      if (!map.has(key)) map.set(key, { name: g.name, color: g.color_hex, isCross: !!g.is_cross_cutting, order: g.display_order ?? 99, items: [] });
      map.get(key)!.items.push(r);
    }
    return Array.from(map.values()).sort((a, b) => (a.isCross === b.isCross ? a.order - b.order : a.isCross ? 1 : -1));
  }, [clusters.data]);

  const clusterById = useMemo(() => {
    const m = new Map<string, any>();
    for (const c of (clusters.data ?? []) as any[]) m.set(c.id, c);
    return m;
  }, [clusters.data]);

  const toggleSecondary = (id: string) => {
    setSecondaryClusterIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSecondarySub = (id: string) => {
    setSecondarySubClusterIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Sub-clusters for the currently selected primary cluster
  const pathwaysForPrimary = useMemo(() => {
    return (subClusters.data ?? []).filter((s: any) => s.cluster_id === primaryClusterId);
  }, [subClusters.data, primaryClusterId]);

  // Reset primary sub-cluster if it no longer belongs to the new primary cluster
  useEffect(() => {
    if (!primarySubClusterId) return;
    const stillValid = pathwaysForPrimary.some((p: any) => p.id === primarySubClusterId);
    if (!stillValid) setPrimarySubClusterId("");
  }, [primaryClusterId, pathwaysForPrimary, primarySubClusterId]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };
  const addTech = (val?: string) => {
    const v = (val ?? techInput).trim();
    if (!v) return;
    if (!techTags.includes(v)) setTechTags([...techTags, v]);
    setTechInput("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!slug.trim()) return toast.error("Slug is required");
    if (!primaryClusterId) return toast.error("Primary cluster is required");

    setSaving(true);
    const payload: any = {
      title: title.trim(),
      slug: slug.trim(),
      short_description: shortDesc.trim() || null,
      description: desc.trim() || null,
      industry: industry.trim() || null,
      median_salary: salary ? Number(salary) : null,
      growth_outlook: growth,
      education_level: education,
      status,
      skills,
      tech_tags: techTags,
      primary_cluster_id: primaryClusterId,
      primary_sub_cluster_id: primarySubClusterId || null,
    };

    let careerId = editing?.id;
    if (careerId) {
      const { error } = await supabase.from("careers").update(payload).eq("id", careerId);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("careers").insert(payload).select("id").single();
      if (error || !data) { setSaving(false); return toast.error(error?.message ?? "Failed to create"); }
      careerId = data.id;
    }

    // Sync career_cluster_tags: delete all then re-insert
    if (careerId) {
      await supabase.from("career_cluster_tags").delete().eq("career_id", careerId);
      const rows = [
        { career_id: careerId, cluster_id: primaryClusterId, is_primary: true },
        ...secondaryClusterIds
          .filter(id => id !== primaryClusterId)
          .map(id => ({ career_id: careerId!, cluster_id: id, is_primary: false })),
      ];
      const { error: tagErr } = await supabase.from("career_cluster_tags").insert(rows);
      if (tagErr) { setSaving(false); return toast.error(`Saved career, but tags failed: ${tagErr.message}`); }

      // Sync sub-cluster (pathway) tags
      await supabase.from("career_sub_cluster_tags").delete().eq("career_id", careerId);
      const subRows: { career_id: string; sub_cluster_id: string; is_primary: boolean }[] = [];
      if (primarySubClusterId) {
        subRows.push({ career_id: careerId, sub_cluster_id: primarySubClusterId, is_primary: true });
      }
      for (const id of secondarySubClusterIds) {
        if (id === primarySubClusterId) continue;
        subRows.push({ career_id: careerId, sub_cluster_id: id, is_primary: false });
      }
      if (subRows.length > 0) {
        const { error: subErr } = await supabase.from("career_sub_cluster_tags").insert(subRows);
        if (subErr) { setSaving(false); return toast.error(`Saved career, but pathways failed: ${subErr.message}`); }
      }
    }

    setSaving(false);
    toast.success(editing?.id ? "Career updated" : "Career created");
    qc.invalidateQueries({ queryKey: ["admin-careers"] });
    qc.invalidateQueries({ queryKey: ["careers"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing?.id ? "Edit career" : "New career"}</DialogTitle>
          <DialogDescription>Set the basics, the ACTE cluster, and optional tech tags.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="ctitle">Title</Label>
              <Input id="ctitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cslug">Slug</Label>
              <Input id="cslug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} required />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cshort">Short description</Label>
              <Textarea id="cshort" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea id="cdesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
            </div>
            <div>
              <Label htmlFor="cind">Industry (freeform)</Label>
              <Input id="cind" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="csal">Median salary (USD)</Label>
              <Input id="csal" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div>
              <Label>Growth outlook</Label>
              <Select value={growth} onValueChange={setGrowth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GROWTH_OUTLOOKS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Education level</Label>
              <Select value={education} onValueChange={setEducation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EDUCATION_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills */}
          <div>
            <Label>Skills</Label>
            <div className="flex gap-2 mt-1">
              <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter" />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} aria-label={`Remove ${s}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Primary cluster */}
          <div>
            <Label>
              Primary career cluster <span className="text-destructive">*</span>
            </Label>
            <Select value={primaryClusterId} onValueChange={setPrimaryClusterId}>
              <SelectTrigger><SelectValue placeholder={clusters.isLoading ? "Loading…" : "Select a cluster"} /></SelectTrigger>
              <SelectContent className="max-h-80">
                {groupedClusters.map(g => (
                  <SelectGroup key={g.name}>
                    <SelectLabel className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.isCross ? "Cross-cutting" : g.name}
                    </SelectLabel>
                    {g.items.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        <span className="ml-2 text-xs text-muted-foreground">{g.name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary clusters */}
          <div>
            <Label>Also relevant in (optional)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Pick any additional clusters this career intersects with. Cross-cutting clusters like Digital Technology often apply to multiple industries.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 max-h-56 overflow-y-auto">
              {(clusters.data ?? []).filter((c: any) => c.id !== primaryClusterId).map((c: any) => {
                const checked = secondaryClusterIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggleSecondary(c.id)} />
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.acte_cluster_groupings?.color_hex }} />
                    <span className="truncate">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Primary pathway (depends on primary cluster) */}
          <div>
            <Label>Primary pathway (optional)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Minnesota Programs of Study within the selected primary cluster.
            </p>
            <Select
              value={primarySubClusterId || "__none__"}
              onValueChange={(v) => setPrimarySubClusterId(v === "__none__" ? "" : v)}
              disabled={!primaryClusterId || pathwaysForPrimary.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!primaryClusterId ? "Select a primary cluster first" : pathwaysForPrimary.length === 0 ? "No pathways yet" : "Select a pathway"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {pathwaysForPrimary.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary pathways (any cluster) */}
          <div>
            <Label>Also in these pathways (optional)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Cross-cluster pathways are allowed.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 max-h-56 overflow-y-auto">
              {(subClusters.data ?? [])
                .filter((s: any) => s.id !== primarySubClusterId)
                .map((s: any) => {
                  const checked = secondarySubClusterIds.includes(s.id);
                  const parent = (clusters.data ?? []).find((c: any) => c.id === s.cluster_id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={checked} onCheckedChange={() => toggleSecondarySub(s.id)} />
                      <span className="truncate">{s.name}</span>
                      {parent && <span className="text-[10px] text-muted-foreground truncate">· {parent.name}</span>}
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Tech tags */}
          <div>
            <Label>Tech tags (CS/AI focus)</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Tag any technical specialties. Used to filter for the CS/AI surface.</p>
            <div className="flex gap-2">
              <Input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                placeholder="Add custom tech tag and press Enter" />
              <Button type="button" variant="outline" onClick={() => addTech()}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TECH_TAG_PRESETS.filter(t => !techTags.includes(t)).map(t => (
                <button key={t} type="button" onClick={() => addTech(t)}
                  className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                  + {t}
                </button>
              ))}
            </div>
            {techTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {techTags.map(t => (
                  <Badge key={t} className="gap-1">
                    {t}
                    <button type="button" onClick={() => setTechTags(techTags.filter(x => x !== t))} aria-label={`Remove ${t}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing?.id ? "Save changes" : "Create career"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}