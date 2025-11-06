/**
 * Zoom Level Definitions and Layer Visibility
 * 
 * Defines normalized zoom ranges (0.0 = Sector, 1.0 = Planetary) and
 * smooth opacity transitions for each layer type.
 */

export interface LayerVisibility {
  name: string
  fadeInStart: number    // Normalized zoom where layer starts appearing
  fadeInEnd: number      // Normalized zoom where layer fully visible
  fadeOutStart: number   // Normalized zoom where layer starts fading
  fadeOutEnd: number     // Normalized zoom where layer fully hidden
}

/**
 * Hierarchical zoom level ranges
 * Discrete ranges with overlapping fade zones for smooth transitions
 * Starting at sector view (no quadrant/universe view needed)
 */
export const ZOOM_LEVEL_RANGES = {
  sector: { min: 0.00, max: 0.30 },
  galaxy: { min: 0.25, max: 0.55 },
  system: { min: 0.50, max: 0.80 },
  planetary: { min: 0.75, max: 1.00 }
} as const

export type ZoomLevel = keyof typeof ZOOM_LEVEL_RANGES

/**
 * Get the current zoom level based on normalized zoom
 * 
 * @param normalizedZoom - Normalized zoom level (0.0-1.0)
 * @returns Current zoom level name
 */
export function getZoomLevel(normalizedZoom: number): ZoomLevel {
  if (normalizedZoom < 0.30) return 'sector'
  if (normalizedZoom < 0.55) return 'galaxy'
  if (normalizedZoom < 0.80) return 'system'
  return 'planetary'
}

export const LAYER_VISIBILITY: Record<string, LayerVisibility> = {
  sector: {
    name: 'Sector',
    fadeInStart: 0.00,  // Start showing immediately at 0% zoom (sector view)
    fadeInEnd: 0.00,    // Fully visible immediately at 0% zoom
    fadeOutStart: 0.22,
    fadeOutEnd: 0.30    // Fade out as we transition to galaxy
  },
  galaxy: {
    name: 'Galaxy',
    fadeInStart: 0.20,  // Start fading in during sector→galaxy transition
    fadeInEnd: 0.30,    // Fully visible at galaxy level
    fadeOutStart: 0.47,
    fadeOutEnd: 0.55    // Fade out as we transition to system
  },
  system: {
    name: 'System',
    fadeInStart: 0.45,  // Start fading in during galaxy→system transition
    fadeInEnd: 0.55,    // Fully visible at system level
    fadeOutStart: 0.73,
    fadeOutEnd: 0.80    // Fade out as we transition to planetary
  },
  planetary: {
    name: 'Planetary',
    fadeInStart: 0.70,  // Start fading in during system→planetary transition
    fadeInEnd: 0.80,    // Fully visible at planetary level
    fadeOutStart: 1.00,  // Never fades out
    fadeOutEnd: 1.00
  }
}

/**
 * Orbit line visibility configuration
 * Orbit lines fade in starting at zoom 0.50, fully visible at 0.55-1.00
 */
export const ORBIT_LINE_VISIBILITY = {
  fadeInStart: 0.50,  // Start fading in at 50% normalized zoom (system view)
  fadeInEnd: 0.55,    // Fully visible at 55% (system view)
  fadeOutStart: 1.00, // Never fades out (stays visible to 100%)
  fadeOutEnd: 1.00
}

/**
 * Calculate layer opacity based on normalized zoom (0.0-1.0)
 * Uses smooth ease-in-out curves for transitions
 * 
 * @param layerName - Name of the layer (sector, galaxy, system, planetary)
 * @param normalizedZoom - Normalized zoom level (0.0 = Sector, 1.0 = Planetary)
 * @returns Opacity value between 0.0 and 1.0
 */
export function getLayerOpacity(layerName: string, normalizedZoom: number): number {
  const layer = LAYER_VISIBILITY[layerName]
  if (!layer) return 0
  
  // Fade in
  if (normalizedZoom >= layer.fadeInStart && normalizedZoom <= layer.fadeInEnd) {
    const fadeRange = layer.fadeInEnd - layer.fadeInStart
    const progress = (normalizedZoom - layer.fadeInStart) / fadeRange
    // Smooth ease-in-out curve: smoothstep function
    return progress * progress * (3 - 2 * progress)
  }
  
  // Fully visible
  if (normalizedZoom > layer.fadeInEnd && normalizedZoom < layer.fadeOutStart) {
    return 1.0
  }
  
  // Fade out
  if (normalizedZoom >= layer.fadeOutStart && normalizedZoom <= layer.fadeOutEnd) {
    const fadeRange = layer.fadeOutEnd - layer.fadeOutStart
    const progress = (normalizedZoom - layer.fadeOutStart) / fadeRange
    // Smooth ease-in-out curve: smoothstep function
    return 1.0 - (progress * progress * (3 - 2 * progress))
  }
  
  // Hidden
  return 0
}

/**
 * Calculate orbit line opacity based on normalized zoom
 * Fades in starting at 0.50, fully visible at 0.55-1.00
 * 
 * @param normalizedZoom - Normalized zoom level (0.0 = Sector, 1.0 = Planetary)
 * @returns Opacity value between 0.0 and 1.0
 */
export function getOrbitLineOpacity(normalizedZoom: number): number {
  if (normalizedZoom < ORBIT_LINE_VISIBILITY.fadeInStart) return 0  // Hidden below system level
  
  if (normalizedZoom >= ORBIT_LINE_VISIBILITY.fadeInStart && normalizedZoom < ORBIT_LINE_VISIBILITY.fadeInEnd) {
    // Fade in from 0.50 to 0.55
    const fadeProgress = (normalizedZoom - ORBIT_LINE_VISIBILITY.fadeInStart) / 
      (ORBIT_LINE_VISIBILITY.fadeInEnd - ORBIT_LINE_VISIBILITY.fadeInStart)
    // Smooth ease-in-out curve
    return fadeProgress * fadeProgress * (3 - 2 * fadeProgress)
  }
  
  // Fully visible from fadeInEnd (0.55) through 1.0 and beyond (for 700% zoom)
  if (normalizedZoom >= ORBIT_LINE_VISIBILITY.fadeInEnd) {
    return 1.0  // Fully visible at all high zoom levels including 700%
  }
  
  return 0
}

/**
 * Calculate orbit line stroke width based on normalized zoom
 * Scales from 1.5px at 0.55 to 2.5px at 1.0
 * 
 * @param normalizedZoom - Normalized zoom level (0.0 = Sector, 1.0 = Planetary)
 * @returns Stroke width in pixels
 */
export function getOrbitLineWidth(normalizedZoom: number): number {
  if (normalizedZoom < 0.50) return 0
  // Scale from 1.5px at 0.55 to 2.5px at 1.0
  const baseWidth = 1.5
  const maxWidth = 2.5
  if (normalizedZoom < 0.55) return baseWidth
  const scale = (normalizedZoom - 0.55) / 0.45  // 0.0 to 1.0 in system/planetary range (0.55 to 1.0)
  return baseWidth + (scale * (maxWidth - baseWidth))
}

