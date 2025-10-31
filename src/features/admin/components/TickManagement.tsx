import { useState } from 'react'
import { useListTicksQuery, useGetTickQuery, useRollbackTickMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminTick } from '@/types/api.types'
import { RotateCcw, Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'

const rollbackSchema = z.object({
  tick_number: z.number().min(1),
  reason: z.string().min(1, 'Reason is required'),
})

export function TickManagement() {
  const [page, setPage] = useState(1)
  const [selectedTick, setSelectedTick] = useState<number | null>(null)
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data: ticksData, isLoading } = useListTicksQuery({ page, per_page: 25 })
  const { data: tickDetail } = useGetTickQuery(selectedTick || 0, { skip: !selectedTick || !detailDialogOpen })
  const [rollbackTick] = useRollbackTickMutation()

  const form = useForm<z.infer<typeof rollbackSchema>>({ resolver: zodResolver(rollbackSchema) })

  const handleView = (tick: AdminTick) => {
    setSelectedTick(tick.number)
    setDetailDialogOpen(true)
  }

  const handleRollback = (tick: AdminTick) => {
    form.reset({ tick_number: tick.number, reason: '' })
    setSelectedTick(tick.number)
    setRollbackDialogOpen(true)
  }

  const handleRollbackSubmit = async (data: z.infer<typeof rollbackSchema>) => {
    try {
      await rollbackTick(data).unwrap()
      toast.success('Tick rollback initiated')
      setRollbackDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to rollback tick')
    }
  }

  const columns: Column<AdminTick>[] = [
    { key: 'number', header: 'Tick #', accessor: (t) => <span className="font-mono font-bold">{t.number}</span> },
    { key: 'processed', header: 'Processed At', accessor: (t) => formatDateTime(t.processed_at) },
    {
      key: 'status',
      header: 'Status',
      accessor: (t) => (
        <Badge variant={t.status === 'completed' ? 'default' : t.status === 'failed' ? 'destructive' : 'secondary'}>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: (t) => t.duration_seconds ? `${t.duration_seconds}s` : 'N/A',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Tick Management</h2>
        <p className="text-muted-foreground">View tick history and rollback operations</p>
      </div>

      <DataTable
        data={ticksData?.data || []}
        columns={columns}
        loading={isLoading}
        meta={ticksData?.meta}
        onPageChange={setPage}
        emptyMessage="No ticks found"
        rowActions={(tick) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleView(tick)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleRollback(tick)}>
              <RotateCcw className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Tick {selectedTick}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleRollbackSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea {...form.register('reason')} placeholder="Enter reason for rollback" />
              {form.formState.errors.reason && (
                <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
              )}
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
              <strong>Warning:</strong> Rolling back a tick will revert game state. This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRollbackDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive">Rollback Tick</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tick {selectedTick} Details</DialogTitle>
          </DialogHeader>
          {tickDetail?.tick && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tick Number</Label>
                  <div className="font-mono font-bold">{tickDetail.tick.number}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={tickDetail.tick.status === 'completed' ? 'default' : 'destructive'}>
                      {tickDetail.tick.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Processed At</Label>
                  <div>{formatDateTime(tickDetail.tick.processed_at)}</div>
                </div>
                {tickDetail.tick.duration_seconds && (
                  <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <div>{tickDetail.tick.duration_seconds}s</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
