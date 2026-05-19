import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, ExternalLink } from "lucide-react";
import { fetchConsortia, fetchConsortiumPreview, type ConsortiumRow } from "@/lib/queries";

// ---- Layout ----------------------------------------------------------------
// Tile grid (greater MN). Cols 0..4, rows 0..5. The Twin Cities Metro block
// occupies a 2×2 area at (col 3, row 3) and is rendered as an inset of 8
// smaller metro-consortium tiles.
const TILE = 76;                 // tile pitch incl. gap
const GAP = 8;
const TILE_SIZE = TILE - GAP;    // 68
const ORIGIN_X = 40;
const ORIGIN_Y = 50;

type Pos = { col: number; row: number; w?: number; h?: number };
const GREATER_POSITIONS: Record<string, Pos> = {
  pine_to_prairie:  { col: 0, row: 0 },
  lakes_country:    { col: 1, row: 0 },
  north_country:    { col: 2, row: 0 },
  true_north_stars: { col: 3, row: 0 },
  runestone:        { col: 1, row: 1 },
  central_lakes:    { col: 2, row: 1 },
  pine_technical:   { col: 3, row: 1 },
  lake_superior:    { col: 4, row: 1 },
  mid_minnesota:    { col: 1, row: 2 },
  great_river:      { col: 2, row: 2 },
  minnesota_west:   { col: 0, row: 4 },
  south_central:    { col: 1, row: 4 },
  riverland:        { col: 2, row: 5 },
  rochester_zed:    { col: 3, row: 5 },
  southeast:        { col: 4, row: 5 },
};

const METRO_BLOCK: Pos = { col: 3, row: 3, w: 2, h: 2 };

// Metro inset: 4 cols × 2 rows of mini tiles
const METRO_POSITIONS: Record<string, { mcol: number; mrow: number }> = {
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

function tileXY(col: number, row: number) {
  return { x: ORIGIN_X + col * TILE, y: ORIGIN_Y + row * TILE };
}

function colorFor(c: ConsortiumRow) {
  return REGION_COLOR[c.region_label] ?? "#5a6678";
}

function wrapLabel(name: string): string[] {
  // 2-line wrap for tile labels
  const parts = name.split(/\s+/);
  if (parts.length <= 1 || name.length <= 10) return [name];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
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

  const orderedCodes = useMemo(() => {
    // Tab order: greater MN by display_order, then metro by display_order
    return consortia.map((c) => c.code);
  }, [consortia]);

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

  // viewBox dimensions
  const cols = 5, rows = 6;
  const VB_W = ORIGIN_X * 2 + cols * TILE - GAP;
  const VB_H = ORIGIN_Y * 2 + rows * TILE - GAP + 20;

  // Metro inset geometry
  const metroOrigin = tileXY(METRO_BLOCK.col, METRO_BLOCK.row);
  const metroOuterW = (METRO_BLOCK.w ?? 1) * TILE - GAP;
  const metroOuterH = (METRO_BLOCK.h ?? 1) * TILE - GAP;
  const METRO_GAP = 4;
  const METRO_PAD = 10;
  const innerW = metroOuterW - METRO_PAD * 2;
  const innerH = metroOuterH - METRO_PAD * 2 - 16; // leave space for label
  const miniTileW = (innerW - METRO_GAP * 3) / 4;
  const miniTileH = (innerH - METRO_GAP) / 2;

  if (isLoading) {
    return <div className="w-full max-w-[640px] mx-auto aspect-[5/6] rounded-2xl bg-muted animate-pulse" />;
  }

  const greaterTiles = consortia.filter((c) => GREATER_POSITIONS[c.code]);
  const metroTiles = consortia.filter((c) => METRO_POSITIONS[c.code]);

  return (
    <div className="w-full" style={size ? { maxWidth: size } : undefined}>
      <h2 className="sr-only">Minnesota Perkins Consortia map. Use arrow keys to navigate regions; press Enter to open.</h2>
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
        {/* Map title chip */}
        <text x={ORIGIN_X} y={ORIGIN_Y - 18} fontSize="11" fontWeight={600} letterSpacing="2" fill="hsl(var(--muted-foreground))">
          MINNESOTA · PERKINS CTE CONSORTIA
        </text>

        {/* Greater-MN tiles */}
        {greaterTiles.map((c, i) => {
          const p = GREATER_POSITIONS[c.code];
          const { x, y } = tileXY(p.col, p.row);
          const isActive = activeCode === c.code;
          const lift = isActive ? 3 : 0;
          const fill = colorFor(c);
          const labels = wrapLabel(c.name);
          return (
            <g
              key={c.code}
              transform={`translate(0 ${-lift})`}
              style={{ transition: "transform 150ms ease, filter 150ms ease" }}
              onMouseEnter={() => setHoverCode(c.code)}
              onMouseLeave={() => setHoverCode(null)}
              onClick={() => { setSelectedCode(c.code); setFocusIndex(orderedCodes.indexOf(c.code)); }}
              role="button"
              aria-label={`${c.name} consortium, ${c.region_label}. Anchor: ${c.anchor_college}.`}
              className="cursor-pointer"
            >
              <rect
                x={x} y={y} width={TILE_SIZE} height={TILE_SIZE} rx={10}
                fill={fill}
                opacity={isActive ? 1 : 0.92}
                stroke="white" strokeWidth={1.5}
                style={{ filter: isActive ? "drop-shadow(0 4px 10px rgba(0,0,0,0.25))" : "none" }}
              />
              {focusIndex === orderedCodes.indexOf(c.code) && (
                <rect x={x - 3} y={y - 3} width={TILE_SIZE + 6} height={TILE_SIZE + 6} rx={12}
                      fill="none" stroke="hsl(var(--ring))" strokeWidth={2} strokeDasharray="5 3" />
              )}
              <text x={x + TILE_SIZE / 2} y={y + TILE_SIZE / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="10.5" fontWeight={600}
                    style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
                {labels.map((l, j) => (
                  <tspan key={j} x={x + TILE_SIZE / 2}
                         dy={j === 0 ? `-${(labels.length - 1) * 0.55}em` : "1.1em"}>{l}</tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Metro inset container */}
        <g>
          <rect
            x={metroOrigin.x} y={metroOrigin.y}
            width={metroOuterW} height={metroOuterH}
            rx={14}
            fill="hsl(var(--card))" stroke="#C36B2A" strokeWidth={1.5}
          />
          <text x={metroOrigin.x + METRO_PAD} y={metroOrigin.y + 14}
                fontSize="9" fontWeight={700} letterSpacing="1.5" fill="#C36B2A">
            TWIN CITIES METRO
          </text>
          {metroTiles.map((c) => {
            const mp = METRO_POSITIONS[c.code];
            const x = metroOrigin.x + METRO_PAD + mp.mcol * (miniTileW + METRO_GAP);
            const y = metroOrigin.y + METRO_PAD + 16 + mp.mrow * (miniTileH + METRO_GAP);
            const isActive = activeCode === c.code;
            const idx = orderedCodes.indexOf(c.code);
            const lift = isActive ? 2 : 0;
            // shorten label for tiny metro tiles
            const short = c.name
              .replace("Hennepin West", "Hennepin W")
              .replace("Northeast Metro", "NE Metro")
              .replace("Southwest Metro", "SW Metro")
              .replace("South Metro", "S Metro")
              .replace("Dakota County", "Dakota Co.")
              .replace("Saint Paul", "St. Paul");
            return (
              <g key={c.code}
                 transform={`translate(0 ${-lift})`}
                 style={{ transition: "transform 150ms ease" }}
                 onMouseEnter={() => setHoverCode(c.code)}
                 onMouseLeave={() => setHoverCode(null)}
                 onClick={() => { setSelectedCode(c.code); setFocusIndex(idx); }}
                 role="button"
                 aria-label={`${c.name} metro consortium.`}
                 className="cursor-pointer">
                <rect x={x} y={y} width={miniTileW} height={miniTileH} rx={6}
                      fill="#C36B2A" opacity={isActive ? 1 : 0.9}
                      stroke="white" strokeWidth={1} />
                {focusIndex === idx && (
                  <rect x={x - 2} y={y - 2} width={miniTileW + 4} height={miniTileH + 4} rx={8}
                        fill="none" stroke="hsl(var(--ring))" strokeWidth={1.5} strokeDasharray="3 2" />
                )}
                <text x={x + miniTileW / 2} y={y + miniTileH / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="8.5" fontWeight={600}
                      style={{ pointerEvents: "none", textShadow: "0 1px 1px rgba(0,0,0,0.35)" }}>
                  {short}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      <div className="mt-4 min-h-[120px] rounded-xl border border-border bg-card p-4 text-card-foreground" aria-live="polite">
        {activeConsortium ? (
          <div className="flex items-start gap-3">
            <span className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: colorFor(activeConsortium) }} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
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