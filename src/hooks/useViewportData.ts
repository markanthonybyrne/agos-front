/**
 * useViewportData - Hook for viewport-based entity filtering
 * 
 * Calculates visible entities based on camera position and zoom level
 * Implements virtualization to only render entities in viewport
 */

import { useMemo } from 'react'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'
import { Planet } from '@/types/api.types'

interface Entity {
  id: number | string
  x: number
  y: number
  [key: string]: any
}

interface UseViewportDataOptions<T extends Entity> {
  entities: T[]
  viewportBounds: ViewportBounds
  padding?: number
  maxEntities?: number
}

/**
 * Filter entities by viewport bounds with optional padding
 */
export function useViewportData<T extends Entity>(options: UseViewportDataOptions<T>) {
  const { entities, viewportBounds, padding = 0, maxEntities } = options
  
  const visibleEntities = useMemo(() => {
    if (entities.length === 0) return []
    
    const bounds = {
      minX: viewportBounds.minX - padding,
      maxX: viewportBounds.maxX + padding,
      minY: viewportBounds.minY - padding,
      maxY: viewportBounds.maxY + padding
    }
    
    // Filter entities within viewport
    const filtered = entities.filter(entity => {
      return entity.x >= bounds.minX && entity.x <= bounds.maxX &&
             entity.y >= bounds.minY && entity.y <= bounds.maxY
    })
    
    // If maxEntities is specified, sort by distance from viewport center and take closest
    if (maxEntities && filtered.length > maxEntities) {
      const centerX = (viewportBounds.minX + viewportBounds.maxX) / 2
      const centerY = (viewportBounds.minY + viewportBounds.maxY) / 2
      
      const sorted = filtered
        .map(entity => {
          const dx = entity.x - centerX
          const dy = entity.y - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)
          return { entity, distance }
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxEntities)
        .map(item => item.entity)
      
      return sorted
    }
    
    return filtered
  }, [entities, viewportBounds, padding, maxEntities])
  
  return visibleEntities
}

/**
 * Group planets by system for system-level rendering
 */
export function groupPlanetsBySystem(planets: Planet[]): Map<string, Planet[]> {
  const grouped = new Map<string, Planet[]>()
  
  for (const planet of planets) {
    const coord = typeof planet.coordinate === 'object' && planet.coordinate !== null
      ? planet.coordinate
      : null
    
    if (!coord) continue
    
    const systemKey = `${coord.quadrant}:${coord.sector}:${coord.galaxy}:${coord.system || 0}`
    
    if (!grouped.has(systemKey)) {
      grouped.set(systemKey, [])
    }
    grouped.get(systemKey)!.push(planet)
  }
  
  return grouped
}

/**
 * Group planets by galaxy for galaxy-level rendering
 */
export function groupPlanetsByGalaxy(planets: Planet[]): Map<string, Planet[]> {
  const grouped = new Map<string, Planet[]>()
  
  for (const planet of planets) {
    const coord = typeof planet.coordinate === 'object' && planet.coordinate !== null
      ? planet.coordinate
      : null
    
    if (!coord) continue
    
    const galaxyKey = `${coord.quadrant}:${coord.sector}:${coord.galaxy}`
    
    if (!grouped.has(galaxyKey)) {
      grouped.set(galaxyKey, [])
    }
    grouped.get(galaxyKey)!.push(planet)
  }
  
  return grouped
}



