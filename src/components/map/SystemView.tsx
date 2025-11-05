import { useMemo, memo } from 'react'
import { Planet } from '@/types/api.types'
import { SystemData, calculateOrbitRadius, calculateOrbitAngle } from '@/lib/systemUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { getPlanetImage, getRandomSolImageForSystem, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { getOrbitLineOpacity, getOrbitLineWidth } from '@/lib/zoomLevels'

interface SystemViewProps {
  system: SystemData
  scale: number
  normalizedZoom?: number  // Optional normalized zoom (0.0-1.0)
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
  hoveredPlanet?: Planet | null
  className?: string
  systemName?: string | null
}

/**
 * SystemView - Renders a system with central star and orbiting planets
 * 
 * Features:
 * - Central star at system center (using sol.png)
 * - Orbit lines (dashed circles) based on planet distances
 * - Planets positioned in orbits around central star
 * - System coordinate label
 */
function SystemView({
  system,
  scale,
  normalizedZoom,
  onPlanetClick,
  onPlanetHover,
  hoveredPlanet,
  className = '',
  systemName
}: SystemViewProps) {
  // Use normalized zoom if provided, otherwise calculate from scale
  const effectiveNormalizedZoom = normalizedZoom ?? (() => {
    const minScale = 0.01
    const maxScale = 7.0
    return Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)))
  })()
  // Calculate orbit information for each planet
  const planetOrbits = useMemo(() => {
    return system.planets.map(planet => {
      const planetXY = getPlanetXY(planet)
      if (!planetXY) return null
      
      const radius = calculateOrbitRadius(planetXY, system.center)
      const angle = calculateOrbitAngle(planetXY, system.center)
      
      return {
        planet,
        planetXY,
        radius,
        angle
      }
    }).filter((orbit): orbit is NonNullable<typeof orbit> => orbit !== null)
  }, [system.planets, system.center])
  
  // Get orbit radii for drawing orbit lines
  // At high zoom, show individual orbit lines for each planet to ensure accuracy
  const uniqueOrbitRadii = useMemo(() => {
    // At higher zoom levels (scale >= 1.0), show exact orbits for each planet
    // This ensures planets align perfectly with their orbit lines
    if (scale >= 1.0) {
      // High zoom: show exact orbit for each planet (no grouping)
      return planetOrbits.map(orbit => orbit.radius).sort((a, b) => a - b)
    }
    
    // At lower zoom levels, group similar orbits to reduce visual clutter
    const radii = new Set<number>()
    const groupingThreshold = scale >= 0.5 ? 10  // Medium zoom: group every 10 units
      : 5                                          // Low zoom: group every 5 units
    
    planetOrbits.forEach(orbit => {
      // Round to nearest threshold to group similar orbits
      const roundedRadius = Math.round(orbit.radius / groupingThreshold) * groupingThreshold
      if (roundedRadius > 0) {
        radii.add(roundedRadius)
      }
    })
    return Array.from(radii).sort((a, b) => a - b)
  }, [planetOrbits, scale])
  
  // Calculate asset sizes based on normalized zoom (0.0-1.0)
  // Smooth scaling: linear interpolation between min and max based on zoom
  // Star (sol) size scaling
  // At universe view (0.0): small (6px)
  // At system view (1.0): large (80px)
  const starSize = useMemo(() => {
    const minSize = 6
    const maxSize = 80
    const size = minSize + (effectiveNormalizedZoom * (maxSize - minSize))
    return Math.max(minSize, Math.min(maxSize, size))
  }, [effectiveNormalizedZoom])
  
  // Planet size scaling
  // At universe view (0.0): tiny (4px)
  // At system view (1.0): visible (35px)
  const basePlanetSize = useMemo(() => {
    const minSize = 4
    const maxSize = 35
    const size = minSize + (effectiveNormalizedZoom * (maxSize - minSize))
    return Math.max(minSize, Math.min(maxSize, size))
  }, [effectiveNormalizedZoom])
  
  return (
    <g className={cn('system-view', className)}>
      {/* Orbit lines - dashed circles around central star */}
      {/* Orbit lines fade in starting at zoom 0.7, fully visible at 0.75-1.00 */}
      {(() => {
        const orbitOpacity = getOrbitLineOpacity(effectiveNormalizedZoom)
        const orbitWidth = getOrbitLineWidth(effectiveNormalizedZoom)
        
        if (orbitOpacity <= 0) return null
        
        return uniqueOrbitRadii.map((radius, index) => {
          // Use actual radius - the SVG transform will handle scaling
          // Don't scale the radius here as it's already in the coordinate space
          
          return (
            <circle
              key={`orbit-${system.key}-${radius}-${index}`}
              cx={system.center.x}
              cy={system.center.y}
              r={radius}
              fill="none"
              stroke="rgba(100, 200, 255, 0.5)"
              strokeWidth={orbitWidth}
              strokeDasharray="4,4"
              className="orbit-line"
              style={{ 
                opacity: orbitOpacity,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          )
        })
      })()}
      
      {/* Central star */}
      <g className="central-star">
        {/* Star glow effect - larger at higher zoom */}
        <circle
          cx={system.center.x}
          cy={system.center.y}
          r={starSize * 1.3}
          fill={`url(#starGradient-${system.key})`}
          className="star-glow"
          style={{ opacity: 0.7 }}
        />
        <circle
          cx={system.center.x}
          cy={system.center.y}
          r={starSize}
          fill={`url(#starGradient-${system.key})`}
          className="star-glow"
        />
        <image
          href={getRandomSolImageForSystem(system.key)}
          x={system.center.x - starSize}
          y={system.center.y - starSize}
          width={starSize * 2}
          height={starSize * 2}
          className="star-image"
          style={{ filter: 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.8))' }}
        />
        {/* System label - show from galaxy view (0.5) through system view, hide at planet level to reduce clutter */}
        {effectiveNormalizedZoom >= 0.5 && effectiveNormalizedZoom < 0.85 && (
          <g>
            <text
              x={system.center.x}
              y={system.center.y - starSize - 6}
              textAnchor="middle"
              className="fill-cyan-300 font-mono font-semibold"
              style={{ 
                fontSize: `${Math.max(7, Math.min(9, 7 + effectiveNormalizedZoom * 2))}px`,
                textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              {(systemName && systemName.trim()) || system.key}
            </text>
            {(!systemName || !systemName.trim()) && (
              <text
                x={system.center.x}
                y={system.center.y - starSize + 6}
                textAnchor="middle"
                className="fill-blue-400 font-mono"
                style={{ 
                  fontSize: `${Math.max(6, Math.min(8, 6 + effectiveNormalizedZoom * 2))}px`,
                  textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                }}
              >
                {system.key}
              </text>
            )}
          </g>
        )}
      </g>
      
      {/* Planets in orbit - show at all zoom levels where systems are visible */}
      {/* Planets use their actual X/Y coordinates which already place them in orbits around their sol */}
      {scale >= 0.1 && planetOrbits.map(({ planet, planetXY }) => {
        // Get planet image, but ensure we never use sol images for planets
        let planetSlug = planet.type?.slug
        // If planet type is sol-related, fall back to default planet image
        if (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
            planetSlug === 'sol_massive' || planetSlug === 'sol-massive') {
          planetSlug = undefined // Will fall back to aridImg
        }
        
        // For asteroid belt planets, use random asteroid images from universe folder
        let planetImage: string | undefined
        if (planetSlug === 'asteroid' || planetSlug === 'asteroid_belt' || planetSlug === 'asteroid-belt') {
          planetImage = getRandomAsteroidImageForPlanet(planet.coordinate)
        } else {
          planetImage = getPlanetImage(planetSlug)
        }
        const isHovered = hoveredPlanet?.id === planet.id
        // Keep planet size constant to prevent jumping on hover
        const planetSize = basePlanetSize
        
        return (
          <g
            key={planet.id}
            className={cn(
              'planet-orbit',
              isHovered && 'planet-hovered',
              planet.owner_empire_id && 'planet-colonized'
            )}
            onClick={() => onPlanetClick?.(planet)}
            onMouseEnter={() => onPlanetHover?.(planet)}
            onMouseLeave={() => onPlanetHover?.(null)}
            style={{ cursor: 'pointer' }}
          >
            {planetImage && (
              <>
                {/* Planet glow on hover */}
                {isHovered && (
                  <circle
                    cx={planetXY.x}
                    cy={planetXY.y}
                    r={planetSize * 0.7}
                    fill="rgba(255, 255, 255, 0.2)"
                    className="planet-glow"
                  />
                )}
                <image
                  href={planetImage}
                  x={planetXY.x - planetSize / 2}
                  y={planetXY.y - planetSize / 2}
                  width={planetSize}
                  height={planetSize}
                  className="planet-image"
                  style={{ 
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none'
                  }}
                />
              </>
            )}
            {/* Planet label - show based on normalized zoom */}
            {/* At 0.75-0.85 normalized zoom, show labels normally */}
            {(effectiveNormalizedZoom >= 0.75 && effectiveNormalizedZoom < 0.85) && (
              <g>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 12}
                  textAnchor="middle"
                  className="fill-white font-mono font-semibold"
                  style={{ 
                    fontSize: `${Math.max(6, Math.min(8, 6 + effectiveNormalizedZoom * 2))}px`,
                    textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  Planet {formatCoordinate(planet.coordinate)}
                </text>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 22}
                  textAnchor="middle"
                  className="fill-gray-300 font-mono"
                  style={{ 
                    fontSize: `${Math.max(5, Math.min(7, 5 + effectiveNormalizedZoom * 1.5))}px`,
                    textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {formatCoordinate(planet.coordinate)}
                </text>
              </g>
            )}
            {/* At 0.85+ normalized zoom, only show labels on hover to reduce clutter */}
            {effectiveNormalizedZoom >= 0.85 && isHovered && (
              <g>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 14}
                  textAnchor="middle"
                  className="fill-white font-mono font-semibold"
                  style={{ 
                    fontSize: '7px',
                    textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  Planet {formatCoordinate(planet.coordinate)}
                </text>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 24}
                  textAnchor="middle"
                  className="fill-gray-300 font-mono"
                  style={{ 
                    fontSize: '6px',
                    textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {formatCoordinate(planet.coordinate)}
                </text>
              </g>
            )}
          </g>
        )
      })}
      
      {/* Gradient definition for star glow */}
      <defs>
        <radialGradient id={`starGradient-${system.key}`}>
          <stop offset="0%" stopColor="#ffff00" stopOpacity="0.8" />
          <stop offset="30%" stopColor="#ffaa00" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  )
}

// Memoize SystemView to prevent unnecessary re-renders during zoom
export const SystemViewMemo = memo(SystemView, (prevProps, nextProps) => {
  // Only re-render if scale changes significantly or system data changes
  // More aggressive memoization to reduce re-renders during panning
  const scaleChanged = Math.abs(prevProps.scale - nextProps.scale) >= 0.2
  const normalizedZoomChanged = prevProps.normalizedZoom !== undefined && 
    nextProps.normalizedZoom !== undefined &&
    Math.abs(prevProps.normalizedZoom - nextProps.normalizedZoom) >= 0.05
  
  return (
    prevProps.system.key === nextProps.system.key &&
    !scaleChanged &&
    !normalizedZoomChanged &&
    prevProps.hoveredPlanet?.id === nextProps.hoveredPlanet?.id &&
    prevProps.system.planets.length === nextProps.system.planets.length && // Check if planets changed
    prevProps.systemName === nextProps.systemName // Check if system name changed
  )
})

// Export original for backward compatibility
export { SystemView }

