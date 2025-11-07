# Fog of War Implementation Plan

## Overview

This document outlines the plan to fix the fog of war layer on the galaxy map to properly implement the three-tier reveal system as specified by the backend team.

## Current State Analysis

### Current Issues

1. **FogOfWarLayer.tsx** uses rectangular X/Y ranges from the visibility endpoint (approximations)
2. Only handles "visible" status systems/regions, ignores "fogged" status
3. Uses sharp rectangular masks instead of smooth gradients
4. Doesn't implement the three-tier reveal system (region/system/planet level)
5. Doesn't use planet-level `fog_of_war` data from the map endpoint
6. Planets don't have visual effects (opacity/blur) applied based on `discovery_status`

### What's Working

1. **GalaxyMap.tsx** already filters planets by `fog_of_war.is_visible`
2. Planets are fetched with `fog_of_war` data from the map endpoint
3. Visibility data is fetched and available
4. System markers layer exists and can be extended

## Implementation Plan

### Phase 1: Refactor FogOfWarLayer to Use Planet Data

**Goal**: Replace rectangular range-based fog with planet-position-based fog using actual planet `fog_of_war` data.

**Tasks**:

1. **Update FogOfWarLayer Props**
   - Add `planets: Planet[]` prop (with `fog_of_war` data)
   - Remove dependency on `visibilityData` for fog rendering (keep for other uses)
   - Add `gridWidth` and `gridHeight` props (already exist)

2. **Implement Three-Tier Reveal System**
   - **Region-Level Reveals**:
     - Filter planets where `fog_of_war.region_visible === true`
     - Group by `coordinate.region`
     - Create large elliptical reveal areas covering all planets in each region
     - Use smooth radial gradients for edges
   - **System-Level Reveals**:
     - Filter planets where `fog_of_war.system_visible === true` AND `fog_of_war.region_visible === false`
     - Group by `coordinate.region:coordinate.system` key
     - Create medium elliptical reveal areas covering all planets in each system
     - Use smooth radial gradients for edges
   - **Planet-Level Reveals**:
     - Filter planets where `fog_of_war.planet_discovered === true` AND `fog_of_war.system_visible === false` AND `fog_of_war.region_visible === false`
     - Create small circular reveal areas around each individual planet
     - Use smooth radial gradients for edges

3. **Fog Overlay Rendering**
   - Fill entire canvas with dark fog (rgba(0, 0, 0, 0.75))
   - Use SVG masks or canvas composite operations to "cut out" reveal areas
   - Render reveals in order: region → system → planet (largest to smallest)
   - Use smooth gradients for professional RTS-style appearance

### Phase 2: Apply Visual Effects to Planets

**Goal**: Apply opacity and blur effects to planets based on their `discovery_status`.

**Tasks**:

1. **Update SystemMarkersLayer or Create PlanetVisualEffects Layer**
   - Apply opacity: 1.0 for "visible", 0.6 for "fogged"
   - Apply blur: 0px for "visible", 2px for "fogged"
   - Use CSS filters or SVG filters for blur effect

2. **Coordinate with Existing Planet Rendering**
   - Ensure visual effects don't conflict with existing planet rendering
   - Apply effects at the correct layer (after planets are rendered, before fog overlay)

### Phase 3: Integration and Testing

**Goal**: Integrate the new fog system with GalaxyMap and ensure everything works correctly.

**Tasks**:

1. **Update GalaxyMap.tsx**
   - Pass `planets` prop to `FogOfWarLayer`
   - Ensure planets array includes all visible/fogged planets (already filtered)
   - Verify layer ordering (fog should be on top)

2. **Performance Optimization**
   - Only render reveals for planets in viewport (viewport culling)
   - Cache reveal area calculations
   - Use `useMemo` for expensive calculations

3. **Testing Checklist**
   - [ ] Planets in visible regions render at full opacity with no blur
   - [ ] Planets in fogged systems render with 0.6 opacity and 2px blur
   - [ ] Hidden planets are not rendered (backend filters them)
   - [ ] Fog overlay correctly masks non-visible areas
   - [ ] Region-level reveals are large and cover entire regions
   - [ ] System-level reveals are medium-sized and cover systems
   - [ ] Planet-level reveals are small and cover individual planets
   - [ ] Smooth gradients on reveal edges (no sharp boundaries)
   - [ ] Performance is acceptable with 8000+ planets
   - [ ] Fog transitions smoothly when visibility changes

## Technical Implementation Details

### Reveal Area Sizing

- **Region-Level**:
  - Calculate bounding box of all planets in region
  - Add padding: 100px
  - Create elliptical reveal with smooth gradient
- **System-Level**:
  - Calculate bounding box of all planets in system
  - Add padding: 60px
  - Create elliptical reveal with smooth gradient
- **Planet-Level**:
  - Fixed radius: 40px
  - Create circular reveal with smooth gradient

### Gradient Specifications

Use radial gradients for smooth reveal edges:

```typescript
// Region-level gradient
gradient.addColorStop(0, 'rgba(0, 0, 0, 1)') // Fully opaque at center
gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.95)') // Mostly opaque
gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.8)') // Fading
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)') // Transparent at edge

// System-level gradient
gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)')
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

// Planet-level gradient
gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)')
gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
```

### SVG vs Canvas Approach

**Recommendation: Use SVG with masks** (current approach)

- Already using SVG for map rendering
- Better integration with existing code
- Easier to maintain and debug
- Can use SVG filters for blur effects

**Alternative: Canvas approach** (if performance issues)

- More control over rendering
- Better performance for large numbers of reveals
- Requires canvas layer integration

### Coordinate Conversion

Planets have X/Y coordinates in grid space (0-1999 for X, 0-999 for Y).
Convert to SVG viewBox coordinates for rendering:

```typescript
const svgX = (planet.coordinate.x / gridWidth) * viewBoxWidth
const svgY = (planet.coordinate.y / gridHeight) * viewBoxHeight
```

## File Changes

### Files to Modify

1. **src/components/map/FogOfWarLayer.tsx**
   - Complete rewrite to use planet data
   - Implement three-tier reveal system
   - Add smooth gradient reveals

2. **src/components/map/GalaxyMap.tsx**
   - Pass planets array to FogOfWarLayer
   - Ensure proper layer ordering

3. **src/components/map/SystemMarkersLayer.tsx** (optional)
   - Add visual effects (opacity/blur) based on `discovery_status`
   - Or create separate layer for visual effects

### New Files (if needed)

1. **src/lib/fogOfWarUtils.ts** (optional)
   - Utility functions for grouping planets by visibility
   - Reveal area calculation functions
   - Gradient generation helpers

## Implementation Steps

### Step 1: Update FogOfWarLayer Interface

- Add `planets: Planet[]` prop
- Remove dependency on visibility ranges

### Step 2: Implement Planet Grouping

- Group planets by visibility tier (region/system/planet)
- Calculate bounding boxes for each group

### Step 3: Implement Reveal Areas

- Create SVG masks or use composite operations
- Render reveals with smooth gradients
- Order: region → system → planet

### Step 4: Apply Visual Effects

- Add opacity/blur to planets based on `discovery_status`
- Test with different visibility states

### Step 5: Integration

- Update GalaxyMap to pass planets
- Test end-to-end
- Optimize performance

### Step 6: Testing

- Test all visibility scenarios
- Test performance with large planet counts
- Test edge cases (no visibility, full visibility, etc.)

## Success Criteria

1. ✅ Fog overlay correctly masks non-visible areas
2. ✅ Three-tier reveal system works (region/system/planet)
3. ✅ Smooth gradients on reveal edges (no sharp boundaries)
4. ✅ Planets have correct visual effects (opacity/blur)
5. ✅ Performance is acceptable (60fps with 8000+ planets)
6. ✅ Works with existing map features (zoom, pan, interactions)

## Notes

- Backend automatically filters hidden planets (not in API response)
- Only need to handle "visible" and "fogged" planets
- Use actual planet positions, not rectangular ranges
- Smooth gradients are key for professional RTS-style appearance
- Performance optimization: only render reveals in viewport
