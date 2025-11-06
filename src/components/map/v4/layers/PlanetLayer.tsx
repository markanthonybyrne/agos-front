/**
 * PlanetLayer - Renders individual planets at high zoom using PixiJS
 */

import * as PIXI from 'pixi.js'
import { useEffect, useRef, useMemo } from 'react'
import { Planet } from '@/types/api.types'
import { getLayerOpacity } from '@/lib/zoomLevels'
// Grid coordinates are used directly - container transform handles conversion
import { getPlanetXY } from '@/lib/coordinates'
import { createPlanetDot, PlanetDotData } from '../entities/PlanetDot'

interface PlanetLayerProps {
  planets: Planet[]
  container: PIXI.Container
  normalizedZoom: number
  viewportBounds: { minX: number; minY: number; maxX: number; maxY: number }
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
}

export function PlanetLayer({
  planets,
  container,
  normalizedZoom,
  viewportBounds,
  onPlanetClick,
  onPlanetHover,
}: PlanetLayerProps) {
  const opacity = useMemo(() => getLayerOpacity('planetary', normalizedZoom), [normalizedZoom])
  const planetDotsRef = useRef<Map<number, PlanetDotData>>(new Map())

  // Filter planets visible in viewport
  const visiblePlanets = useMemo(() => {
    return planets.filter(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return false
      return (
        xy.x >= viewportBounds.minX - 10 &&
        xy.x <= viewportBounds.maxX + 10 &&
        xy.y >= viewportBounds.minY - 10 &&
        xy.y <= viewportBounds.maxY + 10
      )
    })
  }, [planets, viewportBounds])

  // Render planet dots
  useEffect(() => {
    if (opacity <= 0 || normalizedZoom < 0.8) {
      // Clean up all dots
      planetDotsRef.current.forEach(({ container: dotContainer }) => {
        container.removeChild(dotContainer)
        dotContainer.destroy({ children: true })
      })
      planetDotsRef.current.clear()
      return
    }

    visiblePlanets.forEach(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return

      if (!planetDotsRef.current.has(planet.id)) {
        // Create new planet dot
        const dotData = createPlanetDot(
          planet,
          normalizedZoom,
          onPlanetClick,
          onPlanetHover
        )
        dotData.container.alpha = opacity
        // Use grid coordinates directly
        dotData.container.x = xy.x
        dotData.container.y = xy.y

        container.addChild(dotData.container)
        planetDotsRef.current.set(planet.id, dotData)
      } else {
        // Update existing dot
        const dotData = planetDotsRef.current.get(planet.id)!
        dotData.container.alpha = opacity
        // Use grid coordinates directly
        dotData.container.x = xy.x
        dotData.container.y = xy.y
      }
    })

    // Remove dots for planets no longer visible
    const visibleIds = new Set(visiblePlanets.map(p => p.id))
    planetDotsRef.current.forEach((dotData, id) => {
      if (!visibleIds.has(id)) {
        container.removeChild(dotData.container)
        dotData.container.destroy({ children: true })
        planetDotsRef.current.delete(id)
      }
    })

    return () => {
      // Cleanup on unmount
      planetDotsRef.current.forEach(({ container: dotContainer }) => {
        container.removeChild(dotContainer)
        dotContainer.destroy({ children: true })
      })
      planetDotsRef.current.clear()
    }
  }, [visiblePlanets, opacity, normalizedZoom, onPlanetClick, onPlanetHover, container])

  return null
}

