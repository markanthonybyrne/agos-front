/**
 * SectorLayer - Sector-level rendering (galaxy icons)
 * 
 * Shows galaxies as icons at sector zoom level
 */

import { useMemo, useEffect } from 'react'
import { GalaxyIcon } from '../entities/GalaxyIcon'
import { useViewportData, groupPlanetsByGalaxy } from '@/hooks/useViewportData'
import { Planet } from '@/types/api.types'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'
import { getRandomGalaxyTypeForSystem } from '@/lib/galaxyImages'
import { getPlanetXY } from '@/lib/coordinates'

interface SectorLayerProps {
  planets: Planet[]
  viewportBounds: ViewportBounds
  normalizedZoom: number
  onGalaxyClick?: (quadrant: number, sector: number, galaxy: number) => void
}

export function SectorLayer({
  planets,
  viewportBounds,
  normalizedZoom,
  onGalaxyClick
}: SectorLayerProps) {
  // Only show at sector level (normalizedZoom < 0.30)
  const visible = normalizedZoom < 0.30
  const opacity = visible ? Math.max(0, 1 - normalizedZoom / 0.30) : 0
  
  // Group planets by galaxy
  const galaxiesByKey = useMemo(() => {
    return groupPlanetsByGalaxy(planets)
  }, [planets])
  
  // Calculate galaxy centers (average of planet positions)
  const galaxyCenters = useMemo(() => {
    const centers = new Map<string, { x: number; y: number; quadrant: number; sector: number; galaxy: number }>()
    
    galaxiesByKey.forEach((galaxyPlanets, key) => {
      const [q, s, g] = key.split(':').map(Number)
      const positions = galaxyPlanets
        .map(planet => getPlanetXY(planet))
        .filter((xy): xy is { x: number; y: number } => xy !== null)
      
      if (positions.length > 0) {
        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length
        centers.set(key, { x: avgX, y: avgY, quadrant: q, sector: s, galaxy: g })
      }
    })
    
    return centers
  }, [galaxiesByKey])
  
  // Filter visible galaxies
  const visibleGalaxies = useViewportData({
    entities: Array.from(galaxyCenters.entries()).map(([key, center]) => ({
      id: key,
      x: center.x,
      y: center.y,
      quadrant: center.quadrant,
      sector: center.sector,
      galaxy: center.galaxy
    })),
    viewportBounds,
    padding: 100
  })
  
  if (!visible || opacity <= 0) return null
  
  if (visibleGalaxies.length === 0) return null
  
  return (
    <group>
      {visibleGalaxies.map((galaxy) => {
        const galaxyType = getRandomGalaxyTypeForSystem(galaxy.id)
        return (
          <GalaxyIcon
            key={galaxy.id}
            x={galaxy.x}
            y={galaxy.y}
            galaxyType={galaxyType.toString()}
            size={40 + normalizedZoom * 20}
            onClick={() => onGalaxyClick?.(galaxy.quadrant, galaxy.sector, galaxy.galaxy)}
          />
        )
      })}
    </group>
  )
}

