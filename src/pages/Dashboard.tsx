import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, ExternalLink, Loader2, Mic } from "lucide-react";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: company, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, company_locations(*)")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "", description: "", industry: "", website: "", logo_emoji: "🏢",
    city: "", state: "",
  });

  useEffect(() => {
    if (company) {
      const loc = company.company_locations?.find((l: any) => l.is_primary) ?? company.company_locations?.[0];
      setForm({
        name: company.name ?? "",
        description: company.description ?? "",
        industry: company.industry ?? "",
        website: company.website ?? "",
        logo_emoji: company.logo_emoji ?? "🏢",
        city: loc?.city ?? "",
        state: loc?.state ?? "",
      });
    }
  }, [company]);

  const onSave = async (submitForReview = false) => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    setSaving(true);
    try {
      let companyId = company?.id;
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        logo_emoji: form.logo_emoji.trim() || "🏢",
        owner_id: user.id,
        ...(submitForReview ? { status: "pending_review" as const } : {}),
      };

      if (companyId) {
        const { error } = await supabase.from("companies").update(payload).eq("id", companyId);
        if (error) throw error;
      } else {
        const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
        const { data, error } = await supabase
          .from("companies")
          .insert({ ...payload, slug, status: submitForReview ? "pending_review" : "draft" })
          .select("id")
          .single();
        if (error) throw error;
        companyId = data.id;
      }

      // Upsert primary location
      if (form.city.trim() && form.state.trim()) {
        const existingLoc = company?.company_locations?.find((l: any) => l.is_primary) ?? company?.company_locations?.[0];
        if (existingLoc) {
          await supabase.from("company_locations").update({
            city: form.city.trim(), state: form.state.trim(), is_primary: true,
          }).eq("id", existingLoc.id);
        } else {
          await supabase.from("company_locations").insert({
            company_id: companyId!, city: form.city.trim(), state: form.state.trim(), is_primary: true,
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

  const statusLabel: Record<string, string> = {
    draft: "Draft", pending_review: "Pending review", published: "Published", archived: "Archived",
  };
  const statusVariant = (s?: string) =>
    s === "published" ? "default" : s === "pending_review" ? "secondary" : "outline";

  return (
    <>
      <SEO title="Company dashboard" />
      <section className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Company dashboard</h1>
            <p className="text-muted-foreground mt-1">Signed in as {user?.email}</p>
          </div>
          <div className="flex gap-2">
            {company?.status === "published" && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/companies/${company.slug}`}>View public page <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            )}
            <Button asChild size="sm" disabled={!company}>
              <Link to="/dashboard/interviews/new"><Mic className="mr-1.5 h-4 w-4" />Record interview</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Company profile</h2>
            </div>
            <Badge variant={statusVariant(company?.status) as any}>
              {statusLabel[company?.status ?? "draft"]}
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="p-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="name">Company name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Manufacturing" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does your company do? Who do you hire?" />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Manufacturing" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://acme.com" />
              </div>
              <div>
                <Label htmlFor="logo_emoji">Logo emoji</Label>
                <Input id="logo_emoji" maxLength={4} value={form.logo_emoji} onChange={(e) => setForm({ ...form, logo_emoji: e.target.value })} placeholder="🏭" />
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Tulsa" />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} placeholder="OK" />
                </div>
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-border pt-5 mt-2">
                <Button onClick={() => onSave(false)} disabled={saving} variant="outline">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save draft"}
                </Button>
                {company?.status !== "published" && (
                  <Button onClick={() => onSave(true)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">An admin reviews and publishes your company before it appears in the public directory.</p>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <p className="mt-6 text-sm text-muted-foreground">
            You're an admin — open the <Link to="/admin" className="text-primary underline">moderation queue</Link>.
          </p>
        )}
      </section>
    </>
  );
};
export default Dashboard;
