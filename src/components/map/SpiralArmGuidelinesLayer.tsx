import { useMemo } from 'react'
import { getAllSpiralArmPaths, GALACTIC_CORE } from '@/lib/spiralUtils'

interface SpiralArmGuidelinesLayerProps {
  scale: number
  panX: number
  panY: number
  minScale?: number // Only show guidelines below this scale
  opacity?: number
}

/**
 * SpiralArmGuidelinesLayer - Renders optional spiral arm guideline overlays
 * 
 * Displays dashed lines following the logarithmic spiral pattern of the 3 spiral arms.
 * Useful for visualizing the spiral structure of the galaxy.
 * 
 * Only visible at full galaxy view (low zoom levels).
 */
export function SpiralArmGuidelinesLayer({
  scale,
  panX,
  panY,
  minScale = 0.1,
  opacity = 0.15,
}: SpiralArmGuidelinesLayerProps) {
  // Only render if zoomed out enough (full galaxy view)
  const shouldShow = scale <= minScale

  const spiralPaths = useMemo(() => {
    if (!shouldShow) return []

    // Calculate spiral arm paths
    // Use smaller step size for smoother curves
    const paths = getAllSpiralArmPaths(0, 7 * Math.PI, 0.05)
    
    // Convert to SVG path strings
    return paths.map((points, armIndex) => {
      if (points.length === 0) return ''
      
      const path = points.map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${point[0]} ${point[1]}`
      }).join(' ')
      
      return path
    })
  }, [shouldShow])

  if (!shouldShow || spiralPaths.length === 0) {
    return null
  }

  // Color each arm slightly differently for visual distinction
  const armColors = [
    'rgba(255, 200, 100, 0.3)', // Arm 1 - Warm yellow
    'rgba(150, 200, 255, 0.3)', // Arm 2 - Cool blue
    'rgba(200, 150, 255, 0.3)', // Arm 3 - Purple
  ]

  return (
    <g className="spiral-arm-guidelines-layer" style={{ opacity }}>
      {spiralPaths.map((path, armIndex) => (
        <path
          key={`spiral-arm-${armIndex + 1}`}
          d={path}
          fill="none"
          stroke={armColors[armIndex]}
          strokeWidth={1.5}
          strokeDasharray="8,4"
          strokeLinecap="round"
          className="spiral-arm-guideline"
          style={{
            pointerEvents: 'none',
          }}
        />
      ))}
      
      {/* Optional: Draw core marker */}
      <circle
        cx={GALACTIC_CORE.x}
        cy={GALACTIC_CORE.y}
        r={3}
        fill="rgba(255, 255, 200, 0.5)"
        stroke="rgba(255, 200, 100, 0.8)"
        strokeWidth={1}
      />
    </g>
  )
}

