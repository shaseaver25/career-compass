import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCompanyBySlug } from "@/lib/queries";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareerCard } from "@/components/cards/CareerCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { InterviewCard } from "@/components/InterviewCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { Helmet } from "react-helmet-async";

const CompanyDetail = () => {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["company", slug], queryFn: () => fetchCompanyBySlug(slug) });
  if (isLoading) return <div className="container py-16"><div className="h-8 w-64 bg-muted rounded animate-pulse" /></div>;
  if (!data) return (<div className="container py-24 text-center"><h1 className="text-2xl font-bold">Company not found</h1><Button asChild className="mt-4" variant="outline"><Link to="/companies"><ArrowLeft className="mr-2 h-4 w-4" />Back to companies</Link></Button></div>);
  const { company, videos, careers, interviews, parent, children } = data as any;
  const primary = company.company_locations?.find((l: any) => l.is_primary) ?? company.company_locations?.[0];
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website ?? undefined,
    logo: company.logo_url ?? undefined,
    description: company.description ?? undefined,
    address: primary
      ? {
          "@type": "PostalAddress",
          addressLocality: primary.city,
          addressRegion: primary.state,
        }
      : undefined,
  };
  return (
    <>
      <SEO title={company.name} description={company.description ?? undefined} path={`/companies/${slug}`} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(orgLd)}</script>
      </Helmet>
      <section className="border-b border-border/60 bg-surface"><div className="container py-10">
        <Link to="/companies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="mr-1 h-4 w-4" />All companies</Link>
        {parent && (
          <div className="mb-3 text-sm text-muted-foreground">
            Part of <Link to={`/companies/${parent.slug}`} className="font-semibold text-foreground hover:underline">{parent.name}</Link>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-card text-4xl shadow-card">{company.logo_url ? <img src={company.logo_url} alt={`${company.name} logo`} className="h-full w-full rounded-2xl object-cover" /> : <span aria-hidden>{company.logo_emoji || "🏢"}</span>}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">{company.industry && <Badge variant="secondary">{company.industry}</Badge>}{primary && (<span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{primary.city}, {primary.state}</span>)}</div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{company.name}</h1>
          </div>
          <div className="flex items-center gap-2"><BookmarkButton kind="company" slug={company.slug} label={company.name} />{company.website && (<Button asChild variant="outline"><a href={company.website} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink className="ml-2 h-4 w-4" /></a></Button>)}</div>
        </div>
      </div></section>
      <section className="container py-10 grid gap-12 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          {company.description && (<div><h2 className="text-2xl font-bold mb-2">About</h2><p className="text-foreground/90 leading-relaxed">{company.description}</p></div>)}
          {children && children.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Departments &amp; subsidiaries</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {children.map((ch: any) => (
                  <Link key={ch.id} to={`/companies/${ch.slug}`} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-card hover:-translate-y-0.5 transition">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-xl">{ch.logo_emoji || "🏢"}</div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{ch.name}</div>
                      {ch.industry && <div className="text-xs text-muted-foreground">{ch.industry}</div>}
                      {ch.mn_employees && <div className="text-xs text-muted-foreground mt-0.5">~{ch.mn_employees.toLocaleString()} MN employees</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {videos.length > 0 && (<div><h2 className="text-2xl font-bold mb-4">Watch</h2><div className="grid gap-4 md:grid-cols-2">{videos.map((v: any) => <VideoEmbed key={v.id} url={v.url} title={v.title ?? undefined} />)}</div></div>)}
          {interviews.length > 0 && (<div><h2 className="text-2xl font-bold mb-4">Hear from the team</h2><div className="grid gap-4">{interviews.map((iv: any) => <InterviewCard key={iv.id} iv={iv} />)}</div></div>)}
        </div>
        <aside><h3 className="font-bold mb-3">Careers at {company.name}</h3>{careers.length === 0 ? <p className="text-sm text-muted-foreground">No careers linked yet.</p> : (<div className="grid gap-3">{careers.map((c: any) => <CareerCard key={c.id} c={c} />)}</div>)}</aside>
      </section>
    </>
  );
};
export default CompanyDetail;
