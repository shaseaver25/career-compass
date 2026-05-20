// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://everycareerneeds.tech";
const SUPABASE_URL = "https://ubjbegsfqedbefrbdidf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViamJlZ3NmcWVkYmVmcmJkaWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIwMDksImV4cCI6MjA5Mjg4ODAwOX0.jy-rB-ZwLls9FOrflF12k3qTPbRyi3KQsrl8Z7KUI8s";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

async function fetchSlugs(table: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=slug&status=eq.published`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { slug: string }[];
    return data.map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

function buildXml(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/careers", changefreq: "weekly", priority: "0.9" },
    { path: "/companies", changefreq: "weekly", priority: "0.9" },
    { path: "/explore", changefreq: "monthly", priority: "0.8" },
  ];
  const [careerSlugs, companySlugs] = await Promise.all([
    fetchSlugs("careers"),
    fetchSlugs("companies"),
  ]);
  for (const s of careerSlugs) entries.push({ path: `/careers/${s}`, changefreq: "monthly", priority: "0.7" });
  for (const s of companySlugs) entries.push({ path: `/companies/${s}`, changefreq: "monthly", priority: "0.7" });
  writeFileSync(resolve("public/sitemap.xml"), buildXml(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();