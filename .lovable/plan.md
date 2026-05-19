## Problem

The `MN_OUTLINE_PATH` in `src/components/mnOutline.ts` currently renders a distorted Minnesota silhouette. The previous regeneration used a hand-rolled Mercator-ish projection with `lngScale = cos(midLat)` applied to a simplified single-ring extraction. That produced a path that fits the viewBox but loses the recognizable shape (Northwest Angle, Arrowhead/Iron Range corner against Lake Superior, southern straight edge, eastern river border).

## Fix

Regenerate `MN_OUTLINE_PATH` from authoritative GeoJSON using `d3-geo`, which handles projection + path serialization correctly with `fitExtent`. No component-level code changes — only the constant in `mnOutline.ts` is replaced, and the projected dot positions in `MnConsortiaMap.tsx` (`GREATER_POINTS` + `METRO_ANCHOR`) are recomputed against the same projection so dots still land on the right cities.

### Steps

1. **Download a clean MN GeoJSON.** Use a known-good source — e.g. the US Atlas `states-10m.json` (TopoJSON from `us-atlas`) converted to GeoJSON for FIPS 27 (Minnesota), or `glynnbird/usstatesgeojson/minnesota.geojson`. Pick whichever yields a complete MultiPolygon (Northwest Angle included).
2. **Project with d3-geo, not by hand.**
   ```js
   import { geoMercator, geoPath } from "d3-geo";
   const projection = geoMercator().fitExtent(
     [[20, 30], [560, 490]],   // target box in the 880×540 viewBox
     mnFeature
   );
   const path = geoPath(projection);
   const d = path(mnFeature);   // full MultiPolygon, all rings, Northwest Angle preserved
   ```
   Round coords to 1 decimal to keep the string small.
3. **Write the result** to `src/components/mnOutline.ts` as `export const MN_OUTLINE_PATH = "..."`.
4. **Reproject the dots.** Run each consortium anchor `[lng, lat]` through the same `projection(...)` call and overwrite the `GREATER_POINTS` map and `METRO_ANCHOR` in `MnConsortiaMap.tsx` with the new `{x, y}` values. Same anchor list used previously (Thief River Falls, Bemidji, Virginia, Duluth, Brainerd, St. Cloud, Alexandria, Detroit Lakes, Pine City, Willmar, Mankato, Worthington, Austin, Rochester, Winona, and Minneapolis for `METRO_ANCHOR`).
5. **Visual check** in the preview at `/explore`: the silhouette should clearly show the NW Angle bump, the Arrowhead pointing NE into Lake Superior, the straight southern border, and the wavy Mississippi/St. Croix eastern border. Dots should sit on land in the right places.

## Files touched

- `src/components/mnOutline.ts` — replace `MN_OUTLINE_PATH` string.
- `src/components/MnConsortiaMap.tsx` — replace `GREATER_POINTS` numeric coords and `METRO_ANCHOR` only. No JSX, no logic changes.

## Out of scope

- The center hub in `CareerClusterWheel.tsx` (already updated previously and not part of this complaint).
- Any styling, legend, hover, or click behavior.
- Adding `d3-geo` as a runtime dependency — it's only used in the one-off generator script under `/tmp`; the app keeps a static path string.
