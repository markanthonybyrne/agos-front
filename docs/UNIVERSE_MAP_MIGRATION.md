# Universe Map Migration Plan

## Overview
Migrating from hierarchical coordinate system (quadrant:sector:galaxy:planet) to X/Y grid system (1000x1000) with infinity-like zoom capabilities.

## Completed ✅

1. **Type System Updates**
   - `Planet` interface now includes `x`, `y` fields
   - `FleetDetails` and `FleetCoordinate` updated with X/Y support
   - API request types (`CreateFleetRequest`, `MoveFleetRequest`, `TravelTimeRequest`) use `destination_x`/`destination_y`

2. **Coordinate Utilities**
   - Added `calculateDistanceXY()` for Euclidean distance
   - Enhanced `calculateDistance()` to support both X/Y and legacy formats

3. **Fleet Components**
   - `FleetBuilder` - Accepts X,Y format, converts to X/Y for API
   - `MoveFleetDialog` - Uses X/Y inputs instead of hierarchical dropdowns
   - `FleetCommandPanel` - Finds planet X/Y coordinates before fleet creation
   - `useTravelTime` hook - Uses X/Y coordinates directly

4. **New Components Created**
   - `GridMapCanvas` - Canvas-based rendering with X/Y grid (1000x1000)
   - `MapControls` - Zoom/reset controls for the grid map

## In Progress 🔄

### Section 1: GridMapCanvas Component ✅
- [x] Base canvas rendering
- [x] X/Y coordinate conversion functions
- [x] Planet rendering at X/Y positions
- [x] Fleet travel line rendering
- [x] Zoom/pan functionality
- [x] Mouse interaction (hover, click, drag)

### Section 2: Integration with UniverseMap
- [ ] Add viewport state management to UniverseMap
- [ ] Replace planet-level view with GridMapCanvas
- [ ] Add zoom level detection (universe/quadrant/sector/system)
- [ ] Update planet click handler for system zoom level
- [ ] Integrate MapControls component

### Section 3: Planet Interaction Updates
- [ ] Update PlanetActionPanel to show different options based on:
  - Colony/Homeworld: Show planet details view
  - Occupied: Show attack/scout options
  - Free: Show colonize/scout options
- [ ] Ensure planet details open correctly from map click

### Section 4: Map State Management Refactor
- [ ] Replace hierarchical `MapState` with viewport-based state
- [ ] Remove `selectedQuadrant`, `selectedSector`, `selectedGalaxy` from state
- [ ] Use viewport center/zoom to determine visible regions
- [ ] Calculate hierarchical labels from X/Y for display only

### Section 5: Zoom Layer System
- [ ] Universe level (zoom ~0.5): Show all planets, quadrant regions
- [ ] Quadrant level (zoom ~1-2): Show planets in quadrant, sector regions
- [ ] Sector level (zoom ~3-5): Show planets in sector, galaxy regions
- [ ] Galaxy/System level (zoom >10): Show individual planets with details

## Implementation Strategy

### Phase 1: Parallel Implementation ✅
Create new GridMapCanvas alongside existing views. Allow toggling between old and new.

### Phase 2: Gradual Migration (Current)
Replace planet-level view first with GridMapCanvas, keeping other levels as-is for now.

### Phase 3: Full Integration
Replace all hierarchical views with grid-based rendering, using zoom levels for layering.

### Phase 4: Cleanup
Remove hierarchical navigation code, update all API calls, finalize coordinate system.

## Technical Notes

### Grid Coordinates
- Grid is 1000×1000 (coordinates 0-999)
- Backend computes hierarchical labels from X/Y
- Front-end should use X/Y for all calculations and positioning

### Zoom Levels
- **0.1-0.5**: Universe overview (all planets visible)
- **0.5-2**: Quadrant view (quadrant-level regions)
- **2-5**: Sector view (sector-level regions)
- **5-10**: Galaxy view (galaxy-level clustering)
- **10+**: System view (individual planets, details on click)

### Fleet Lines
- Render lines between origin X/Y and destination X/Y
- Color code by order_type (attack=red, defend=blue, etc.)
- Animate if desired (future enhancement)

### Planet Rendering
- Size scales with zoom level
- Show labels only at high zoom (>5)
- Hover states for interaction
- Click opens PlanetActionPanel with context-aware options

## Files Modified

### New Files
- `src/components/map/GridMapCanvas.tsx`
- `src/components/map/MapControls.tsx`

### Modified Files
- `src/types/api.types.ts` - Added X/Y fields to Planet, Fleet types
- `src/lib/coordinates.ts` - Added `calculateDistanceXY()`
- `src/api/endpoints/fleetsApi.ts` - Updated to use X/Y coordinates
- `src/features/fleets/FleetBuilder.tsx` - X/Y coordinate support
- `src/features/fleets/MoveFleetDialog.tsx` - X/Y inputs
- `src/components/fleet/FleetCommandPanel.tsx` - X/Y coordinate lookup
- `src/hooks/useTravelTime.ts` - X/Y coordinate usage

### Pending Updates
- `src/features/map/UniverseMap.tsx` - Major refactor to use GridMapCanvas
- `src/components/map/PlanetActionPanel.tsx` - Conditional options based on planet state
- Any other components using coordinate parsing

## Testing Checklist

- [ ] Planets render at correct X/Y positions
- [ ] Zoom/pan works smoothly
- [ ] Fleet lines render correctly between planets
- [ ] Planet clicks show appropriate action panel
- [ ] Distance calculations use Euclidean distance
- [ ] API calls use X/Y format
- [ ] Legacy coordinate format still works (for backward compatibility during migration)
- [ ] Performance is acceptable with large numbers of planets/fleets

## Future Enhancements

- Animated fleet travel lines
- Planet clusters at low zoom levels
- Region highlighting (quadrant/sector boundaries)
- Path finding visualization
- Real-time fleet position interpolation
- Fog of war based on visibility
- Coordinate search by X/Y input
