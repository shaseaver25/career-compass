import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { COMPANY_SIZES } from "./enums";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const COMPANY_SIZE_NONE = "__unset__";

export function CompanyProfileTab({ company }: { company: any }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // existing
    name: "", description: "", industry: "", website: "", logo_emoji: "🏢",
    city: "", state: "",
    // public-facing
    tagline: "",
    cs_ai_description: "",
    public_careers_url: "",
    size: COMPANY_SIZE_NONE as string,
    hq_city: "",
    hq_state: "MN",
    // contacts
    school_relations_contact_name: "",
    school_relations_contact_email: "",
    internal_contact_name: "",
    internal_contact_email: "",
    internal_contact_phone: "",
    // attestations
    attestation_minor_safety: false,
    attestation_terms: false,
  });

  useEffect(() => {
    if (!company) return;
    const loc = company.company_locations?.find((l: any) => l.is_primary) ?? company.company_locations?.[0];
    setForm({
      name: company.name ?? "",
      description: company.description ?? "",
      industry: company.industry ?? "",
      website: company.website ?? "",
      logo_emoji: company.logo_emoji ?? "🏢",
      city: loc?.city ?? "",
      state: loc?.state ?? "",
      tagline: company.tagline ?? "",
      cs_ai_description: company.cs_ai_description ?? "",
      public_careers_url: company.public_careers_url ?? "",
      size: (company.size ?? COMPANY_SIZE_NONE) as string,
      hq_city: company.hq_city ?? "",
      hq_state: company.hq_state ?? "MN",
      school_relations_contact_name: company.school_relations_contact_name ?? "",
      school_relations_contact_email: company.school_relations_contact_email ?? "",
      internal_contact_name: company.internal_contact_name ?? "",
      internal_contact_email: company.internal_contact_email ?? "",
      internal_contact_phone: company.internal_contact_phone ?? "",
      attestation_minor_safety: !!company.attestation_minor_safety,
      attestation_terms: !!company.attestation_terms,
    });
  }, [company]);

  const attestationsOk = form.attestation_minor_safety && form.attestation_terms;

  const onSave = async (submitForReview = false) => {
    if (!user || !company) return;
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    if (submitForReview && !attestationsOk) { toast.error("Both attestations are required to submit"); return; }
    if (form.tagline.length > 80) { toast.error("Tagline must be 80 characters or less"); return; }
    if (form.cs_ai_description.length > 1500) { toast.error("CS/AI description must be 1500 characters or less"); return; }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        logo_emoji: form.logo_emoji.trim() || "🏢",
        tagline: form.tagline.trim() || null,
        cs_ai_description: form.cs_ai_description.trim() || null,
        public_careers_url: form.public_careers_url.trim() || null,
        size: form.size === COMPANY_SIZE_NONE ? null : form.size,
        hq_city: form.hq_city.trim() || null,
        hq_state: form.hq_state.trim() || null,
        school_relations_contact_name: form.school_relations_contact_name.trim() || null,
        school_relations_contact_email: form.school_relations_contact_email.trim() || null,
        internal_contact_name: form.internal_contact_name.trim() || null,
        internal_contact_email: form.internal_contact_email.trim() || null,
        internal_contact_phone: form.internal_contact_phone.trim() || null,
        attestation_minor_safety: form.attestation_minor_safety,
        attestation_terms: form.attestation_terms,
        ...(submitForReview ? { status: "pending" as const } : {}),
      };
      const { error } = await supabase.from("companies").update(payload).eq("id", company.id);
      if (error) throw error;

      // Primary location upsert
      if (form.city.trim() && form.state.trim()) {
        const existingLoc = company?.company_locations?.find((l: any) => l.is_primary) ?? company?.company_locations?.[0];
        if (existingLoc) {
          await supabase.from("company_locations").update({
            city: form.city.trim(), state: form.state.trim(), is_primary: true,
          }).eq("id", existingLoc.id);
        } else {
          await supabase.from("company_locations").insert({
            company_id: company.id, city: form.city.trim(), state: form.state.trim(), is_primary: true,
          });
        }
      }
      toast.success(submitForReview ? "Submitted for review" : "Saved");
      qc.invalidateQueries({ queryKey: ["my-company", user.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Accordion type="multiple" defaultValue={["basics", "public", "attest"]} className="space-y-3">
        {/* Basics */}
        <AccordionItem value="basics" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold">Basics</AccordionTrigger>
          <AccordionContent className="grid gap-5 md:grid-cols-2 pt-2 pb-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Company name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://acme.com" />
            </div>
            <div>
              <Label htmlFor="logo_emoji">Logo emoji</Label>
              <Input id="logo_emoji" maxLength={4} value={form.logo_emoji} onChange={(e) => setForm({ ...form, logo_emoji: e.target.value })} />
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label htmlFor="city">Primary office city</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Minneapolis" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} placeholder="MN" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Public-facing */}
        <AccordionItem value="public" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold">Public-facing content</AccordionTrigger>
          <AccordionContent className="grid gap-5 md:grid-cols-2 pt-2 pb-4">
            <div className="md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" maxLength={80} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Powering Minnesota's grid since 1957" />
              <p className="text-xs text-muted-foreground mt-1">One line, shown under the company name on your page. {form.tagline.length}/80</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="cs_ai_description">CS / AI work at your company</Label>
              <Textarea id="cs_ai_description" rows={5} maxLength={1500} value={form.cs_ai_description} onChange={(e) => setForm({ ...form, cs_ai_description: e.target.value })} placeholder="We use computer vision to detect defects on the assembly line in real time..." />
              <p className="text-xs text-muted-foreground mt-1">Describe the CS/AI work happening at your company. Specific projects, tools, problems — not generic. {form.cs_ai_description.length}/1500</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="public_careers_url">Public careers URL</Label>
              <Input id="public_careers_url" type="url" value={form.public_careers_url} onChange={(e) => setForm({ ...form, public_careers_url: e.target.value })} placeholder="https://acme.com/careers" />
              <p className="text-xs text-muted-foreground mt-1">Link to your own careers page. Students will be sent here to apply.</p>
            </div>
            <div>
              <Label htmlFor="size">Company size</Label>
              <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                <SelectTrigger id="size"><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={COMPANY_SIZE_NONE}>— Not set —</SelectItem>
                  {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label htmlFor="hq_city">Headquarters city</Label>
                <Input id="hq_city" value={form.hq_city} onChange={(e) => setForm({ ...form, hq_city: e.target.value })} placeholder="Minneapolis" />
              </div>
              <div>
                <Label htmlFor="hq_state">State</Label>
                <Input id="hq_state" maxLength={2} value={form.hq_state} onChange={(e) => setForm({ ...form, hq_state: e.target.value.toUpperCase() })} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Contacts */}
        <AccordionItem value="contacts" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold">Contacts</AccordionTrigger>
          <AccordionContent className="grid gap-5 md:grid-cols-2 pt-2 pb-4">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">Schools & students contact</h3>
              <p className="text-xs text-muted-foreground">Schools and students will see this contact.</p>
            </div>
            <div>
              <Label htmlFor="sr_name">Name</Label>
              <Input id="sr_name" value={form.school_relations_contact_name} onChange={(e) => setForm({ ...form, school_relations_contact_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="sr_email">Email</Label>
              <Input id="sr_email" type="email" value={form.school_relations_contact_email} onChange={(e) => setForm({ ...form, school_relations_contact_email: e.target.value })} />
            </div>

            <div className="md:col-span-2 mt-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Internal contact</h3>
              <p className="text-xs text-muted-foreground">We use these to reach you. Not shown publicly.</p>
            </div>
            <div>
              <Label htmlFor="ic_name">Name</Label>
              <Input id="ic_name" value={form.internal_contact_name} onChange={(e) => setForm({ ...form, internal_contact_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ic_email">Email</Label>
              <Input id="ic_email" type="email" value={form.internal_contact_email} onChange={(e) => setForm({ ...form, internal_contact_email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ic_phone">Phone</Label>
              <Input id="ic_phone" type="tel" value={form.internal_contact_phone} onChange={(e) => setForm({ ...form, internal_contact_phone: e.target.value })} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Attestations */}
        <AccordionItem value="attest" className="rounded-xl border border-border bg-card px-4">
          <AccordionTrigger className="text-base font-semibold">Attestations (required to publish)</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2 pb-4">
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent">
              <Checkbox checked={form.attestation_minor_safety} onCheckedChange={(v) => setForm({ ...form, attestation_minor_safety: !!v })} />
              <span className="text-sm">I attest that our company has background-check policies for staff who interact with minors.</span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent">
              <Checkbox checked={form.attestation_terms} onCheckedChange={(v) => setForm({ ...form, attestation_terms: !!v })} />
              <span className="text-sm">I accept the Career Compass terms of service.</span>
            </label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5 mt-6">
        <Button onClick={() => onSave(false)} disabled={saving} variant="outline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
        </Button>
        {company?.status !== "published" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button onClick={() => onSave(true)} disabled={saving || !attestationsOk}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
                  </Button>
                </span>
              </TooltipTrigger>
              {!attestationsOk && (
                <TooltipContent>Both attestations are required before submitting.</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <p className="text-xs text-muted-foreground">An admin reviews your company before it appears publicly.</p>
      </div>
    </div>
  );
}