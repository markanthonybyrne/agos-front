import { useMemo, memo } from 'react'
import { Planet } from '@/types/api.types'
import { SystemData, calculateOrbitRadius, calculateOrbitAngle } from '@/lib/systemUtils'
import { getPlanetXY } from '@/lib/coordinates'
import { getPlanetImage, solImg } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'

interface SystemViewProps {
  system: SystemData
  scale: number
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
  hoveredPlanet?: Planet | null
  className?: string
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
  className = ''
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
  const uniqueOrbitRadii = useMemo(() => {
    const radii = new Set<number>()
    planetOrbits.forEach(orbit => {
      // Round to nearest 5 to group similar orbits
      const roundedRadius = Math.round(orbit.radius / 5) * 5
      if (roundedRadius > 0) {
        radii.add(roundedRadius)
      }
    })
    return Array.from(radii).sort((a, b) => a - b)
  }, [planetOrbits])
  
  // Determine star size based on zoom scale - use logarithmic scaling for smoother growth
  // Like Google Earth: elements grow gradually, not linearly
  // At 352% (scale 3.52), stars should be visible but not overwhelming
  const logScale = Math.log10(Math.max(1, scale * 10)) // Logarithmic scaling
  const starSize = scale < 0.5 
    ? Math.max(6, Math.min(12, logScale * 8))
    : Math.max(12, Math.min(35, logScale * 10)) // Capped at 35px even at high zoom
  
  // Determine planet size based on zoom scale - logarithmic scaling
  const basePlanetSize = scale < 0.5
    ? Math.max(6, Math.min(12, logScale * 6))
    : Math.max(12, Math.min(25, logScale * 8)) // Capped at 25px even at high zoom
  
  return (
    <g className={cn('system-view', className)}>
      {/* Orbit lines - dashed circles around central star */}
      {/* Only show orbit lines at planet level zoom (scale >= 3.0) */}
      {scale >= 3.0 && uniqueOrbitRadii.map((radius, index) => (
        <circle
          key={`orbit-${system.key}-${radius}-${index}`}
          cx={system.center.x}
          cy={system.center.y}
          r={radius}
          fill="none"
          stroke="rgba(100, 200, 255, 0.5)"
          strokeWidth={1.5}
          strokeDasharray="4,4"
          className="orbit-line"
          style={{ opacity: 0.6 }}
        />
      ))}
      
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
          href={solImg}
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
              className="fill-blue-300 font-mono font-semibold"
              style={{ 
                fontSize: `${Math.max(7, Math.min(9, logScale * 2.5))}px`, // Much smaller text for system level
                textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              Planet {system.key}
            </text>
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
        const planetImage = getPlanetImage(planetSlug)
        const isHovered = hoveredPlanet?.id === planet.id
        const planetSize = isHovered ? basePlanetSize * 1.2 : basePlanetSize
        
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
                  className={cn(
                    'planet-image transition-all',
                    isHovered && 'scale-110'
                  )}
                  style={{ 
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none'
                  }}
                />
              </>
            )}
            {/* Planet label - only show at planet level zoom (scale >= 3.0) */}
            {scale >= 3.0 && (
              <g>
                <text
                  x={planetXY.x}
                  y={planetXY.y + planetSize / 2 + 12}
                  textAnchor="middle"
                  className="fill-white font-mono font-semibold"
                  style={{ 
                    fontSize: `${Math.max(7, Math.min(9, logScale * 2.5))}px`, // Much smaller text for planet level
                    textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
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
                    fontSize: `${Math.max(6, Math.min(8, logScale * 2))}px`, // Much smaller text for planet level
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
  return (
    prevProps.system.key === nextProps.system.key &&
    Math.abs(prevProps.scale - nextProps.scale) < 0.1 && // Only re-render if scale changes by >10%
    prevProps.hoveredPlanet?.id === nextProps.hoveredPlanet?.id
  )
})

// Export original for backward compatibility
export { SystemView }

