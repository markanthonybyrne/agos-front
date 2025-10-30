import { Coordinate } from '@/types/game.types'

// Coordinate parsing and formatting
export function parseCoordinate(coordinate: string | Coordinate): Coordinate | null {
  // If it's already a Coordinate object, return it
  if (typeof coordinate === 'object' && coordinate !== null && 'quadrant' in coordinate) {
    return coordinate as Coordinate
  }
  
  // If it's a string, parse it
  if (typeof coordinate === 'string') {
    const parts = coordinate.split(':').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) {
      return null
    }
    return {
      quadrant: parts[0],
      sector: parts[1],
      galaxy: parts[2],
      planet: parts[3],
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
    // Validate string format
    const parts = coordinate.split(':')
    if (parts.length === 4 && parts.every(p => !isNaN(Number(p)))) {
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
      return `${quadrant}:${sector}:${galaxy}:${planet}`
    }
  }
  
  return 'Invalid coordinate'
}

export function isValidCoordinate(coordinate: string): boolean {
  return parseCoordinate(coordinate) !== null
}

export function calculateDistance(
  origin: Coordinate | string,
  destination: Coordinate | string
): number {
  const originCoord = typeof origin === 'string' ? parseCoordinate(origin) : origin
  const destCoord = typeof destination === 'string' ? parseCoordinate(destination) : destination

  if (!originCoord || !destCoord) {
    return Infinity
  }

  // Simple Manhattan distance
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

