import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";

export interface CompanyCardData {
  slug: string; name: string; description: string | null; industry: string | null;
  logo_emoji: string | null; logo_url: string | null;
  city?: string | null; state?: string | null; careers_count?: number;
}

export const CompanyCard = ({ c }: { c: CompanyCardData }) => (
  <Link to={`/companies/${c.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="flex items-start gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
        {c.logo_url ? <img src={c.logo_url} alt={`${c.name} logo`} className="h-full w-full rounded-xl object-cover" /> : <span aria-hidden>{c.logo_emoji || "🏢"}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-tight truncate">{c.name}</h3>
          <BookmarkButton kind="company" slug={c.slug} label={c.name} />
        </div>
        {c.industry && <div className="text-xs font-medium text-primary">{c.industry}</div>}
        {(c.city || c.state) && (<div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[c.city, c.state].filter(Boolean).join(", ")}</div>)}
      </div>
    </div>
    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
    {typeof c.careers_count === "number" && (<div className="mt-4 text-xs text-muted-foreground">{c.careers_count} {c.careers_count === 1 ? "career" : "careers"}</div>)}
  </Link>
);
