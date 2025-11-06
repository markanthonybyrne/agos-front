/**
 * PlanetLayer - Planet-level rendering (detailed planets)
 * 
 * Shows individual planets with full detail at high zoom
 */

import { useMemo, useEffect } from 'react'
import { PlanetMesh } from '../entities/PlanetMesh'
import { useViewportData } from '@/hooks/useViewportData'
import { Planet } from '@/types/api.types'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'
import { getPlanetXY } from '@/lib/coordinates'

interface PlanetLayerProps {
  planets: Planet[]
  viewportBounds: ViewportBounds
  normalizedZoom: number
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
  hoveredPlanet?: Planet | null
}

export function PlanetLayer({
  planets,
  viewportBounds,
  normalizedZoom,
  onPlanetClick,
  onPlanetHover,
  hoveredPlanet
}: PlanetLayerProps) {
  // Show at planet level (normalizedZoom >= 0.75)
  // But prevent rendering at extreme zoom to avoid crashes
  const visible = normalizedZoom >= 0.75 && normalizedZoom < 0.95
  const fadeInStart = 0.70
  const fadeInEnd = 0.80
  
  let opacity = 1
  if (normalizedZoom >= fadeInStart && normalizedZoom <= fadeInEnd) {
    const progress = (normalizedZoom - fadeInStart) / (fadeInEnd - fadeInStart)
    opacity = progress * progress * (3 - 2 * progress) // Smoothstep
  }
  
  // Convert planets to entities with x/y coordinates
  const planetEntities = useMemo(() => {
    return planets
      .map(planet => {
        const xy = getPlanetXY(planet)
        if (!xy) return null
        return {
          id: planet.id,
          x: xy.x,
          y: xy.y,
          planet
        }
      })
      .filter((item): item is { id: number; x: number; y: number; planet: Planet } => item !== null)
  }, [planets])
  
  // Filter visible planets - strict limit at high zoom
  // Reduce limit further as zoom increases
  const maxEntities = normalizedZoom > 0.85 ? 100 : 200
  const visiblePlanets = useViewportData({
    entities: planetEntities,
    viewportBounds,
    padding: 50,
    maxEntities // Reduced limit to prevent crashes
  })
  
  // Debug logging - throttled to prevent infinite loops
  useEffect(() => {
    if (visiblePlanets.length > 100) {
      console.warn('[PlanetLayer] Too many planets to render:', visiblePlanets.length, 'at zoom:', normalizedZoom)
    }
  }, [visiblePlanets.length, normalizedZoom])
  
  if (!visible || opacity <= 0) return null
  
  if (visiblePlanets.length === 0) return null
  
  return (
    <group>
      {visiblePlanets.map((item) => {
        const planet = item.planet as Planet
        return (
          <PlanetMesh
            key={planet.id}
            planet={planet}
            x={item.x}
            y={item.y}
            size={10 + normalizedZoom * 5}
            onClick={() => onPlanetClick?.(planet)}
            onHover={(hovered) => onPlanetHover?.(hovered ? planet : null)}
          />
        )
      })}
    </group>
  )
}

