import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  enabled?: boolean
}

/**
 * Hook to detect when an element enters the viewport
 * Used for lazy rendering to improve performance
 */
export function useViewportIntersection(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const { 
    root = null, 
    rootMargin = '100px', // Start loading slightly before entering viewport
    threshold = 0,
    enabled = true
  } = options

  const elementRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        root,
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [root, rootMargin, threshold, enabled])

  return [elementRef, isIntersecting]
}

/**
 * Hook to batch DOM updates for multiple elements using viewport intersection
 * Returns a map of element IDs to their intersection state
 */
export function useMultipleViewportIntersections(
  elementIds: string[],
  options: UseIntersectionObserverOptions = {}
): Record<string, boolean> {
  const { 
    root = null, 
    rootMargin = '100px',
    threshold = 0
  } = options

  const [intersections, setIntersections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    elementIds.forEach(id => {
      initial[id] = false
    })
    return initial
  })

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    elementIds.forEach((id) => {
      const element = document.getElementById(id)
      if (!element) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIntersections(prev => ({
            ...prev,
            [id]: entry.isIntersecting
          }))
        },
        {
          root,
          rootMargin,
          threshold,
        }
      )

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [elementIds.join(','), root, rootMargin, threshold])

  return intersections
}

