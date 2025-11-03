# X/Y Coordinate to Hierarchical Mapping Explanation

## Overview

The universe uses a **1000×1000 grid** where each planet has X/Y coordinates (0-999). These coordinates are **converted** to hierarchical labels (Quadrant:Sector:Galaxy:System:Planet) for game mechanics and user display.

**Note:** This document describes the **5-level hierarchy** (v2). For the old 4-level system, see archived documentation.

## Grid Structure

### Quadrants (4 total)
- **Quadrant 1**: X = 0-249
- **Quadrant 2**: X = 250-499
- **Quadrant 3**: X = 500-749
- **Quadrant 4**: X = 750-999

**Formula**: `quadrant = floor(X / 250) + 1`

### Sectors (4 per quadrant)
Within each quadrant, sectors are divided horizontally:

- **Sector 1**: X = 0-62 (within quadrant)
- **Sector 2**: X = 62-125
- **Sector 3**: X = 125-187
- **Sector 4**: X = 187-250

**Formula**: `sector = floor((X % 250) / 62.5) + 1`

### Galaxies (10 per sector)
Galaxies are distributed both horizontally (X) and vertically (Y) within a sector:

- X component: Divides the sector width (62.5) by 10
- Y component: Divides sector height by 10

**Note**: The Y-axis is used to create a 2D distribution of galaxies within sectors.

### Systems (10 per galaxy)
Systems are subdivisions within galaxies, distributed horizontally:

- **X component**: System 1-10 within galaxy width
- **Y component**: Same as galaxy height

**Formula**: `system = floor((X within galaxy) / SYSTEM_SIZE_X) + 1`

### Planets (15 per system)
Planet numbers are **deterministically assigned** using a hash function:

```php
hash = CRC32("X-Y")
planet = (abs(hash) % 15) + 1
```

This means multiple X/Y positions within a system can map to the same planet number, and the mapping is **many-to-one**.

## Important Notes

### 1. One-Way Conversion
- **X/Y → Hierarchical**: Always works (deterministic)
- **Hierarchical → X/Y**: Approximate only (used for migration from old system)

The `hierarchicalToXy()` method provides an **approximate** X/Y location for a given hierarchical coordinate, but converting that X/Y back may not yield the exact same hierarchical coordinate.

### 2. Planet Number Assignment
Planet numbers (1-15) within a system are assigned using a hash function, meaning:
- **Multiple X/Y positions** in the same system can have the **same planet number**
- There's no unique mapping from hierarchical → X/Y for planets
- Planet numbers are mainly for display/naming purposes

### 3. Example Mappings

| X | Y | Quadrant | Sector | Galaxy | System | Planet |
|---|---|----------|--------|--------|--------|--------|
| 0 | 0 | 1 | 1 | 1 | 1-10 | (varies by hash) |
| 31 | 31 | 1 | 1 | 10 | 3-7 | (varies by hash) |
| 62 | 62 | 1 | 2 | 1 | 1-10 | (varies by hash) |
| 125 | 125 | 1 | 3 | 1 | 1-10 | (varies by hash) |
| 250 | 250 | 2 | 1 | 1 | 1-10 | (varies by hash) |

### 4. Range Examples

For **System 1:1:7:3** (Quadrant 1, Sector 1, Galaxy 7, System 3):

```
X range: ~31-37 (approximate, depends on Y)
Y range: ~37-43 (approximate, depends on sector Y base)
```

To get exact ranges:
- `CoordinateService::getSystemXyRange(1, 1, 7, 3)` - System bounds
- `CoordinateService::getGalaxyXyRange(1, 1, 7)` - Galaxy bounds
- `CoordinateService::getSectorXyRange(1, 1)` - Sector bounds
- `CoordinateService::getQuadrantXyRange(1)` - Quadrant bounds

## Practical Usage

### For Frontend Development

1. **Display coordinates**: Use hierarchical labels (`1:1:6:3`) for user-friendly display
2. **Map rendering**: Use X/Y coordinates for precise grid positioning
3. **Distance calculations**: Use X/Y coordinates (Euclidean distance)
4. **Querying**: Use X/Y ranges for filtering planets by hierarchical areas

### For Game Logic

- **Visibility**: Stored as hierarchical keys (`"1:1:6"`) but calculated from X/Y
- **Travel**: Uses X/Y coordinates for distance and routing
- **Spatial queries**: Convert hierarchical filters to X/Y ranges using `getGalaxyXyRange()`, `getSectorXyRange()`, or `getQuadrantXyRange()`

## Coordinate Service Methods

### Converting X/Y → Hierarchical
```php
$coordinateService = app(CoordinateService::class);
$hierarchical = $coordinateService->xyToHierarchical(33, 31);
// Returns: ['quadrant' => 1, 'sector' => 1, 'galaxy' => 10, 'system' => 3, 'planet' => 6]
```

### Converting Hierarchical → X/Y Range
```php
$xyRange = $coordinateService->getGalaxyXyRange(1, 1, 6);
// Returns: ['x_min' => 31, 'x_max' => 37, 'y_min' => 37, 'y_max' => 43]
```

### Converting Hierarchical → Approximate X/Y (Migration)
```php
// 5-level format (new)
$xy = $coordinateService->hierarchicalToXy(1, 1, 7, 3, 6);
// Returns: ['x' => 33, 'y' => 31] (approximate)

// 4-level format (legacy, backwards compatible)
$xy = $coordinateService->hierarchicalToXy(1, 1, 7, 6);
// Returns: ['x' => ~33, 'y' => ~31] (approximate, system inferred)
```

## Summary

- **X/Y coordinates** are the **source of truth** (stored in database)
- **Hierarchical labels** are **computed on-the-fly** from X/Y in 5-level format
- The mapping is **deterministic** but **not perfectly reversible**
- Use hierarchical labels for **display** and **game mechanics** (Q:S:G:Sy:P)
- Use X/Y coordinates for **spatial queries** and **map rendering**
- **System level** provides better zoom navigation and discovery mechanics

For detailed implementation guide, see `docs/UNIVERSE_STRUCTURE_V2.md`

