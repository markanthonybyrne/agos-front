import { Planet } from '@/types/api.types'

/**
 * Galaxy Utilities
 * 
 * Functions for grouping planets by region and system,
 * and managing galaxy-level data structures for the new
 * Region:System:Planet hierarchy.
 */

export interface RegionData {
  region: number
  name: string | null
  systems: SystemData[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    centerX: number
    centerY: number
  }
}

export interface SystemData {
  region: number
  system: number
  name: string | null
  center: { x: number; y: number }
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  planets: Planet[]
}

/**
 * Extract region and system from a planet's coordinate
 */
export function getPlanetRegionAndSystem(planet: Planet): { region: number | null; system: number | null } {
  // Try to get from coordinate object
  if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
    const coord = planet.coordinate as any
    // Try new Region:System format first
    if (typeof coord.region === 'number' && typeof coord.system === 'number') {
      return { region: coord.region, system: coord.system }
    }
    // Fallback to old quadrant:sector:galaxy format - map galaxy to region
    if (typeof coord.galaxy === 'number' && typeof coord.system === 'number') {
      return { region: coord.galaxy, system: coord.system }
    }
  }
  
  // Try to parse from coordinate string
  if (typeof planet.coordinate === 'string') {
    const parts = planet.coordinate.split(':').map(Number)
    // New format: "R:S:P" (Region:System:Planet)
    if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { region: parts[0], system: parts[1] }
    }
    // Old format: "Q:S:G:Sy:P" (Quadrant:Sector:Galaxy:System:Planet) - use galaxy as region
    if (parts.length >= 5 && !isNaN(parts[2]) && !isNaN(parts[3])) {
      return { region: parts[2], system: parts[3] }
    }
    // Old 4-level format: "Q:S:G:P" - use galaxy as region, calculate system from planet
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
      // Calculate system from planet number (assuming 17 planets per system)
      const system = Math.ceil(parts[3] / 17)
      return { region: parts[2], system }
    }
  }
  
  return { region: null, system: null }
}

/**
 * Group planets by region
 */
export function groupPlanetsByRegion(planets: Planet[]): Map<number, Planet[]> {
  const grouped = new Map<number, Planet[]>()
  
  planets.forEach(planet => {
    const { region } = getPlanetRegionAndSystem(planet)
    if (region !== null) {
      if (!grouped.has(region)) {
        grouped.set(region, [])
      }
      grouped.get(region)!.push(planet)
    }
  })
  
  return grouped
}

/**
 * Group planets by system within a region
 */
export function groupPlanetsBySystem(planets: Planet[]): Map<string, Planet[]> {
  const grouped = new Map<string, Planet[]>()
  
  planets.forEach(planet => {
    const { region, system } = getPlanetRegionAndSystem(planet)
    if (region !== null && system !== null) {
      const key = `${region}:${system}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(planet)
    }
  })
  
  return grouped
}

/**
 * Calculate system center from planet positions
 */
export function calculateSystemCenter(planets: Planet[]): { x: number; y: number } | null {
  if (planets.length === 0) return null
  
  const validPositions: { x: number; y: number }[] = []
  
  planets.forEach(planet => {
    // Try direct X/Y
    if (typeof planet.x === 'number' && typeof planet.y === 'number') {
      validPositions.push({ x: planet.x, y: planet.y })
      return
    }
    
    // Try coordinate object X/Y
    if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
      const coord = planet.coordinate as any
      if (typeof coord.x === 'number' && typeof coord.y === 'number') {
        validPositions.push({ x: coord.x, y: coord.y })
        return
      }
    }
  })
  
  if (validPositions.length === 0) return null
  
  const xs = validPositions.map(p => p.x)
  const ys = validPositions.map(p => p.y)
  
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2
  }
}

/**
 * Calculate system bounds from planet positions
 */
export function calculateSystemBounds(planets: Planet[]): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (planets.length === 0) return null
  
  const validPositions: { x: number; y: number }[] = []
  
  planets.forEach(planet => {
    // Try direct X/Y
    if (typeof planet.x === 'number' && typeof planet.y === 'number') {
      validPositions.push({ x: planet.x, y: planet.y })
      return
    }
    
    // Try coordinate object X/Y
    if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
      const coord = planet.coordinate as any
      if (typeof coord.x === 'number' && typeof coord.y === 'number') {
        validPositions.push({ x: coord.x, y: coord.y })
        return
      }
    }
  })
  
  if (validPositions.length === 0) return null
  
  const xs = validPositions.map(p => p.x)
  const ys = validPositions.map(p => p.y)
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  }
}

/**
 * Calculate region bounds from systems
 */
export function calculateRegionBounds(systems: SystemData[]): { minX: number; maxX: number; minY: number; maxY: number; centerX: number; centerY: number } | null {
  if (systems.length === 0) return null
  
  const xs: number[] = []
  const ys: number[] = []
  
  systems.forEach(system => {
    xs.push(system.bounds.minX, system.bounds.maxX)
    ys.push(system.bounds.minY, system.bounds.maxY)
  })
  
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  }
}

/**
 * Create SystemData from grouped planets
 */
export function createSystemData(
  region: number,
  system: number,
  planets: Planet[]
): SystemData | null {
  const center = calculateSystemCenter(planets)
  const bounds = calculateSystemBounds(planets)
  
  if (!center || !bounds) return null
  
  // Get system name from first planet
  const firstPlanet = planets[0]
  const systemName = firstPlanet?.system_name ?? null
  
  return {
    region,
    system,
    name: systemName,
    center,
    bounds,
    planets
  }
}

/**
 * Create RegionData from grouped systems
 */
export function createRegionData(
  region: number,
  systems: SystemData[],
  regionName?: string | null
): RegionData | null {
  const bounds = calculateRegionBounds(systems)
  
  if (!bounds) return null
  
  return {
    region,
    name: regionName ?? null,
    systems,
    bounds
  }
}

/**
 * Build complete galaxy data structure from planets
 */
export function buildGalaxyData(
  planets: Planet[], 
  regionNames?: Record<string, string>
): {
  regions: Map<number, RegionData>
  systems: Map<string, SystemData>
  systemMap: SystemData[]
} {
  // Group by system
  const systemGroups = groupPlanetsBySystem(planets)
  const systems = new Map<string, SystemData>()
  const systemMap: SystemData[] = []
  
  // Create system data
  systemGroups.forEach((systemPlanets, key) => {
    const [region, system] = key.split(':').map(Number)
    const systemData = createSystemData(region, system, systemPlanets)
    if (systemData) {
      systems.set(key, systemData)
      systemMap.push(systemData)
    }
  })
  
  // Group systems by region
  const regionGroups = new Map<number, SystemData[]>()
  systemMap.forEach(system => {
    if (!regionGroups.has(system.region)) {
      regionGroups.set(system.region, [])
    }
    regionGroups.get(system.region)!.push(system)
  })
  
  // Create region data
  const regions = new Map<number, RegionData>()
  regionGroups.forEach((regionSystems, region) => {
    // Get region name - prefer from regionNames map, then from planet, then null
    let regionName: string | null = null
    
    // Try regionNames map first (from API response)
    // Handle both string keys ("1", "2") and number keys (1, 2)
    if (regionNames) {
      regionName = regionNames[region.toString()] || regionNames[region] || null
      // Also check if it's a string that needs trimming
      if (regionName && typeof regionName === 'string') {
        regionName = regionName.trim() || null
      }
    }
    
    // Fallback to first planet's region_name
    if (!regionName) {
      const firstSystem = regionSystems[0]
      const firstPlanet = firstSystem?.planets[0]
      regionName = firstPlanet?.region_name?.trim() || null
    }
    
    const regionData = createRegionData(region, regionSystems, regionName)
    if (regionData) {
      regions.set(region, regionData)
    }
  })
  
  return { regions, systems, systemMap }
}

/**
 * Calculate distance between two systems
 */
export function calculateSystemDistance(system1: SystemData, system2: SystemData): number {
  const dx = system2.center.x - system1.center.x
  const dy = system2.center.y - system1.center.y
  return Math.sqrt(dx * dx + dy * dy)
}

