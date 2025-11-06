import { useMemo, useEffect } from 'react'
import { useGetVisibilityQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { DiscoveryStatus } from '@/types/api.types'

interface FogOfWarLayerProps {
  /**
   * Grid dimensions (2000×2000)
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
 * FogOfWarLayer - Renders dark cloudy overlay for undiscovered areas
 * Uses visibility data from API to determine what's visible
 * 
 * NEW APPROACH: Render fog directly in hidden areas instead of using masks
 */
export function FogOfWarLayer({
  gridWidth,
  gridHeight,
  viewportBounds,
  scale
}: FogOfWarLayerProps) {
  // Debug: Log component mount (only on initial mount, not every render)
  useEffect(() => {
    console.log('[FogOfWar] Component mounted', { gridWidth, gridHeight })
  }, [])
  
  const { data: visibilityData, isLoading: isLoadingVisibility, error: visibilityError } = useGetVisibilityQuery()
  const { data: mapData } = useGetMapQuery({})

  // Debug: Log visibility data (only once when it changes)
  useEffect(() => {
    if (visibilityData) {
      console.log('[FogOfWar] Visibility data received:', {
        visibility_level: visibilityData.visibility_level,
        visible_regions_count: visibilityData.visible_regions?.length || 0,
        visible_systems_count: visibilityData.visible_systems?.length || 0,
        visible_regions: visibilityData.visible_regions,
        visible_systems: visibilityData.visible_systems,
      })
    }
    if (visibilityError) {
      console.error('[FogOfWar] Visibility query error:', visibilityError)
    }
  }, [visibilityData, visibilityError])

  // Calculate discovered areas as rectangles
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

    return rects
  }, [visibilityData])
  
  // Log discovered rects info separately (after calculation, with viewport info)
  useEffect(() => {
    if (discoveredRects.length > 0) {
      const rectInfo = discoveredRects.map(r => {
        const width = r.x_max - r.x_min
        const height = r.y_max - r.y_min
        const area = width * height
        const mapArea = gridWidth * gridHeight
        const percentage = (area / mapArea * 100).toFixed(1)
        const viewportArea = (viewportBounds.maxX - viewportBounds.minX) * (viewportBounds.maxY - viewportBounds.minY)
        const intersectionWidth = Math.max(0, Math.min(r.x_max, viewportBounds.maxX) - Math.max(r.x_min, viewportBounds.minX))
        const intersectionHeight = Math.max(0, Math.min(r.y_max, viewportBounds.maxY) - Math.max(r.y_min, viewportBounds.minY))
        const intersectionArea = intersectionWidth * intersectionHeight
        const viewportCoverage = viewportArea > 0 ? ((intersectionArea / viewportArea) * 100).toFixed(1) : '0'
        return {
          x_range: `${r.x_min.toFixed(0)}-${r.x_max.toFixed(0)} (width: ${width.toFixed(0)})`,
          y_range: `${r.y_min.toFixed(0)}-${r.y_max.toFixed(0)} (height: ${height.toFixed(0)})`,
          status: r.status,
          covers: `${percentage}% of entire map`,
          coversViewport: `${viewportCoverage}% of visible viewport`,
          viewportBounds: `${viewportBounds.minX.toFixed(0)},${viewportBounds.minY.toFixed(0)} to ${viewportBounds.maxX.toFixed(0)},${viewportBounds.maxY.toFixed(0)}`
        }
      })
      console.log('[FogOfWar] Discovered rects info:', discoveredRects.length, rectInfo)
    } else if (visibilityData) {
      console.log('[FogOfWar] No discovered rects - will show full fog')
    }
  }, [discoveredRects, gridWidth, gridHeight, viewportBounds])

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

  // Create cloud-like turbulence pattern for organic fog appearance
  // Using a more reliable approach that creates visible cloud texture
  const createCloudFilter = (id: string, baseFrequency: number = 0.01) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      {/* Create turbulence for cloud-like texture - lower frequency for larger clouds */}
      <feTurbulence
        type="fractalNoise"
        baseFrequency={baseFrequency}
        numOctaves="4"
        seed="2"
        result="turbulence"
      />
      {/* Blur the turbulence significantly to create soft, organic cloud shapes */}
      <feGaussianBlur in="turbulence" stdDeviation="20" result="blurredTurbulence" />
      {/* Use the turbulence as an alpha mask to create varying opacity */}
      <feColorMatrix
        in="blurredTurbulence"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.8 0.2"
        result="alphaMask"
      />
      {/* Apply the alpha mask to the source graphic */}
      <feComposite
        in="SourceGraphic"
        in2="alphaMask"
        operator="in"
      />
      {/* Final blur for soft, feathered edges */}
      <feGaussianBlur stdDeviation="10" />
    </filter>
  )

  // Debug: Log rendering state when visibility data changes
  useEffect(() => {
    if (visibilityData) {
      console.log('[FogOfWar] Rendering state:', {
        hasVisibilityData: !!visibilityData,
        discoveredRectsCount: discoveredRects.length,
        willShowFullFog: !visibilityData || discoveredRects.length === 0,
      })
    }
  }, [visibilityData, discoveredRects.length])

  // Calculate viewport coverage - extend beyond grid bounds to cover entire viewport
  const fogBounds = useMemo(() => {
    // Extend fog to cover entire viewport, with some padding
    const padding = 500 // Extra padding to ensure full coverage
    return {
      x: Math.min(viewportBounds.minX - padding, 0),
      y: Math.min(viewportBounds.minY - padding, 0),
      width: Math.max(viewportBounds.maxX + padding, gridWidth) - Math.min(viewportBounds.minX - padding, 0),
      height: Math.max(viewportBounds.maxY + padding, gridHeight) - Math.min(viewportBounds.minY - padding, 0),
    }
  }, [viewportBounds, gridWidth, gridHeight])

  // If no visibility data, render full fog (everything is hidden)
  // Also render full fog if visibility data exists but nothing is discovered yet
  if (!visibilityData || discoveredRects.length === 0) {
    console.log('[FogOfWar] Rendering FULL fog - no visibility data or no discovered areas')
    return (
      <>
        <defs>
          {/* Rich, dark nebula-like gradient with multiple color stops - much darker and more visible */}
          <radialGradient id="fogGradient-full" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#5B2A0A" stopOpacity={1.0} /> {/* Very dark brown/orange */}
            <stop offset="25%" stopColor="#3A1C0A" stopOpacity={1.0} /> {/* Very dark rust brown */}
            <stop offset="50%" stopColor="#0F2F0F" stopOpacity={1.0} /> {/* Very dark green */}
            <stop offset="75%" stopColor="#051F1F" stopOpacity={1.0} /> {/* Very dark blue */}
            <stop offset="100%" stopColor="#000000" stopOpacity={1.0} /> {/* Deep black */}
          </radialGradient>
          {createCloudFilter('fogCloud-full', 0.012)}
        </defs>
        <rect
          x={fogBounds.x}
          y={fogBounds.y}
          width={fogBounds.width}
          height={fogBounds.height}
          fill="url(#fogGradient-full)"
          opacity={0.9}
          filter="url(#fogCloud-full)"
        />
      </>
    )
  }

  console.log('[FogOfWar] Rendering fog - SIMPLE APPROACH: fog everywhere, then clear discovered areas')

  return (
    <>
      <defs>
        {/* Rich, dark nebula-like gradient for hidden areas - much darker and more visible */}
        <radialGradient id="fogGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#5B2A0A" stopOpacity={1.0} /> {/* Very dark brown/orange */}
          <stop offset="25%" stopColor="#3A1C0A" stopOpacity={1.0} /> {/* Very dark rust brown */}
          <stop offset="50%" stopColor="#0F2F0F" stopOpacity={1.0} /> {/* Very dark green */}
          <stop offset="75%" stopColor="#051F1F" stopOpacity={1.0} /> {/* Very dark blue */}
          <stop offset="100%" stopColor="#000000" stopOpacity={1.0} /> {/* Deep black */}
        </radialGradient>
        
        {/* Lighter gradient for fogged (partially visible) areas */}
        <radialGradient id="foggedGradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#4A4A2A" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#3A3A3A" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#2A2A2A" stopOpacity={0.55} />
        </radialGradient>

        {/* Cloud filters for organic appearance */}
        {createCloudFilter('fogCloud', 0.012)}
        {createCloudFilter('fogCloudSoft', 0.01)}
      </defs>
      
      {/* Build a proper mask that cuts out discovered areas */}
      {/* SVG mask: white = visible (fog shows), black = hidden (fog hidden) */}
      {/* We want: fog shows in undiscovered areas (white), fog hidden in discovered areas (black) */}
      <mask id="fogMask">
        {/* Start with white everywhere in viewport (fog shows everywhere by default) */}
        <rect x={fogBounds.x} y={fogBounds.y} width={fogBounds.width} height={fogBounds.height} fill="white" />
        {/* Paint discovered areas BLACK (fog hidden in discovered areas) */}
        {discoveredRects.map((rect, idx) => {
          const width = rect.x_max - rect.x_min
          const height = rect.y_max - rect.y_min
          const featherSize = Math.min(width, height) * 0.1
          
          return (
            <g key={`mask-discovered-${idx}`}>
              {/* Main discovered area - black (fog hidden) */}
              <rect
                x={rect.x_min + featherSize}
                y={rect.y_min + featherSize}
                width={width - featherSize * 2}
                height={height - featherSize * 2}
                fill="black"
              />
              {/* Feathered edges for smooth transition from white (fog) to black (no fog) */}
              <defs>
                <linearGradient id={`maskEdgeTop-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="black" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`maskEdgeBottom-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="black" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`maskEdgeLeft-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="black" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`maskEdgeRight-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="black" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
              </defs>
              <rect
                x={rect.x_min}
                y={rect.y_min}
                width={width}
                height={featherSize}
                fill={`url(#maskEdgeTop-${idx})`}
              />
              <rect
                x={rect.x_min}
                y={rect.y_max - featherSize}
                width={width}
                height={featherSize}
                fill={`url(#maskEdgeBottom-${idx})`}
              />
              <rect
                x={rect.x_min}
                y={rect.y_min}
                width={featherSize}
                height={height}
                fill={`url(#maskEdgeLeft-${idx})`}
              />
              <rect
                x={rect.x_max - featherSize}
                y={rect.y_min}
                width={featherSize}
                height={height}
                fill={`url(#maskEdgeRight-${idx})`}
              />
            </g>
          )
        })}
      </mask>
      
      {/* Render fog covering entire viewport, using mask to hide it in discovered areas */}
      {/* White in mask = fog shows, Black in mask = fog hidden */}
      {/* The mask only applies to the grid area, but fog extends to cover viewport */}
      <rect
        x={fogBounds.x}
        y={fogBounds.y}
        width={fogBounds.width}
        height={fogBounds.height}
        fill="url(#fogGradient)"
        opacity={0.9}
        filter="url(#fogCloud)"
        mask="url(#fogMask)"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* For fogged areas (partially visible), add a lighter fog overlay */}
      {discoveredRects
        .filter(rect => rect.status === 'fogged')
        .map((rect, idx) => {
          const width = rect.x_max - rect.x_min
          const height = rect.y_max - rect.y_min
          const featherSize = Math.min(width, height) * 0.15
          
          return (
            <rect
              key={`fogged-${idx}`}
              x={rect.x_min + featherSize}
              y={rect.y_min + featherSize}
              width={width - featherSize * 2}
              height={height - featherSize * 2}
              fill="url(#foggedGradient)"
              opacity={0.4}
              filter="url(#fogCloudSoft)"
            />
          )
        })}
    </>
  )
}
