import { useEffect, useState } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { supabase } from "@/integrations/supabase/client";
import { CareerCard } from "@/components/cards/CareerCard";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/EmptyState";
import { Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Bookmarks = () => {
  const careersBm = useBookmarks("career");
  const companiesBm = useBookmarks("company");
  const [careers, setCareers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (careersBm.slugs.length === 0) { setCareers([]); return; }
    supabase.from("careers").select("id, slug, title, short_description, median_salary, growth_outlook, industry").in("slug", careersBm.slugs).eq("status", "published").then(({ data }) => setCareers(data ?? []));
  }, [careersBm.slugs]);

  useEffect(() => {
    if (companiesBm.slugs.length === 0) { setCompanies([]); return; }
    supabase.from("companies").select("id, slug, name, description, industry, logo_emoji, logo_url, company_locations(city, state, is_primary)").in("slug", companiesBm.slugs).eq("status", "published").then(({ data }) => {
      setCompanies((data ?? []).map((c: any) => { const loc = c.company_locations?.find((l: any) => l.is_primary) ?? c.company_locations?.[0]; return { ...c, city: loc?.city, state: loc?.state }; }));
    });
  }, [companiesBm.slugs]);

  const empty = careers.length === 0 && companies.length === 0;
  return (
    <>
      <SEO title="Saved" description="Your saved careers and companies." path="/bookmarks" />
      <section className="container py-10">
        <h1 className="text-3xl md:text-4xl font-bold">Saved</h1>
        <p className="text-muted-foreground mt-1">Bookmarks live on this device.</p>
        {empty ? <div className="mt-8"><EmptyState icon={<Bookmark className="h-8 w-8" />} title="Nothing saved yet" description="Tap the save icon on a career or company to add it here." /></div> : (
          <Tabs defaultValue="careers" className="mt-8">
            <TabsList><TabsTrigger value="careers">Careers ({careers.length})</TabsTrigger><TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger></TabsList>
            <TabsContent value="careers" className="mt-6">{careers.length === 0 ? <EmptyState title="No saved careers yet" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{careers.map(c => <CareerCard key={c.slug} c={c} />)}</div>}</TabsContent>
            <TabsContent value="companies" className="mt-6">{companies.length === 0 ? <EmptyState title="No saved companies yet" /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map(c => <CompanyCard key={c.slug} c={c} />)}</div>}</TabsContent>
          </Tabs>
        )}
      </section>
    </>
  );
};
export default Bookmarks;
