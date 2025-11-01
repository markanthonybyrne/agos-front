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
  const { data: fleetsData } = useGetFleetsQuery()
  
  // Filter in-transit fleets within the current galaxy
  const relevantFleets = useMemo(() => {
    if (!currentGalaxy || !fleetsData?.fleets) return []
    
    return fleetsData.fleets.filter((fleet) => {
      if (fleet.status !== 'in_transit') return false
      
      const origin = fleet.origin_coordinate
      const dest = fleet.destination_coordinate
      
      // Check if both origin and destination are in the current galaxy
      const originInGalaxy = 
        origin.quadrant === currentGalaxy.quadrant &&
        origin.sector === currentGalaxy.sector &&
        origin.galaxy === currentGalaxy.galaxy
      
      const destInGalaxy =
        dest.quadrant === currentGalaxy.quadrant &&
        dest.sector === currentGalaxy.sector &&
        dest.galaxy === currentGalaxy.galaxy
      
      return originInGalaxy && destInGalaxy
    })
  }, [fleetsData, currentGalaxy])
  
  // Calculate planet positions when grid layout changes
  useEffect(() => {
    if (!gridRef.current) return
    
    const updatePositions = () => {
      const newPositions = new Map<number, { x: number; y: number }>()
      const gridElement = gridRef.current
      if (!gridElement) return
      
      const cards = gridElement.querySelectorAll('[data-planet-id]')
      cards.forEach((card) => {
        const planetId = parseInt(card.getAttribute('data-planet-id') || '0')
        if (planetId && card instanceof HTMLElement) {
          const rect = card.getBoundingClientRect()
          const gridRect = gridElement.getBoundingClientRect()
          
          // Calculate center of card relative to grid
          const x = rect.left - gridRect.left + rect.width / 2
          const y = rect.top - gridRect.top + rect.height / 2
          
          newPositions.set(planetId, { x, y })
        }
      })
      
      setPlanetPositions(newPositions)
    }
    
    // Update positions initially and on resize
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
  }, [planets])

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

  return (
    <div className={`relative ${className}`}>
      {/* SVG overlay for travel lines */}
      {relevantFleets.length > 0 && planetPositions.size > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: '100%', height: '100%' }}
        >
          {relevantFleets.map((fleet) => {
            const originPlanetId = getPlanetIdFromCoordinate(fleet.origin_coordinate)
            const destPlanetId = getPlanetIdFromCoordinate(fleet.destination_coordinate)
            
            if (!originPlanetId || !destPlanetId) return null
            
            const originPos = planetPositions.get(originPlanetId)
            const destPos = planetPositions.get(destPlanetId)
            
            if (!originPos || !destPos) return null
            
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
            
            return (
              <line
                key={fleet.id}
                x1={originPos.x}
                y1={originPos.y}
                x2={destPos.x}
                y2={destPos.y}
                stroke={getLineColor()}
                strokeWidth="2"
                strokeOpacity="0.6"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )
          })}
        </svg>
      )}
      
      {/* Planet grid */}
      <div
        ref={gridRef}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10`}
      >
        {planets.map((planet) => {
        const isOwned = planet.owner_empire_id === empire?.id
        const isHovered = hoveredPlanet?.id === planet.id
        const isExpanded = expandedPlanet?.id === planet.id
        const planetImage = getPlanetImage(planet)
        const { facilitiesCount, defensesCount } = getPlanetCounts(planet)
        const isDiscovered = planet.discovered !== false // Default to true if not specified
        const isVisible = planet.visibility?.is_visible !== false

        return (
          <Card
            key={planet.id}
            data-planet-id={planet.id}
            className={cn(
              "relative aspect-square cursor-pointer overflow-hidden",
              "planet-interactive orbit-float transition-all duration-300",
              isExpanded && "expanded",
              !isDiscovered && "opacity-50 grayscale",
              isOwned ? 'bg-green-500/5 border-green-500/30' : planet.owner_empire_id ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/5 border-muted/20',
              !isVisible && "border-dashed"
            )}
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
  )
}

