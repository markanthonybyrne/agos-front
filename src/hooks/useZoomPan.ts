import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface ZoomPanState {
  scale: number
  panX: number
  panY: number
}

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface UseZoomPanOptions {
  /**
   * Minimum zoom scale (0.1 = 10% zoomed out)
   */
  minScale?: number
  /**
   * Maximum zoom scale (2.0 = 200% zoomed in)
   */
  maxScale?: number
  /**
   * Initial zoom scale
   */
  initialScale?: number
  /**
   * Grid dimensions (universe is 1000×1000)
   */
  gridWidth?: number
  gridHeight?: number
  /**
   * Container dimensions (will be calculated from ref if not provided)
   */
  containerWidth?: number
  containerHeight?: number
  /**
   * Enable zoom on mouse wheel
   */
  enableWheelZoom?: boolean
  /**
   * Zoom sensitivity (default: 0.1)
   */
  zoomSensitivity?: number
  /**
   * Reset zoom/pan when dependencies change
   */
  resetDeps?: React.DependencyList
}

/**
 * Hook for handling zoom and pan functionality on a 1000×1000 grid
 * Combines zoom (scale) and pan (translation) with viewport calculations
 */
export function useZoomPan(options: UseZoomPanOptions = {}) {
  const {
    minScale = 0.1,
    maxScale = 2.0,
    initialScale = 0.5,
    gridWidth = 1000,
    gridHeight = 1000,
    containerWidth,
    containerHeight,
    enableWheelZoom = true,
    zoomSensitivity = 0.1,
    resetDeps = []
  } = options

  const [state, setState] = useState<ZoomPanState>({
    scale: initialScale,
    panX: 0,
    panY: 0
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastPanRef = useRef({ x: 0, y: 0 })
  const wheelTimeoutRef = useRef<number | null>(null)
  const pendingZoomRef = useRef<{ delta: number; centerX: number; centerY: number } | null>(null)

  // Get container dimensions
  const getContainerDimensions = useCallback(() => {
    if (containerWidth && containerHeight) {
      return { width: containerWidth, height: containerHeight }
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }
    return { width: 800, height: 600 } // Default fallback
  }, [containerWidth, containerHeight])

  // Calculate pan boundaries based on current scale
  const calculatePanBounds = useCallback((scale: number): ViewportBounds => {
    const container = getContainerDimensions()
    const scaledGridWidth = gridWidth * scale
    const scaledGridHeight = gridHeight * scale

    // Pan boundaries ensure the grid stays within viewport
    // Allow panning if grid is larger than container
    const maxPanX = Math.max(0, (scaledGridWidth - container.width) / 2)
    const maxPanY = Math.max(0, (scaledGridHeight - container.height) / 2)
    const minPanX = -maxPanX
    const minPanY = -maxPanY

    return {
      minX: minPanX,
      maxX: maxPanX,
      minY: minPanY,
      maxY: maxPanY
    }
  }, [gridWidth, gridHeight, getContainerDimensions])

  // Clamp pan to boundaries
  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const bounds = calculatePanBounds(scale)
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
    }
  }, [calculatePanBounds])

  // Zoom to a specific point (mouse position)
  const zoomToPoint = useCallback((delta: number, centerX: number, centerY: number) => {
    setState(prev => {
      // Use a smaller, smoother zoom increment for better performance
      const zoomFactor = 1 + delta * zoomSensitivity * 0.5
      const newScale = Math.max(minScale, Math.min(maxScale, prev.scale * zoomFactor))
      
      // Calculate zoom center relative to grid
      const container = getContainerDimensions()
      
      // Mouse position relative to container center
      const mouseX = centerX - container.width / 2
      const mouseY = centerY - container.height / 2
      
      // Adjust pan to zoom towards mouse position
      const scaleDelta = newScale / prev.scale
      const newPanX = prev.panX - (mouseX * (scaleDelta - 1) / prev.scale)
      const newPanY = prev.panY - (mouseY * (scaleDelta - 1) / prev.scale)
      
      const clamped = clampPan(newPanX, newPanY, newScale)
      
      return {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
    })
  }, [minScale, maxScale, zoomSensitivity, gridWidth, gridHeight, getContainerDimensions, clampPan])

  // Set zoom level
  const setZoom = useCallback((scale: number, centerX?: number, centerY?: number) => {
    const newScale = Math.max(minScale, Math.min(maxScale, scale))
    
    if (centerX !== undefined && centerY !== undefined) {
      zoomToPoint((newScale / state.scale) - 1, centerX, centerY)
    } else {
      setState(prev => {
        const clamped = clampPan(prev.panX, prev.panY, newScale)
        return {
          scale: newScale,
          panX: clamped.x,
          panY: clamped.y
        }
      })
    }
  }, [minScale, maxScale, state.scale, zoomToPoint, clampPan])

  // Zoom in
  const zoomIn = useCallback((centerX?: number, centerY?: number) => {
    setState(prev => {
      const newScale = Math.min(maxScale, prev.scale * 1.2)
      if (centerX !== undefined && centerY !== undefined) {
        zoomToPoint(0.2, centerX, centerY)
        return prev // zoomToPoint updates state
      }
      const clamped = clampPan(prev.panX, prev.panY, newScale)
      return {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
    })
  }, [maxScale, clampPan, zoomToPoint])

  // Zoom out
  const zoomOut = useCallback((centerX?: number, centerY?: number) => {
    setState(prev => {
      const newScale = Math.max(minScale, prev.scale * 0.8)
      if (centerX !== undefined && centerY !== undefined) {
        zoomToPoint(-0.2, centerX, centerY)
        return prev // zoomToPoint updates state
      }
      const clamped = clampPan(prev.panX, prev.panY, newScale)
      return {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
    })
  }, [minScale, clampPan, zoomToPoint])

  // Reset zoom and pan
  const reset = useCallback(() => {
    setState({
      scale: initialScale,
      panX: 0,
      panY: 0
    })
  }, [initialScale])

  // Pan handlers
  const handleStart = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true
    dragStartRef.current = { x: clientX, y: clientY }
    lastPanRef.current = { x: state.panX, y: state.panY }
  }, [state.panX, state.panY])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return

    const deltaX = (clientX - dragStartRef.current.x) / state.scale
    const deltaY = (clientY - dragStartRef.current.y) / state.scale

    const newPanX = lastPanRef.current.x + deltaX
    const newPanY = lastPanRef.current.y + deltaY

    const clamped = clampPan(newPanX, newPanY, state.scale)

    setState(prev => ({
      ...prev,
      panX: clamped.x,
      panY: clamped.y
    }))
  }, [state.scale, clampPan])

  const handleEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Mouse event handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }, [handleStart])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }, [handleMove])

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Touch event handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    }
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Wheel zoom handler with aggressive throttling to prevent browser crashes
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!enableWheelZoom) return
    
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    
    // Store the latest wheel event (only keep most recent)
    pendingZoomRef.current = { delta, centerX: e.clientX, centerY: e.clientY }
    
    // Clear existing timeout
    if (wheelTimeoutRef.current !== null) {
      cancelAnimationFrame(wheelTimeoutRef.current)
    }
    
    // Throttle zoom updates - only process every 2-3 frames to prevent crashes
    wheelTimeoutRef.current = requestAnimationFrame(() => {
      // Double RAF for additional throttling
      requestAnimationFrame(() => {
        if (pendingZoomRef.current) {
          const { delta, centerX, centerY } = pendingZoomRef.current
          zoomToPoint(delta, centerX, centerY)
          pendingZoomRef.current = null
        }
        wheelTimeoutRef.current = null
      })
    })
  }, [enableWheelZoom, zoomToPoint])

  // Global mouse events for dragging outside element
  useEffect(() => {
    if (!isDraggingRef.current) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleGlobalMouseUp = () => {
      handleEnd()
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [handleMove, handleEnd])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current !== null) {
        cancelAnimationFrame(wheelTimeoutRef.current)
      }
    }
  }, [])

  // Reset when dependencies change
  useEffect(() => {
    reset()
  }, resetDeps)

  // Calculate viewport bounds (what part of grid is visible)
  const viewportBounds = useMemo((): ViewportBounds => {
    const container = getContainerDimensions()
    const halfWidth = container.width / (2 * state.scale)
    const halfHeight = container.height / (2 * state.scale)
    const centerX = -state.panX / state.scale + gridWidth / 2
    const centerY = -state.panY / state.scale + gridHeight / 2

    return {
      minX: Math.max(0, centerX - halfWidth),
      maxX: Math.min(gridWidth, centerX + halfWidth),
      minY: Math.max(0, centerY - halfHeight),
      maxY: Math.min(gridHeight, centerY + halfHeight)
    }
  }, [state.scale, state.panX, state.panY, gridWidth, gridHeight, getContainerDimensions])

  // Determine zoom level (0 = quadrant, 1 = sector, 2 = galaxy clusters, 3 = galaxy detail, 4 = planets)
  const zoomLevel = useMemo(() => {
    if (state.scale < 0.15) return 0 // Quadrant view
    if (state.scale < 0.35) return 1 // Sector view
    if (state.scale < 0.65) return 2 // Galaxy clusters view
    if (state.scale < 2.5) return 3 // Galaxy detail view
    return 4 // Planet view
  }, [state.scale])

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const container = getContainerDimensions()
    const relativeX = screenX - container.width / 2
    const relativeY = screenY - container.height / 2
    const gridX = -state.panX / state.scale + gridWidth / 2 + relativeX / state.scale
    const gridY = -state.panY / state.scale + gridHeight / 2 + relativeY / state.scale
    return { x: gridX, y: gridY }
  }, [state.scale, state.panX, state.panY, gridWidth, gridHeight, getContainerDimensions])

  // Convert grid coordinates to screen coordinates
  const gridToScreen = useCallback((gridX: number, gridY: number) => {
    const container = getContainerDimensions()
    const relativeX = (gridX - gridWidth / 2) * state.scale + state.panX
    const relativeY = (gridY - gridHeight / 2) * state.scale + state.panY
    return {
      x: container.width / 2 + relativeX,
      y: container.height / 2 + relativeY
    }
  }, [state.scale, state.panX, state.panY, gridWidth, gridHeight, getContainerDimensions])

  return {
    // State
    scale: state.scale,
    panX: state.panX,
    panY: state.panY,
    zoomLevel,
    viewportBounds,
    isDragging: isDraggingRef.current,
    
    // Refs
    containerRef,
    
    // Actions
    setZoom,
    zoomIn,
    zoomOut,
    reset,
    setPan: useCallback((x: number, y: number) => {
      const clamped = clampPan(x, y, state.scale)
      setState(prev => ({ ...prev, panX: clamped.x, panY: clamped.y }))
    }, [state.scale, clampPan]),
    
    // Event handlers
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onWheel,
    
    // Utilities
    screenToGrid,
    gridToScreen,
    panBounds: calculatePanBounds(state.scale)
  }
}

