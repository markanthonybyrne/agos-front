# Planet Colonization Mechanics

## Overview

Players can colonize planets under two conditions:

1. **Discovery**: The planet is in a system that the player has discovered via Signal Scanning
2. **Proximity**: The planet is within 2 regions distance (using X/Y coordinate distance) of any planet the player owns

## Current Implementation

### Location: `app/Http/Controllers/Api/PlanetController.php::colonize()`

### Step-by-Step Logic

1. **Validation**: Planet must exist, be unsettled, and habitable
2. **Research Requirement**: Player must have completed `colony_management` research on at least one planet
3. **Colonization Check**: If player has planets, two conditions are checked:

#### Condition A: Discovery Check

```php
$discoveredBy = $planet->discovered_by ?? [];
if (in_array($empire->id, $discoveredBy)) {
    $canColonize = true;
}
```

-   Checks if the target planet's `discovered_by` JSON array contains the player's empire ID
-   Planets are marked as discovered when:
    -   A **Signal Scan** successfully scans the system (various success rates based on signal type)
    -   When a signal scan succeeds, ALL planets in that system are marked as discovered
    -   Location: `app/Services/SignalScannerService.php::markSystemDiscovered()`
    -   Exploration endpoint: `GET /api/v1/planets/discover/{region}/{system}` (costs 1,000 Krypton)

#### Condition B: Proximity Check

```php
$maxDistance = $coordinateService->getColonizationMaxDistance();
foreach ($playerPlanets as $playerPlanet) {
    $distance = $coordinateService->calculateDistance(
        $playerPlanet->x, $playerPlanet->y,
        $planet->x, $planet->y
    );
    if ($distance <= $maxDistance) {
        $canColonize = true;
        break;
    }
}
```

-   Calculates Euclidean distance between target planet and ALL player-owned planets
-   Uses **2 regions** worth of distance as the maximum
-   `getColonizationMaxDistance()` calculates: `(average_region_size) * 2`
-   If ANY player planet is within this distance, colonization is allowed

### Coordinate System

The universe uses X/Y coordinates (0-1999 for both axes on a 2000×2000 square grid) mapped to hierarchical structure:

-   **Region** (1-20)
-   **System** (1-125 per region)
-   **Planet** (1-17 per system)

**Region Size Calculation** (for 2000×2000 grid):

-   Grid: 2000 × 2000 (square grid for circular galaxy)
-   Region X size: `grid_width / region_count` = 2000 / 20 = 100 units
-   Region Y size: `grid_height` = 2000 units (regions span full height)
-   Average region size: `(100 + 2000) / 2 = 1050 units`
-   **2 regions distance**: `1050 * 2 = 2100 units` (approximately)

**Important Notes**:

-   All game objects must be within circular galaxy boundary (~950 units from center at 1000, 1000)
-   Distance calculations use Euclidean distance on X/Y coordinates
-   The "2 regions" distance is an approximation based on average region dimensions

## Discovery System

### How Planets Are Discovered

1. **System Signal Scan**:

    - Type: `system`
    - Cost: 500 Krypton
    - Base Success: 15%
    - Effect: Marks all planets in the target system as discovered
    - Location: `app/Services/SignalScannerService.php::markSystemDiscovered()`

2. **Discovery Signal Scan**:

    - Type: `discovery`
    - Cost: 1,000 Krypton
    - Base Success: 70%
    - Effect: Marks all planets in the target system as discovered
    - Location: `app/Services/SignalScannerService.php::markSystemDiscovered()`

3. **Manual Exploration**:

    - Endpoint: `GET /api/v1/planets/discover/{region}/{system}`
    - Cost: 1,000 Krypton
    - Effect: Marks all planets in the target system as discovered
    - Also unlocks system visibility (fog of war)

4. **Auto-Discovery**:
    - When planets are found via `nearby()` endpoint, they are automatically marked as discovered if within range
    - When planets are captured in combat, they are marked as discovered for the capturing empire

### Discovery Storage

-   Stored in `planets.discovered_by` JSON column
-   Array of empire IDs: `[1, 5, 12]`
-   Methods: `Planet::isDiscoveredBy($empireId)` and `Planet::markDiscoveredBy($empireId)`

### Visibility System (Fog of War)

Discovery is separate from visibility:

-   **Discovery** (`discovered_by` array): Allows colonization of a planet
-   **Visibility** (`visible_regions`/`visible_systems`): Controls what appears on the map (fog of war)
-   A system can be discovered (colonizable) but not visible (fogged on map)
-   A system can be visible (shown on map) but not discovered (can see it but can't colonize)

## Secondary Resource Reserves

-   Planetary reserves are stored in `planet_secondary_resources` and seeded by `UniverseSeeder::assignSecondaryResourcesToPlanets()` using affinities from `config/secondary_resources.php`.
-   Each planet receives one secondary resource slug with `initial_reserves`, `current_reserves`, `richness_modifier` (yield multiplier), optional `replenish_rate`, and `depleted_at` timestamp.
-   Affinities tie biome to materials (e.g. Volcanic → Magma Alloys, Ice → Cryo Crystals, Gas Giant → Ionized Helium, Quantum → Phase Matter). Fallback weights guarantee barren worlds still surface common fragments.
-   `SecondaryResourceService::processPlanetExtraction()` runs during tick production to drain reserves, deposit credited amounts into `empire_secondary_resources`, and log results in `secondary_resource_extractions`.
-   Extraction yield scales with mines, probes, Extraction Hub facilities, booster effects, and reserve richness. Capacity checks prevent overfilling ledgers; excess extraction is tracked as waste.
-   Colonisation strategy now prioritises biome diversity to unlock rare/exotic materials required by late-game crafting, markets, and incidents.

## Colonization Requirements

### 1. Research Requirement

-   Must complete **Colony Management** research on at least one planet
-   Without this research, colonization is not possible
-   Location: Checked in `PlanetController::colonize()`

### 2. Planet Requirements

-   Must be `unsettled` state
-   Must be `is_habitable: true`
-   Must be within circular galaxy boundary

### 3. Fleet Requirements

-   Must send a fleet with `order_type: "colonize"`
-   Fleet must contain at least one **Colony Ship**
-   Colony ships are consumed during colonization

### 4. Distance Requirements

-   Planet must be either:
    -   Discovered by the player (in `discovered_by` array), OR
    -   Within 2 regions distance of any owned planet

## Distance Calculation Details

### Current Implementation

The `getColonizationMaxDistance()` method:

```php
public function getColonizationMaxDistance(): float
{
    $regionSizeX = $this->getRegionSizeX(); // 100 units (2000/20)
    $regionSizeY = $this->getRegionSizeY(); // 2000 units
    $averageRegionSize = ($regionSizeX + $regionSizeY) / 2; // 1050 units
    return $averageRegionSize * 2; // 2100 units for 2 regions
}
```

**For 2000×2000 grid**:

-   Region X size: 100 units
-   Region Y size: 2000 units
-   Average: 1050 units
-   **2 regions distance**: ~2100 units

**Important**: This is an approximation. Actual distance depends on:

-   Spiral galaxy layout (regions are not rectangular)
-   Circular boundary constraint
-   X/Y coordinate positions

### Distance Calculation Consistency

The distance calculation is now consistent across the codebase:

-   **Colonization**: Uses `getColonizationMaxDistance()` (~2100 units)
-   **Nearby Search**: Uses `getColonizationMaxDistance()` for search radius
-   **AI Colonization**: Uses `getColonizationMaxDistance()` for target finding
-   **Fleet Range Validation**: Uses same distance calculation

## API Endpoints

### Colonize Planet

```
POST /api/v1/planets/colonize
Body: {
    "x": 500,
    "y": 300,
    "origin_planet_id": 123,
    "ships": {
        "colony_ship": 1
    }
}
```

### Discover System

```
GET /api/v1/planets/discover/{region}/{system}
Cost: 1,000 Krypton
Effect: Discovers all planets in system and unlocks system visibility
```

### Find Nearby Planets

```
GET /api/v1/planets/nearby
Returns: All colonizable planets within 2 regions distance
Auto-discovers planets within range
```

## Colonization Process

1. **Send Fleet**: Create fleet with `order_type: "colonize"` and at least one colony ship
2. **Fleet Travels**: Fleet travels to destination planet (travel time based on distance)
3. **Arrival**: When fleet arrives, colonization completes automatically
4. **Planet Claimed**: Planet ownership transfers to player, state changes to `colony`
5. **Colony Ship Consumed**: Colony ship is removed from fleet (consumed in process)

## Alien Invasion Impact on Colonization

-   **Visibility boost**: When an Alien Invasion spawns, all active empires automatically receive visibility for the impacted regions, making target planets easier to scout.
-   **High-risk theatre**: Colonizing in a region flagged by the invasion is still permitted, but expect invasion fleets to prioritise inhabited, high-value worlds. New colonies should invest in defences immediately.
-   **Infrastructure pressure**: Invasion waves can disrupt construction queues and resource storage if fleets reach orbit. Stage additional fleets or allies nearby before settling.
-   **Post-incident recovery**: Once the invasion resolves (all scheduled waves deployed), regions return to normal behaviour and can be stabilised using standard defensive strategies.

## Issues Resolved

### ✅ Distance Calculation Consistency

-   All distance checks now use `getColonizationMaxDistance()` from `CoordinateService`
-   Consistent "2 regions" distance calculation across all code paths
-   No more hardcoded distance values

### ✅ Structure Alignment

-   Updated from 5-level (Q:S:G:Sy:P) to 3-level (R:Sy:P) structure
-   Discovery now works at system level (not galaxy level)
-   All references updated to use regions and systems

### ✅ Grid Dimensions

-   Updated from 2000×1000 to 2000×2000 square grid
-   Circular galaxy boundary constraint (~950 units from center)
-   Galactic core at (1000, 1000)

## Code References

-   **Colonization Logic**: `app/Http/Controllers/Api/PlanetController.php::colonize()` (lines 271-459)
-   **Distance Calculation**: `app/Services/CoordinateService.php::getColonizationMaxDistance()` (line 236)
-   **System Discovery**: `app/Services/SignalScannerService.php::markSystemDiscovered()` (line 548)
-   **Planet Discovery Methods**: `app/Models/Planet.php` (methods: `isDiscoveredBy()`, `markDiscoveredBy()`)
-   **Nearby Planets**: `app/Http/Controllers/Api/PlanetController.php::nearby()` (line 1060)
-   **Fleet Colonization**: `app/Services/TickProcessor.php::processColonizationFleet()` (line 414)
-   **Coordinate Conversion**: `app/Services/CoordinateService.php::xyToHierarchical()` (line 92)

## Summary

**Current Behavior**:

-   Players can colonize if planet is discovered OR within ~2100 X/Y units (2 regions) of any owned planet
-   Discovery is per-planet but applied system-wide via Signal Scans or Exploration
-   Distance calculation is consistent across codebase using `getColonizationMaxDistance()`
-   "2 regions" distance is calculated from average region dimensions (approximately 2100 units for 2000×2000 grid)
-   All planets must be within circular galaxy boundary (~950 units from center)

**Key Changes from Previous System**:

1. **Structure**: Changed from 5-level (Q:S:G:Sy:P) to 3-level (R:Sy:P)
2. **Discovery Level**: Changed from galaxy-level to system-level
3. **Grid Size**: Changed from 2000×1000 to 2000×2000 (square)
4. **Distance**: Now uses consistent `getColonizationMaxDistance()` method (~2100 units)
5. **Circular Boundary**: All game objects must be within circular galaxy boundary

**Testing**:

-   Test colonization within 2 regions distance (proximity)
-   Test colonization of discovered systems (discovery)
-   Test colonization distance limit (should fail beyond ~2100 units)
-   Test circular boundary constraint (planets outside boundary cannot be colonized)
