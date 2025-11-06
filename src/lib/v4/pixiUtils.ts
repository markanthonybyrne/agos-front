/**
 * PixiJS utility functions for universe map rendering
 */

import * as PIXI from 'pixi.js'

/**
 * Create a circle Graphics object
 * @param radius - Circle radius
 * @param color - Color (hex string or number)
 * @param alpha - Alpha value (0-1)
 * @returns PIXI.Graphics object
 */
export function createCircle(
  radius: number,
  color: string | number,
  alpha: number = 1
): PIXI.Graphics {
  const graphics = new PIXI.Graphics()
  const colorNum = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color
  graphics.circle(0, 0, radius)
  graphics.fill({ color: colorNum, alpha })
  return graphics
}

/**
 * Create a line Graphics object
 * @param points - Array of points [{x, y}, ...]
 * @param color - Color (hex string or number)
 * @param width - Line width
 * @param alpha - Alpha value (0-1)
 * @param dashed - Whether to use dashed pattern
 * @returns PIXI.Graphics object
 */
export function createLine(
  points: Array<{ x: number; y: number }>,
  color: string | number,
  width: number = 1,
  alpha: number = 1,
  dashed: boolean = false
): PIXI.Graphics {
  const graphics = new PIXI.Graphics()
  const colorNum = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color
  
  if (dashed) {
    // PixiJS doesn't have native dashed lines, so we'll create a dashed effect
    // by drawing small segments
    const dashLength = 5
    const gapLength = 5
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const segments = Math.floor(dist / (dashLength + gapLength))
      
      for (let j = 0; j < segments; j++) {
        const t1 = (j * (dashLength + gapLength)) / dist
        const t2 = ((j * (dashLength + gapLength) + dashLength) / dist)
        const x1 = p1.x + dx * t1
        const y1 = p1.y + dy * t1
        const x2 = p1.x + dx * Math.min(t2, 1)
        const y2 = p1.y + dy * Math.min(t2, 1)
        
        graphics.moveTo(x1, y1)
        graphics.lineTo(x2, y2)
      }
    }
  } else {
    graphics.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y)
    }
  }
  
  graphics.stroke({ color: colorNum, width, alpha })
  return graphics
}

/**
 * Create a dashed circle Graphics object
 * @param radius - Circle radius
 * @param color - Color (hex string or number)
 * @param width - Line width
 * @param alpha - Alpha value (0-1)
 * @param dashLength - Length of each dash
 * @param gapLength - Length of each gap
 * @returns PIXI.Graphics object
 */
export function createDashedCircle(
  radius: number,
  color: string | number,
  width: number = 1,
  alpha: number = 1,
  dashLength: number = 5,
  gapLength: number = 5
): PIXI.Graphics {
  const graphics = new PIXI.Graphics()
  const colorNum = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color
  
  const segments = Math.floor((2 * Math.PI * radius) / (dashLength + gapLength))
  const angleStep = (2 * Math.PI) / segments
  
  for (let i = 0; i < segments; i++) {
    const angle1 = i * angleStep
    const angle2 = angle1 + (angleStep * dashLength) / (dashLength + gapLength)
    
    const x1 = Math.cos(angle1) * radius
    const y1 = Math.sin(angle1) * radius
    const x2 = Math.cos(angle2) * radius
    const y2 = Math.sin(angle2) * radius
    
    graphics.moveTo(x1, y1)
    graphics.lineTo(x2, y2)
  }
  
  graphics.stroke({ color: colorNum, width, alpha })
  return graphics
}

/**
 * Create a Text object with styling
 * @param text - Text content
 * @param style - Text style options
 * @returns PIXI.Text object
 */
export function createText(
  text: string,
  style: {
    fontSize?: number
    fill?: string | number
    align?: 'left' | 'center' | 'right'
    fontWeight?: string
    fontFamily?: string
    dropShadow?: boolean
    dropShadowColor?: string | number
    dropShadowDistance?: number
  } = {}
): PIXI.Text {
  const defaultStyle = {
    fontSize: 12,
    fill: '#FFFFFF',
    align: 'center' as const,
    fontWeight: 'normal' as const,
    fontFamily: 'monospace',
    ...style,
  }
  
  const fillColor = typeof defaultStyle.fill === 'string'
    ? parseInt(defaultStyle.fill.replace('#', ''), 16)
    : defaultStyle.fill
  
  const dropShadowColor = defaultStyle.dropShadowColor
    ? (typeof defaultStyle.dropShadowColor === 'string'
        ? parseInt(defaultStyle.dropShadowColor.replace('#', ''), 16)
        : defaultStyle.dropShadowColor)
    : 0x000000
  
  const textStyleOptions: Partial<PIXI.TextStyle> = {
    fontSize: defaultStyle.fontSize,
    fill: fillColor,
    align: defaultStyle.align,
    fontWeight: defaultStyle.fontWeight as PIXI.TextStyleFontWeight,
    fontFamily: defaultStyle.fontFamily,
  }
  
  if (defaultStyle.dropShadow) {
    // PixiJS v8 uses dropShadow as an object
    textStyleOptions.dropShadow = {
      color: dropShadowColor,
      distance: defaultStyle.dropShadowDistance || 2,
      angle: Math.PI / 4,
      alpha: 1,
      blur: 2,
    }
  }
  
  const textStyle = new PIXI.TextStyle(textStyleOptions)
  
  return new PIXI.Text({ text, style: textStyle })
}

// Coordinate conversion is handled by container transform in UnifiedUniverseMapV4
// Grid coordinates are used directly, and the container applies scale/pan transforms

/**
 * Simple object pool for Graphics objects
 */
class GraphicsPool {
  private pool: PIXI.Graphics[] = []
  
  acquire(): PIXI.Graphics {
    return this.pool.pop() || new PIXI.Graphics()
  }
  
  release(graphics: PIXI.Graphics): void {
    graphics.clear()
    this.pool.push(graphics)
  }
  
  clear(): void {
    this.pool.forEach(g => g.destroy())
    this.pool = []
  }
}

export const graphicsPool = new GraphicsPool()

