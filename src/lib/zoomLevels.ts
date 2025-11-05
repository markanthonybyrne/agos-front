/**
 * Zoom Level Definitions and Layer Visibility
 * 
 * Defines normalized zoom ranges (0.0 = Universe, 1.0 = System) and
 * smooth opacity transitions for each layer type.
 */

export interface LayerVisibility {
  name: string
  fadeInStart: number    // Normalized zoom where layer starts appearing
  fadeInEnd: number      // Normalized zoom where layer fully visible
  fadeOutStart: number   // Normalized zoom where layer starts fading
  fadeOutEnd: number     // Normalized zoom where layer fully hidden
}

export const LAYER_VISIBILITY: Record<string, LayerVisibility> = {
  universe: {
    name: 'Universe',
    fadeInStart: 0.00,
    fadeInEnd: 0.01,  // Fully visible immediately at 0% zoom
    fadeOutStart: 0.08,
    fadeOutEnd: 0.12
  },
  quadrant: {
    name: 'Quadrant',
    fadeInStart: 0.00,  // Start showing immediately at 0% zoom
    fadeInEnd: 0.05,    // Fully visible at low zoom
    fadeOutStart: 0.15,
    fadeOutEnd: 0.20
  },
  sector: {
    name: 'Sector',
    fadeInStart: 0.00,  // Start showing immediately at 0% zoom
    fadeInEnd: 0.01,    // Fully visible immediately
    fadeOutStart: 0.35,
    fadeOutEnd: 0.45
  },
  galaxy: {
    name: 'Galaxy',
    fadeInStart: 0.00,  // Start showing at 0% zoom (very small)
    fadeInEnd: 0.40,    // Fully visible at medium zoom (scale ~0.4)
    fadeOutStart: 0.65,
    fadeOutEnd: 0.75
  },
  system: {
    name: 'System',
    fadeInStart: 0.00,  // Start showing at 0% zoom (very small)
    fadeInEnd: 0.75,    // Fully visible at high zoom (scale ~1.2)
    fadeOutStart: 1.00,  // Never fades out
    fadeOutEnd: 1.00
  }
}

/**
 * Orbit line visibility configuration
 * Orbit lines fade in starting at zoom 0.65, fully visible at 0.70-1.00
 */
export const ORBIT_LINE_VISIBILITY = {
  fadeInStart: 0.65,  // Start fading in at 65% normalized zoom (galaxy/system view)
  fadeInEnd: 0.70,    // Fully visible at 70% (system view)
  fadeOutStart: 1.00, // Never fades out (stays visible to 100%)
  fadeOutEnd: 1.00
}

/**
 * Calculate layer opacity based on normalized zoom (0.0-1.0)
 * Uses smooth ease-in-out curves for transitions
 * 
 * @param layerName - Name of the layer (universe, quadrant, sector, galaxy, system)
 * @param normalizedZoom - Normalized zoom level (0.0 = Universe, 1.0 = System)
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
 * Fades in starting at 0.7, fully visible at 0.75-1.00
 * 
 * @param normalizedZoom - Normalized zoom level (0.0 = Universe, 1.0 = System)
 * @returns Opacity value between 0.0 and 1.0
 */
export function getOrbitLineOpacity(normalizedZoom: number): number {
  if (normalizedZoom < ORBIT_LINE_VISIBILITY.fadeInStart) return 0  // Hidden below system level
  
  if (normalizedZoom >= ORBIT_LINE_VISIBILITY.fadeInStart && normalizedZoom < ORBIT_LINE_VISIBILITY.fadeInEnd) {
    // Fade in from 0.65 to 0.70
    const fadeProgress = (normalizedZoom - ORBIT_LINE_VISIBILITY.fadeInStart) / 
      (ORBIT_LINE_VISIBILITY.fadeInEnd - ORBIT_LINE_VISIBILITY.fadeInStart)
    // Smooth ease-in-out curve
    return fadeProgress * fadeProgress * (3 - 2 * fadeProgress)
  }
  
  // Fully visible from fadeInEnd (0.70) through 1.0 and beyond (for 700% zoom)
  if (normalizedZoom >= ORBIT_LINE_VISIBILITY.fadeInEnd) {
    return 1.0  // Fully visible at all high zoom levels including 700%
  }
  
  return 0
}

/**
 * Calculate orbit line stroke width based on normalized zoom
 * Scales from 1.5px at 0.75 to 2.5px at 1.0
 * 
 * @param normalizedZoom - Normalized zoom level (0.0 = Universe, 1.0 = System)
 * @returns Stroke width in pixels
 */
export function getOrbitLineWidth(normalizedZoom: number): number {
  if (normalizedZoom < 0.65) return 0
  // Scale from 1.5px at 0.70 to 2.5px at 1.0
  const baseWidth = 1.5
  const maxWidth = 2.5
  if (normalizedZoom < 0.70) return baseWidth
  const scale = (normalizedZoom - 0.70) / 0.30  // 0.0 to 1.0 in system range (0.70 to 1.0)
  return baseWidth + (scale * (maxWidth - baseWidth))
}

