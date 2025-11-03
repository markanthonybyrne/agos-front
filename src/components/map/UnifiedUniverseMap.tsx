import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetMapQuery, useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { useSearchPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useAuth } from '@/hooks/useAuth'
import { useZoomPan } from '@/hooks/useZoomPan'
import { formatCoordinate, parseCoordinate, getPlanetXY } from '@/lib/coordinates'
import { 
  getQuadrantXyRange, 
  getSectorXyRange, 
  getGalaxyXyRange, 
  xyToHierarchical,
  type XYRanges 
} from '@/lib/coordinateUtils'
import { getPlanetImage } from '@/lib/planetImages'
import { getGalaxyImage } from '@/lib/galaxyImages'
import { getQuadrantImage } from '@/lib/quadrantImages'
import { GalaxyCluster } from './GalaxyCluster'
import { PlanetView } from './PlanetView'
import { GridOverlay } from './GridOverlay'
import { Planet } from '@/types/api.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const GRID_WIDTH = 1000
const GRID_HEIGHT = 1000

/**
 * UnifiedUniverseMap - Main component for the unified universe map
 * Renders entire 1000×1000 grid with zoom/pan and fog of war
 */
export function UnifiedUniverseMap() {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)

  // Zoom and pan hook
  const zoomPan = useZoomPan({
    minScale: 0.1,
    maxScale: 5.0, // Allow zooming in much more to see individual planets
    initialScale: 0.5, // Start more zoomed in since we only have 4 quadrants
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT
  })

  // Fetch map data
  const { data: mapData } = useGetMapQuery({})
  const { data: visibilityData } = useGetVisibilityQuery()

  // Fetch all planets (for clustering)
  // In production, you'd want to fetch based on viewport, but for now fetch all
  const { data: allPlanetsData } = useSearchPlanetsQuery({
    limit: 1000
  })

  // Fetch fleets for travel lines
  const { data: fleetsData } = useGetFleetsQuery()

  const planets = useMemo(() => {
    return allPlanetsData?.planets || mapData?.planets || []
  }, [allPlanetsData, mapData])

  // Group planets by galaxy for clustering
  const planetsByGalaxy = useMemo(() => {
    const grouped = new Map<string, Planet[]>()
    
    planets.forEach(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return
      
      const hierarchical = xyToHierarchical(xy.x, xy.y)
      const key = `${hierarchical.quadrant}:${hierarchical.sector}:${hierarchical.galaxy}`
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(planet)
    })
    
    return grouped
  }, [planets])

  // Get visible galaxies (for rendering)
  const visibleGalaxies = useMemo(() => {
    const galaxies: Array<{ quadrant: number; sector: number; galaxy: number; planets: Planet[] }> = []
    
    planetsByGalaxy.forEach((planetList, key) => {
      const [q, s, g] = key.split(':').map(Number)
      if (planetList.length > 0) {
        galaxies.push({
          quadrant: q,
          sector: s,
          galaxy: g,
          planets: planetList
        })
      }
    })
    
    return galaxies
  }, [planetsByGalaxy])

  // Filter planets visible in viewport
  const visiblePlanets = useMemo(() => {
    const bounds = zoomPan.viewportBounds
    
    return planets.filter(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return false
      
      return xy.x >= bounds.minX && xy.x <= bounds.maxX &&
             xy.y >= bounds.minY && xy.y <= bounds.maxY
    })
  }, [planets, zoomPan.viewportBounds])

  // Handle planet click
  const handlePlanetClick = (planet: Planet) => {
    setSelectedPlanet(planet)
    navigate(`/planets/${planet.id}`)
  }

  // Handle quadrant click - zoom and pan to quadrant
  const handleQuadrantClick = (quadrant: number) => {
    const range = getQuadrantXyRange(quadrant)
    const centerX = (range.x_min + range.x_max) / 2
    const centerY = (range.y_min + range.y_max) / 2
    
    // Get screen coordinates for the center point
    const screen = zoomPan.gridToScreen(centerX, centerY)
    
    // Zoom to sector level (0.4 scale) and center on quadrant
    zoomPan.setZoom(0.4, screen.x, screen.y)
  }

  // Render quadrant boundaries
  const renderQuadrantBoundaries = () => {
    if (zoomPan.scale > 0.2) return null // Only show at low zoom
    
    return (
      <g className="quadrant-boundaries">
        {[1, 2, 3, 4].map(quadrant => {
          const range = getQuadrantXyRange(quadrant)
          return (
            <g key={quadrant}>
              <rect
                x={range.x_min}
                y={range.y_min}
                width={range.x_max - range.x_min}
                height={range.y_max - range.y_min}
                fill="rgba(25, 234, 253, 0.05)" // Subtle fill for clickable area
                stroke="rgba(25, 234, 253, 0.2)" // Cyan border
                strokeWidth={2}
                strokeDasharray="5,5"
                className="cursor-pointer hover:fill-cyan-500/10 hover:stroke-cyan-500/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleQuadrantClick(quadrant)
                }}
              />
              {zoomPan.scale < 0.18 && (
                <text
                  x={(range.x_min + range.x_max) / 2}
                  y={(range.y_min + range.y_max) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="24"
                  fill="rgba(25, 234, 253, 0.6)"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  Quadrant {quadrant}
                </text>
              )}
            </g>
          )
        })}
      </g>
    )
  }

  // Render quadrant images (at low zoom)
  const renderQuadrantImages = () => {
    if (zoomPan.scale > 0.2) return null

    return (
      <g className="quadrant-images">
        {[1, 2, 3, 4].map(quadrant => {
          const range = getQuadrantXyRange(quadrant)
          const centerX = (range.x_min + range.x_max) / 2
          const centerY = (range.y_min + range.y_max) / 2
          const size = (range.x_max - range.x_min) * 0.8
          const image = getQuadrantImage(quadrant)

          return (
            <image
              key={quadrant}
              href={image}
              x={centerX - size / 2}
              y={centerY - size / 2}
              width={size}
              height={size}
              opacity={0.3}
            />
          )
        })}
      </g>
    )
  }

  // Handle sector click - zoom and pan to sector
  const handleSectorClick = (quadrant: number, sector: number) => {
    const range = getSectorXyRange(quadrant, sector)
    const centerX = (range.x_min + range.x_max) / 2
    const centerY = (range.y_min + range.y_max) / 2
    
    // Get screen coordinates for the center point
    const screen = zoomPan.gridToScreen(centerX, centerY)
    
    // Zoom to sector level (0.5 scale) and center on it
    zoomPan.setZoom(0.5, screen.x, screen.y)
  }

  // Render sector boundaries
  const renderSectorBoundaries = () => {
    if (zoomPan.scale < 0.15 || zoomPan.scale > 0.4) return null

    const sectors: JSX.Element[] = []
    
    for (let q = 1; q <= 4; q++) {
      for (let s = 1; s <= 4; s++) {
        const range = getSectorXyRange(q, s)
        sectors.push(
          <rect
            key={`${q}:${s}`}
            x={range.x_min}
            y={range.y_min}
            width={range.x_max - range.x_min}
            height={range.y_max - range.y_min}
            fill="rgba(157, 78, 221, 0.05)" // Subtle fill for clickable area
            stroke="rgba(157, 78, 221, 0.15)" // Purple border
            strokeWidth={1}
            strokeDasharray="3,3"
            className="cursor-pointer hover:fill-purple-500/10 hover:stroke-purple-500/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleSectorClick(q, s)
            }}
          />
        )
      }
    }

    return <g className="sector-boundaries">{sectors}</g>
  }

  // Render galaxy clusters (at medium zoom)
  const renderGalaxyClusters = () => {
    if (zoomPan.scale < 0.35 || zoomPan.scale > 0.9) return null

    return (
      <g className="galaxy-clusters">
        {visibleGalaxies.map(({ quadrant, sector, galaxy, planets: galaxyPlanets }) => {
          const range = getGalaxyXyRange(quadrant, sector, galaxy)
          const inViewport = range.x_max >= zoomPan.viewportBounds.minX &&
                            range.x_min <= zoomPan.viewportBounds.maxX &&
                            range.y_max >= zoomPan.viewportBounds.minY &&
                            range.y_min <= zoomPan.viewportBounds.maxY

          if (!inViewport) return null

          return (
            <GalaxyCluster
              key={`${quadrant}:${sector}:${galaxy}`}
              quadrant={quadrant}
              sector={sector}
              galaxy={galaxy}
              planets={galaxyPlanets}
              scale={zoomPan.scale}
              onClick={() => {
                // Zoom to galaxy detail level
                const centerX = (range.x_min + range.x_max) / 2
                const centerY = (range.y_min + range.y_max) / 2
                const screen = zoomPan.gridToScreen(centerX, centerY)
                // Zoom to 1.0 scale (galaxy detail level) centered on the galaxy
                zoomPan.setZoom(1.0, screen.x, screen.y)
              }}
            />
          )
        })}
      </g>
    )
  }

  // Render individual planets (at high zoom)
  const renderPlanets = () => {
    // Only show planets at much higher zoom to avoid clustering - need to be really zoomed in
    if (zoomPan.scale < 2.5) return null

    return (
      <g className="planets">
        {visiblePlanets.map(planet => {
          const xy = getPlanetXY(planet)
          if (!xy) return null

          const isOwned = planet.owner_empire_id === empire?.id
          const isHovered = hoveredPlanet?.id === planet.id
          const planetImage = getPlanetImage(planet.type?.slug)
          const isDiscovered = planet.discovered !== false
          const isVisible = planet.visibility?.is_visible !== false

          // Debug: log planet image info for debugging
          if (planet.id && planet.type && zoomPan.scale > 2.4) {
            console.log(`[Planet ${planet.id}] type slug:`, planet.type.slug, 'image:', planetImage, 'exists:', !!planetImage)
          }

          // Planet size based on zoom - make them larger and more visible
          const planetSize = Math.max(30, Math.min(80, zoomPan.scale * 20))

          return (
            <g
              key={planet.id}
              transform={`translate(${xy.x}, ${xy.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPlanet(planet)}
              onMouseLeave={() => setHoveredPlanet(null)}
              onClick={() => handlePlanetClick(planet)}
            >
              {/* Background circle for planet */}
              <circle
                cx={0}
                cy={0}
                r={planetSize}
                fill={isOwned ? 'rgba(34, 197, 94, 0.3)' : planet.owner_empire_id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(156, 163, 175, 0.2)'}
                stroke={isOwned ? '#22c55e' : planet.owner_empire_id ? '#ef4444' : '#9ca3af'}
                strokeWidth={isHovered ? 3 : 2}
                opacity={!isDiscovered || !isVisible ? 0.5 : 1}
              />
              
              {/* Planet image using foreignObject for proper rendering */}
              {planetImage ? (
                <foreignObject
                  x={-planetSize}
                  y={-planetSize}
                  width={planetSize * 2}
                  height={planetSize * 2}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      opacity: !isDiscovered || !isVisible ? 0.8 : 1.0,
                      filter: !isDiscovered || !isVisible ? 'grayscale(50%)' : 'none',
                      background: 'transparent'
                    }}
                  >
                    <img
                      src={planetImage}
                      alt={planet.type?.name || 'Planet'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        margin: 0,
                        padding: 0
                      }}
                      onError={(e) => {
                        console.error(`Failed to load planet image for planet ${planet.id}:`, planetImage)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </foreignObject>
              ) : (
                <circle
                  cx={0}
                  cy={0}
                  r={planetSize}
                  fill={isOwned ? 'rgba(34, 197, 94, 0.6)' : planet.owner_empire_id ? 'rgba(239, 68, 68, 0.6)' : 'rgba(156, 163, 175, 0.4)'}
                  stroke={isOwned ? '#22c55e' : planet.owner_empire_id ? '#ef4444' : '#9ca3af'}
                  strokeWidth={isHovered ? 3 : 2}
                  opacity={!isDiscovered || !isVisible ? 0.5 : 1}
                />
              )}

              {/* Status indicator ring */}
              {isOwned && (
                <circle
                  cx={0}
                  cy={0}
                  r={planetSize + 3}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  strokeDasharray="4,4"
                  opacity={0.6}
                />
              )}

              {/* Planet label - always show at planet zoom level */}
              <text
                x={0}
                y={planetSize + 20}
                textAnchor="middle"
                fontSize={Math.max(10, Math.min(14, zoomPan.scale * 5))}
                fill={isHovered ? "rgba(25, 234, 253, 1)" : "rgba(25, 234, 253, 0.8)"}
                fontWeight={isHovered ? "bold" : "500"}
                className="transition-all"
              >
                {planet.name || `P${formatCoordinate(planet.coordinate).split(':')[3]}`}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  // Render fleet travel lines (at planet zoom)
  const renderFleetLines = () => {
    if (zoomPan.scale < 2.5 || !fleetsData?.fleets) return null

    return (
      <g className="fleet-lines" opacity={0.6}>
        {fleetsData.fleets
          .filter(fleet => fleet.status === 'in_transit')
          .map(fleet => {
            // Get origin and destination coordinates
            let originCoord: { quadrant: number; sector: number; galaxy: number; planet: number } | null = null
            let destCoord: { quadrant: number; sector: number; galaxy: number; planet: number } | null = null

            if ((fleet as any).origin?.coordinate) {
              originCoord = parseCoordinate((fleet as any).origin.coordinate)
            } else if ((fleet as any).origin_coordinate) {
              originCoord = (fleet as any).origin_coordinate
            }

            if ((fleet as any).destination?.coordinate) {
              destCoord = parseCoordinate((fleet as any).destination.coordinate)
            } else if ((fleet as any).destination_coordinate) {
              destCoord = (fleet as any).destination_coordinate
            }

            if (!originCoord || !destCoord) return null

            // Find planets
            const originPlanet = planets.find(p => {
              const parsed = parseCoordinate(p.coordinate)
              return parsed && 
                parsed.quadrant === originCoord!.quadrant &&
                parsed.sector === originCoord!.sector &&
                parsed.galaxy === originCoord!.galaxy &&
                parsed.planet === originCoord!.planet
            })

            const destPlanet = planets.find(p => {
              const parsed = parseCoordinate(p.coordinate)
              return parsed && 
                parsed.quadrant === destCoord!.quadrant &&
                parsed.sector === destCoord!.sector &&
                parsed.galaxy === destCoord!.galaxy &&
                parsed.planet === destCoord!.planet
            })

            if (!originPlanet || !destPlanet) return null

            const originXY = getPlanetXY(originPlanet)
            const destXY = getPlanetXY(destPlanet)

            if (!originXY || !destXY) return null

            // Only render if both planets are in viewport
            const bounds = zoomPan.viewportBounds
            if (originXY.x < bounds.minX || originXY.x > bounds.maxX ||
                originXY.y < bounds.minY || originXY.y > bounds.maxY ||
                destXY.x < bounds.minX || destXY.x > bounds.maxX ||
                destXY.y < bounds.minY || destXY.y > bounds.maxY) {
              return null
            }

            // Line color based on order type
            const lineColor = 
              fleet.order_type === 'attack' ? '#ef4444' :
              fleet.order_type === 'defend' ? '#3b82f6' :
              fleet.order_type === 'station' ? '#10b981' :
              fleet.order_type === 'return' ? '#f59e0b' :
              '#06b6d4'

            return (
              <line
                key={fleet.id}
                x1={originXY.x}
                y1={originXY.y}
                x2={destXY.x}
                y2={destXY.y}
                stroke={lineColor}
                strokeWidth={3}
                strokeDasharray="8,4"
                strokeLinecap="round"
              />
            )
          })}
      </g>
    )
  }

  // Group planets by galaxy for orbital rendering
  const planetsByCurrentGalaxy = useMemo(() => {
    if (zoomPan.scale < 2.5) return []
    
    // Find which galaxy the viewport center is in
    const centerX = (zoomPan.viewportBounds.minX + zoomPan.viewportBounds.maxX) / 2
    const centerY = (zoomPan.viewportBounds.minY + zoomPan.viewportBounds.maxY) / 2
    const hierarchical = xyToHierarchical(centerX, centerY)
    
    return visiblePlanets.filter(p => {
      const parsed = parseCoordinate(p.coordinate)
      return parsed &&
        parsed.quadrant === hierarchical.quadrant &&
        parsed.sector === hierarchical.sector &&
        parsed.galaxy === hierarchical.galaxy
    })
  }, [visiblePlanets, zoomPan.viewportBounds, zoomPan.scale])

  // Determine if we should show PlanetView (system view) instead of the map
  // This happens when we're zoomed into a single galaxy
  const currentGalaxyContext = useMemo(() => {
    // Show PlanetView at high zoom (2.0+) when viewport is focused on one galaxy
    if (zoomPan.scale < 2.0) return null
    
    const centerX = (zoomPan.viewportBounds.minX + zoomPan.viewportBounds.maxX) / 2
    const centerY = (zoomPan.viewportBounds.minY + zoomPan.viewportBounds.maxY) / 2
    const hierarchical = xyToHierarchical(centerX, centerY)
    
    // Get the galaxy range
    const galaxyRange = getGalaxyXyRange(hierarchical.quadrant, hierarchical.sector, hierarchical.galaxy)
    
    // Check if viewport is mostly within this galaxy
    const viewportWidth = zoomPan.viewportBounds.maxX - zoomPan.viewportBounds.minX
    const viewportHeight = zoomPan.viewportBounds.maxY - zoomPan.viewportBounds.minY
    const galaxyWidth = galaxyRange.x_max - galaxyRange.x_min
    const galaxyHeight = galaxyRange.y_max - galaxyRange.y_min
    
    // If viewport covers most of the galaxy area (we're zoomed in enough), show PlanetView
    // Allow some flexibility (1.5x) to account for panning near edges
    if (viewportWidth <= galaxyWidth * 1.5 && viewportHeight <= galaxyHeight * 1.5) {
      // Get planets in this galaxy - fetch all planets for this galaxy, not just visible ones
      const galaxyPlanets = planets.filter(p => {
        const parsed = parseCoordinate(p.coordinate)
        return parsed &&
          parsed.quadrant === hierarchical.quadrant &&
          parsed.sector === hierarchical.sector &&
          parsed.galaxy === hierarchical.galaxy
      })
      
      // Only show PlanetView if we have planets in this galaxy
      if (galaxyPlanets.length > 0) {
        return {
          quadrant: hierarchical.quadrant,
          sector: hierarchical.sector,
          galaxy: hierarchical.galaxy,
          planets: galaxyPlanets
        }
      }
    }
    
    return null
  }, [zoomPan.scale, zoomPan.viewportBounds, planets])

  // Solar orbits/rings (only at max zoom in galaxy view)
  const renderSolarOrbits = () => {
    if (zoomPan.scale < 2.5 || planetsByCurrentGalaxy.length === 0) return null

    // Get galaxy range for centering orbits
    const firstPlanet = planetsByCurrentGalaxy[0]
    const parsed = parseCoordinate(firstPlanet.coordinate)
    if (!parsed) return null

    const galaxyRange = getGalaxyXyRange(parsed.quadrant, parsed.sector, parsed.galaxy)
    const centerX = (galaxyRange.x_min + galaxyRange.x_max) / 2
    const centerY = (galaxyRange.y_min + galaxyRange.y_max) / 2

    return (
      <g className="solar-orbits" key={`orbits-${centerX}-${centerY}`}>
        {/* Central star */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          <circle
            cx={0}
            cy={0}
            r={15}
            fill="rgba(255, 255, 255, 0.9)"
            className="animate-pulse"
          />
          <circle
            cx={0}
            cy={0}
            r={20}
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={2}
          />
        </g>

        {/* Orbital rings - calculate unique orbits for each planet */}
        {planetsByCurrentGalaxy.map((planet, index) => {
          const xy = getPlanetXY(planet)
          if (!xy) return null

          const relX = xy.x - centerX
          const relY = xy.y - centerY
          const distance = Math.max(30, Math.sqrt(relX * relX + relY * relY))

          return (
            <circle
              key={`orbit-${planet.id}`}
              cx={centerX}
              cy={centerY}
              r={distance}
              fill="none"
              stroke="rgba(25, 234, 253, 0.3)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
              opacity={0.6}
            />
          )
        })}
      </g>
    )
  }

  // If zoomed into a single galaxy, show PlanetView (system view)
  if (currentGalaxyContext) {
    return (
      <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden" style={{ minHeight: '600px' }}>
        {/* Back to Universe Map button */}
        <div className="absolute top-4 left-4 z-50">
          <Card className="panel-glass border-cyan/20 p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Zoom out to show the universe map again
                zoomPan.setZoom(1.0, zoomPan.containerRef.current?.clientWidth! / 2, zoomPan.containerRef.current?.clientHeight! / 2)
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Universe Map
            </Button>
          </Card>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
          <Card className="panel-glass border-cyan/20 p-2">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => zoomPan.zoomOut()}
                disabled={zoomPan.scale <= 0.1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Planet/System View */}
        <PlanetView
          planets={currentGalaxyContext.planets}
          onPlanetClick={handlePlanetClick}
          currentGalaxy={{
            quadrant: currentGalaxyContext.quadrant,
            sector: currentGalaxyContext.sector,
            galaxy: currentGalaxyContext.galaxy
          }}
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden" style={{ minHeight: '600px' }}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <Card className="panel-glass border-cyan/20 p-2">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => zoomPan.zoomIn()}
              disabled={zoomPan.scale >= 5.0}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => zoomPan.zoomOut()}
              disabled={zoomPan.scale <= 0.1}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => zoomPan.reset()}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div
        ref={zoomPan.containerRef}
        className={cn(
          "relative w-full h-full min-h-[600px]",
          zoomPan.isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ height: '100%', width: '100%' }}
        onMouseDown={zoomPan.onMouseDown}
        onMouseMove={zoomPan.onMouseMove}
        onMouseUp={zoomPan.onMouseUp}
        onTouchStart={zoomPan.onTouchStart}
        onTouchMove={zoomPan.onTouchMove}
        onTouchEnd={zoomPan.onTouchEnd}
        onWheel={zoomPan.onWheel}
      >
        {/* SVG Map */}
        <svg
          className="absolute inset-0"
          viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: '100%',
            transform: `translate(${zoomPan.panX}px, ${zoomPan.panY}px) scale(${zoomPan.scale})`,
            transformOrigin: 'center center',
            transition: zoomPan.isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Background - transparent */}
          <rect
            x={0}
            y={0}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            fill="transparent"
          />

          {/* Grid Overlay - rendered first so it appears behind all content */}
          <GridOverlay
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            scale={zoomPan.scale}
            viewportBounds={zoomPan.viewportBounds}
          />

          {/* Render layers - order matters for proper layering */}
          {renderQuadrantBoundaries()}
          {renderQuadrantImages()}
          {renderSectorBoundaries()}
          {renderGalaxyClusters()}
          {/* Solar orbits rendered before planets so planets appear on top */}
          {renderSolarOrbits()}
          {/* Only render individual planets if not showing PlanetView */}
          {!currentGalaxyContext && renderPlanets()}
          {renderFleetLines()}
        </svg>


        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 z-50">
          <Card className="panel-glass border-cyan/20 p-2">
            <div className="text-xs text-muted-foreground">
              Zoom: {(zoomPan.scale * 100).toFixed(0)}% | 
              Level: {
                zoomPan.zoomLevel === 0 ? 'Quadrant' : 
                zoomPan.zoomLevel === 1 ? 'Sector' : 
                zoomPan.zoomLevel === 2 ? 'Galaxy Clusters' :
                zoomPan.zoomLevel === 3 ? 'Galaxy Detail' : 
                'Planet'
              }
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

