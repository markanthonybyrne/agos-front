import { useMemo } from 'react'

interface GridOverlayProps {
  width: number
  height: number
  scale?: number
  normalizedZoom?: number  // Normalized zoom (0.0-1.0) for dynamic spacing
  viewportBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

/**
 * GridOverlay - Transparent grid overlay with blue lines and coordinate labels
 * 
 * Features:
 * - Main solid blue lines forming large squares
 * - Plus signs (+) at main grid intersections
 * - Dashed blue lines subdividing into smaller squares
 * - Coordinate labels at edges
 * - Semi-transparent for underlying content visibility
 */
export function GridOverlay({ 
  width, 
  height, 
  scale = 1,
  normalizedZoom,
  viewportBounds
}: GridOverlayProps) {
  // Dynamic grid spacing based on normalized zoom
  // At universe view (0.0): large spacing (500 units)
  // At system view (1.0): small spacing (10 units)
  const baseSpacing = 500
  const minSpacing = 10
  const dynamicSpacing = normalizedZoom !== undefined
    ? baseSpacing - (normalizedZoom * (baseSpacing - minSpacing))
    : 100
  
  // Grid spacing - main grid lines
  const MAIN_GRID_SPACING = dynamicSpacing
  // Sub-grid spacing - dashed lines (1/4 of main spacing)
  const SUB_GRID_SPACING = dynamicSpacing / 4
  
  // Calculate visible grid lines based on viewport (for performance)
  const visibleGridLines = useMemo(() => {
    if (!viewportBounds) {
      // If no viewport bounds, show all lines
      return {
        mainVertical: Array.from({ length: Math.ceil(width / MAIN_GRID_SPACING) + 1 }, (_, i) => i * MAIN_GRID_SPACING),
        mainHorizontal: Array.from({ length: Math.ceil(height / MAIN_GRID_SPACING) + 1 }, (_, i) => i * MAIN_GRID_SPACING),
        subVertical: Array.from({ length: Math.ceil(width / SUB_GRID_SPACING) + 1 }, (_, i) => i * SUB_GRID_SPACING),
        subHorizontal: Array.from({ length: Math.ceil(height / SUB_GRID_SPACING) + 1 }, (_, i) => i * SUB_GRID_SPACING)
      }
    }
    
    // Calculate visible range with some padding
    const padding = 50
    const minX = Math.max(0, Math.floor((viewportBounds.minX - padding) / SUB_GRID_SPACING) * SUB_GRID_SPACING)
    const maxX = Math.min(width, Math.ceil((viewportBounds.maxX + padding) / SUB_GRID_SPACING) * SUB_GRID_SPACING)
    const minY = Math.max(0, Math.floor((viewportBounds.minY - padding) / SUB_GRID_SPACING) * SUB_GRID_SPACING)
    const maxY = Math.min(height, Math.ceil((viewportBounds.maxY + padding) / SUB_GRID_SPACING) * SUB_GRID_SPACING)
    
    const mainVertical: number[] = []
    const mainHorizontal: number[] = []
    const subVertical: number[] = []
    const subHorizontal: number[] = []
    
    // Main grid lines
    for (let x = Math.floor(minX / MAIN_GRID_SPACING) * MAIN_GRID_SPACING; x <= maxX; x += MAIN_GRID_SPACING) {
      if (x >= 0 && x <= width) mainVertical.push(x)
    }
    for (let y = Math.floor(minY / MAIN_GRID_SPACING) * MAIN_GRID_SPACING; y <= maxY; y += MAIN_GRID_SPACING) {
      if (y >= 0 && y <= height) mainHorizontal.push(y)
    }
    
    // Sub-grid lines (skip main grid lines to avoid duplication)
    for (let x = Math.floor(minX / SUB_GRID_SPACING) * SUB_GRID_SPACING; x <= maxX; x += SUB_GRID_SPACING) {
      if (x >= 0 && x <= width && x % MAIN_GRID_SPACING !== 0) subVertical.push(x)
    }
    for (let y = Math.floor(minY / SUB_GRID_SPACING) * SUB_GRID_SPACING; y <= maxY; y += SUB_GRID_SPACING) {
      if (y >= 0 && y <= height && y % MAIN_GRID_SPACING !== 0) subHorizontal.push(y)
    }
    
    return { mainVertical, mainHorizontal, subVertical, subHorizontal }
  }, [width, height, viewportBounds])

  // Calculate intersection points for plus signs
  const intersections = useMemo(() => {
    const points: Array<{ x: number; y: number }> = []
    
    visibleGridLines.mainVertical.forEach(x => {
      visibleGridLines.mainHorizontal.forEach(y => {
        points.push({ x, y })
      })
    })
    
    return points
  }, [visibleGridLines])

  // Calculate visible coordinate labels
  const coordinateLabels = useMemo(() => {
    if (!viewportBounds) return [] // Show labels at all zoom levels
    
    const labels: Array<{ x: number; y: number; type: 'x' | 'y'; value: number; position: 'top' | 'bottom' | 'left' | 'right' }> = []
    const labelSpacing = MAIN_GRID_SPACING * 2 // Show labels every 200 units
    const labelOffset = 5 // Offset from edge for visibility
    
    // X-axis labels along top edge (if visible in viewport)
    if (viewportBounds.minY <= labelOffset + 15) {
      for (let x = Math.floor(viewportBounds.minX / labelSpacing) * labelSpacing; x <= viewportBounds.maxX; x += labelSpacing) {
        if (x >= 0 && x <= width && x >= viewportBounds.minX && x <= viewportBounds.maxX) {
          labels.push({ x, y: labelOffset + 12, type: 'x', value: x, position: 'top' })
        }
      }
    }
    
    // X-axis labels along bottom edge (if visible in viewport)
    if (viewportBounds.maxY >= height - labelOffset - 15) {
      for (let x = Math.floor(viewportBounds.minX / labelSpacing) * labelSpacing; x <= viewportBounds.maxX; x += labelSpacing) {
        if (x >= 0 && x <= width && x >= viewportBounds.minX && x <= viewportBounds.maxX) {
          labels.push({ x, y: height - labelOffset, type: 'x', value: x, position: 'bottom' })
        }
      }
    }
    
    // Y-axis labels along left edge (if visible in viewport)
    if (viewportBounds.minX <= labelOffset + 40) {
      for (let y = Math.floor(viewportBounds.minY / labelSpacing) * labelSpacing; y <= viewportBounds.maxY; y += labelSpacing) {
        if (y >= 0 && y <= height && y >= viewportBounds.minY && y <= viewportBounds.maxY) {
          labels.push({ x: labelOffset, y, type: 'y', value: y, position: 'left' })
        }
      }
    }
    
    // Y-axis labels along right edge (if visible in viewport)
    if (viewportBounds.maxX >= width - labelOffset - 40) {
      for (let y = Math.floor(viewportBounds.minY / labelSpacing) * labelSpacing; y <= viewportBounds.maxY; y += labelSpacing) {
        if (y >= 0 && y <= height && y >= viewportBounds.minY && y <= viewportBounds.maxY) {
          labels.push({ x: width - labelOffset, y, type: 'y', value: y, position: 'right' })
        }
      }
    }
    
    return labels
  }, [width, height, viewportBounds])

  return (
    <g className="grid-overlay" opacity={0.6}>
      {/* Sub-grid lines (dashed, smaller squares) */}
      <g className="sub-grid" opacity={0.4}>
        {visibleGridLines.subVertical.map(x => (
          <line
            key={`sub-v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="rgba(25, 234, 253, 0.8)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
        {visibleGridLines.subHorizontal.map(y => (
          <line
            key={`sub-h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="rgba(25, 234, 253, 0.8)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
      </g>

      {/* Main grid lines (solid, larger squares) - REMOVED per user request */}
      {/* Plus signs at main grid intersections - REMOVED per user request */}

      {/* Coordinate labels */}
      {coordinateLabels.length > 0 && (
        <g className="coordinate-labels" opacity={0.6}>
          {coordinateLabels.map((label, index) => (
            <text
              key={`label-${label.type}-${label.value}-${label.position}-${index}`}
              x={label.x}
              y={label.y}
              textAnchor={
                label.type === 'x' ? 'middle' : 
                label.position === 'left' ? 'start' : 'end'
              }
              dominantBaseline={
                label.type === 'y' ? 'middle' : 
                label.position === 'top' ? 'hanging' : 'alphabetic'
              }
              fontSize="9"
              fill="rgba(173, 216, 230, 0.85)"
              fontFamily="monospace"
              fontWeight="500"
              className="select-none"
              style={{ pointerEvents: 'none' }}
            >
              {label.type === 'x' ? `X: ${label.value}` : `Y: ${label.value}`}
            </text>
          ))}
        </g>
      )}
    </g>
  )
}

