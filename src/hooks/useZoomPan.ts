import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface ZoomPanState {
  scale: number
  panX: number
  panY: number
}

/**
 * Zoom velocity curve for perceptual continuity
 * Uses exponential easing to make early zoom stages (universe → galaxy) feel vast,
 * while finer detail (system → planet) feels precise
 * 
 * @param t - Normalized input (0.0-1.0)
 * @returns Eased output (0.0-1.0)
 */
export function zoomVelocityCurve(t: number): number {
  // Clamp to [0, 1]
  t = Math.max(0, Math.min(1, t))
  
  // Exponential easing: e^(2t - 2) gives a smooth curve
  // At t=0: e^(-2) ≈ 0.135, normalized to 0
  // At t=1: e^(0) = 1, normalized to 1
  // This creates a curve that starts slow and accelerates
  const exponential = Math.exp(2 * t - 2)
  const minExp = Math.exp(-2) // ≈ 0.135
  const maxExp = 1
  
  // Normalize to [0, 1]
  return (exponential - minExp) / (maxExp - minExp)
}

/**
 * Inverse of zoomVelocityCurve - converts eased value back to normalized zoom
 * 
 * @param eased - Eased value (0.0-1.0)
 * @returns Normalized zoom (0.0-1.0)
 */
export function inverseZoomVelocityCurve(eased: number): number {
  // Clamp to [0, 1]
  eased = Math.max(0, Math.min(1, eased))
  
  // Reverse the normalization
  const minExp = Math.exp(-2)
  const maxExp = 1
  const exponential = eased * (maxExp - minExp) + minExp
  
  // Reverse the exponential: t = (ln(exp) + 2) / 2
  return (Math.log(exponential) + 2) / 2
}

/**
 * Normalized zoom (0.0-1.0) → Render scale (0.09-1.554)
 * Uses non-linear zoom velocity curve for perceptual continuity
 * Sector view: scale 0.09 (9% zoom) = normalized 0.0 (0% in UI)
 * Systems view: scale 1.554 (277% zoom) = normalized 1.0 (350% in UI)
 */
export function normalizedToRenderScale(normalized: number): number {
  const minScale = 0.09
  const maxScale = 1.554
  
  // Apply velocity curve to normalized input for non-linear scaling
  const eased = zoomVelocityCurve(normalized)
  
  return minScale + (eased * (maxScale - minScale))
}

/**
 * Render scale (0.09-1.554) → Normalized zoom (0.0-1.0)
 * Uses inverse zoom velocity curve to convert back from render scale
 */
export function renderScaleToNormalized(scale: number): number {
  const minScale = 0.09
  const maxScale = 1.554
  
  // Convert to linear normalized value first
  const linearNormalized = Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)))
  
  // Apply inverse velocity curve to get the perceptual normalized zoom
  return inverseZoomVelocityCurve(linearNormalized)
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
   * Initial pan X position
   */
  initialPanX?: number
  /**
   * Initial pan Y position
   */
  initialPanY?: number
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
    minScale = 0.09,
    maxScale = 1.554,
    initialScale = 0.09,
    initialPanX = 0,
    initialPanY = 0,
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
    panX: initialPanX,
    panY: initialPanY
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

  // Calculate pan boundaries based on current scale and zoom level
  const calculatePanBounds = useCallback((scale: number): ViewportBounds => {
    const container = getContainerDimensions()
    const scaledGridWidth = gridWidth * scale
    const scaledGridHeight = gridHeight * scale
    
    // Get normalized zoom to determine zoom level
    const normalizedZoom = renderScaleToNormalized(scale)
    
    // Determine zoom level for boundary calculation
    // Sector level: slow pan, large radius, generous boundaries
    // System level: precise pan, restricted boundaries
    const isSectorLevel = normalizedZoom < 0.30  // Sector view
    const isGalaxyLevel = normalizedZoom >= 0.25 && normalizedZoom < 0.55  // Galaxy view
    const isSystemLevel = normalizedZoom >= 0.50 && normalizedZoom < 0.80  // System view
    const isPlanetaryLevel = normalizedZoom >= 0.75  // Planetary view
    
    // At sector level, allow panning off-canvas to reach corners
    // At higher zoom levels, keep grid centered with restricted boundaries
    if (isSectorLevel) {
      // Sector level: slow pan, large radius, generous boundaries
      // At scale 0.54, the grid is typically smaller than the container
      // Allow panning to move the grid around within the container
      
      // Calculate how much the grid can move within the container
      // If grid is smaller than container, we can pan to center it anywhere
      const gridWidthPx = scaledGridWidth
      const gridHeightPx = scaledGridHeight
      
      // Maximum pan distance is half the difference between container and grid
      // If grid is smaller, this allows centering the grid at any position
      let maxPanX = (scaledGridWidth - container.width) / 2
      let maxPanY = (scaledGridHeight - container.height) / 2
      
      // If grid is smaller than container (negative maxPan), calculate pan bounds differently
      // Allow panning to move the grid anywhere within the container
      if (maxPanX < 0) {
        // Grid fits in container width - allow panning to move grid anywhere
        // Pan can move the grid center from edge to edge
        maxPanX = Math.abs(maxPanX) + (container.width - gridWidthPx) / 2
      }
      if (maxPanY < 0) {
        // Grid fits in container height - allow panning to move grid anywhere
        maxPanY = Math.abs(maxPanY) + (container.height - gridHeightPx) / 2
      }
      
      // Add generous padding at sector level for full universe access
      // Ensure padding allows smooth panning across the entire grid
      const paddingFactor = 0.2
      const paddingX = Math.max(container.width * paddingFactor, gridWidth * scale * 0.15)
      const paddingY = Math.max(container.height * paddingFactor, gridHeight * scale * 0.15)
      
      return {
        minX: -maxPanX - paddingX,
        maxX: maxPanX + paddingX,
        minY: -maxPanY - paddingY,
        maxY: maxPanY + paddingY
      }
    } else if (isGalaxyLevel) {
      // Galaxy level: moderate pan boundaries
      let maxPanX = (scaledGridWidth - container.width) / 2
      let maxPanY = (scaledGridHeight - container.height) / 2
      
      if (maxPanX < 0) {
        maxPanX = Math.abs(maxPanX) + container.width * 0.15
      }
      if (maxPanY < 0) {
        maxPanY = Math.abs(maxPanY) + container.height * 0.15
      }
      
      const paddingFactor = 0.15
      const paddingX = Math.max(container.width * paddingFactor, gridWidth * 0.05)
      const paddingY = Math.max(container.height * paddingFactor, gridHeight * 0.05)
      
      return {
        minX: -maxPanX - paddingX,
        maxX: maxPanX + paddingX,
        minY: -maxPanY - paddingY,
        maxY: maxPanY + paddingY
      }
    } else {
      // System/Planetary level: precise pan, restricted boundaries
      // Keep grid centered with strict boundaries
      const maxPanX = Math.max(0, (scaledGridWidth - container.width) / 2)
      const maxPanY = Math.max(0, (scaledGridHeight - container.height) / 2)
      const minPanX = -maxPanX
      const minPanY = -maxPanY
      
      // Add small padding for system/planetary levels to prevent edge cases
      const padding = isPlanetaryLevel ? 0 : 10 // Small padding for system level, none for planetary
      
      return {
        minX: minPanX - padding,
        maxX: maxPanX + padding,
        minY: minPanY - padding,
        maxY: maxPanY + padding
      }
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
      // Use consistent smooth zoom sensitivity across all ranges
      // The same sensitivity that feels good at 104%+ is used for 5%-103% too
      // This creates the same immersive, gradual zoom experience throughout
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

  // Set zoom and pan together (useful for jumping to coordinates)
  const setZoomAndPan = useCallback((scale: number, panX: number, panY: number) => {
    const newScale = Math.max(minScale, Math.min(maxScale, scale))
    const clamped = clampPan(panX, panY, newScale)
    setState({
      scale: newScale,
      panX: clamped.x,
      panY: clamped.y
    })
  }, [minScale, maxScale, clampPan])

  // Smooth transition to zoom and pan (animated)
  const smoothSetZoomAndPan = useCallback((
    targetScale: number,
    targetPanX: number,
    targetPanY: number,
    duration: number = 1000
  ) => {
    // Capture current state at animation start
    setState(prevState => {
      const newScale = Math.max(minScale, Math.min(maxScale, targetScale))
      const clamped = clampPan(targetPanX, targetPanY, newScale)
      
      const startState = { ...prevState }
      const endState = {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
      
      const startTime = performance.now()
      const animate = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-in-out cubic)
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
        const currentScale = startState.scale + (endState.scale - startState.scale) * eased
        const currentPanX = startState.panX + (endState.panX - startState.panX) * eased
        const currentPanY = startState.panY + (endState.panY - startState.panY) * eased
        
        setState(prev => {
          const currentClamped = clampPan(currentPanX, currentPanY, currentScale)
          return {
            scale: currentScale,
            panX: currentClamped.x,
            panY: currentClamped.y
          }
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
      
      // Return current state (animation will update it)
      return prevState
    })
  }, [minScale, maxScale, clampPan])

  // Zoom in - smooth animation towards viewport center
  const zoomIn = useCallback(() => {
    setState(prev => {
      // Use consistent zoom step (1.15x = 15% increase) for smooth, predictable zoom
      const zoomFactor = 1.15
      const newScale = Math.min(maxScale, prev.scale * zoomFactor)
      
      // Adjust pan to keep viewport center fixed in grid coordinates
      // Viewport center in grid: centerX = -panX/scale + gridWidth/2
      // To keep same center point: panX_new = panX_old * (scale_new / scale_old)
      const scaleRatio = newScale / prev.scale
      const newPanX = prev.panX * scaleRatio
      const newPanY = prev.panY * scaleRatio
      
      const clamped = clampPan(newPanX, newPanY, newScale)
      
      return {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
    })
  }, [maxScale, clampPan])

  // Zoom out - smooth animation towards viewport center
  const zoomOut = useCallback(() => {
    setState(prev => {
      // Use consistent zoom step (1/1.15 ≈ 0.87 = 13% decrease) for smooth, predictable zoom
      const zoomFactor = 1 / 1.15
      const newScale = Math.max(minScale, prev.scale * zoomFactor)
      
      // Adjust pan to keep viewport center fixed in grid coordinates
      // Viewport center in grid: centerX = -panX/scale + gridWidth/2
      // To keep same center point: panX_new = panX_old * (scale_new / scale_old)
      const scaleRatio = newScale / prev.scale
      const newPanX = prev.panX * scaleRatio
      const newPanY = prev.panY * scaleRatio
      
      const clamped = clampPan(newPanX, newPanY, newScale)
      
      return {
        scale: newScale,
        panX: clamped.x,
        panY: clamped.y
      }
    })
  }, [minScale, clampPan])

  // Reset zoom and pan
  const reset = useCallback(() => {
    setState({
      scale: initialScale,
      panX: initialPanX,
      panY: initialPanY
    })
  }, [initialScale, initialPanX, initialPanY])

  // Pan handlers
  const handleStart = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true
    dragStartRef.current = { x: clientX, y: clientY }
    lastPanRef.current = { x: state.panX, y: state.panY }
  }, [state.panX, state.panY])
  
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return

    // Calculate pan delta - divide by scale so movement feels consistent across zoom levels
    // At higher zoom (larger scale), same mouse movement moves less in grid space
    // At scale 0.54, panning should feel responsive and smooth
    const deltaX = (clientX - dragStartRef.current.x) / state.scale
    const deltaY = (clientY - dragStartRef.current.y) / state.scale

    const newPanX = lastPanRef.current.x + deltaX
    const newPanY = lastPanRef.current.y + deltaY

    const clamped = clampPan(newPanX, newPanY, state.scale)

    // Update immediately for perfectly smooth panning at every zoom level
    // No throttling - direct state updates ensure zero latency
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

  // Wheel zoom handler with adaptive throttling for smooth zoom experience
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
    
    // Use smoother, less throttled zoom for immersive experience
    // Single RAF for smoother feel, especially in 5%-103% range
    wheelTimeoutRef.current = requestAnimationFrame(() => {
      if (pendingZoomRef.current) {
        const { delta, centerX, centerY } = pendingZoomRef.current
        zoomToPoint(delta, centerX, centerY)
        pendingZoomRef.current = null
      }
      wheelTimeoutRef.current = null
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

  // Cleanup animation frames on unmount
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

  // Calculate normalized zoom (0.0 = Universe, 1.0 = System)
  const normalizedZoom = useMemo(() => {
    return renderScaleToNormalized(state.scale)
  }, [state.scale])

  // Set normalized zoom with optional center point
  const setNormalizedZoom = useCallback((
    normalized: number, 
    centerX?: number, 
    centerY?: number
  ) => {
    const targetScale = normalizedToRenderScale(Math.max(0, Math.min(1, normalized)))
    setZoom(targetScale, centerX, centerY)
  }, [setZoom])

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
    normalizedZoom,
    zoomLevel,
    viewportBounds,
    isDragging: isDraggingRef.current,
    
    // Refs
    containerRef,
    
    // Actions
    setZoom,
    setNormalizedZoom,
    setZoomAndPan,
    smoothSetZoomAndPan,
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

