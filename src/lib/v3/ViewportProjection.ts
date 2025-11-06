/**
 * ViewportProjection - Coordinate projection utilities for Three.js universe map
 * 
 * Handles conversion between grid coordinates (2000×1000) and Three.js screen space
 * Maintains 2:1 aspect ratio across all zoom levels
 */

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface ProjectionConfig {
  gridWidth: number
  gridHeight: number
  containerWidth: number
  containerHeight: number
  scale: number
  panX: number
  panY: number
}

/**
 * Calculate visible viewport bounds in grid coordinates
 */
export function calculateViewportBounds(config: ProjectionConfig): ViewportBounds {
  const { gridWidth, gridHeight, containerWidth, containerHeight, scale, panX, panY } = config
  
  // Calculate center point in grid coordinates
  const centerX = -panX / scale + gridWidth / 2
  const centerY = -panY / scale + gridHeight / 2
  
  // Calculate visible width/height in grid coordinates
  const visibleGridWidth = containerWidth / scale
  const visibleGridHeight = containerHeight / scale
  
  // Maintain aspect ratio
  const gridAspectRatio = gridWidth / gridHeight
  const viewAspectRatio = visibleGridWidth / visibleGridHeight
  
  let adjustedWidth = visibleGridWidth
  let adjustedHeight = visibleGridHeight
  
  if (viewAspectRatio > gridAspectRatio) {
    // Container is wider - adjust height to match grid aspect
    adjustedHeight = adjustedWidth / gridAspectRatio
  } else {
    // Container is taller - adjust width to match grid aspect
    adjustedWidth = adjustedHeight * gridAspectRatio
  }
  
  return {
    minX: centerX - adjustedWidth / 2,
    maxX: centerX + adjustedWidth / 2,
    minY: centerY - adjustedHeight / 2,
    maxY: centerY + adjustedHeight / 2
  }
}

/**
 * Convert grid coordinates (0-2000, 0-1000) to Three.js world coordinates
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  config: ProjectionConfig
): { x: number; y: number; z: number } {
  // Center grid at origin, flip Y axis (Three.js Y up, grid Y down)
  const x = gridX - config.gridWidth / 2
  const y = -(gridY - config.gridHeight / 2) // Flip Y
  const z = 0
  
  return { x, y, z }
}

/**
 * Convert Three.js world coordinates to grid coordinates
 */
export function worldToGrid(
  worldX: number,
  worldY: number,
  config: ProjectionConfig
): { x: number; y: number } {
  const x = worldX + config.gridWidth / 2
  const y = -(worldY - config.gridHeight / 2) // Flip Y
  
  return { x, y }
}

/**
 * Convert screen coordinates (mouse/touch) to grid coordinates
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  config: ProjectionConfig
): { x: number; y: number } {
  const { containerWidth, containerHeight, scale, panX, panY, gridWidth, gridHeight } = config
  
  // Mouse position relative to container center
  const relativeX = screenX - containerWidth / 2
  const relativeY = screenY - containerHeight / 2
  
  // Convert to grid coordinates
  const gridX = -panX / scale + gridWidth / 2 + relativeX / scale
  const gridY = -panY / scale + gridHeight / 2 + relativeY / scale
  
  return { x: gridX, y: gridY }
}

/**
 * Convert grid coordinates to screen coordinates
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  config: ProjectionConfig
): { x: number; y: number } {
  const { containerWidth, containerHeight, scale, panX, panY, gridWidth, gridHeight } = config
  
  const relativeX = (gridX - gridWidth / 2) * scale + panX
  const relativeY = (gridY - gridHeight / 2) * scale + panY
  
  return {
    x: containerWidth / 2 + relativeX,
    y: containerHeight / 2 + relativeY
  }
}

/**
 * Calculate orthographic camera settings to maintain aspect ratio
 */
export function calculateCameraSettings(
  containerWidth: number,
  containerHeight: number,
  gridWidth: number,
  gridHeight: number,
  scale: number
): { left: number; right: number; top: number; bottom: number; near: number; far: number } {
  const gridAspectRatio = gridWidth / gridHeight
  const viewAspectRatio = containerWidth / containerHeight
  
  let width: number
  let height: number
  
  if (viewAspectRatio > gridAspectRatio) {
    // Container is wider - use height as reference
    height = gridHeight / scale
    width = height * viewAspectRatio
  } else {
    // Container is taller - use width as reference
    width = gridWidth / scale
    height = width / viewAspectRatio
  }
  
  return {
    left: -width / 2,
    right: width / 2,
    top: height / 2,
    bottom: -height / 2,
    near: 0.1,
    far: 1000
  }
}


