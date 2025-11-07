import { useCallback, useRef, useEffect } from 'react'

export interface UseWindowDragOptions {
  enabled?: boolean
  onDragStart?: () => void
  onDrag?: (position: { x: number; y: number }) => void
  onDragEnd?: (position: { x: number; y: number }) => void
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
}

export function useWindowDrag({
  enabled = true,
  onDragStart,
  onDrag,
  onDragEnd,
  minX,
  maxX,
  minY,
  maxY,
}: UseWindowDragOptions = {}) {
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const positionStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return
      
      // Only start drag on left mouse button
      if (e.button !== 0) return
      
      // Don't drag if clicking on interactive elements
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      ) {
        return
      }

      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      
      // Get current position from element
      const element = e.currentTarget
      const rect = element.getBoundingClientRect()
      positionStartRef.current = { x: rect.left, y: rect.top }
      
      onDragStart?.()
      
      e.preventDefault()
      e.stopPropagation()
    },
    [enabled, onDragStart]
  )

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || !positionStartRef.current) return

      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      let newX = positionStartRef.current.x + deltaX
      let newY = positionStartRef.current.y + deltaY

      // Apply constraints
      if (minX !== undefined) newX = Math.max(minX, newX)
      if (maxX !== undefined) newX = Math.min(maxX, newX)
      if (minY !== undefined) newY = Math.max(minY, newY)
      if (maxY !== undefined) newY = Math.min(maxY, newY)

      const newPosition = { x: newX, y: newY }
      onDrag?.(newPosition)
    },
    [onDrag, minX, maxX, minY, maxY]
  )

  const handleGlobalMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return

    isDraggingRef.current = false
    
    if (dragStartRef.current && positionStartRef.current) {
      const finalPosition = positionStartRef.current
      onDragEnd?.(finalPosition)
    }

    dragStartRef.current = null
    positionStartRef.current = null
  }, [onDragEnd])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [enabled, handleGlobalMouseMove, handleGlobalMouseUp])

  return {
    onMouseDown: handleMouseDown,
    isDragging: isDraggingRef.current,
  }
}

