import { useState } from 'react'
import { useListCombatsQuery, useDeleteCombatMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { AdminCombat } from '@/types/api.types'
import { Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/formatters'

export function CombatManagement() {
  const [page, setPage] = useState(1)
  const [tickFilter, setTickFilter] = useState<number | undefined>(undefined)

  const { data, isLoading } = useListCombatsQuery({
    page,
    per_page: 25,
    tick_number: tickFilter,
  })

  const [deleteCombat] = useDeleteCombatMutation()

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this combat log?')) return
    try {
      await deleteCombat(id).unwrap()
      toast.success('Combat log deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const columns: Column<AdminCombat>[] = [
    { key: 'id', header: 'ID', accessor: (c) => <span className="font-mono">{c.id}</span> },
    { key: 'tick', header: 'Tick', accessor: (c) => <span className="font-mono">{c.tick_number}</span> },
    {
      key: 'attacker',
      header: 'Attacker',
      accessor: (c) => (
        <div>
          <div>{c.attacker_empire_name}</div>
          <div className="text-xs text-muted-foreground">ID: {c.attacker_empire_id}</div>
        </div>
      ),
    },
    {
      key: 'defender',
      header: 'Defender',
      accessor: (c) => (
        <div>
          <div>{c.defender_empire_name}</div>
          <div className="text-xs text-muted-foreground">ID: {c.defender_empire_id}</div>
        </div>
      ),
    },
    {
      key: 'planet',
      header: 'Planet',
      accessor: (c) => (
        <div>
          <div className="font-mono text-sm">{c.planet_coordinate}</div>
          <div className="text-xs text-muted-foreground">ID: {c.planet_id}</div>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      accessor: (c) => (
        <div className="space-y-1">
          <Badge variant={c.attacker_won ? 'default' : 'destructive'}>
            {c.attacker_won ? 'Attacker Won' : 'Defender Won'}
          </Badge>
          {c.planet_captured && <Badge variant="outline">Planet Captured</Badge>}
        </div>
      ),
    },
    { key: 'date', header: 'Date', accessor: (c) => formatDate(c.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Combat Management</h2>
        <p className="text-muted-foreground">View and manage combat logs</p>
      </div>

      <Input
        type="number"
        placeholder="Filter by Tick Number (leave empty for all)"
        value={tickFilter || ''}
        onChange={(e) => {
          setTickFilter(e.target.value ? Number(e.target.value) : undefined)
          setPage(1)
        }}
        className="max-w-md"
      />

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No combat logs found"
        rowActions={(combat) => (
          <Button variant="ghost" size="sm" onClick={() => handleDelete(combat.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      />
    </div>
  )
}
