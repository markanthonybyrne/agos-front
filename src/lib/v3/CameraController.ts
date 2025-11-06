/**
 * CameraController - Zoom/pan camera logic for Three.js universe map
 * 
 * Provides smooth zoom transitions and pan boundaries
 */

import * as THREE from 'three'

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

export interface CameraState {
  position: { x: number; y: number; z: number }
  zoom: number
}

export interface CameraBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZoom: number
  maxZoom: number
}

export interface ZoomPanOptions {
  minScale: number
  maxScale: number
  initialScale: number
  gridWidth: number
  gridHeight: number
  containerWidth: number
  containerHeight: number
}

/**
 * Calculate pan boundaries based on current zoom level
 */
export function calculatePanBounds(
  zoom: number,
  options: ZoomPanOptions
): { minX: number; maxX: number; minY: number; maxY: number } {
  const { gridWidth, gridHeight, containerWidth, containerHeight } = options
  
  // Calculate scaled grid dimensions
  const scaledGridWidth = gridWidth * zoom
  const scaledGridHeight = gridHeight * zoom
  
  // Calculate maximum pan distance
  const maxPanX = Math.max(0, (scaledGridWidth - containerWidth) / 2)
  const maxPanY = Math.max(0, (scaledGridHeight - containerHeight) / 2)
  
  // Determine zoom level for boundary calculation
  const normalizedZoom = (zoom - options.minScale) / (options.maxScale - options.minScale)
  const isSectorLevel = normalizedZoom < 0.30
  
  if (isSectorLevel) {
    // Sector level: allow panning off-canvas
    const paddingFactor = 0.2
    return {
      minX: -maxPanX - containerWidth * paddingFactor,
      maxX: maxPanX + containerWidth * paddingFactor,
      minY: -maxPanY - containerHeight * paddingFactor,
      maxY: maxPanY + containerHeight * paddingFactor
    }
  } else {
    // Higher zoom levels: restrict to grid boundaries
    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY
    }
  }
}

/**
 * Clamp camera position to boundaries
 */
export function clampCameraPosition(
  position: { x: number; y: number },
  zoom: number,
  options: ZoomPanOptions
): { x: number; y: number } {
  const bounds = calculatePanBounds(zoom, options)
  
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y))
  }
}

/**
 * Zoom to a specific point (mouse position)
 */
export function zoomToPoint(
  currentZoom: number,
  currentPan: { x: number; y: number },
  delta: number,
  pointX: number,
  pointY: number,
  options: ZoomPanOptions
): { zoom: number; panX: number; panY: number } {
  const zoomFactor = 1 + delta * 0.1
  const newZoom = Math.max(
    options.minScale,
    Math.min(options.maxScale, currentZoom * zoomFactor)
  )
  
  // Calculate zoom center relative to container
  const { containerWidth, containerHeight } = options
  const mouseX = pointX - containerWidth / 2
  const mouseY = pointY - containerHeight / 2
  
  // Adjust pan to zoom towards mouse position
  const scaleDelta = newZoom / currentZoom
  const newPanX = currentPan.x - (mouseX * (scaleDelta - 1) / currentZoom)
  const newPanY = currentPan.y - (mouseY * (scaleDelta - 1) / currentZoom)
  
  const clamped = clampCameraPosition({ x: newPanX, y: newPanY }, newZoom, options)
  
  return {
    zoom: newZoom,
    panX: clamped.x,
    panY: clamped.y
  }
}

/**
 * Update camera position and zoom
 */
export function updateCamera(
  camera: THREE.OrthographicCamera,
  panX: number,
  panY: number,
  zoom: number,
  gridWidth: number,
  gridHeight: number
): void {
  // Set camera position (pan)
  camera.position.set(
    panX,
    panY,
    100
  )
  
  // Set camera zoom (orthographic camera zoom)
  camera.zoom = zoom
  camera.updateProjectionMatrix()
}

/**
 * Smooth transition to target zoom and pan
 */
export function smoothTransition(
  start: { zoom: number; panX: number; panY: number },
  end: { zoom: number; panX: number; panY: number },
  duration: number,
  onUpdate: (state: { zoom: number; panX: number; panY: number }) => void,
  onComplete?: () => void
): () => void {
  const startTime = performance.now()
  let animationFrameId: number | null = null
  
  const animate = () => {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (ease-in-out cubic)
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
    
    const currentZoom = start.zoom + (end.zoom - start.zoom) * eased
    const currentPanX = start.panX + (end.panX - start.panX) * eased
    const currentPanY = start.panY + (end.panY - start.panY) * eased
    
    onUpdate({ zoom: currentZoom, panX: currentPanX, panY: currentPanY })
    
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      onComplete?.()
    }
  }
  
  animationFrameId = requestAnimationFrame(animate)
  
  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
  }
}

