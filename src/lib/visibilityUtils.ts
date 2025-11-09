import { Planet, VisibilityResponse, GeometryDescriptor } from '@/types/api.types'
import { getPlanetRegionAndSystem } from './galaxyUtils'

/**
 * Visibility Utilities
 * 
 * Helper functions to check if planets, systems, and regions are visible
 * based on visibility data from the API.
 */

/**
 * Check if a region is visible based on visibility data
 */
export function isRegionVisible(
  region: number,
  visibilityData: VisibilityResponse | undefined
): boolean {
  if (!visibilityData) return false
  
  // Check if region is in visible_regions array
  if (visibilityData.visible_regions && Array.isArray(visibilityData.visible_regions)) {
    return visibilityData.visible_regions.some(
      (r) => r.region === region && (r.discovery_status === 'visible' || r.discovery_status === 'fogged')
    )
  }
  
  return false
}

/**
 * Check if a system is visible based on visibility data
 */
export function isSystemVisible(
  region: number,
  system: number,
  visibilityData: VisibilityResponse | undefined
): boolean {
  if (!visibilityData) return false
  
  // Check if system is in visible_systems array
  if (visibilityData.visible_systems && Array.isArray(visibilityData.visible_systems)) {
    return visibilityData.visible_systems.some(
      (s) => s.region === region && s.system === system && (s.discovery_status === 'visible' || s.discovery_status === 'fogged')
    )
  }
  
  // Fallback: Check if region is visible (system might be visible if region is visible)
  // This is a fallback for cases where system-level visibility isn't specified
  if (isRegionVisible(region, visibilityData)) {
    return true
  }
  
  return false
}

/**
 * Check if a planet is visible based on visibility data
 */
export function isPlanetVisible(
  planet: Planet,
  visibilityData: VisibilityResponse | undefined
): boolean {
  // First check planet's own fog_of_war data (most direct check)
  if (planet.fog_of_war) {
    return planet.fog_of_war.is_visible
  }
  
  // Fallback: Check legacy visibility field
  if (planet.visibility) {
    return planet.visibility.is_visible
  }
  
  // Fallback: Check system visibility
  const { region, system } = getPlanetRegionAndSystem(planet)
  if (region !== null && system !== null) {
    return isSystemVisible(region, system, visibilityData)
  }
  
  // If no visibility data available, assume not visible (safe default)
  return false
}

/**
 * Get all visible region numbers from visibility data
 */
export function getVisibleRegions(visibilityData: VisibilityResponse | undefined): Set<number> {
  const regions = new Set<number>()
  
  if (!visibilityData?.visible_regions) return regions
  
  visibilityData.visible_regions.forEach((r) => {
    if (r.discovery_status === 'visible' || r.discovery_status === 'fogged') {
      regions.add(r.region)
    }
  })
  
  return regions
}

/**
 * Get all visible system keys (format: "region:system") from visibility data
 */
export function getVisibleSystems(visibilityData: VisibilityResponse | undefined): Set<string> {
  const systems = new Set<string>()
  
  if (!visibilityData?.visible_systems) return systems
  
  visibilityData.visible_systems.forEach((s) => {
    if (s.discovery_status === 'visible' || s.discovery_status === 'fogged') {
      systems.add(`${s.region}:${s.system}`)
    }
  })
  
  return systems
}
/**
 * Build geometry descriptor from legacy x/y ranges if geometry is missing
 */
function buildGeometryFromRanges(
  xRange?: { min: number; max: number },
  yRange?: { min: number; max: number }
): GeometryDescriptor | null {
  if (
    !xRange ||
    !yRange ||
    typeof xRange.min !== 'number' ||
    typeof xRange.max !== 'number' ||
    typeof yRange.min !== 'number' ||
    typeof yRange.max !== 'number'
  ) {
    return null
  }

  const minX = xRange.min
  const maxX = xRange.max
  const minY = yRange.min
  const maxY = yRange.max
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const radius = Math.max(maxX - minX, maxY - minY) / 2

  return {
    center: { x: centerX, y: centerY },
    radius,
    bounds: {
      min_x: minX,
      max_x: maxX,
      min_y: minY,
      max_y: maxY,
    },
  }
}

export function getVisibleRegionGeometries(
  visibilityData: VisibilityResponse | undefined
): Map<number, GeometryDescriptor> {
  const geometries = new Map<number, GeometryDescriptor>()
  if (!visibilityData?.visible_regions) return geometries

  visibilityData.visible_regions.forEach((region) => {
    let geometry = region.geometry
    if (!geometry) {
      geometry = buildGeometryFromRanges(region.x_range, region.y_range) ?? undefined
    }
    if (geometry) {
      geometries.set(region.region, geometry)
    }
  })

  return geometries
}

export function getVisibleSystemGeometries(
  visibilityData: VisibilityResponse | undefined
): Map<string, GeometryDescriptor> {
  const geometries = new Map<string, GeometryDescriptor>()
  if (!visibilityData?.visible_systems) return geometries

  visibilityData.visible_systems.forEach((system) => {
    let geometry = system.geometry
    if (!geometry) {
      geometry = buildGeometryFromRanges(system.x_range, system.y_range) ?? undefined
    }
    if (geometry) {
      geometries.set(`${system.region}:${system.system}`, geometry)
    }
  })

  return geometries
}
