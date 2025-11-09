import { Coordinate } from '@/types/game.types'
import { Planet } from '@/types/api.types'
import {
  hierarchicalToXy,
  calculateEuclideanDistance as calculateEuclideanDistanceUtil,
  getSystemXyRange,
  regionSystemToXy,
  xyToRegionSystem,
} from './coordinateUtils'

// Coordinate parsing and formatting
export function parseCoordinate(coordinate: string | Coordinate): Coordinate | null {
  // If it's already a Coordinate object, return it
  if (typeof coordinate === 'object' && coordinate !== null) {
    // Check if it has quadrant (old format) or region (new format)
    if ('quadrant' in coordinate || 'region' in coordinate) {
      return coordinate as Coordinate
    }
  }
  
  // If it's a string, parse it
  if (typeof coordinate === 'string') {
    const parts = coordinate.split(':').map(Number)
    
    // Support 3-level Region:System:Planet format (new)
    if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
      const [region, system, planet] = parts
      return {
        region,
        system,
        planet,
        quadrant: region,
        sector: system,
      }
    } else if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      const [quadrant, sector, galaxy, planet] = parts
      return {
        region: quadrant,
        system: sector,
        planet,
        quadrant,
        sector,
        galaxy,
      }
    } else if (parts.length === 5 && parts.every((p) => !isNaN(p))) {
      const [quadrant, sector, galaxy, legacySystem, planet] = parts
      return {
        region: quadrant,
        system: legacySystem,
        planet,
        quadrant,
        sector,
        galaxy,
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

    // New hierarchy: Region/System/Planet
    if (typeof coord.region === 'number' && typeof coord.system === 'number') {
      return regionSystemToXy(coord.region, coord.system, coord.planet ?? 1)
    }

    // Fallback: legacy hierarchical conversion
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

  if (planet.geometry?.system?.center) {
    const { x, y } = planet.geometry.system.center
    return { x, y }
  }

  // Try parsing string coordinate
  const parsed = parseCoordinate(planet.coordinate)
  if (parsed) {
    if (typeof parsed.region === 'number' && typeof parsed.system === 'number') {
      return regionSystemToXy(parsed.region, parsed.system, parsed.planet ?? 1)
    }

    if (parsed.quadrant && parsed.sector && parsed.galaxy && parsed.planet) {
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
          x: Math.max(0, Math.min(2000, Math.floor(systemCenterX + planetOffsetX - systemWidth / 2 + systemWidth / 10))),
          y: Math.max(0, Math.min(1000, Math.floor(systemCenterY + planetOffsetY - systemHeight / 2 + systemHeight / 6))),
        }
      }

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
    const parts = coordinate.split(':')
    if (parts.length === 3 && parts.every((p) => !isNaN(Number(p)))) {
      return coordinate
    }
    return 'Invalid coordinate'
  }
  
  // If it's a Coordinate object, normalise to Region:System:Planet
  if (typeof coordinate === 'object' && coordinate !== null) {
    const coord = coordinate as Record<string, any>

    const region = coord.region ?? coord.quadrant ?? coord.quadrant_number
    const system = coord.system ?? coord.system_number ?? coord.sector ?? coord.sector_number
    const planet = coord.planet ?? coord.planet_number ?? coord.planet_id

    if (
      typeof region === 'number' &&
      typeof system === 'number' &&
      typeof planet === 'number' &&
      !Number.isNaN(region) &&
      !Number.isNaN(system) &&
      !Number.isNaN(planet)
    ) {
      return `${region}:${system}:${planet}`
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

  // Fallback: resolve hierarchy/X/Y using the helper
  if (!originXY) {
    const resolved = resolveCoordinateToXY(origin as Coordinate | string)
    if (resolved) {
      originXY = { x: resolved.x, y: resolved.y }
    }
  }

  if (!destXY) {
    const resolved = resolveCoordinateToXY(destination as Coordinate | string)
    if (resolved) {
      destXY = { x: resolved.x, y: resolved.y }
    }
  }

  if (originXY && destXY) {
    return calculateEuclideanDistanceUtil(originXY.x, originXY.y, destXY.x, destXY.y)
  }

  return Infinity
}

export function normalizeCoordinate(
  coordinate: Coordinate | string | null | undefined
): { region: number; system: number; planet: number } | null {
  if (!coordinate) {
    return null
  }

  if (typeof coordinate === 'string') {
    const parsed = parseCoordinate(coordinate)
    return parsed ? normalizeCoordinate(parsed) : null
  }

  if (typeof coordinate === 'object') {
    const region = coordinate.region ?? coordinate.quadrant ?? coordinate.quadrant_number
    const system = coordinate.system ?? coordinate.system_number ?? coordinate.sector ?? coordinate.sector_number
    const planet = coordinate.planet ?? coordinate.planet_number ?? coordinate.planet_id

    if (
      typeof region === 'number' &&
      typeof system === 'number' &&
      typeof planet === 'number' &&
      !Number.isNaN(region) &&
      !Number.isNaN(system) &&
      !Number.isNaN(planet)
    ) {
      return {
        region,
        system,
        planet,
      }
    }
  }

  return null
}

export function resolveCoordinateToXY(
  coordinate: Coordinate | string | null | undefined
): ({ region: number; system: number; planet: number } & { x: number; y: number }) | null {
  const normalized = normalizeCoordinate(coordinate)
  if (!normalized) {
    return null
  }

  const { region, system, planet } = normalized
  const { x, y } = regionSystemToXy(region, system, planet)
  return { region, system, planet, x, y }
}

