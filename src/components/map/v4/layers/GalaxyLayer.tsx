/**
 * GalaxyLayer - Renders galaxies as clusters of system dots using PixiJS
 */

import * as PIXI from 'pixi.js'
import React, { useEffect, useRef, useMemo } from 'react'
import { SystemData } from '@/lib/systemUtils'
import { getLayerOpacity } from '@/lib/zoomLevels'
import { createSystemDot, SystemDotData } from '../entities/SystemDot'
import { createText } from '@/lib/v4/pixiUtils'
// Grid coordinates are used directly - container transform handles conversion

interface GalaxyLayerProps {
  systems: SystemData[]
  container: PIXI.Container
  normalizedZoom: number
  scale: number
  viewportBounds: { minX: number; minY: number; maxX: number; maxY: number }
  onSystemClick?: (system: SystemData) => void
}

export const GalaxyLayer = React.memo(function GalaxyLayer({
  systems,
  container,
  normalizedZoom,
  scale,
  viewportBounds,
  onSystemClick,
}: GalaxyLayerProps) {
  const opacity = useMemo(() => getLayerOpacity('galaxy', normalizedZoom), [normalizedZoom])
  const systemDotsRef = useRef<Map<string, SystemDotData & { text?: PIXI.Text }>>(new Map())

  // Filter systems visible in viewport
  const visibleSystems = useMemo(() => {
    return systems.filter(system => {
      const { x, y } = system.center
      return (
        x >= viewportBounds.minX - 50 &&
        x <= viewportBounds.maxX + 50 &&
        y >= viewportBounds.minY - 50 &&
        y <= viewportBounds.maxY + 50
      )
    })
  }, [systems, viewportBounds])

  // Render system dots
  useEffect(() => {
    if (opacity <= 0) {
      // Clean up all dots
      systemDotsRef.current.forEach(({ container: dotContainer }) => {
        container.removeChild(dotContainer)
        dotContainer.destroy({ children: true })
      })
      systemDotsRef.current.clear()
      return
    }

    // Create or update system dots
    visibleSystems.forEach(system => {
      const key = system.key
      
      if (!systemDotsRef.current.has(key)) {
        // Create new system dot
        const dotData = createSystemDot(system, normalizedZoom, onSystemClick)
        dotData.container.alpha = opacity
        // Use grid coordinates directly - container transform handles conversion
        dotData.container.x = system.center.x
        dotData.container.y = system.center.y
        
        // Add galaxy name label if visible
        if (normalizedZoom >= 0.09 && system.galaxy_name) {
          const text = createText(system.galaxy_name, {
            fontSize: Math.max(10, Math.min(14, scale * 120)),
            fill: '#7DD3FC',
            align: 'center',
            fontWeight: 'semibold',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowDistance: 2,
          })
          text.anchor.set(0.5, 0)
          text.y = 15
          dotData.container.addChild(text)
          dotData.text = text
        }

        container.addChild(dotData.container)
        systemDotsRef.current.set(key, dotData)
      } else {
        // Update existing dot
        const dotData = systemDotsRef.current.get(key)!
        dotData.container.alpha = opacity
        // Use grid coordinates directly
        dotData.container.x = system.center.x
        dotData.container.y = system.center.y
        
        // Update text position if exists
        if (dotData.text) {
          dotData.text.style.fontSize = Math.max(10, Math.min(14, scale * 120))
        }
      }
    })

    // Remove dots for systems no longer visible
    const visibleKeys = new Set(visibleSystems.map(s => s.key))
    systemDotsRef.current.forEach((dotData, key) => {
      if (!visibleKeys.has(key)) {
        container.removeChild(dotData.container)
        dotData.container.destroy({ children: true })
        systemDotsRef.current.delete(key)
      }
    })

    return () => {
      // Cleanup on unmount
      systemDotsRef.current.forEach(({ container: dotContainer }) => {
        container.removeChild(dotContainer)
        dotContainer.destroy({ children: true })
      })
      systemDotsRef.current.clear()
    }
  }, [visibleSystems, opacity, scale, normalizedZoom, onSystemClick, container])

  return null
})
