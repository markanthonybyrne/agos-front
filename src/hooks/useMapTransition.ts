import { useState, useCallback, useEffect, useRef } from 'react'

interface MapTransitionState {
  isTransitioning: boolean
  fromLevel: string | null
  toLevel: string | null
}

interface UseMapTransitionOptions {
  duration?: number
}

/**
 * Hook to manage smooth transitions between map levels
 * Handles fade/scale animations when drilling down or zooming out
 */
export function useMapTransition(options: UseMapTransitionOptions = {}) {
  const { duration = 400 } = options

  const [transitionState, setTransitionState] = useState<MapTransitionState>({
    isTransitioning: false,
    fromLevel: null,
    toLevel: null,
  })

  const startTransition = useCallback(async (
    fromLevel: string,
    toLevel: string,
    onComplete: () => void
  ) => {
    setTransitionState({
      isTransitioning: true,
      fromLevel,
      toLevel,
    })

    // Wait for exit animation
    await new Promise(resolve => setTimeout(resolve, duration))

    // Update to new level
    onComplete()

    // Wait for enter animation
    await new Promise(resolve => setTimeout(resolve, duration))

    setTransitionState({
      isTransitioning: false,
      fromLevel: null,
      toLevel: null,
    })
  }, [duration])

  return {
    transitionState,
    startTransition,
  }
}

/**
 * Hook to debounce rapid interactions for performance
 * Prevents excessive re-renders during hover/scroll events
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for 60fps-optimized hover detection
 * Uses requestAnimationFrame to batch updates
 */
export function usePerformanceHover() {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  const handleHover = useCallback((id: string | number | null) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setHoveredId(id)
      rafIdRef.current = null
    })
  }, [])

  const handleHoverEnd = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setHoveredId(null)
      rafIdRef.current = null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    hoveredId,
    handleHover,
    handleHoverEnd,
  }
}

