import { useMemo, memo } from 'react'
import { Planet } from '@/types/api.types'
import { SystemData, calculateOrbitRadius, calculateOrbitAngle } from '@/lib/systemUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { getPlanetImage, getRandomSolImageForSystem, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'

interface SystemViewProps {
  system: SystemData
  scale: number
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
  onPlanetClick,
  onPlanetHover,
  hoveredPlanet,
  className = '',
  systemName
}: SystemViewProps) {
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
  
  // Get unique orbit radii for drawing orbit lines
  // At high zoom levels, reduce orbit line density to prevent visual clutter
  const uniqueOrbitRadii = useMemo(() => {
    const radii = new Set<number>()
    // Adjust grouping threshold based on zoom level - larger threshold at high zoom
    const groupingThreshold = scale >= 7.0 ? 20  // Very high zoom: group every 20 units
      : scale >= 5.0 ? 15                         // High zoom: group every 15 units
      : scale >= 3.0 ? 10                         // Medium-high: group every 10 units
      : 5                                          // Normal: group every 5 units
    
    planetOrbits.forEach(orbit => {
      // Round to nearest threshold to group similar orbits
      const roundedRadius = Math.round(orbit.radius / groupingThreshold) * groupingThreshold
      if (roundedRadius > 0) {
        radii.add(roundedRadius)
      }
    })
    return Array.from(radii).sort((a, b) => a - b)
  }, [planetOrbits, scale])
  
  // Determine star size based on zoom scale - use logarithmic scaling for smoother growth
  // Like Google Earth: elements grow gradually, not linearly
  // At 352% (scale 3.52), stars should be visible but not overwhelming
  const logScale = Math.log10(Math.max(1, scale * 10)) // Logarithmic scaling
  const starSize = scale < 0.5 
    ? Math.max(6, Math.min(12, logScale * 8))
    : scale >= 7.0 ? 80  // Much larger at 700% zoom
    : scale >= 6.0 ? 65  // Large at 600% zoom
    : scale >= 5.0 ? 50  // Larger at 500% zoom
    : scale >= 4.0 ? 40  // Increased at 400% zoom
    : Math.max(12, Math.min(35, logScale * 10)) // Standard scaling below 400%
  
  // Determine planet size based on zoom scale - logarithmic scaling
  // At very high zoom (700%+), reduce planet size slightly to reduce visual clutter
  const basePlanetSize = scale < 0.5
    ? Math.max(6, Math.min(12, logScale * 6))
    : scale >= 7.0 ? 35  // Slightly smaller at 700% to reduce clutter
    : scale >= 6.0 ? 40  // Large at 600% zoom
    : scale >= 5.0 ? 32  // Larger at 500% zoom
    : scale >= 4.0 ? 28  // Increased at 400% zoom
    : Math.max(12, Math.min(25, logScale * 8)) // Standard scaling below 400%
  
  return (
    <g className={cn('system-view', className)}>
      {/* Orbit lines - dashed circles around central star */}
      {/* Show orbit lines at system level zoom (scale >= 1.57, which is 157%) */}
      {/* At very high zoom (700%+), reduce orbit line opacity and thickness to reduce clutter */}
      {scale >= 1.57 && uniqueOrbitRadii.map((radius, index) => {
        // Reduce orbit line stroke width at very high zoom to prevent visual clutter
        const orbitStrokeWidth = scale >= 7.0 ? 1.5  // Thinner at 700%+
          : scale >= 6.0 ? 2
          : scale >= 5.0 ? 2.5
          : scale >= 4.0 ? 2.5
          : 1.5
        
        // Reduce opacity at very high zoom levels
        const orbitOpacity = scale >= 7.0 ? 0.25  // Very transparent at 700%+
          : scale >= 6.0 ? 0.35
          : scale >= 5.0 ? 0.4
          : scale >= 4.0 ? 0.45
          : 0.6
        
        return (
          <circle
            key={`orbit-${system.key}-${radius}-${index}`}
            cx={system.center.x}
            cy={system.center.y}
            r={radius}
            fill="none"
            stroke="rgba(100, 200, 255, 0.5)"
            strokeWidth={orbitStrokeWidth}
            strokeDasharray={scale >= 7.0 ? "8,8" : "4,4"}  // Longer dashes at high zoom
            className="orbit-line"
            style={{ opacity: orbitOpacity }}
          />
        )
      })}
      
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
        {/* System label - show at system level zoom (0.5-3.0), hide at planet level to reduce clutter */}
        {scale >= 0.5 && scale < 3.0 && (
          <g>
            <text
              x={system.center.x}
              y={system.center.y - starSize - 6}
              textAnchor="middle"
              className="fill-cyan-300 font-mono font-semibold"
              style={{ 
                fontSize: `${Math.max(7, Math.min(9, logScale * 2.5))}px`, // Much smaller text for system level
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
                  fontSize: `${Math.max(6, Math.min(8, logScale * 2))}px`, // Much smaller text for system level
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
            {/* Planet label - only show at planet level zoom (scale >= 3.0) */}
            {/* At 300-400% zoom, show labels normally */}
            {(scale >= 3.0 && scale < 4.0) && (
              <g>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 12}
                  textAnchor="middle"
                  className="fill-white font-mono font-semibold"
                  style={{ 
                    fontSize: `${Math.max(6, Math.min(8, logScale * 2))}px`,
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
                    fontSize: `${Math.max(5, Math.min(7, logScale * 1.5))}px`,
                    textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {formatCoordinate(planet.coordinate)}
                </text>
              </g>
            )}
            {/* At 400%+ zoom, only show labels on hover to reduce clutter */}
            {(scale >= 4.0 && scale < 7.0) && isHovered && (
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
            {/* At 700%+ zoom, only show labels on hover to prevent clutter */}
            {scale >= 7.0 && isHovered && (
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
  return (
    prevProps.system.key === nextProps.system.key &&
    Math.abs(prevProps.scale - nextProps.scale) < 0.2 && // Only re-render if scale changes by >20%
    prevProps.hoveredPlanet?.id === nextProps.hoveredPlanet?.id &&
    prevProps.system.planets.length === nextProps.system.planets.length && // Check if planets changed
    prevProps.systemName === nextProps.systemName // Check if system name changed
  )
})

// Export original for backward compatibility
export { SystemView }

