import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { 
  Star, 
  Circle, 
  Globe,
  Layers,
  MapPin
} from 'lucide-react'

interface SimpleMapProps {
  quadrants: any[]
  sectors: any[]
  galaxies: any[]
  planets: any[]
  onNavigate: (level: string, data: any) => void
  onPlanetHover: (planet: any) => void
  onPlanetLeave: () => void
  className?: string
}

export function SimpleMap({ 
  quadrants, 
  sectors, 
  galaxies, 
  planets, 
  onNavigate, 
  onPlanetHover, 
  onPlanetLeave,
  className = '' 
}: SimpleMapProps) {
  
  // Show fallback if no data
  if (quadrants.length === 0 && planets.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Universe Data</h3>
            <p className="text-muted-foreground">
              Unable to load universe data for the map.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Universe Overview */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Universe Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/10 rounded-lg">
              <div className="text-2xl font-mono text-cyan-400">{quadrants.length}</div>
              <div className="text-sm text-muted-foreground">Quadrants</div>
            </div>
            <div className="text-center p-4 bg-muted/10 rounded-lg">
              <div className="text-2xl font-mono text-blue-400">{sectors.length}</div>
              <div className="text-sm text-muted-foreground">Sectors</div>
            </div>
            <div className="text-center p-4 bg-muted/10 rounded-lg">
              <div className="text-2xl font-mono text-purple-400">{galaxies.length}</div>
              <div className="text-sm text-muted-foreground">Galaxies</div>
            </div>
            <div className="text-center p-4 bg-muted/10 rounded-lg">
              <div className="text-2xl font-mono text-green-400">{planets.length}</div>
              <div className="text-sm text-muted-foreground">Planets</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quadrants Grid */}
      {quadrants.length > 0 && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Quadrants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quadrants.map((quadrant) => (
                <Card 
                  key={quadrant.id} 
                  className="panel-glass border-cyan/20 cursor-pointer hover:border-cyan/40 transition-colors"
                  onClick={() => onNavigate('sector', quadrant)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">Quadrant {quadrant.id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {quadrant.sectors?.length || 0} sectors
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planets List */}
      {planets.length > 0 && (
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-green-400" />
              Planets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planets.slice(0, 12).map((planet) => {
                const coordString = formatCoordinate(planet.coordinate)
                const isColonized = planet.owner_empire_id
                
                return (
                  <Card 
                    key={coordString} 
                    className={`panel-glass cursor-pointer transition-colors ${
                      isColonized 
                        ? 'border-green/20 hover:border-green/40' 
                        : 'border-muted/20 hover:border-muted/40'
                    }`}
                    onMouseEnter={() => onPlanetHover(planet)}
                    onMouseLeave={onPlanetLeave}
                  >
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Circle className={`w-4 h-4 ${isColonized ? 'text-green-400' : 'text-muted-foreground'}`} />
                          <span className="font-semibold">
                            {planet.name || `Planet ${formatCoordinate(planet.coordinate).split(':')[3]}`}
                          </span>
                        </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {coordString}
                      </div>
                      <Badge 
                        variant={isColonized ? 'default' : 'outline'}
                        className={isColonized ? 'bg-green-500' : ''}
                      >
                        {planet.state}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {planets.length > 12 && (
              <div className="text-center mt-4 text-sm text-muted-foreground">
                And {planets.length - 12} more planets...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Legend */}
      <Card className="panel-glass border-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            Map Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span>Colonized Planet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              <span>Uncolonized Planet</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Quadrant</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Sector</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
