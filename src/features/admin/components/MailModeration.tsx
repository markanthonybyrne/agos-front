import { useState } from 'react'
import { useListMailQuery, useDeleteMailMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AdminMail } from '@/types/api.types'
import { Trash2 } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'

export function MailModeration() {
  const [page, setPage] = useState(1)
  const [fromEmpireId, setFromEmpireId] = useState<number | undefined>(undefined)
  const [toEmpireId, setToEmpireId] = useState<number | undefined>(undefined)

  const { data, isLoading } = useListMailQuery({
    page,
    per_page: 25,
    from_empire_id: fromEmpireId,
    to_empire_id: toEmpireId,
  })

  const [deleteMail] = useDeleteMailMutation()

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this mail message?')) return
    try {
      await deleteMail(id).unwrap()
      toast.success('Mail deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed')
    }
  }

  const columns: Column<AdminMail>[] = [
    { key: 'id', header: 'ID', accessor: (m) => <span className="font-mono">{m.id}</span> },
    {
      key: 'from',
      header: 'From',
      accessor: (m) => (
        <div>
          <div className="font-medium">{m.from_empire.name}</div>
          <div className="text-xs text-muted-foreground">ID: {m.from_empire.id}</div>
        </div>
      ),
    },
    {
      key: 'to',
      header: 'To',
      accessor: (m) => (
        <div>
          <div className="font-medium">{m.to_empire.name}</div>
          <div className="text-xs text-muted-foreground">ID: {m.to_empire.id}</div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      accessor: (m) => (
        <div>
          <div className="font-medium">{m.subject}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{m.body.substring(0, 100)}...</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (m) => m.is_read ? <Badge>Read</Badge> : <Badge variant="secondary">Unread</Badge>,
    },
    { key: 'date', header: 'Date', accessor: (m) => formatDateTime(m.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Mail Moderation</h2>
        <p className="text-muted-foreground">Moderate mail messages</p>
      </div>

      <div className="flex gap-4">
        <input
          type="number"
          placeholder="Filter by From Empire ID"
          value={fromEmpireId || ''}
          onChange={(e) => setFromEmpireId(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 border rounded-md bg-background"
        />
        <input
          type="number"
          placeholder="Filter by To Empire ID"
          value={toEmpireId || ''}
          onChange={(e) => setToEmpireId(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 border rounded-md bg-background"
        />
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No mail messages found"
        rowActions={(mail) => (
          <Button variant="ghost" size="sm" onClick={() => handleDelete(mail.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        )}
      />
    </div>
  )
}
