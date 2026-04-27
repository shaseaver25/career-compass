import { useCallback, useEffect, useState } from "react";

type Kind = "career" | "company";
const KEY = (k: Kind) => `cte:bookmarks:${k}`;

function read(k: Kind): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY(k)) || "[]"); } catch { return []; }
}

export function useBookmarks(kind: Kind) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => { setSlugs(read(kind)); }, [kind]);

  useEffect(() => {
    const handler = (e: StorageEvent) => { if (e.key === KEY(kind)) setSlugs(read(kind)); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [kind]);

  const toggle = useCallback((slug: string) => {
    setSlugs(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      localStorage.setItem(KEY(kind), JSON.stringify(next));
      return next;
    });
  }, [kind]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return { slugs, has, toggle };
}