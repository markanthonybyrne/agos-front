import { useState } from 'react'
import { useListFleetsQuery, useDeleteFleetMutation, useTeleportFleetMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminFleet } from '@/types/api.types'
import { Trash2, Rocket } from 'lucide-react'
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

  const columns: Column<AdminFleet>[] = [
    { key: 'id', header: 'ID', accessor: (f) => <span className="font-mono">{f.id}</span> },
    {
      key: 'owner',
      header: 'Owner',
      accessor: (f) => f.owner ? f.owner.name : 'Unknown',
    },
    {
      key: 'origin',
      header: 'Origin',
      accessor: (f) => <span className="font-mono text-sm">{typeof f.origin_coordinate === 'string' ? f.origin_coordinate : formatCoordinate(f.origin_coordinate)}</span>,
    },
    {
      key: 'destination',
      header: 'Destination',
      accessor: (f) => <span className="font-mono text-sm">{typeof f.destination_coordinate === 'string' ? f.destination_coordinate : formatCoordinate(f.destination_coordinate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (f) => <Badge variant={f.status === 'in_transit' ? 'default' : 'secondary'}>{f.status}</Badge>,
    },
    {
      key: 'ships',
      header: 'Ships',
      accessor: (f) => <span>{Object.values(f.ships).reduce((a, b) => a + b, 0)}</span>,
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
            <Button variant="ghost" size="sm" onClick={() => { setSelectedFleet(fleet); setTeleportDialogOpen(true) }}>
              <Rocket className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(fleet.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      <Dialog open={teleportDialogOpen} onOpenChange={setTeleportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teleport Fleet</DialogTitle>
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
