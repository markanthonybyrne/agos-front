import { useState, useCallback, useRef, useEffect } from 'react'

export interface PanOffset {
  x: number
  y: number
}

export interface UsePanningOptions {
  /**
   * Whether panning is enabled
   */
  enabled?: boolean
  /**
   * Minimum X offset (left bound)
   */
  minX?: number
  /**
   * Maximum X offset (right bound)
   */
  maxX?: number
  /**
   * Minimum Y offset (top bound)
   */
  minY?: number
  /**
   * Maximum Y offset (bottom bound)
   */
  maxY?: number
  /**
   * Reset pan offset when dependencies change
   */
  resetDeps?: React.DependencyList
}

/**
 * Hook for handling panning/dragging functionality
 * Supports mouse drag and touch events
 */
export function usePanning(options: UsePanningOptions = {}) {
  const {
    enabled = true,
    minX,
    maxX,
    minY,
    maxY,
    resetDeps = []
  } = options

  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<PanOffset>({ x: 0, y: 0 })
  const panStartRef = useRef<PanOffset>({ x: 0, y: 0 })

  // Reset pan offset when dependencies change
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 })
  }, resetDeps)

  // Apply bounds to pan offset
  const applyBounds = useCallback((offset: PanOffset): PanOffset => {
    let { x, y } = offset

    if (minX !== undefined) x = Math.max(minX, x)
    if (maxX !== undefined) x = Math.min(maxX, x)
    if (minY !== undefined) y = Math.max(minY, y)
    if (maxY !== undefined) y = Math.min(maxY, y)

    return { x, y }
  }, [minX, maxX, minY, maxY])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enabled) return

    setIsDragging(true)
    dragStartRef.current = { x: clientX, y: clientY }
    panStartRef.current = { ...panOffset }
  }, [enabled, panOffset])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!enabled || !isDragging) return

    const deltaX = clientX - dragStartRef.current.x
    const deltaY = clientY - dragStartRef.current.y

    const newOffset = applyBounds({
      x: panStartRef.current.x + deltaX,
      y: panStartRef.current.y + deltaY
    })

    setPanOffset(newOffset)
  }, [enabled, isDragging, applyBounds])

  const handleEnd = useCallback(() => {
    if (!enabled) return
    setIsDragging(false)
  }, [enabled])

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
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Global mouse events (for dragging outside element)
  useEffect(() => {
    if (!isDragging) return

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
  }, [isDragging, handleMove, handleEnd])

  // Reset pan offset
  const resetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // Set pan offset directly
  const setPan = useCallback((offset: PanOffset) => {
    setPanOffset(applyBounds(offset))
  }, [applyBounds])

  return {
    panOffset,
    isDragging,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    resetPan,
    setPan
  }
}

