import { useMemo, useState } from 'react'
import { SystemData } from '@/lib/galaxyUtils'

interface SystemMarkersLayerProps {
  systems: SystemData[]
  onSystemClick?: (system: SystemData) => void
  hoveredSystem?: SystemData | null
  onSystemHover?: (system: SystemData | null) => void
}

/**
 * SystemMarkersLayer - Renders system markers (dots) and labels
 * 
 * Displays systems as orange/red dots with labels for named systems.
 * Matches the reference image style with key systems highlighted.
 */
export function SystemMarkersLayer({ 
  systems, 
  onSystemClick,
  hoveredSystem,
  onSystemHover
}: SystemMarkersLayerProps) {
  const markers = useMemo(() => {
    return systems.map(system => {
      const isHovered = hoveredSystem?.region === system.region && 
                       hoveredSystem?.system === system.system
      
      // Check if this is a key system (has a name or contains a homeworld)
      const isKeySystem = system.name !== null || 
                         system.planets.some(p => p.state === 'homeworld')
      
      // Color: orange for key systems, red for others
      const markerColor = isKeySystem ? '#FF8C00' : '#FF4444'
      const markerSize = isHovered ? 6 : (isKeySystem ? 5 : 4)
      
      return (
        <g
          key={`system-${system.region}-${system.system}`}
          className="system-marker"
          onClick={() => onSystemClick?.(system)}
          onMouseEnter={() => onSystemHover?.(system)}
          onMouseLeave={() => onSystemHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* System marker dot */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={markerSize}
            fill={markerColor}
            stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
            strokeWidth={isHovered ? 1.5 : 1}
            className="system-dot"
            style={{
              filter: isHovered ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
          />
          {/* System name label - show for named systems or key systems */}
          {(system.name || isKeySystem) && (
            <text
              x={system.center.x}
              y={system.center.y + (isKeySystem ? 18 : 15)}
              textAnchor="middle"
              className="fill-white font-semibold pointer-events-none"
              style={{
                fontSize: isKeySystem ? '11px' : '9px',
                textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)',
                pointerEvents: 'none',
                opacity: isHovered ? 1 : 0.9
              }}
            >
              {system.name || `System ${system.region}:${system.system}`}
            </text>
          )}
        </g>
      )
    })
  }, [systems, hoveredSystem, onSystemClick, onSystemHover])
  
  return (
    <g className="system-markers-layer">
      {markers}
    </g>
  )
}


