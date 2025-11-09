import { Planet, GeometryDescriptor, Region as ApiRegion, System as ApiSystem, GeometryDefaultsConfig } from '@/types/api.types'

/**
 * Galaxy Utilities
 * 
 * Functions for grouping planets by region and system,
 * and managing galaxy-level data structures for the new
 * Region:System:Planet hierarchy.
 */

export interface RectBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface RegionBounds extends RectBounds {
  centerX: number
  centerY: number
}

export interface RegionData {
  region: number
  name: string | null
  systems: SystemData[]
  bounds: RegionBounds
  center: { x: number; y: number }
  radius: number
  geometry?: GeometryDescriptor
}

export interface SystemData {
  region: number
  system: number
  name: string | null
  center: { x: number; y: number }
  bounds: RectBounds
  radius: number
  geometry?: GeometryDescriptor
  planets: Planet[]
}

const FALLBACK_SYSTEM_RADIUS = 120
const FALLBACK_REGION_RADIUS = 400

function geometryToRectBounds(geometry: GeometryDescriptor): RectBounds {
  if (geometry.bounds) {
    return {
      minX: geometry.bounds.min_x,
      maxX: geometry.bounds.max_x,
      minY: geometry.bounds.min_y,
      maxY: geometry.bounds.max_y,
    }
  }

  const { center, radius } = geometry
  const safeRadius = Math.max(0, radius ?? 0)

  return {
    minX: center.x - safeRadius,
    maxX: center.x + safeRadius,
    minY: center.y - safeRadius,
    maxY: center.y + safeRadius,
  }
}

function rectToRegionBounds(bounds: RectBounds, center?: { x: number; y: number }): RegionBounds {
  if (center) {
    return {
      ...bounds,
      centerX: center.x,
      centerY: center.y,
    }
  }

  return {
    ...bounds,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
  }
}

function geometryToRegionBounds(geometry: GeometryDescriptor): RegionBounds {
  const rect = geometryToRectBounds(geometry)
  return rectToRegionBounds(rect, geometry.center)
}

function radiusFromBounds(bounds: RectBounds): number {
  const width = Math.max(0, bounds.maxX - bounds.minX)
  const height = Math.max(0, bounds.maxY - bounds.minY)
  return Math.max(width, height) / 2
}

function resolveSystemRadius(
  geometry: GeometryDescriptor | undefined,
  bounds: RectBounds | null,
  geometryDefaults?: Partial<GeometryDefaultsConfig>
): number {
  if (geometry?.radius && geometry.radius > 0) {
    return geometry.radius
  }

  const derived = bounds ? radiusFromBounds(bounds) : undefined
  const fallback = geometryDefaults?.system_radius_default ?? FALLBACK_SYSTEM_RADIUS

  if (derived === undefined || derived <= 0) {
    return fallback
  }

  return Math.max(derived, fallback)
}

function resolveRegionRadius(
  geometry: GeometryDescriptor | undefined,
  bounds: RegionBounds | null,
  geometryDefaults?: Partial<GeometryDefaultsConfig>
): number {
  if (geometry?.radius && geometry.radius > 0) {
    return geometry.radius
  }

  const derived = bounds ? radiusFromBounds(bounds) : undefined
  const minRadius = geometryDefaults?.region_radius_min ?? FALLBACK_REGION_RADIUS

  if (derived === undefined || derived <= 0) {
    return minRadius
  }

  return Math.max(derived, minRadius)
}

export interface BuildGalaxyDataOptions {
  mapRegions?: ApiRegion[]
  mapSystems?: ApiSystem[]
  geometryDefaults?: Partial<GeometryDefaultsConfig>
}

interface CreateSystemDataOptions {
  systemNames?: Record<string, string>
  geometry?: GeometryDescriptor
  geometryDefaults?: Partial<GeometryDefaultsConfig>
}

interface CreateRegionDataOptions {
  geometry?: GeometryDescriptor
  geometryDefaults?: Partial<GeometryDefaultsConfig>
}

/**
 * Extract region and system from a planet's coordinate
 * Prefers stored region/system columns over computed values
 */
export function getPlanetRegionAndSystem(planet: Planet): { region: number | null; system: number | null } {
  // Prefer stored region/system columns (backend stores these now)
  if (typeof planet.region === 'number' && typeof planet.system === 'number') {
    return { region: planet.region, system: planet.system }
  }
  
  // Fallback: Try to get from coordinate object
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
  
  // Fallback: Try to parse from coordinate string
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
export function calculateSystemBounds(planets: Planet[]): RectBounds | null {
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
export function calculateRegionBounds(systems: SystemData[]): RegionBounds | null {
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
  planets: Planet[],
  options: CreateSystemDataOptions = {}
): SystemData | null {
  const { systemNames, geometry, geometryDefaults } = options

  const geometryBounds = geometry ? geometryToRectBounds(geometry) : null
  const fallbackBounds = calculateSystemBounds(planets)
  const bounds = geometryBounds ?? fallbackBounds

  const fallbackCenter = calculateSystemCenter(planets)
  let center = geometry?.center ?? fallbackCenter

  if (!center && bounds) {
    center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }
  }

  if (!center || !bounds) return null

  // Get system name - prefer from systemNames map, then from planet
  let systemName: string | null = null

  if (systemNames) {
    const key = `${region}:${system}`
    systemName = systemNames[key] || null
    if (systemName && typeof systemName === 'string') {
      systemName = systemName.trim() || null
    }
  }

  if (!systemName) {
    const firstPlanet = planets[0]
    systemName = firstPlanet?.system_name?.trim() ?? null
  }

  const radius = resolveSystemRadius(geometry, bounds, geometryDefaults)

  return {
    region,
    system,
    name: systemName,
    center,
    bounds,
    radius,
    geometry,
    planets
  }
}

/**
 * Create RegionData from grouped systems
 */
export function createRegionData(
  region: number,
  systems: SystemData[],
  regionName?: string | null,
  options: CreateRegionDataOptions = {}
): RegionData | null {
  const { geometry, geometryDefaults } = options

  let bounds: RegionBounds | null = geometry ? geometryToRegionBounds(geometry) : null

  if (!bounds) {
    bounds = calculateRegionBounds(systems)
  }

  if (!bounds) return null

  const center = geometry?.center ?? { x: bounds.centerX, y: bounds.centerY }
  const radius = resolveRegionRadius(geometry, bounds, geometryDefaults)

  return {
    region,
    name: regionName ?? null,
    systems,
    bounds,
    center,
    radius,
    geometry
  }
}

/**
 * Build complete galaxy data structure from planets
 */
export function buildGalaxyData(
  planets: Planet[], 
  regionNames?: Record<string, string>,
  systemNames?: Record<string, string>,
  options: BuildGalaxyDataOptions = {}
): {
  regions: Map<number, RegionData>
  systems: Map<string, SystemData>
  systemMap: SystemData[]
} {
  const { mapRegions = [], mapSystems = [], geometryDefaults } = options

  const systemGeometryLookup = new Map<string, GeometryDescriptor>()
  mapSystems?.forEach((systemEntry) => {
    if (systemEntry?.geometry) {
      const key = `${systemEntry.region}:${systemEntry.system}`
      systemGeometryLookup.set(key, systemEntry.geometry)
    }
  })

  planets.forEach((planet) => {
    const { region, system } = getPlanetRegionAndSystem(planet)
    if (region === null || system === null) return
    const key = `${region}:${system}`
    if (systemGeometryLookup.has(key)) return
    const planetGeometry = planet.geometry?.system
    if (planetGeometry) {
      systemGeometryLookup.set(key, planetGeometry)
    }
  })

  const regionGeometryLookup = new Map<number, GeometryDescriptor>()
  const regionNameLookup = new Map<number, string>()

  mapRegions?.forEach((regionEntry) => {
    if (regionEntry.geometry) {
      regionGeometryLookup.set(regionEntry.region, regionEntry.geometry)
    }
    if (typeof regionEntry.name === 'string') {
      const trimmed = regionEntry.name.trim()
      if (trimmed.length > 0) {
        regionNameLookup.set(regionEntry.region, trimmed)
      }
    }
  })

  // Group by system
  const systemGroups = groupPlanetsBySystem(planets)
  const systems = new Map<string, SystemData>()
  const systemMap: SystemData[] = []
  
  // Create system data
  systemGroups.forEach((systemPlanets, key) => {
    const [region, system] = key.split(':').map(Number)
    const systemData = createSystemData(region, system, systemPlanets, {
      systemNames,
      geometry: systemGeometryLookup.get(key),
      geometryDefaults
    })
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
    
    if (!regionName) {
      regionName = regionNameLookup.get(region) ?? null
    }
    
    // Fallback to first planet's region_name
    if (!regionName) {
      const firstSystem = regionSystems[0]
      const firstPlanet = firstSystem?.planets[0]
      regionName = firstPlanet?.region_name?.trim() || null
    }
    
    const regionData = createRegionData(region, regionSystems, regionName, {
      geometry: regionGeometryLookup.get(region),
      geometryDefaults
    })
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

