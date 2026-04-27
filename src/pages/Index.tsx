import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Briefcase, Building2, GraduationCap, Search, Sparkles } from "lucide-react";
import { fetchPublishedCareers, fetchPublishedCompanies } from "@/lib/queries";
import { CareerCard } from "@/components/cards/CareerCard";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { SEO } from "@/components/SEO";

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: careers = [] } = useQuery({ queryKey: ["careers"], queryFn: fetchPublishedCareers });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: fetchPublishedCompanies });
  const featuredCareers = [...careers].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);
  const featuredCompanies = companies.slice(0, 4);

  return (
    <>
      <SEO title="CTE Careers — Explore real careers and the companies that hire" description="Discover real careers, the skills they need, and the local companies hiring near you." path="/" />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 gradient-hero opacity-95" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,hsl(0_0%_100%/0.25),transparent_50%)]" />
        <div className="container py-20 md:py-28 text-primary-foreground">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> A statewide career-exploration platform
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Find a career that fits.<br />
              <span className="text-white/85">Then meet the companies that hire for it.</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-2xl">
              Real jobs, real pathways, real employers. Built for high school students, teachers, and the companies who want to meet the next generation.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate(`/careers?q=${encodeURIComponent(q)}`); }}
              className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl bg-background rounded-2xl p-2 shadow-elevated"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try 'nurse', 'electrician', 'cybersecurity'…"
                  className="border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground" />
              </div>
              <Button type="submit" size="lg" className="rounded-xl">Search careers</Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/careers"><Briefcase className="mr-2 h-4 w-4" />Browse careers</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/companies"><Building2 className="mr-2 h-4 w-4" />Browse companies</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured careers</h2>
            <p className="text-muted-foreground">Handpicked roles in healthcare, manufacturing, construction, and IT.</p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link to="/careers">See all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCareers.map(c => <CareerCard key={c.id} c={c} />)}
        </div>
      </section>

      <section className="bg-surface border-y border-border/60">
        <div className="container py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured companies</h2>
              <p className="text-muted-foreground">Local employers ready to meet the next generation.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/companies">See all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCompanies.map(c => <CompanyCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      <section className="container py-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">For students & teachers</h3>
          <p className="text-muted-foreground">Browse real careers, see what a typical day looks like, and learn the steps from high school to a great first job. No sign-in required.</p>
          <Button asChild variant="outline" className="mt-5"><Link to="/careers">Start exploring</Link></Button>
        </div>
        <div className="rounded-3xl border border-border gradient-warm text-foreground p-8 shadow-card relative overflow-hidden">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background/50 mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">For companies</h3>
          <p className="text-foreground/80">Tell your story to thousands of students. Set up a profile, link the careers you hire for, and share interviews from your team.</p>
          <Button asChild className="mt-5"><Link to="/auth">Get your company on CTE Careers</Link></Button>
        </div>
      </section>
    </>
  );
};

export default Index;
