import { useMemo } from 'react'
import { GALACTIC_CORE } from '@/lib/spiralUtils'

interface GalacticCoreLayerProps {
  scale: number
  panX: number
  panY: number
  containerWidth: number
  containerHeight: number
  minScale?: number // Only show core below this scale (full galaxy view)
}

/**
 * GalacticCoreLayer - Renders the galactic center image at the center of the universe
 * 
 * Displays the galactic center image at (1000, 1000):
 * - Uses the asset from assets/images/universe/galactic-center.png
 * - Only visible at full galaxy view (low zoom)
 */
export function GalacticCoreLayer({
  scale,
  panX,
  panY,
  containerWidth,
  containerHeight,
  minScale = 0.1, // Only show at full galaxy view
}: GalacticCoreLayerProps) {
  // Only render if zoomed out enough (full galaxy view)
  const shouldShow = scale <= minScale

  const corePosition = useMemo(() => {
    if (!shouldShow) return null

    // Calculate screen position from grid coordinates
    // The SVG viewBox handles the coordinate transformation
    return {
      x: GALACTIC_CORE.x,
      y: GALACTIC_CORE.y,
    }
  }, [shouldShow])

  if (!shouldShow || !corePosition) {
    return null
  }

  // Core size scales with zoom level - larger when more zoomed out
  // Base size for the image (750% larger than original)
  const baseSize = 1500
  const coreSize = Math.max(750, baseSize / scale)

  return (
    <g className="galactic-core-layer">
      {/* Galactic center image */}
      <image
        x={corePosition.x - coreSize / 2}
        y={corePosition.y - coreSize / 2}
        width={coreSize}
        height={coreSize}
        href="/assets/images/universe/galactic-center.png"
        className="galactic-core-image"
        preserveAspectRatio="xMidYMid"
        style={{
          opacity: 1,
        }}
      />
    </g>
  )
}

