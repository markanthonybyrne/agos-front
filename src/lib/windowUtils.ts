import { PanelSize } from '@/app/slices/panelSlice'

/**
 * Default window dimensions based on panel size
 */
export function getDefaultWindowDimensions(size: PanelSize): { width: number; height: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  switch (size) {
    case PanelSize.SMALL:
      return { width: 400, height: 500 }
    case PanelSize.MEDIUM:
      return { width: 600, height: 700 }
    case PanelSize.LARGE:
      return { width: 800, height: 900 }
    case PanelSize.XLARGE:
      return { width: 1000, height: 900 }
    case PanelSize.FULL_HEIGHT:
      return { 
        width: viewportWidth - 80, 
        height: viewportHeight - 80 
      }
    default:
      return { width: 600, height: 700 }
  }
}

/**
 * Get default window position (centered on screen)
 */
export function getDefaultWindowPosition(
  dimensions: { width: number; height: number },
  offset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  return {
    x: Math.max(40, (viewportWidth - dimensions.width) / 2) + offset.x,
    y: Math.max(40, (viewportHeight - dimensions.height) / 2) + offset.y,
  }
}

/**
 * Constrain window position to viewport bounds
 */
export function constrainWindowPosition(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  minMargin: number = 40
): { x: number; y: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  return {
    x: Math.max(
      minMargin,
      Math.min(position.x, viewportWidth - dimensions.width - minMargin)
    ),
    y: Math.max(
      minMargin,
      Math.min(position.y, viewportHeight - dimensions.height - minMargin)
    ),
  }
}

/**
 * Constrain window dimensions to viewport bounds
 */
export function constrainWindowDimensions(
  dimensions: { width: number; height: number },
  minWidth: number = 300,
  minHeight: number = 200,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  const maxW = maxWidth ?? viewportWidth - 80
  const maxH = maxHeight ?? viewportHeight - 80
  
  return {
    width: Math.max(minWidth, Math.min(dimensions.width, maxW)),
    height: Math.max(minHeight, Math.min(dimensions.height, maxH)),
  }
}

/**
 * Get window position from localStorage
 */
export function getWindowPositionFromStorage(panelId: string): { x: number; y: number } | null {
  try {
    const stored = localStorage.getItem(`window-position-${panelId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load window position from storage', e)
  }
  return null
}

/**
 * Save window position to localStorage
 */
export function saveWindowPositionToStorage(panelId: string, position: { x: number; y: number }): void {
  try {
    localStorage.setItem(`window-position-${panelId}`, JSON.stringify(position))
  } catch (e) {
    console.warn('Failed to save window position to storage', e)
  }
}

/**
 * Get window dimensions from localStorage
 */
export function getWindowDimensionsFromStorage(panelId: string): { width: number; height: number } | null {
  try {
    const stored = localStorage.getItem(`window-dimensions-${panelId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load window dimensions from storage', e)
  }
  return null
}

/**
 * Save window dimensions to localStorage
 */
export function saveWindowDimensionsToStorage(
  panelId: string,
  dimensions: { width: number; height: number }
): void {
  try {
    localStorage.setItem(`window-dimensions-${panelId}`, JSON.stringify(dimensions))
  } catch (e) {
    console.warn('Failed to save window dimensions to storage', e)
  }
}

