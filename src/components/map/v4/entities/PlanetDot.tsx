/**
 * PlanetDot - Renders a planet as a colored dot using PixiJS Graphics
 */

import * as PIXI from 'pixi.js'
import { createCircle } from '@/lib/v4/pixiUtils'
import { getPlanetColor } from '@/lib/v4/colorUtils'
import { Planet } from '@/types/api.types'

export interface PlanetDotData {
  container: PIXI.Container
  graphics: PIXI.Graphics
}

/**
 * Create a planet dot
 */
export function createPlanetDot(
  planet: Planet,
  normalizedZoom: number,
  onClick?: (planet: Planet) => void,
  onHover?: (planet: Planet | null) => void,
  onRightClick?: (planet: Planet, event: PIXI.FederatedPointerEvent) => void
): PlanetDotData {
  // Determine dot size based on zoom level
  const size = normalizedZoom < 0.8 ? 1 : 2

  // Get planet color
  // Note: Planet type doesn't have is_habitable - use state and type to determine
  const isHabitable = planet.state !== 'unsettled' || 
    (planet.type?.slug ? ['terran', 'temperate', 'oceanic', 'tropical', 'forest', 'jungle'].includes(planet.type.slug) : false)
  const planetColor = getPlanetColor(
    planet.state,
    isHabitable,
    planet.owner_empire_id ? 'owned' : null
  )

  const graphics = createCircle(size, planetColor, 0.9)

  // Create interactive container
  const container = new PIXI.Container()
  container.addChild(graphics)
  container.eventMode = 'static'
  container.cursor = 'pointer'

  if (onClick) {
    container.on('click', (e) => {
      // Only handle left clicks
      if (e.button === 0) {
        onClick(planet)
      }
    })
    container.on('pointerdown', (e) => {
      // Only handle left clicks
      if (e.button === 0) {
        onClick(planet)
      }
    })
  }

  if (onRightClick) {
    container.on('rightclick', (e) => {
      e.stopPropagation()
      onRightClick(planet, e)
    })
    container.on('pointerdown', (e) => {
      // Handle right mouse button
      if (e.button === 2) {
        e.stopPropagation()
        onRightClick(planet, e)
      }
    })
  }

  if (onHover) {
    container.on('pointerenter', () => onHover(planet))
    container.on('pointerleave', () => onHover(null))
  }

  return { container, graphics }
}

