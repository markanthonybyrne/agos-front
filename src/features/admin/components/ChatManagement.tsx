import { useState } from 'react'
import {
  useListChatMessagesQuery,
  useDeleteChatMessageMutation,
  useBanUserFromChatMutation,
  useMuteUserFromChatMutation,
  useUnbanUserFromChatMutation,
  useUnmuteUserFromChatMutation,
} from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { AdminChatMessage } from '@/types/api.types'
import { Trash2, Ban, VolumeX, Shield, ShieldOff } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function ChatManagement() {
  const [page, setPage] = useState(1)
  const [channelSlug, setChannelSlug] = useState<string | undefined>(undefined)
  const [empireId, setEmpireId] = useState<number | undefined>(undefined)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [muteDialogOpen, setMuteDialogOpen] = useState(false)
  const [selectedEmpireId, setSelectedEmpireId] = useState<number | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined)

  const { data, isLoading } = useListChatMessagesQuery({
    page,
    per_page: 25,
    channel_slug: channelSlug,
    empire_id: empireId,
  })

  const [deleteMessage] = useDeleteChatMessageMutation()
  const [banUser] = useBanUserFromChatMutation()
  const [muteUser] = useMuteUserFromChatMutation()
  const [unbanUser] = useUnbanUserFromChatMutation()
  const [unmuteUser] = useUnmuteUserFromChatMutation()

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this chat message?')) return
    try {
      await deleteMessage(id).unwrap()
      toast.success('Message deleted')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete message')
    }
  }

  const handleBan = async () => {
    if (!selectedEmpireId) return
    try {
      await banUser({
        empire_id: selectedEmpireId,
        reason: banReason || undefined,
        duration_hours: banDuration,
      }).unwrap()
      toast.success('User banned from chat')
      setBanDialogOpen(false)
      setSelectedEmpireId(null)
      setBanReason('')
      setBanDuration(undefined)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to ban user')
    }
  }

  const handleMute = async () => {
    if (!selectedEmpireId) return
    try {
      await muteUser({
        empire_id: selectedEmpireId,
        duration_hours: banDuration,
      }).unwrap()
      toast.success('User muted in chat')
      setMuteDialogOpen(false)
      setSelectedEmpireId(null)
      setBanDuration(undefined)
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to mute user')
    }
  }

  const handleUnban = async (empireId: number) => {
    if (!window.confirm('Unban this user from chat?')) return
    try {
      await unbanUser(empireId).unwrap()
      toast.success('User unbanned from chat')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to unban user')
    }
  }

  const handleUnmute = async (empireId: number) => {
    if (!window.confirm('Unmute this user in chat?')) return
    try {
      await unmuteUser(empireId).unwrap()
      toast.success('User unmuted in chat')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to unmute user')
    }
  }

  // Extract unique channels from messages
  const channels = Array.from(
    new Set((data?.data || []).map((m) => m.channel_slug))
  ).sort()

  const columns: Column<AdminChatMessage>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (m) => <span className="font-mono text-xs">{m.id}</span>,
    },
    {
      key: 'channel',
      header: 'Channel',
      accessor: (m) => (
        <Badge variant="outline" className="text-xs">
          {m.channel_slug}
        </Badge>
      ),
    },
    {
      key: 'sender',
      header: 'Sender',
      accessor: (m) => (
        <div>
          <div className="font-medium">{m.sender_empire.name}</div>
          <div className="text-xs text-muted-foreground">ID: {m.sender_empire.id}</div>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      accessor: (m) => (
        <div className="max-w-md">
          <div className="text-sm line-clamp-2">{m.message}</div>
          {m.mentions.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Mentions: {m.mentions.join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (m) => (
        <div className="flex gap-1 flex-wrap">
          {m.is_edited && <Badge variant="secondary" className="text-xs">Edited</Badge>}
          {m.is_moderated && <Badge variant="destructive" className="text-xs">Moderated</Badge>}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (m) => (
        <div className="text-xs">
          <div>{formatDateTime(m.created_at)}</div>
          {m.edited_at && (
            <div className="text-muted-foreground">Edited: {formatDateTime(m.edited_at)}</div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading">Chat Moderation</h2>
        <p className="text-muted-foreground">Moderate global chat messages and users</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={channelSlug || 'all'} onValueChange={(v) => setChannelSlug(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Filter by Empire ID"
          value={empireId || ''}
          onChange={(e) => setEmpireId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-48"
        />

        {/* User Moderation Actions */}
        <div className="flex gap-2 ml-auto">
          <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setBanDialogOpen(true)}>
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban User from Chat</DialogTitle>
                <DialogDescription>
                  Ban a user from all chat channels. Enter the Empire ID.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="empire-id">Empire ID</Label>
                  <Input
                    id="empire-id"
                    type="number"
                    value={selectedEmpireId || ''}
                    onChange={(e) => setSelectedEmpireId(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Enter Empire ID"
                  />
                </div>
                <div>
                  <Label htmlFor="ban-reason">Reason (optional)</Label>
                  <Input
                    id="ban-reason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Reason for ban"
                  />
                </div>
                <div>
                  <Label htmlFor="ban-duration">Duration (hours, optional)</Label>
                  <Input
                    id="ban-duration"
                    type="number"
                    value={banDuration || ''}
                    onChange={(e) => setBanDuration(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Leave empty for permanent"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBan} disabled={!selectedEmpireId}>
                  Ban User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setMuteDialogOpen(true)}>
                <VolumeX className="w-4 h-4 mr-2" />
                Mute User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mute User in Chat</DialogTitle>
                <DialogDescription>
                  Mute a user in all chat channels. Enter the Empire ID.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mute-empire-id">Empire ID</Label>
                  <Input
                    id="mute-empire-id"
                    type="number"
                    value={selectedEmpireId || ''}
                    onChange={(e) => setSelectedEmpireId(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Enter Empire ID"
                  />
                </div>
                <div>
                  <Label htmlFor="mute-duration">Duration (hours, optional)</Label>
                  <Input
                    id="mute-duration"
                    type="number"
                    value={banDuration || ''}
                    onChange={(e) => setBanDuration(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Leave empty for permanent"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMuteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMute} disabled={!selectedEmpireId}>
                  Mute User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyMessage="No chat messages found"
        rowActions={(message) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEmpireId(message.sender_empire.id)
                handleUnban(message.sender_empire.id).catch(() => {})
              }}
              title="Unban user"
            >
              <ShieldOff className="w-4 h-4 text-green-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedEmpireId(message.sender_empire.id)
                handleUnmute(message.sender_empire.id).catch(() => {})
              }}
              title="Unmute user"
            >
              <Shield className="w-4 h-4 text-blue-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(message.id)}
              title="Delete message"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      />
    </div>
  )
}

