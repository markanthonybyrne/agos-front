import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { useAuth } from '@/hooks/useAuth'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { Star, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalaxyViewProps {
  planets: Planet[]
  galaxyNumber: number
  sectorNumber?: number
  quadrantNumber?: number
  onPlanetClick: (planet: Planet) => void
  className?: string
}

export function GalaxyView({ 
  planets, 
  galaxyNumber, 
  sectorNumber, 
  quadrantNumber,
  onPlanetClick,
  className = '' 
}: GalaxyViewProps) {
  const { empire } = useAuth()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)

  // Fetch fleets to get travel routes
  // NOTE: This endpoint only returns the user's own fleets, not other players' fleets.
  // To show all visible fleets in a galaxy, we would need an endpoint like:
  // GET /universe/map/galaxies/{quadrant}/{sector}/{galaxy}/fleets
  // that returns all visible fleets based on visibility/intelligence systems
  const { data: fleetsData } = useGetFleetsQuery()

  // Filter in-transit fleets within the current galaxy
  // Currently only shows YOUR fleets, not other players' fleets
  const relevantFleets = useMemo(() => {
    if (!quadrantNumber || !sectorNumber || !galaxyNumber || !fleetsData?.fleets) {
      console.log('[GalaxyView] No fleets data or missing coordinates:', {
        quadrantNumber,
        sectorNumber,
        galaxyNumber,
        hasFleets: !!fleetsData?.fleets,
        fleetCount: fleetsData?.fleets?.length || 0
      })
      return []
    }
    
    console.log('[GalaxyView] Processing fleets:', {
      totalFleets: fleetsData.fleets.length,
      currentGalaxy: `${quadrantNumber}:${sectorNumber}:${galaxyNumber}`
    })
    
    const filtered = fleetsData.fleets.filter((fleet) => {
      console.log('[GalaxyView] Checking fleet:', {
        id: fleet.id,
        status: fleet.status,
        origin: (fleet as any).origin,
        dest: (fleet as any).destination
      })
      
      if (fleet.status !== 'in_transit') {
        console.log(`[GalaxyView] Fleet ${fleet.id} filtered out - status: ${fleet.status}`)
        return false
      }
      
      // Handle both API response formats:
      // Old format: { origin_coordinate: { quadrant, sector, galaxy, planet }, destination_coordinate: {...} }
      // New format: { origin: { coordinate: "1:1:3:14" }, destination: { coordinate: "1:1:3:1" } }
      let originCoord: { quadrant: number; sector: number; galaxy: number; planet: number } | null = null
      let destCoord: { quadrant: number; sector: number; galaxy: number; planet: number } | null = null
      
      // Try new format first (with origin/destination objects)
      if ((fleet as any).origin?.coordinate) {
        const parsed = parseCoordinate((fleet as any).origin.coordinate)
        if (parsed) originCoord = parsed
      } else if ((fleet as any).origin_coordinate) {
        // Old format
        originCoord = (fleet as any).origin_coordinate
      }
      
      if ((fleet as any).destination?.coordinate) {
        const parsed = parseCoordinate((fleet as any).destination.coordinate)
        if (parsed) destCoord = parsed
      } else if ((fleet as any).destination_coordinate) {
        // Old format
        destCoord = (fleet as any).destination_coordinate
      }
      
      if (!originCoord || !destCoord) {
        console.log(`[GalaxyView] Fleet ${fleet.id} filtered out - missing coordinates`, {
          originCoord,
          destCoord,
          fleetFormat: {
            hasOrigin: !!(fleet as any).origin,
            hasDestination: !!(fleet as any).destination,
            hasOriginCoord: !!(fleet as any).origin_coordinate,
            hasDestCoord: !!(fleet as any).destination_coordinate
          }
        })
        return false
      }
      
      // Check if both origin and destination are in the current galaxy
      const originInGalaxy = 
        originCoord.quadrant === quadrantNumber &&
        originCoord.sector === sectorNumber &&
        originCoord.galaxy === galaxyNumber
      
      const destInGalaxy =
        destCoord.quadrant === quadrantNumber &&
        destCoord.sector === sectorNumber &&
        destCoord.galaxy === galaxyNumber
      
      const isRelevant = originInGalaxy && destInGalaxy
      
      if (isRelevant) {
        console.log(`[GalaxyView] ✅ Fleet ${fleet.id} is relevant - origin: ${originCoord.quadrant}:${originCoord.sector}:${originCoord.galaxy}:${originCoord.planet}, dest: ${destCoord.quadrant}:${destCoord.sector}:${destCoord.galaxy}:${destCoord.planet}`)
      } else {
        console.log(`[GalaxyView] ❌ Fleet ${fleet.id} filtered out - originInGalaxy: ${originInGalaxy}, destInGalaxy: ${destInGalaxy}`, {
          originCoord,
          destCoord,
          targetGalaxy: `${quadrantNumber}:${sectorNumber}:${galaxyNumber}`
        })
      }
      
      return isRelevant
    })
    
    // Transform filtered fleets to have consistent coordinate format
    const transformedFleets = filtered.map((fleet) => {
      let originCoord: { quadrant: number; sector: number; galaxy: number; planet: number }
      let destCoord: { quadrant: number; sector: number; galaxy: number; planet: number }
      
      if ((fleet as any).origin?.coordinate) {
        originCoord = parseCoordinate((fleet as any).origin.coordinate)!
        destCoord = parseCoordinate((fleet as any).destination.coordinate)!
      } else {
        originCoord = (fleet as any).origin_coordinate
        destCoord = (fleet as any).destination_coordinate
      }
      
      return {
        ...fleet,
        origin_coordinate: originCoord,
        destination_coordinate: destCoord
      }
    })
    
    console.log('[GalaxyView] Relevant fleets after filtering:', transformedFleets.length, transformedFleets.map(f => ({ 
      id: f.id, 
      origin: f.origin_coordinate.planet, 
      dest: f.destination_coordinate.planet 
    })))
    
    return transformedFleets as typeof filtered
  }, [fleetsData, quadrantNumber, sectorNumber, galaxyNumber])

  // Select galaxy image based on galaxy number
  const galaxyImage = useMemo(() => {
    const galaxyType = ((galaxyNumber - 1) % 4) + 1
    return `/assets/images/galaxy/galaxy_type_${galaxyType}.png`
  }, [galaxyNumber])

  // Calculate planet positions in orbital positions around the galaxy
  const planetPositions = useMemo(() => {
    return planets.map((planet, index) => {
      const coord = formatCoordinate(planet.coordinate)
      const [, , , planetNum] = coord.split(':').map(Number)
      
      // Distribute planets in orbital positions
      const totalPlanets = planets.length
      const angle = (index / totalPlanets) * Math.PI * 2
      const radius = 150 + (planetNum % 10) * 8 // Vary radius based on planet number
      
      return {
        planet,
        x: 50 + Math.cos(angle) * (radius / 400) * 100 + '%',
        y: 50 + Math.sin(angle) * (radius / 400) * 100 + '%',
        planetNum
      }
    })
  }, [planets])

  // Helper to find planet ID from coordinate
  const getPlanetIdFromCoordinate = (coord: { quadrant: number; sector: number; galaxy: number; planet: number }): number | null => {
    const planet = planets.find((p) => {
      const parsed = parseCoordinate(p.coordinate)
      return parsed &&
        parsed.quadrant === coord.quadrant &&
        parsed.sector === coord.sector &&
        parsed.galaxy === coord.galaxy &&
        parsed.planet === coord.planet
    })
    return planet?.id || null
  }

  // Calculate galaxy statistics
  const stats = useMemo(() => {
    const totalPlanets = planets.length
    const colonizedPlanets = planets.filter(p => p.owner_empire_id).length
    const ownedPlanets = planets.filter(p => p.owner_empire_id === empire?.id).length
    const unsettledPlanets = totalPlanets - colonizedPlanets

    return { totalPlanets, colonizedPlanets, ownedPlanets, unsettledPlanets }
  }, [planets, empire])

  return (
    <div className={`relative ${className}`}>
      <Card className="panel-glass border-cyan/20 contain-map">
        <div className="galaxy-container min-h-[500px] p-8 relative" style={{ overflow: 'visible' }}>
          {/* ALWAYS render test SVG to verify rendering */}
          <svg
            className="absolute pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              zIndex: 9999,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              backgroundColor: 'rgba(255, 0, 0, 0.1)', // Red tint to see SVG area
            }}
          >
            {/* Test line - bright green diagonal */}
            <line
              x1="5%"
              y1="5%"
              x2="95%"
              y2="95%"
              stroke="#00ff00"
              strokeWidth="20"
              strokeOpacity="1"
            />
            {/* Test line - bright red horizontal */}
            <line
              x1="0%"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="#ff0000"
              strokeWidth="15"
              strokeOpacity="1"
            />
            {/* Fleet travel lines */}
            {relevantFleets.length > 0 && planetPositions.length > 0 && relevantFleets.map((fleet) => {
                    // Use destination.id from API if available (more reliable), otherwise fallback to coordinate lookup
                    const originPlanetId = (fleet as any).origin?.id || getPlanetIdFromCoordinate(fleet.origin_coordinate)
                    const destPlanetId = (fleet as any).destination?.id || getPlanetIdFromCoordinate(fleet.destination_coordinate)
                    
                    console.log('[GalaxyView] Rendering line for fleet:', {
                      fleetId: fleet.id,
                      originPlanetId,
                      destPlanetId,
                      originFromAPI: (fleet as any).origin?.id,
                      destFromAPI: (fleet as any).destination?.id,
                      originCoord: fleet.origin_coordinate,
                      destCoord: fleet.destination_coordinate
                    })
                    
                    if (!originPlanetId || !destPlanetId) {
                      console.log(`[GalaxyView] ❌ Cannot find planet IDs for fleet ${fleet.id} - origin: ${originPlanetId}, dest: ${destPlanetId}`)
                      console.log('[GalaxyView] Available planets:', planets.map(p => {
                        const coord = parseCoordinate(p.coordinate)
                        return { id: p.id, coord }
                      }))
                      return null
                    }
                    
                    const originPos = planetPositions.find(p => p.planet.id === originPlanetId)
                    const destPos = planetPositions.find(p => p.planet.id === destPlanetId)
                    
                    if (!originPos || !destPos) {
                      console.log(`[GalaxyView] ❌ Cannot find planet positions for fleet ${fleet.id} - originPos: ${!!originPos}, destPos: ${!!destPos}`)
                      return null
                    }
                    
                    // Convert percentage positions to pixel coordinates
                    // For SVG, we need actual pixel values - we'll use viewBox and percentages
                    const x1 = parseFloat(originPos.x.replace('%', ''))
                    const y1 = parseFloat(originPos.y.replace('%', ''))
                    const x2 = parseFloat(destPos.x.replace('%', ''))
                    const y2 = parseFloat(destPos.y.replace('%', ''))
                    
                    // Determine line color based on order type
                    const getLineColor = () => {
                      switch (fleet.order_type) {
                        case 'attack':
                          return '#ef4444' // red-500
                        case 'defend':
                          return '#3b82f6' // blue-500
                        case 'station':
                          return '#10b981' // green-500
                        case 'return':
                          return '#f59e0b' // amber-500
                        default:
                          return '#06b6d4' // cyan-500 (default)
                      }
                    }
                    
                    const lineColor = getLineColor()
                    
                    console.log(`[GalaxyView] ✅ Rendering line for fleet ${fleet.id}:`, {
                      x1: `${x1}%`,
                      y1: `${y1}%`,
                      x2: `${x2}%`,
                      y2: `${y2}%`,
                      color: lineColor,
                      orderType: fleet.order_type
                    })
                    
                    return (
                      <line
                        key={`fleet-${fleet.id}`}
                        x1={`${x1}%`}
                        y1={`${y1}%`}
                        x2={`${x2}%`}
                        y2={`${y2}%`}
                        stroke={lineColor}
                        strokeWidth="6"
                        strokeOpacity="1"
                        strokeDasharray="10,5"
                        strokeLinecap="round"
                        className="animate-pulse"
                        style={{
                          filter: `drop-shadow(0 0 8px ${lineColor}) drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))`,
                        }}
                      />
                    )
                  })}
          </svg>
          
          {/* Animated galaxy spiral */}
          <div 
            className="galaxy-spiral galaxy-animated relative"
            style={{
              backgroundImage: `url(${galaxyImage})`,
              zIndex: 1,
              position: 'relative'
            }}
          >
            {/* Planet indicators positioned around the spiral */}
            {planetPositions.map(({ planet, x, y, planetNum }) => {
              const isOwned = planet.owner_empire_id === empire?.id
              const isColonized = !!planet.owner_empire_id
              const isHovered = hoveredPlanet?.id === planet.id
              const isDiscovered = planet.discovered !== false // Default to true if not specified
              const isVisible = planet.visibility?.is_visible !== false

              return (
                <div
                  key={planet.id}
                  className={cn(
                    "planet-indicator",
                    isColonized && 'colonized',
                    isOwned && 'owned',
                    !isDiscovered && "opacity-50 grayscale",
                    !isVisible && "border-dashed"
                  )}
                  style={{
                    left: x,
                    top: y,
                    transform: isHovered 
                      ? 'translate(-50%, -50%) scale(2)' 
                      : 'translate(-50%, -50%)',
                    transition: 'transform 0.2s ease',
                    position: 'absolute',
                    zIndex: 60, // Above SVG lines
                  }}
                  onMouseEnter={() => setHoveredPlanet(planet)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  onClick={() => onPlanetClick(planet)}
                >
                  {isHovered && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-foreground bg-card/95 px-2 py-0.5 rounded border border-primary/30">
                      {planet.name || `P${planetNum}`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Galaxy information overlay */}
          <div className="absolute top-4 left-4 z-10">
            <Card className="panel-glass border-cyan/20 bg-card/80 backdrop-blur-sm">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-lg">Galaxy {galaxyNumber}</h3>
                </div>
                {(sectorNumber || quadrantNumber) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-mono">
                      {quadrantNumber && `Q${quadrantNumber} `}
                      {sectorNumber && `S${sectorNumber} `}
                      G{galaxyNumber}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Galaxy statistics */}
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="panel-glass border-cyan/20 bg-card/80 backdrop-blur-sm">
              <div className="p-4 space-y-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-sm">Statistics</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 font-mono font-semibold">{stats.totalPlanets}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Colonized:</span>
                    <Badge variant="outline" className="ml-2 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                      {stats.colonizedPlanets}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mine:</span>
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {stats.ownedPlanets}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available:</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {stats.unsettledPlanets}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Planet tooltip */}
          {hoveredPlanet && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 tooltip-rich">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-base mb-1">
                      {hoveredPlanet.name || `Planet ${formatCoordinate(hoveredPlanet.coordinate).split(':')[3]}`}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatCoordinate(hoveredPlanet.coordinate)}
                    </p>
                  </div>
                  <Badge variant={hoveredPlanet.owner_empire_id === empire?.id ? 'default' : 'outline'}>
                    {hoveredPlanet.state}
                  </Badge>
                </div>

                {hoveredPlanet.type && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize font-medium">{hoveredPlanet.type.name}</span>
                  </div>
                )}

                {hoveredPlanet.owner_empire_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium">
                      {hoveredPlanet.owner_empire_id === empire?.id ? 'You' : `Empire #${hoveredPlanet.owner_empire_id}`}
                    </span>
                  </div>
                )}

                {(hoveredPlanet.tellerium_balance || hoveredPlanet.krypton_balance) && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground">Tellerium:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {hoveredPlanet.tellerium_balance?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Krypton:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {hoveredPlanet.krypton_balance?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onPlanetClick(hoveredPlanet)}
                >
                  View Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

