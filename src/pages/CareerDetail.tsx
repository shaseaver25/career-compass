import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCareerBySlug } from "@/lib/queries";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { educationLabel, formatSalary, growthLabel, stepTypeLabel } from "@/lib/format";
import { ArrowLeft, BookOpen, GraduationCap, Sparkles, TrendingUp, Wallet, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { InterviewCard } from "@/components/InterviewCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { EmptyState } from "@/components/EmptyState";
import { Helmet } from "react-helmet-async";

const stepIcon: any = { course: BookOpen, certification: Sparkles, degree: GraduationCap, experience: Wrench };

const CareerDetail = () => {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["career", slug], queryFn: () => fetchCareerBySlug(slug) });
  if (isLoading) return <div className="container py-16"><div className="h-8 w-64 bg-muted rounded animate-pulse" /></div>;
  if (!data) return (
    <div className="container py-24 text-center">
      <h1 className="text-2xl font-bold">Career not found</h1>
      <Button asChild className="mt-4" variant="outline"><Link to="/careers"><ArrowLeft className="mr-2 h-4 w-4" />Back to careers</Link></Button>
    </div>
  );
  const { career, steps, companies, interviews } = data;
  const occupationLd = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: career.title,
    description: career.description ?? career.short_description ?? undefined,
    occupationalCategory: career.industry ?? undefined,
    estimatedSalary: career.median_salary
      ? {
          "@type": "MonetaryAmountDistribution",
          name: "base",
          currency: "USD",
          median: career.median_salary,
        }
      : undefined,
    skills: (career.skills ?? []).join(", ") || undefined,
  };
  return (
    <>
      <SEO title={career.title} description={career.short_description ?? undefined} path={`/careers/${slug}`} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(occupationLd)}</script>
      </Helmet>
      <section className="border-b border-border/60 bg-surface">
        <div className="container py-10">
          <Link to="/careers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="mr-1 h-4 w-4" />All careers</Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {career.industry && <Badge variant="secondary">{career.industry}</Badge>}
                {career.growth_outlook && (<Badge className="gap-1 bg-success text-success-foreground hover:bg-success/90"><TrendingUp className="h-3 w-3" />{growthLabel[career.growth_outlook]}</Badge>)}
                {career.onet_code && <Badge variant="outline">O*NET {career.onet_code}</Badge>}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{career.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{career.short_description}</p>
            </div>
            <BookmarkButton kind="career" slug={career.slug} label={career.title} />
          </div>
        </div>
      </section>
      <section className="container py-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center gap-2 text-muted-foreground text-sm"><Wallet className="h-4 w-4" />Median salary</div><div className="mt-1 text-2xl font-bold">{formatSalary(career.median_salary)}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center gap-2 text-muted-foreground text-sm"><GraduationCap className="h-4 w-4" />Education required</div><div className="mt-1 text-2xl font-bold">{educationLabel[career.education_level ?? "high_school"]}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center gap-2 text-muted-foreground text-sm"><Sparkles className="h-4 w-4" />Top skills</div><div className="mt-1 text-sm">{(career.skills ?? []).slice(0, 3).join(", ") || "—"}</div></div>
      </section>
      <section className="container pb-12 grid gap-12 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          {career.description && (<div><h2 className="text-2xl font-bold mb-2">About this career</h2><p className="text-foreground/90 leading-relaxed">{career.description}</p></div>)}
          {career.typical_day && (<div><h2 className="text-2xl font-bold mb-2">A typical day</h2><p className="text-foreground/90 leading-relaxed">{career.typical_day}</p></div>)}
          <div>
            <h2 className="text-2xl font-bold mb-4">Pathway from high school</h2>
            {steps.length === 0 ? <EmptyState title="Pathway coming soon" /> : (
              <ol className="relative border-l border-border ml-3 space-y-6">
                {steps.map((s: any, i: number) => {
                  const Icon = stepIcon[s.step_type] ?? BookOpen;
                  return (
                    <li key={s.id} className="ml-6">
                      <span className="absolute -left-[18px] grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated"><Icon className="h-4 w-4" /></span>
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                        <div className="text-xs font-semibold uppercase tracking-wide text-primary">Step {i + 1} · {stepTypeLabel[s.step_type]}</div>
                        <div className="font-bold mt-1">{s.title}</div>
                        {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          {interviews.length > 0 && (<div><h2 className="text-2xl font-bold mb-4">From people doing this work</h2><div className="grid gap-4">{interviews.map((iv: any) => <InterviewCard key={iv.id} iv={iv} />)}</div></div>)}
        </div>
        <aside className="space-y-8">
          <div>
            <h3 className="font-bold mb-3">Skills that matter</h3>
            <div className="flex flex-wrap gap-2">
              {(career.skills ?? []).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              {(career.skills ?? []).length === 0 && <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-3">Companies that hire for this role</h3>
            {companies.length === 0 ? <p className="text-sm text-muted-foreground">No employers listed yet.</p> : (
              <div className="grid gap-3">{companies.map((c: any) => <CompanyCard key={c.id} c={c} />)}</div>
            )}
          </div>
        </aside>
      </section>
    </>
  );
};
export default CareerDetail;
