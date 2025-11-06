import { useMemo } from 'react'
import { useGetVisibilityQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { DiscoveryStatus } from '@/types/api.types'

interface FogOfWarLayerProps {
  /**
   * Grid dimensions (1000×1000)
   */
  gridWidth: number
  gridHeight: number
  /**
   * Current viewport bounds (what's visible)
   */
  viewportBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  /**
   * Scale for rendering
   */
  scale: number
}

/**
 * FogOfWarLayer - Renders dark smog overlay for undiscovered areas
 * Uses visibility data from API to determine what's visible
 */
export function FogOfWarLayer({
  gridWidth,
  gridHeight,
  viewportBounds,
  scale
}: FogOfWarLayerProps) {
  const { data: visibilityData } = useGetVisibilityQuery()
  const { data: mapData } = useGetMapQuery({})

  // Calculate discovered areas as rectangles using region/system-based fog of war
  const discoveredRects = useMemo(() => {
    const rects: Array<{
      x_min: number
      x_max: number
      y_min: number
      y_max: number
      opacity: number
      status: DiscoveryStatus
    }> = []

    // Use new region/system visibility data if available
    if (visibilityData?.visible_regions && Array.isArray(visibilityData.visible_regions)) {
      visibilityData.visible_regions.forEach((region) => {
        if (region.discovery_status === 'visible' || region.discovery_status === 'fogged') {
          rects.push({
            x_min: region.x_range.min,
            x_max: region.x_range.max,
            y_min: region.y_range.min,
            y_max: region.y_range.max,
            opacity: region.discovery_status === 'visible' ? 1.0 : 0.6,
            status: region.discovery_status,
          })
        }
      })
    }

    // Also use system-level visibility (more granular)
    if (visibilityData?.visible_systems && Array.isArray(visibilityData.visible_systems)) {
      visibilityData.visible_systems.forEach((system) => {
        if (system.discovery_status === 'visible' || system.discovery_status === 'fogged') {
          rects.push({
            x_min: system.x_range.min,
            x_max: system.x_range.max,
            y_min: system.y_range.min,
            y_max: system.y_range.max,
            opacity: system.discovery_status === 'visible' ? 1.0 : 0.7,
            status: system.discovery_status,
          })
        }
      })
    }

    // Fallback to legacy quadrant/sector/galaxy visibility if new data not available
    if (rects.length === 0 && visibilityData) {
      // Quadrant visibility
      if (visibilityData.visible_quadrants && Array.isArray(visibilityData.visible_quadrants)) {
        // Import helper functions if needed for legacy support
        // For now, we'll just handle the new system
      }
    }

    return rects
  }, [visibilityData])

  // Calculate fog opacity based on discovery status
  const getFogOpacity = (status: DiscoveryStatus): number => {
    switch (status) {
      case 'visible':
        return 0.0 // No fog
      case 'fogged':
        return 0.4 // Partial fog
      case 'hidden':
        return 0.85 // Full fog
      default:
        return 0.85
    }
  }

  // Only render if viewport intersects with grid
  const shouldRender = useMemo(() => {
    return viewportBounds.maxX > 0 &&
           viewportBounds.minX < gridWidth &&
           viewportBounds.maxY > 0 &&
           viewportBounds.minY < gridHeight
  }, [viewportBounds, gridWidth, gridHeight])

  // If viewport doesn't intersect grid, don't render
  if (!shouldRender) {
    return null
  }

  // If no visibility data, render full fog (everything is hidden)
  // Also render full fog if visibility data exists but nothing is discovered yet
  if (!visibilityData || discoveredRects.length === 0) {
    return (
      <>
        <defs>
          <linearGradient id="fogGradient-full" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
            <stop offset="50%" stopColor="#1a1a1a" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.9} />
          </linearGradient>
          <filter id="fogBlur-full">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>
        <rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="url(#fogGradient-full)"
          opacity={0.85}
          filter="url(#fogBlur-full)"
        />
      </>
    )
  }

  return (
    <>
      <defs>
        <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
          <stop offset="50%" stopColor="#1a1a1a" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="foggedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#2a2a2a" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#1a1a1a" stopOpacity={0.6} />
        </linearGradient>
        <filter id="fogBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <mask id="discoveredMask">
          {/* Start with black (fogged) */}
          <rect x={0} y={0} width={gridWidth} height={gridHeight} fill="black" />
          {/* White areas (revealed) for discovered regions/systems */}
          {discoveredRects.map((rect, idx) => (
            <rect
              key={`visible-${idx}`}
              x={rect.x_min}
              y={rect.y_min}
              width={rect.x_max - rect.x_min}
              height={rect.y_max - rect.y_min}
              fill="white"
            />
          ))}
        </mask>
      </defs>
      {/* Base fog covering everything, masked by discovered areas */}
      <rect
        x={0}
        y={0}
        width={gridWidth}
        height={gridHeight}
        fill="url(#fogGradient)"
        opacity={0.85}
        mask="url(#discoveredMask)"
        filter="url(#fogBlur)"
      />
      {/* Overlay fogged areas with reduced opacity */}
      {discoveredRects
        .filter(rect => rect.status === 'fogged')
        .map((rect, idx) => (
          <rect
            key={`fogged-${idx}`}
            x={rect.x_min}
            y={rect.y_min}
            width={rect.x_max - rect.x_min}
            height={rect.y_max - rect.y_min}
            fill="url(#foggedGradient)"
            opacity={0.5}
            filter="url(#fogBlur)"
          />
        ))}
    </>
  )
}

