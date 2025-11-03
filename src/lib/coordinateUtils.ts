/**
 * Coordinate Conversion Utilities
 * 
 * Converts between X/Y coordinates (0-999 grid) and hierarchical coordinates
 * (Quadrant:Sector:Galaxy:Planet). X/Y coordinates are the source of truth.
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
 * @param x X coordinate (0-999)
 * @param y Y coordinate (0-999)
 * @returns Hierarchical coordinate object
 */
export function xyToHierarchical(x: number, y: number): HierarchicalCoordinate {
  // Ensure coordinates are within valid range
  const clampedX = Math.max(0, Math.min(999, Math.floor(x)))
  const clampedY = Math.max(0, Math.min(999, Math.floor(y)))

  // Quadrant: X = 0-249 (Q1), 250-499 (Q2), 500-749 (Q3), 750-999 (Q4)
  const quadrant = Math.floor(clampedX / 250) + 1

  // Sector: Divide quadrant width (250) into 4 sectors
  // Sector 1: X = 0-62, Sector 2: X = 62-125, Sector 3: X = 125-187, Sector 4: X = 187-250
  const xWithinQuadrant = clampedX % 250
  const sector = Math.floor(xWithinQuadrant / 62.5) + 1

  // Galaxy: Distributed both horizontally (X) and vertically (Y) within a sector
  // Sector width is 62.5, divide by 10 for X component
  // Sector height is 250 (quadrant height), divide by 10 for Y component
  const xWithinSector = xWithinQuadrant % 62.5
  const yWithinQuadrant = clampedY % 250
  
  // Calculate galaxy number from 2D grid within sector
  const galaxyXComponent = Math.floor(xWithinSector / 6.25) // 0-9
  const galaxyYComponent = Math.floor(yWithinQuadrant / 25) // 0-9
  
  // Galaxy number: 1-10, calculated as a 2D position
  // We have 10 galaxies per sector in a 2D grid (approximately)
  // Convert 2D position to linear galaxy number (1-10)
  const galaxy = (galaxyYComponent * 10) + galaxyXComponent + 1
  // Clamp to valid range (1-10 per sector)
  const galaxyClamped = Math.max(1, Math.min(10, galaxy))

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

  // Calculate base X from quadrant and sector
  const quadrantBaseX = (q - 1) * 250
  const sectorBaseX = (s - 1) * 62.5
  const baseX = quadrantBaseX + sectorBaseX

  // Galaxy X component (0-9, representing position within sector width)
  const galaxyXComponent = (g - 1) % 10
  const galaxyXOffset = galaxyXComponent * 6.25

  // Galaxy Y component (0-9, representing position within quadrant height)
  const galaxyYComponent = Math.floor((g - 1) / 10)
  const galaxyYOffset = galaxyYComponent * 25

  // Approximate X position: base + galaxy offset + small planet-based offset
  const x = baseX + galaxyXOffset + (p % 5) * 0.5

  // Approximate Y position: galaxy Y offset + planet-based offset
  const y = galaxyYOffset + (p * 2)

  return {
    x: Math.max(0, Math.min(999, Math.floor(x))),
    y: Math.max(0, Math.min(999, Math.floor(y)))
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

  // System width within galaxy (divide galaxy width by 10 systems)
  const galaxyWidth = galaxyRange.x_max - galaxyRange.x_min
  const systemWidth = galaxyWidth / 10
  const systemHeight = (galaxyRange.y_max - galaxyRange.y_min) / 10

  // System position within galaxy (horizontal distribution)
  const systemXComponent = (sy - 1) % 10
  const systemYComponent = Math.floor((sy - 1) / 10)

  const x_min = galaxyRange.x_min + (systemXComponent * systemWidth)
  const x_max = x_min + systemWidth
  const y_min = galaxyRange.y_min + (systemYComponent * systemHeight)
  const y_max = y_min + systemHeight

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(999, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(999, Math.ceil(y_max))
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

  // Quadrant and sector base positions
  const quadrantBaseX = (q - 1) * 250
  const sectorBaseX = (s - 1) * 62.5
  const quadrantBaseY = (q - 1) * 250

  // Galaxy position within sector (2D grid)
  const galaxyXComponent = (g - 1) % 10
  const galaxyYComponent = Math.floor((g - 1) / 10)

  // Galaxy bounds within sector
  const galaxyWidth = 6.25
  const galaxyHeight = 25

  const x_min = quadrantBaseX + sectorBaseX + (galaxyXComponent * galaxyWidth)
  const x_max = x_min + galaxyWidth
  const y_min = quadrantBaseY + (galaxyYComponent * galaxyHeight)
  const y_max = y_min + galaxyHeight

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(999, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(999, Math.ceil(y_max))
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

  const quadrantBaseX = (q - 1) * 250
  const sectorBaseX = (s - 1) * 62.5
  const quadrantBaseY = (q - 1) * 250

  const x_min = quadrantBaseX + sectorBaseX
  const x_max = x_min + 62.5
  const y_min = quadrantBaseY
  const y_max = quadrantBaseY + 250

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(999, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(999, Math.ceil(y_max))
  }
}

/**
 * Get X/Y range for a specific quadrant
 * 
 * @param quadrant Quadrant number (1-4)
 * @returns X/Y bounds for the quadrant
 */
export function getQuadrantXyRange(quadrant: number): XYRanges {
  const q = Math.max(1, Math.min(4, quadrant))

  const x_min = (q - 1) * 250
  const x_max = q * 250
  const y_min = (q - 1) * 250
  const y_max = q * 250

  return {
    x_min: Math.max(0, Math.floor(x_min)),
    x_max: Math.min(999, Math.ceil(x_max)),
    y_min: Math.max(0, Math.floor(y_min)),
    y_max: Math.min(999, Math.ceil(y_max))
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

