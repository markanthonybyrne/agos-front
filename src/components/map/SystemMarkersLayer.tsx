import { useMemo, memo } from 'react'
import { SystemData } from '@/lib/galaxyUtils'
import { getRegionSystemColor } from '@/lib/regionColors'

interface SystemMarkersLayerProps {
  systems: SystemData[]
  onSystemClick?: (system: SystemData) => void
  onSystemRightClick?: (system: SystemData, event: React.MouseEvent) => void
  hoveredSystem?: SystemData | null
  onSystemHover?: (system: SystemData | null) => void
  scale?: number // Current zoom scale for adjusting marker size
  showNames?: boolean // Whether to show system names (only after zooming into region)
  homeSystem?: SystemData | null // User's home system - always visible
}

/**
 * SystemMarkersLayer - Renders system markers (dots) and labels
 * 
 * Displays systems with:
 * - Cyan colored glowing dots (game branding color)
 * - Rectangular name boxes with cyan backgrounds
 * - Enhanced visibility when zoomed in
 */
function SystemMarkersLayerComponent({ 
  systems, 
  onSystemClick,
  onSystemRightClick,
  hoveredSystem,
  onSystemHover,
  scale = 1,
  showNames = false,
  viewportBounds,
  homeSystem
}: SystemMarkersLayerProps & { viewportBounds?: { minX: number; maxX: number; minY: number; maxY: number } }) {
  // Viewport culling - only render systems visible in viewport
  // ALWAYS include home system even if outside viewport
  const visibleSystems = useMemo(() => {
    if (!viewportBounds) return systems
    
    const viewportSystems = systems.filter(system => {
      // Always include home system
      if (homeSystem && system.region === homeSystem.region && system.system === homeSystem.system) {
        return true
      }
      
      const { x, y } = system.center
      // Add padding for smooth rendering during panning
      const padding = 50
      return (
        x >= viewportBounds.minX - padding &&
        x <= viewportBounds.maxX + padding &&
        y >= viewportBounds.minY - padding &&
        y <= viewportBounds.maxY + padding
      )
    })
    
    return viewportSystems
  }, [systems, viewportBounds, homeSystem])
  
  const markers = useMemo(() => {
    return visibleSystems.map(system => {
      const isHovered = hoveredSystem?.region === system.region && 
                       hoveredSystem?.system === system.system
      
      // Use cyan color for all system markers (game branding color)
      const systemColor = '#00FFFF'
      const cyanGlowColor = 'rgba(0, 255, 255, 0.2)'
      
      // Check if this is the user's home system
      const isHomeSystem = homeSystem && 
                          system.region === homeSystem.region && 
                          system.system === homeSystem.system
      
      // Check if this is a key system (has a name or contains a homeworld)
      const isKeySystem = system.name !== null || 
                         system.planets.some(p => p.state === 'homeworld')
      
      // Marker size scales with zoom and system importance
      // Home system is always larger and more prominent
      const baseSize = isHomeSystem ? 6 : (isKeySystem ? 4 : 3)
      const markerSize = isHovered 
        ? baseSize * 1.5 
        : baseSize * Math.min(1.2, 1 + (scale - 1) * 0.1)
      
      // Glow radius
      const glowRadius = markerSize * 2.5
      
      // System name - always show for home system, otherwise only after zooming into region
      // Don't show label on hover - we use the new glass tooltip instead
      const showName = isHomeSystem || showNames
      const systemLabel = isHomeSystem 
        ? 'Home System' 
        : (system.name || `System ${system.region}:${system.system}`)
      
      return (
        <g
          key={`system-${system.region}-${system.system}`}
          className="system-marker"
          onClick={(e) => {
            // Only handle left clicks
            if (e.button === 0 || e.type === 'click') {
              onSystemClick?.(system)
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSystemRightClick?.(system, e)
          }}
          onMouseEnter={() => onSystemHover?.(system)}
          onMouseLeave={() => onSystemHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Outer glow - enhanced for home system */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={isHomeSystem ? glowRadius * 1.5 : glowRadius}
            fill={isHomeSystem ? 'rgba(0, 255, 255, 0.4)' : cyanGlowColor}
            opacity={isHomeSystem ? 0.6 : (isHovered ? 0.3 : 0.15)}
            className="system-glow"
            style={{
              filter: isHomeSystem ? 'blur(1.5px)' : 'blur(1px)',
              transition: 'all 0.2s ease-in-out',
              animation: isHomeSystem ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          />
          
          {/* System marker dot - all systems use cyan color */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={markerSize}
            fill={systemColor}
            stroke="none"
            strokeWidth={0}
            className="system-dot"
            style={{
              filter: isHomeSystem
                ? `drop-shadow(0 0 4px #00FFFF) drop-shadow(0 0 2px rgba(0, 255, 255, 0.3))`
                : (isHovered 
                  ? `drop-shadow(0 0 3px #00FFFF) drop-shadow(0 0 1px rgba(255, 255, 255, 0.3))`
                  : `drop-shadow(0 0 1.5px #00FFFF)`),
              transition: 'all 0.2s ease-in-out'
            }}
          />
          
          {/* Home system indicator ring */}
          {isHomeSystem && (
            <circle
              cx={system.center.x}
              cy={system.center.y}
              r={markerSize + 4}
              fill="none"
              stroke="#00FFFF"
              strokeWidth={2}
              strokeDasharray="4 4"
              opacity={0.8}
              style={{
                animation: 'rotate 3s linear infinite',
                transformOrigin: `${system.center.x}px ${system.center.y}px`
              }}
            />
          )}
          
          {/* System name label with glass effect */}
          {showName && (
            <g className="system-label">
              {/* Background rectangle with glass effect - calculate width based on text length */}
              <rect
                x={system.center.x - (systemLabel.length * 3.2 + 4)}
                y={system.center.y + markerSize + 4}
                width={(systemLabel.length * 6.4) + 8}
                height={14}
                fill="rgba(28, 32, 36, 0.75)"
                opacity={0.9}
                stroke={isHomeSystem ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'}
                strokeWidth={isHomeSystem ? 1.5 : 1}
                rx={0}
                className="system-label-bg"
                style={{
                  filter: 'blur(0.5px)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
              {/* Glass overlay for depth */}
              <rect
                x={system.center.x - (systemLabel.length * 3.2 + 4)}
                y={system.center.y + markerSize + 4}
                width={(systemLabel.length * 6.4) + 8}
                height={7}
                fill="rgba(255, 255, 255, 0.08)"
                rx={0}
                style={{
                  pointerEvents: 'none'
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
                  textShadow: '0 0 3px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.8)',
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
  }, [visibleSystems, hoveredSystem, onSystemClick, onSystemRightClick, onSystemHover, scale, homeSystem])
  
  return (
    <g className="system-markers-layer">
      {markers}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const SystemMarkersLayer = memo(SystemMarkersLayerComponent)


