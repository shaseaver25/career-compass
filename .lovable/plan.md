## Goal

Replace the placeholder hub in `CareerClusterWheel.tsx` so the center matches the MDE reference: a navy **Minnesota silhouette filling the center disc**, with white **"Career-Ready Practices"** text overlaid. Decorative only — no click handler.

## What changes

Only the center-disc block in `src/components/CareerClusterWheel.tsx` (lines ~259–270). Everything else (wedges, ring, sub-cluster band, detail panel, keyboard nav) is untouched.

Replace the current crude path + two text lines with:

1. The existing white/navy disc background (unchanged).
2. A proper, recognizable MN silhouette `<path>` — same hand-tuned outline used in `MnConsortiaMap.tsx` (NW Angle bump, Iron Range arrowhead, Lake Superior shore, east river curve, southern straight edge), scaled and centered to fit inside `rCenter` with a small margin. Filled with `OUTER_NAVY`, no stroke.
3. Two `<text>` lines centered over the silhouette: **"Career-Ready"** and **"Practices"** in white, semi-bold, sized to read clearly against the navy. `pointer-events: none` and `aria-hidden` so they don't interfere with screen readers or hover.
4. Add a single `<title>Career-Ready Practices — Minnesota</title>` inside the hub `<g>` for accessibility.

## Technical notes

- Reuse the same outline path string from `MnConsortiaMap.tsx`. Wrap it in a `<g>` with `transform="translate(...) scale(...)"` computed from `rCenter` so it auto-scales if the wheel size changes. The path's native bounds are ~ (55,40) → (545,480); scale factor = `(rCenter * 1.7) / 490`, then translate so the bounding box centers on `(cx, cy)`.
- Keep `OUTER_NAVY` for the silhouette fill (already imported/used in the file).
- Text uses `fill="white"`, `fontSize` ~12, `fontWeight={600}`, positioned at `cy - 4` and `cy + 10` so it sits over the broad central part of the silhouette (not the thin Iron Range arrowhead).
- No new props, no new dependencies, no routing, no DB changes.

## Out of scope

- The map on `/explore` (already uses the same silhouette path).
- Any click/hover behavior on the hub.
- Sub-cluster band, wedge colors, or labels.
