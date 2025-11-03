import { useMemo } from 'react'
import { getSectorXyRange } from '@/lib/coordinateUtils'

interface SectorOverlayProps {
  gridSize: number
  scale: number
  viewportBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  onSectorClick?: (quadrant: number, sector: number) => void
}

/**
 * SectorOverlay - Navigation overlay showing sector boundaries
 * 
 * Only visible at quadrant/sector zoom levels as a navigation aid
 */
export function SectorOverlay({
  gridSize,
  scale,
  viewportBounds,
  onSectorClick
}: SectorOverlayProps) {
  // Only show at quadrant/sector zoom levels
  if (scale < 0.01 || scale >= 0.1) return null

  const sectors = useMemo(() => {
    const sectorsList: Array<{ quadrant: number; sector: number; range: ReturnType<typeof getSectorXyRange> }> = []
    
    for (let q = 1; q <= 4; q++) {
      for (let s = 1; s <= 4; s++) {
        sectorsList.push({
          quadrant: q,
          sector: s,
          range: getSectorXyRange(q, s)
        })
      }
    }
    
    return sectorsList
  }, [])

  // Filter visible sectors
  const visibleSectors = useMemo(() => {
    if (!viewportBounds) return sectors
    
    return sectors.filter(({ range }) => {
      return (
        range.x_max >= viewportBounds.minX &&
        range.x_min <= viewportBounds.maxX &&
        range.y_max >= viewportBounds.minY &&
        range.y_min <= viewportBounds.maxY
      )
    })
  }, [sectors, viewportBounds])

  return (
    <g className="sector-overlay">
      {visibleSectors.map(({ quadrant, sector, range }) => {
        const width = range.x_max - range.x_min
        const height = range.y_max - range.y_min
        const centerX = range.x_min + width / 2
        const centerY = range.y_min + height / 2

        return (
          <g key={`${quadrant}-${sector}`}>
            {/* Sector boundary */}
            <rect
              x={range.x_min}
              y={range.y_min}
              width={width}
              height={height}
              fill="none"
              stroke="rgba(150, 200, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="4,4"
              className="sector-boundary"
            />
            
            {/* Sector label */}
            {scale < 0.05 && (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm fill-blue-200 font-mono"
                onClick={() => onSectorClick?.(quadrant, sector)}
                style={{ cursor: onSectorClick ? 'pointer' : 'default' }}
              >
                {quadrant}:{sector}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

