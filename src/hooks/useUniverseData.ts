/**
 * useUniverseData - Hook for loading universe map data from API
 * 
 * Uses /planets/search endpoint with hierarchical filters and viewport bounds
 * Implements request throttling to respect rate limits (300/min)
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Planet } from '@/types/api.types'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'

interface UseUniverseDataOptions {
  viewportBounds?: ViewportBounds
  quadrant?: number
  sector?: number
  galaxy?: number
  zoomLevel: 'sector' | 'galaxy' | 'system' | 'planet'
  enabled?: boolean
}

interface RequestCache {
  key: string
  data: Planet[]
  timestamp: number
  bounds: ViewportBounds
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30000

// Request throttling: max 5 requests per second (300/min)
const MIN_REQUEST_INTERVAL = 200

export function useUniverseData(options: UseUniverseDataOptions) {
  const { viewportBounds, quadrant, sector, galaxy, zoomLevel, enabled = true } = options
  
  const [cachedData, setCachedData] = useState<Map<string, RequestCache>>(new Map())
  const lastRequestTimeRef = useRef<number>(0)
  const pendingRequestRef = useRef<{ key: string; bounds: ViewportBounds } | null>(null)
  
  // Determine what data to load based on zoom level
  // At sector level, load all planets without filters (for galaxy grouping)
  // At higher zoom levels, we could filter by quadrant/sector/galaxy
  const queryParams = useMemo(() => {
    if (!enabled || !viewportBounds) return null
    
    const params: {
      quadrant?: number
      sector?: number
      galaxy?: number
      limit: number
      offset: number
    } = {
      limit: 500, // Max allowed by API - load more planets for sector view
      offset: 0
    }
    
    // At sector level, don't filter - load all planets to group by galaxy
    // At higher zoom levels, we could add filters, but for now load all
    // TODO: Add quadrant/sector/galaxy filters for higher zoom levels
    
    return params
  }, [enabled, viewportBounds])
  
  // Generate cache key
  const cacheKey = useMemo(() => {
    if (!viewportBounds) return null
    const bounds = viewportBounds
    return `${zoomLevel}-${quadrant || 'all'}-${sector || 'all'}-${galaxy || 'all'}-${Math.floor(bounds.minX / 100)}-${Math.floor(bounds.minY / 100)}`
  }, [zoomLevel, quadrant, sector, galaxy, viewportBounds])
  
  // Check cache first
  const cachedResult = useMemo(() => {
    if (!cacheKey) return null
    const cached = cachedData.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Check if bounds overlap significantly
      const bounds = viewportBounds!
      const overlapX = Math.max(0, Math.min(bounds.maxX, cached.bounds.maxX) - Math.max(bounds.minX, cached.bounds.minX))
      const overlapY = Math.max(0, Math.min(bounds.maxY, cached.bounds.maxY) - Math.max(bounds.minY, cached.bounds.minY))
      const overlapArea = overlapX * overlapY
      const boundsArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)
      if (overlapArea > boundsArea * 0.5) {
        return cached.data
      }
    }
    return null
  }, [cacheKey, cachedData, viewportBounds])
  
  // RTK Query hook
  const { data, isLoading, error, refetch } = useSearchPlanetsQuery(
    queryParams || { limit: 500, offset: 0 },
    {
      skip: !queryParams || !enabled || !!cachedResult,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false
    }
  )
  
  // Debug logging - removed to prevent performance issues
  // Only log warnings
  useEffect(() => {
    if (data && data.planets && data.planets.length > 1000) {
      console.warn('[useUniverseData] Large dataset loaded:', data.planets.length)
    }
  }, [data?.planets?.length])
  
  // Throttle requests
  useEffect(() => {
    if (!queryParams || !enabled || cachedResult || !viewportBounds) return
    
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      // Schedule request for later
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      const timeoutId = setTimeout(() => {
        pendingRequestRef.current = { key: cacheKey!, bounds: viewportBounds }
        refetch()
        lastRequestTimeRef.current = Date.now()
      }, delay)
      
      return () => clearTimeout(timeoutId)
    } else {
      // Request immediately
      pendingRequestRef.current = { key: cacheKey!, bounds: viewportBounds }
      refetch()
      lastRequestTimeRef.current = now
    }
  }, [queryParams, enabled, cachedResult, viewportBounds, cacheKey, refetch])
  
  // Update cache when new data arrives
  useEffect(() => {
    if (data?.planets && pendingRequestRef.current) {
      const { key, bounds } = pendingRequestRef.current
      setCachedData(prev => {
        const next = new Map(prev)
        next.set(key, {
          key,
          data: data.planets,
          timestamp: Date.now(),
          bounds
        })
        // Limit cache size to 50 entries
        if (next.size > 50) {
          const firstKey = next.keys().next().value
          if (firstKey) {
            next.delete(firstKey)
          }
        }
        return next
      })
      pendingRequestRef.current = null
    }
  }, [data])
  
  // Filter planets by viewport bounds
  // NOTE: At sector level, we want ALL planets to group by galaxy, so don't filter by viewport
  // Only filter at higher zoom levels where we have too many planets
  const filteredPlanets = useMemo(() => {
    const planets = cachedResult || data?.planets || []
    
    // At sector level, return all planets (needed for galaxy grouping)
    // But limit to prevent crashes
    if (zoomLevel === 'sector') {
      return planets.slice(0, 2000) // Limit even at sector level
    }
    
    // At other zoom levels, filter by viewport if bounds are available
    if (!viewportBounds || planets.length === 0) {
      return planets
    }
    
    const filtered = planets.filter(planet => {
      const coord = typeof planet.coordinate === 'object' && planet.coordinate !== null
        ? planet.coordinate
        : null
      
      if (!coord || typeof coord.x !== 'number' || typeof coord.y !== 'number') {
        // Fallback: try to get x/y from planet directly
        if (typeof (planet as any).x === 'number' && typeof (planet as any).y === 'number') {
          const x = (planet as any).x
          const y = (planet as any).y
          return x >= viewportBounds.minX && x <= viewportBounds.maxX &&
                 y >= viewportBounds.minY && y <= viewportBounds.maxY
        }
        // If no x/y, don't filter out - let getPlanetXY handle conversion
        return true
      }
      
      return coord.x >= viewportBounds.minX && coord.x <= viewportBounds.maxX &&
             coord.y >= viewportBounds.minY && coord.y <= viewportBounds.maxY
    })
    
    // Limit filtered results to prevent crashes
    return filtered.slice(0, 1000)
  }, [cachedResult, data?.planets, viewportBounds, zoomLevel])
  
  return {
    planets: filteredPlanets,
    isLoading: isLoading && !cachedResult,
    error,
    total: data?.total,
    fromCache: !!cachedResult
  }
}

