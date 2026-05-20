import { CareerClusterWheel } from "@/components/CareerClusterWheel";
import { MnConsortiaMap } from "@/components/MnConsortiaMap";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BarChart3 } from "lucide-react";

const Explore = () => {
  return (
    <>
      <SEO title="Explore career clusters" description="Explore the 14 national CTE career clusters. Click any wedge to see careers in that cluster, posted by Minnesota employers." path="/explore" />
      <section className="border-b border-border/60 bg-surface">
        <div className="container py-10">
          <h1 className="text-3xl md:text-4xl font-bold">Explore career clusters</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Explore the 14 national CTE career clusters. Click any wedge to see careers in that cluster, posted by Minnesota employers.
          </p>
        </div>
      </section>
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <CareerClusterWheel />
        </div>
      </section>
      <section className="border-t border-border/60">
        <div className="container py-10">
          <h2 className="text-2xl md:text-3xl font-bold">Minnesota Tech Ecosystem</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Live employment and growth data for Minnesota's technology sector.
          </p>
          <div className="mt-6 mx-auto max-w-3xl">
            <article className="rounded-2xl border border-border bg-card p-6 shadow-card flex items-start gap-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg">Minnesota Tech Association Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Workforce data, job openings, and industry growth trends for the MN tech sector. Sourced from eImpact.
                </p>
                <Button asChild className="mt-4">
                  <a href="https://www.mntech.org/research-and-data" target="_blank" rel="noopener noreferrer">
                    View dashboard <ArrowUpRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="border-t border-border/60 bg-surface">
        <div className="container py-10">
          <h2 className="text-2xl md:text-3xl font-bold">Explore by region</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Minnesota's 23 Perkins CTE consortia coordinate career and technical education across the state.
            Click a region to see the companies and careers students can explore locally.
          </p>
          <div className="mt-6 mx-auto max-w-5xl">
            <MnConsortiaMap />
          </div>
        </div>
      </section>
    </>
  );
};

export default Explore;