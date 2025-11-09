import { useMemo, memo } from 'react'
import { Planet } from '@/types/api.types'
import { SystemData } from '@/lib/systemUtils'
import { getPlanetImage, getRandomSolImageForSystem, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { getOrbitLineOpacity, getOrbitLineWidth } from '@/lib/zoomLevels'
import { isPlanetVisible } from '@/lib/visibilityUtils'
import { VisibilityResponse } from '@/types/api.types'

type DetailLevel = 'minimal' | 'standard' | 'full'

interface SystemViewProps {
  system: SystemData
  scale: number
  normalizedZoom?: number  // Optional normalized zoom (0.0-1.0)
  detailLevel?: DetailLevel  // Rendering detail level based on zoom
  onPlanetClick?: (planet: Planet) => void
  onPlanetHover?: (planet: Planet | null) => void
  hoveredPlanet?: Planet | null
  className?: string
  systemName?: string | null
  visibilityData?: VisibilityResponse // Visibility data for fog of war
  playerEmpireId?: number | null
  playerAvatarUrl?: string | null
}

export const BASE_ORBIT_RADIUS = 260
export const ORBIT_SPACING = 140

function hashAngle(seed: string, index: number, total: number): number {
  let hash = 0
  const combinedSeed = `${seed}-${index}-${total}`
  for (let position = 0; position < combinedSeed.length; position += 1) {
    hash = (hash << 5) - hash + combinedSeed.charCodeAt(position)
    hash |= 0
  }
  const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2
  const offset = ((hash % 360) / 360) * Math.PI * 2
  return baseAngle + offset
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
  detailLevel = 'full',
  onPlanetClick,
  onPlanetHover,
  hoveredPlanet,
  className = '',
  systemName,
  visibilityData,
  playerEmpireId,
  playerAvatarUrl,
}: SystemViewProps) {
  const effectiveNormalizedZoom = normalizedZoom ?? (() => {
    const minScale = 0.09
    const maxScale = 1.554
    return Math.max(0, Math.min(1, (scale - minScale) / (maxScale - minScale)))
  })()
 
  const planetLayout = useMemo(() => {
    const total = system.planets.length
    if (total === 0) return []

    return system.planets.map((planet, index) => {
      const radius = BASE_ORBIT_RADIUS + index * ORBIT_SPACING
      const angle = hashAngle(String(planet.id ?? planet.coordinate ?? index), index, total)
      const planetXY = {
        x: system.center.x + radius * Math.cos(angle),
        y: system.center.y + radius * Math.sin(angle),
      }

      return {
        planet,
        planetXY,
        radius,
        angle,
        index,
      }
    })
  }, [system.center, system.planets])
  
  // Calculate asset sizes based on normalized zoom (0.0-1.0)
  // Smooth scaling: linear interpolation between min and max based on zoom
  // Star (sol) size scaling - reduced at max zoom to prevent clustering
  // At sector view (0.0): small (6px)
  // At systems view (1.0): moderate (50px) - reduced from 80px to prevent clustering
  const starSize = useMemo(() => {
    const minSize = 6
    const maxSize = 50  // Reduced from 80px to prevent clustering at max zoom
    const size = minSize + (effectiveNormalizedZoom * (maxSize - minSize))
    return Math.max(minSize, Math.min(maxSize, size))
  }, [effectiveNormalizedZoom])
  
  // Planet size scaling - reduced at max zoom to prevent clustering
  // At sector view (0.0): tiny (4px)
  // At systems view (1.0): moderate (25px) - reduced from 35px to prevent clustering
  const basePlanetSize = useMemo(() => {
    const minSize = 4
    const maxSize = 25  // Reduced from 35px to prevent clustering at max zoom
    const size = minSize + (effectiveNormalizedZoom * (maxSize - minSize))
    return Math.max(minSize, Math.min(maxSize, size))
  }, [effectiveNormalizedZoom])
  
  return (
    <g className={cn('system-view', className)}>
      {/* Orbit lines - one dashed circle for each planet's orbit */}
      {/* Only render orbits at standard/full detail levels for performance */}
      {detailLevel !== 'minimal' && (() => {
        const orbitOpacity = getOrbitLineOpacity(effectiveNormalizedZoom)
        const orbitWidth = getOrbitLineWidth(effectiveNormalizedZoom)
        
        if (orbitOpacity <= 0) return null
        
        return planetLayout.map(({ radius, planet }) => {
          const animationDuration = 180 + radius * 0.15
          return (
            <circle
              key={`orbit-${system.key}-${planet.id}-${radius}`}
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
                transition: 'opacity 0.3s ease-in-out',
                animation: `orbit-dash-offset ${animationDuration}s linear infinite`,
                strokeDashoffset: 0
              }}
            />
          )
        }).filter(Boolean) // Remove any null entries
      })()}
      
      {/* Central star */}
      <g className="central-star">
        {/* Star glow effect - only at standard/full detail for performance */}
        {detailLevel !== 'minimal' && (
          <>
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
          </>
        )}
        {/* Minimal detail: simple circle, Standard/Full: star image */}
        {detailLevel === 'minimal' ? (
          <circle
            cx={system.center.x}
            cy={system.center.y}
            r={Math.max(4, starSize * 0.5)}
            fill="#ffaa00"
            className="star-simple"
            style={{ opacity: 0.9 }}
          />
        ) : (
          <image
            href={getRandomSolImageForSystem(system.key)}
            x={system.center.x - starSize}
            y={system.center.y - starSize}
            width={starSize * 2}
            height={starSize * 2}
            className="star-image"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.8))' }}
          />
        )}
        {/* System label - only show at standard/full detail */}
        {detailLevel !== 'minimal' && effectiveNormalizedZoom >= 0.5 && effectiveNormalizedZoom < 0.85 && (
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
      
      {/* Planets in orbit - show at ALL zoom levels (0% to 500%) */}
      {/* Planets use their actual X/Y coordinates which already place them in orbits around their sol */}
      {/* At high zoom (450%-500%), planets animate along their orbits */}
      {/* Performance optimization: render different detail levels based on zoom */}
      {planetLayout.map(({ planet, planetXY, index }) => {
        const planetKey =
          planet.id ??
          planet.coordinate ??
          `${system.key}-planet-${index}`
        const isHovered = hoveredPlanet?.id === planet.id
        const ownedByPlayer = Boolean(playerEmpireId) && (
          planet.owner_empire_id === playerEmpireId ||
          (planet.owner_empire_id === undefined && (planet.state === 'homeworld' || planet.state === 'colony'))
        )
        const avatarBadgeSize = Math.max(basePlanetSize * 0.55, 12)
        const avatarOffset = basePlanetSize * 0.68
        const avatarClipId = `planet-owner-avatar-${system.key}-${planet.id}`
        // Check if planet is visible for interaction
        const isPlanetVisibleForInteraction = isPlanetVisible(planet, visibilityData)
        
        // Planets stay static on their orbit rings (no animation)
        const currentPlanetX = planetXY.x
        const currentPlanetY = planetXY.y
        
        // Minimal detail: just a colored dot (fast rendering)
        if (detailLevel === 'minimal') {
          return (
            <circle
              key={`planet-min-${planetKey}`}
              cx={currentPlanetX}
              cy={currentPlanetY}
              r={Math.max(2, basePlanetSize * 0.3)}
              fill={planet.owner_empire_id ? 'rgba(34, 211, 238, 0.8)' : 'rgba(255, 255, 255, 0.6)'}
              className={cn('planet-dot', isHovered && 'planet-hovered')}
              onClick={() => {
                if (isPlanetVisibleForInteraction) {
                  onPlanetClick?.(planet)
                }
              }}
              onMouseEnter={() => {
                if (isPlanetVisibleForInteraction) {
                  onPlanetHover?.(planet)
                }
              }}
              onMouseLeave={() => onPlanetHover?.(null)}
              style={{ 
                cursor: isPlanetVisibleForInteraction ? 'pointer' : 'not-allowed',
                opacity: isPlanetVisibleForInteraction ? 1 : 0.3,
                filter: isPlanetVisibleForInteraction ? 'none' : 'brightness(0.3)'
              }}
            />
          )
        }
        
        // Standard/Full detail: planet images
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
        // Keep planet size constant to prevent jumping on hover
        const planetSize = basePlanetSize
        
        return (
          <g
            key={`planet-${planetKey}`}
            className={cn(
              'planet-orbit',
              isHovered && 'planet-hovered',
              planet.owner_empire_id && 'planet-colonized'
            )}
            onClick={() => {
              if (isPlanetVisibleForInteraction) {
                onPlanetClick?.(planet)
              }
            }}
            onMouseEnter={() => {
              if (isPlanetVisibleForInteraction) {
                onPlanetHover?.(planet)
              }
            }}
            onMouseLeave={() => onPlanetHover?.(null)}
            style={{ 
              cursor: isPlanetVisibleForInteraction ? 'pointer' : 'not-allowed',
              opacity: isPlanetVisibleForInteraction ? 1 : 0.3,
              filter: isPlanetVisibleForInteraction ? 'none' : 'brightness(0.3)'
            }}
          >
            {ownedByPlayer && (
              <>
                <circle
                  cx={currentPlanetX}
                  cy={currentPlanetY}
                  r={planetSize * 0.65}
                  stroke="rgba(126, 220, 255, 0.85)"
                  strokeWidth={Math.max(planetSize * 0.12, 1.8)}
                  fill="none"
                  className="planet-owned-ring"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(126, 220, 255, 0.75))',
                    opacity: 0.95,
                  }}
                />
                {playerAvatarUrl ? (
                  <>
                    <defs>
                      <clipPath id={avatarClipId}>
                        <circle
                          cx={currentPlanetX + avatarOffset}
                          cy={currentPlanetY - avatarOffset}
                          r={avatarBadgeSize / 2}
                        />
                      </clipPath>
                    </defs>
                    <circle
                      cx={currentPlanetX + avatarOffset}
                      cy={currentPlanetY - avatarOffset}
                      r={(avatarBadgeSize / 2) + 2}
                      fill="rgba(6, 18, 36, 0.85)"
                      stroke="rgba(126, 220, 255, 0.65)"
                      strokeWidth={1.5}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(126, 220, 255, 0.55))' }}
                    />
                    <image
                      href={playerAvatarUrl}
                      x={currentPlanetX + avatarOffset - avatarBadgeSize / 2}
                      y={currentPlanetY - avatarOffset - avatarBadgeSize / 2}
                      width={avatarBadgeSize}
                      height={avatarBadgeSize}
                      clipPath={`url(#${avatarClipId})`}
                    />
                  </>
                ) : (
                  <circle
                    cx={currentPlanetX}
                    cy={currentPlanetY}
                    r={planetSize * 0.35}
                    fill="rgba(126, 220, 255, 0.18)"
                    style={{ filter: 'blur(0.5px)' }}
                  />
                )}
              </>
            )}
            {planetImage && (
              <>
                {/* Planet glow on hover */}
                {isHovered && (
                  <circle
                    cx={currentPlanetX}
                    cy={currentPlanetY}
                    r={planetSize * 0.7}
                    fill="rgba(255, 255, 255, 0.2)"
                    className="planet-glow"
                  />
                )}
                <image
                  href={planetImage}
                  x={currentPlanetX - planetSize / 2}
                  y={currentPlanetY - planetSize / 2}
                  width={planetSize}
                  height={planetSize}
                  className="planet-image"
                  style={{ 
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none',
                    transition: 'filter 0.2s ease-in-out'
                  }}
                />
              </>
            )}
            {/* Planet label - only show at full detail level for performance */}
            {detailLevel === 'full' && (
              <>
                {/* At 0.75-0.85 normalized zoom, show labels normally */}
                {effectiveNormalizedZoom >= 0.75 && effectiveNormalizedZoom < 0.85 && (
                  <g>
                    <text
                      x={currentPlanetX}
                      y={currentPlanetY + planetSize / 2 + 10}
                      textAnchor="middle"
                      className="fill-white font-mono font-semibold"
                      style={{ 
                        fontSize: `${Math.max(4, Math.min(5.5, 4 + effectiveNormalizedZoom * 0.8))}px`,
                        textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      Planet {formatCoordinate(planet.coordinate)}
                    </text>
                    <text
                      x={currentPlanetX}
                      y={currentPlanetY + planetSize / 2 + 18}
                      textAnchor="middle"
                      className="fill-gray-300 font-mono"
                      style={{ 
                        fontSize: `${Math.max(3.5, Math.min(4.5, 3.5 + effectiveNormalizedZoom * 0.6))}px`,
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
                      x={currentPlanetX}
                      y={currentPlanetY + planetSize / 2 + 14}
                      textAnchor="middle"
                      className="fill-white font-mono font-semibold"
                      style={{ 
                        fontSize: '4.5px',
                        textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      Planet {formatCoordinate(planet.coordinate)}
                    </text>
                    <text
                      x={currentPlanetX}
                      y={currentPlanetY + planetSize / 2 + 24}
                      textAnchor="middle"
                      className="fill-gray-300 font-mono"
                      style={{ 
                        fontSize: '4px',
                        textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                      }}
                    >
                      {formatCoordinate(planet.coordinate)}
                    </text>
                  </g>
                )}
              </>
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
  
  const playerEmpireChanged = prevProps.playerEmpireId !== nextProps.playerEmpireId
  const avatarChanged = prevProps.playerAvatarUrl !== nextProps.playerAvatarUrl
  
  return (
    prevProps.system.key === nextProps.system.key &&
    !scaleChanged &&
    !normalizedZoomChanged &&
    prevProps.hoveredPlanet?.id === nextProps.hoveredPlanet?.id &&
    prevProps.system.planets.length === nextProps.system.planets.length && // Check if planets changed
    prevProps.systemName === nextProps.systemName && // Check if system name changed
    (prevProps.detailLevel ?? 'full') === (nextProps.detailLevel ?? 'full') && // Check if detail level changed
    prevProps.visibilityData === nextProps.visibilityData && // Check if visibility data changed
    !playerEmpireChanged &&
    !avatarChanged
  )
})

// Export original for backward compatibility
export { SystemView }

