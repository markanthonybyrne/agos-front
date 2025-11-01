import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'
import { useAuth } from '@/hooks/useAuth'
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
        <div className="galaxy-container min-h-[500px] p-8">
          {/* Animated galaxy spiral */}
          <div 
            className="galaxy-spiral galaxy-animated"
            style={{
              backgroundImage: `url(${galaxyImage})`,
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

