import { Planet } from '@/types/api.types'
import { Coordinate } from '@/types/game.types'
import { XYRanges } from './coordinateUtils'
import { getPlanetXY, parseCoordinate } from './coordinates'

/**
 * System Utilities
 * 
 * Functions for grouping planets by system, calculating system centers,
 * and managing system-level data structures.
 */

export interface SystemData {
  key: string  // "Q:S:G:Sy" format
  quadrant: number
  sector: number
  galaxy: number
  system: number
  center: { x: number; y: number }
  bounds: XYRanges
  planets: Planet[]
}

/**
 * Generate a system key from hierarchical coordinates
 */
export function getSystemKey(
  quadrant: number,
  sector: number,
  galaxy: number,
  system: number
): string {
  return `${quadrant}:${sector}:${galaxy}:${system}`
}

/**
 * Extract system key from a planet's coordinate
 */
export function getPlanetSystemKey(planet: Planet): string | null {
  // First try to parse coordinate if it's a string
  let coord: Coordinate | null = null
  
  if (typeof planet.coordinate === 'string') {
    coord = parseCoordinate(planet.coordinate)
  } else if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
    coord = planet.coordinate as Coordinate
  }
  
  if (coord) {
    // Check if we have all required fields
    if (
      typeof coord.quadrant === 'number' &&
      typeof coord.sector === 'number' &&
      typeof coord.galaxy === 'number' &&
      typeof coord.system === 'number'
    ) {
      return getSystemKey(coord.quadrant, coord.sector, coord.galaxy, coord.system)
    }
    
    // If system is missing but we have quadrant, sector, galaxy, and planet
    // Try to infer system from planet number (systems have up to 15 planets)
    // This is a fallback for legacy 4-level coordinates
    if (
      typeof coord.quadrant === 'number' &&
      typeof coord.sector === 'number' &&
      typeof coord.galaxy === 'number' &&
      typeof coord.planet === 'number'
    ) {
      // Calculate system number from planet number (1-15 per system)
      // Systems are numbered 1-10, planets are distributed 1-15 per system
      const system = Math.ceil(coord.planet / 15)
      return getSystemKey(coord.quadrant, coord.sector, coord.galaxy, system)
    }
  }
  
  return null
}

/**
 * Group planets by their system coordinates
 * Returns a Map where keys are system keys (Q:S:G:Sy) and values are arrays of planets
 */
export function groupPlanetsBySystem(planets: Planet[]): Map<string, Planet[]> {
  const grouped = new Map<string, Planet[]>()
  
  planets.forEach(planet => {
    const systemKey = getPlanetSystemKey(planet)
    if (systemKey) {
      if (!grouped.has(systemKey)) {
        grouped.set(systemKey, [])
      }
      grouped.get(systemKey)!.push(planet)
    }
  })
  
  return grouped
}

/**
 * Calculate the center point of a system from its planets' X/Y coordinates
 */
export function calculateSystemCenter(planets: Planet[]): { x: number; y: number } | null {
  if (planets.length === 0) return null
  
  const validPlanets = planets
    .map(planet => getPlanetXY(planet))
    .filter((xy): xy is { x: number; y: number } => xy !== null)
  
  if (validPlanets.length === 0) return null
  
  const xs = validPlanets.map(p => p.x)
  const ys = validPlanets.map(p => p.y)
  
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2
  }
}

/**
 * Calculate the bounding box of a system from its planets' X/Y coordinates
 */
export function calculateSystemBounds(planets: Planet[]): XYRanges | null {
  if (planets.length === 0) return null
  
  const validPlanets = planets
    .map(planet => getPlanetXY(planet))
    .filter((xy): xy is { x: number; y: number } => xy !== null)
  
  if (validPlanets.length === 0) return null
  
  const xs = validPlanets.map(p => p.x)
  const ys = validPlanets.map(p => p.y)
  
  return {
    x_min: Math.min(...xs),
    x_max: Math.max(...xs),
    y_min: Math.min(...ys),
    y_max: Math.max(...ys)
  }
}

/**
 * Create a SystemData object from a group of planets
 */
export function createSystemData(
  quadrant: number,
  sector: number,
  galaxy: number,
  system: number,
  planets: Planet[]
): SystemData | null {
  const center = calculateSystemCenter(planets)
  const bounds = calculateSystemBounds(planets)
  
  if (!center || !bounds) return null
  
  return {
    key: getSystemKey(quadrant, sector, galaxy, system),
    quadrant,
    sector,
    galaxy,
    system,
    center,
    bounds,
    planets
  }
}

/**
 * Convert a Map of system groups to an array of SystemData objects
 */
export function convertSystemGroupsToData(
  systemGroups: Map<string, Planet[]>
): SystemData[] {
  const systems: SystemData[] = []
  
  systemGroups.forEach((planets, systemKey) => {
    if (planets.length === 0) return
    
    // Extract system coordinates from first planet
    const firstPlanet = planets[0]
    const systemKeyParts = getPlanetSystemKey(firstPlanet)
    
    if (!systemKeyParts) return
    
    const [q, s, g, sy] = systemKeyParts.split(':').map(Number)
    
    const systemData = createSystemData(q, s, g, sy, planets)
    if (systemData) {
      systems.push(systemData)
    }
  })
  
  return systems
}

/**
 * Calculate orbit radius for a planet relative to system center
 */
export function calculateOrbitRadius(
  planetXY: { x: number; y: number },
  systemCenter: { x: number; y: number }
): number {
  const dx = planetXY.x - systemCenter.x
  const dy = planetXY.y - systemCenter.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate orbit angle for a planet relative to system center
 */
export function calculateOrbitAngle(
  planetXY: { x: number; y: number },
  systemCenter: { x: number; y: number }
): number {
  const dx = planetXY.x - systemCenter.x
  const dy = planetXY.y - systemCenter.y
  return Math.atan2(dy, dx)
}

