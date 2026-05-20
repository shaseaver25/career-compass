import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { fetchPublishedCompanies, fetchConsortiumMembership } from "@/lib/queries";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/EmptyState";

const Companies = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("all");
  const consortiumCode = params.get("consortium");
  const consortiumQuery = useQuery({
    queryKey: ["consortium-membership", consortiumCode],
    queryFn: () => fetchConsortiumMembership(consortiumCode as string),
    enabled: !!consortiumCode,
  });
  const consortiumCompanyIdSet = useMemo(
    () => new Set((consortiumQuery.data?.companyIds ?? []) as string[]),
    [consortiumQuery.data]
  );
  const consortiumName = consortiumQuery.data?.consortium?.name ?? null;
  const { data: companies = [], isLoading } = useQuery({ queryKey: ["companies"], queryFn: fetchPublishedCompanies });
  const industries = useMemo(() => Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[], [companies]);
  const locations = useMemo(() => Array.from(new Set(companies.map(c => [c.city, c.state].filter(Boolean).join(", ")).filter(Boolean))), [companies]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return companies.filter(c => {
      if (industry !== "all" && c.industry !== industry) return false;
      const loc = [c.city, c.state].filter(Boolean).join(", ");
      if (location !== "all" && loc !== location) return false;
      if (consortiumCode && !consortiumCompanyIdSet.has(c.id)) return false;
      if (!term) return true;
      return `${c.name} ${c.industry ?? ""} ${loc} ${c.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [companies, q, industry, location, consortiumCode, consortiumCompanyIdSet]);

  // Build parent/child structure from the filtered list. parentNameMap looks up
  // parent metadata across the full (unfiltered) company set so orphan children
  // can show a "Part of …" breadcrumb even when the parent doesn't match the filter.
  const parentMetaById = useMemo(() => {
    const m = new Map<string, { id: string; slug: string; name: string }>();
    companies.forEach((c: any) => m.set(c.id, { id: c.id, slug: c.slug, name: c.name }));
    return m;
  }, [companies]);

  const filteredIdSet = useMemo(() => new Set(filtered.map((c: any) => c.id)), [filtered]);

  const grouped = useMemo(() => {
    const childrenByParent = new Map<string, any[]>();
    filtered.forEach((c: any) => {
      if (c.parent_company_id) {
        const arr = childrenByParent.get(c.parent_company_id) ?? [];
        arr.push(c);
        childrenByParent.set(c.parent_company_id, arr);
      }
    });
    const topLevelCards: any[] = [];
    const orphanChildren: any[] = [];
    filtered.forEach((c: any) => {
      if (!c.parent_company_id) {
        topLevelCards.push({ ...c, _children: childrenByParent.get(c.id) ?? [] });
      } else if (!filteredIdSet.has(c.parent_company_id)) {
        // parent didn't match the filter — show child standalone
        orphanChildren.push(c);
      }
    });
    return { topLevelCards, orphanChildren };
  }, [filtered, filteredIdSet]);

  return (
    <>
      <SEO title="Browse companies" description="Discover local companies that hire for the careers you care about." path="/companies" />
      <section className="border-b border-border/60 bg-surface"><div className="container py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Companies</h1>
        <p className="text-muted-foreground mt-1">Search by name, industry, or city.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="border-0 shadow-none focus-visible:ring-0" /></div>
          <Select value={industry} onValueChange={setIndustry}><SelectTrigger className="md:w-48"><SelectValue placeholder="Industry" /></SelectTrigger><SelectContent><SelectItem value="all">All industries</SelectItem>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
          <Select value={location} onValueChange={setLocation}><SelectTrigger className="md:w-48"><SelectValue placeholder="Location" /></SelectTrigger><SelectContent><SelectItem value="all">All locations</SelectItem>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
        </div>
      </div></section>
      <section className="container py-10">
        {consortiumCode && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            Region: <span className="font-semibold">{consortiumName ?? consortiumCode}</span>
            <button onClick={() => setParams(p => { p.delete("consortium"); return p; }, { replace: true })} className="text-muted-foreground hover:text-foreground">clear ×</button>
          </div>
        )}
        <div className="mb-4 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "company" : "companies"}</div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? <EmptyState title="No companies match your search" /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {grouped.topLevelCards.map((c: any) => (
              c._children.length > 0
                ? <ParentCompanyCard key={c.id} c={c} subs={c._children} />
                : <CompanyCard key={c.id} c={c} />
            ))}
            {grouped.orphanChildren.map((c: any) => {
              const parentMeta = parentMetaById.get(c.parent_company_id);
              return (
                <div key={c.id} className="flex flex-col">
                  {parentMeta && (
                    <Link to={`/companies/${parentMeta.slug}`} className="text-xs text-muted-foreground hover:text-foreground mb-1.5 px-1">
                      Part of <span className="font-medium">{parentMeta.name}</span>
                    </Link>
                  )}
                  <CompanyCard c={c} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
};

const ParentCompanyCard = ({ c, subs }: { c: any; subs: any[] }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
          {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full rounded-xl object-cover" /> : <span aria-hidden>{c.logo_emoji || "🏢"}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/companies/${c.slug}`} className="font-bold leading-tight hover:underline">{c.name}</Link>
            <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {subs.length} {subs.length === 1 ? "department" : "departments"}
            </button>
          </div>
          {c.industry && <div className="text-xs font-medium text-primary">{c.industry}</div>}
          {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-muted/30 px-5 py-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((ch: any) => (
            <Link key={ch.id} to={`/companies/${ch.slug}`} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-card hover:-translate-y-0.5 transition">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-base">{ch.logo_emoji || "🏢"}</div>
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-tight truncate">{ch.name}</div>
                {ch.industry && <div className="text-xs text-muted-foreground truncate">{ch.industry}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Companies;
