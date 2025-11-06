/**
 * PlanetLayer - Renders individual planets at high zoom using PixiJS
 */

import * as PIXI from 'pixi.js'
import { ColorMatrixFilter } from 'pixi.js'
import { useEffect, useRef, useMemo } from 'react'
import { Planet, DiscoveryStatus } from '@/types/api.types'
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

  // Filter planets visible in viewport and by fog of war
  const visiblePlanets = useMemo(() => {
    return planets.filter(planet => {
      // Filter by fog of war visibility
      if (planet.fog_of_war && !planet.fog_of_war.is_visible) {
        return false
      }
      
      // Legacy visibility check (backward compatibility)
      if (planet.visibility && !planet.visibility.is_visible) {
        return false
      }
      
      // Filter by viewport bounds
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
  
  // Calculate opacity based on discovery status
  const getPlanetOpacity = (planet: Planet, baseOpacity: number): number => {
    if (planet.fog_of_war) {
      switch (planet.fog_of_war.discovery_status) {
        case 'visible':
          return baseOpacity
        case 'fogged':
          return baseOpacity * 0.6 // Reduced opacity for fogged planets
        case 'hidden':
          return 0 // Should be filtered out, but just in case
        default:
          return baseOpacity
      }
    }
    return baseOpacity
  }

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

      const planetOpacity = getPlanetOpacity(planet, opacity)

      if (!planetDotsRef.current.has(planet.id)) {
        // Create new planet dot
        const dotData = createPlanetDot(
          planet,
          normalizedZoom,
          onPlanetClick,
          onPlanetHover
        )
        dotData.container.alpha = planetOpacity
        
        // Apply visual styling based on discovery status
        if (planet.fog_of_war?.discovery_status === 'fogged') {
          // Apply grayscale filter for fogged planets
          const grayscaleFilter = new ColorMatrixFilter()
          grayscaleFilter.greyscale(0.5, false)
          dotData.container.filters = [grayscaleFilter]
        } else {
          dotData.container.filters = []
        }
        
        // Use grid coordinates directly
        dotData.container.x = xy.x
        dotData.container.y = xy.y

        container.addChild(dotData.container)
        planetDotsRef.current.set(planet.id, dotData)
      } else {
        // Update existing dot
        const dotData = planetDotsRef.current.get(planet.id)!
        dotData.container.alpha = planetOpacity
        
        // Update filters based on discovery status
        if (planet.fog_of_war?.discovery_status === 'fogged') {
          if (!dotData.container.filters || dotData.container.filters.length === 0) {
            const grayscaleFilter = new ColorMatrixFilter()
            grayscaleFilter.greyscale(0.5, false)
            dotData.container.filters = [grayscaleFilter]
          }
        } else {
          dotData.container.filters = []
        }
        
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

