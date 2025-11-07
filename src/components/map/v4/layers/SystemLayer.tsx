/**
 * SystemLayer - Renders individual systems with stars, orbits, and planets using PixiJS
 */

import * as PIXI from 'pixi.js'
import React, { useEffect, useRef, useMemo } from 'react'
import { SystemData, calculateOrbitRadius } from '@/lib/systemUtils'
import { getLayerOpacity, getOrbitLineOpacity, getOrbitLineWidth } from '@/lib/zoomLevels'
import { createCircle, createDashedCircle, createText } from '@/lib/v4/pixiUtils'
// Grid coordinates are used directly - container transform handles conversion
import { getPlanetXY } from '@/lib/coordinates'
import { createPlanetDot, PlanetDotData } from '../entities/PlanetDot'
import { Planet } from '@/types/api.types'

interface SystemLayerProps {
  systems: SystemData[]
  container: PIXI.Container
  normalizedZoom: number
  scale: number
  viewportBounds: { minX: number; minY: number; maxX: number; maxY: number }
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
}

interface SystemRenderData {
  container: PIXI.Container
  starGraphics: PIXI.Graphics[]
  orbitGraphics: Map<number, PIXI.Graphics>
  planetDots: Map<number, PlanetDotData>
  nameText?: PIXI.Text
}

export const SystemLayer = React.memo(function SystemLayer({
  systems,
  container,
  normalizedZoom,
  scale,
  viewportBounds,
  onPlanetClick,
  onPlanetHover,
}: SystemLayerProps) {
  const opacity = useMemo(() => getLayerOpacity('system', normalizedZoom), [normalizedZoom])
  const orbitOpacity = useMemo(() => getOrbitLineOpacity(normalizedZoom), [normalizedZoom])
  const orbitWidth = useMemo(() => getOrbitLineWidth(normalizedZoom), [normalizedZoom])
  const systemsRef = useRef<Map<string, SystemRenderData>>(new Map())

  // Filter systems visible in viewport
  const visibleSystems = useMemo(() => {
    return systems.filter(system => {
      const { x, y } = system.center
      return (
        x >= viewportBounds.minX - 100 &&
        x <= viewportBounds.maxX + 100 &&
        y >= viewportBounds.minY - 100 &&
        y <= viewportBounds.maxY + 100
      )
    })
  }, [systems, viewportBounds])

  // Render systems
  useEffect(() => {
    if (opacity <= 0) {
      // Clean up all systems
      systemsRef.current.forEach(({ container: sysContainer }) => {
        container.removeChild(sysContainer)
        sysContainer.destroy({ children: true })
      })
      systemsRef.current.clear()
      return
    }

    visibleSystems.forEach(system => {
      const key = system.key

      if (!systemsRef.current.has(key)) {
        // Create new system render
        const sysContainer = new PIXI.Container()
        // Use grid coordinates directly
        sysContainer.x = system.center.x
        sysContainer.y = system.center.y
        sysContainer.alpha = opacity

        // Create star (glowing circle)
        const starSize = Math.max(3, Math.min(8, scale * 5))
        
        // Create glow effect with multiple circles
        const glowOuter = createCircle(starSize * 2, '#FFD700', 0.3)
        const glowMiddle = createCircle(starSize * 1.5, '#FFD700', 0.5)
        const starGraphics = createCircle(starSize, '#FFD700', 0.9)
        
        sysContainer.addChild(glowOuter)
        sysContainer.addChild(glowMiddle)
        sysContainer.addChild(starGraphics)

        // Create orbit rings and planet dots
        const orbitGraphics = new Map<number, PIXI.Graphics>()
        const planetDots = new Map<number, PlanetDotData>()

        system.planets.forEach((planet, index) => {
          const planetXY = getPlanetXY(planet)
          if (!planetXY) return

          const orbitRadius = calculateOrbitRadius(planetXY, system.center)

          // Create orbit ring (use grid coordinates, scale will be applied by container)
          const orbitGraphic = createDashedCircle(
            orbitRadius,
            '#4A9EFF',
            orbitWidth / scale, // Adjust width for scale
            orbitOpacity,
            5,
            5
          )
          orbitGraphics.set(index, orbitGraphic)
          sysContainer.addChild(orbitGraphic)

          // Create planet dot
          const planetDot = createPlanetDot(
            planet,
            normalizedZoom,
            onPlanetClick,
            onPlanetHover
          )
          // Position relative to system center (grid coordinates)
          planetDot.container.x = planetXY.x - system.center.x
          planetDot.container.y = planetXY.y - system.center.y
          planetDots.set(index, planetDot)
          sysContainer.addChild(planetDot.container)
        })

        // Add system name label
        if (normalizedZoom >= 0.55 && system.system_name) {
          const text = createText(system.system_name, {
            fontSize: Math.max(10, Math.min(12, scale * 80)),
            fill: '#93C5FD',
            align: 'center',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
          })
          text.anchor.set(0.5, 0)
          text.y = starSize + 10
          sysContainer.addChild(text)
          
          systemsRef.current.set(key, {
            container: sysContainer,
            starGraphics: [glowOuter, glowMiddle, starGraphics],
            orbitGraphics,
            planetDots,
            nameText: text,
          })
        } else {
          systemsRef.current.set(key, {
            container: sysContainer,
            starGraphics: [glowOuter, glowMiddle, starGraphics],
            orbitGraphics,
            planetDots,
          })
        }

        container.addChild(sysContainer)
      } else {
        // Update existing system
        const sysData = systemsRef.current.get(key)!
        sysData.container.x = system.center.x
        sysData.container.y = system.center.y
        sysData.container.alpha = opacity

        // Update orbit opacities
        sysData.orbitGraphics.forEach(orbitGraphic => {
          orbitGraphic.alpha = orbitOpacity
        })

        // Update planet positions
        system.planets.forEach((planet, index) => {
          const planetXY = getPlanetXY(planet)
          if (!planetXY) return

          const planetDot = sysData.planetDots.get(index)
          if (planetDot) {
            // Position relative to system center (grid coordinates)
            planetDot.container.x = planetXY.x - system.center.x
            planetDot.container.y = planetXY.y - system.center.y
          }
        })
      }
    })

    // Remove systems no longer visible
    const visibleKeys = new Set(visibleSystems.map(s => s.key))
    systemsRef.current.forEach((sysData, key) => {
      if (!visibleKeys.has(key)) {
        container.removeChild(sysData.container)
        sysData.container.destroy({ children: true })
        systemsRef.current.delete(key)
      }
    })

    return () => {
      // Cleanup on unmount
      systemsRef.current.forEach(({ container: sysContainer }) => {
        container.removeChild(sysContainer)
        sysContainer.destroy({ children: true })
      })
      systemsRef.current.clear()
    }
  }, [visibleSystems, opacity, orbitOpacity, orbitWidth, scale, normalizedZoom, onPlanetClick, onPlanetHover, container])

  return null
})

