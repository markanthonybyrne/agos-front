/**
 * Coordinate Conversion Utilities
 *
 * Provides helper utilities to convert between the raw X/Y universe grid and hierarchical
 * coordinate representations used throughout the client. The legacy implementation operated
 * on a 4×4 quadrant/sector layout; the updated universe uses Region:System:Planet identifiers.
 * To minimise migration pain we expose both sets of helpers. Consumers that work with the new
 * hierarchy should prefer the `regionSystem*` exports while older code continues to rely on
 * the quadrant-centric functions until it is refactored.
 */

export interface XYCoordinate {
  x: number
  y: number
}

export interface HierarchicalCoordinate {
  // New hierarchy
  region: number
  system: number
  planet: number
  // Legacy aliases (kept optional for backwards compatibility)
  quadrant?: number
  sector?: number
  galaxy?: number
  legacySystem?: number
  legacyPlanet?: number
}

export interface XYRanges {
  x_min: number
  x_max: number
  y_min: number
  y_max: number
}

// Universe defaults (overridable via Vite env vars)
const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 1000
const DEFAULT_REGION_COUNT = 20
const DEFAULT_SYSTEMS_PER_REGION = 125
const DEFAULT_PLANETS_PER_SYSTEM = 17

const GRID_WIDTH = getNumberEnv('VITE_UNIVERSE_GRID_WIDTH', DEFAULT_GRID_WIDTH)
const GRID_HEIGHT = getNumberEnv('VITE_UNIVERSE_GRID_HEIGHT', DEFAULT_GRID_HEIGHT)
const REGION_COUNT = getNumberEnv('VITE_UNIVERSE_REGION_COUNT', DEFAULT_REGION_COUNT)
const SYSTEMS_PER_REGION = getNumberEnv('VITE_UNIVERSE_SYSTEMS_PER_REGION', DEFAULT_SYSTEMS_PER_REGION)
const PLANETS_PER_SYSTEM = getNumberEnv('VITE_UNIVERSE_PLANETS_PER_SYSTEM', DEFAULT_PLANETS_PER_SYSTEM)

const REGION_WIDTH = GRID_WIDTH / REGION_COUNT
const SYSTEM_WIDTH_WITHIN_REGION = REGION_WIDTH / SYSTEMS_PER_REGION
const PLANET_BAND_HEIGHT = GRID_HEIGHT / PLANETS_PER_SYSTEM // fallback when no geometry data is available

// Legacy constants retained for backward compatibility (old quadrant/sector layout)
const QUADRANT_WIDTH = 1000  // 2000 / 2 (quadrants are 2x2 grid)
const QUADRANT_HEIGHT = 500  // 1000 / 2
const SECTOR_WIDTH = 500     // 1000 / 2 (sectors are 2x2 within quadrant)
const SECTOR_HEIGHT = 250    // 500 / 2

/**
 * Simple CRC32 hash function for planet number assignment
 */
function crc32(str: string): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    crc = (crc >>> 8) ^ ((crc & 0xFF) ^ char) & 0xFF
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function getNumberEnv(key: string, fallback: number): number {
  const value = (import.meta as any)?.env?.[key]
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * NEW COORDINATE HELPERS (Region:System:Planet hierarchy)
 */

function clampRegion(region: number): number {
  return Math.min(Math.max(1, Math.floor(region)), REGION_COUNT)
}

function clampSystem(system: number): number {
  return Math.min(Math.max(1, Math.floor(system)), SYSTEMS_PER_REGION)
}

function clampPlanet(planet: number): number {
  return Math.min(Math.max(1, Math.floor(planet)), PLANETS_PER_SYSTEM)
}

function stabiliseY(y: number): number {
  const clamped = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.round(y)))
  return clamped
}

/**
 * Convert raw X/Y coordinates to Region/System/Planet identifiers using the fallback slice logic
 * described in the backend CoordinateService. Geometry overrides (region_geometries / system_geometries)
 * are not available client-side, so this produces the deterministic slice mapping.
 */
export function xyToRegionSystem(x: number, y: number): { region: number; system: number; planet: number } {
  const clampedX = Math.max(0, Math.min(GRID_WIDTH - 1, Math.round(x)))
  const clampedY = stabiliseY(y)

  const region = clampRegion(Math.floor(clampedX / REGION_WIDTH) + 1)
  const regionMinX = (region - 1) * REGION_WIDTH
  const system = clampSystem(Math.floor((clampedX - regionMinX) / SYSTEM_WIDTH_WITHIN_REGION) + 1)
  const planetHash = Math.abs(crc32(`${clampedX}-${clampedY}`))
  const planet = clampPlanet((planetHash % PLANETS_PER_SYSTEM) + 1)

  return { region, system, planet }
}

/**
 * Convert Region/System/Planet identifiers into a representative X/Y coordinate. When precise
 * geometry polygons are unavailable we fall back to the centre of the deterministic slice.
 */
export function regionSystemToXy(
  region: number,
  system: number,
  planet: number = Math.ceil(PLANETS_PER_SYSTEM / 2)
): XYCoordinate {
  const safeRegion = clampRegion(region)
  const safeSystem = clampSystem(system)
  const safePlanet = clampPlanet(planet)

  const regionMinX = (safeRegion - 1) * REGION_WIDTH
  const systemMinX = regionMinX + (safeSystem - 1) * SYSTEM_WIDTH_WITHIN_REGION
  const x = Math.round(systemMinX + SYSTEM_WIDTH_WITHIN_REGION / 2)

  const bandCenter = (safePlanet - 0.5) * PLANET_BAND_HEIGHT
  const y = stabiliseY(bandCenter)

  return { x, y }
}

/**
 * Helper to generate a system key (`region:system`) used across map and visibility helpers.
 */
export function getRegionSystemKey(region: number, system: number): string {
  return `${clampRegion(region)}:${clampSystem(system)}`
}

/**
 * Convert X/Y coordinates to hierarchical coordinates
 * 
 * @param x X coordinate (0-1999)
 * @param y Y coordinate (0-999)
 * @returns Hierarchical coordinate object (includes system number)
 */
export function xyToHierarchical(x: number, y: number): HierarchicalCoordinate {
  // Ensure coordinates are within valid range
  const clampedX = Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(x)))
  const clampedY = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(y)))

  // Quadrant: 2x2 grid layout
  const quadrantCol = Math.floor(clampedX / QUADRANT_WIDTH)  // 0 or 1
  const quadrantRow = Math.floor(clampedY / QUADRANT_HEIGHT) // 0 or 1
  const quadrant = (quadrantRow * 2) + quadrantCol + 1  // 1-4

  // Sector: 2x2 grid within quadrant
  const xWithinQuadrant = clampedX % QUADRANT_WIDTH
  const yWithinQuadrant = clampedY % QUADRANT_HEIGHT
  
  const sectorCol = Math.floor(xWithinQuadrant / (QUADRANT_WIDTH / 2))  // 0 or 1
  const sectorRow = Math.floor(yWithinQuadrant / (QUADRANT_HEIGHT / 2)) // 0 or 1
  const sector = (sectorRow * 2) + sectorCol + 1  // 1-4

  // Sector dimensions: 500x250
  const SECTOR_WIDTH_ACTUAL = QUADRANT_WIDTH / 2   // 500
  const SECTOR_HEIGHT_ACTUAL = QUADRANT_HEIGHT / 2 // 250
  
  // Position within sector
  const xWithinSector = xWithinQuadrant % SECTOR_WIDTH_ACTUAL
  const yWithinSector = yWithinQuadrant % SECTOR_HEIGHT_ACTUAL

  // Galaxy: 10 galaxies per sector in a 5x2 grid (5 columns, 2 rows)
  const GALAXIES_PER_ROW = 5
  const GALAXIES_PER_COL = 2
  
  const galaxyWidth = SECTOR_WIDTH_ACTUAL / GALAXIES_PER_ROW   // 500/5 = 100
  const galaxyHeight = SECTOR_HEIGHT_ACTUAL / GALAXIES_PER_COL // 250/2 = 125
  
  const galaxyXComponent = Math.min(GALAXIES_PER_ROW - 1, Math.floor(xWithinSector / galaxyWidth))  // 0-4
  const galaxyYComponent = Math.min(GALAXIES_PER_COL - 1, Math.floor(yWithinSector / galaxyHeight)) // 0-1
  
  const galaxy = (galaxyYComponent * GALAXIES_PER_ROW) + galaxyXComponent + 1
  const galaxyClamped = Math.max(1, Math.min(10, galaxy))

  // System: Calculate which system (1-10) within the galaxy
  const galaxyRange = getGalaxyXyRange(quadrant, sector, galaxyClamped)
  const galaxyWidthForSystem = galaxyRange.x_max - galaxyRange.x_min
  const galaxyHeightForSystem = galaxyRange.y_max - galaxyRange.y_min
  const systemWidth = galaxyWidthForSystem / 10
  const systemHeight = galaxyHeightForSystem / 10
  
  const xWithinGalaxy = clampedX - galaxyRange.x_min
  const yWithinGalaxy = clampedY - galaxyRange.y_min
  const systemXComponent = Math.min(9, Math.floor(xWithinGalaxy / systemWidth))
  const systemYComponent = Math.min(9, Math.floor(yWithinGalaxy / systemHeight))
  
  const systemLegacy = (systemYComponent * 10) + systemXComponent + 1
  const systemClamped = Math.max(1, Math.min(10, systemLegacy))

  const hashInput = `${clampedX}-${clampedY}`
  const hash = crc32(hashInput)
  const planetLegacy = (Math.abs(hash) % 15) + 1

  // Derive new Region:System:Planet identifiers using fallback slices
  const newest = xyToRegionSystem(clampedX, clampedY)

  return {
    region: newest.region,
    system: newest.system,
    planet: newest.planet,
    quadrant,
    sector,
    galaxy: galaxyClamped,
    legacySystem: systemClamped,
    legacyPlanet: planetLegacy,
  }
}

/**
 * Convert hierarchical coordinates to approximate X/Y coordinates
 * 
 * Note: This is approximate and may not be perfectly accurate.
 * Converting the result back may not yield the exact same hierarchical coordinate.
 * 
 * @param quadrant Quadrant number (1-4)
 * @param sector Sector number (1-4)
 * @param galaxy Galaxy number (1-10)
 * @param planet Planet number (1-15)
 * @returns Approximate X/Y coordinate
 */
export function hierarchicalToXy(
  quadrant: number,
  sector: number,
  galaxy: number,
  planet: number
): XYCoordinate {
  // Clamp values to valid ranges
  const q = Math.max(1, Math.min(4, quadrant))
  const s = Math.max(1, Math.min(4, sector))
  const g = Math.max(1, Math.min(10, galaxy))
  const p = Math.max(1, Math.min(15, planet))

  // Use the same logic as getGalaxyXyRange for consistency
  // This ensures planets are positioned correctly within their sectors
  const galaxyRange = getGalaxyXyRange(q, s, g)
  
  // Calculate galaxy center
  const galaxyCenterX = (galaxyRange.x_min + galaxyRange.x_max) / 2
  const galaxyCenterY = (galaxyRange.y_min + galaxyRange.y_max) / 2
  
  // Get system range if system is available (for 5-level hierarchy)
  // For now, distribute planets within galaxy range
  const galaxyWidth = galaxyRange.x_max - galaxyRange.x_min
  const galaxyHeight = galaxyRange.y_max - galaxyRange.y_min
  
  // Distribute planets within the galaxy area
  // Use planet number to create a deterministic but spread out pattern
  const planetsPerRow = 5
  const planetXOffset = ((p - 1) % planetsPerRow) * (galaxyWidth / planetsPerRow)
  const planetYOffset = Math.floor((p - 1) / planetsPerRow) * (galaxyHeight / Math.ceil(15 / planetsPerRow))
  
  // Final position: galaxy center + planet offset
  const x = galaxyCenterX + planetXOffset - (galaxyWidth / 2) + (galaxyWidth / planetsPerRow / 2)
  const y = galaxyCenterY + planetYOffset - (galaxyHeight / 2) + (galaxyHeight / Math.ceil(15 / planetsPerRow) / 2)

  return {
    x: Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(x))),
    y: Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(y)))
  }
}

/**
 * Get X/Y range for a specific system
 * 
 * @param quadrant Quadrant number (1-4)
 * @param sector Sector number (1-4)
 * @param galaxy Galaxy number (1-10)
 * @param system System number (1-10)
 * @returns X/Y bounds for the system
 */
export function getSystemXyRange(
  quadrant: number,
  sector: number,
  galaxy: number,
  system: number
): XYRanges {
  const q = Math.max(1, Math.min(4, quadrant))
  const s = Math.max(1, Math.min(4, sector))
  const g = Math.max(1, Math.min(10, galaxy))
  const sy = Math.max(1, Math.min(10, system))

  // Get galaxy range first
  const galaxyRange = getGalaxyXyRange(q, s, g)

  // System width within galaxy (5x2 grid: 5 columns, 2 rows)
  const SYSTEMS_PER_ROW = 5
  const galaxyWidth = galaxyRange.x_max - galaxyRange.x_min
  const galaxyHeight = galaxyRange.y_max - galaxyRange.y_min
  const systemWidth = galaxyWidth / SYSTEMS_PER_ROW  // 5 columns
  const systemHeight = galaxyHeight / 2  // 2 rows

  // System position within galaxy (5x2 grid: systems 1-5 in row 0, systems 6-10 in row 1)
  const systemXComponent = (sy - 1) % SYSTEMS_PER_ROW  // 0-4 for systems 1-5, 0-4 for systems 6-10
  const systemYComponent = Math.floor((sy - 1) / SYSTEMS_PER_ROW)  // 0 for systems 1-5, 1 for systems 6-10

  const x_min = galaxyRange.x_min + (systemXComponent * systemWidth)
  const x_max = x_min + systemWidth
  const y_min = galaxyRange.y_min + (systemYComponent * systemHeight)
  const y_max = y_min + systemHeight

  // Keep precise values (no rounding) to ensure accurate centering
  return {
    x_min: Math.max(0, x_min),
    x_max: Math.min(GRID_WIDTH, x_max),
    y_min: Math.max(0, y_min),
    y_max: Math.min(GRID_HEIGHT, y_max)
  }
}

/**
 * Get X/Y range for a specific galaxy
 * 
 * @param quadrant Quadrant number (1-4)
 * @param sector Sector number (1-4)
 * @param galaxy Galaxy number (1-10)
 * @returns X/Y bounds for the galaxy
 */
export function getGalaxyXyRange(
  quadrant: number,
  sector: number,
  galaxy: number
): XYRanges {
  const q = Math.max(1, Math.min(4, quadrant))
  const s = Math.max(1, Math.min(4, sector))
  const g = Math.max(1, Math.min(10, galaxy))

  // Calculate quadrant position in 2x2 grid
  const quadrantRow = Math.floor((q - 1) / 2)  // 0 or 1
  const quadrantCol = (q - 1) % 2              // 0 or 1
  
  // Quadrant base positions
  const quadrantBaseX = quadrantCol * QUADRANT_WIDTH
  const quadrantBaseY = quadrantRow * QUADRANT_HEIGHT
  
  // Calculate sector position in 2x2 grid within quadrant
  const sectorRow = Math.floor((s - 1) / 2)  // 0 or 1
  const sectorCol = (s - 1) % 2              // 0 or 1
  
  // Sector base positions within quadrant
  const sectorBaseX = sectorCol * SECTOR_WIDTH
  const sectorBaseY = sectorRow * SECTOR_HEIGHT

  // Galaxy position within sector (5x2 grid: 5 columns, 2 rows)
  const GALAXIES_PER_ROW = 5
  const galaxyXComponent = (g - 1) % GALAXIES_PER_ROW  // 0-4
  const galaxyYComponent = Math.floor((g - 1) / GALAXIES_PER_ROW) // 0-1

  // Galaxy bounds within sector
  const galaxyWidth = SECTOR_WIDTH / GALAXIES_PER_ROW  // 500/5 = 100
  const galaxyHeight = SECTOR_HEIGHT / 2  // 250/2 = 125

  const x_min = quadrantBaseX + sectorBaseX + (galaxyXComponent * galaxyWidth)
  const x_max = x_min + galaxyWidth
  const y_min = quadrantBaseY + sectorBaseY + (galaxyYComponent * galaxyHeight)
  const y_max = y_min + galaxyHeight

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(GRID_WIDTH - 1, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(GRID_HEIGHT - 1, Math.ceil(y_max))
  }
}

/**
 * Get X/Y range for a specific sector
 * 
 * @param quadrant Quadrant number (1-4)
 * @param sector Sector number (1-4)
 * @returns X/Y bounds for the sector
 */
export function getSectorXyRange(quadrant: number, sector: number): XYRanges {
  const q = Math.max(1, Math.min(4, quadrant))
  const s = Math.max(1, Math.min(4, sector))

  // Calculate quadrant position in 2x2 grid
  const quadrantRow = Math.floor((q - 1) / 2)  // 0 or 1
  const quadrantCol = (q - 1) % 2              // 0 or 1
  
  // Quadrant base positions
  const quadrantBaseX = quadrantCol * QUADRANT_WIDTH
  const quadrantBaseY = quadrantRow * QUADRANT_HEIGHT
  
  // Calculate sector position in 2x2 grid within quadrant
  const sectorRow = Math.floor((s - 1) / 2)  // 0 or 1
  const sectorCol = (s - 1) % 2              // 0 or 1
  
  // Sector base positions within quadrant
  const sectorBaseX = sectorCol * SECTOR_WIDTH
  const sectorBaseY = sectorRow * SECTOR_HEIGHT

  const x_min = quadrantBaseX + sectorBaseX
  const x_max = x_min + SECTOR_WIDTH
  const y_min = quadrantBaseY + sectorBaseY
  const y_max = y_min + SECTOR_HEIGHT

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(GRID_WIDTH - 1, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(GRID_HEIGHT - 1, Math.ceil(y_max))
  }
}

/**
 * Get X/Y range for a specific quadrant
 * 
 * Quadrants are arranged in a 2x2 grid:
 * - Quadrant 1: Top-left (X: 0-999, Y: 0-499)
 * - Quadrant 2: Top-right (X: 1000-1999, Y: 0-499)
 * - Quadrant 3: Bottom-left (X: 0-999, Y: 500-999)
 * - Quadrant 4: Bottom-right (X: 1000-1999, Y: 500-999)
 * 
 * @param quadrant Quadrant number (1-4)
 * @returns X/Y bounds for the quadrant
 */
export function getQuadrantXyRange(quadrant: number): XYRanges {
  const q = Math.max(1, Math.min(4, quadrant))

  // Calculate quadrant position in 2x2 grid
  // Quadrant 1: row 0, col 0
  // Quadrant 2: row 0, col 1
  // Quadrant 3: row 1, col 0
  // Quadrant 4: row 1, col 1
  const row = Math.floor((q - 1) / 2)  // 0 or 1
  const col = (q - 1) % 2              // 0 or 1

  // Each quadrant is 1/2 of the grid in each dimension
  const quadrantWidth = GRID_WIDTH / 2   // 1000
  const quadrantHeight = GRID_HEIGHT / 2 // 500

  const x_min = col * quadrantWidth
  const x_max = (col + 1) * quadrantWidth
  const y_min = row * quadrantHeight
  const y_max = (row + 1) * quadrantHeight

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(GRID_WIDTH - 1, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(GRID_HEIGHT - 1, Math.ceil(y_max))
  }
}

/**
 * Calculate Euclidean distance between two X/Y coordinates
 * 
 * @param x1 X coordinate of first point
 * @param y1 Y coordinate of first point
 * @param x2 X coordinate of second point
 * @param y2 Y coordinate of second point
 * @returns Euclidean distance
 */
export function calculateEuclideanDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if a point (x, y) is within the given X/Y range
 */
export function isPointInRange(
  x: number,
  y: number,
  range: XYRanges
): boolean {
  return x >= range.x_min && x <= range.x_max &&
         y >= range.y_min && y <= range.y_max
}

