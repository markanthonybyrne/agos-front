/**
 * Region Color Palette
 * 
 * Provides distinct colors for 20 regions in the galaxy map.
 * Colors are designed to be visually distinct and work well with
 * a dark galaxy background.
 */

export const REGION_COLORS: Record<number, string> = {
  1: 'rgba(255, 100, 100, 0.3)',   // Red - Outer Rim
  2: 'rgba(100, 150, 255, 0.3)',   // Blue - Mid Rim
  3: 'rgba(255, 200, 100, 0.3)',   // Yellow/Orange - Core Worlds
  4: 'rgba(150, 255, 150, 0.3)',   // Green - Unknown Regions
  5: 'rgba(200, 100, 255, 0.3)',   // Purple - Wild Space
  6: 'rgba(100, 255, 255, 0.3)',   // Cyan - Nebula Sector
  7: 'rgba(255, 150, 200, 0.3)',   // Pink - Frontier Zone
  8: 'rgba(255, 255, 100, 0.3)',   // Light Yellow - Gold Sector
  9: 'rgba(150, 200, 255, 0.3)',   // Light Blue - Ice Belt
  10: 'rgba(255, 180, 100, 0.3)',  // Orange - Fire Sector
  11: 'rgba(180, 255, 180, 0.3)',  // Light Green - Life Zone
  12: 'rgba(255, 100, 180, 0.3)',  // Magenta - War Zone
  13: 'rgba(200, 200, 255, 0.3)',  // Lavender - Peace Sector
  14: 'rgba(255, 220, 150, 0.3)',  // Peach - Trade Route
  15: 'rgba(150, 255, 220, 0.3)',  // Turquoise - Mining Belt
  16: 'rgba(255, 120, 120, 0.3)',  // Coral - Research Sector
  17: 'rgba(200, 255, 200, 0.3)',  // Mint - Agriculture Zone
  18: 'rgba(255, 200, 255, 0.3)',  // Light Purple - Mystery Sector
  19: 'rgba(220, 220, 255, 0.3)',  // Periwinkle - Diplomatic Zone
  20: 'rgba(255, 255, 180, 0.3)',  // Cream - Neutral Space
}

export const REGION_BORDER_COLORS: Record<number, string> = {
  1: 'rgba(255, 100, 100, 0.6)',
  2: 'rgba(100, 150, 255, 0.6)',
  3: 'rgba(255, 200, 100, 0.6)',
  4: 'rgba(150, 255, 150, 0.6)',
  5: 'rgba(200, 100, 255, 0.6)',
  6: 'rgba(100, 255, 255, 0.6)',
  7: 'rgba(255, 150, 200, 0.6)',
  8: 'rgba(255, 255, 100, 0.6)',
  9: 'rgba(150, 200, 255, 0.6)',
  10: 'rgba(255, 180, 100, 0.6)',
  11: 'rgba(180, 255, 180, 0.6)',
  12: 'rgba(255, 100, 180, 0.6)',
  13: 'rgba(200, 200, 255, 0.6)',
  14: 'rgba(255, 220, 150, 0.6)',
  15: 'rgba(150, 255, 220, 0.6)',
  16: 'rgba(255, 120, 120, 0.6)',
  17: 'rgba(200, 255, 200, 0.6)',
  18: 'rgba(255, 200, 255, 0.6)',
  19: 'rgba(220, 220, 255, 0.6)',
  20: 'rgba(255, 255, 180, 0.6)',
}

/**
 * Get the color for a region (1-20)
 */
export function getRegionColor(region: number): string {
  return REGION_COLORS[region] || 'rgba(128, 128, 128, 0.3)'
}

/**
 * Get the border color for a region (1-20)
 */
export function getRegionBorderColor(region: number): string {
  return REGION_BORDER_COLORS[region] || 'rgba(255, 255, 255, 0.5)'
}


