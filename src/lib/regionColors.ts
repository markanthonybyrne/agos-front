import { RegionTheme } from '@/types/api.types'

/**
 * Theme-based color palette
 * Maps region themes to colors that match the theme's aesthetic
 */
export const THEME_COLORS: Record<RegionTheme, { fill: string; border: string; solid: string }> = {
  frozen: {
    fill: 'rgba(200, 230, 255, 0.3)',
    border: 'rgba(200, 230, 255, 0.9)',
    solid: 'rgb(200, 230, 255)',
  },
  molten: {
    fill: 'rgba(255, 100, 50, 0.3)',
    border: 'rgba(255, 100, 50, 0.9)',
    solid: 'rgb(255, 100, 50)',
  },
  desert: {
    fill: 'rgba(255, 200, 100, 0.3)',
    border: 'rgba(255, 200, 100, 0.9)',
    solid: 'rgb(255, 200, 100)',
  },
  oceanic: {
    fill: 'rgba(100, 150, 255, 0.3)',
    border: 'rgba(100, 150, 255, 0.9)',
    solid: 'rgb(100, 150, 255)',
  },
  forest: {
    fill: 'rgba(100, 200, 100, 0.3)',
    border: 'rgba(100, 200, 100, 0.9)',
    solid: 'rgb(100, 200, 100)',
  },
  urban: {
    fill: 'rgba(150, 150, 150, 0.3)',
    border: 'rgba(150, 150, 150, 0.9)',
    solid: 'rgb(150, 150, 150)',
  },
  void: {
    fill: 'rgba(50, 50, 100, 0.3)',
    border: 'rgba(100, 100, 150, 0.9)',
    solid: 'rgb(100, 100, 150)',
  },
  habitable: {
    fill: 'rgba(150, 255, 150, 0.3)',
    border: 'rgba(150, 255, 150, 0.9)',
    solid: 'rgb(150, 255, 150)',
  },
  industrial: {
    fill: 'rgba(255, 150, 100, 0.3)',
    border: 'rgba(255, 150, 100, 0.9)',
    solid: 'rgb(255, 150, 100)',
  },
}

/**
 * Region Color Palette (legacy - fallback)
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
  1: 'rgba(255, 100, 100, 0.9)',   // Red - more visible
  2: 'rgba(100, 150, 255, 0.9)',   // Blue - more visible
  3: 'rgba(255, 200, 100, 0.9)',   // Yellow/Orange - more visible
  4: 'rgba(150, 255, 150, 0.9)',   // Green - more visible
  5: 'rgba(200, 100, 255, 0.9)',   // Purple - more visible
  6: 'rgba(100, 255, 255, 0.9)',   // Cyan - more visible
  7: 'rgba(255, 150, 200, 0.9)',   // Pink - more visible
  8: 'rgba(255, 255, 100, 0.9)',   // Light Yellow - more visible
  9: 'rgba(150, 200, 255, 0.9)',   // Light Blue - more visible
  10: 'rgba(255, 180, 100, 0.9)',  // Orange - more visible
  11: 'rgba(180, 255, 180, 0.9)',  // Light Green - more visible
  12: 'rgba(255, 100, 180, 0.9)',  // Magenta - more visible
  13: 'rgba(200, 200, 255, 0.9)',  // Lavender - more visible
  14: 'rgba(255, 220, 150, 0.9)',  // Peach - more visible
  15: 'rgba(150, 255, 220, 0.9)',  // Turquoise - more visible
  16: 'rgba(255, 120, 120, 0.9)',  // Coral - more visible
  17: 'rgba(200, 255, 200, 0.9)',  // Mint - more visible
  18: 'rgba(255, 200, 255, 0.9)',  // Light Purple - more visible
  19: 'rgba(220, 220, 255, 0.9)',  // Periwinkle - more visible
  20: 'rgba(255, 255, 180, 0.9)',  // Cream - more visible
}

/**
 * Get the color for a region, optionally using theme
 */
export function getRegionColor(region: number, theme?: RegionTheme): string {
  if (theme && THEME_COLORS[theme]) {
    return THEME_COLORS[theme].fill
  }
  return REGION_COLORS[region] || 'rgba(128, 128, 128, 0.3)'
}

/**
 * Get the border color for a region, optionally using theme
 */
export function getRegionBorderColor(region: number, theme?: RegionTheme): string {
  if (theme && THEME_COLORS[theme]) {
    return THEME_COLORS[theme].border
  }
  return REGION_BORDER_COLORS[region] || 'rgba(255, 255, 255, 0.5)'
}

/**
 * Get the solid color for a region, optionally using theme
 */
export function getRegionSolidColor(region: number, theme?: RegionTheme): string {
  if (theme && THEME_COLORS[theme]) {
    return THEME_COLORS[theme].solid
  }
  return getRegionSystemColor(region)
}

/**
 * Get solid color for system markers and connections based on region
 * Extracts RGB from region color and returns solid hex color
 */
export function getRegionSystemColor(region: number): string {
  const regionColor = REGION_COLORS[region] || 'rgba(128, 128, 128, 0.3)'
  
  // Extract RGB values from rgba string
  const rgbMatch = regionColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)
    return `rgb(${r}, ${g}, ${b})`
  }
  
  // Fallback colors for each region (matching the palette)
  const solidColors: Record<number, string> = {
    1: '#FF6464',   // Red
    2: '#6496FF',   // Blue
    3: '#FFC864',   // Yellow/Orange
    4: '#96FF96',   // Green
    5: '#C864FF',   // Purple
    6: '#64FFFF',   // Cyan
    7: '#FF96C8',   // Pink
    8: '#FFFF64',   // Light Yellow
    9: '#96C8FF',   // Light Blue
    10: '#FFB464',  // Orange
    11: '#B4FFB4',  // Light Green
    12: '#FF64B4',  // Magenta
    13: '#C8C8FF',  // Lavender
    14: '#FFDC96',  // Peach
    15: '#96FFDC',  // Turquoise
    16: '#FF7878',  // Coral
    17: '#C8FFC8',  // Mint
    18: '#FFC8FF',  // Light Purple
    19: '#DCDCFF',  // Periwinkle
    20: '#FFFFB4',  // Cream
  }
  
  return solidColors[region] || '#808080'
}


