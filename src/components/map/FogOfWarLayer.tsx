import { useMemo } from 'react'
import { useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { getQuadrantXyRange, getSectorXyRange, getGalaxyXyRange, isPointInRange, type XYRanges } from '@/lib/coordinateUtils'

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

  // Calculate discovered areas as rectangles
  const discoveredRects = useMemo(() => {
    if (!visibilityData) return []

    const rects: XYRanges[] = []

    // Quadrant visibility
    if (visibilityData.visible_quadrants && Array.isArray(visibilityData.visible_quadrants)) {
      visibilityData.visible_quadrants.forEach((q: any) => {
        const quadrantId = typeof q === 'number' ? q : q.quadrant
        if (quadrantId) {
          const range = getQuadrantXyRange(quadrantId)
          rects.push(range)
        }
      })
    }

    // Sector visibility
    if (visibilityData.visible_sectors && Array.isArray(visibilityData.visible_sectors)) {
      visibilityData.visible_sectors.forEach((s: any) => {
        const quadrantId = typeof s === 'object' ? s.quadrant : undefined
        const sectorId = typeof s === 'object' ? s.sector : undefined
        if (quadrantId && sectorId) {
          const range = getSectorXyRange(quadrantId, sectorId)
          rects.push(range)
        }
      })
    }

    // Galaxy visibility (most detailed)
    if (visibilityData.visible_galaxies && Array.isArray(visibilityData.visible_galaxies)) {
      visibilityData.visible_galaxies.forEach((g: any) => {
        const quadrantId = typeof g === 'object' ? g.quadrant : undefined
        const sectorId = typeof g === 'object' ? g.sector : undefined
        const galaxyId = typeof g === 'object' ? g.galaxy : undefined
        if (quadrantId && sectorId && galaxyId) {
          const range = getGalaxyXyRange(quadrantId, sectorId, galaxyId)
          rects.push(range)
        }
      })
    }

    return rects
  }, [visibilityData])

  // Create SVG mask for fog of war
  const fogPaths = useMemo(() => {
    if (discoveredRects.length === 0) {
      // Everything is fogged
      return (
        <rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="url(#fogGradient)"
          opacity={0.85}
        />
      )
    }

    // Create a path that covers everything except discovered areas
    // We'll use multiple rectangles to create the fog effect
    const paths: JSX.Element[] = []

    // Create fog rectangles that cover gaps between discovered areas
    // For simplicity, we'll cover the entire grid and then "cut out" discovered areas
    // This is easier than trying to create complex paths

    return (
      <>
        {/* Base fog covering everything */}
        <rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="url(#fogGradient)"
          opacity={0.85}
          mask="url(#discoveredMask)"
        />
        {/* Mask that reveals discovered areas */}
        <defs>
          <mask id="discoveredMask">
            {/* Start with black (fogged) */}
            <rect x={0} y={0} width={gridWidth} height={gridHeight} fill="black" />
            {/* White areas (revealed) for discovered regions */}
            {discoveredRects.map((rect, idx) => (
              <rect
                key={idx}
                x={rect.x_min}
                y={rect.y_min}
                width={rect.x_max - rect.x_min}
                height={rect.y_max - rect.y_min}
                fill="white"
              />
            ))}
          </mask>
        </defs>
      </>
    )
  }, [discoveredRects, gridWidth, gridHeight])

  // Only render if viewport intersects with grid
  const shouldRender = useMemo(() => {
    return viewportBounds.maxX > 0 &&
           viewportBounds.minX < gridWidth &&
           viewportBounds.maxY > 0 &&
           viewportBounds.minY < gridHeight
  }, [viewportBounds, gridWidth, gridHeight])

  if (!shouldRender || discoveredRects.length === 0) {
    // If no visibility data, everything is fogged
    return (
      <svg
        className="absolute pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1000,
          top: 0,
          left: 0
        }}
        viewBox={`0 0 ${gridWidth} ${gridHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
            <stop offset="50%" stopColor="#1a1a1a" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.9} />
          </linearGradient>
          <filter id="fogBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>
        <rect
          x={0}
          y={0}
          width={gridWidth}
          height={gridHeight}
          fill="url(#fogGradient)"
          opacity={0.85}
          filter="url(#fogBlur)"
        />
      </svg>
    )
  }

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1000,
        top: 0,
        left: 0
      }}
      viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
          <stop offset="50%" stopColor="#1a1a1a" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.9} />
        </linearGradient>
        <filter id="fogBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <mask id="discoveredMask">
          {/* Start with black (fogged) */}
          <rect x={0} y={0} width={gridWidth} height={gridHeight} fill="black" />
          {/* White areas (revealed) for discovered regions */}
          {discoveredRects.map((rect, idx) => (
            <rect
              key={idx}
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
    </svg>
  )
}

