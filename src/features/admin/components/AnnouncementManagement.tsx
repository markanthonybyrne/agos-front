import { useState } from 'react'
import { useListAnnouncementsQuery, useDeleteAnnouncementMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Announcement } from '@/types/api.types'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { AnnouncementForm } from './AnnouncementForm'

export function AnnouncementManagement() {
  const [page, setPage] = useState(1)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data, isLoading } = useListAnnouncementsQuery({
    page,
    per_page: 25,
  })

  const [deleteAnnouncement] = useDeleteAnnouncementMutation()

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setEditDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedAnnouncement(null)
    setCreateDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await deleteAnnouncement(id).unwrap()
      toast.success('Announcement deleted successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete announcement')
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Warning</Badge>
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Success</Badge>
      case 'info':
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Info</Badge>
    }
  }

  const columns: Column<Announcement>[] = [
    {
      key: 'priority',
      header: 'Priority',
      accessor: (a) => getPriorityBadge(a.priority),
    },
    {
      key: 'title',
      header: 'Title',
      accessor: (a) => (
        <div>
          <div className="font-medium">{a.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{a.message.substring(0, 100)}...</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (a) => a.is_active ? (
        <Badge variant="default">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
    },
    {
      key: 'pinned',
      header: 'Pinned',
      accessor: (a) => a.is_pinned ? (
        <Badge variant="outline">Pinned</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'schedule',
      header: 'Scheduled',
      accessor: (a) => {
        if (!a.starts_at && !a.expires_at) return <span className="text-muted-foreground">-</span>
        return (
          <div className="text-xs">
            {a.starts_at && <div>Start: {formatDateTime(a.starts_at)}</div>}
            {a.expires_at && <div>End: {formatDateTime(a.expires_at)}</div>}
          </div>
        )
      },
    },
    {
      key: 'creator',
      header: 'Created By',
      accessor: (a) => a.creator ? (
        <span className="text-sm">{a.creator.username}</span>
      ) : (
        <span className="text-muted-foreground text-sm">Unknown</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      accessor: (a) => <span className="text-sm">{formatDateTime(a.created_at)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading">Announcements</h2>
          <p className="text-muted-foreground">Manage game announcements</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementForm
              onSuccess={() => {
                setCreateDialogOpen(false)
                toast.success('Announcement created successfully')
              }}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <DataTable
        data={data?.announcements || []}
        columns={columns}
        loading={isLoading}
        onPageChange={setPage}
        emptyMessage="No announcements found"
        rowActions={(announcement) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(announcement)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(announcement.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <AnnouncementForm
              announcement={selectedAnnouncement}
              onSuccess={() => {
                setEditDialogOpen(false)
                setSelectedAnnouncement(null)
                toast.success('Announcement updated successfully')
              }}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedAnnouncement(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

