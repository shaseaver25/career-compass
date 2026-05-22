import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileTab } from "@/components/dashboard/CompanyProfileTab";
import { OpportunitiesTab } from "@/components/dashboard/OpportunitiesTab";
import { TestimonialsTab } from "@/components/dashboard/TestimonialsTab";
import { PartnershipsTab } from "@/components/dashboard/PartnershipsTab";
import { InterviewsTab } from "@/components/dashboard/InterviewsTab";
import { toast } from "sonner";
import { Building2, ExternalLink, Loader2, Mic, Sparkles } from "lucide-react";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const Dashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", industry: "", city: "", state: "", logo_emoji: "🏢",
  });

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

  const needsOnboarding = !!user && !isLoading && !company;

  const onCreate = async () => {
    if (!user) return;
    if (!createForm.name.trim()) { toast.error("Company name is required"); return; }
    setCreating(true);
    try {
      const slug = `${slugify(createForm.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: c, error } = await supabase.from("companies").insert({
        name: createForm.name.trim(),
        industry: createForm.industry.trim() || null,
        logo_emoji: createForm.logo_emoji.trim() || "🏢",
        owner_id: user.id,
        slug,
        status: "draft" as const,
      }).select("id").single();
      if (error) throw error;
      if (createForm.city.trim() && createForm.state.trim()) {
        await supabase.from("company_locations").insert({
          company_id: c.id,
          city: createForm.city.trim(),
          state: createForm.state.trim(),
          is_primary: true,
        });
      }
      toast.success("Dashboard created. Finish your profile, then submit for review.");
      await qc.invalidateQueries({ queryKey: ["my-company", user.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create company");
    } finally {
      setCreating(false);
    }
  };

  const statusLabel: Record<string, string> = {
    draft: "Draft", pending: "Pending review", published: "Published", changes_requested: "Changes requested",
  };
  const statusVariant = (s?: string) =>
    s === "published" ? "default" : s === "pending" ? "secondary" : "outline";

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
              <h2 className="font-bold">{company?.name ?? "Company"}</h2>
            </div>
            <Badge variant={statusVariant(company?.status) as any}>
              {statusLabel[company?.status ?? "draft"]}
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : !company ? null : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="m-4 grid w-[calc(100%-2rem)] grid-cols-2 md:w-auto md:inline-flex">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
                <TabsTrigger value="interviews">Interviews</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="mt-0"><CompanyProfileTab company={company} /></TabsContent>
              <TabsContent value="opportunities" className="mt-0"><OpportunitiesTab companyId={company.id} /></TabsContent>
              <TabsContent value="testimonials" className="mt-0"><TestimonialsTab companyId={company.id} /></TabsContent>
              <TabsContent value="partnerships" className="mt-0"><PartnershipsTab companyId={company.id} /></TabsContent>
              <TabsContent value="interviews" className="mt-0"><InterviewsTab companyId={company.id} /></TabsContent>
            </Tabs>
          )}
        </div>

        {isAdmin && (
          <p className="mt-6 text-sm text-muted-foreground">
            You're an admin — open the <Link to="/admin" className="text-primary underline">moderation queue</Link>.
          </p>
        )}
      </section>

      <Dialog open={needsOnboarding}>
        <DialogContent
          className="sm:max-w-lg [&>button.absolute]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="grid h-11 w-11 place-items-center rounded-xl gradient-hero text-primary-foreground mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle>Create your company dashboard</DialogTitle>
            <DialogDescription>
              Tell us a bit about your company. You can refine everything before submitting for review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="c-name">Company name *</Label>
              <Input id="c-name" autoFocus value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Acme Manufacturing" />
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div>
                <Label htmlFor="c-industry">Industry</Label>
                <Input id="c-industry" value={createForm.industry}
                  onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                  placeholder="Manufacturing" />
              </div>
              <div>
                <Label htmlFor="c-emoji">Logo</Label>
                <Input id="c-emoji" maxLength={4} value={createForm.logo_emoji}
                  onChange={(e) => setCreateForm({ ...createForm, logo_emoji: e.target.value })}
                  placeholder="🏭" />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div>
                <Label htmlFor="c-city">City</Label>
                <Input id="c-city" value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  placeholder="Tulsa" />
              </div>
              <div>
                <Label htmlFor="c-state">State</Label>
                <Input id="c-state" maxLength={2} value={createForm.state}
                  onChange={(e) => setCreateForm({ ...createForm, state: e.target.value.toUpperCase() })}
                  placeholder="OK" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
            <Button onClick={onCreate} disabled={creating || !createForm.name.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create dashboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default Dashboard;
