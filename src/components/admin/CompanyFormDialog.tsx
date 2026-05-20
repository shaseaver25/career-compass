import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTopLevelCompanies } from "@/lib/queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export type CompanyEditing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  logo_emoji: string | null;
  parent_company_id: string | null;
  status: "draft" | "pending" | "published" | "changes_requested";
} | null;

const NONE = "__none__";

export function CompanyFormDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: CompanyEditing }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NonNullable<CompanyEditing> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(editing ? { ...editing } : null); }, [editing, open]);

  const topLevel = useQuery({
    queryKey: ["admin-top-level-companies"],
    queryFn: fetchTopLevelCompanies,
    enabled: open,
  });

  if (!form) return null;

  const parentOptions = (topLevel.data ?? []).filter((c: any) => c.id !== form.id);

  const onSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: form.name,
      slug: form.slug,
      description: form.description,
      industry: form.industry,
      website: form.website,
      logo_emoji: form.logo_emoji,
      parent_company_id: form.parent_company_id,
    }).eq("id", form.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Company updated");
    qc.invalidateQueries({ queryKey: ["admin-companies-pending"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
    qc.invalidateQueries({ queryKey: ["admin-top-level-companies"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit company</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Parent organization (optional)</Label>
            <Select
              value={form.parent_company_id ?? NONE}
              onValueChange={(v) => setForm({ ...form, parent_company_id: v === NONE ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="No parent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— No parent —</SelectItem>
                {parentOptions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Use this when this company is a department or subsidiary of a larger organization (e.g. MN.IT Services is under State of Minnesota).</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Industry</Label>
            <Input value={form.industry ?? ""} onChange={(e) => setForm({ ...form, industry: e.target.value || null })} />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-[1fr_120px] sm:gap-3">
            <div className="grid gap-1.5">
              <Label>Website</Label>
              <Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value || null })} placeholder="https://…" />
            </div>
            <div className="grid gap-1.5">
              <Label>Emoji</Label>
              <Input value={form.logo_emoji ?? ""} onChange={(e) => setForm({ ...form, logo_emoji: e.target.value || null })} placeholder="🏢" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value || null })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}