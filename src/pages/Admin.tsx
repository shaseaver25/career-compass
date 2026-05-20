import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, Pencil, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AudioPlayer } from "@/components/AudioPlayer";
import { CareerFormDialog, type CareerEditing } from "@/components/admin/CareerFormDialog";
import { DeedDataTab } from "@/components/admin/DeedDataTab";

type Status = "draft" | "pending" | "published" | "changes_requested";

const StatusBadge = ({ s }: { s: Status }) => {
  const map: Record<Status, { label: string; variant: any }> = {
    draft: { label: "Draft", variant: "outline" },
    pending: { label: "Pending", variant: "secondary" },
    published: { label: "Published", variant: "default" },
    changes_requested: { label: "Changes requested", variant: "destructive" },
  };
  const m = map[s];
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const Admin = () => {
  const qc = useQueryClient();
  const [careerDialogOpen, setCareerDialogOpen] = useState(false);
  const [careerEditing, setCareerEditing] = useState<CareerEditing>(null);

  const companies = useQuery({
    queryKey: ["admin-companies-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, slug, name, description, industry, logo_emoji, status, updated_at, company_locations(city, state, is_primary)")
        .in("status", ["pending", "draft"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const interviews = useQuery({
    queryKey: ["admin-interviews-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("id, interviewee_name, interviewee_role, audio_url, status, updated_at, companies(name, slug), careers(title, slug), interview_answers(answer, interview_questions(short_label, question_order))")
        .in("status", ["pending", "draft"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const adminCareers = useQuery({
    queryKey: ["admin-careers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("careers")
        .select("id, slug, title, status, industry, tech_tags, primary_cluster_id, primary_sub_cluster_id, updated_at, acte_clusters!careers_primary_cluster_id_fkey(id, name, acte_cluster_groupings(name, color_hex)), acte_sub_clusters!careers_primary_sub_cluster_id_fkey(id, name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useMemo(() => ({
    companies: companies.data?.length ?? 0,
    interviews: interviews.data?.length ?? 0,
    careers: adminCareers.data?.length ?? 0,
  }), [companies.data, interviews.data, adminCareers.data]);

  const moderate = async (
    table: "companies" | "interviews",
    id: string,
    status: Status,
    label: string,
  ) => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label} ${status === "published" ? "published" : status === "changes_requested" ? "sent back" : "updated"}`);
    qc.invalidateQueries({ queryKey: [`admin-${table}-pending`] });
    if (table === "companies") qc.invalidateQueries({ queryKey: ["companies"] });
  };

  return (
    <>
      <SEO title="Admin moderation" />
      <section className="container py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Moderation queue</h1>
        <p className="text-muted-foreground mt-1">Review and publish company profiles and interviews submitted by reps.</p>

        <Tabs defaultValue="companies" className="mt-8">
          <TabsList>
            <TabsTrigger value="companies">Companies <Badge variant="secondary" className="ml-2">{counts.companies}</Badge></TabsTrigger>
            <TabsTrigger value="interviews">Interviews <Badge variant="secondary" className="ml-2">{counts.interviews}</Badge></TabsTrigger>
            <TabsTrigger value="careers">Careers <Badge variant="secondary" className="ml-2">{counts.careers}</Badge></TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            {companies.isLoading ? (
              <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : counts.companies === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No companies waiting for review.</div>
            ) : (
              <div className="grid gap-4">
                {companies.data!.map((c: any) => {
                  const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0];
                  return (
                    <article key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{c.logo_emoji || "🏢"}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{c.name}</h3>
                            <StatusBadge s={c.status} />
                            {c.industry && <span className="text-xs text-primary font-medium">{c.industry}</span>}
                            {loc && <span className="text-xs text-muted-foreground">{loc.city}, {loc.state}</span>}
                          </div>
                          {c.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{c.description}</p>}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => moderate("companies", c.id, "published", c.name)}><Check className="mr-1 h-4 w-4" />Publish</Button>
                        <Button size="sm" variant="outline" onClick={() => moderate("companies", c.id, "changes_requested", c.name)}><X className="mr-1 h-4 w-4" />Request changes</Button>
                        <Button size="sm" variant="ghost" asChild><Link to={`/companies/${c.slug}`}>Preview <ExternalLink className="ml-1 h-3.5 w-3.5" /></Link></Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="interviews" className="mt-6">
            {interviews.isLoading ? (
              <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : counts.interviews === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No interviews waiting for review.</div>
            ) : (
              <div className="grid gap-4">
                {interviews.data!.map((iv: any) => {
                  const sortedAnswers = [...(iv.interview_answers ?? [])].sort(
                    (a: any, b: any) => (a.interview_questions?.question_order ?? 0) - (b.interview_questions?.question_order ?? 0),
                  );
                  return (
                    <article key={iv.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold">{iv.interviewee_name}</h3>
                            <StatusBadge s={iv.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {iv.interviewee_role}
                            {iv.companies?.name && <> · {iv.companies.name}</>}
                            {iv.careers?.title && <> · {iv.careers.title}</>}
                          </p>
                        </div>
                      </div>
                      {iv.audio_url && <div className="mt-3"><AudioPlayer src={iv.audio_url} /></div>}
                      {sortedAnswers.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-sm font-medium cursor-pointer hover:text-primary">{sortedAnswers.length} answers</summary>
                          <div className="mt-3 grid gap-3">
                            {sortedAnswers.map((a: any, i: number) => (
                              <div key={i} className="text-sm">
                                <div className="font-semibold">{a.interview_questions?.short_label}</div>
                                <p className="text-muted-foreground whitespace-pre-wrap">{a.answer}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => moderate("interviews", iv.id, "published", iv.interviewee_name)}><Check className="mr-1 h-4 w-4" />Publish</Button>
                        <Button size="sm" variant="outline" onClick={() => moderate("interviews", iv.id, "changes_requested", iv.interviewee_name)}><X className="mr-1 h-4 w-4" />Request changes</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="careers" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">All careers in the catalog. Tag each with a primary ACTE cluster.</p>
              <Button size="sm" onClick={() => { setCareerEditing(null); setCareerDialogOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> New career
              </Button>
            </div>
            {adminCareers.isLoading ? (
              <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : counts.careers === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No careers yet — create one to start the catalog.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">Title</th>
                      <th className="text-left px-4 py-2.5 font-medium">Cluster</th>
                      <th className="text-left px-4 py-2.5 font-medium">Pathway</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tech tags</th>
                      <th className="text-left px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {(adminCareers.data ?? []).map((c: any) => {
                      const cluster = c.acte_clusters;
                      const color = cluster?.acte_cluster_groupings?.color_hex;
                      const pathway = c.acte_sub_clusters;
                      const tags: string[] = c.tech_tags ?? [];
                      const isUntagged = c.status === "published" && !c.primary_cluster_id;
                      return (
                        <tr key={c.id} className="border-t border-border align-top">
                          <td className="px-4 py-3 font-medium">
                            {c.title}
                            <div className="text-xs text-muted-foreground">{c.slug}</div>
                          </td>
                          <td className="px-4 py-3">
                            {cluster ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                {cluster.name}
                              </span>
                            ) : isUntagged ? (
                              <Badge variant="destructive">Untagged</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {pathway?.name ? <span>{pathway.name}</span> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {tags.length === 0 ? <span className="text-muted-foreground">—</span> : (
                              <div className="flex flex-wrap gap-1">
                                {tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                                {tags.length > 3 && <Badge variant="outline" className="text-xs">+{tags.length - 3} more</Badge>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => { setCareerEditing(c); setCareerDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DeedDataTab />
          </TabsContent>
        </Tabs>
      </section>
      <CareerFormDialog open={careerDialogOpen} onOpenChange={setCareerDialogOpen} editing={careerEditing} />
    </>
  );
};
export default Admin;
