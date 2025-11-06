import { useMemo } from 'react'
import { RegionData } from '@/lib/galaxyUtils'
import { getRegionColor, getRegionBorderColor } from '@/lib/regionColors'
import { cn } from '@/lib/utils'

interface GalaxyRegionLayerProps {
  regions: Map<number, RegionData>
  gridWidth: number
  gridHeight: number
  onRegionClick?: (region: RegionData, event: React.MouseEvent) => void
  onRegionHover?: (region: RegionData | null) => void
  hoveredRegion?: RegionData | null
}

/**
 * GalaxyRegionLayer - Renders colored territory overlays for regions
 * 
 * Displays semi-transparent colored regions matching the reference image style.
 */
export function GalaxyRegionLayer({ 
  regions, 
  gridWidth, 
  gridHeight,
  onRegionClick,
  onRegionHover,
  hoveredRegion
}: GalaxyRegionLayerProps) {
  const regionPaths = useMemo(() => {
    return Array.from(regions.values()).map(region => {
      const { bounds } = region
      const isHovered = hoveredRegion?.region === region.region
      const color = getRegionColor(region.region)
      const borderColor = getRegionBorderColor(region.region)
      
      return (
        <g 
          key={`region-${region.region}`}
          className={cn('region-group', isHovered && 'region-hovered')}
          onClick={(e) => onRegionClick?.(region, e)}
          onMouseEnter={() => onRegionHover?.(region)}
          onMouseLeave={() => onRegionHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Region fill - semi-transparent colored overlay */}
          <rect
            x={bounds.minX}
            y={bounds.minY}
            width={bounds.maxX - bounds.minX}
            height={bounds.maxY - bounds.minY}
            fill={color}
            className="region-overlay"
            style={{
              opacity: isHovered ? 0.5 : 0.3,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
          {/* Region border */}
          <rect
            x={bounds.minX}
            y={bounds.minY}
            width={bounds.maxX - bounds.minX}
            height={bounds.maxY - bounds.minY}
            fill="none"
            stroke={borderColor}
            strokeWidth={isHovered ? 2.5 : 1.5}
            className="region-border"
            style={{
              opacity: isHovered ? 0.9 : 0.6,
              transition: 'all 0.2s ease-in-out'
            }}
          />
          {/* Region name label */}
          {region.name && (
            <text
              x={bounds.centerX}
              y={bounds.centerY}
              textAnchor="middle"
              className="fill-white font-semibold pointer-events-none"
              style={{
                fontSize: isHovered ? '16px' : '14px',
                textShadow: '0 0 6px rgba(0, 0, 0, 1), 0 0 3px rgba(0, 0, 0, 0.8)',
                pointerEvents: 'none',
                transition: 'font-size 0.2s ease-in-out'
              }}
            >
              {region.name}
            </text>
          )}
        </g>
      )
    })
  }, [regions, hoveredRegion, onRegionClick, onRegionHover])
  
  return (
    <g className="galaxy-region-layer">
      {regionPaths}
    </g>
  )
}


