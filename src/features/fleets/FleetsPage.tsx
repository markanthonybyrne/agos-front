import { useState } from 'react'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Ship, Plus, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber } from '@/lib/formatters'
import { FleetBuilder } from './FleetBuilder'

type ViewType = 'list' | 'builder'

export function FleetsPage() {
  const [activeView, setActiveView] = useState<ViewType>('list')
  const { data: fleets, isLoading, error } = useGetFleetsQuery()
  
  // Debug logging
  console.log('Fleets API response:', fleets)

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>Failed to load fleets</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle different possible API response structures
  let fleetList: any[] = []
  if (fleets) {
    if (Array.isArray(fleets)) {
      // Direct array response
      fleetList = fleets
    } else if (Array.isArray(fleets.fleets)) {
      // Wrapped response with fleets property
      fleetList = fleets.fleets
    } else if (Array.isArray((fleets as any).data?.fleets)) {
      // Double-wrapped response
      fleetList = (fleets as any).data.fleets
    }
  }
  
  // Debug logging
  console.log('Fleet list type:', typeof fleetList, 'Is array:', Array.isArray(fleetList))

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

  const getTotalShips = (ships: Record<string, number>) => {
    return Object.values(ships).reduce((total, count) => total + count, 0)
  }

  const getFleetSummary = () => {
    const stationed = fleetList.filter((f: any) => f.status === 'stationed').length
    const inTransit = fleetList.filter((f: any) => f.status === 'in_transit').length
    const totalShips = fleetList.reduce((total: number, fleet: any) => total + getTotalShips(fleet.ships), 0)
    
    return { stationed, inTransit, totalShips }
  }

  const summary = getFleetSummary()

  if (activeView === 'builder') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView('list')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Fleet List
          </Button>
          <h1 className="text-3xl font-heading glow-cyan">Fleet Builder</h1>
        </div>
        <FleetBuilder />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading glow-cyan">Fleet Command</h1>
        <Button onClick={() => setActiveView('builder')}>
          <Plus className="w-4 h-4 mr-2" />
          Build Fleet
        </Button>
      </div>

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            Your Fleets
          </CardTitle>
          <CardDescription>
            Manage and monitor all your fleets across the galaxy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fleetList.length > 0 ? (
            <div className="space-y-4">
              {fleetList.map((fleet) => {
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
                        {fleet.order_type && (
                          <Badge variant="outline" className="mt-1">
                            {fleet.order_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-2 text-sm mb-2">
                          {Object.entries(fleet.ships).map(([shipType, count]) => (
                            <Badge key={shipType} variant="outline">
                              {String(count)} {shipType}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            From: {formatCoordinate(fleet.origin_coordinate)}
                          </div>
                          {fleet.destination_coordinate && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              To: {formatCoordinate(fleet.destination_coordinate)}
                            </div>
                          )}
                          {fleet.arrival_tick && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Arrives: Tick {fleet.arrival_tick}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {fleet.status === 'in_transit' && (
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
                You don't have any fleets yet. Build your first fleet to start exploring the galaxy.
              </p>
              <Button onClick={() => setActiveView('builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Build Your First Fleet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
