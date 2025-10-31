import { useState } from 'react'
import { useListEmpiresQuery, useDeleteEmpireMutation, useUpdateEmpireMutation, useTransferEmpireMutation, useResetEmpireScoreMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminEmpire } from '@/types/api.types'
import { Pencil, Trash2, ArrowRight, RotateCcw } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/formatters'

const updateEmpireSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  score: z.number().min(0).optional(),
})

const transferSchema = z.object({
  user_id: z.number().min(1),
})

type UpdateEmpireFormData = z.infer<typeof updateEmpireSchema>
type TransferFormData = z.infer<typeof transferSchema>

export function EmpireManagement() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedEmpire, setSelectedEmpire] = useState<AdminEmpire | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const { data, isLoading } = useListEmpiresQuery({
    page,
    per_page: 25,
    search: search || undefined,
  })

  const [updateEmpire, { isLoading: isUpdating }] = useUpdateEmpireMutation()
  const [deleteEmpire, { isLoading: isDeleting }] = useDeleteEmpireMutation()
  const [transferEmpire, { isLoading: isTransferring }] = useTransferEmpireMutation()
  const [resetScore, { isLoading: isResetting }] = useResetEmpireScoreMutation()

  const form = useForm<UpdateEmpireFormData>({
    resolver: zodResolver(updateEmpireSchema),
  })

  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  })

  const handleEdit = (empire: AdminEmpire) => {
    setSelectedEmpire(empire)
    form.reset({
      name: empire.name,
      description: empire.description || '',
      score: empire.score,
    })
    setEditDialogOpen(true)
  }

  const handleTransfer = (empire: AdminEmpire) => {
    setSelectedEmpire(empire)
    transferForm.reset({ user_id: 0 })
    setTransferDialogOpen(true)
  }

  const handleUpdate = async (data: UpdateEmpireFormData) => {
    if (!selectedEmpire) return

    try {
      await updateEmpire({
        id: selectedEmpire.id,
        data,
      }).unwrap()
      toast.success('Empire updated successfully')
      setEditDialogOpen(false)
      setSelectedEmpire(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update empire')
    }
  }

  const handleDelete = async (empireId: number) => {
    if (!window.confirm('Are you sure you want to delete this empire? This action cannot be undone.')) {
      return
    }

    try {
      await deleteEmpire(empireId).unwrap()
      toast.success('Empire deleted successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete empire')
    }
  }

  const handleTransferSubmit = async (data: TransferFormData) => {
    if (!selectedEmpire) return

    try {
      await transferEmpire({
        id: selectedEmpire.id,
        data,
      }).unwrap()
      toast.success('Empire ownership transferred successfully')
      setTransferDialogOpen(false)
      setSelectedEmpire(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to transfer empire')
    }
  }

  const handleResetScore = async (empireId: number) => {
    if (!window.confirm('Are you sure you want to reset this empire\'s score to 0?')) {
      return
    }

    try {
      await resetScore(empireId).unwrap()
      toast.success('Empire score reset successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reset score')
    }
  }

  const columns: Column<AdminEmpire>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (empire) => <span className="font-mono">{empire.id}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (empire) => (
        <div>
          <div className="font-medium">{empire.name}</div>
          {empire.user && (
            <div className="text-xs text-muted-foreground">User: {empire.user.username}</div>
          )}
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      accessor: (empire) => <span className="font-medium">{formatNumber(empire.score)}</span>,
    },
    {
      key: 'planets',
      header: 'Planets',
      accessor: (empire) => <span>{empire.planets_owned}</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      accessor: (empire) => <span className="text-sm">{formatDate(empire.created_at)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Empire Management</h2>
        <p className="text-muted-foreground">Manage empires, scores, and ownership</p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search empires..."
        emptyMessage="No empires found"
        rowActions={(empire) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(empire)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResetScore(empire.id)}
              disabled={isResetting}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTransfer(empire)}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(empire.id)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Empire</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                {...form.register('score', { valueAsNumber: true })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Empire Ownership</DialogTitle>
          </DialogHeader>
          <form onSubmit={transferForm.handleSubmit(handleTransferSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                type="number"
                {...transferForm.register('user_id', { valueAsNumber: true })}
              />
              {transferForm.formState.errors.user_id && (
                <p className="text-sm text-destructive">
                  {transferForm.formState.errors.user_id.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isTransferring}>
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
