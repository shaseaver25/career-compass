import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Construction } from "lucide-react";
import { fetchPublishedCareers, fetchPublishedCareersByCluster } from "@/lib/queries";
import { fetchCareerFieldsAndClusters, fetchConsortiumMembership } from "@/lib/queries";
import { CareerCard } from "@/components/cards/CareerCard";
import { SEO } from "@/components/SEO";
import { educationLabel, growthLabel } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

const Careers = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [growth, setGrowth] = useState("all");
  const [edu, setEdu] = useState("all");
  const clusterSlug = params.get("cluster");
  const pathwaySlug = params.get("pathway");
  const consortiumCode = params.get("consortium");
  const consortiumQuery = useQuery({
    queryKey: ["consortium-membership", consortiumCode],
    queryFn: () => fetchConsortiumMembership(consortiumCode as string),
    enabled: !!consortiumCode,
  });
  const consortiumCareerIdSet = useMemo(
    () => new Set((consortiumQuery.data?.careerIds ?? []) as string[]),
    [consortiumQuery.data]
  );
  const consortiumName = consortiumQuery.data?.consortium?.name ?? null;
  const wheelQuery = useQuery({ queryKey: ["wheel-fields-clusters"], queryFn: fetchCareerFieldsAndClusters });
  const allClusters = (wheelQuery.data?.clusters ?? []) as Array<{ id: string; name: string; slug: string; display_order: number }>;
  const allCareersQuery = useQuery({ queryKey: ["careers"], queryFn: fetchPublishedCareers, enabled: !clusterSlug });
  const clusterQuery = useQuery({
    queryKey: ["careers", "cluster", clusterSlug, pathwaySlug],
    queryFn: () => fetchPublishedCareersByCluster(clusterSlug as string, pathwaySlug),
    enabled: !!clusterSlug,
  });
  const unknownCluster = !!clusterSlug && clusterQuery.data?.unknownCluster === true;
  const clusterMeta = clusterQuery.data && !clusterQuery.data.unknownCluster ? (clusterQuery.data as any).cluster : null;
  const clusterColor: string | null = clusterMeta?.acte_cluster_groupings?.color_hex ?? null;
  const clusterName: string | null = clusterMeta?.name ?? null;
  const pathwayMeta = clusterQuery.data && !clusterQuery.data.unknownCluster ? (clusterQuery.data as any).pathway : null;
  const pathwayName: string | null = pathwayMeta?.name ?? null;
  const careers = clusterSlug
    ? (unknownCluster ? (allCareersQuery.data ?? []) : (clusterQuery.data?.careers ?? []))
    : (allCareersQuery.data ?? []);
  const isLoading = clusterSlug ? clusterQuery.isLoading : allCareersQuery.isLoading;
  // If unknown cluster, fall back to all careers
  const fallbackQuery = useQuery({ queryKey: ["careers"], queryFn: fetchPublishedCareers, enabled: unknownCluster });
  const careersList = unknownCluster ? (fallbackQuery.data ?? []) : careers;

  useEffect(() => {
    const t = setTimeout(() => setParams(p => { if (q) p.set("q", q); else p.delete("q"); return p; }, { replace: true }), 200);
    return () => clearTimeout(t);
  }, [q, setParams]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return careersList.filter((c: any) => {
      if (growth !== "all" && c.growth_outlook !== growth) return false;
      if (edu !== "all" && c.education_level !== edu) return false;
      if (consortiumCode && !consortiumCareerIdSet.has(c.id)) return false;
      if (!term) return true;
      const hay = `${c.title} ${c.short_description ?? ""} ${(c.skills ?? []).join(" ")} ${c.industry ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [careersList, q, growth, edu, consortiumCode, consortiumCareerIdSet]);

  return (
    <>
      <SEO title="Browse careers" description="Search hundreds of real careers. Filter by industry, growth outlook, and education level." path="/careers" />
      <section className="border-b border-border/60 bg-surface">
        <div className="container py-10">
          <h1 className="text-3xl md:text-4xl font-bold">Careers</h1>
          <p className="text-muted-foreground mt-1">Search by title, skill, or keyword.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search careers, skills, keywords" className="border-0 shadow-none focus-visible:ring-0" />
            </div>
            <Select
              value={clusterSlug ?? "all"}
              onValueChange={(v) => setParams(p => {
                if (v === "all") { p.delete("cluster"); p.delete("pathway"); }
                else { p.set("cluster", v); p.delete("pathway"); }
                return p;
              }, { replace: true })}
            >
              <SelectTrigger className="md:w-56"><SelectValue placeholder="Career cluster" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clusters</SelectItem>
                {allClusters.map(cl => <SelectItem key={cl.id} value={cl.slug}>{cl.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={growth} onValueChange={setGrowth}>
              <SelectTrigger className="md:w-44"><SelectValue placeholder="Growth" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All growth</SelectItem>{Object.entries(growthLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={edu} onValueChange={setEdu}>
              <SelectTrigger className="md:w-48"><SelectValue placeholder="Education" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All education</SelectItem>{Object.entries(educationLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>
      <section className="container py-10">
        {clusterSlug && !unknownCluster && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            {clusterColor && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: clusterColor }} aria-hidden />}
            Filtered by: <span className="font-semibold">{clusterName ?? clusterSlug}{pathwayName ? ` · ${pathwayName}` : ""}</span>
            <button onClick={() => setParams(p => { p.delete("cluster"); p.delete("pathway"); return p; }, { replace: true })} className="text-muted-foreground hover:text-foreground">clear ×</button>
          </div>
        )}
        {consortiumCode && (
          <div className="mb-4 ml-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            Region: <span className="font-semibold">{consortiumName ?? consortiumCode}</span>
            <button onClick={() => setParams(p => { p.delete("consortium"); return p; }, { replace: true })} className="text-muted-foreground hover:text-foreground">clear ×</button>
          </div>
        )}
        {unknownCluster && (
          <div className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Unknown cluster — showing all careers.
          </div>
        )}
        <div className="mb-4 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "career" : "careers"}</div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          clusterSlug && !unknownCluster && clusterName ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
              <div className="mb-3 flex justify-center">
                <Construction className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="font-semibold">Under construction</div>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {pathwayName ? (
                  <>We're still recruiting Minnesota employers for the <span className="font-medium text-foreground">{pathwayName}</span> pathway in <span className="font-medium text-foreground">{clusterName}</span>.</>
                ) : (
                  <>We're still recruiting Minnesota employers for the <span className="font-medium text-foreground">{clusterName}</span> cluster.</>
                )}{" "}
                Want to nominate a company?{" "}
                <a href="mailto:hello@careercompass.mn" className="text-primary underline-offset-2 hover:underline">Email us</a>.
              </p>
            </div>
          ) : (
            <EmptyState title="No careers match your filters" description="Try clearing a filter or searching for something else." />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c => <CareerCard key={c.id} c={c} />)}</div>
        )}
      </section>
    </>
  );
};
export default Careers;
