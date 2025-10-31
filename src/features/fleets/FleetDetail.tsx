import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useGetFleetQuery } from '@/api/endpoints/fleetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Ship, Clock, MapPin, AlertCircle, CheckCircle, Rocket } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { MoveFleetDialog } from './MoveFleetDialog'

export function FleetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const { data: fleetData, isLoading, error } = useGetFleetQuery(Number(id), {
    skip: !id,
  })
  const { data: shipDefinitions } = useGetShipDefinitionsQuery()
  
  const fleet = fleetData?.fleet

  const getShipName = (definitionId: number) => {
    const shipDef = shipDefinitions?.ships?.find(s => s.id === definitionId)
    return shipDef?.name || `Ship #${definitionId}`
  }

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !fleet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Fleet Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The fleet you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button variant="outline" onClick={() => navigate('/fleets')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fleets
        </Button>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(fleet.status)
  const totalShips = getTotalShips(fleet.ships)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/fleets')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-heading glow-cyan">
            {fleet.name || `Fleet #${fleet.id}`}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon className={`w-5 h-5 ${getStatusColor(fleet.status)}`} />
            <Badge variant="outline" className={getStatusColor(fleet.status)}>
              {fleet.status.replace('_', ' ')}
            </Badge>
            {fleet.order_type && (
              <Badge variant="outline">
                {fleet.order_type}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ships</p>
                <p className="text-2xl font-mono glow-blue">{totalShips}</p>
              </div>
              <Ship className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {fleet.arrival_tick && fleet.status === 'in_transit' && (
          <Card className="panel-glass border-yellow/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Arrival Tick</p>
                  <p className="text-2xl font-mono glow-yellow">{fleet.arrival_tick}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Fleet Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ship Composition */}
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              Ship Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(fleet.ships) && fleet.ships.length > 0 ? (
              <div className="space-y-3">
                {fleet.ships.map((ship: any, idx: number) => {
                  const shipName = getShipName(ship.definition_id)
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div>
                        <p className="font-medium">{shipName}</p>
                        <p className="text-sm text-muted-foreground">Definition ID: {ship.definition_id}</p>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        {ship.quantity}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No ships in this fleet</p>
            )}
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="panel-glass border-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fleet.origin_coordinate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Origin</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <p className="font-mono text-sm">
                    {formatCoordinate(fleet.origin_coordinate)}
                      </p>
                </div>
              </div>
            )}

            {fleet.destination_coordinate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Destination</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <p className="font-mono text-sm">
                    {formatCoordinate(fleet.destination_coordinate)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {fleet.status === 'stationed' && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              Fleet Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowMoveDialog(true)}>
              <Rocket className="w-4 h-4 mr-2" />
              Move Fleet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Move Fleet Dialog */}
      {fleet && (
        <MoveFleetDialog
          fleet={fleet}
          isOpen={showMoveDialog}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  )
}

