import { useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate, parseCoordinate, getPlanetXY } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { usePanning } from '@/hooks/usePanning'
import { getGalaxyXyRange } from '@/lib/coordinateUtils'
import { cn } from '@/lib/utils'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { GalaxyGridOverlay } from './GalaxyGridOverlay'
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

export function PlanetView({ planets, onPlanetClick: _onPlanetClick, className = '', currentGalaxy }: PlanetViewProps) {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [expandedPlanet, setExpandedPlanet] = useState<Planet | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [planetPositions, setPlanetPositions] = useState<Map<number, { x: number; y: number }>>(new Map())
  
  // Panning hook - reset when galaxy changes
  const { panOffset, isDragging, onMouseDown, onTouchStart } = usePanning({
    enabled: true,
    resetDeps: currentGalaxy ? [currentGalaxy.quadrant, currentGalaxy.sector, currentGalaxy.galaxy] : []
  })
  
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
        if (parsed && parsed.quadrant !== undefined && parsed.sector !== undefined && 
            parsed.galaxy !== undefined && parsed.planet !== undefined) {
          originCoord = {
            quadrant: parsed.quadrant,
            sector: parsed.sector,
            galaxy: parsed.galaxy,
            planet: parsed.planet
          }
        }
      } else if ((fleet as any).origin_coordinate) {
        // Old format
        originCoord = (fleet as any).origin_coordinate
      }
      
      if ((fleet as any).destination?.coordinate) {
        const parsed = parseCoordinate((fleet as any).destination.coordinate)
        if (parsed && parsed.quadrant !== undefined && parsed.sector !== undefined && 
            parsed.galaxy !== undefined && parsed.planet !== undefined) {
          destCoord = {
            quadrant: parsed.quadrant,
            sector: parsed.sector,
            galaxy: parsed.galaxy,
            planet: parsed.planet
          }
        }
      } else if ((fleet as any).destination_coordinate) {
        // Old format
        destCoord = (fleet as any).destination_coordinate
      }
      
      if (!originCoord || !destCoord || 
          originCoord.quadrant === undefined || originCoord.sector === undefined || originCoord.galaxy === undefined ||
          destCoord.quadrant === undefined || destCoord.sector === undefined || destCoord.galaxy === undefined) {
        return false
      }
      
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
        const parsedOrigin = parseCoordinate((fleet as any).origin.coordinate)
        const parsedDest = parseCoordinate((fleet as any).destination.coordinate)
        if (parsedOrigin && parsedDest && 
            parsedOrigin.quadrant !== undefined && parsedOrigin.sector !== undefined && 
            parsedOrigin.galaxy !== undefined && parsedOrigin.planet !== undefined &&
            parsedDest.quadrant !== undefined && parsedDest.sector !== undefined && 
            parsedDest.galaxy !== undefined && parsedDest.planet !== undefined) {
          originCoord = {
            quadrant: parsedOrigin.quadrant,
            sector: parsedOrigin.sector,
            galaxy: parsedOrigin.galaxy,
            planet: parsedOrigin.planet
          }
          destCoord = {
            quadrant: parsedDest.quadrant,
            sector: parsedDest.sector,
            galaxy: parsedDest.galaxy,
            planet: parsedDest.planet
          }
        } else {
          return null
        }
      } else {
        originCoord = (fleet as any).origin_coordinate
        destCoord = (fleet as any).destination_coordinate
      }
      
      return {
        ...fleet,
        origin_coordinate: originCoord,
        destination_coordinate: destCoord
      }
    }).filter((f): f is NonNullable<typeof f> => f !== null) as typeof filtered
  }, [fleetsData, currentGalaxy])
  
  // Get galaxy X/Y range for scaling
  const galaxyRange = useMemo(() => {
    if (!currentGalaxy) return null
    return getGalaxyXyRange(currentGalaxy.quadrant, currentGalaxy.sector, currentGalaxy.galaxy)
  }, [currentGalaxy])

  // Calculate planet positions from X/Y coordinates
  const planetPositionsFromXY = useMemo(() => {
    if (!planets.length || !galaxyRange) {
      return new Map<number, { x: number; y: number }>()
    }
    
    const positions = new Map<number, { x: number; y: number }>()
    
    planets.forEach((planet) => {
      // Get X/Y coordinates from planet
      const xy = getPlanetXY(planet)
      if (!xy) {
        console.warn(`[PlanetView] Could not get X/Y coordinates for planet ${planet.id}`)
        return
      }
      
      // Scale X/Y coordinates (0-999) to percentage positions within galaxy range
      // Map X/Y to viewport percentage, accounting for pan offset
      const galaxyWidth = galaxyRange.x_max - galaxyRange.x_min
      const galaxyHeight = galaxyRange.y_max - galaxyRange.y_min
      
      if (galaxyWidth === 0 || galaxyHeight === 0) return
      
      // Calculate position within galaxy range (0-1 normalized)
      const normalizedX = (xy.x - galaxyRange.x_min) / galaxyWidth
      const normalizedY = (xy.y - galaxyRange.y_min) / galaxyHeight
      
      // Scale to percentage (0-100%)
      // Add some padding (10% on each side) so planets aren't at the edges
      const padding = 10
      const xPercent = padding + (normalizedX * (100 - padding * 2))
      const yPercent = padding + (normalizedY * (100 - padding * 2))
      
      positions.set(planet.id, { x: xPercent, y: yPercent })
    })
    
    return positions
  }, [planets, galaxyRange])
  
  // Update planetPositions state for fleet line rendering (pixel coordinates)
  useEffect(() => {
    if (!gridRef.current) return
    
    const updatePositions = () => {
      const containerRect = gridRef.current!.getBoundingClientRect()
      const newPositions = new Map<number, { x: number; y: number }>()
      
      planetPositionsFromXY.forEach((pos, planetId) => {
        // Convert percentage to pixel coordinates, accounting for pan offset
        const x = ((pos.x / 100) * containerRect.width) + panOffset.x
        const y = ((pos.y / 100) * containerRect.height) + panOffset.y
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
  }, [planetPositionsFromXY, panOffset])

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
      className={`relative ${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
      style={{ 
        minHeight: '600px', 
        height: '600px',
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* SVG overlay for grid and travel lines */}
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
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Grid Overlay - Disabled */}
        {/* <GalaxyGridOverlay width={100} height={100} /> */}
        
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
      
      {/* Map container with panning transform */}
      <div
        ref={gridRef}
        className="relative w-full h-full"
        style={{ 
          minHeight: '600px', 
          height: '600px',
          position: 'relative',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* Planets positioned using X/Y coordinates */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {planets.map((planet) => {
        const isOwned = planet.owner_empire_id === empire?.id
        const isHovered = hoveredPlanet?.id === planet.id
        const isExpanded = expandedPlanet?.id === planet.id
        const planetImage = getPlanetImage(planet)
        const { facilitiesCount, defensesCount } = getPlanetCounts(planet)
        const isDiscovered = planet.discovered !== false // Default to true if not specified
        const isVisible = planet.visibility?.is_visible !== false
        
        const pos = planetPositionsFromXY.get(planet.id)
        if (!pos) return null

        return (
          <Card
            key={planet.id}
            data-planet-id={planet.id}
            className={cn(
              "absolute cursor-pointer overflow-hidden",
              "planet-interactive transition-all duration-300",
              "w-24 h-24",
              isExpanded && "expanded scale-150 z-50",
              !isDiscovered && "opacity-50 grayscale",
              isOwned ? 'bg-green-500/5 border-green-500/30' : planet.owner_empire_id ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/5 border-muted/20',
              !isVisible && "border-dashed"
            )}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: isExpanded ? 50 : 15,
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredPlanet(planet)}
            onMouseLeave={() => setHoveredPlanet(null)}
            onClick={() => {
              if (isExpanded) {
                setExpandedPlanet(null)
                // Open planet interaction panel (for actions like colonize, send fleet, travel time)
                openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, { 
                  planet
                })
              } else {
                setExpandedPlanet(planet)
              }
            }}
          >
            {/* Planet glow effect */}
            <div className="planet-glow" />

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
                    className="w-full h-full object-cover planet-shadow-spin"
                  />
                ) : (
                  <div className="w-full h-full bg-muted/20 planet-shadow-spin" />
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
                      {planet.type.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{planet.type.description}</p>
                      )}
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
                        // Open planet interaction panel (for actions like colonize, send fleet, travel time)
                        openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, { 
                          planet
                        })
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Actions
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

