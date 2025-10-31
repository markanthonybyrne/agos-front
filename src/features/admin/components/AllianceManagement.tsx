import { useState } from 'react'
import { useListAlliancesQuery, useDeleteAllianceMutation, useUpdateAllianceMutation, useTransferAllianceLeadershipMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminAlliance } from '@/types/api.types'
import { Pencil, Trash2, ArrowRight } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/formatters'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  fund_tellerium: z.number().min(0).optional(),
  fund_krypton: z.number().min(0).optional(),
})

const transferSchema = z.object({
  empire_id: z.number().min(1),
})

export function AllianceManagement() {
  const [page, setPage] = useState(1)
  const [selectedAlliance, setSelectedAlliance] = useState<AdminAlliance | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const { data, isLoading } = useListAlliancesQuery({ page, per_page: 25 })
  const [updateAlliance] = useUpdateAllianceMutation()
  const [deleteAlliance] = useDeleteAllianceMutation()
  const [transferLeadership] = useTransferAllianceLeadershipMutation()

  const form = useForm<z.infer<typeof updateSchema>>({ resolver: zodResolver(updateSchema) })
  const transferForm = useForm<z.infer<typeof transferSchema>>({ resolver: zodResolver(transferSchema) })

  const handleEdit = (alliance: AdminAlliance) => {
    setSelectedAlliance(alliance)
    form.reset({ name: alliance.name, tag: alliance.tag, fund_tellerium: alliance.fund_tellerium, fund_krypton: alliance.fund_krypton })
    setEditDialogOpen(true)
  }

  const handleUpdate = async (data: z.infer<typeof updateSchema>) => {
    if (!selectedAlliance) return
    try {
      await updateAlliance({ id: selectedAlliance.id, data }).unwrap()
      toast.success('Alliance updated')
      setEditDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this alliance?')) return
    try {
      await deleteAlliance(id).unwrap()
      toast.success('Alliance deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const handleTransfer = async (data: z.infer<typeof transferSchema>) => {
    if (!selectedAlliance) return
    try {
      await transferLeadership({ id: selectedAlliance.id, data }).unwrap()
      toast.success('Leadership transferred')
      setTransferDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const columns: Column<AdminAlliance>[] = [
    { key: 'id', header: 'ID', accessor: (a) => <span className="font-mono">{a.id}</span> },
    {
      key: 'name',
      header: 'Name',
      accessor: (a) => (
        <div>
          <div className="font-medium">{a.name}</div>
          <div className="text-xs text-muted-foreground">[{a.tag}]</div>
        </div>
      ),
    },
    { key: 'leader', header: 'Leader', accessor: (a) => a.leader.name },
    { key: 'members', header: 'Members', accessor: (a) => a.member_count },
    {
      key: 'funds',
      header: 'Funds',
      accessor: (a) => (
        <div className="text-sm">
          <div>T: {formatNumber(a.fund_tellerium)}</div>
          <div>K: {formatNumber(a.fund_krypton)}</div>
        </div>
      ),
    },
    { key: 'created', header: 'Created', accessor: (a) => formatDate(a.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Alliance Management</h2>
        <p className="text-muted-foreground">Manage alliances and chat moderation</p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No alliances found"
        rowActions={(alliance) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(alliance)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedAlliance(alliance); setTransferDialogOpen(true) }}>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(alliance.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alliance</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input {...form.register('tag')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fund Tellerium</Label>
                <Input type="number" {...form.register('fund_tellerium', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Fund Krypton</Label>
                <Input type="number" {...form.register('fund_krypton', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Leadership</DialogTitle>
          </DialogHeader>
          <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-4">
            <div className="space-y-2">
              <Label>Empire ID</Label>
              <Input type="number" {...transferForm.register('empire_id', { valueAsNumber: true })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
