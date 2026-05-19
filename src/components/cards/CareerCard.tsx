import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatSalary, growthLabel } from "@/lib/format";
import { TrendingUp } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";

export interface CareerCardData {
  slug: string; title: string; short_description: string | null;
  median_salary: number | null; growth_outlook: string | null; industry: string | null;
  primary_cluster?: { name: string; slug: string } | null;
}

export const CareerCard = ({ c }: { c: CareerCardData }) => (
  <Link to={`/careers/${c.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="flex items-start justify-between gap-3">
      <div>
        {c.primary_cluster?.name ? (
          <div className="text-xs font-medium text-primary mb-1">{c.primary_cluster.name}</div>
        ) : c.industry ? (
          <div className="text-xs font-medium text-primary mb-1">{c.industry}</div>
        ) : null}
        <h3 className="text-lg font-bold leading-tight">{c.title}</h3>
      </div>
      <BookmarkButton kind="career" slug={c.slug} label={c.title} />
    </div>
    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.short_description}</p>
    <div className="mt-4 flex items-center justify-between text-sm">
      <div>
        <div className="text-xs text-muted-foreground">Median salary</div>
        <div className="font-semibold">{formatSalary(c.median_salary)}</div>
      </div>
      {c.growth_outlook && (<Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" />{growthLabel[c.growth_outlook]}</Badge>)}
    </div>
  </Link>
);
