import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { fetchPublishedCompanies } from "@/lib/queries";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/EmptyState";

const Companies = () => {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("all");
  const { data: companies = [], isLoading } = useQuery({ queryKey: ["companies"], queryFn: fetchPublishedCompanies });
  const industries = useMemo(() => Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[], [companies]);
  const locations = useMemo(() => Array.from(new Set(companies.map(c => [c.city, c.state].filter(Boolean).join(", ")).filter(Boolean))), [companies]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return companies.filter(c => {
      if (industry !== "all" && c.industry !== industry) return false;
      const loc = [c.city, c.state].filter(Boolean).join(", ");
      if (location !== "all" && loc !== location) return false;
      if (!term) return true;
      return `${c.name} ${c.industry ?? ""} ${loc} ${c.description ?? ""}`.toLowerCase().includes(term);
    });
  }, [companies, q, industry, location]);
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
        <div className="mb-4 text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "company" : "companies"}</div>
        {isLoading ? (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}</div>) : filtered.length === 0 ? <EmptyState title="No companies match your search" /> : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(c => <CompanyCard key={c.id} c={c} />)}</div>)}
      </section>
    </>
  );
};
export default Companies;
