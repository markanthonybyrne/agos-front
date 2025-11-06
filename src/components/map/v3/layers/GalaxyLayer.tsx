/**
 * GalaxyLayer - Galaxy-level rendering (systems with stars)
 * 
 * Shows systems as stars at galaxy zoom level
 */

import { useMemo, useEffect } from 'react'
import { SystemStar } from '../entities/SystemStar'
import { useViewportData } from '@/hooks/useViewportData'
import { groupPlanetsBySystem, SystemData, convertSystemGroupsToData } from '@/lib/systemUtils'
import { Planet } from '@/types/api.types'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'

interface GalaxyLayerProps {
  planets: Planet[]
  viewportBounds: ViewportBounds
  normalizedZoom: number
  onSystemClick?: (system: SystemData) => void
}

export function GalaxyLayer({
  planets,
  viewportBounds,
  normalizedZoom,
  onSystemClick
}: GalaxyLayerProps) {
  // Show at galaxy level (normalizedZoom 0.25-0.55)
  const visible = normalizedZoom >= 0.25 && normalizedZoom < 0.55
  const fadeInStart = 0.25
  const fadeInEnd = 0.30
  const fadeOutStart = 0.47
  const fadeOutEnd = 0.55
  
  let opacity = 0
  if (normalizedZoom >= fadeInStart && normalizedZoom <= fadeInEnd) {
    const progress = (normalizedZoom - fadeInStart) / (fadeInEnd - fadeInStart)
    opacity = progress * progress * (3 - 2 * progress) // Smoothstep
  } else if (normalizedZoom > fadeInEnd && normalizedZoom < fadeOutStart) {
    opacity = 1
  } else if (normalizedZoom >= fadeOutStart && normalizedZoom <= fadeOutEnd) {
    const progress = (normalizedZoom - fadeOutStart) / (fadeOutEnd - fadeOutStart)
    opacity = 1 - (progress * progress * (3 - 2 * progress)) // Smoothstep
  }
  
  // Group planets by system
  const systems = useMemo(() => {
    const systemGroups = groupPlanetsBySystem(planets)
    return convertSystemGroupsToData(systemGroups)
  }, [planets])
  
  // Filter visible systems
  const visibleSystems = useViewportData({
    entities: systems.map(system => ({
      id: system.key,
      x: system.center.x,
      y: system.center.y,
      system
    })),
    viewportBounds,
    padding: 50
  })
  
  if (!visible || opacity <= 0) return null
  
  if (visibleSystems.length === 0) return null
  
  return (
    <group>
      {visibleSystems.map((item) => {
        const system = item.system as SystemData
        return (
          <SystemStar
            key={system.key}
            x={system.center.x}
            y={system.center.y}
            size={6 + normalizedZoom * 4}
            color="#ffffaa"
            intensity={opacity}
          />
        )
      })}
    </group>
  )
}

