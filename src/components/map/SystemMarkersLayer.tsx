import { useMemo, memo } from 'react'
import { SystemData } from '@/lib/galaxyUtils'
import { getRegionSystemColor } from '@/lib/regionColors'

interface SystemMarkersLayerProps {
  systems: SystemData[]
  onSystemClick?: (system: SystemData) => void
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
 * - Colored glowing dots matching region colors
 * - Rectangular name boxes with region-colored backgrounds
 * - Enhanced visibility when zoomed in
 */
function SystemMarkersLayerComponent({ 
  systems, 
  onSystemClick,
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
      
      // Get region color for this system
      const regionColor = getRegionSystemColor(system.region)
      
      // Extract RGB for glow effect
      const rgbMatch = regionColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      const glowColor = rgbMatch 
        ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.6)`
        : 'rgba(255, 255, 255, 0.4)'
      
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
      // Always show on hover, but otherwise only if showNames is true
      const showName = isHomeSystem || showNames || isHovered
      const systemLabel = isHomeSystem 
        ? 'Home System' 
        : (system.name || `System ${system.region}:${system.system}`)
      
      return (
        <g
          key={`system-${system.region}-${system.system}`}
          className="system-marker"
          onClick={() => onSystemClick?.(system)}
          onMouseEnter={() => onSystemHover?.(system)}
          onMouseLeave={() => onSystemHover?.(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Outer glow - enhanced for home system */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={isHomeSystem ? glowRadius * 1.5 : glowRadius}
            fill={isHomeSystem ? 'rgba(0, 255, 255, 0.8)' : glowColor}
            opacity={isHomeSystem ? 1.0 : (isHovered ? 0.8 : 0.5)}
            className="system-glow"
            style={{
              filter: isHomeSystem ? 'blur(3px)' : 'blur(2px)',
              transition: 'all 0.2s ease-in-out',
              animation: isHomeSystem ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          />
          
          {/* System marker dot - special styling for home system */}
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={markerSize}
            fill={isHomeSystem ? '#00FFFF' : regionColor}
            stroke={isHomeSystem ? '#FFFFFF' : (isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)')}
            strokeWidth={isHomeSystem ? 3 : (isHovered ? 2 : 1.5)}
            className="system-dot"
            style={{
              filter: isHomeSystem
                ? `drop-shadow(0 0 10px #00FFFF) drop-shadow(0 0 5px rgba(0, 255, 255, 0.8))`
                : (isHovered 
                  ? `drop-shadow(0 0 6px ${regionColor}) drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))`
                  : `drop-shadow(0 0 3px ${regionColor})`),
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
          
          {/* System name label in colored rectangular box */}
          {showName && (
            <g className="system-label">
              {/* Background rectangle - calculate width based on text length */}
              <rect
                x={system.center.x - (systemLabel.length * 3.2 + 4)}
                y={system.center.y + markerSize + 4}
                width={(systemLabel.length * 6.4) + 8}
                height={14}
                fill={isHomeSystem ? '#00FFFF' : regionColor}
                opacity={isHomeSystem ? 1.0 : 0.95}
                stroke={isHomeSystem ? '#FFFFFF' : (isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)')}
                strokeWidth={isHomeSystem ? 2 : (isHovered ? 1.5 : 1)}
                rx={2}
                className="system-label-bg"
                style={{
                  filter: isHomeSystem 
                    ? `drop-shadow(0 0 6px #00FFFF) drop-shadow(0 0 3px rgba(0, 255, 255, 0.8))`
                    : (isHovered ? `drop-shadow(0 0 4px ${regionColor})` : `drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))`),
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
  }, [visibleSystems, hoveredSystem, onSystemClick, onSystemHover, scale, homeSystem])
  
  return (
    <g className="system-markers-layer">
      {markers}
    </g>
  )
}

// Memoize component to prevent unnecessary re-renders
export const SystemMarkersLayer = memo(SystemMarkersLayerComponent)


