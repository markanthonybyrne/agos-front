import { useState } from 'react'
import { useListPlanetsQuery, useDeletePlanetMutation, useUpdatePlanetMutation, useTransferPlanetMutation, useResetPlanetMutation, useModifyPlanetResourcesMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminPlanet } from '@/types/api.types'
import { Pencil, Trash2, ArrowRight, RotateCcw, Coins } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'

const updatePlanetSchema = z.object({
  name: z.string().min(1).optional(),
  state: z.enum(['unsettled', 'colony', 'homeworld']).optional(),
  tellerium_balance: z.number().min(0).optional(),
  krypton_balance: z.number().min(0).optional(),
  mines: z.number().min(0).optional(),
  probes: z.number().min(0).optional(),
})

const transferSchema = z.object({
  empire_id: z.number().min(1),
})

const modifyResourcesSchema = z.object({
  tellerium: z.number().optional(),
  krypton: z.number().optional(),
  reason: z.string().min(1, 'Reason is required'),
})

type UpdatePlanetFormData = z.infer<typeof updatePlanetSchema>

export function PlanetManagement() {
  const [page, setPage] = useState(1)
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined)
  const [selectedPlanet, setSelectedPlanet] = useState<AdminPlanet | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false)

  const { data, isLoading } = useListPlanetsQuery({
    page,
    per_page: 25,
    state: stateFilter as any,
  })

  const [updatePlanet] = useUpdatePlanetMutation()
  const [deletePlanet] = useDeletePlanetMutation()
  const [transferPlanet] = useTransferPlanetMutation()
  const [resetPlanet] = useResetPlanetMutation()
  const [modifyResources] = useModifyPlanetResourcesMutation()

  const form = useForm<UpdatePlanetFormData>({ resolver: zodResolver(updatePlanetSchema) })
  const transferForm = useForm<{ empire_id: number }>({ resolver: zodResolver(transferSchema) })
  const resourcesForm = useForm<{ tellerium?: number; krypton?: number; reason: string }>({
    resolver: zodResolver(modifyResourcesSchema),
  })

  const handleEdit = (planet: AdminPlanet) => {
    setSelectedPlanet(planet)
    form.reset({
      name: planet.name,
      state: planet.state,
      tellerium_balance: planet.tellerium_balance,
      krypton_balance: planet.krypton_balance,
      mines: planet.mines,
      probes: planet.probes,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (data: UpdatePlanetFormData) => {
    if (!selectedPlanet) return
    try {
      await updatePlanet({ id: selectedPlanet.id, data }).unwrap()
      toast.success('Planet updated')
      setEditDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update planet')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this planet?')) return
    try {
      await deletePlanet(id).unwrap()
      toast.success('Planet deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete')
    }
  }

  const handleReset = async (id: number) => {
    if (!window.confirm('Reset planet to unsettled state?')) return
    try {
      await resetPlanet(id).unwrap()
      toast.success('Planet reset')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to reset')
    }
  }

  const handleModifyResources = async (data: { tellerium?: number; krypton?: number; reason: string }) => {
    if (!selectedPlanet) return
    try {
      await modifyResources({ id: selectedPlanet.id, data }).unwrap()
      toast.success('Resources modified')
      setResourcesDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to modify resources')
    }
  }

  const columns: Column<AdminPlanet>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (p) => <span className="font-mono">{p.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (p) => {
        // Debug coordinate format
        if (!p.coordinate || (typeof p.coordinate === 'string' && !p.coordinate.trim())) {
          console.warn('Planet missing coordinate:', p.id, p.name, 'coordinate:', p.coordinate)
        }
        const coordStr = formatCoordinate(p.coordinate)
        return (
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{coordStr}</div>
          </div>
        )
      },
    },
    {
      key: 'state',
      header: 'State',
      accessor: (p) => (
        <Badge variant={p.state === 'homeworld' ? 'default' : p.state === 'colony' ? 'secondary' : 'outline'}>
          {p.state}
        </Badge>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      accessor: (p) => {
        // Debug: log owner data to see what we're getting
        if (p.state !== 'unsettled' && !p.owner_empire && !p.owner_empire_id) {
          console.warn('Planet has state but no owner:', p.id, p.name, p.state, 'owner_empire:', p.owner_empire, 'owner_empire_id:', p.owner_empire_id)
        }
        
        if (p.owner_empire) {
          return <span>{p.owner_empire.name} (ID: {p.owner_empire.id})</span>
        } else if (p.owner_empire_id) {
          return <span>Empire ID: {p.owner_empire_id}</span>
        } else {
          return <span className="text-muted-foreground">Unsettled</span>
        }
      },
    },
    {
      key: 'resources',
      header: 'Resources',
      accessor: (p) => (
        <div className="text-sm">
          <div>T: {formatNumber(p.tellerium_balance)}</div>
          <div>K: {formatNumber(p.krypton_balance)}</div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Planet Management</h2>
        <p className="text-muted-foreground">Manage planets, resources, and ownership</p>
      </div>

      <Select value={stateFilter || 'all'} onValueChange={(v) => { setStateFilter(v === 'all' ? undefined : v as any); setPage(1) }}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          <SelectItem value="unsettled">Unsettled</SelectItem>
          <SelectItem value="colony">Colony</SelectItem>
          <SelectItem value="homeworld">Homeworld</SelectItem>
        </SelectContent>
      </Select>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No planets found"
        rowActions={(planet) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(planet)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedPlanet(planet); setResourcesDialogOpen(true) }}>
              <Coins className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleReset(planet.id)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(planet.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Planet</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.watch('state')} onValueChange={(v) => form.setValue('state', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unsettled">Unsettled</SelectItem>
                    <SelectItem value="colony">Colony</SelectItem>
                    <SelectItem value="homeworld">Homeworld</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tellerium</Label>
                <Input type="number" {...form.register('tellerium_balance', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Krypton</Label>
                <Input type="number" {...form.register('krypton_balance', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Mines</Label>
                <Input type="number" {...form.register('mines', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Probes</Label>
                <Input type="number" {...form.register('probes', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resourcesDialogOpen} onOpenChange={setResourcesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Planet Resources</DialogTitle>
          </DialogHeader>
          <form onSubmit={resourcesForm.handleSubmit(handleModifyResources)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tellerium Adjustment</Label>
              <Input type="number" {...resourcesForm.register('tellerium', { valueAsNumber: true })} placeholder="Leave empty for no change" />
            </div>
            <div className="space-y-2">
              <Label>Krypton Adjustment</Label>
              <Input type="number" {...resourcesForm.register('krypton', { valueAsNumber: true })} placeholder="Leave empty for no change" />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea {...resourcesForm.register('reason')} placeholder="Required: Enter reason for modification" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResourcesDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Modify</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
