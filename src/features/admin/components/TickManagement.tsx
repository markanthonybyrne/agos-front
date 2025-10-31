import { useState } from 'react'
import { useListTicksQuery, useGetTickQuery, useRollbackTickMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
    setSelectedTick(tick.tick_number)
    setDetailDialogOpen(true)
  }

  const handleRollback = (tick: AdminTick) => {
    form.reset({ tick_number: tick.tick_number, reason: '' })
    setSelectedTick(tick.tick_number)
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
    { 
      key: 'tick_number', 
      header: 'Tick #', 
      accessor: (t) => <span className="font-mono font-bold">{t.tick_number}</span> 
    },
    { 
      key: 'started', 
      header: 'Started At', 
      accessor: (t) => formatDateTime(t.started_at) 
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (t) => {
        // Determine status from stats
        const hasFinished = t.stats.finished_at
        const isFailed = t.stats.duration_seconds < 0 && !hasFinished
        const status = hasFinished ? 'completed' : isFailed ? 'failed' : 'processing'
        return (
          <Badge variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
            {status}
          </Badge>
        )
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: (t) => {
        const duration = Math.abs(t.stats.duration_seconds)
        return duration ? `${duration.toFixed(3)}s` : 'N/A'
      },
    },
    {
      key: 'stats',
      header: 'Statistics',
      accessor: (t) => (
        <div className="text-xs space-y-0.5">
          <div>Planets: {t.stats.planets_processed || 0}</div>
          <div>Combats: {t.stats.combats_resolved || 0}</div>
          <div>Fleets: {t.stats.fleets_arrived || 0}</div>
        </div>
      ),
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tick {selectedTick} Details</DialogTitle>
            <DialogDescription>Detailed information about tick processing</DialogDescription>
          </DialogHeader>
          {tickDetail?.tick ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tick Number</Label>
                  <div className="font-mono font-bold text-lg">{tickDetail.tick.tick_number}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={tickDetail.tick.stats.finished_at ? 'default' : 'destructive'}>
                      {tickDetail.tick.stats.finished_at ? 'Completed' : 'Processing'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Started At</Label>
                  <div className="text-sm">{formatDateTime(tickDetail.tick.started_at)}</div>
                </div>
                {tickDetail.tick.stats.finished_at && (
                  <div>
                    <Label className="text-muted-foreground">Finished At</Label>
                    <div className="text-sm">{formatDateTime(tickDetail.tick.stats.finished_at)}</div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <div className="text-sm">
                    {Math.abs(tickDetail.tick.stats.duration_seconds).toFixed(3)}s
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Processing Statistics</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {tickDetail.tick.stats.planets_processed !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Planets Processed:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.planets_processed}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.combats_resolved !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Combats Resolved:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.combats_resolved}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.production_applied !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Production Applied:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.production_applied}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.facilities_completed !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Facilities Completed:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.facilities_completed}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.research_completed !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Research Completed:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.research_completed}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.fleets_arrived !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Fleets Arrived:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.fleets_arrived}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.defences_completed !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Defences Completed:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.defences_completed}</span>
                    </div>
                  )}
                  {tickDetail.tick.stats.ships_completed !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Ships Completed:</span>
                      <span className="font-medium ml-2">{tickDetail.tick.stats.ships_completed}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading tick details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
