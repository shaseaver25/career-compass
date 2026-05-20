import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCareerBySlug } from "@/lib/queries";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { educationLabel, formatSalary, growthLabel, stepTypeLabel } from "@/lib/format";
import { ArrowLeft, BookOpen, ExternalLink, GraduationCap, Image as ImageIcon, MapPin, Sparkles, TrendingUp, Video, Wallet, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/cards/CompanyCard";
import { InterviewCard } from "@/components/InterviewCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { EmptyState } from "@/components/EmptyState";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";

const stepIcon: any = { course: BookOpen, certification: Sparkles, degree: GraduationCap, experience: Wrench };

const CareerDetail = () => {
  const { slug = "" } = useParams();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["career", slug], queryFn: () => fetchCareerBySlug(slug) });
  if (isLoading) return <div className="container py-16"><div className="h-8 w-64 bg-muted rounded animate-pulse" /></div>;
  if (!data) return (
    <div className="container py-24 text-center">
      <h1 className="text-2xl font-bold">Career not found</h1>
      <Button asChild className="mt-4" variant="outline"><Link to="/careers"><ArrowLeft className="mr-2 h-4 w-4" />Back to careers</Link></Button>
    </div>
  );
  const { career, steps, companies, interviews } = data;
  const media = (career.media_resources ?? {}) as {
    videos?: Array<{ title: string; url: string; source?: string; notes?: string }>;
    career_hubs?: Array<{ title: string; url: string; type?: string }>;
    education_pathways?: Array<{ title: string; url: string; institution?: string }>;
    image_searches?: Array<{ title: string; url: string }>;
  };
  const anchor = career.anchor_opportunity as
    | { video_slot?: string; primary_company?: string; primary_company_reason?: string; shot_list?: string; why_now?: string; backup_options?: string[] }
    | null;
  const salaryRange =
    career.estimated_salary_low && career.estimated_salary_high
      ? `${formatSalary(career.estimated_salary_low)}–${formatSalary(career.estimated_salary_high)} starting`
      : null;
  const resourceCards = [
    ...(media.videos ?? []).map((v) => ({ ...v, kind: "Video", subtitle: v.source })),
    ...(media.career_hubs ?? []).map((h) => ({ title: h.title, url: h.url, kind: "Career hub", subtitle: h.type })),
    ...(media.education_pathways ?? []).map((p) => ({ title: p.title, url: p.url, kind: "Education", subtitle: p.institution })),
  ];
  const heroImage = (media.image_searches ?? [])[0];
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
                {career.education_level && <Badge variant="outline">{educationLabel[career.education_level]}</Badge>}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{career.title}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{career.short_description}</p>
              {salaryRange && (
                <p className="mt-2 text-base font-semibold text-primary"><Wallet className="inline h-4 w-4 mr-1 -mt-0.5" />{salaryRange}</p>
              )}
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
          {isAdmin && anchor && (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-5 shadow-card">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-1">🎯 Anchor company opportunity · admin only</div>
              {anchor.video_slot && <h3 className="text-xl font-bold">{anchor.video_slot}</h3>}
              {(anchor.primary_company || anchor.primary_company_reason) && (
                <p className="mt-2 text-sm"><span className="font-semibold">{anchor.primary_company}</span>{anchor.primary_company_reason ? ` — ${anchor.primary_company_reason}` : ""}</p>
              )}
              {anchor.shot_list && (
                <blockquote className="mt-3 border-l-4 border-amber-400 pl-3 text-sm italic text-foreground/80">{anchor.shot_list}</blockquote>
              )}
              {anchor.why_now && <p className="mt-3 text-sm"><span className="font-semibold">Why now: </span>{anchor.why_now}</p>}
              {anchor.backup_options && anchor.backup_options.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold">Backup: </span>{anchor.backup_options.join(", ")}</p>
              )}
            </div>
          )}
          {heroImage && (
            <a href={heroImage.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center hover:bg-muted transition-colors">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">Find a hero image here</div>
              <div className="text-xs text-muted-foreground">{heroImage.title}</div>
            </a>
          )}
          {career.description && (<div><h2 className="text-2xl font-bold mb-2">About this career</h2><p className="text-foreground/90 leading-relaxed">{career.description}</p></div>)}
          {career.ai_cs_application && (
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />How CS/AI shows up in this role</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">{career.ai_cs_application}</div>
            </div>
          )}
          {career.where_mn_does_this && (
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Where this work happens in Minnesota</h2>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{career.where_mn_does_this}</p>
            </div>
          )}
          {career.education_pathway_text && (
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Education pathway</h2>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{career.education_pathway_text}</p>
            </div>
          )}
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
          {resourceCards.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Video className="h-5 w-5 text-primary" />Videos and resources</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {resourceCards.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-border bg-card p-4 shadow-card hover:border-primary transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-primary">{r.kind}</div>
                        <div className="font-semibold mt-0.5 group-hover:text-primary line-clamp-2">{r.title}</div>
                        {r.subtitle && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.subtitle}</div>}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
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
