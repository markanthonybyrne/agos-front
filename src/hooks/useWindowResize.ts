import { useCallback, useRef, useEffect } from 'react'

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface UseWindowResizeOptions {
  enabled?: boolean
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  onResizeStart?: () => void
  onResize?: (dimensions: { width: number; height: number }, position: { x: number; y: number }) => void
  onResizeEnd?: (dimensions: { width: number; height: number }, position: { x: number; y: number }) => void
}

export function useWindowResize({
  enabled = true,
  minWidth = 300,
  maxWidth,
  minHeight = 200,
  maxHeight,
  onResizeStart,
  onResize,
  onResizeEnd,
}: UseWindowResizeOptions = {}) {
  const isResizingRef = useRef(false)
  const resizeHandleRef = useRef<ResizeHandle | null>(null)
  const resizeStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialDimensionsRef = useRef<{ width: number; height: number } | null>(null)
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null)
  const currentDimensionsRef = useRef<{ width: number; height: number } | null>(null)
  const currentPositionRef = useRef<{ x: number; y: number } | null>(null)

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>, handle: ResizeHandle) => {
      if (!enabled) return
      if (e.button !== 0) return

      isResizingRef.current = true
      resizeHandleRef.current = handle
      resizeStartRef.current = { x: e.clientX, y: e.clientY }

      const element = e.currentTarget.closest('[data-window]') as HTMLElement
      if (element) {
        const rect = element.getBoundingClientRect()
        initialDimensionsRef.current = { width: rect.width, height: rect.height }
        initialPositionRef.current = { x: rect.left, y: rect.top }
      }

      onResizeStart?.()
      e.preventDefault()
      e.stopPropagation()
    },
    [enabled, onResizeStart]
  )

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isResizingRef.current ||
        !resizeHandleRef.current ||
        !resizeStartRef.current ||
        !initialDimensionsRef.current ||
        !initialPositionRef.current
      ) {
        return
      }

      const deltaX = e.clientX - resizeStartRef.current.x
      const deltaY = e.clientY - resizeStartRef.current.y

      let width = initialDimensionsRef.current.width
      let height = initialDimensionsRef.current.height
      let x = initialPositionRef.current.x
      let y = initialPositionRef.current.y

      const handle = resizeHandleRef.current

      // Calculate new dimensions and position based on handle
      if (handle.includes('e')) {
        width = initialDimensionsRef.current.width + deltaX
      }
      if (handle.includes('w')) {
        width = initialDimensionsRef.current.width - deltaX
        x = initialPositionRef.current.x + deltaX
      }
      if (handle.includes('s')) {
        height = initialDimensionsRef.current.height + deltaY
      }
      if (handle.includes('n')) {
        height = initialDimensionsRef.current.height - deltaY
        y = initialPositionRef.current.y + deltaY
      }

      // Apply constraints
      const maxW = maxWidth ?? window.innerWidth - 40
      const maxH = maxHeight ?? window.innerHeight - 40

      width = Math.max(minWidth, Math.min(width, maxW))
      height = Math.max(minHeight, Math.min(height, maxH))

      // Adjust position if constraints affected dimensions
      if (handle.includes('w')) {
        const widthDiff = initialDimensionsRef.current.width - width
        x = initialPositionRef.current.x + widthDiff
      }
      if (handle.includes('n')) {
        const heightDiff = initialDimensionsRef.current.height - height
        y = initialPositionRef.current.y + heightDiff
      }

      const newDimensions = { width, height }
      const newPosition = { x, y }

      // Store current values for onResizeEnd
      currentDimensionsRef.current = newDimensions
      currentPositionRef.current = newPosition

      onResize?.(newDimensions, newPosition)
    },
    [onResize, minWidth, maxWidth, minHeight, maxHeight]
  )

  const handleGlobalMouseUp = useCallback(() => {
    if (!isResizingRef.current) return

    // Get current dimensions and position before resetting refs
    const finalDimensions = currentDimensionsRef.current || initialDimensionsRef.current
    const finalPosition = currentPositionRef.current || initialPositionRef.current

    isResizingRef.current = false
    resizeHandleRef.current = null
    resizeStartRef.current = null
    initialDimensionsRef.current = null
    initialPositionRef.current = null
    currentDimensionsRef.current = null
    currentPositionRef.current = null
    
    if (finalDimensions && finalPosition) {
      onResizeEnd?.(finalDimensions, finalPosition)
    }
  }, [onResizeEnd])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [enabled, handleGlobalMouseMove, handleGlobalMouseUp])

  const createResizeHandle = useCallback(
    (handle: ResizeHandle, className: string = '') => ({
      onMouseDown: (e: React.MouseEvent<HTMLElement>) =>
        handleResizeMouseDown(e, handle),
      className: `resize-handle resize-handle-${handle} ${className}`,
    }),
    [handleResizeMouseDown]
  )

  return {
    createResizeHandle,
    isResizing: isResizingRef.current,
  }
}

