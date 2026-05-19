import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, ExternalLink } from "lucide-react";
import { fetchConsortia, fetchConsortiumPreview, type ConsortiumRow } from "@/lib/queries";
import { MN_OUTLINE_PATH } from "./mnOutline";

// ---- Geometry --------------------------------------------------------------
// Stylized MN silhouette in a 880×540 viewBox. Silhouette occupies x:20-560,
// Twin Cities Metro inset sits to the right at x:590-860.
const VB_W = 880;
const VB_H = 540;

// Greater-MN consortium markers, projected from real anchor-city lat/lng
// into the same projection used by MN_OUTLINE_PATH (equirectangular fitted
// to the silhouette region of the viewBox).
const GREATER_POINTS: Record<string, { x: number; y: number }> = {
  pine_to_prairie:  { x: 138.3, y: 128.8 }, // Thief River Falls
  lakes_country:    { x: 156.1, y: 230.4 }, // Detroit Lakes
  north_country:    { x: 208.4, y: 179.6 }, // Bemidji
  true_north_stars: { x: 336.5, y: 177.3 }, // Virginia / Hibbing
  runestone:        { x: 181.4, y: 303.9 }, // Alexandria
  central_lakes:    { x: 245.0, y: 266.4 }, // Brainerd
  pine_technical:   { x: 311.2, y: 307.8 }, // Pine City
  lake_superior:    { x: 358.1, y: 233.6 }, // Duluth
  mid_minnesota:    { x: 199.7, y: 363.3 }, // Willmar
  great_river:      { x: 247.1, y: 328.9 }, // St. Cloud
  minnesota_west:   { x: 169.6, y: 460.0 }, // Worthington (nudged off border)
  south_central:    { x: 256.3, y: 438.4 }, // Mankato
  riverland:        { x: 311.2, y: 460.0 }, // Austin (nudged off border)
  rochester_zed:    { x: 338.7, y: 449.3 }, // Rochester
  southeast:        { x: 382.9, y: 447.0 }, // Winona
};
// Twin Cities geographic center on the silhouette (Mpls), used as start of
// the dashed connector line to the Metro inset box.
const METRO_ANCHOR = { x: 295.1, y: 374.3 };

// Twin Cities Metro inset
const METRO_BOX = { x: 600, y: 220, w: 260, h: 220 };
const METRO_PAD = 18;
const METRO_LABEL_H = 22;
// 4 columns × 2 rows
const METRO_CELLS: Record<string, { mcol: number; mrow: number }> = {
  hennepin_west:   { mcol: 0, mrow: 0 },
  northeast_metro: { mcol: 1, mrow: 0 },
  oak_land:        { mcol: 2, mrow: 0 },
  dakota_county:   { mcol: 3, mrow: 0 },
  minneapolis:     { mcol: 0, mrow: 1 },
  saint_paul:      { mcol: 1, mrow: 1 },
  southwest_metro: { mcol: 2, mrow: 1 },
  south_metro:     { mcol: 3, mrow: 1 },
};

const REGION_COLOR: Record<string, string> = {
  "Northwest MN":           "#3D8C8A",
  "North Central MN":       "#2E5C8A",
  "Northeast MN":           "#1A3A5C",
  "Iron Range / Arrowhead": "#0F2A44",
  "West Central MN":        "#5A8A3A",
  "Central MN":             "#C9911E",
  "East Central MN":        "#C36B2A",
  "Southwest MN":           "#A0492A",
  "South Central MN":       "#B58A2B",
  "Southeast MN":           "#7D2B3A",
  "Twin Cities Metro":      "#C36B2A",
};

function colorFor(c: ConsortiumRow) {
  return REGION_COLOR[c.region_label] ?? "#5a6678";
}

export interface MnConsortiaMapProps {
  size?: number;
}

export function MnConsortiaMap({ size }: MnConsortiaMapProps) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const { data: consortia = [], isLoading } = useQuery({
    queryKey: ["mn-consortia"], queryFn: fetchConsortia,
  });

  // Ordering: greater MN first, then metro — by display_order within each.
  const ordered = useMemo(() => {
    const greater = consortia.filter((c) => !c.is_metro);
    const metro = consortia.filter((c) => c.is_metro);
    return [...greater, ...metro];
  }, [consortia]);
  const orderedCodes = useMemo(() => ordered.map((c) => c.code), [ordered]);
  const numberOf = useMemo(() => {
    const m = new Map<string, number>();
    ordered.forEach((c, i) => m.set(c.code, i + 1));
    return m;
  }, [ordered]);

  const previewQuery = useQuery({
    queryKey: ["consortium-preview", selectedCode],
    queryFn: () => fetchConsortiumPreview(selectedCode as string),
    enabled: !!selectedCode,
  });

  const byCode = useMemo(() => new Map(consortia.map((c) => [c.code, c])), [consortia]);

  const activeCode = selectedCode ?? hoverCode;
  const activeConsortium = activeCode ? byCode.get(activeCode) ?? null : null;

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (consortia.length === 0) return;
    const N = orderedCodes.length;
    if (["ArrowRight", "ArrowDown"].includes(e.key)) {
      e.preventDefault(); setFocusIndex((focusIndex + 1 + N) % N);
      setSelectedCode(orderedCodes[(focusIndex + 1 + N) % N]);
    } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
      e.preventDefault(); setFocusIndex((focusIndex - 1 + N) % N);
      setSelectedCode(orderedCodes[(focusIndex - 1 + N) % N]);
    } else if (e.key === "Home") {
      e.preventDefault(); setFocusIndex(0); setSelectedCode(orderedCodes[0]);
    } else if (e.key === "End") {
      e.preventDefault(); setFocusIndex(N - 1); setSelectedCode(orderedCodes[N - 1]);
    } else if (e.key === "Escape") {
      setSelectedCode(null); setFocusIndex(-1);
    }
  };

  // Metro inset geometry (mini-cell math)
  const METRO_GAP = 8;
  const innerW = METRO_BOX.w - METRO_PAD * 2;
  const innerH = METRO_BOX.h - METRO_PAD * 2 - METRO_LABEL_H;
  const miniTileW = (innerW - METRO_GAP * 3) / 4;
  const miniTileH = (innerH - METRO_GAP) / 2;
  const metroMarkerR = Math.min(miniTileW, miniTileH) / 2 - 4;

  if (isLoading) {
    return <div className="w-full aspect-[16/10] rounded-2xl bg-muted animate-pulse" />;
  }

  const greaterList = ordered.filter((c) => !c.is_metro);
  const metroList = ordered.filter((c) => c.is_metro);
  const MARKER_R = 18;

  return (
    <div className="w-full" style={size ? { maxWidth: size } : undefined}>
      <h2 className="sr-only">Minnesota Perkins Consortia map. Use arrow keys to navigate regions; press Enter to open.</h2>
      <div className="grid gap-6 md:grid-cols-[1fr_220px] items-start">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="application"
          aria-label="Minnesota Perkins Consortia regions"
          className="w-full h-auto select-none focus:outline-none"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setFocusIndex(-1)}
        >
          <text x={20} y={28} fontSize="11" fontWeight={600} letterSpacing="2" fill="hsl(var(--muted-foreground))">
            MINNESOTA · PERKINS CTE CONSORTIA
          </text>

          {/* Real MN state boundary (GeoJSON-derived) */}
          <path d={MN_OUTLINE_PATH}
                fill="hsl(var(--muted))"
                stroke="hsl(var(--border))" strokeWidth={1}
                strokeLinejoin="round" strokeLinecap="round" />

          {/* Connector from Twin Cities geographic spot to inset box */}
          <line x1={METRO_ANCHOR.x} y1={METRO_ANCHOR.y}
                x2={METRO_BOX.x} y2={METRO_BOX.y + METRO_BOX.h / 2}
                stroke="#C36B2A" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.55} />
          <circle cx={METRO_ANCHOR.x} cy={METRO_ANCHOR.y} r={4}
                  fill="#C36B2A" opacity={0.75} />

          {/* Greater-MN markers */}
          {greaterList.map((c) => {
            const p = GREATER_POINTS[c.code];
            if (!p) return null;
            const isActive = activeCode === c.code;
            const idx = orderedCodes.indexOf(c.code);
            const isFocused = focusIndex === idx;
            const r = isActive ? MARKER_R + 3 : MARKER_R;
            const fill = colorFor(c);
            const n = numberOf.get(c.code) ?? "";
            return (
              <g key={c.code}
                 onMouseEnter={() => setHoverCode(c.code)}
                 onMouseLeave={() => setHoverCode(null)}
                 onClick={() => { setSelectedCode(c.code); setFocusIndex(idx); }}
                 role="button"
                 tabIndex={-1}
                 aria-label={`${n}. ${c.name} consortium, ${c.region_label}. Anchor: ${c.anchor_college}.`}
                 className="cursor-pointer"
                 style={{ transition: "transform 150ms ease" }}>
                {isFocused && (
                  <circle cx={p.x} cy={p.y} r={r + 4}
                          fill="none" stroke="hsl(var(--ring))" strokeWidth={2} strokeDasharray="4 3" />
                )}
                <circle cx={p.x} cy={p.y} r={r}
                        fill={fill}
                        opacity={isActive ? 1 : 0.94}
                        stroke="white" strokeWidth={2}
                        style={{ filter: isActive ? "drop-shadow(0 3px 8px rgba(0,0,0,0.3))" : "none" }} />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize="13" fontWeight={700}
                      style={{ pointerEvents: "none", textShadow: "0 1px 1px rgba(0,0,0,0.35)" }}>
                  {n}
                </text>
              </g>
            );
          })}

          {/* Metro inset */}
          <g>
            <rect x={METRO_BOX.x} y={METRO_BOX.y} width={METRO_BOX.w} height={METRO_BOX.h}
                  rx={14} fill="hsl(var(--card))"
                  stroke="#C36B2A" strokeWidth={1.5} />
            <text x={METRO_BOX.x + METRO_PAD} y={METRO_BOX.y + 16}
                  fontSize="10" fontWeight={700} letterSpacing="1.5" fill="#C36B2A">
              TWIN CITIES METRO
            </text>
            {metroList.map((c) => {
              const mp = METRO_CELLS[c.code];
              if (!mp) return null;
              const cx = METRO_BOX.x + METRO_PAD + mp.mcol * (miniTileW + METRO_GAP) + miniTileW / 2;
              const cy = METRO_BOX.y + METRO_PAD + METRO_LABEL_H + mp.mrow * (miniTileH + METRO_GAP) + miniTileH / 2;
              const isActive = activeCode === c.code;
              const idx = orderedCodes.indexOf(c.code);
              const isFocused = focusIndex === idx;
              const r = isActive ? metroMarkerR + 2 : metroMarkerR;
              const n = numberOf.get(c.code) ?? "";
              return (
                <g key={c.code}
                   onMouseEnter={() => setHoverCode(c.code)}
                   onMouseLeave={() => setHoverCode(null)}
                   onClick={() => { setSelectedCode(c.code); setFocusIndex(idx); }}
                   role="button"
                   tabIndex={-1}
                   aria-label={`${n}. ${c.name} metro consortium.`}
                   className="cursor-pointer">
                  {isFocused && (
                    <circle cx={cx} cy={cy} r={r + 3}
                            fill="none" stroke="hsl(var(--ring))" strokeWidth={1.5} strokeDasharray="3 2" />
                  )}
                  <circle cx={cx} cy={cy} r={r}
                          fill="#C36B2A" opacity={isActive ? 1 : 0.92}
                          stroke="white" strokeWidth={1.5} />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                        fill="white" fontSize="11" fontWeight={700}
                        style={{ pointerEvents: "none" }}>
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <aside className="rounded-xl border border-border bg-card p-3 text-xs max-h-[520px] overflow-auto">
          <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Greater Minnesota
          </div>
          <ul className="space-y-0.5">
            {greaterList.map((c) => {
              const n = numberOf.get(c.code);
              const isActive = activeCode === c.code;
              return (
                <li key={c.code}>
                  <button type="button"
                          onMouseEnter={() => setHoverCode(c.code)}
                          onMouseLeave={() => setHoverCode(null)}
                          onClick={() => { setSelectedCode(c.code); setFocusIndex(orderedCodes.indexOf(c.code)); }}
                          className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${isActive ? "bg-muted" : "hover:bg-muted/60"}`}>
                    <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: colorFor(c) }}>
                      {n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{c.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{c.anchor_college}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Twin Cities Metro
          </div>
          <ul className="space-y-0.5">
            {metroList.map((c) => {
              const n = numberOf.get(c.code);
              const isActive = activeCode === c.code;
              return (
                <li key={c.code}>
                  <button type="button"
                          onMouseEnter={() => setHoverCode(c.code)}
                          onMouseLeave={() => setHoverCode(null)}
                          onClick={() => { setSelectedCode(c.code); setFocusIndex(orderedCodes.indexOf(c.code)); }}
                          className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${isActive ? "bg-muted" : "hover:bg-muted/60"}`}>
                    <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: "#C36B2A" }}>
                      {n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{c.name}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{c.anchor_college}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {/* Detail panel */}
      <div className="mt-4 min-h-[120px] rounded-xl border border-border bg-card p-4 text-card-foreground" aria-live="polite">
        {activeConsortium ? (
          <div className="flex items-start gap-3">
            <span className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: colorFor(activeConsortium) }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                #{numberOf.get(activeConsortium.code)} ·{" "}
                {activeConsortium.region_label}
                {activeConsortium.is_metro && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal">metro</span>
                )}
              </div>
              <div className="mt-0.5 text-lg font-semibold">{activeConsortium.name}</div>
              <div className="text-xs text-muted-foreground">Anchor: {activeConsortium.anchor_college}</div>

              {selectedCode === activeConsortium.code ? (
                previewQuery.isLoading ? (
                  <div className="mt-3 text-sm text-muted-foreground">Loading companies and careers…</div>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{previewQuery.data?.companies.length ?? 0}</span> companies
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{previewQuery.data?.careers.length ?? 0}</span> careers
                      </span>
                    </div>

                    {(previewQuery.data?.companies.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">Local companies</div>
                        <div className="flex flex-wrap gap-1.5">
                          {previewQuery.data!.companies.slice(0, 8).map((c: any) => (
                            <button key={c.id} type="button"
                                    onClick={() => navigate(`/companies/${c.slug}`)}
                                    className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary hover:text-primary">
                              {c.logo_emoji ? `${c.logo_emoji} ` : ""}{c.name}
                            </button>
                          ))}
                          {previewQuery.data!.companies.length > 8 && (
                            <span className="text-xs text-muted-foreground self-center">+{previewQuery.data!.companies.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {(previewQuery.data?.careers.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1.5">Careers offered here</div>
                        <div className="flex flex-wrap gap-1.5">
                          {previewQuery.data!.careers.slice(0, 10).map((c: any) => (
                            <button key={c.id} type="button"
                                    onClick={() => navigate(`/careers/${c.slug}`)}
                                    className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-primary hover:text-primary">
                              {c.title}
                            </button>
                          ))}
                          {previewQuery.data!.careers.length > 10 && (
                            <span className="text-xs text-muted-foreground self-center">+{previewQuery.data!.careers.length - 10} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {previewQuery.data && previewQuery.data.companies.length === 0 && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No companies in this consortium yet. <a href="mailto:hello@careercompass.mn" className="text-primary hover:underline">Nominate one →</a>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => navigate(`/companies?consortium=${activeConsortium.code}`)}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                        Browse companies <ExternalLink className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => navigate(`/careers?consortium=${activeConsortium.code}`)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                        Browse careers <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Click to load companies and careers in this region.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Hover or tab through the map to explore each Perkins consortium. Click to see local companies and careers.</p>
        )}
      </div>
    </div>
  );
}

export default MnConsortiaMap;