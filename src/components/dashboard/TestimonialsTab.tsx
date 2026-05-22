import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, MessageSquareQuote, Upload, X } from "lucide-react";
import { toast } from "sonner";

const blank = {
  person_name: "", school_or_program: "", year: new Date().getFullYear(),
  role_held: "", quote: "", photo_url: "", linkedin_url: "",
  consent_on_file: false, display_order: 0,
};

export function TestimonialsTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-testimonials", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials").select("*")
        .eq("company_id", companyId)
        .order("display_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    setFile(null);
    if (editing) setForm({ ...blank, ...editing });
    else setForm({ ...blank });
  }, [open, editing]);

  const onSave = async () => {
    if (!user) return;
    if (!form.person_name.trim()) { toast.error("Name is required"); return; }
    if (!form.school_or_program.trim()) { toast.error("School or program is required"); return; }
    if (!form.role_held.trim()) { toast.error("Role held is required"); return; }
    if (!form.quote.trim()) { toast.error("Quote is required"); return; }
    if (form.quote.length > 400) { toast.error("Quote must be ≤400 chars"); return; }

    setSaving(true);
    try {
      let photo_url = form.photo_url || null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("testimonial-photos").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("testimonial-photos").getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const payload: any = {
        company_id: companyId,
        person_name: form.person_name.trim(),
        school_or_program: form.school_or_program.trim(),
        year: Number(form.year),
        role_held: form.role_held.trim(),
        quote: form.quote.trim(),
        photo_url,
        linkedin_url: form.linkedin_url.trim() || null,
        consent_on_file: form.consent_on_file,
        display_order: Number(form.display_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("testimonials").insert(payload);
        if (error) throw error;
      }
      toast.success(editing ? "Testimonial updated" : "Testimonial added");
      qc.invalidateQueries({ queryKey: ["my-testimonials", companyId] });
      setOpen(false); setEditing(null);
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquareQuote className="h-5 w-5 text-primary" /> Testimonials</h2>
          <p className="text-sm text-muted-foreground">Quotes from past interns and employees about working at your company.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1.5" /> New testimonial</Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted-foreground">No testimonials yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((t: any) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm italic">"{t.quote}"</p>
              <div className="mt-2 text-sm">
                <div className="font-semibold">{t.person_name}</div>
                <div className="text-xs text-muted-foreground">{t.role_held} · {t.school_or_program} · {t.year}</div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit testimonial" : "New testimonial"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
            </div>
            <div>
              <Label>School or program *</Label>
              <Input value={form.school_or_program} onChange={(e) => setForm({ ...form, school_or_program: e.target.value })} placeholder="Eastview HS, Class of '24" />
            </div>
            <div>
              <Label>Year *</Label>
              <Input type="number" min={2000} max={2100} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Role held *</Label>
              <Input value={form.role_held} onChange={(e) => setForm({ ...form, role_held: e.target.value })} placeholder="Software Engineering Intern, Summer 2024" />
            </div>
            <div className="md:col-span-2">
              <Label>Quote *</Label>
              <Textarea rows={3} maxLength={400} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">{form.quote.length}/400</p>
            </div>
            <div className="md:col-span-2">
              <Label>Photo</Label>
              {file ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-surface p-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-md border border-dashed border-border bg-surface p-3 text-center text-sm text-muted-foreground hover:bg-accent">
                  <Upload className="h-4 w-4 inline mr-1" /> Upload photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {form.photo_url && !file && (
                <p className="text-xs text-muted-foreground mt-1 truncate">Current: {form.photo_url}</p>
              )}
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input type="url" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <div>
              <Label>Display order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent">
                <Checkbox checked={form.consent_on_file} onCheckedChange={(v) => setForm({ ...form, consent_on_file: !!v })} />
                <span className="text-sm">I have written consent from this person — and their parent or guardian if they were under 18 when the quote was given.</span>
              </label>
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