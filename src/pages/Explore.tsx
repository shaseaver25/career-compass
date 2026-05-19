import { CareerClusterWheel } from "@/components/CareerClusterWheel";
import { MnConsortiaMap } from "@/components/MnConsortiaMap";
import { SEO } from "@/components/SEO";

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
      <section className="border-t border-border/60 bg-surface">
        <div className="container py-10">
          <h2 className="text-2xl md:text-3xl font-bold">Explore by region</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Minnesota's 23 Perkins CTE consortia coordinate career and technical education across the state.
            Click a region to see the companies and careers students can explore locally.
          </p>
          <div className="mt-6 mx-auto max-w-3xl">
            <MnConsortiaMap />
          </div>
        </div>
      </section>
    </>
  );
};

export default Explore;