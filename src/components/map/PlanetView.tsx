import { useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { cn } from '@/lib/utils'
import { 
  Home, 
  AlertCircle, 
  Settings, 
  Shield, 
  Rocket,
  Coins,
  Target,
  Eye
} from 'lucide-react'

interface PlanetViewProps {
  planets: Planet[]
  onPlanetClick: (planet: Planet) => void
  className?: string
  currentGalaxy?: {
    quadrant: number
    sector: number
    galaxy: number
  }
}

export function PlanetView({ planets, onPlanetClick, className = '', currentGalaxy }: PlanetViewProps) {
  const { empire } = useAuth()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [expandedPlanet, setExpandedPlanet] = useState<Planet | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [planetPositions, setPlanetPositions] = useState<Map<number, { x: number; y: number }>>(new Map())
  
  // Fetch fleets to get travel routes
  // NOTE: This endpoint only returns the user's own fleets, not other players' fleets.
  // To show all visible fleets in a galaxy, we would need an endpoint like:
  // GET /universe/map/galaxies/{quadrant}/{sector}/{galaxy}/fleets
  // that returns all visible fleets based on visibility/intelligence systems
  const { data: fleetsData } = useGetFleetsQuery()
  
  // Filter in-transit fleets within the current galaxy
  // Currently only shows YOUR fleets, not other players' fleets
  const relevantFleets = useMemo(() => {
    if (!currentGalaxy || !fleetsData?.fleets) return []
    
    const filtered = fleetsData.fleets.filter((fleet) => {
      if (fleet.status !== 'in_transit') return false
      
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
      
      if (!originCoord || !destCoord) return false
      
      // Check if both origin and destination are in the current galaxy
      const originInGalaxy = 
        originCoord.quadrant === currentGalaxy.quadrant &&
        originCoord.sector === currentGalaxy.sector &&
        originCoord.galaxy === currentGalaxy.galaxy
      
      const destInGalaxy =
        destCoord.quadrant === currentGalaxy.quadrant &&
        destCoord.sector === currentGalaxy.sector &&
        destCoord.galaxy === currentGalaxy.galaxy
      
      return originInGalaxy && destInGalaxy
    })
    
    // Transform filtered fleets to have consistent coordinate format
    return filtered.map((fleet) => {
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
    }) as typeof filtered
  }, [fleetsData, currentGalaxy])
  
  // Calculate planet positions in orbital layout around central star
  const orbitalPlanetPositions = useMemo(() => {
    if (!planets.length) {
      console.log('[PlanetView] No planets to position')
      return new Map<number, { x: number; y: number }>()
    }
    
    const positions = new Map<number, { x: number; y: number }>()
    const centerX = 50 // Percentage
    const centerY = 50 // Percentage
    
    console.log(`[PlanetView] Calculating orbital positions for ${planets.length} planets`)
    
    planets.forEach((planet, index) => {
      const coord = parseCoordinate(planet.coordinate)
      if (!coord) {
        console.warn(`[PlanetView] Could not parse coordinate for planet ${planet.id}`)
        return
      }
      
      const planetNum = coord.planet || index + 1
      
      // Distribute planets in orbital rings
      // Group planets into orbital rings (3-4 per ring)
      const planetsPerRing = 4
      const orbitRing = Math.floor((planetNum - 1) / planetsPerRing)
      const positionInRing = (planetNum - 1) % planetsPerRing
      
      // Base radius increases with each ring to spread planets out
      const baseRadius = 20 + orbitRing * 10 // Start at 20%, increase by 10% per ring
      const radius = baseRadius + (positionInRing * 2) // Slight spacing within ring
      
      // Distribute planets evenly around the circle within their ring
      const angle = (positionInRing / planetsPerRing) * Math.PI * 2 + (orbitRing * 0.3) // Slight rotation per ring
      
      // Calculate position
      const xPercent = centerX + Math.cos(angle) * radius
      const yPercent = centerY + Math.sin(angle) * radius
      
      console.log(`[PlanetView] Planet ${planet.id} (${planetNum}): ring ${orbitRing}, pos ${positionInRing}, angle ${(angle * 180 / Math.PI).toFixed(1)}°, radius ${radius.toFixed(1)}%, position (${xPercent.toFixed(1)}%, ${yPercent.toFixed(1)}%)`)
      
      positions.set(planet.id, { x: xPercent, y: yPercent })
    })
    
    console.log(`[PlanetView] Calculated ${positions.size} planet positions`)
    return positions
  }, [planets])
  
  // Update planetPositions state for fleet line rendering
  useEffect(() => {
    if (!gridRef.current) return
    
    const updatePositions = () => {
      const containerRect = gridRef.current!.getBoundingClientRect()
      const newPositions = new Map<number, { x: number; y: number }>()
      
      orbitalPlanetPositions.forEach((pos, planetId) => {
        // Convert percentage to pixel coordinates
        const x = (pos.x / 100) * containerRect.width
        const y = (pos.y / 100) * containerRect.height
        newPositions.set(planetId, { x, y })
      })
      
      setPlanetPositions(newPositions)
    }
    
    updatePositions()
    window.addEventListener('resize', updatePositions)
    const observer = new ResizeObserver(updatePositions)
    if (gridRef.current) {
      observer.observe(gridRef.current)
    }
    
    return () => {
      window.removeEventListener('resize', updatePositions)
      observer.disconnect()
    }
  }, [orbitalPlanetPositions])

  // Get planet image based on type
  const getPlanetImage = (planet: Planet): string | null => {
    if (planet.type?.slug) {
      const planetSlugMap: Record<string, string> = {
        'arid': 'arid',
        'oceanic': 'oceanic',
        'volcanic': 'volcanic',
        'ice': 'ice',
        'asteroid': 'asteroid',
      }
      const imageName = planetSlugMap[planet.type.slug] || 'arid'
      return `/assets/images/planets/${imageName}.png`
    }
    return null
  }

  const getPlanetStatusColor = (planet: Planet) => {
    if (planet.owner_empire_id === empire?.id) {
      return planet.state === 'homeworld' ? 'text-green-400' : 'text-blue-400'
    }
    if (planet.owner_empire_id) {
      return 'text-red-400'
    }
    return 'text-muted-foreground'
  }

  const getPlanetStatusBadge = (planet: Planet) => {
    if (planet.owner_empire_id === empire?.id) {
      return planet.state === 'homeworld' ? (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Home className="w-3 h-3 mr-1" />
          Homeworld
        </Badge>
      ) : (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Colony</Badge>
      )
    }
    if (planet.owner_empire_id) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Occupied
        </Badge>
      )
    }
    return <Badge variant="outline">Unsettled</Badge>
  }

  // Calculate facilities and defenses count
  const getPlanetCounts = (planet: Planet) => {
    const facilitiesCount = planet.facilities 
      ? Object.values(planet.facilities).reduce((sum, count) => sum + count, 0)
      : 0
    const defensesCount = planet.defence_grid
      ? Object.values(planet.defence_grid).reduce((sum, count) => sum + count, 0)
      : 0
    return { facilitiesCount, defensesCount }
  }

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

  // Debug: Log when component renders
  console.log('[PlanetView] Component rendering:', {
    planetsCount: planets.length,
    currentGalaxy,
    className
  })

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        minHeight: '600px', 
        height: '600px',
        backgroundColor: 'rgba(0, 100, 0, 0.1)', // DEBUG: Green tint to see container
        border: '2px solid red', // DEBUG: Red border to see container
      }}
    >
      {/* DEBUG: Visible text indicator */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 10000, 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '4px 8px',
        fontSize: '12px'
      }}>
        PlanetView Active - {planets.length} planets
      </div>
      
      {/* SVG overlay for travel lines - ALWAYS render test lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
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
          backgroundColor: 'rgba(0, 255, 0, 0.05)', // Green tint to see SVG area
        }}
      >
        {/* Test lines to verify SVG rendering */}
        <line
          x1="5%"
          y1="5%"
          x2="95%"
          y2="95%"
          stroke="#00ff00"
          strokeWidth="20"
          strokeOpacity="1"
        />
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
        {relevantFleets.length > 0 && planetPositions.size > 0 && gridRef.current && relevantFleets.map((fleet) => {
            // Use destination.id from API if available (more reliable), otherwise fallback to coordinate lookup
            const originPlanetId = (fleet as any).origin?.id || getPlanetIdFromCoordinate(fleet.origin_coordinate)
            const destPlanetId = (fleet as any).destination?.id || getPlanetIdFromCoordinate(fleet.destination_coordinate)
            
            if (!originPlanetId || !destPlanetId) return null
            
            const originPos = planetPositions.get(originPlanetId)
            const destPos = planetPositions.get(destPlanetId)
            
            if (!originPos || !destPos || !gridRef.current) return null
            
            // Convert pixel coordinates to percentages relative to container
            const containerRect = gridRef.current.getBoundingClientRect()
            const x1Percent = (originPos.x / containerRect.width) * 100
            const y1Percent = (originPos.y / containerRect.height) * 100
            const x2Percent = (destPos.x / containerRect.width) * 100
            const y2Percent = (destPos.y / containerRect.height) * 100
            
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
                  return '#6366f1' // indigo-500
              }
            }
            
            console.log(`[PlanetView] Rendering fleet line ${fleet.id}:`, {
              originPlanetId,
              destPlanetId,
              originPos,
              destPos,
              x1Percent,
              y1Percent,
              x2Percent,
              y2Percent,
              containerSize: { width: containerRect.width, height: containerRect.height }
            })
            
            return (
              <line
                key={`fleet-${fleet.id}`}
                x1={`${x1Percent}%`}
                y1={`${y1Percent}%`}
                x2={`${x2Percent}%`}
                y2={`${y2Percent}%`}
                stroke={getLineColor()}
                strokeWidth="8"
                strokeOpacity="1"
                strokeDasharray="10,5"
                strokeLinecap="round"
                className="animate-pulse"
                style={{
                  filter: `drop-shadow(0 0 8px ${getLineColor()}) drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))`,
                }}
              />
            )
          })}
      </svg>
      
      {/* Orbital layout container */}
      <div
        ref={gridRef}
        className="relative w-full"
        style={{ 
          minHeight: '600px', 
          height: '600px',
          position: 'relative',
        }}
      >
        {/* Central Star */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <img
            src="/assets/images/planets/sol.png"
            alt="Star"
            className="w-full h-full object-contain animate-pulse"
            style={{
              filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 80px rgba(255, 255, 255, 0.6))',
            }}
            onError={(e) => {
              console.error('[PlanetView] Failed to load star image:', e)
            }}
          />
        </div>
        
        {/* Planets in orbital positions */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {planets.map((planet) => {
        const isOwned = planet.owner_empire_id === empire?.id
        const isHovered = hoveredPlanet?.id === planet.id
        const isExpanded = expandedPlanet?.id === planet.id
        const planetImage = getPlanetImage(planet)
        const { facilitiesCount, defensesCount } = getPlanetCounts(planet)
        const isDiscovered = planet.discovered !== false // Default to true if not specified
        const isVisible = planet.visibility?.is_visible !== false
        
        const orbitalPos = orbitalPlanetPositions.get(planet.id)
        if (!orbitalPos) return null

        return (
          <Card
            key={planet.id}
            data-planet-id={planet.id}
            className={cn(
              "absolute cursor-pointer overflow-hidden",
              "planet-interactive orbit-float transition-all duration-300",
              "w-24 h-24", // Fixed size, smaller than star (200px)
              isExpanded && "expanded scale-150 z-50",
              !isDiscovered && "opacity-50 grayscale",
              isOwned ? 'bg-green-500/5 border-green-500/30' : planet.owner_empire_id ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/5 border-muted/20',
              !isVisible && "border-dashed"
            )}
            style={{
              left: `${orbitalPos.x}%`,
              top: `${orbitalPos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: isExpanded ? 50 : 15,
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredPlanet(planet)}
            onMouseLeave={() => setHoveredPlanet(null)}
            onClick={() => {
              if (isExpanded) {
                setExpandedPlanet(null)
                onPlanetClick(planet)
              } else {
                setExpandedPlanet(planet)
              }
            }}
          >
            {/* Planet glow effect */}
            <div className="planet-glow" />

            {/* Orbital rings */}
            <div className="orbital-rings" />

            {/* Planet background image */}
            {planetImage && (
              <img
                src={planetImage}
                alt={planet.type?.name || 'Planet'}
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
              />
            )}

            {/* Planet content */}
            <div className="relative z-10 h-full p-4 flex flex-col items-center justify-center">
              {/* Planet thumbnail circle */}
              <div className={`relative w-20 h-20 mb-3 rounded-full overflow-hidden ${getPlanetStatusColor(planet)}`}>
                {planetImage ? (
                  <img
                    src={planetImage}
                    alt={planet.type?.name || 'Planet'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/20" />
                )}
                <div className="absolute inset-0 border-2 border-current opacity-50 rounded-full" />
              </div>

              {/* Planet name */}
              <span className="text-sm font-semibold text-center mb-2 truncate w-full">
                {planet.name || formatCoordinate(planet.coordinate).split(':')[3]}
              </span>

              {/* Status badge */}
              <div className="scale-75 mb-2">
                {getPlanetStatusBadge(planet)}
              </div>

              {/* Undiscovered indicator */}
              {!isDiscovered && (
                <Badge variant="outline" className="text-xs mt-1 bg-muted/50">
                  Undiscovered
                </Badge>
              )}

              {/* Resources */}
              {(planet.tellerium_balance || planet.krypton_balance) && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  <Coins className="w-3 h-3" />
                  <span className="font-mono">
                    {formatResource(planet.tellerium_balance + planet.krypton_balance)}
                  </span>
                </div>
              )}

              {/* Expanded view details */}
              {isExpanded && (
                <div className="absolute inset-0 bg-card/98 backdrop-blur-sm z-20 p-4 space-y-3 animate-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                    </h4>
                    {getPlanetStatusBadge(planet)}
                  </div>

                  <div className="text-xs text-muted-foreground font-mono">
                    {formatCoordinate(planet.coordinate)}
                  </div>

                  {planet.type && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Type: </span>
                      <span className="capitalize font-medium">{planet.type.name}</span>
                    </div>
                  )}

                  {planet.owner_empire_id && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Owner: </span>
                      <span className="font-medium">
                        {planet.owner_empire_id === empire?.id ? 'You' : `Empire #${planet.owner_empire_id}`}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs">
                      <Settings className="w-3 h-3" />
                      <span>{facilitiesCount} Facilities</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Shield className="w-3 h-3" />
                      <span>{defensesCount} Defenses</span>
                    </div>
                    {planet.mines > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Target className="w-3 h-3" />
                        <span>{planet.mines} Mines</span>
                      </div>
                    )}
                    {planet.probes > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{planet.probes} Probes</span>
                      </div>
                    )}
                  </div>

                  {(planet.tellerium_balance || planet.krypton_balance) && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">T:</span>
                        <span className="ml-1 font-mono font-semibold">
                          {formatResource(planet.tellerium_balance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">K:</span>
                        <span className="ml-1 font-mono font-semibold">
                          {formatResource(planet.krypton_balance)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedPlanet(null)
                        onPlanetClick(planet)
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                    {isOwned && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle send fleet action
                        }}
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        Fleet
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Hover tooltip */}
              {isHovered && !isExpanded && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 tooltip-rich whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">
                      {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCoordinate(planet.coordinate)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
        </div>
      </div>
    </div>
  )
}

