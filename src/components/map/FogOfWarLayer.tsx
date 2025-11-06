import { useMemo } from 'react'
import { useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { DiscoveryStatus } from '@/types/api.types'

interface FogOfWarLayerProps {
  gridWidth: number
  gridHeight: number
  viewportBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  scale: number
}

/**
 * FogOfWarLayer - Renders dark cloudy overlay for undiscovered areas
 * Simple version - just a semi-transparent overlay with mask for discovered areas
 */
export function FogOfWarLayer({
  gridWidth,
  gridHeight,
  viewportBounds,
  scale
}: FogOfWarLayerProps) {
  const { data: visibilityData } = useGetVisibilityQuery()

  // Calculate discovered areas as rectangles
  const discoveredRects = useMemo(() => {
    const rects: Array<{
      x_min: number
      x_max: number
      y_min: number
      y_max: number
      status: DiscoveryStatus
    }> = []

    if (visibilityData?.visible_regions && Array.isArray(visibilityData.visible_regions)) {
      visibilityData.visible_regions.forEach((region) => {
        if (region.discovery_status === 'visible' || region.discovery_status === 'fogged') {
          rects.push({
            x_min: region.x_range.min,
            x_max: region.x_range.max,
            y_min: region.y_range.min,
            y_max: region.y_range.max,
            status: region.discovery_status,
          })
        }
      })
    }

    if (visibilityData?.visible_systems && Array.isArray(visibilityData.visible_systems)) {
      visibilityData.visible_systems.forEach((system) => {
        if (system.discovery_status === 'visible' || system.discovery_status === 'fogged') {
          rects.push({
            x_min: system.x_range.min,
            x_max: system.x_range.max,
            y_min: system.y_range.min,
            y_max: system.y_range.max,
            status: system.discovery_status,
          })
        }
      })
    }

    return rects
  }, [visibilityData])

  // Check if user has full visibility of the entire galaxy
  const hasFullVisibility = useMemo(() => {
    // Check if visibility level indicates full visibility
    if (visibilityData?.visibility_level === 'full') {
      return true
    }
    
    // Check if discovered areas cover the entire grid
    if (discoveredRects.length === 0) {
      return false
    }
    
    // Check if all regions/systems cover the entire grid bounds
    // This is a simplified check - if we have regions covering from 0 to gridWidth and 0 to gridHeight
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    
    discoveredRects.forEach(rect => {
      minX = Math.min(minX, rect.x_min)
      maxX = Math.max(maxX, rect.x_max)
      minY = Math.min(minY, rect.y_min)
      maxY = Math.max(maxY, rect.y_max)
    })
    
    // If discovered areas cover the entire grid (with small margin for rounding)
    const margin = 50 // Small margin for rounding errors
    const coversFullGrid = 
      minX <= margin && 
      maxX >= gridWidth - margin && 
      minY <= margin && 
      maxY >= gridHeight - margin
    
    return coversFullGrid
  }, [visibilityData, discoveredRects, gridWidth, gridHeight])

  // Calculate fog bounds - cover entire grid with padding (in grid coordinates)
  const fogBounds = useMemo(() => {
    const padding = 1000
    return {
      x: -padding,
      y: -padding,
      width: gridWidth + padding * 2,
      height: gridHeight + padding * 2,
    }
  }, [gridWidth, gridHeight])

  // If user has full visibility, don't render fog at all
  if (hasFullVisibility) {
    return null
  }

  // If no visibility data, render full fog
  if (!visibilityData || discoveredRects.length === 0) {
    return (
      <rect
        x={fogBounds.x}
        y={fogBounds.y}
        width={fogBounds.width}
        height={fogBounds.height}
        fill="#000000"
        opacity={0.85}
      />
    )
  }

  return (
    <>
      <defs>
        {/* Blur filter for soft edges on the mask */}
        <filter id="fogMaskBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      
      {/* Build mask - white = fog shows, black = fog hidden */}
      <mask id="fogMask">
        {/* Start with white everywhere (fog shows everywhere by default) */}
        <rect x={fogBounds.x} y={fogBounds.y} width={fogBounds.width} height={fogBounds.height} fill="white" />
        
        {/* Paint discovered areas BLACK (fog hidden) with blur for soft edges */}
        <g filter="url(#fogMaskBlur)">
          {discoveredRects.map((rect, idx) => (
            <rect
              key={`mask-discovered-${idx}`}
              x={rect.x_min}
              y={rect.y_min}
              width={rect.x_max - rect.x_min}
              height={rect.y_max - rect.y_min}
              fill="black"
            />
          ))}
        </g>
      </mask>
      
      {/* Render fog covering entire grid - more opaque */}
      <rect
        x={fogBounds.x}
        y={fogBounds.y}
        width={fogBounds.width}
        height={fogBounds.height}
        fill="#000000"
        opacity={0.85}
        mask="url(#fogMask)"
        style={{ pointerEvents: 'none' }}
      />
    </>
  )
}
