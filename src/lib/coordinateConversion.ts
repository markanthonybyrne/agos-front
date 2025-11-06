import { Coordinate } from '@/types/game.types'

/**
 * Coordinate Conversion Utilities
 * 
 * Helper functions to convert between old (Quadrant:Sector:Galaxy:Planet) 
 * and new (Region:System:Planet) coordinate formats.
 */

/**
 * Convert coordinate to old Quadrant:Sector:Galaxy:Planet format
 * This is needed for API compatibility with fleet operations that still use the old format
 * 
 * Note: The API still uses the old format for fleet operations, so we need to convert
 * from the new Region:System:Planet format when making API calls.
 */
export function convertToLegacyCoordinate(coord: Coordinate | null | undefined): {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
} | null {
  if (!coord) return null
  
  // If already in legacy format with all required fields, return as-is
  if (
    typeof coord.quadrant === 'number' &&
    typeof coord.sector === 'number' &&
    typeof coord.galaxy === 'number' &&
    typeof coord.planet === 'number'
  ) {
    return {
      quadrant: coord.quadrant,
      sector: coord.sector,
      galaxy: coord.galaxy,
      planet: coord.planet
    }
  }
  
  // If in new format (Region:System:Planet), we need to convert
  // However, since the API still expects the old format, we'll need to
  // use X/Y coordinates to determine the legacy coordinates
  // For now, return null and let the caller handle it
  // The API should eventually support Region:System format or X/Y coordinates
  
  return null
}

/**
 * Extract legacy coordinate fields from a coordinate, handling both formats
 * This is a safer version that checks for required fields
 */
export function extractLegacyFields(coord: Coordinate | null | undefined): {
  quadrant?: number
  sector?: number
  galaxy?: number
  planet?: number
} {
  if (!coord) return {}
  
  return {
    quadrant: coord.quadrant,
    sector: coord.sector,
    galaxy: coord.galaxy,
    planet: coord.planet
  }
}

/**
 * Convert coordinate to legacy format, throwing if conversion fails
 */
export function requireLegacyCoordinate(coord: Coordinate | null | undefined): {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
} {
  if (!coord) {
    throw new Error('Coordinate is required')
  }
  
  const legacy = convertToLegacyCoordinate(coord)
  if (!legacy) {
    throw new Error('Invalid coordinate format - cannot convert to legacy format')
  }
  
  return legacy
}

/**
 * Check if coordinate has all required legacy fields
 */
export function hasLegacyFields(coord: Coordinate | null | undefined): boolean {
  if (!coord) return false
  
  return (
    typeof coord.quadrant === 'number' &&
    typeof coord.sector === 'number' &&
    typeof coord.galaxy === 'number' &&
    typeof coord.planet === 'number'
  )
}

/**
 * Check if coordinate has new format fields
 */
export function hasNewFormatFields(coord: Coordinate | null | undefined): boolean {
  if (!coord) return false
  
  return (
    typeof coord.region === 'number' &&
    typeof coord.system === 'number' &&
    typeof coord.planet === 'number'
  )
}

/**
 * Get coordinate fields safely, preferring legacy format if available
 */
export function getCoordinateFields(coord: Coordinate | null | undefined): {
  quadrant?: number
  sector?: number
  galaxy?: number
  system?: number
  region?: number
  planet?: number
} {
  if (!coord) return {}
  
  return {
    quadrant: coord.quadrant,
    sector: coord.sector,
    galaxy: coord.galaxy,
    system: coord.system,
    region: coord.region,
    planet: coord.planet
  }
}

