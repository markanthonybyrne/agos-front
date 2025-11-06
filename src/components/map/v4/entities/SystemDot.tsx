/**
 * SystemDot - Renders a system as a colored dot using PixiJS Graphics
 */

import * as PIXI from 'pixi.js'
import { createCircle } from '@/lib/v4/pixiUtils'
import { getSystemStateColor } from '@/lib/v4/colorUtils'
import { SystemData } from '@/lib/systemUtils'

export interface SystemDotData {
  container: PIXI.Container
  graphics: PIXI.Graphics
  text?: PIXI.Text
}

/**
 * Create a system dot
 */
export function createSystemDot(
  system: SystemData,
  normalizedZoom: number,
  onClick?: (system: SystemData) => void
): SystemDotData {
  // Determine dot size based on zoom level and number of planets
  const baseSize = normalizedZoom < 0.3 ? 2 : normalizedZoom < 0.55 ? 3 : 4
  const planetCount = system.planets.length
  const size = baseSize + Math.min(planetCount / 3, 2) // Max additional 2px

  // Determine color based on system state
  // Note: Planet type doesn't have is_habitable - check state and type
  const hasHabitable = system.planets.some(p => 
    p.state !== 'unsettled' || 
    (p.type?.slug && ['terran', 'temperate', 'oceanic', 'tropical', 'forest', 'jungle'].includes(p.type.slug))
  )
  const hasColonized = system.planets.some(p => p.owner_empire_id !== undefined)
  const stateColor = hasColonized
    ? getSystemStateColor('colonized')
    : hasHabitable
    ? getSystemStateColor('habitable')
    : getSystemStateColor('unsettled')

  const graphics = createCircle(size, stateColor, 0.9)

  // Create interactive container
  const container = new PIXI.Container()
  container.addChild(graphics)
  container.eventMode = 'static'
  container.cursor = 'pointer'
  
  if (onClick) {
    container.on('click', () => onClick(system))
    container.on('pointerdown', () => onClick(system))
  }

  return { container, graphics }
}

