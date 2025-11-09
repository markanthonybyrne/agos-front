# Region/System Coordinate Mapping Explanation

## Overview

Astralus now exposes planetary locations using the `region:system:planet` triplet. These identifiers are derived from the canonical X/Y grid (`grid_width = 2000`, `grid_height = 1000`) using a deterministic slice calculation. The backend still stores and returns X/Y values; the hierarchical triplet is generated on demand and persisted on planet records for convenience.

Default universe constants (overridable in configuration):

| Constant             | Value | Notes                                            |
| -------------------- | ----- | ------------------------------------------------ |
| `grid_width`         | 2000  | Total width of the playable grid                 |
| `grid_height`        | 1000  | Total height of the playable grid                |
| `region_count`       | 20    | Number of regions along the X axis               |
| `systems_per_region` | 125   | Systems partition each region into narrow slices |
| `planets_per_system` | 17    | Deterministic hash assigns planet indices        |

Geometry records (`region_geometries`, `system_geometries`) can override the simple slices to snap to artist-authored polygons. When those tables contain entries the CoordinateService honours them; otherwise it falls back to the math below.

---

## Mapping X/Y → Region/System/Planet

Given an integer X/Y pair inside the configured grid:

1. **Region calculation**

   ```text
   region_width = grid_width / region_count
   region = floor(x / region_width) + 1
   region_min_x = (region - 1) * region_width
   ```

2. **System calculation**

   ```text
   system_width = region_width / systems_per_region
   system = floor((x - region_min_x) / system_width) + 1
   ```

3. **Planet calculation**
   ```text
   planet = (abs(crc32("${round(x)}-${round(y)}")) % planets_per_system) + 1
   ```

The CRC32 hash guarantees that the same X/Y pair always resolves to the same planet index. Geometry overrides can snap the point to polygon bounds but the final identifiers remain identical.

---

## Mapping Region/System/Planet → X/Y

To produce a representative X/Y for rendering (centre of polygon when available, otherwise slice centre):

```text
region_min_x = (region - 1) * region_width
system_min_x = region_min_x + (system - 1) * system_width
x = round(system_min_x + system_width / 2)

planet_band_height = grid_height / planets_per_system
y = round((planet - 0.5) * planet_band_height)
```

When geometry overrides exist, the CoordinateService returns the centroid of the polygon for the requested region/system instead of the slice centre. The fallback logic implemented in `regionSystemToXy` mirrors the calculation above and is sufficient for front-end usage.

---

## Helper Functions (Frontend)

`src/lib/coordinateUtils.ts` exposes utility helpers that mirror the backend service:

- `xyToRegionSystem(x, y)` → `{ region, system, planet }`
- `regionSystemToXy(region, system, planet)` → `{ x, y }`
- `xyToHierarchical(x, y)` → legacy + new fields for backwards compatibility

`src/lib/coordinates.ts` provides higher-level helpers used throughout the UI:

- `normalizeCoordinate(input)` ensures any string/object resolves to `{ region, system, planet }`
- `resolveCoordinateToXY(input)` returns the hierarchy triplet plus a representative X/Y pair
- `formatCoordinate(input)` always emits `region:system:planet`
- `calculateDistance(origin, destination)` prefers X/Y when available and falls back to the helpers above

---

## Practical Usage

- **Forms & Inputs**: Accept both `X:123:456` and `region:system:planet` strings. Normalise inputs with `normalizeCoordinate` so legacy values are converted seamlessly.
- **API Requests**: Send both `target_region`, `target_system`, `target_planet` and the corresponding `target_x`, `target_y`. The backend derives the hierarchy from X/Y but having both ensures migrations remain deterministic.
- **Rendering**: Use `regionSystemToXy` for quick approximations when geometry data is unavailable. When geometry endpoints are cached locally, prefer their centroids for higher fidelity.
- **Display**: Use `formatCoordinate` to show `region:system:planet` consistently in the UI.

---

## Legacy Notes

The legacy 4-level `quadrant:sector:galaxy:planet` format has been retired. If you encounter historical data:

- Treat `quadrant` as `region`
- Treat `sector` as `system`
- Ignore the `galaxy` slot (no longer used)
- Convert using `normalizeCoordinate` to ensure consistent behaviour

Any new UI or API changes should operate exclusively on the Region/System hierarchy.
