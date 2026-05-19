import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

type Grouping = {
  code: string;
  name: string;
  description: string;
  isCrossCutting: boolean;
  color: string;
};

type Cluster = {
  code: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  grouping: Grouping;
};

const GROUPINGS: Record<string, Grouping> = {
  BM:  { code: "BM",  name: "Building & Moving",           description: "Constructing the physical infrastructure and moving goods.", isCrossCutting: false, color: "#C16A4D" },
  CC:  { code: "CC",  name: "Caring for Communities",      description: "Supporting human well-being via health, education, and public service.", isCrossCutting: false, color: "#4F7C7E" },
  CE:  { code: "CE",  name: "Creating & Experiencing",     description: "Designing experiences, art, hospitality, and the cultural fabric.", isCrossCutting: false, color: "#A87844" },
  CR:  { code: "CR",  name: "Cultivating Resources",       description: "Stewarding land, food, energy, and natural systems.", isCrossCutting: false, color: "#6B8C4C" },
  IF:  { code: "IF",  name: "Investing in the Future",     description: "Allocating capital and financial systems.", isCrossCutting: false, color: "#5C6AA0" },
  CSS: { code: "CSS", name: "Connecting & Supporting Success", description: "Cross-cutting clusters that intersect with every other cluster.", isCrossCutting: true, color: "#7E4E80" },
};

const CLUSTERS: Cluster[] = [
  { code: "AMF", slug: "advanced-manufacturing",     name: "Advanced Manufacturing",         shortName: "Advanced Mfg",   description: "Modern production — robotics, additive, smart factories.", grouping: GROUPINGS.BM  },
  { code: "CON", slug: "construction",               name: "Construction",                   shortName: "Construction",   description: "Homes, buildings, roads, bridges, utilities.",            grouping: GROUPINGS.BM  },
  { code: "SCT", slug: "supply-chain",               name: "Supply Chain & Transportation",  shortName: "Supply Chain",   description: "Logistics, warehousing, transit, aviation.",              grouping: GROUPINGS.BM  },
  { code: "EDU", slug: "education",                  name: "Education",                      shortName: "Education",      description: "Teaching, training, instructional design.",               grouping: GROUPINGS.CC  },
  { code: "HHS", slug: "healthcare-human-services",  name: "Healthcare & Human Services",    shortName: "Healthcare",     description: "Medicine, nursing, therapy, social work.",                grouping: GROUPINGS.CC  },
  { code: "PSS", slug: "public-service-safety",      name: "Public Service & Safety",        shortName: "Public Service", description: "Government, law, emergency response, military.",          grouping: GROUPINGS.CC  },
  { code: "AED", slug: "arts-entertainment-design",  name: "Arts, Entertainment & Design",   shortName: "Arts & Design",  description: "Visual, performing, media, fashion, architecture.",       grouping: GROUPINGS.CE  },
  { code: "HET", slug: "hospitality-events-tourism", name: "Hospitality, Events & Tourism",  shortName: "Hospitality",    description: "Lodging, food service, travel, events.",                  grouping: GROUPINGS.CE  },
  { code: "AGR", slug: "agriculture",                name: "Agriculture",                    shortName: "Agriculture",    description: "Farming, food production, agribusiness, ag science.",     grouping: GROUPINGS.CR  },
  { code: "ENR", slug: "energy-natural-resources",   name: "Energy & Natural Resources",     shortName: "Energy",         description: "Power, renewables, water, mining, environment.",          grouping: GROUPINGS.CR  },
  { code: "FIN", slug: "financial-services",         name: "Financial Services",             shortName: "Finance",        description: "Banking, investment, insurance, accounting.",             grouping: GROUPINGS.IF  },
  { code: "DTC", slug: "digital-technology",         name: "Digital Technology",             shortName: "Digital Tech",   description: "Software, AI/ML, data, cybersecurity, cloud. Cross-cuts every other cluster.", grouping: GROUPINGS.CSS },
  { code: "MGT", slug: "management-entrepreneurship",name: "Management & Entrepreneurship",  shortName: "Management",     description: "Leadership, operations, founding/scaling.",               grouping: GROUPINGS.CSS },
  { code: "MKS", slug: "marketing-sales",            name: "Marketing & Sales",              shortName: "Marketing",      description: "Brand, growth, and sales across industries.",             grouping: GROUPINGS.CSS },
];

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annularSector(cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number) {
  const so = polarToCartesian(cx, cy, rOuter, endDeg);
  const eo = polarToCartesian(cx, cy, rOuter, startDeg);
  const si = polarToCartesian(cx, cy, rInner, startDeg);
  const ei = polarToCartesian(cx, cy, rInner, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return ["M", so.x, so.y, "A", rOuter, rOuter, 0, largeArc, 0, eo.x, eo.y, "L", si.x, si.y, "A", rInner, rInner, 0, largeArc, 1, ei.x, ei.y, "Z"].join(" ");
}

export interface CareerClusterWheelProps {
  onClusterClick?: (cluster: { slug: string; code: string; name: string }) => void;
  highlightTechClusters?: boolean;
  showGroupingLabels?: boolean;
  size?: number;
}

export function CareerClusterWheel({ onClusterClick, highlightTechClusters = false, showGroupingLabels = true, size }: CareerClusterWheelProps) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const VB = 640, cx = VB / 2, cy = VB / 2;
  const rCenter = 86, rClusterInner = 92, rClusterOuter = 222, rGroupingInner = 226, rGroupingOuter = 286;
  const wedgeAngle = 360 / CLUSTERS.length;

  const groupingArcs = useMemo(() => {
    const arcs: { grouping: Grouping; startDeg: number; endDeg: number }[] = [];
    let cur: Grouping | null = null;
    let curStart = 0;
    CLUSTERS.forEach((c, i) => {
      const start = i * wedgeAngle;
      if (cur && cur.code !== c.grouping.code) {
        arcs.push({ grouping: cur, startDeg: curStart, endDeg: start });
        curStart = start;
      }
      cur = c.grouping;
    });
    if (cur) arcs.push({ grouping: cur, startDeg: curStart, endDeg: 360 });
    return arcs;
  }, [wedgeAngle]);

  const fireClick = (cluster: Cluster) => {
    if (onClusterClick) onClusterClick({ slug: cluster.slug, code: cluster.code, name: cluster.name });
    else navigate(`/careers?cluster=${cluster.slug}`);
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); setFocusIndex((focusIndex + 1 + CLUSTERS.length) % CLUSTERS.length); }
    else if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); setFocusIndex((focusIndex - 1 + CLUSTERS.length) % CLUSTERS.length); }
    else if ((e.key === "Enter" || e.key === " ") && focusIndex >= 0) { e.preventDefault(); fireClick(CLUSTERS[focusIndex]); }
    else if (e.key === "Home") { e.preventDefault(); setFocusIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setFocusIndex(CLUSTERS.length - 1); }
  };

  const activeCluster: Cluster | null = focusIndex >= 0 ? CLUSTERS[focusIndex] : CLUSTERS.find((c) => c.code === hoverCode) ?? null;

  return (
    <div className="w-full" style={size ? { maxWidth: size } : undefined}>
      <h2 className="sr-only">Career Clusters wheel. Use arrow keys to navigate, press Enter to open a cluster.</h2>
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} role="application" aria-label="Interactive ACTE Career Clusters wheel" className="w-full h-auto select-none focus:outline-none" tabIndex={0} onKeyDown={onKeyDown} onBlur={() => setFocusIndex(-1)}>
        {groupingArcs.map((arc, i) => {
          const midDeg = (arc.startDeg + arc.endDeg) / 2;
          const labelPos = polarToCartesian(cx, cy, (rGroupingInner + rGroupingOuter) / 2, midDeg);
          const dim = highlightTechClusters && !arc.grouping.isCrossCutting;
          return (
            <g key={`group-${i}`} aria-hidden="true">
              <path d={annularSector(cx, cy, rGroupingInner, rGroupingOuter, arc.startDeg, arc.endDeg)} fill={arc.grouping.color} opacity={dim ? 0.18 : 0.92} stroke="white" strokeWidth={2} />
              {showGroupingLabels && (
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight={500} style={{ pointerEvents: "none" }}>
                  {arc.grouping.name.split(" & ").map((part, j, all) => (
                    <tspan key={j} x={labelPos.x} dy={j === 0 ? `-${(all.length - 1) * 0.5}em` : "1.05em"}>
                      {part}{j < all.length - 1 ? " &" : ""}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
        {CLUSTERS.map((cluster, i) => {
          const startDeg = i * wedgeAngle;
          const endDeg = (i + 1) * wedgeAngle;
          const midDeg = startDeg + wedgeAngle / 2;
          const isHover = hoverCode === cluster.code;
          const isFocus = focusIndex === i;
          const isCross = cluster.grouping.isCrossCutting;
          const dim = highlightTechClusters && !isCross;
          const lifted = isHover || isFocus;
          const liftRad = ((midDeg - 90) * Math.PI) / 180;
          const dx = lifted ? Math.cos(liftRad) * 6 : 0;
          const dy = lifted ? Math.sin(liftRad) * 6 : 0;
          const labelPos = polarToCartesian(cx, cy, (rClusterInner + rClusterOuter) / 2, midDeg);
          return (
            <g key={cluster.code} transform={`translate(${dx} ${dy})`} style={{ transition: "transform 150ms ease" }} onMouseEnter={() => setHoverCode(cluster.code)} onMouseLeave={() => setHoverCode(null)} onClick={() => fireClick(cluster)} onFocus={() => setFocusIndex(i)} role="button" aria-label={`${cluster.name}. Part of ${cluster.grouping.name}${isCross ? ", cross-cutting cluster" : ""}. ${cluster.description}`} className="cursor-pointer">
              <path d={annularSector(cx, cy, rClusterInner, rClusterOuter, startDeg, endDeg)} fill={cluster.grouping.color} opacity={dim ? 0.22 : lifted ? 1 : 0.86} stroke="white" strokeWidth={1.5} />
              {isFocus && (<path d={annularSector(cx, cy, rClusterInner - 3, rClusterOuter + 3, startDeg, endDeg)} fill="none" stroke="hsl(var(--ring, 222 84% 4%))" strokeWidth={2} strokeDasharray="5 3" />)}
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight={500} style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.35)", opacity: dim ? 0.6 : 1 }}>
                {cluster.shortName}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rCenter} fill="hsl(var(--card, 0 0% 100%))" stroke="hsl(var(--border, 0 0% 90%))" strokeWidth={1} />
        <text x={cx} y={cy - 18} textAnchor="middle" fontSize="14" fontWeight={600} fill="hsl(var(--foreground, 0 0% 10%))">Career</text>
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="14" fontWeight={600} fill="hsl(var(--foreground, 0 0% 10%))">Clusters</text>
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground, 0 0% 45%))">click a wedge</text>
        <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground, 0 0% 45%))" fontStyle="italic">ACTE · 2024 framework</text>
      </svg>
      <div className="mt-4 min-h-[88px] rounded-xl border border-border bg-card p-4 text-card-foreground" aria-live="polite">
        {activeCluster ? (
          <div className="flex items-start gap-3">
            <span className="mt-1.5 inline-block h-3 w-3 flex-shrink-0 rounded-full" style={{ background: activeCluster.grouping.color }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {activeCluster.grouping.name}
                {activeCluster.grouping.isCrossCutting && (<span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal">cross-cutting</span>)}
              </div>
              <div className="mt-0.5 text-lg font-semibold">{activeCluster.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{activeCluster.description}</p>
              <button type="button" onClick={() => fireClick(activeCluster)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded">
                Browse careers in {activeCluster.shortName} →
              </button>
            </div>
          </div>
        ) : (<p className="text-sm text-muted-foreground">Hover or tab through the wheel to explore each cluster.</p>)}
      </div>
    </div>
  );
}

export default CareerClusterWheel;