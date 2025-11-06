import { useMemo } from 'react'
import { SystemData } from '@/lib/galaxyUtils'
import { getPlanetXY } from '@/lib/coordinates'

interface PlanetOrbitsLayerProps {
  systems: SystemData[]
  scale: number
  initialScale: number
  viewBox: string // For viewport culling
  minZoomRatio?: number // Minimum zoom ratio to show (e.g., 3 means 3x initial scale)
  maxZoomRatio?: number // Maximum zoom ratio to show (e.g., 4.9 means 4.9x initial scale)
}

/**
 * PlanetOrbitsLayer - Renders planets as small dots with orbit lines
 * 
 * Only renders at intermediate zoom levels (between region view and system view).
 * Uses viewport culling to only render visible systems for performance.
 */
export function PlanetOrbitsLayer({
  systems,
  scale,
  initialScale,
  viewBox,
  minZoomRatio = 2.5,
  maxZoomRatio = 4.9
}: PlanetOrbitsLayerProps) {
  // Calculate current zoom ratio
  const zoomRatio = scale / initialScale
  
  // Only render at the second zoom level (between region zoom and system view)
  // Make it more lenient - start showing at 2.5x (when zoomed into region) up to just before system view
  const shouldShow = zoomRatio >= minZoomRatio && zoomRatio < maxZoomRatio
  
  // Debug logging
  if (zoomRatio >= 2 && zoomRatio < 5) {
    console.debug('[PlanetOrbitsLayer] Zoom check:', {
      zoomRatio: zoomRatio.toFixed(2),
      minZoomRatio,
      maxZoomRatio,
      shouldShow,
      scale: scale.toFixed(2),
      initialScale: initialScale.toFixed(2),
      systemsCount: systems.length
    })
  }
  
  // Parse viewBox for viewport culling - be more lenient with parsing
  const viewBoxBounds = useMemo(() => {
    if (!shouldShow) return null
    
    // Try splitting by space first
    let parts = viewBox.trim().split(/\s+/)
    if (parts.length !== 4) {
      // Try splitting by comma as fallback
      parts = viewBox.split(',')
      if (parts.length !== 4) {
        console.warn('[PlanetOrbitsLayer] Invalid viewBox format:', viewBox)
        return null
      }
    }
    
    const [x, y, width, height] = parts.map(Number)
    
    // Validate parsed values
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
      console.warn('[PlanetOrbitsLayer] Invalid viewBox values:', { x, y, width, height })
      return null
    }
    
    return {
      minX: x,
      maxX: x + width,
      minY: y,
      maxY: y + height
    }
  }, [viewBox, shouldShow])
  
  // Filter systems to only those in viewport - use more lenient culling
  // For now, simplify to always show systems in viewport or fallback to first 100 for testing
  const visibleSystems = useMemo(() => {
    if (!shouldShow) {
      return []
    }
    
    // If we have valid viewBox bounds, use viewport culling
    if (viewBoxBounds) {
      return systems.filter(system => {
        // Check if system center is in viewport (with generous padding for orbits)
        // Use a larger padding to account for orbit lines that extend beyond system center
        const padding = 500 // Extra padding to include orbit lines (planets can be 40-60 units away)
        return (
          system.center.x >= viewBoxBounds.minX - padding &&
          system.center.x <= viewBoxBounds.maxX + padding &&
          system.center.y >= viewBoxBounds.minY - padding &&
          system.center.y <= viewBoxBounds.maxY + padding
        )
      })
    }
    
    // Fallback: if viewBox parsing fails, limit to first 100 systems for performance
    // This ensures we still render something for testing
    console.warn('[PlanetOrbitsLayer] Using fallback: showing first 100 systems')
    return systems.slice(0, 100)
  }, [systems, viewBoxBounds, shouldShow])
  
  // Render planets and orbits for visible systems
  const planetElements = useMemo(() => {
    if (!shouldShow || visibleSystems.length === 0) return []
    
    const elements: Array<{
      type: 'orbit' | 'planet'
      key: string
      element: JSX.Element
    }> = []
    
    visibleSystems.forEach(system => {
      if (!system.planets || system.planets.length === 0) return
      
      system.planets.forEach(planet => {
        const planetXY = getPlanetXY(planet)
        if (!planetXY) {
          // Debug: log when we can't get planet XY
          if (visibleSystems.length <= 5) {
            console.debug('[PlanetOrbitsLayer] Could not get planet XY:', {
              planetId: planet.id,
              coordinate: planet.coordinate,
              system: `${system.region}:${system.system}`
            })
          }
          return
        }
        
        // Calculate orbit radius
        const dx = planetXY.x - system.center.x
        const dy = planetXY.y - system.center.y
        const radius = Math.sqrt(dx * dx + dy * dy)
        
        // Skip if too close to center (invalid orbit) - but allow very small orbits
        if (radius < 3) return
        
        // Orbit line - solid circle
        elements.push({
          type: 'orbit',
          key: `orbit-${system.region}-${system.system}-${planet.id}`,
          element: (
            <circle
              key={`orbit-${system.region}-${system.system}-${planet.id}`}
              cx={system.center.x}
              cy={system.center.y}
              r={radius}
              fill="none"
              stroke="rgba(100, 200, 255, 0.6)"
              strokeWidth={1}
              className="planet-orbit-line"
              style={{ pointerEvents: 'none' }}
            />
          )
        })
        
        // Planet dot - small colored circle (smaller than system markers)
        const isColonized = !!planet.owner_empire_id
        // Scale planet dot size based on zoom for better visibility
        const planetDotSize = Math.max(2, Math.min(3, 2.5 * (zoomRatio / 4)))
        elements.push({
          type: 'planet',
          key: `planet-${system.region}-${system.system}-${planet.id}`,
          element: (
            <circle
              key={`planet-${system.region}-${system.system}-${planet.id}`}
              cx={planetXY.x}
              cy={planetXY.y}
              r={planetDotSize}
              fill={isColonized ? 'rgba(34, 211, 238, 1)' : 'rgba(255, 255, 255, 0.9)'}
              stroke={isColonized ? 'rgba(34, 211, 238, 1)' : 'rgba(255, 255, 255, 0.8)'}
              strokeWidth={0.8}
              className="planet-dot"
              style={{ cursor: 'pointer' }}
            />
          )
        })
      })
    })
    
    return elements
  }, [visibleSystems, shouldShow, zoomRatio])
  
  if (!shouldShow) {
    return null
  }
  
  // Debug: log when we should be showing
  if (shouldShow) {
    console.debug('[PlanetOrbitsLayer] Render state:', {
      zoomRatio: zoomRatio.toFixed(2),
      visibleSystems: visibleSystems.length,
      totalSystems: systems.length,
      planetElements: planetElements.length,
      systemsWithPlanets: visibleSystems.filter(s => s.planets && s.planets.length > 0).length
    })
  }
  
  if (planetElements.length === 0) {
    return null
  }
  
  return (
    <g className="planet-orbits-layer">
      {planetElements.map(item => item.element)}
    </g>
  )
}

