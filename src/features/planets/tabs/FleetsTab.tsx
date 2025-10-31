import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { Ship, Clock, MapPin, AlertCircle, CheckCircle, Plus, Edit2, Move } from 'lucide-react'
import { useGetFleetsQuery, useCancelFleetMutation } from '@/api/endpoints/fleetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FleetBuilder } from '@/features/fleets/FleetBuilder'
import { MoveFleetDialog } from '@/features/fleets/MoveFleetDialog'

interface FleetsTabProps {
  planet: Planet
}

export function FleetsTab({ planet }: FleetsTabProps) {
  const { data: fleetsData, isLoading, error, refetch } = useGetFleetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)
  const [selectedFleet, setSelectedFleet] = useState<any>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [fleetToMove, setFleetToMove] = useState<any>(null)
  const [cancelFleet] = useCancelFleetMutation()
  
  // Debug logging
  console.log('FleetsTab mounted for planet:', planet.id, planet.name)
  console.log('Planet ID type:', typeof planet.id, 'Value:', planet.id)
  console.log('Fleets query state:', { isLoading, error, hasData: !!fleetsData })
  console.log('Fleets data:', fleetsData)
  console.log('Fleets array:', fleetsData?.fleets)
  
  // Ensure query runs when component mounts
  useEffect(() => {
    console.log('FleetsTab useEffect: Component mounted, forcing refetch')
    refetch()
  }, [refetch])
  
  // Parse planet coordinate to match against fleet coordinates
  const planetCoord = useMemo(() => {
    console.log('FleetsTab: Parsing planet coordinate', planet.coordinate)
    if (!planet.coordinate) {
      console.log('FleetsTab: No planet coordinate found')
      return null
    }
    const coordStr = typeof planet.coordinate === 'string' 
      ? planet.coordinate 
      : (planet.coordinate as any)?.coordinate || String(planet.coordinate)
    console.log('FleetsTab: Coordinate string:', coordStr)
    const parts = String(coordStr).split(':')
    console.log('FleetsTab: Coordinate parts:', parts)
    if (parts.length === 4) {
      const parsed = {
        quadrant: parseInt(parts[0]),
        sector: parseInt(parts[1]),
        galaxy: parseInt(parts[2]),
        planet: parseInt(parts[3]),
      }
      console.log('FleetsTab: Parsed coordinate:', parsed)
      return parsed
    }
    console.log('FleetsTab: Invalid coordinate format, parts.length:', parts.length)
    return null
  }, [planet.coordinate])

  // Filter fleets at this planet
  const fleetsAtPlanet = useMemo(() => {
    console.log('FleetsTab filter: Starting filter check', {
      hasFleetsData: !!fleetsData?.fleets,
      fleetsArrayLength: fleetsData?.fleets?.length,
      hasPlanetCoord: !!planetCoord,
      planetCoord,
      planetId: planet.id,
      planetCoordinate: planet.coordinate
    })
    
    // Even if planetCoord is null, we can still filter by planet ID
    if (!fleetsData?.fleets) {
      console.log('FleetsTab filter: No fleets data')
      return []
    }
    
    console.log('FleetsTab filter: All fleets:', fleetsData.fleets.map((f: any) => ({
      id: f.id,
      status: f.status,
      destination: f.destination,
      destination_coordinate: f.destination_coordinate,
      origin: f.origin
    })))
    
    // Filter by planet ID if coordinate is not available
    if (!planetCoord) {
      console.log('FleetsTab filter: No planet coord, filtering by planet ID only', planet.id)
      return fleetsData.fleets.filter((fleet: any) => {
        const fleetOriginId = Number(fleet.origin?.id)
        const fleetDestinationId = Number(fleet.destination?.id)
        const planetIdNum = Number(planet.id)
        
        console.log('FleetsTab filter: Checking fleet (no coord)', {
          fleetId: fleet.id,
          fleetOriginId,
          fleetDestinationId,
          planetIdNum,
          matchesOrigin: fleetOriginId === planetIdNum,
          matchesDest: fleetDestinationId === planetIdNum
        })
        
        // Check origin ID
        if (fleetOriginId && planetIdNum && fleetOriginId === planetIdNum) {
          console.log('FleetsTab filter: Match by origin ID (no coord)', fleet.id, fleetOriginId, planetIdNum)
          return true
        }
        
        // Check destination ID (important for stationed fleets)
        if (fleetDestinationId && planetIdNum && fleetDestinationId === planetIdNum) {
          console.log('FleetsTab filter: Match by destination ID (no coord)', fleet.id, fleetDestinationId, planetIdNum)
          return true
        }
        
        return false
      })
    }
    
    console.log('FleetsTab filter: Starting filter with coordinate', { 
      totalFleets: fleetsData.fleets.length,
      planetId: planet.id,
      planetCoord 
    })
    
    const filtered = fleetsData.fleets.filter((fleet: any) => {
      // Debug each fleet
      console.log('FleetsTab filter: Checking fleet', {
        fleetId: fleet.id,
        fleetStatus: fleet.status,
        origin: fleet.origin,
        destination: fleet.destination,
        origin_coordinate: fleet.origin_coordinate,
        destination_coordinate: fleet.destination_coordinate,
        planetId: planet.id,
        planetCoord
      })
      
      const planetIdNum = Number(planet.id)
      
      // Option 1: Check if fleet's origin planet ID matches this planet ID
      const fleetOriginId = Number(fleet.origin?.id)
      if (fleetOriginId && planetIdNum && fleetOriginId === planetIdNum) {
        console.log('FleetsTab filter: Match by origin ID', fleet.id, fleetOriginId, planetIdNum)
        return true
      }
      
      // Option 2: Check if fleet's destination planet ID matches this planet ID
      // This is important for stationed fleets - they are at the destination
      const fleetDestinationId = Number(fleet.destination?.id)
      if (fleetDestinationId && planetIdNum && fleetDestinationId === planetIdNum) {
        console.log('FleetsTab filter: Match by destination ID', fleet.id, fleetDestinationId, planetIdNum)
        return true
      }
      
      // Option 3: Check if fleet's destination coordinate matches this planet coordinate
      // Handle both nested object (destination.coordinate) and direct object (destination_coordinate)
      let destCoordObj = null
      
      // Check destination.coordinate string (most common format)
      if (fleet.destination?.coordinate) {
        const destParts = String(fleet.destination.coordinate).split(':')
        if (destParts.length === 4) {
          destCoordObj = {
            quadrant: parseInt(destParts[0]),
            sector: parseInt(destParts[1]),
            galaxy: parseInt(destParts[2]),
            planet: parseInt(destParts[3]),
          }
        }
      }
      // Check destination_coordinate object directly (FleetDetails type)
      else if (fleet.destination_coordinate && typeof fleet.destination_coordinate === 'object') {
        destCoordObj = fleet.destination_coordinate
      }
      // Check destination_coordinate string
      else if (fleet.destination_coordinate && typeof fleet.destination_coordinate === 'string') {
        const destParts = String(fleet.destination_coordinate).split(':')
        if (destParts.length === 4) {
          destCoordObj = {
            quadrant: parseInt(destParts[0]),
            sector: parseInt(destParts[1]),
            galaxy: parseInt(destParts[2]),
            planet: parseInt(destParts[3]),
          }
        }
      }
      
      if (destCoordObj && planetCoord) {
        console.log('FleetsTab filter: Comparing destination coordinate', {
          fleetId: fleet.id,
          destCoordObj,
          planetCoord,
          matches: destCoordObj.quadrant === planetCoord.quadrant &&
                   destCoordObj.sector === planetCoord.sector &&
                   destCoordObj.galaxy === planetCoord.galaxy &&
                   destCoordObj.planet === planetCoord.planet
        })
        if (destCoordObj.quadrant === planetCoord.quadrant &&
            destCoordObj.sector === planetCoord.sector &&
            destCoordObj.galaxy === planetCoord.galaxy &&
            destCoordObj.planet === planetCoord.planet) {
          console.log('FleetsTab filter: Match by destination coordinate', fleet.id, destCoordObj, fleet.status)
          return true
        }
      }
      
      // Option 4: Check if fleet's origin coordinate matches this planet coordinate
      // Handle both nested object (origin.coordinate) and direct object (origin_coordinate)
      let originCoordObj = null
      
      // Check origin.coordinate string
      if (fleet.origin?.coordinate) {
        const originParts = String(fleet.origin.coordinate).split(':')
        if (originParts.length === 4) {
          originCoordObj = {
            quadrant: parseInt(originParts[0]),
            sector: parseInt(originParts[1]),
            galaxy: parseInt(originParts[2]),
            planet: parseInt(originParts[3]),
          }
        }
      }
      // Check origin_coordinate object directly (FleetDetails type)
      else if (fleet.origin_coordinate && typeof fleet.origin_coordinate === 'object') {
        originCoordObj = fleet.origin_coordinate
      }
      // Check origin_coordinate string
      else if (fleet.origin_coordinate && typeof fleet.origin_coordinate === 'string') {
        const originParts = String(fleet.origin_coordinate).split(':')
        if (originParts.length === 4) {
          originCoordObj = {
            quadrant: parseInt(originParts[0]),
            sector: parseInt(originParts[1]),
            galaxy: parseInt(originParts[2]),
            planet: parseInt(originParts[3]),
          }
        }
      }
      
      if (originCoordObj && planetCoord) {
        if (originCoordObj.quadrant === planetCoord.quadrant &&
            originCoordObj.sector === planetCoord.sector &&
            originCoordObj.galaxy === planetCoord.galaxy &&
            originCoordObj.planet === planetCoord.planet) {
          console.log('FleetsTab filter: Match by origin coordinate', fleet.id, originCoordObj)
          return true
        }
      }
      
      console.log('FleetsTab filter: No match for fleet', fleet.id)
      return false
    })
    
    console.log('FleetsTab filter: Filtered result', { 
      filteredCount: filtered.length,
      filteredIds: filtered.map((f: any) => f.id) 
    })
    
    return filtered
  }, [fleetsData?.fleets, planetCoord, planet.id])

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

  // Get ship definitions for displaying ship names
  const { data: shipDefinitions } = useGetShipDefinitionsQuery()
  
  const getShipName = (definitionId: number) => {
    const shipDef = shipDefinitions?.ships?.find(s => s.id === definitionId)
    return shipDef?.name || `Ship #${definitionId}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
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
              {fleetsAtPlanet.map((fleet: any) => {
                const StatusIcon = getStatusIcon(fleet.status)
                const totalShips = getTotalShips(fleet.ships)
                const isInTransit = fleet.status === 'in_transit'
                const isStationed = fleet.status === 'stationed'
                
                return (
                  <div key={fleet.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(fleet.status)}`} />
                      <div>
                        <h4 className="font-semibold">
                          {fleet.name || `Fleet #${fleet.id}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {totalShips} ship{totalShips !== 1 ? 's' : ''} • {fleet.status.replace('_', ' ')}
                        </p>
                        {fleet.origin_coordinate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {formatCoordinate(fleet.origin_coordinate)}
                          </p>
                        )}
                        {fleet.order_type && (
                          <p className="text-xs text-muted-foreground">
                            Order: {fleet.order_type}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-2 text-sm flex-wrap justify-end">
                          {Array.isArray(fleet.ships) && fleet.ships.map((ship: any, idx: number) => {
                            const shipName = getShipName(ship.definition_id)
                            return (
                              <Badge key={idx} variant="outline">
                                {ship.quantity} {shipName}
                              </Badge>
                            )
                          })}
                        </div>
                        {isInTransit && fleet.arrival_tick && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Arrives at tick {fleet.arrival_tick}
                          </p>
                        )}
                        {fleet.destination_coordinate && fleet.order_type !== 'return' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            To: {typeof fleet.destination_coordinate === 'string' 
                              ? fleet.destination_coordinate 
                              : formatCoordinate(fleet.destination_coordinate)}
                          </p>
                        )}
                        {fleet.order_type === 'return' && fleet.destination_coordinate && (
                          <p className="text-xs text-orange-400 mt-1">
                            Returning to: {typeof fleet.destination_coordinate === 'string' 
                              ? fleet.destination_coordinate 
                              : formatCoordinate(fleet.destination_coordinate)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {isStationed && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setFleetToMove(fleet)
                                setMoveDialogOpen(true)
                              }}
                            >
                              <Move className="w-4 h-4 mr-1" />
                              Move
                            </Button>
                          </>
                        )}
                        {isInTransit && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this fleet?')) {
                                try {
                                  const result = await cancelFleet(fleet.id).unwrap()
                                  console.log('Cancel fleet result:', result)
                                  toast.success('Fleet cancelled successfully')
                                } catch (error: any) {
                                  console.error('Cancel fleet error:', error)
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
      <Card className="panel-glass border-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-purple-400" />
            Build New Fleet
          </CardTitle>
          <CardDescription>
            Create a new fleet from ships on this planet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={buildDialogOpen} onOpenChange={setBuildDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Build Fleet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Build Fleet from {planet.name}</DialogTitle>
                <DialogDescription>
                  Select ships from this planet to create a new fleet
                </DialogDescription>
              </DialogHeader>
              <FleetBuilder planetId={Number(planet.id)} onSuccess={() => setBuildDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Move Fleet Dialog */}
      {fleetToMove && (
        <MoveFleetDialog
          fleet={fleetToMove}
          isOpen={moveDialogOpen}
          onClose={() => {
            setMoveDialogOpen(false)
            setFleetToMove(null)
          }}
        />
      )}
    </div>
  )
}
