import { useMemo } from 'react'
import { SystemData } from '@/lib/galaxyUtils'
import { getRegionSystemColor } from '@/lib/regionColors'

interface SystemMarkersLayerProps {
  systems: SystemData[]
  onSystemClick?: (system: SystemData) => void
  hoveredSystem?: SystemData | null
  onSystemHover?: (system: SystemData | null) => void
  scale?: number // Current zoom scale for adjusting marker size
  showNames?: boolean // Whether to show system names (only after zooming into region)
}

/**
 * SystemMarkersLayer - Renders system markers (dots) and labels
 * 
 * Displays systems with:
 * - Colored glowing dots matching region colors
 * - Rectangular name boxes with region-colored backgrounds
 * - Enhanced visibility when zoomed in
 */
export function SystemMarkersLayer({ 
  systems, 
  onSystemClick,
  hoveredSystem,
  onSystemHover,
  scale = 1,
  showNames = false
}: SystemMarkersLayerProps) {
  const markers = useMemo(() => {
    return systems.map(system => {
      const isHovered = hoveredSystem?.region === system.region && 
                       hoveredSystem?.system === system.system
      
      // Get region color for this system
      const regionColor = getRegionSystemColor(system.region)
      
      // Extract RGB for glow effect
      const rgbMatch = regionColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      const glowColor = rgbMatch 
        ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.6)`
        : 'rgba(255, 255, 255, 0.4)'
      
      // Check if this is a key system (has a name or contains a homeworld)
      const isKeySystem = system.name !== null || 
                         system.planets.some(p => p.state === 'homeworld')
      
      // Marker size scales with zoom and system importance
      const baseSize = isKeySystem ? 4 : 3
      const markerSize = isHovered 
        ? baseSize * 1.5 
        : baseSize * Math.min(1.2, 1 + (scale - 1) * 0.1)
      
      // Glow radius
      const glowRadius = markerSize * 2.5
      
      // System name - only show after user has clicked to zoom into a region
      // Always show on hover, but otherwise only if showNames is true
      const showName = showNames || isHovered
      const systemLabel = system.name || `System ${system.region}:${system.system}`
      
      return (
        <g
          key={`system-${system.region}-${system.system}`}
          className="system-marker"
          onClick={() => onSystemClick?.(system)}
          onMouseEnter={() => onSystemHover?.(system)}
          onMouseLeave={() => onSystemHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Outer glow */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={glowRadius}
            fill={glowColor}
            opacity={isHovered ? 0.8 : 0.5}
            className="system-glow"
            style={{
              filter: 'blur(2px)',
              transition: 'all 0.2s ease-in-out'
            }}
          />
          
          {/* System marker dot */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={markerSize}
            fill={regionColor}
            stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
            strokeWidth={isHovered ? 2 : 1.5}
            className="system-dot"
            style={{
              filter: isHovered 
                ? `drop-shadow(0 0 6px ${regionColor}) drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))`
                : `drop-shadow(0 0 3px ${regionColor})`,
              transition: 'all 0.2s ease-in-out'
            }}
          />
          
          {/* System name label in colored rectangular box */}
          {showName && (
            <g className="system-label">
              {/* Background rectangle - calculate width based on text length */}
              <rect
                x={system.center.x - (systemLabel.length * 3.2 + 4)}
                y={system.center.y + markerSize + 4}
                width={(systemLabel.length * 6.4) + 8}
                height={14}
                fill={regionColor}
                opacity={0.95}
                stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
                strokeWidth={isHovered ? 1.5 : 1}
                rx={2}
                className="system-label-bg"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 4px ${regionColor})` : `drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))`,
                  transition: 'all 0.2s ease-in-out'
                }}
              />
              {/* Text */}
              <text
                x={system.center.x}
                y={system.center.y + markerSize + 13}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white font-semibold pointer-events-none"
                style={{
                  fontSize: isKeySystem ? '10px' : '9px',
                  fontWeight: isKeySystem ? '600' : '500',
                  textShadow: '0 0 2px rgba(0, 0, 0, 0.9), 0 0 1px rgba(0, 0, 0, 0.7)',
                  pointerEvents: 'none',
                  opacity: 1
                }}
              >
                {systemLabel}
              </text>
            </g>
          )}
        </g>
      )
    })
  }, [systems, hoveredSystem, onSystemClick, onSystemHover, scale])
  
  return (
    <g className="system-markers-layer">
      {markers}
    </g>
  )
}


