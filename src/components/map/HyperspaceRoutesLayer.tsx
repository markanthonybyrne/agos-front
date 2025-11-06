import { useMemo } from 'react'
import { SystemData, calculateSystemDistance } from '@/lib/galaxyUtils'
import { getRegionSystemColor } from '@/lib/regionColors'

interface HyperspaceRoutesLayerProps {
  systems: SystemData[]
  maxConnectionDistance?: number
}

/**
 * HyperspaceRoutesLayer - Renders colored lines connecting systems
 * 
 * Connects systems within the same region that are within a certain distance
 * of each other, representing hyperspace routes or trade lanes.
 * Lines are colored to match the region color of the connected systems.
 */
export function HyperspaceRoutesLayer({ 
  systems, 
  maxConnectionDistance = 75 
}: HyperspaceRoutesLayerProps) {
  const routes = useMemo(() => {
    const connections: Array<{ 
      x1: number
      y1: number
      x2: number
      y2: number
      region: number
      color: string
    }> = []
    
    // For each system, find nearby systems in the same region to connect
    for (let i = 0; i < systems.length; i++) {
      const system1 = systems[i]
      
      for (let j = i + 1; j < systems.length; j++) {
        const system2 = systems[j]
        
        // Only connect systems in the same region
        if (system1.region !== system2.region) continue
        
        // Calculate distance between systems
        const distance = calculateSystemDistance(system1, system2)
        
        // Only connect if within threshold distance
        if (distance <= maxConnectionDistance) {
          // Use region color for the connection
          const regionColor = getRegionSystemColor(system1.region)
          connections.push({
            x1: system1.center.x,
            y1: system1.center.y,
            x2: system2.center.x,
            y2: system2.center.y,
            region: system1.region,
            color: regionColor
          })
        }
      }
    }
    
    return connections
  }, [systems, maxConnectionDistance])
  
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


