import { useMemo } from 'react'

interface GalaxyGridOverlayProps {
  /**
   * Width and height in percentage (100 = full container)
   */
  width?: number
  height?: number
}

/**
 * GalaxyGridOverlay - Grid overlay for GalaxyView component
 * 
 * Uses percentage-based coordinates to match GalaxyView's positioning system
 * Features:
 * - Main solid blue lines
 * - Plus signs at intersections
 * - Dashed sub-grid lines
 * - Semi-transparent for underlying content visibility
 */
export function GalaxyGridOverlay({ 
  width = 100, 
  height = 100 
}: GalaxyGridOverlayProps) {
  // Grid spacing - main grid lines every 10% (10 units out of 100)
  const MAIN_GRID_SPACING = 10
  // Sub-grid spacing - dashed lines every 2.5% (2.5 units out of 100)
  const SUB_GRID_SPACING = 2.5
  
  // Calculate grid lines
  const gridLines = useMemo(() => {
    const mainVertical: number[] = []
    const mainHorizontal: number[] = []
    const subVertical: number[] = []
    const subHorizontal: number[] = []
    
    // Main grid lines
    for (let i = 0; i <= width; i += MAIN_GRID_SPACING) {
      mainVertical.push(i)
    }
    for (let i = 0; i <= height; i += MAIN_GRID_SPACING) {
      mainHorizontal.push(i)
    }
    
    // Sub-grid lines (skip main grid lines)
    for (let i = 0; i <= width; i += SUB_GRID_SPACING) {
      if (i % MAIN_GRID_SPACING !== 0) {
        subVertical.push(i)
      }
    }
    for (let i = 0; i <= height; i += SUB_GRID_SPACING) {
      if (i % MAIN_GRID_SPACING !== 0) {
        subHorizontal.push(i)
      }
    }
    
    // Calculate intersection points for plus signs
    const intersections: Array<{ x: number; y: number }> = []
    mainVertical.forEach(x => {
      mainHorizontal.forEach(y => {
        intersections.push({ x, y })
      })
    })
    
    return { mainVertical, mainHorizontal, subVertical, subHorizontal, intersections }
  }, [width, height])

  return (
    <g className="galaxy-grid-overlay" opacity={0.6}>
      {/* Sub-grid lines (dashed, smaller squares) */}
      <g className="sub-grid" opacity={0.4}>
        {gridLines.subVertical.map(x => (
          <line
            key={`sub-v-${x}`}
            x1={`${x}%`}
            y1="0%"
            x2={`${x}%`}
            y2="100%"
            stroke="rgba(25, 234, 253, 0.8)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
        {gridLines.subHorizontal.map(y => (
          <line
            key={`sub-h-${y}`}
            x1="0%"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="rgba(25, 234, 253, 0.8)"
            strokeWidth={0.5}
            strokeDasharray="2,3"
          />
        ))}
      </g>

      {/* Main grid lines (solid, larger squares) */}
      <g className="main-grid" opacity={0.9}>
        {gridLines.mainVertical.map(x => (
          <line
            key={`main-v-${x}`}
            x1={`${x}%`}
            y1="0%"
            x2={`${x}%`}
            y2="100%"
            stroke="rgba(25, 234, 253, 1)"
            strokeWidth={1.5}
          />
        ))}
        {gridLines.mainHorizontal.map(y => (
          <line
            key={`main-h-${y}`}
            x1="0%"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="rgba(25, 234, 253, 1)"
            strokeWidth={1.5}
          />
        ))}
      </g>

      {/* Plus signs at main grid intersections */}
      <g className="grid-intersections">
        {gridLines.intersections.map(({ x, y }) => (
          <g key={`intersection-${x}-${y}`} transform={`translate(${x}%, ${y}%)`}>
            <line
              x1="-0.4%"
              y1="0%"
              x2="0.4%"
              y2="0%"
              stroke="rgba(25, 234, 253, 1)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1="0%"
              y1="-0.4%"
              x2="0%"
              y2="0.4%"
              stroke="rgba(25, 234, 253, 1)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    </g>
  )
}

