import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGetUserQuery, useGetUserActivityQuery, useResetUserPasswordMutation, useAssignRoleToUserMutation, useRemoveRoleFromUserMutation, useListRolesQuery } from '@/api/endpoints/adminApi'
import { AdminUser, UserActivityLog } from '@/types/api.types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/formatters'
import { DataTable, Column } from './DataTable'
import { Shield, Key, X, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface UserDetailProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetail({ user, open, onOpenChange }: UserDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activityPage, setActivityPage] = useState(1)

  const { data: userData, refetch } = useGetUserQuery(user.id, { skip: !open })
  const { data: activityData } = useGetUserActivityQuery(
    { id: user.id, page: activityPage, per_page: 25 },
    { skip: !open || activeTab !== 'activity' }
  )
  const { data: rolesData } = useListRolesQuery(undefined, { skip: !open })

  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation()
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleToUserMutation()
  const [removeRole, { isLoading: isRemoving }] = useRemoveRoleFromUserMutation()

  const passwordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const fullUser = userData?.user || user

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({
        id: fullUser.id,
        data,
      }).unwrap()
      toast.success('Password reset successfully')
      passwordForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reset password')
    }
  }

  const handleAssignRole = async (roleId: number) => {
    try {
      await assignRole({
        id: fullUser.id,
        data: { role_id: roleId },
      }).unwrap()
      toast.success('Role assigned successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign role')
    }
  }

  const handleRemoveRole = async (roleId: number) => {
    try {
      await removeRole({
        userId: fullUser.id,
        roleId,
      }).unwrap()
      toast.success('Role removed successfully')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove role')
    }
  }

  const availableRoles = rolesData?.roles.filter(
    (role) => !fullUser.roles.some((userRole) => userRole.id === role.id)
  ) || []

  const activityColumns: Column<UserActivityLog>[] = [
    {
      key: 'action',
      header: 'Action',
      accessor: (log) => <span className="font-medium">{log.action}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (log) => <span className="text-sm">{log.description}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      accessor: (log) => <span className="text-sm">{formatDate(log.created_at)}</span>,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details: {fullUser.username}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <div className="font-mono">{fullUser.id}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <div>{fullUser.email}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <div>{formatDate(fullUser.created_at)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Login</Label>
                <div>{fullUser.last_login ? formatDate(fullUser.last_login) : 'Never'}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div>
                  {fullUser.suspended_at ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
              </div>
              {fullUser.suspended_at && fullUser.suspended_reason && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Suspension Reason</Label>
                  <div>{fullUser.suspended_reason}</div>
                </div>
              )}
              {fullUser.empire && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Empire</Label>
                  <div>{fullUser.empire.name} (ID: {fullUser.empire.id})</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Current Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {fullUser.roles.length === 0 ? (
                    <span className="text-muted-foreground">No roles assigned</span>
                  ) : (
                    fullUser.roles.map((role) => (
                      <Badge key={role.id} variant={role.slug === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-2">
                        {role.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4 h-4"
                          onClick={() => handleRemoveRole(role.id)}
                          disabled={isRemoving}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {availableRoles.length > 0 && (
                <div>
                  <Label className="mb-2 block">Assign Role</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => handleAssignRole(Number(value))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a role to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...passwordForm.register('new_password')}
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <DataTable
              data={activityData?.data || []}
              columns={activityColumns}
              loading={!activityData}
              meta={activityData?.meta}
              onPageChange={setActivityPage}
              emptyMessage="No activity logs found"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

