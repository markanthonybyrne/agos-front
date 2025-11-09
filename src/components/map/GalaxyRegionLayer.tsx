import { useMemo, memo, useCallback } from 'react'
import { RegionData } from '@/lib/galaxyUtils'
import { getRegionColor, getRegionBorderColor } from '@/lib/regionColors'
import { cn } from '@/lib/utils'
import { convexHull, hullToPath, Point } from '@/lib/spiralUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { VisibilityResponse } from '@/types/api.types'
import { isRegionVisible, getVisibleRegions } from '@/lib/visibilityUtils'

interface GalaxyRegionLayerProps {
  regions: Map<number, RegionData>
  gridWidth: number
  gridHeight: number
  onRegionClick?: (region: RegionData, event: React.MouseEvent) => void
  onRegionHover?: (region: RegionData | null) => void
  hoveredRegion?: RegionData | null
  visibilityData?: VisibilityResponse // Visibility data for fog of war filtering
}

/**
 * GalaxyRegionLayer - Renders colored territory overlays for regions
 * 
 * Prefers backend-provided geometry metadata for region footprints.
 * Falls back to convex hulls of planet positions (or rectangular bounds)
 * when geometry is unavailable for legacy datasets.
 */
function GalaxyRegionLayerComponent({ 
  regions, 
  gridWidth, 
  gridHeight,
  onRegionClick,
  onRegionHover,
  hoveredRegion,
  viewportBounds,
  visibilityData
}: GalaxyRegionLayerProps & { viewportBounds?: { minX: number; maxX: number; minY: number; maxY: number } }) {
  // Get set of visible region numbers for fast lookup
  const visibleRegionNumbers = useMemo(() => getVisibleRegions(visibilityData), [visibilityData])
  
  // Filter regions by visibility and viewport
  const visibleRegions = useMemo(() => {
    let filtered = Array.from(regions.values())
    
    // Filter by visibility
    if (visibilityData && visibleRegionNumbers.size > 0) {
      filtered = filtered.filter(region => visibleRegionNumbers.has(region.region))
    }
    
    // Filter by viewport bounds
    if (viewportBounds) {
      filtered = filtered.filter(region => {
        const { bounds } = region
        // Check if region bounds intersect viewport
        return !(
          bounds.maxX < viewportBounds.minX ||
          bounds.minX > viewportBounds.maxX ||
          bounds.maxY < viewportBounds.minY ||
          bounds.minY > viewportBounds.maxY
        )
      })
    }
    
    return filtered
  }, [regions, viewportBounds, visibleRegionNumbers, visibilityData])
  
  // Check if a region is visible (for blocking interactions)
  const isRegionVisibleForInteraction = useCallback((region: RegionData): boolean => {
    return isRegionVisible(region.region, visibilityData)
  }, [visibilityData])
  
  const regionPaths = useMemo(() => {
    return visibleRegions.map(region => {
      const isHovered = hoveredRegion?.region === region.region
      const color = getRegionColor(region.region)
      const borderColor = getRegionBorderColor(region.region)

      let centerX = region.center?.x ?? region.bounds.centerX
      let centerY = region.center?.y ?? region.bounds.centerY
      let overlayElement: JSX.Element

      if (region.geometry) {
        const { center, bounds } = region.geometry
        const radiusX = bounds
          ? Math.max((bounds.max_x - bounds.min_x) / 2, region.radius)
          : region.radius
        const radiusY = bounds
          ? Math.max((bounds.max_y - bounds.min_y) / 2, region.radius)
          : region.radius

        centerX = center.x
        centerY = center.y

        overlayElement = (
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={Math.max(radiusX, 1)}
            ry={Math.max(radiusY, 1)}
            fill={color}
            stroke={isHovered ? borderColor : 'none'}
            strokeWidth={isHovered ? 2 : 0}
            className="region-overlay"
            style={{
              opacity: isHovered ? 0.75 : 0.15,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        )
      } else {
        const planetPoints: Point[] = []
        region.systems.forEach(system => {
          system.planets.forEach(planet => {
            const xy = getPlanetXY(planet)
            if (xy) {
              planetPoints.push([xy.x, xy.y])
            }
          })
        })

        const useConvexHull = planetPoints.length >= 3

        if (useConvexHull) {
          const hull = convexHull(planetPoints)
          const pathData = hullToPath(hull)
          const sumX = hull.reduce((sum, p) => sum + p[0], 0)
          const sumY = hull.reduce((sum, p) => sum + p[1], 0)
          centerX = sumX / hull.length
          centerY = sumY / hull.length

          overlayElement = (
            <path
              d={pathData}
              fill={color}
              stroke={isHovered ? borderColor : 'none'}
              strokeWidth={isHovered ? 2 : 0}
              className="region-overlay"
              style={{
                opacity: isHovered ? 0.75 : 0.15,
                transition: 'opacity 0.2s ease-in-out'
              }}
            />
          )
        } else {
          const { minX, maxX, minY, maxY } = region.bounds
          centerX = region.bounds.centerX
          centerY = region.bounds.centerY

          overlayElement = (
            <rect
              x={minX}
              y={minY}
              width={Math.max(maxX - minX, 1)}
              height={Math.max(maxY - minY, 1)}
              fill={color}
              stroke={isHovered ? borderColor : 'none'}
              strokeWidth={isHovered ? 2 : 0}
              className="region-overlay"
              style={{
                opacity: isHovered ? 0.75 : 0.15,
                transition: 'opacity 0.2s ease-in-out'
              }}
            />
          )
        }
      }

      return (
        <g 
          key={`region-${region.region}`}
          className={cn('region-group', isHovered && 'region-hovered')}
          onClick={(e) => {
            if (!isRegionVisibleForInteraction(region)) {
              e.stopPropagation()
              return
            }
            onRegionClick?.(region, e)
          }}
          onMouseEnter={() => {
            if (isRegionVisibleForInteraction(region)) {
              onRegionHover?.(region)
            }
          }}
          onMouseLeave={() => onRegionHover?.(null)}
          style={{ 
            cursor: isRegionVisibleForInteraction(region) ? 'pointer' : 'default',
            opacity: isRegionVisibleForInteraction(region) ? 1 : 0.3,
            pointerEvents: isRegionVisibleForInteraction(region) ? 'auto' : 'none'
          }}
        >
          {overlayElement}
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
  }, [visibleRegions, hoveredRegion, onRegionClick, onRegionHover, isRegionVisibleForInteraction])
  
  return (
    <g className="galaxy-region-layer">
      {regionPaths}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const GalaxyRegionLayer = memo(GalaxyRegionLayerComponent)


