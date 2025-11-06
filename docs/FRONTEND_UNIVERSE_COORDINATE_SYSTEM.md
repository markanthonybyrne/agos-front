# Front-End Universe Coordinate System Migration Guide

## Overview

The universe coordinate system has been migrated from a hierarchical `quadrant:sector:galaxy:planet` structure to a modern **X/Y grid-based system**. This change enables better visualization, improved performance, and more flexible rendering for the interactive star map.

## What Changed

### Old System (Deprecated)
- **Structure**: `quadrant:sector:galaxy:planet` (e.g., `1:2:5:3`)
- **Limitation**: Hierarchical structure made spatial queries and distance calculations complex
- **Visualization**: Required nested rendering that didn't scale well

### New System (Current)
- **Structure**: `X/Y` grid coordinates (e.g., `x: 250, y: 375`)
- **Grid Size**: 1000×1000 units (0-999)
- **Benefits**: 
  - Direct spatial queries
  - Simple distance calculations
  - Better map rendering
  - Future expansion support

## Key Changes for Front-End

### 1. API Response Format

#### Planet Objects
All planet objects now include both **X/Y coordinates** and **computed hierarchical labels**:

```json
{
  "id": 123,
  "name": "New Terra",
  "x": 250,
  "y": 375,
  "quadrant": 1,        // Computed from X/Y
  "sector": 2,          // Computed from X/Y
  "galaxy": 5,          // Computed from X/Y
  "planet": 3,          // Computed from X/Y
  "coordinate": "1:2:5:3",  // Computed from X/Y
  "state": "colony",
  // ... other fields
}
```

**Important**: Always use `x` and `y` for positioning and calculations. The hierarchical fields (`quadrant`, `sector`, `galaxy`, `planet`) are computed labels for display/backward compatibility.

#### Fleet Objects
Fleets now use X/Y for destinations:

```json
{
  "id": 456,
  "ships": {...},
  "destination": {
    "x": 500,
    "y": 625,
    "coordinate": "2:3:8:1"  // Computed from X/Y
  },
  // ... other fields
}
```

### 2. API Endpoint Changes

#### Fleet Creation (`POST /api/fleets`)
**New Request Format:**
```json
{
  "ships": {"fighter": 10, "destroyer": 5},
  "origin_planet_id": 123,
  "destination_x": 500,
  "destination_y": 625,
  "order_type": "attack"
}
```

**Old Format (No Longer Supported):**
```json
{
  "destination_quadrant": 2,
  "destination_sector": 3,
  "destination_galaxy": 8,
  "destination_planet": 1
}
```

#### Travel Time Calculation (`POST /api/fleets/travel-time`)
**New Request Format:**
```json
{
  "ships": {"fighter": 10},
  "origin_x": 250,
  "origin_y": 375,
  "destination_x": 500,
  "destination_y": 625
}
```

#### Fleet Movement (`POST /api/fleets/{id}/move`)
**New Request Format:**
```json
{
  "destination_x": 600,
  "destination_y": 700,
  "order_type": "attack"
}
```

### 3. Coordinate Conversion

If you need to display hierarchical coordinates (e.g., `"1:2:5:3"`), use the computed `coordinate` field from API responses. The backend automatically computes these from X/Y values.

**Example:**
```javascript
// ✅ Correct - Use computed coordinate from API
const displayCoord = planet.coordinate; // "1:2:5:3"

// ❌ Incorrect - Don't manually construct from X/Y
const wrongCoord = `${planet.x}:${planet.y}`; // Don't do this!
```

### 4. Distance Calculations

**Use Euclidean Distance** for all distance calculations:

```javascript
function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Example: Distance between two planets
const distance = calculateDistance(
  planet1.x, planet1.y,
  planet2.x, planet2.y
);
```

### 5. Map Rendering

#### Grid-Based Rendering
Render planets on a 1000×1000 grid:

```javascript
// Scale to canvas/viewport size
const gridSize = 1000;
const canvasWidth = 2000;
const canvasHeight = 2000;

function renderPlanet(planet) {
  // Convert X/Y to screen coordinates
  const screenX = (planet.x / gridSize) * canvasWidth;
  const screenY = (planet.y / gridSize) * canvasHeight;
  
  // Render planet at screenX, screenY
  ctx.fillRect(screenX, screenY, 5, 5);
}
```

#### Range Queries
Query planets within a radius:

```javascript
function getPlanetsInRange(centerX, centerY, radius) {
  return planets.filter(planet => {
    const distance = calculateDistance(
      centerX, centerY,
      planet.x, planet.y
    );
    return distance <= radius;
  });
}
```

### 6. WebSocket Events

WebSocket events continue to use hierarchical coordinates in channel names for backward compatibility, but event payloads include X/Y:

```javascript
// Channel name (still hierarchical)
channel: 'public-galaxy.1.2.5'

// Event payload (includes X/Y)
{
  "planet": {
    "id": 123,
    "x": 250,
    "y": 375,
    "coordinate": "1:2:5:3",
    // ...
  }
}
```

## Migration Checklist

### ✅ Required Changes

1. **Update API Requests**
   - [ ] Replace `destination_quadrant/sector/galaxy/planet` with `destination_x`/`destination_y`
   - [ ] Update travel time calculation endpoints
   - [ ] Update fleet creation to use X/Y coordinates

2. **Update Display Logic**
   - [ ] Use `planet.x` and `planet.y` for map positioning
   - [ ] Use computed `coordinate` field for display labels
   - [ ] Update distance calculation functions

3. **Update Map Rendering**
   - [ ] Render planets using X/Y coordinates
   - [ ] Update zoom/pan logic for grid-based system
   - [ ] Update selection/hover detection

4. **Update Coordinate Inputs**
   - [ ] Change coordinate input fields to X/Y format
   - [ ] Add coordinate converters if needed
   - [ ] Update validation rules

### ⚠️ Breaking Changes

1. **API Endpoints** - Request formats changed:
   - `POST /api/fleets` - Now requires `destination_x`/`destination_y`
   - `POST /api/fleets/travel-time` - Now requires `origin_x`/`origin_y` and `destination_x`/`destination_y`
   - `POST /api/fleets/{id}/move` - Now requires `destination_x`/`destination_y`

2. **Response Format** - All coordinate-related objects include X/Y:
   - Planets: `x`, `y` fields added
   - Fleets: `destination_x`, `destination_y` fields added
   - Hierarchical fields are computed (read-only)

## Coordinate System Details

### Grid Layout
- **Grid Dimensions**: 1000 × 1000
- **Coordinate Range**: X and Y values from 0 to 999
- **Distribution**: Planets evenly distributed across the grid

### Hierarchical Mapping
The backend computes hierarchical labels from X/Y coordinates:
- **Quadrant**: 4 quadrants (1-4)
- **Sector per Quadrant**: 4 sectors (1-4)
- **Galaxy per Sector**: 10 galaxies (1-10)
- **Planet per Galaxy**: 15 planets (1-15)

**Note**: These are computed labels for display. The actual positioning uses X/Y.

### Coordinate Conversion (Backend)

The backend uses `CoordinateService` to convert between formats:

```php
// Backend example (for reference)
$coordinateService->xyToHierarchical($x, $y);
// Returns: ['quadrant' => 1, 'sector' => 2, 'galaxy' => 5, 'planet' => 3]

$coordinateService->hierarchicalToXy(1, 2, 5, 3);
// Returns: ['x' => 250, 'y' => 375]
```

## Examples

### Example 1: Displaying Planet Coordinates

```javascript
// ✅ Good - Use computed coordinate for display
function displayPlanetInfo(planet) {
  return `Planet ${planet.name} at ${planet.coordinate}`;
  // Output: "Planet New Terra at 1:2:5:3"
}

// ✅ Also good - Use X/Y for custom formatting
function displayPlanetCoordinates(planet) {
  return `(${planet.x}, ${planet.y})`;
  // Output: "(250, 375)"
}
```

### Example 2: Finding Nearby Planets

```javascript
function findNearbyPlanets(centerPlanet, allPlanets, maxDistance = 50) {
  return allPlanets.filter(planet => {
    if (planet.id === centerPlanet.id) return false;
    
    const distance = calculateDistance(
      centerPlanet.x, centerPlanet.y,
      planet.x, planet.y
    );
    
    return distance <= maxDistance;
  });
}
```

### Example 3: Fleet Path Rendering

```javascript
function renderFleetPath(fleet) {
  const origin = fleet.origin;
  const destination = {
    x: fleet.destination.x,
    y: fleet.destination.y
  };
  
  // Draw line from origin to destination
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(destination.x, destination.y);
  ctx.stroke();
}
```

### Example 4: Coordinate Input Component

```javascript
// React/Vue component example
function CoordinateInput({ onChange }) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  
  return (
    <div>
      <input 
        type="number" 
        min="0" 
        max="999" 
        value={x}
        onChange={e => {
          const newX = parseInt(e.target.value);
          setX(newX);
          onChange({ x: newX, y });
        }}
        placeholder="X coordinate"
      />
      <input 
        type="number" 
        min="0" 
        max="999" 
        value={y}
        onChange={e => {
          const newY = parseInt(e.target.value);
          setY(newY);
          onChange({ x, y: newY });
        }}
        placeholder="Y coordinate"
      />
      {/* Optional: Show computed coordinate */}
      <div>Coordinate: {computedCoordinate}</div>
    </div>
  );
}
```

## Testing

### Test Cases

1. **Coordinate Display**
   - Verify planets display correct coordinates (both X/Y and hierarchical)
   - Verify fleets show correct destination coordinates

2. **Distance Calculations**
   - Test distance between known planet pairs
   - Verify range queries return correct results

3. **API Integration**
   - Test fleet creation with X/Y coordinates
   - Test travel time calculation
   - Test fleet movement

4. **Map Rendering**
   - Verify planets render at correct positions
   - Test zoom/pan functionality
   - Verify selection/hover works correctly

## Backward Compatibility

The API maintains backward compatibility by:
- **Including computed hierarchical fields** in all responses
- **Accepting hierarchical coordinates** in some legacy endpoints (with conversion)
- **Preserving channel names** using hierarchical coordinates

However, **all new endpoints require X/Y coordinates** and the old hierarchical fields are **read-only computed values**.

## Performance Considerations

### Benefits
- **Faster Queries**: Direct X/Y range queries are more efficient
- **Simpler Calculations**: Euclidean distance is straightforward
- **Better Rendering**: Grid-based layout is optimized for canvas rendering

### Optimization Tips
1. **Indexing**: Use X/Y for spatial indexing in your front-end state
2. **Range Queries**: Batch queries by X/Y ranges when possible
3. **Rendering**: Only render visible planets using viewport bounds

## Questions?

If you encounter issues or need clarification:
1. Check the API documentation (Swagger/OpenAPI)
2. Review example responses from the API
3. Contact the backend team for coordinate conversion details

## Summary

- **Use X/Y coordinates** for all calculations and positioning
- **Use computed `coordinate` field** for display labels
- **Update all API requests** to use X/Y format
- **Grid system**: 1000×1000 with values 0-999
- **All hierarchical fields are computed** - they cannot be set directly

The migration is complete on the backend. Update your front-end code to use the new X/Y coordinate system for the best performance and functionality.

