import { Coordinate } from '@/types/game.types'
import { Planet } from '@/types/api.types'
import { hierarchicalToXy, calculateEuclideanDistance as calculateEuclideanDistanceUtil, getSystemXyRange } from './coordinateUtils'

// Coordinate parsing and formatting
export function parseCoordinate(coordinate: string | Coordinate): Coordinate | null {
  // If it's already a Coordinate object, return it
  if (typeof coordinate === 'object' && coordinate !== null && 'quadrant' in coordinate) {
    return coordinate as Coordinate
  }
  
  // If it's a string, parse it
  if (typeof coordinate === 'string') {
    const parts = coordinate.split(':').map(Number)
    // Support both 4-level (Q:S:G:P) and 5-level (Q:S:G:Sy:P) formats
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      // 4-level format (legacy)
      return {
        quadrant: parts[0],
        sector: parts[1],
        galaxy: parts[2],
        planet: parts[3],
      }
    } else if (parts.length === 5 && parts.every(p => !isNaN(p))) {
      // 5-level format (new)
      return {
        quadrant: parts[0],
        sector: parts[1],
        galaxy: parts[2],
        system: parts[3],
        planet: parts[4],
      }
    }
    return null
  }
  
  return null
}

/**
 * Extract X/Y coordinates from a planet
 * Falls back to approximate conversion from hierarchical coordinates if X/Y not available
 */
export function getPlanetXY(planet: Planet): { x: number; y: number } | null {
  // If planet has X/Y coordinates directly, use them
  if (typeof planet.x === 'number' && typeof planet.y === 'number') {
    return { x: planet.x, y: planet.y }
  }

  // If planet coordinate has X/Y, extract them
  if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
    const coord = planet.coordinate as Coordinate
    if (typeof coord.x === 'number' && typeof coord.y === 'number') {
      return { x: coord.x, y: coord.y }
    }

    // Fallback: convert hierarchical to approximate X/Y
    // Use system if available (5-level hierarchy), otherwise use planet position
    if (coord.quadrant && coord.sector && coord.galaxy && coord.planet) {
      if (coord.system) {
        // For 5-level hierarchy, use system center as base position
        const systemRange = getSystemXyRange(coord.quadrant, coord.sector, coord.galaxy, coord.system)
        const systemCenterX = (systemRange.x_min + systemRange.x_max) / 2
        const systemCenterY = (systemRange.y_min + systemRange.y_max) / 2
        // Distribute planets within system
        const systemWidth = systemRange.x_max - systemRange.x_min
        const systemHeight = systemRange.y_max - systemRange.y_min
        const planetOffsetX = ((coord.planet - 1) % 5) * (systemWidth / 5)
        const planetOffsetY = Math.floor((coord.planet - 1) / 5) * (systemHeight / Math.ceil(15 / 5))
        return {
          x: Math.max(0, Math.min(2000, Math.floor(systemCenterX + planetOffsetX - systemWidth/2 + systemWidth/10))),
          y: Math.max(0, Math.min(1000, Math.floor(systemCenterY + planetOffsetY - systemHeight/2 + systemHeight/6)))
        }
      } else {
        return hierarchicalToXy(coord.quadrant, coord.sector, coord.galaxy, coord.planet)
      }
    }
  }

  // Try parsing string coordinate
  const parsed = parseCoordinate(planet.coordinate)
  if (parsed && parsed.quadrant && parsed.sector && parsed.galaxy && parsed.planet) {
    if (parsed.system) {
      // For 5-level hierarchy, use system center as base position
      const systemRange = getSystemXyRange(parsed.quadrant, parsed.sector, parsed.galaxy, parsed.system)
      const systemCenterX = (systemRange.x_min + systemRange.x_max) / 2
      const systemCenterY = (systemRange.y_min + systemRange.y_max) / 2
      // Distribute planets within system
      const systemWidth = systemRange.x_max - systemRange.x_min
      const systemHeight = systemRange.y_max - systemRange.y_min
      const planetOffsetX = ((parsed.planet - 1) % 5) * (systemWidth / 5)
      const planetOffsetY = Math.floor((parsed.planet - 1) / 5) * (systemHeight / Math.ceil(15 / 5))
      return {
        x: Math.max(0, Math.min(2000, Math.floor(systemCenterX + planetOffsetX - systemWidth/2 + systemWidth/10))),
        y: Math.max(0, Math.min(1000, Math.floor(systemCenterY + planetOffsetY - systemHeight/2 + systemHeight/6)))
      }
    } else {
      return hierarchicalToXy(parsed.quadrant, parsed.sector, parsed.galaxy, parsed.planet)
    }
  }
  
  return null
}

export function formatCoordinate(coordinate: Coordinate | string | null | undefined): string {
  // Handle null/undefined
  if (!coordinate) {
    return 'Invalid coordinate'
  }
  
  // If it's already a string, validate and return it
  if (typeof coordinate === 'string') {
    if (coordinate.trim() === '') {
      return 'Invalid coordinate'
    }
    // Validate string format (support both 4-level and 5-level)
    const parts = coordinate.split(':')
    if ((parts.length === 4 || parts.length === 5) && parts.every(p => !isNaN(Number(p)))) {
      return coordinate
    }
    return 'Invalid coordinate'
  }
  
  // If it's a Coordinate object, format it
  if (typeof coordinate === 'object' && coordinate !== null) {
    const coord = coordinate as Record<string, any>
    const quadrant = coord.quadrant ?? coord.quadrant_number
    const sector = coord.sector ?? coord.sector_number
    const galaxy = coord.galaxy ?? coord.galaxy_number
    const system = coord.system ?? coord.system_number
    const planet = coord.planet ?? coord.planet_number ?? coord.planet_id
    
    if (
      typeof quadrant === 'number' &&
      typeof sector === 'number' &&
      typeof galaxy === 'number' &&
      typeof planet === 'number' &&
      !isNaN(quadrant) &&
      !isNaN(sector) &&
      !isNaN(galaxy) &&
      !isNaN(planet)
    ) {
      // If system is present, use 5-level format, otherwise 4-level (backward compatibility)
      if (typeof system === 'number' && !isNaN(system)) {
        return `${quadrant}:${sector}:${galaxy}:${system}:${planet}`
      }
      return `${quadrant}:${sector}:${galaxy}:${planet}`
    }
  }
  
  return 'Invalid coordinate'
}

export function isValidCoordinate(coordinate: string): boolean {
  return parseCoordinate(coordinate) !== null
}

export function calculateDistance(
  origin: Coordinate | string | Planet,
  destination: Coordinate | string | Planet
): number {
  // Try to extract X/Y coordinates if origin/destination are planets
  let originXY: { x: number; y: number } | null = null
  let destXY: { x: number; y: number } | null = null

  if (typeof origin === 'object' && origin !== null && 'id' in origin) {
    // It's a Planet
    originXY = getPlanetXY(origin as Planet)
  }

  if (typeof destination === 'object' && destination !== null && 'id' in destination) {
    // It's a Planet
    destXY = getPlanetXY(destination as Planet)
  }

  // If both have X/Y coordinates, use Euclidean distance
  if (originXY && destXY) {
    return calculateEuclideanDistanceUtil(originXY.x, originXY.y, destXY.x, destXY.y)
  }

  // Fallback to hierarchical coordinates
  const originCoord = typeof origin === 'string' 
    ? parseCoordinate(origin) 
    : ('quadrant' in (origin as any) ? origin as Coordinate : parseCoordinate((origin as Planet).coordinate))
  
  const destCoord = typeof destination === 'string'
    ? parseCoordinate(destination)
    : ('quadrant' in (destination as any) ? destination as Coordinate : parseCoordinate((destination as Planet).coordinate))

  if (!originCoord || !destCoord) {
    return Infinity
  }

  // Simple Manhattan distance (fallback when X/Y not available)
  let distance = 0

  if (originCoord.quadrant !== destCoord.quadrant) {
    distance += Math.abs(originCoord.quadrant - destCoord.quadrant) * 300
  }
  if (originCoord.sector !== destCoord.sector) {
    distance += Math.abs(originCoord.sector - destCoord.sector) * 30
  }
  if (originCoord.galaxy !== destCoord.galaxy) {
    distance += Math.abs(originCoord.galaxy - destCoord.galaxy) * 2
  }
  distance += Math.abs(originCoord.planet - destCoord.planet)

  return distance
}

