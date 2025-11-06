import { useMemo, memo } from 'react'
import { RegionData } from '@/lib/galaxyUtils'
import { getRegionColor, getRegionBorderColor } from '@/lib/regionColors'
import { cn } from '@/lib/utils'
import { convexHull, hullToPath, Point } from '@/lib/spiralUtils'
import { getPlanetXY } from '@/lib/coordinates'

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
 * Displays semi-transparent colored regions using convex hull boundaries
 * based on actual planet positions, following the spiral galaxy layout.
 * Falls back to rectangular bounds if insufficient planets for hull calculation.
 */
function GalaxyRegionLayerComponent({ 
  regions, 
  gridWidth, 
  gridHeight,
  onRegionClick,
  onRegionHover,
  hoveredRegion,
  viewportBounds
}: GalaxyRegionLayerProps & { viewportBounds?: { minX: number; maxX: number; minY: number; maxY: number } }) {
  // Viewport culling - only render regions that intersect viewport
  const visibleRegions = useMemo(() => {
    if (!viewportBounds) return Array.from(regions.values())
    
    return Array.from(regions.values()).filter(region => {
      const { bounds } = region
      // Check if region bounds intersect viewport
      return !(
        bounds.maxX < viewportBounds.minX ||
        bounds.minX > viewportBounds.maxX ||
        bounds.maxY < viewportBounds.minY ||
        bounds.minY > viewportBounds.maxY
      )
    })
  }, [regions, viewportBounds])
  
  const regionPaths = useMemo(() => {
    return visibleRegions.map(region => {
      const { bounds } = region
      const isHovered = hoveredRegion?.region === region.region
      const color = getRegionColor(region.region)
      const borderColor = getRegionBorderColor(region.region)
      
      // Collect all planet positions from all systems in this region
      const planetPoints: Point[] = []
      region.systems.forEach(system => {
        system.planets.forEach(planet => {
          const xy = getPlanetXY(planet)
          if (xy) {
            planetPoints.push([xy.x, xy.y])
          }
        })
      })
      
      // Calculate convex hull if we have enough points, otherwise use rectangular bounds
      const useConvexHull = planetPoints.length >= 3
      let pathData: string
      let centerX: number
      let centerY: number
      
      if (useConvexHull) {
        const hull = convexHull(planetPoints)
        pathData = hullToPath(hull)
        // Calculate center from hull points
        const sumX = hull.reduce((sum, p) => sum + p[0], 0)
        const sumY = hull.reduce((sum, p) => sum + p[1], 0)
        centerX = sumX / hull.length
        centerY = sumY / hull.length
      } else {
        // Fallback to rectangular bounds
        pathData = `M ${bounds.minX} ${bounds.minY} L ${bounds.maxX} ${bounds.minY} L ${bounds.maxX} ${bounds.maxY} L ${bounds.minX} ${bounds.maxY} Z`
        centerX = bounds.centerX
        centerY = bounds.centerY
      }
      
      return (
        <g 
          key={`region-${region.region}`}
          className={cn('region-group', isHovered && 'region-hovered')}
          onClick={(e) => onRegionClick?.(region, e)}
          onMouseEnter={() => onRegionHover?.(region)}
          onMouseLeave={() => onRegionHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Region fill - very subtle colored overlay (no borders) */}
          <path
            d={pathData}
            fill={color}
            className="region-overlay"
            style={{
              opacity: isHovered ? 0.25 : 0.15,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
          {/* Region name label */}
          {region.name && (
            <text
              x={centerX}
              y={centerY}
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
  }, [visibleRegions, hoveredRegion, onRegionClick, onRegionHover])
  
  return (
    <g className="galaxy-region-layer">
      {regionPaths}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const GalaxyRegionLayer = memo(GalaxyRegionLayerComponent)


