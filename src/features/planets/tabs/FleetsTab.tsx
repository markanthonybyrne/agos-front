import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { Ship, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react'

interface FleetsTabProps {
  planet: Planet
}

export function FleetsTab({ planet }: FleetsTabProps) {
  // This would typically come from an API call to get fleets at this planet
  // For now, we'll show a placeholder
  const fleetsAtPlanet = [
    {
      id: 1,
      ships: { fighters: 10, corvettes: 2 },
      status: 'stationed' as const,
      arrival_tick: null,
    },
    {
      id: 2,
      ships: { fighters: 5, frigates: 1 },
      status: 'in_transit' as const,
      arrival_tick: 1005,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stationed':
        return 'text-green-400'
      case 'in_transit':
        return 'text-yellow-400'
      case 'arrived':
        return 'text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stationed':
        return CheckCircle
      case 'in_transit':
        return Clock
      case 'arrived':
        return Ship
      default:
        return AlertCircle
    }
  }

  const getTotalShips = (ships: any) => {
    if (Array.isArray(ships)) {
      return ships.reduce((total: number, ship: any) => total + (ship.quantity || 0), 0)
    }
    // Handle Record with potentially undefined values
    const normalized: Record<string, number> = {}
    for (const [key, value] of Object.entries(ships || {})) {
      normalized[key] = typeof value === 'number' ? value : 0
    }
    return Object.values(normalized).reduce((total, count) => total + Number(count || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Fleet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="panel-glass border-green/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stationed</p>
                <p className="text-2xl font-mono glow-green">
                  {fleetsAtPlanet.filter(f => f.status === 'stationed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-yellow/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-mono glow-yellow">
                  {fleetsAtPlanet.filter(f => f.status === 'in_transit').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ships</p>
                <p className="text-2xl font-mono glow-blue">
                  {fleetsAtPlanet.reduce((total, fleet) => total + getTotalShips(fleet.ships), 0)}
                </p>
              </div>
              <Ship className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet List */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            Fleets at {planet.name}
          </CardTitle>
          <CardDescription>
            All fleets currently stationed at or traveling to this planet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fleetsAtPlanet.length > 0 ? (
            <div className="space-y-4">
              {fleetsAtPlanet.map((fleet) => {
                const StatusIcon = getStatusIcon(fleet.status)
                const totalShips = getTotalShips(fleet.ships)
                
                return (
                  <div key={fleet.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-4">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(fleet.status)}`} />
                      <div>
                        <h4 className="font-semibold">Fleet #{fleet.id}</h4>
                        <p className="text-sm text-muted-foreground">
                          {totalShips} ship{totalShips !== 1 ? 's' : ''} • {fleet.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-2 text-sm">
                          {Object.entries(fleet.ships).map(([shipType, count]) => (
                            <Badge key={shipType} variant="outline">
                              {count} {shipType}
                            </Badge>
                          ))}
                        </div>
                        {fleet.arrival_tick && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Arrives at tick {fleet.arrival_tick}
                          </p>
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fleets</h3>
              <p className="text-muted-foreground mb-4">
                No fleets are currently stationed at or traveling to this planet.
              </p>
              <Button variant="outline" disabled>
                Send Fleet (Coming Soon)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="panel-glass border-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-purple-400" />
              Send Fleet
            </CardTitle>
            <CardDescription>
              Deploy a fleet from this planet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              Fleet Builder (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card className="panel-glass border-orange/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-400" />
              Station Fleet
            </CardTitle>
            <CardDescription>
              Station a fleet at this planet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Station Fleet (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
