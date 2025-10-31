import { useState } from 'react'
import { useListFleetsQuery, useDeleteFleetMutation, useTeleportFleetMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminFleet } from '@/types/api.types'
import { Trash2, Rocket, Eye } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'

const teleportSchema = z.object({
  quadrant: z.number().min(1),
  sector: z.number().min(1),
  galaxy: z.number().min(1),
  planet: z.number().min(1),
})

export function FleetManagement() {
  const [page, setPage] = useState(1)
  const [selectedFleet, setSelectedFleet] = useState<AdminFleet | null>(null)
  const [teleportDialogOpen, setTeleportDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data, isLoading } = useListFleetsQuery({ page, per_page: 25 })

  const [deleteFleet] = useDeleteFleetMutation()
  const [teleportFleet] = useTeleportFleetMutation()

  const form = useForm<z.infer<typeof teleportSchema>>({ resolver: zodResolver(teleportSchema) })

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this fleet?')) return
    try {
      await deleteFleet(id).unwrap()
      toast.success('Fleet deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const handleTeleport = async (data: z.infer<typeof teleportSchema>) => {
    if (!selectedFleet) return
    try {
      await teleportFleet({ id: selectedFleet.id, data }).unwrap()
      toast.success('Fleet teleported')
      setTeleportDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const handleView = (fleet: AdminFleet) => {
    setSelectedFleet(fleet)
    setDetailDialogOpen(true)
  }

  const getTotalShips = (fleet: AdminFleet) => {
    return fleet.ships.reduce((total, ship) => total + ship.quantity, 0)
  }

  const getDestinationCoordinate = (fleet: AdminFleet) => {
    return formatCoordinate(`${fleet.destination_quadrant}:${fleet.destination_sector}:${fleet.destination_galaxy}:${fleet.destination_planet}`)
  }

  const getOriginCoordinate = (fleet: AdminFleet) => {
    if (fleet.origin) {
      return formatCoordinate(`${fleet.origin.quadrant}:${fleet.origin.sector}:${fleet.origin.galaxy}:${fleet.origin.planet}`)
    }
    return `Planet ID: ${fleet.origin_planet_id}`
  }

  const columns: Column<AdminFleet>[] = [
    { key: 'id', header: 'ID', accessor: (f) => <span className="font-mono">{f.id}</span> },
    {
      key: 'owner',
      header: 'Owner',
      accessor: (f) => (
        <div>
          <div className="font-medium">{f.owner?.name || `Empire ${f.owner_empire_id}`}</div>
          <div className="text-xs text-muted-foreground">ID: {f.owner_empire_id}</div>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Origin',
      accessor: (f) => (
        <div>
          <div className="font-mono text-sm">{getOriginCoordinate(f)}</div>
          {f.origin && (
            <div className="text-xs text-muted-foreground">{f.origin.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      accessor: (f) => (
        <span className="font-mono text-sm">{getDestinationCoordinate(f)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (f) => (
        <Badge variant={f.status === 'in_transit' || f.status === 'arrived' ? 'default' : 'secondary'}>
          {f.status}
        </Badge>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      accessor: (f) => (
        <Badge variant="outline">{f.order_type}</Badge>
      ),
    },
    {
      key: 'ships',
      header: 'Ships',
      accessor: (f) => <span className="font-medium">{getTotalShips(f)}</span>,
    },
    {
      key: 'ticks',
      header: 'Ticks',
      accessor: (f) => (
        <div className="text-xs">
          <div>Dep: {f.departure_tick}</div>
          <div>Arr: {f.arrival_tick}</div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Fleet Management</h2>
        <p className="text-muted-foreground">Manage fleets and teleport operations</p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No fleets found"
        rowActions={(fleet) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleView(fleet)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedFleet(fleet); setTeleportDialogOpen(true) }}>
              <Rocket className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(fleet.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      {/* Fleet Detail Dialog */}
      {selectedFleet && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fleet #{selectedFleet.id} Details</DialogTitle>
              <DialogDescription>
                Created: {formatDateTime(selectedFleet.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Owner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Empire</div>
                        <div className="font-medium">{selectedFleet.owner?.name || `Empire ${selectedFleet.owner_empire_id}`}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: {selectedFleet.owner_empire_id}</div>
                      </div>
                      {selectedFleet.owner && (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground">Score</div>
                            <div>{selectedFleet.owner.score.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Planets Owned</div>
                            <div>{selectedFleet.owner.planets_owned}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div>
                          <Badge variant={selectedFleet.status === 'in_transit' || selectedFleet.status === 'arrived' ? 'default' : 'secondary'}>
                            {selectedFleet.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Order Type</div>
                        <div>
                          <Badge variant="outline">{selectedFleet.order_type}</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Auto Return on Failure</div>
                        <div>{selectedFleet.auto_return_on_failure ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Origin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedFleet.origin ? (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground">Planet</div>
                            <div className="font-medium">{selectedFleet.origin.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {formatCoordinate(`${selectedFleet.origin.quadrant}:${selectedFleet.origin.sector}:${selectedFleet.origin.galaxy}:${selectedFleet.origin.planet}`)}
                            </div>
                            <div className="text-xs text-muted-foreground">ID: {selectedFleet.origin.id}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">State</div>
                            <div>
                              <Badge variant="outline">{selectedFleet.origin.state}</Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="text-sm text-muted-foreground">Planet ID</div>
                          <div className="font-mono">{selectedFleet.origin_planet_id}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Coordinate</div>
                        <div className="font-mono font-medium">
                          {getDestinationCoordinate(selectedFleet)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Breakdown</div>
                        <div className="text-xs font-mono">
                          Q:{selectedFleet.destination_quadrant} S:{selectedFleet.destination_sector} G:{selectedFleet.destination_galaxy} P:{selectedFleet.destination_planet}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Departure Tick</div>
                      <div className="font-mono font-medium">{selectedFleet.departure_tick}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Arrival Tick</div>
                      <div className="font-mono font-medium">{selectedFleet.arrival_tick}</div>
                    </div>
                    {selectedFleet.arrival_tick > selectedFleet.departure_tick && (
                      <div>
                        <div className="text-muted-foreground">Travel Duration</div>
                        <div className="font-medium">{selectedFleet.arrival_tick - selectedFleet.departure_tick} ticks</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ships</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFleet.ships && selectedFleet.ships.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        Total Ships: <span className="font-medium text-foreground">{getTotalShips(selectedFleet)}</span>
                      </div>
                      <div className="space-y-1">
                        {selectedFleet.ships.map((ship, idx) => (
                          <div key={idx} className="flex justify-between text-sm border-b border-border/50 pb-1">
                            <span className="text-muted-foreground">Ship Definition ID {ship.definition_id}</span>
                            <span className="font-mono font-medium">{ship.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No ships in this fleet</p>
                  )}
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground">
                Last Updated: {formatDateTime(selectedFleet.updated_at)}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={teleportDialogOpen} onOpenChange={setTeleportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teleport Fleet {selectedFleet?.id}</DialogTitle>
            <DialogDescription>
              Teleport fleet to a new location instantly
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleTeleport)} className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-2">
                <Label>Quadrant</Label>
                <Input type="number" {...form.register('quadrant', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input type="number" {...form.register('sector', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Galaxy</Label>
                <Input type="number" {...form.register('galaxy', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Planet</Label>
                <Input type="number" {...form.register('planet', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTeleportDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Teleport</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
