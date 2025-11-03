import { useMemo } from 'react'
import { getQuadrantXyRange } from '@/lib/coordinateUtils'

interface QuadrantOverlayProps {
  gridSize: number
  scale: number
  viewportBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  onQuadrantClick?: (quadrant: number) => void
}

/**
 * QuadrantOverlay - Navigation overlay showing quadrant boundaries
 * 
 * Only visible at universe/quadrant zoom levels as a navigation aid
 */
export function QuadrantOverlay({
  gridSize,
  scale,
  viewportBounds,
  onQuadrantClick
}: QuadrantOverlayProps) {
  // Only show at low zoom levels
  if (scale >= 0.05) return null

  const quadrants = useMemo(() => {
    return [1, 2, 3, 4].map(quadrant => {
      const range = getQuadrantXyRange(quadrant)
      return {
        quadrant,
        range
      }
    })
  }, [])

  // Filter visible quadrants
  const visibleQuadrants = useMemo(() => {
    if (!viewportBounds) return quadrants
    
    return quadrants.filter(({ range }) => {
      return (
        range.x_max >= viewportBounds.minX &&
        range.x_min <= viewportBounds.maxX &&
        range.y_max >= viewportBounds.minY &&
        range.y_min <= viewportBounds.maxY
      )
    })
  }, [quadrants, viewportBounds])

  return (
    <g className="quadrant-overlay">
      {visibleQuadrants.map(({ quadrant, range }) => {
        const width = range.x_max - range.x_min
        const height = range.y_max - range.y_min
        const centerX = range.x_min + width / 2
        const centerY = range.y_min + height / 2

        return (
          <g key={quadrant}>
            {/* Quadrant boundary */}
            <rect
              x={range.x_min}
              y={range.y_min}
              width={width}
              height={height}
              fill="none"
              stroke="rgba(100, 150, 255, 0.4)"
              strokeWidth="2"
              strokeDasharray="8,8"
              className="quadrant-boundary"
            />
            
            {/* Quadrant label */}
            {scale < 0.02 && (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-lg fill-blue-300 font-bold"
                onClick={() => onQuadrantClick?.(quadrant)}
                style={{ cursor: onQuadrantClick ? 'pointer' : 'default' }}
              >
                Quadrant {quadrant}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

