/**
 * Color utilities for universe map rendering
 * Provides deterministic color assignment based on coordinates and planet/system types
 */

/**
 * Convert hex color to PixiJS Color format (number)
 * @param hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns PixiJS color number
 */
export function hexToPixiColor(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  return parseInt(cleanHex, 16)
}

/**
 * Get color for planet type
 * @param planetType - Planet type slug
 * @returns Hex color string
 */
export function getPlanetTypeColor(planetType?: string): string {
  if (!planetType) return '#888888' // Gray for unknown

  const typeColors: Record<string, string> = {
    // Habitable planets - blues and greens
    terran: '#4A90E2',
    temperate: '#5BA3D4',
    oceanic: '#3B9AE1',
    tropical: '#2ECC71',
    forest: '#27AE60',
    jungle: '#229954',
    
    // Harsh planets - reds and oranges
    volcanic: '#E74C3C',
    molten: '#D35400',
    toxic: '#E67E22',
    arid: '#F39C12',
    
    // Cold planets - cyans and light blues
    ice: '#85C1E9',
    tundra: '#AED6F1',
    
    // Gas giants - purples
    gas_giant: '#9B59B6',
    'gas-giant': '#9B59B6',
    
    // Exotic - yellows and golds
    exotic: '#F1C40F',
    quantum: '#F7DC6F',
    crystalline: '#D7BDE2',
    nebulous: '#BB8FCE',
    
    // Others
    barren: '#95A5A6',
    rocky: '#7F8C8D',
    metallic: '#566573',
    dwarf: '#5D6D7E',
    ringed: '#A569BD',
    swamp: '#7D3C98',
    plasma: '#C0392B',
    blue_planet: '#3498DB',
    'blue-planet': '#3498DB',
    'blue-planet-space': '#3498DB',
    yellow: '#F4D03F',
  }
  
  // Normalize slug (handle both snake_case and kebab-case)
  const normalizedType = planetType.toLowerCase().replace(/-/g, '_')
  
  return typeColors[planetType] || typeColors[normalizedType] || '#888888'
}

/**
 * Get color for system state
 * @param systemState - System state (e.g., 'habitable', 'colonized', 'unsettled')
 * @returns Hex color string
 */
export function getSystemStateColor(systemState?: string): string {
  const stateColors: Record<string, string> = {
    habitable: '#4A90E2',      // Blue
    colonized: '#F1C40F',       // Yellow
    unsettled: '#FFFFFF',       // White
    homeworld: '#E74C3C',       // Red
  }
  
  return stateColors[systemState || 'unsettled'] || '#FFFFFF'
}

/**
 * Get deterministic color based on coordinates
 * This ensures the same coordinates always get the same color
 * @param quadrant - Quadrant number (1-4)
 * @param sector - Sector number (1-4)
 * @param galaxy - Galaxy number (1-10)
 * @param system - System number (1-10, optional)
 * @returns Hex color string
 */
export function getCoordinateColor(
  quadrant: number,
  sector: number,
  galaxy: number,
  system?: number
): string {
  // Create deterministic hash from coordinates
  let hash = quadrant * 10000 + sector * 1000 + galaxy * 100
  if (system) {
    hash += system
  }
  
  // Map hash to color palette
  const colors = [
    '#4A90E2', // Blue
    '#F1C40F', // Yellow
    '#E74C3C', // Red
    '#2ECC71', // Green
    '#9B59B6', // Purple
    '#E67E22', // Orange
    '#1ABC9C', // Turquoise
    '#3498DB', // Light blue
    '#F39C12', // Gold
    '#16A085', // Dark turquoise
  ]
  
  const index = hash % colors.length
  return colors[index]
}

/**
 * Get color for planet based on state and ownership
 * @param planetState - Planet state (unsettled, colony, homeworld)
 * @param isHabitable - Whether planet is habitable
 * @param ownerName - Owner indicator (if colonized)
 * @returns Hex color string
 */
export function getPlanetColor(
  planetState?: string,
  isHabitable?: boolean,
  ownerName?: string | null
): string {
  if (ownerName) {
    // Colonized - use yellow/gold
    return '#F1C40F'
  }
  
  if (planetState === 'homeworld') {
    return '#E74C3C' // Red for homeworld
  }
  
  if (planetState === 'colony') {
    return '#F39C12' // Orange for colony
  }
  
  if (isHabitable) {
    return '#4A90E2' // Blue for habitable but unsettled
  }
  
  return '#95A5A6' // Gray for uninhabitable
}

