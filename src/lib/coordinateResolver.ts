import {
  getQuadrantXyRange,
  getSectorXyRange,
  getGalaxyXyRange,
  getSystemXyRange,
} from './coordinateUtils'

export interface CoordinateResolution {
  centerX: number
  centerY: number
  normalizedZoom: number
}

/**
 * Resolve a coordinate string to center position and appropriate zoom level
 * Frontend service that mirrors backend CoordinateService logic
 * 
 * @param coordinate - Coordinate string in format Q, Q:S, Q:S:G, Q:S:G:SY, or Q:S:G:SY:P
 * @returns Center position and normalized zoom level
 */
export function resolveCoordinate(coordinate: string): CoordinateResolution {
  // Parse coordinate string (Q:S:G:SY:P)
  const parts = coordinate
    .trim()
    .split(':')
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .map(Number)

  if (parts.length === 0 || parts.length > 5) {
    throw new Error('Invalid coordinate format')
  }

  // Validate all parts are numbers
  if (parts.some((p) => isNaN(p) || p <= 0)) {
    throw new Error('All coordinate parts must be positive numbers')
  }

  let centerX = 0
  let centerY = 0
  let normalizedZoom = 0.0

  if (parts.length === 1) {
    // Quadrant only (e.g., "2")
    const [q] = parts
    if (q < 1 || q > 4) {
      throw new Error('Quadrant must be between 1 and 4')
    }
    const range = getQuadrantXyRange(q)
    centerX = (range.x_min + range.x_max) / 2
    centerY = (range.y_min + range.y_max) / 2
    normalizedZoom = 0.05  // Sector level zoom
  } else if (parts.length === 2) {
    // Quadrant:Sector (e.g., "1:2")
    const [q, s] = parts
    if (q < 1 || q > 4 || s < 1 || s > 4) {
      throw new Error('Quadrant must be 1-4, Sector must be 1-4')
    }
    const range = getSectorXyRange(q, s)
    centerX = (range.x_min + range.x_max) / 2
    centerY = (range.y_min + range.y_max) / 2
    normalizedZoom = 0.15  // Sector level zoom
  } else if (parts.length === 3) {
    // Quadrant:Sector:Galaxy (e.g., "1:2:3")
    const [q, s, g] = parts
    if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10) {
      throw new Error('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10')
    }
    const range = getGalaxyXyRange(q, s, g)
    centerX = (range.x_min + range.x_max) / 2
    centerY = (range.y_min + range.y_max) / 2
    normalizedZoom = 0.50  // Galaxy view zoom
  } else if (parts.length === 4) {
    // Quadrant:Sector:Galaxy:System (e.g., "1:2:3:4")
    const [q, s, g, sy] = parts
    if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10 || sy < 1 || sy > 10) {
      throw new Error('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10, System: 1-10')
    }
    const range = getSystemXyRange(q, s, g, sy)
    centerX = (range.x_min + range.x_max) / 2
    centerY = (range.y_min + range.y_max) / 2
    normalizedZoom = 0.75  // System view zoom
  } else if (parts.length === 5) {
    // Quadrant:Sector:Galaxy:System:Planet (e.g., "1:2:3:4:5")
    const [q, s, g, sy, p] = parts
    if (q < 1 || q > 4 || s < 1 || s > 4 || g < 1 || g > 10 || sy < 1 || sy > 10 || p < 1 || p > 15) {
      throw new Error('Quadrant: 1-4, Sector: 1-4, Galaxy: 1-10, System: 1-10, Planet: 1-15')
    }
    // For planet level, first get the system range, then approximate planet position within it
    const systemRange = getSystemXyRange(q, s, g, sy)
    // Approximate planet position within system (planets are distributed within system bounds)
    const planetOffsetX = ((p - 1) % 5) * ((systemRange.x_max - systemRange.x_min) / 5)
    const planetOffsetY = Math.floor((p - 1) / 5) * ((systemRange.y_max - systemRange.y_min) / 5)
    centerX = systemRange.x_min + planetOffsetX + (systemRange.x_max - systemRange.x_min) / 10
    centerY = systemRange.y_min + planetOffsetY + (systemRange.y_max - systemRange.y_min) / 10
    normalizedZoom = 0.95  // High zoom for planet detail
  }

  return { centerX, centerY, normalizedZoom }
}



