/**
 * SystemLayer - System-level rendering (orbits and planets)
 * 
 * Shows full system view with orbit lines and planet positions
 */

import { useMemo, useEffect } from 'react'
import { SystemStar } from '../entities/SystemStar'
import { OrbitRing } from '../entities/OrbitRing'
import { PlanetMesh } from '../entities/PlanetMesh'
import { useViewportData } from '@/hooks/useViewportData'
import { groupPlanetsBySystem, SystemData, convertSystemGroupsToData } from '@/lib/systemUtils'
import { Planet } from '@/types/api.types'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'
import { getPlanetXY } from '@/lib/coordinates'

interface SystemLayerProps {
  planets: Planet[]
  viewportBounds: ViewportBounds
  normalizedZoom: number
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
  hoveredPlanet?: Planet | null
}

export function SystemLayer({
  planets,
  viewportBounds,
  normalizedZoom,
  onPlanetClick,
  onPlanetHover,
  hoveredPlanet
}: SystemLayerProps) {
  // Show at system level (normalizedZoom 0.50-0.80)
  const visible = normalizedZoom >= 0.50 && normalizedZoom < 0.80
  const fadeInStart = 0.45
  const fadeInEnd = 0.55
  const fadeOutStart = 0.73
  const fadeOutEnd = 0.80
  
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
  
  // Orbit line opacity (fades in at 0.50, fully visible at 0.55+)
  const orbitOpacity = normalizedZoom >= 0.55 ? opacity : Math.max(0, (normalizedZoom - 0.50) / 0.05 * opacity)
  
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
    padding: 100
  })
  
  if (!visible || opacity <= 0) return null
  
  if (visibleSystems.length === 0) return null
  
  // Limit systems rendered to prevent crashes
  // Reduce limit at higher zoom levels
  const maxSystemsToRender = normalizedZoom > 0.70 ? 30 : 50
  const systemsToRender = visibleSystems.slice(0, maxSystemsToRender)
  
  // Limit planets per system - reduce at high zoom
  const maxPlanetsPerSystem = normalizedZoom > 0.70 ? 10 : 15
  
  return (
    <group>
      {systemsToRender.map((item) => {
        const system = item.system as SystemData
        
        return (
          <group key={system.key}>
            {/* System star */}
            <SystemStar
              x={system.center.x}
              y={system.center.y}
              size={8 + normalizedZoom * 4}
              color="#ffffaa"
              intensity={opacity}
            />
            
            {/* Orbit rings - limit to prevent performance issues */}
            {system.planets.slice(0, maxPlanetsPerSystem).map((planet, index) => {
              const planetXY = getPlanetXY(planet)
              if (!planetXY) return null
              
              const dx = planetXY.x - system.center.x
              const dy = planetXY.y - system.center.y
              const radius = Math.sqrt(dx * dx + dy * dy)
              
              if (radius < 5) return null // Skip if too close to center
              
              return (
                <OrbitRing
                  key={`${system.key}-orbit-${planet.id}`}
                  centerX={system.center.x}
                  centerY={system.center.y}
                  radius={radius}
                  opacity={orbitOpacity * 0.5}
                  color="#4a9eff"
                />
              )
            })}
            
            {/* Planets - limit to prevent performance issues */}
            {system.planets.slice(0, maxPlanetsPerSystem).map((planet) => {
              const planetXY = getPlanetXY(planet)
              if (!planetXY) return null
              
              return (
                <PlanetMesh
                  key={planet.id}
                  planet={planet}
                  x={planetXY.x}
                  y={planetXY.y}
                  size={6 + normalizedZoom * 2}
                  onClick={() => onPlanetClick?.(planet)}
                  onHover={(hovered) => onPlanetHover?.(hovered ? planet : null)}
                />
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

