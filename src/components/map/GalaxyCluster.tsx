import { useMemo } from 'react'
import { Planet } from '@/types/api.types'
import { getPlanetXY } from '@/lib/coordinates'
import { getGalaxyXyRange, xyToHierarchical } from '@/lib/coordinateUtils'
import { getGalaxyImage } from '@/lib/galaxyImages'

interface GalaxyClusterProps {
  /**
   * Quadrant number
   */
  quadrant: number
  /**
   * Sector number
   */
  sector: number
  /**
   * Galaxy number
   */
  galaxy: number
  /**
   * Planets in this galaxy
   */
  planets: Planet[]
  /**
   * Scale for rendering
   */
  scale: number
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Hover handler
   */
  onHover?: (hovered: boolean) => void
}

/**
 * GalaxyCluster - Renders a galaxy cluster with transparent overlay
 * Clusters planets by galaxy and displays galaxy image
 */
export function GalaxyCluster({
  quadrant,
  sector,
  galaxy,
  planets,
  scale,
  onClick,
  onHover
}: GalaxyClusterProps) {
  // Get galaxy X/Y range
  const galaxyRange = useMemo(() => {
    return getGalaxyXyRange(quadrant, sector, galaxy)
  }, [quadrant, sector, galaxy])

  // Calculate galaxy center position
  const centerX = useMemo(() => {
    return (galaxyRange.x_min + galaxyRange.x_max) / 2
  }, [galaxyRange])

  const centerY = useMemo(() => {
    return (galaxyRange.y_min + galaxyRange.y_max) / 2
  }, [galaxyRange])

  // Get galaxy image
  const galaxyImage = useMemo(() => {
    return getGalaxyImage(galaxy)
  }, [galaxy])

  // Calculate cluster size based on planet count and zoom level
  const clusterSize = useMemo(() => {
    const baseSize = 60
    const planetCountFactor = Math.min(planets.length / 15, 2) // Cap at 2x
    const zoomFactor = Math.min(scale / 0.5, 1.5) // Scale with zoom
    return baseSize * (1 + planetCountFactor * 0.3) * zoomFactor
  }, [planets.length, scale])

  // Get visible planet count
  const visiblePlanets = useMemo(() => {
    return planets.filter(p => {
      const xy = getPlanetXY(p)
      if (!xy) return false
      // Check if planet is within galaxy range
      return xy.x >= galaxyRange.x_min && xy.x <= galaxyRange.x_max &&
             xy.y >= galaxyRange.y_min && xy.y <= galaxyRange.y_max
    }).length
  }, [planets, galaxyRange])

  // Determine galaxy type for styling
  const galaxyType = useMemo(() => {
    return ((galaxy - 1) % 4) + 1
  }, [galaxy])

  return (
    <g
      transform={`translate(${centerX}, ${centerY})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Galaxy image with transparency overlay */}
      <image
        href={galaxyImage}
        x={-clusterSize / 2}
        y={-clusterSize / 2}
        width={clusterSize}
        height={clusterSize}
        opacity={0.4}
        style={{
          filter: 'blur(1px)',
        }}
      />
      
      {/* Galaxy glow effect */}
      <circle
        cx={0}
        cy={0}
        r={clusterSize / 2}
        fill="none"
        stroke="rgba(157, 78, 221, 0.3)" // Purple glow
        strokeWidth={2}
        opacity={0.6}
      />
      
      {/* Planet count indicator */}
      {visiblePlanets > 0 && (
        <circle
          cx={clusterSize / 3}
          cy={-clusterSize / 3}
          r={12}
          fill="rgba(25, 234, 253, 0.8)" // Cyan
          stroke="rgba(25, 234, 253, 1)"
          strokeWidth={1.5}
        />
      )}
      
      {visiblePlanets > 0 && (
        <text
          x={clusterSize / 3}
          y={-clusterSize / 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#17191D" // Dark background color
        >
          {visiblePlanets}
        </text>
      )}
      
      {/* Galaxy label (only at higher zoom) */}
      {scale > 0.6 && (
        <text
          x={0}
          y={clusterSize / 2 + 15}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(25, 234, 253, 0.9)" // Cyan
          fontWeight="500"
        >
          Galaxy {galaxy}
        </text>
      )}
    </g>
  )
}

