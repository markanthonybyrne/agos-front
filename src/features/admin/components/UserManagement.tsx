import { useState } from 'react'
import { useListUsersQuery, useDeleteUserMutation, useUpdateUserMutation } from '@/api/endpoints/adminApi'
import { DataTable, Column } from './DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { AdminUser } from '@/types/api.types'
import { Pencil, Trash2, Shield, Eye } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { UserDetail } from './UserDetail'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  suspended: z.boolean().optional(),
  suspended_reason: z.string().optional(),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

export function UserManagement() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [suspendedFilter, setSuspendedFilter] = useState<boolean | undefined>(undefined)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const { data, isLoading } = useListUsersQuery({
    page,
    per_page: 25,
    search: search || undefined,
    suspended: suspendedFilter,
  })

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      suspended: false,
    },
  })

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user)
    form.reset({
      email: user.email,
      username: user.username,
      suspended: !!user.suspended_at,
      suspended_reason: user.suspended_reason || '',
    })
    setEditDialogOpen(true)
  }

  const handleView = (user: AdminUser) => {
    setSelectedUser(user)
    setDetailDialogOpen(true)
  }

  const handleUpdate = async (data: UpdateUserFormData) => {
    if (!selectedUser) return

    try {
      await updateUser({
        id: selectedUser.id,
        data: {
          ...data,
          suspended_reason: data.suspended ? data.suspended_reason : undefined,
        },
      }).unwrap()
      toast.success('User updated successfully')
      setEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update user')
    }
  }

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await deleteUser(userId).unwrap()
      toast.success('User deleted successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete user')
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (user) => <span className="font-mono">{user.id}</span>,
    },
    {
      key: 'username',
      header: 'Username',
      accessor: (user) => (
        <div>
          <div className="font-medium">{user.username}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'empire',
      header: 'Empire',
      accessor: (user) => user.empire ? (
        <span className="text-sm">{user.empire.name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">No empire</span>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      accessor: (user) => (
        <div className="flex gap-1 flex-wrap">
          {user.roles.map((role) => (
            <Badge key={role.id} variant={role.slug === 'admin' ? 'default' : 'secondary'}>
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => user.suspended_at ? (
        <Badge variant="destructive">Suspended</Badge>
      ) : (
        <Badge variant="default">Active</Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      accessor: (user) => user.last_login ? (
        <span className="text-sm">{formatDate(user.last_login)}</span>
      ) : (
        <span className="text-muted-foreground text-sm">Never</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="max-w-md"
          />
        </div>
        <Select
          value={suspendedFilter === undefined ? 'all' : suspendedFilter ? 'suspended' : 'active'}
          onValueChange={(value) => {
            setSuspendedFilter(value === 'all' ? undefined : value === 'suspended')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="suspended">Suspended Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        onSearch={setSearch}
        searchPlaceholder="Search users..."
        emptyMessage="No users found"
        rowActions={(user) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(user)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user.id)}
              disabled={isDeleting}
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
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register('username')}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="suspended"
                  {...form.register('suspended')}
                  className="w-4 h-4"
                />
                <Label htmlFor="suspended">Suspend User</Label>
              </div>
            </div>

            {form.watch('suspended') && (
              <div className="space-y-2">
                <Label htmlFor="suspended_reason">Suspension Reason</Label>
                <Textarea
                  id="suspended_reason"
                  placeholder="Enter reason for suspension..."
                  {...form.register('suspended_reason')}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedUser(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedUser && (
        <UserDetail
          user={selectedUser}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      )}
    </div>
  )
}
