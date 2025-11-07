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
  initialScale?: number // Initial/default zoom scale to show "You are here" indicator
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
  homeSystem,
  initialScale
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
    // Sort systems so home system is rendered last (appears on top)
    const sortedSystems = [...visibleSystems].sort((a, b) => {
      const aIsHome = homeSystem && a.region === homeSystem.region && a.system === homeSystem.system
      const bIsHome = homeSystem && b.region === homeSystem.region && b.system === homeSystem.system
      if (aIsHome && !bIsHome) return 1 // Home system comes after
      if (!aIsHome && bIsHome) return -1 // Non-home comes before
      return 0 // Keep original order for others
    })
    
    return sortedSystems.map(system => {
      const isHovered = hoveredSystem?.region === system.region && 
                       hoveredSystem?.system === system.system
      
      // Check if this is the user's home system
      const isHomeSystem = homeSystem && 
                          system.region === homeSystem.region && 
                          system.system === homeSystem.system
      
      // Home system uses green dot, all others use cyan (game branding color)
      const systemColor = isHomeSystem ? '#00FF00' : '#00FFFF'
      const cyanGlowColor = 'rgba(0, 255, 255, 0.2)'
      
      // Check if this is a key system (has a name or contains a homeworld)
      const isKeySystem = system.name !== null || 
                         system.planets.some(p => p.state === 'homeworld')
      
      // Marker size scales with zoom and system importance
      // Home system is always larger and more prominent
      // At default zoom: 100% larger (2x), at 33% zoom: 100% larger (2x), at other zooms: 50% larger (1.5x)
      let baseSize = isHomeSystem ? 6 : (isKeySystem ? 4 : 3)
      
      // Apply size multiplier for home system based on zoom level
      if (isHomeSystem && initialScale) {
        const zoomRatio = scale / initialScale
        const isDefaultZoom = Math.abs(scale - initialScale) < initialScale * 0.15
        const is33PercentZoom = Math.abs(zoomRatio - 0.33) < 0.05 // Within 5% tolerance of 33% zoom
        
        if (isDefaultZoom || is33PercentZoom) {
          baseSize = baseSize * 2.0 // 100% larger at default zoom or 33% zoom
        } else {
          baseSize = baseSize * 1.5 // 50% larger at other zoom levels
        }
      }
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
          
          {/* System marker dot - home system uses green, others use cyan */}
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
                ? `drop-shadow(0 0 4px #00FF00) drop-shadow(0 0 2px rgba(0, 255, 0, 0.3))`
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
          
          {/* "You are here" indicator - shown at all zoom levels */}
          {isHomeSystem && (
            <g className="you-are-here-indicator" pointerEvents="none">
              {/* Arrow pointing down */}
              <path
                d={`M ${system.center.x} ${system.center.y - markerSize - 40} 
                    L ${system.center.x - 8} ${system.center.y - markerSize - 20} 
                    L ${system.center.x + 8} ${system.center.y - markerSize - 20} Z`}
                fill="#00FFFF"
                stroke="#00FFFF"
                strokeWidth={1.5}
                opacity={0.9}
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 2px rgba(0, 255, 255, 0.6))'
                }}
              />
              {/* Vertical line connecting arrow to marker */}
              <line
                x1={system.center.x}
                y1={system.center.y - markerSize - 20}
                x2={system.center.x}
                y2={system.center.y - markerSize - 4}
                stroke="#00FFFF"
                strokeWidth={2}
                opacity={0.7}
                strokeDasharray="3 3"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.6))'
                }}
              />
              {/* "You are here" text with glass background and cut corner */}
              {/* Main background with cut corner effect (10px x 10px notch on bottom-right) */}
              {/* Box: 100px wide, 20px high (top: y-68, bottom: y-48) */}
              {/* Path goes clockwise: top-left -> top-right -> right edge (down to cut start) -> cut (left then up) -> right edge continues -> bottom-left -> close */}
              <path
                d={`M ${system.center.x - 50} ${system.center.y - markerSize - 68} 
                    L ${system.center.x + 50} ${system.center.y - markerSize - 68} 
                    L ${system.center.x + 50} ${system.center.y - markerSize - 58} 
                    L ${system.center.x + 40} ${system.center.y - markerSize - 58} 
                    L ${system.center.x + 40} ${system.center.y - markerSize - 48} 
                    L ${system.center.x - 50} ${system.center.y - markerSize - 48} Z`}
                fill="rgba(28, 32, 36, 0.85)"
                stroke="rgba(0, 255, 255, 0.3)"
                strokeWidth={1}
                strokeLinejoin="miter"
                strokeLinecap="butt"
                style={{
                  filter: 'blur(0.5px)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              />
              {/* Cyan glowing stripe at top - 2px */}
              <line
                x1={system.center.x - 50}
                y1={system.center.y - markerSize - 68}
                x2={system.center.x + 50}
                y2={system.center.y - markerSize - 68}
                stroke="#00FFFF"
                strokeWidth={2}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 5px rgba(0, 255, 255, 0.7)) drop-shadow(0 0 2px rgba(0, 255, 255, 0.5))',
                  opacity: 0.9
                }}
              />
              {/* Glass overlay for depth - also with cut corner (top 10px only) */}
              <path
                d={`M ${system.center.x - 50} ${system.center.y - markerSize - 68} 
                    L ${system.center.x + 50} ${system.center.y - markerSize - 68} 
                    L ${system.center.x + 50} ${system.center.y - markerSize - 63} 
                    L ${system.center.x + 40} ${system.center.y - markerSize - 63} 
                    L ${system.center.x + 40} ${system.center.y - markerSize - 58} 
                    L ${system.center.x - 50} ${system.center.y - markerSize - 58} Z`}
                fill="rgba(255, 255, 255, 0.08)"
              />
              {/* Text - white, no glow */}
              <text
                x={system.center.x}
                y={system.center.y - markerSize - 56}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  pointerEvents: 'none'
                }}
              >
                You are here
              </text>
            </g>
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
  }, [visibleSystems, hoveredSystem, onSystemClick, onSystemRightClick, onSystemHover, scale, homeSystem, initialScale])
  
  return (
    <g className="system-markers-layer">
      {/* Markers are already sorted so home system renders last (on top) */}
      {markers}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const SystemMarkersLayer = memo(SystemMarkersLayerComponent)


