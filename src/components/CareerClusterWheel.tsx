import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchCareerFieldsAndClusters } from "@/lib/queries";

type Field = { id: string; code: string; name: string; color_hex: string; description: string | null; display_order: number };
type Cluster = { id: string; code: string; name: string; slug: string; description: string | null; grouping_id: string; is_cross_cutting: boolean; display_order: number };
type SubCluster = { id: string; code: string; name: string; slug: string; cluster_id: string; display_order: number };

const DTC_COLOR = "#C36B2A";
const OUTER_NAVY = "#1A3A5C";

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annularSector(cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number) {
  const so = polarToCartesian(cx, cy, rOuter, endDeg);
  const eo = polarToCartesian(cx, cy, rOuter, startDeg);
  const si = polarToCartesian(cx, cy, rInner, startDeg);
  const ei = polarToCartesian(cx, cy, rInner, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep <= 180 ? "0" : "1";
  return ["M", so.x, so.y, "A", rOuter, rOuter, 0, largeArc, 0, eo.x, eo.y, "L", si.x, si.y, "A", rInner, rInner, 0, largeArc, 1, ei.x, ei.y, "Z"].join(" ");
}

// Shift a hex color's lightness by a delta (-1..1) — simple HSL-ish adjustment.
function shadeHex(hex: string, lightnessShift: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const adjust = (c: number) => {
    const v = lightnessShift > 0 ? c + (255 - c) * lightnessShift : c * (1 + lightnessShift);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

export interface CareerClusterWheelProps {
  onClusterClick?: (cluster: { slug: string; code: string; name: string }) => void;
  onSubClusterClick?: (sub: { slug: string; name: string; clusterSlug: string }) => void;
  highlightTechClusters?: boolean;
  showFieldLabels?: boolean;
  showSubClusters?: boolean;
  size?: number;
}

export function CareerClusterWheel({
  onClusterClick,
  onSubClusterClick,
  highlightTechClusters = false,
  showFieldLabels = true,
  showSubClusters = true,
  size,
}: CareerClusterWheelProps) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const { data, isLoading } = useQuery({ queryKey: ["wheel-fields-clusters"], queryFn: fetchCareerFieldsAndClusters });

  const fields = (data?.fields ?? []) as Field[];
  const clusters = (data?.clusters ?? []) as Cluster[];
  const subClusters = (data?.subClusters ?? []) as SubCluster[];

  const VB = 720, cx = VB / 2, cy = VB / 2;
  const rCenter = 70;
  const rFieldInner = 70, rFieldOuter = 160;
  const rClusterInner = 160, rClusterOuter = 270;
  const rOuterInner = 270, rOuterOuter = 305;

  const N = clusters.length || 15;
  const wedge = 360 / N;
  const startOffset = -wedge / 2; // so the first cluster is centered on 12 o'clock

  // Field arcs span their member clusters (in display order).
  const fieldArcs = useMemo(() => {
    const out: { field: Field; startDeg: number; endDeg: number; firstIdx: number; lastIdx: number }[] = [];
    let cursor = 0;
    for (const f of [...fields].sort((a, b) => a.display_order - b.display_order)) {
      const members = clusters.filter((c) => c.grouping_id === f.id);
      if (members.length === 0) continue;
      const startDeg = startOffset + cursor * wedge;
      const endDeg = startOffset + (cursor + members.length) * wedge;
      out.push({ field: f, startDeg, endDeg, firstIdx: cursor, lastIdx: cursor + members.length - 1 });
      cursor += members.length;
    }
    return out;
  }, [fields, clusters, startOffset, wedge]);

  const fieldById = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);

  const fireClick = (cluster: Cluster) => {
    if (onClusterClick) onClusterClick({ slug: cluster.slug, code: cluster.code, name: cluster.name });
    else navigate(`/careers?cluster=${cluster.slug}`);
  };

  const fireSubClick = (sub: SubCluster, cluster: Cluster) => {
    if (onSubClusterClick) onSubClusterClick({ slug: sub.slug, name: sub.name, clusterSlug: cluster.slug });
    else navigate(`/careers?cluster=${cluster.slug}&pathway=${sub.slug}`);
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (clusters.length === 0) return;
    if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); setFocusIndex((focusIndex + 1 + N) % N); }
    else if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); setFocusIndex((focusIndex - 1 + N) % N); }
    else if ((e.key === "Enter" || e.key === " ") && focusIndex >= 0) { e.preventDefault(); fireClick(clusters[focusIndex]); }
    else if (e.key === "Home") { e.preventDefault(); setFocusIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setFocusIndex(N - 1); }
  };

  const activeCluster: Cluster | null =
    focusIndex >= 0 ? clusters[focusIndex] : clusters.find((c) => c.code === hoverCode) ?? null;
  const activeField = activeCluster ? fieldById.get(activeCluster.grouping_id) ?? null : null;
  const activeSubs = activeCluster ? subClusters.filter((s) => s.cluster_id === activeCluster.id) : [];

  // Path for outer-band textPath (a full circle along the middle of the band).
  const rOuterMid = (rOuterInner + rOuterOuter) / 2;
  // start at top, sweep clockwise. Two arcs to make a full circle (single arc with same start/end fails).
  const outerTextPath = `M ${cx} ${cy - rOuterMid} A ${rOuterMid} ${rOuterMid} 0 1 1 ${cx - 0.01} ${cy - rOuterMid} Z`;
  const outerLabelRepeated = " WORK-BASED LEARNING  ·  APPRENTICESHIPS ".repeat(6);

  if (isLoading) {
    return <div className="aspect-square w-full max-w-[640px] mx-auto rounded-full bg-muted animate-pulse" />;
  }

  return (
    <div className="w-full" style={size ? { maxWidth: size } : undefined}>
      <h2 className="sr-only">Minnesota Career Fields and Clusters wheel. Use arrow keys to navigate clusters; press Enter to open.</h2>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        role="application"
        aria-label="Minnesota Career Fields and Clusters wheel"
        className="w-full h-auto select-none focus:outline-none"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setFocusIndex(-1)}
      >
        <defs>
          <path id="wheel-outer-text-path" d={outerTextPath} fill="none" />
        </defs>

        {/* Outer band — Work-Based Learning */}
        <circle cx={cx} cy={cy} r={rOuterOuter} fill={OUTER_NAVY} />
        <circle cx={cx} cy={cy} r={rOuterInner} fill="hsl(var(--background, 0 0% 100%))" />
        <text fill="white" fontSize="11" fontWeight={600} letterSpacing="3">
          <textPath href="#wheel-outer-text-path" startOffset="0">{outerLabelRepeated}</textPath>
        </text>

        {/* Cluster wedges (middle ring) */}
        {clusters.map((cluster, i) => {
          const startDeg = startOffset + i * wedge;
          const endDeg = startDeg + wedge;
          const midDeg = startDeg + wedge / 2;
          const field = fieldById.get(cluster.grouping_id);
          const baseColor = cluster.is_cross_cutting ? DTC_COLOR : (field?.color_hex ?? "#888");
          // Subtle alternating shade for adjacent clusters within same field for depth
          const fill = cluster.is_cross_cutting ? DTC_COLOR : shadeHex(baseColor, i % 2 === 0 ? 0.06 : -0.04);
          const isHover = hoverCode === cluster.code;
          const isFocus = focusIndex === i;
          const dim = highlightTechClusters && !cluster.is_cross_cutting;
          const lifted = isHover || isFocus;
          const liftRad = ((midDeg - 90) * Math.PI) / 180;
          const dx = lifted ? Math.cos(liftRad) * 5 : 0;
          const dy = lifted ? Math.sin(liftRad) * 5 : 0;
          const labelPos = polarToCartesian(cx, cy, (rClusterInner + rClusterOuter) / 2, midDeg);
          const lines = cluster.name.split(/\s*&\s*|,\s*/);
          return (
            <g
              key={cluster.id}
              transform={`translate(${dx} ${dy})`}
              style={{ transition: "transform 150ms ease" }}
              onMouseEnter={() => setHoverCode(cluster.code)}
              onMouseLeave={() => setHoverCode(null)}
              onClick={() => fireClick(cluster)}
              onFocus={() => setFocusIndex(i)}
              role="button"
              aria-label={`${cluster.name}. Part of ${field?.name ?? ""}${cluster.is_cross_cutting ? ", cross-cutting cluster" : ""}.`}
              className="cursor-pointer"
            >
              <path
                d={annularSector(cx, cy, rClusterInner, rClusterOuter, startDeg, endDeg)}
                fill={fill}
                opacity={dim ? 0.25 : lifted ? 1 : 0.88}
                stroke="white"
                strokeWidth={1.5}
              />
              {isFocus && (
                <path
                  d={annularSector(cx, cy, rClusterInner - 3, rClusterOuter + 3, startDeg, endDeg)}
                  fill="none"
                  stroke="hsl(var(--ring, 222 84% 4%))"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              )}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="11"
                fontWeight={500}
                style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.35)", opacity: dim ? 0.6 : 1 }}
              >
                {lines.map((line, j) => (
                  <tspan key={j} x={labelPos.x} dy={j === 0 ? `-${(lines.length - 1) * 0.5}em` : "1.05em"}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Field wedges (inner ring) */}
        {fieldArcs.map((arc) => {
          const midDeg = (arc.startDeg + arc.endDeg) / 2;
          const labelPos = polarToCartesian(cx, cy, (rFieldInner + rFieldOuter) / 2, midDeg);
          const dim = highlightTechClusters; // dim all fields when focusing tech
          const lines = arc.field.name.split(/\s*&\s*/);
          return (
            <g key={arc.field.id} aria-hidden="true">
              <path
                d={annularSector(cx, cy, rFieldInner, rFieldOuter, arc.startDeg, arc.endDeg)}
                fill={arc.field.color_hex}
                opacity={dim ? 0.2 : 0.96}
                stroke="white"
                strokeWidth={2}
              />
              {showFieldLabels && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight={600}
                  style={{ pointerEvents: "none" }}
                >
                  {lines.map((line, j) => (
                    <tspan key={j} x={labelPos.x} dy={j === 0 ? `-${(lines.length - 1) * 0.55}em` : "1.1em"}>
                      {line}{j < lines.length - 1 ? " &" : ""}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}

        {/* Center hub: white disc + MN silhouette + Career-Ready Practices label */}
        {(() => {
          // MN outline path (native bounds ~ x:55-545, y:40-480 → 490×440)
          const MN_PATH =
            "M 90 40 L 130 40 L 130 70 L 470 70 L 480 95 L 500 110 L 530 150 L 545 200 L 510 235 L 470 270 L 445 305 L 425 345 L 460 380 L 450 430 L 470 480 L 90 480 L 60 470 L 55 380 L 60 280 L 70 180 L 80 90 Z";
          const NATIVE_W = 490, NATIVE_H = 440, NATIVE_CX = 300, NATIVE_CY = 260;
          // Fit silhouette inside the center disc with a small margin.
          const scale = (rCenter * 1.55) / NATIVE_W;
          const tx = cx - NATIVE_CX * scale;
          const ty = cy - NATIVE_CY * scale;
          return (
            <g aria-hidden>
              <title>Career-Ready Practices — Minnesota</title>
              <circle cx={cx} cy={cy} r={rCenter}
                      fill="hsl(var(--card, 0 0% 100%))"
                      stroke={OUTER_NAVY} strokeWidth={1.5} />
              <g transform={`translate(${tx} ${ty}) scale(${scale})`} fill={OUTER_NAVY}>
                <path d={MN_PATH} strokeLinejoin="round" />
              </g>
              <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
                    fontSize="13" fontWeight={700} fill="white"
                    style={{ pointerEvents: "none" }}>
                Career-Ready
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central"
                    fontSize="13" fontWeight={700} fill="white"
                    style={{ pointerEvents: "none" }}>
                Practices
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Detail panel */}
      <div className="mt-4 min-h-[88px] rounded-xl border border-border bg-card p-4 text-card-foreground" aria-live="polite">
        {activeCluster ? (
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-full"
              style={{ background: activeCluster.is_cross_cutting ? DTC_COLOR : activeField?.color_hex }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {activeField?.name}
                {activeCluster.is_cross_cutting && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal">cross-cutting</span>
                )}
              </div>
              <div className="mt-0.5 text-lg font-semibold">{activeCluster.name}</div>
              {activeCluster.description && <p className="mt-1 text-sm text-muted-foreground">{activeCluster.description}</p>}
              <button
                type="button"
                onClick={() => fireClick(activeCluster)}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                Browse careers in {activeCluster.name} →
              </button>
              {showSubClusters && activeSubs.length > 0 && (
                <div className="mt-3 -mx-1 overflow-x-auto">
                  <div className="flex gap-1.5 px-1 pb-1">
                    {activeSubs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => fireSubClick(s, activeCluster)}
                        className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Hover or tab through the wheel to explore each cluster and its pathways.</p>
        )}
      </div>
    </div>
  );
}

export default CareerClusterWheel;