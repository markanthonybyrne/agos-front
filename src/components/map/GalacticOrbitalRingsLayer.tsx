import { useMemo } from 'react'
import { GALACTIC_CORE } from '@/lib/spiralUtils'

interface GalacticOrbitalRingsLayerProps {
  gridWidth: number
  gridHeight: number
  scale: number
  minScale?: number // Only show rings below this scale (full galaxy view) - deprecated, use maxScale instead
  maxScale?: number // Show rings up to this scale (region boundaries should show up to system view threshold)
}

/**
 * GalacticOrbitalRingsLayer - Renders dashed circular orbital rings around the galactic core
 * 
 * Creates concentric dashed circles emanating from the galactic core,
 * representing orbital rings or distance markers from the center.
 * These are region boundary lines that should be visible up to system view level.
 */
export function GalacticOrbitalRingsLayer({
  gridWidth,
  gridHeight,
  scale,
  minScale, // Deprecated - kept for backward compatibility
  maxScale, // Show up to this scale (e.g., initialScale * 5 for system view threshold)
}: GalacticOrbitalRingsLayerProps) {
  // Show if scale is within range
  // If maxScale is provided, show up to that scale (for region boundaries)
  // If only minScale is provided (backward compatibility), show below that scale
  const shouldShow = maxScale !== undefined 
    ? scale <= maxScale 
    : (minScale !== undefined ? scale <= minScale : true)

  const orbitalRings = useMemo(() => {
    if (!shouldShow) return []

    const maxRadius = Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight) / 2
    const rings: Array<{ radius: number; opacity: number; strokeWidth: number }> = []
    
    // Create rings at increasing distances from core
    // Start from inner radius and increase by fixed increments
    const ringSpacing = 150 // Distance between rings
    const startRadius = 200
    const endRadius = Math.min(maxRadius, 950) // Limit to reasonable distance (extended to include one more ring)
    
    for (let radius = startRadius; radius <= endRadius; radius += ringSpacing) {
      // Calculate opacity based on distance (fade out near edges, but more visible overall)
      const normalizedRadius = radius / endRadius
      const opacity = normalizedRadius < 0.8 ? 0.7 - normalizedRadius * 0.3 : 0.4
      
      // Stroke width decreases with distance (thicker overall)
      const strokeWidth = 3 - normalizedRadius * 0.8
      
      rings.push({
        radius,
        opacity: Math.max(0.3, opacity),
        strokeWidth: Math.max(2, strokeWidth)
      })
    }
    
    return rings
  }, [shouldShow, gridWidth, gridHeight])

  if (!shouldShow || orbitalRings.length === 0) {
    return null
  }

  return (
    <g className="galactic-orbital-rings-layer">
      {orbitalRings.map((ring, index) => (
        <circle
          key={`orbital-ring-${index}`}
          cx={GALACTIC_CORE.x}
          cy={GALACTIC_CORE.y}
          r={ring.radius}
          fill="none"
          stroke="rgba(25, 234, 253, 0.9)"
          strokeWidth={ring.strokeWidth}
          strokeDasharray="12,6"
          strokeLinecap="round"
          opacity={ring.opacity}
          className="orbital-ring"
          style={{
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 3px rgba(25, 234, 253, 0.6))',
          }}
        />
      ))}
    </g>
  )
}

