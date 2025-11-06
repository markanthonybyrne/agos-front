import { useMemo, memo } from 'react'
import { SystemData, calculateSystemDistance } from '@/lib/galaxyUtils'
import { getRegionSystemColor } from '@/lib/regionColors'

interface HyperspaceRoutesLayerProps {
  systems: SystemData[]
  maxConnectionDistance?: number
  showRoutes?: boolean // Only show routes when zoomed into a region
}

/**
 * HyperspaceRoutesLayer - Renders colored lines connecting systems
 * 
 * Connects systems within the same region that are within a certain distance
 * of each other, representing hyperspace routes or trade lanes.
 * Lines are colored to match the region color of the connected systems.
 */
function HyperspaceRoutesLayerComponent({ 
  systems, 
  maxConnectionDistance = 75,
  showRoutes = false,
  viewportBounds
}: HyperspaceRoutesLayerProps & { viewportBounds?: { minX: number; maxX: number; minY: number; maxY: number } }) {
  // Don't render routes if not zoomed into a region
  if (!showRoutes) {
    return null
  }
  
  const routes = useMemo(() => {
    // Optimize: Group systems by region first to reduce comparisons
    const systemsByRegion = new Map<number, SystemData[]>()
    systems.forEach(system => {
      if (!systemsByRegion.has(system.region)) {
        systemsByRegion.set(system.region, [])
      }
      systemsByRegion.get(system.region)!.push(system)
    })
    
    const connections: Array<{ 
      x1: number
      y1: number
      x2: number
      y2: number
      region: number
      color: string
    }> = []
    
    // Only process systems in viewport (with padding)
    const padding = maxConnectionDistance * 2
    const visibleSystems = viewportBounds 
      ? systems.filter(s => {
          const { x, y } = s.center
          return (
            x >= viewportBounds.minX - padding &&
            x <= viewportBounds.maxX + padding &&
            y >= viewportBounds.minY - padding &&
            y <= viewportBounds.maxY + padding
          )
        })
      : systems
    
    // Process each region separately - reduces O(n²) to O(n²/k) where k is number of regions
    systemsByRegion.forEach((regionSystems, region) => {
      // Filter to visible systems in this region
      const visibleInRegion = visibleSystems.filter(s => s.region === region)
      
      // For each system, find nearby systems in the same region to connect
      for (let i = 0; i < visibleInRegion.length; i++) {
        const system1 = visibleInRegion[i]
        
        // Only check systems ahead to avoid duplicate connections
        for (let j = i + 1; j < visibleInRegion.length; j++) {
          const system2 = visibleInRegion[j]
          
          // Quick distance check using squared distance (avoid sqrt)
          const dx = system1.center.x - system2.center.x
          const dy = system1.center.y - system2.center.y
          const distanceSquared = dx * dx + dy * dy
          const maxDistanceSquared = maxConnectionDistance * maxConnectionDistance
          
          // Only connect if within threshold distance
          if (distanceSquared <= maxDistanceSquared) {
            // Use region color for the connection
            const regionColor = getRegionSystemColor(region)
            connections.push({
              x1: system1.center.x,
              y1: system1.center.y,
              x2: system2.center.x,
              y2: system2.center.y,
              region: region,
              color: regionColor
            })
          }
        }
      }
    })
    
    return connections
  }, [systems, maxConnectionDistance, viewportBounds])
  
  return (
    <g className="hyperspace-routes-layer">
      {routes.map((route, index) => {
        // Extract RGB for opacity adjustment
        const rgbMatch = route.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        const lineColor = rgbMatch 
          ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.7)`
          : route.color
        
        return (
          <line
            key={`route-${route.region}-${index}`}
            x1={route.x1}
            y1={route.y1}
            x2={route.x2}
            y2={route.y2}
            stroke={lineColor}
            strokeWidth={1.5}
            opacity={0.7}
            className="hyperspace-route"
            style={{
              filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))'
            }}
          />
        )
      })}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const HyperspaceRoutesLayer = memo(HyperspaceRoutesLayerComponent)


