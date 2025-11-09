import { useState } from 'react'
import { useGetFleetsQuery, useCancelFleetMutation } from '@/api/endpoints/fleetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Ship, Plus, Clock, MapPin, AlertCircle, CheckCircle, Rocket, X } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { FleetBuilder } from './FleetBuilder'
import { MoveFleetDialog } from './MoveFleetDialog'
import { toast } from 'sonner'
import { FleetDetails } from '@/types/api.types'

type ViewType = 'list' | 'builder'

interface FleetsPanelProps {
  onClose?: () => void
}

export function FleetsPanel({ onClose }: FleetsPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>('list')
  const [selectedFleetForMove, setSelectedFleetForMove] = useState<FleetDetails | null>(null)
  const { data: fleets, isLoading, error } = useGetFleetsQuery()
  const { data: shipDefinitions } = useGetShipDefinitionsQuery()
  const { data: planetsData } = useGetPlanetsQuery()
  const [cancelFleet] = useCancelFleetMutation()
  const [planetFilter, setPlanetFilter] = useState<string>('all')

  const getShipName = (definitionId: number) => {
    const shipDef = shipDefinitions?.ships?.find(s => s.id === definitionId)
    return shipDef?.name || `Ship #${definitionId}`
  }

  const planets: any[] = Array.isArray(planetsData)
    ? planetsData
    : (planetsData as any)?.planets || []
  const selectedPlanetId = planetFilter === 'all' ? null : Number(planetFilter)
  const extractOriginPlanetId = (fleet: any) => {
    if (typeof fleet?.origin_planet_id === 'number') {
      return fleet.origin_planet_id
    }
    if (typeof fleet?.origin?.id === 'number') {
      return fleet.origin.id
    }
    if (typeof fleet?.origin?.planet_id === 'number') {
      return fleet.origin.planet_id
    }
    return undefined
  }

  // Handle different possible API response structures
  let fleetList: any[] = []
  if (fleets) {
    if (Array.isArray(fleets)) {
      fleetList = fleets
    } else if (Array.isArray(fleets.fleets)) {
      fleetList = fleets.fleets
    } else if (Array.isArray((fleets as any).data?.fleets)) {
      fleetList = (fleets as any).data.fleets
    }
  }

  const filteredFleetList =
    selectedPlanetId !== null
      ? fleetList.filter((fleet: any) => extractOriginPlanetId(fleet) === selectedPlanetId)
      : fleetList

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
    const normalized: Record<string, number> = {}
    for (const [key, value] of Object.entries(ships || {})) {
      normalized[key] = typeof value === 'number' ? value : 0
    }
    return Object.values(normalized).reduce((total, count) => total + Number(count || 0), 0)
  }

  const getFleetSummary = (list: any[]) => {
    const stationed = list.filter((f: any) => f.status === 'stationed').length
    const inTransit = list.filter((f: any) => f.status === 'in_transit').length
    const totalShips = list.reduce(
      (total: number, fleet: any) => total + getTotalShips(fleet.ships),
      0
    )

    return { stationed, inTransit, totalShips }
  }

  const totalFleetCount = fleetList.length
  const filteredFleetCount = filteredFleetList.length
  const summary = getFleetSummary(filteredFleetList)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="panel-glass border-red/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p>Failed to load fleets</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeView === 'builder') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView('list')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Fleet List
            </Button>
            <h2 className="text-lg font-heading glow-cyan">Fleet Builder</h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <FleetBuilder />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-border/50">
        <div>
          <h2 className="text-lg font-heading glow-cyan">Fleet Command</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor all your fleets</p>
        </div>
        <Button onClick={() => setActiveView('builder')} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Build Fleet
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Fleet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="panel-glass border-green/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stationed</p>
                  <p className="text-2xl font-mono glow-green">{summary.stationed}</p>
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
                  <p className="text-2xl font-mono glow-yellow">{summary.inTransit}</p>
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
                  <p className="text-2xl font-mono glow-blue">{summary.totalShips}</p>
                </div>
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet List */}
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold">Your Fleets</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Origin Filter
                </span>
                <select
                  value={planetFilter}
                  onChange={(event) => setPlanetFilter(event.target.value)}
                  className="min-w-[220px] rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                >
                  <option value="all">All planets ({totalFleetCount})</option>
                  {planets.map((planet: any) => (
                    <option key={planet.id} value={planet.id}>
                      {planet.name} ({formatCoordinate(planet.coordinate)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedPlanetId !== null && (
              <p className="text-xs text-muted-foreground mb-4">
                Showing {filteredFleetCount} of {totalFleetCount} fleets
              </p>
            )}
            {filteredFleetList.length > 0 ? (
              <div className="space-y-4">
                {filteredFleetList.map((fleet: any) => {
                  const StatusIcon = getStatusIcon(fleet.status)
                  const totalShips = getTotalShips(fleet.ships)
                  
                  return (
                    <div key={fleet.id} className="flex items-start justify-between p-4 bg-muted/10 rounded-lg border border-border/50 hover:border-cyan/30 transition-colors">
                      <div className="flex items-start gap-4 flex-1">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(fleet.status)} mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1">
                            {fleet.name || `Fleet #${fleet.id}`}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {totalShips} ship{totalShips !== 1 ? 's' : ''} • {fleet.status.replace('_', ' ')}
                          </p>
                          {fleet.order_type && (
                            <Badge variant="outline" className="mb-2">
                              {fleet.order_type}
                            </Badge>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Array.isArray(fleet.ships) && fleet.ships.map((ship: any, idx: number) => {
                              const shipName = getShipName(ship.definition_id)
                              return (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {ship.quantity} {shipName}
                                </Badge>
                              )
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {fleet.origin && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                From: {fleet.origin.name || formatCoordinate(fleet.origin.coordinate)}
                              </div>
                            )}
                            {fleet.destination_coordinate && fleet.order_type !== 'return' && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                To: {typeof fleet.destination_coordinate === 'string' 
                                  ? fleet.destination_coordinate 
                                  : formatCoordinate(fleet.destination_coordinate)}
                              </div>
                            )}
                            {fleet.order_type === 'return' && fleet.destination_coordinate && (
                              <div className="flex items-center gap-1 text-orange-400">
                                <MapPin className="w-3 h-3" />
                                Returning to: {typeof fleet.destination_coordinate === 'string' 
                                  ? fleet.destination_coordinate 
                                  : formatCoordinate(fleet.destination_coordinate)}
                              </div>
                            )}
                            {fleet.arrival_tick && fleet.status === 'in_transit' && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Arrives: Tick {fleet.arrival_tick}
                              </div>
                            )}
                            {fleet.ticks_remaining !== undefined && fleet.status === 'in_transit' && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fleet.ticks_remaining} tick{fleet.ticks_remaining !== 1 ? 's' : ''} remaining
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        {fleet.status === 'stationed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedFleetForMove(fleet)}
                          >
                            <Rocket className="w-4 h-4 mr-1" />
                            Move
                          </Button>
                        )}
                        {fleet.status === 'in_transit' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this fleet?')) {
                                try {
                                  await cancelFleet(fleet.id).unwrap()
                                  toast.success('Fleet cancelled successfully')
                                } catch (error: any) {
                                  toast.error(error?.data?.message || 'Failed to cancel fleet')
                                }
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
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
                  {selectedPlanetId
                    ? 'No fleets originate from this planet yet. Clear the filter or build a new fleet.'
                    : "You don't have any fleets yet. Build your first fleet to start exploring the galaxy."}
                </p>
                {selectedPlanetId ? (
                  <Button variant="outline" onClick={() => setPlanetFilter('all')}>
                    Clear Planet Filter
                  </Button>
                ) : (
                  <Button onClick={() => setActiveView('builder')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Build Your First Fleet
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Move Fleet Dialog */}
      {selectedFleetForMove && (
        <MoveFleetDialog
          fleet={selectedFleetForMove}
          isOpen={!!selectedFleetForMove}
          onClose={() => setSelectedFleetForMove(null)}
        />
      )}
    </div>
  )
}

