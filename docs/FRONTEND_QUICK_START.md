# Frontend Quick Start - 5-Level Universe

**TL;DR:** Use the 5-level coordinate system for the fully zoomable universe map!

## What Changed

- **Old**: `1:1:7:3` (Quadrant:Sector:Galaxy:Planet)
- **New**: `1:1:7:3:12` (Quadrant:Sector:Galaxy:System:Planet)

## API Response Format

Every planet now includes `system`:

```json
{
  "coordinate": {
    "x": 250,
    "y": 375,
    "quadrant": 1,
    "sector": 1,
    "galaxy": 7,
    "system": 3,  // ← NEW!
    "planet": 12
  },
  "coordinate_string": "1:1:7:3:12"  // ← NEW 5-level format
}
```

## Quick Implementation

### 1. Display Coordinates

```javascript
// Show coordinate
planet.coordinate_string  // "1:1:7:3:12"

// Or build from parts
`${planet.quadrant}:${planet.sector}:${planet.galaxy}:${planet.system}:${planet.planet}`
```

### 2. Zoom Levels

```javascript
const ZOOM_LEVELS = {
  QUADRANT: 0.01,   // 4 quadrants
  SECTOR: 0.05,     // 16 sectors  
  GALAXY: 0.1,      // 160 galaxies
  SYSTEM: 0.5,      // 1,600 systems ← NEW!
  PLANET: 2.0       // 24,000 planets
};
```

### 3. Fleet Creation

```javascript
// Use X/Y (not hierarchical)
POST /api/v1/fleets
{
  "ships": {"fighter": 10},
  "origin_planet_id": 123,
  "destination_x": 250,
  "destination_y": 375
}
```

### 4. System Discovery

```javascript
// Discover entire systems
POST /api/v1/signals
{
  "signal_type": "system",
  "target_x": 250,
  "target_y": 375
}

// Response
{
  "success": true,
  "systems_discovered": ["1:1:7:3"],
  "planets_in_system": 8
}
```

## Key Files

- **Full Docs**: `docs/UNIVERSE_STRUCTURE_V2.md`
- **Coordinate Details**: `docs/COORDINATE_MAPPING_EXPLANATION.md`
- **API Examples**: `docs/UNIVERSE_STRUCTURE_V2.md#api-changes`

## Breaking Changes

✅ **DO**: Use X/Y for all requests  
✅ **DO**: Display 5-level coordinates  
✅ **DO**: Implement 5 zoom levels  

❌ **DON'T**: Send 4-level coordinates  
❌ **DON'T**: Hardcode planet numbers  
❌ **DON'T**: Skip the system level  

## Questions?

See full documentation in `docs/UNIVERSE_STRUCTURE_V2.md`


