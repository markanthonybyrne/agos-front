import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGetAllianceStatusQuery } from '@/api/endpoints/alliancesApi'
import { useAlliancePermissions } from '@/hooks/useAlliancePermissions'
import { Ship, ArrowUpRight, ArrowDownRight, AlertCircle, Shield } from 'lucide-react'
import { formatCoordinate } from '@/lib/coordinates'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetMeQuery } from '@/api/endpoints/authApi'

interface AllianceStatusProps {
  allianceId: number
}

export function AllianceStatus({ allianceId }: AllianceStatusProps) {
  const permissions = useAlliancePermissions(allianceId)
  const { data: statusData, isLoading } = useGetAllianceStatusQuery(allianceId)
  const { data: meData } = useGetMeQuery()

  if (permissions.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!permissions.canViewStatus && !permissions.isLeader) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            You don't have permission to view alliance status
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!statusData) {
    return (
      <Card className="panel-glass border-red-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Status</h3>
          <p className="text-muted-foreground text-center">
            Failed to load alliance status
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentTick = (meData as any)?.current_tick || (meData as any)?.next_tick?.tick_number || 0
  const outgoing = statusData.outgoing || []
  const incoming = statusData.incoming || []

  const calculateETA = (arrivalTick: number, currentTick: number) => {
    const ticksRemaining = arrivalTick - currentTick
    return ticksRemaining > 0 ? ticksRemaining : 0
  }

  return (
    <div className="space-y-6">
      {/* Outgoing Fleets */}
      <Card className="panel-glass border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-400" />
            Outgoing Fleets ({outgoing.length})
          </CardTitle>
          <CardDescription>
            Fleets leaving alliance planets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outgoing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ship className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No outgoing fleets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((fleet) => {
                const eta = calculateETA(fleet.arrival_tick, fleet.current_tick)
                return (
                  <div
                    key={fleet.fleet_id}
                    className="p-4 bg-muted/20 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{fleet.owner.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Fleet #{fleet.fleet_id}
                        </div>
                      </div>
                      <Badge variant="outline">{fleet.order_type}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Origin</div>
                        <div className="font-mono">
                          {formatCoordinate(fleet.origin)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Destination</div>
                        <div className="font-mono">
                          {formatCoordinate(fleet.destination)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">ETA: </span>
                      <span className="font-semibold">{eta} ticks</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming Fleets */}
      <Card className="panel-glass border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-red-400" />
            Incoming Fleets ({incoming.length})
          </CardTitle>
          <CardDescription>
            Fleets heading to alliance planets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No incoming fleets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incoming.map((fleet) => {
                const eta = calculateETA(fleet.arrival_tick, fleet.current_tick)
                return (
                  <div
                    key={fleet.fleet_id}
                    className="p-4 bg-muted/20 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{fleet.owner.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Fleet #{fleet.fleet_id}
                        </div>
                      </div>
                      <Badge variant="outline">{fleet.order_type}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Origin</div>
                        <div className="font-mono">
                          {formatCoordinate(fleet.origin)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Destination</div>
                        <div className="font-mono">
                          {formatCoordinate(fleet.destination)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">ETA: </span>
                      <span className="font-semibold">{eta} ticks</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

