/**
 * Coordinate Conversion Utilities
 * 
 * Converts between X/Y coordinates (0-1999 x 0-999 grid) and hierarchical coordinates
 * (Quadrant:Sector:Galaxy:Planet). X/Y coordinates are the source of truth.
 * 
 * Grid dimensions: 2000 x 1000 (rectangular)
 * 
 * Hierarchy:
 * - Quadrants: 2x2 grid layout (each 1000x500)
 *   * Q1: Top-left (X: 0-999, Y: 0-499)
 *   * Q2: Top-right (X: 1000-1999, Y: 0-499)
 *   * Q3: Bottom-left (X: 0-999, Y: 500-999)
 *   * Q4: Bottom-right (X: 1000-1999, Y: 500-999)
 * 
 * - Sectors: 2x2 grid within each quadrant (each 500x250)
 *   * Sector 1: Top-left within quadrant
 *   * Sector 2: Top-right within quadrant
 *   * Sector 3: Bottom-left within quadrant
 *   * Sector 4: Bottom-right within quadrant
 * 
 * - Galaxies: 5x2 grid within each sector (10 galaxies per sector, each ~100x125)
 *   * Galaxies 1-5: Top row (5 columns)
 *   * Galaxies 6-10: Bottom row (5 columns)
 * 
 * - Systems: 10 systems per galaxy (5x2 grid)
 * - Planets: 15 planets per system
 */

export interface XYCoordinate {
  x: number
  y: number
}

export interface HierarchicalCoordinate {
  quadrant: number
  sector: number
  galaxy: number
  system?: number  // System level (5-level hierarchy)
  planet: number
}

export interface XYRanges {
  x_min: number
  x_max: number
  y_min: number
  y_max: number
}

// Constants for grid dimensions
const GRID_WIDTH = 2000
const GRID_HEIGHT = 1000
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
  // Q1: Top-left (X: 0-999, Y: 0-499)
  // Q2: Top-right (X: 1000-1999, Y: 0-499)
  // Q3: Bottom-left (X: 0-999, Y: 500-999)
  // Q4: Bottom-right (X: 1000-1999, Y: 500-999)
  const quadrantCol = Math.floor(clampedX / QUADRANT_WIDTH)  // 0 or 1
  const quadrantRow = Math.floor(clampedY / QUADRANT_HEIGHT) // 0 or 1
  const quadrant = (quadrantRow * 2) + quadrantCol + 1  // 1-4

  // Sector: 2x2 grid within quadrant
  // Sector 1: Top-left (X: 0-499, Y: 0-249)
  // Sector 2: Top-right (X: 500-999, Y: 0-249)
  // Sector 3: Bottom-left (X: 0-499, Y: 250-499)
  // Sector 4: Bottom-right (X: 500-999, Y: 250-499)
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
  // This gives us a logical arrangement: 5 galaxies per row
  const GALAXIES_PER_ROW = 5
  const GALAXIES_PER_COL = 2
  
  const galaxyWidth = SECTOR_WIDTH_ACTUAL / GALAXIES_PER_ROW   // 500/5 = 100
  const galaxyHeight = SECTOR_HEIGHT_ACTUAL / GALAXIES_PER_COL // 250/2 = 125
  
  const galaxyXComponent = Math.min(GALAXIES_PER_ROW - 1, Math.floor(xWithinSector / galaxyWidth))  // 0-4
  const galaxyYComponent = Math.min(GALAXIES_PER_COL - 1, Math.floor(yWithinSector / galaxyHeight)) // 0-1
  
  // Galaxy number: 1-10, calculated as a 2D position (row-major order)
  // Galaxy 1: row 0, col 0
  // Galaxy 2: row 0, col 1
  // ...
  // Galaxy 5: row 0, col 4
  // Galaxy 6: row 1, col 0
  // ...
  // Galaxy 10: row 1, col 4
  const galaxy = (galaxyYComponent * GALAXIES_PER_ROW) + galaxyXComponent + 1
  const galaxyClamped = Math.max(1, Math.min(10, galaxy))

  // System: Calculate which system (1-10) within the galaxy
  // Get galaxy range to determine system position
  const galaxyRange = getGalaxyXyRange(quadrant, sector, galaxyClamped)
  const galaxyWidthForSystem = galaxyRange.x_max - galaxyRange.x_min
  const galaxyHeightForSystem = galaxyRange.y_max - galaxyRange.y_min
  const systemWidth = galaxyWidthForSystem / 10
  const systemHeight = galaxyHeightForSystem / 10
  
  // Calculate which system cell the X/Y falls into
  const xWithinGalaxy = clampedX - galaxyRange.x_min
  const yWithinGalaxy = clampedY - galaxyRange.y_min
  const systemXComponent = Math.min(9, Math.floor(xWithinGalaxy / systemWidth))
  const systemYComponent = Math.min(9, Math.floor(yWithinGalaxy / systemHeight))
  
  // Convert 2D system position to linear system number (1-10)
  const system = (systemYComponent * 10) + systemXComponent + 1
  const systemClamped = Math.max(1, Math.min(10, system))

  // Planet: Deterministic hash-based assignment
  // hash = CRC32("X-Y")
  // planet = (abs(hash) % 15) + 1
  const hashInput = `${clampedX}-${clampedY}`
  const hash = crc32(hashInput)
  const planet = (Math.abs(hash) % 15) + 1

  return {
    quadrant,
    sector,
    galaxy: galaxyClamped,
    system: systemClamped,
    planet
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

