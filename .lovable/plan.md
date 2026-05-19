## Goal

Redesign the "Explore by region" map on `/explore` so the 23 Perkins consortia are positioned **on a recognizable Minnesota outline** in their actual geographic areas, with a zoomed Metro inset for the 8 Twin Cities consortia. Numbered regions + a side legend keep the map readable without crowding tiny shapes with text.

## What the user sees

```text
┌───────────────────────────────────────────────────────────┐
│ MINNESOTA · PERKINS CTE CONSORTIA                         │
│                                                           │
│      ╭────── MN silhouette ──────╮     ┌── Legend ──┐    │
│      │  ①   ②   ③       ④      │     │ ① Pine to  │    │
│      │     ⑤   ⑥   ⑦   ⑧      │     │   Prairie  │    │
│      │       ⑨   ⑩          ╔═╗ │     │ ② Lakes... │    │
│      │  ⑪  ⑫            ╔═╝M╚╗│     │  ...        │    │
│      │              ⑬⑭⑮ ╚═══╝│     │ Metro inset│    │
│      ╰───────────────────────────╯     │ ⒂ Mpls ... │    │
│                                        └────────────┘    │
│ ┌─ Selected: ⑨ Mid Minnesota ─────────────────────────┐ │
│ │ Anchor: Ridgewater College · Central MN              │ │
│ │ [building icons] 4 companies   [briefcase] 12 careers│ │
│ │ ...chips, Browse companies, Browse careers           │ │
│ └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

- Each region is a colored polygon inside a stylized MN outline, numbered 1–15 for greater MN.
- The Twin Cities Metro area is rendered as an inset box (right of, or below, the silhouette) with 8 smaller numbered cells for the metro consortia (16–23).
- A legend lists `# — Name — Anchor` for every consortium, grouped Greater MN / Metro. Clicking a legend row selects that region (same behavior as clicking the shape).
- Hover or selection: region brightens and lifts; legend row highlights; existing detail panel below stays unchanged (companies, careers, Browse buttons).
- Keyboard nav and a11y semantics preserved from current component.

## Visual approach

- **Stylized SVG silhouette**: a single hand-tuned `<path>` approximating Minnesota's borders (NW arrowhead, Iron Range bump on NE, southern straight edge, river curve on the east). Drawn once, ~30 anchor points.
- **Region polygons**: ~15 hand-tuned polygons inside the silhouette, one per Greater MN consortium, colored by `region_label` using the existing `REGION_COLOR` palette (already in the component — kept verbatim).
- **Metro inset**: rounded rectangle outside the silhouette (right side on desktop, stacked below on mobile), with a thin connector line from the metro's geographic spot on the silhouette to the inset. Contains a 4×2 grid of smaller numbered cells.
- **Numbers**: centered SVG `<text>` in each shape; large enough to read at the silhouette scale. No consortium names inside shapes.
- **Legend**: HTML (not SVG) two-column list on desktop, single column on mobile. Each row: number badge in region color + name + tiny anchor college subtext. Hovering a row highlights the matching shape via shared `hoverCode` state.

## Files to change

1. **`src/components/MnConsortiaMap.tsx`** — full rewrite of the map portion:
   - Remove `GREATER_POSITIONS`, `METRO_BLOCK`, `tileXY`, tile-grid rendering, and `wrapLabel`.
   - Add `MN_OUTLINE_PATH` constant (the silhouette path).
   - Add `GREATER_REGIONS: Record<code, { points: string; numberAt: [x,y] }>` — polygon points + label anchor for each of the 15 greater-MN consortia.
   - Add `METRO_INSET` geometry (origin, size) and `METRO_CELLS: Record<code, {col,row}>` for the 8 metro cells.
   - Render order: silhouette fill → region polygons → metro inset box + connector → number labels.
   - Add `<aside>` legend beside/below the SVG using the same `consortia` query data and shared hover/select state.
   - Keep: `fetchConsortia`, `fetchConsortiumPreview` calls; detail panel JSX; keyboard nav; routing to `/companies?consortium=` and `/careers?consortium=`.

2. **`src/pages/Explore.tsx`** — widen the map container from `max-w-3xl` to `max-w-5xl` so the silhouette + legend fit side-by-side on desktop. No other changes.

No DB, queries, routing, or RLS changes. No new dependencies.

## Technical notes

- Polygon coordinates are authored by hand in viewBox units (e.g. `viewBox="0 0 600 520"`). They are approximate, not GIS-accurate — same trade-off the user already approved when they picked "stylized SVG" originally.
- Region → polygon mapping is driven by `consortium.code`, so if DB display_order shifts, the map still renders correctly.
- Numbering uses the existing `display_order` from `mn_perkins_consortia` so it matches any future admin reordering.
- Responsive: at `< md`, stack legend under the SVG; silhouette scales via `viewBox` + `w-full h-auto`.
- Existing color tokens (`hsl(var(--card))`, `hsl(var(--ring))`, `hsl(var(--muted-foreground))`) are reused — no new tokens.
- All interactive behavior (hover lift, focus ring, Enter to select, Esc to clear, detail panel, Browse buttons) preserved.

## Out of scope

- Real GeoJSON / accurate county boundaries.
- Pan/zoom on the silhouette.
- Changes to `/careers` or `/companies` filtering (already working via `?consortium=`).
- Any DB or queries.ts changes.
