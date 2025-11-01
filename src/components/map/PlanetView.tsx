import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
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
}

export function PlanetView({ planets, onPlanetClick, className = '' }: PlanetViewProps) {
  const { empire } = useAuth()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [expandedPlanet, setExpandedPlanet] = useState<Planet | null>(null)

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

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
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
  )
}

