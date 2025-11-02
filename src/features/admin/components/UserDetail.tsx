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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  useGetUserQuery, 
  useGetUserActivityQuery, 
  useResetUserPasswordMutation, 
  useAssignRoleToUserMutation, 
  useRemoveRoleFromUserMutation, 
  useListRolesQuery,
  useGrantQuantumCreditsMutation,
  useAdjustQuantumCreditsMutation,
  useGetQuantumCreditsTransactionsQuery,
  useGetUserBoostersQuery,
  useDeleteBoosterMutation,
} from '@/api/endpoints/adminApi'
import { AdminUser, UserActivityLog, QuantumCreditsTransaction, AdminBooster } from '@/types/api.types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/formatters'
import { DataTable, Column } from './DataTable'
import { Shield, Key, X, Plus, Gift, Zap, Calendar, Flame, Coins } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

const grantQuantumCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  metadata: z.record(z.any()).optional(),
})

const adjustQuantumCreditsSchema = z.object({
  amount: z.number().int().refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
type GrantQuantumCreditsFormData = z.infer<typeof grantQuantumCreditsSchema>
type AdjustQuantumCreditsFormData = z.infer<typeof adjustQuantumCreditsSchema>

interface UserDetailProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetail({ user, open, onOpenChange }: UserDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activityPage, setActivityPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all')

  const { data: userData, refetch } = useGetUserQuery(user.id, { skip: !open })
  const { data: activityData } = useGetUserActivityQuery(
    { id: user.id, page: activityPage, per_page: 25 },
    { skip: !open || activeTab !== 'activity' }
  )
  const { data: rolesData } = useListRolesQuery(undefined, { skip: !open })
  const { data: transactionsData, refetch: refetchTransactions } = useGetQuantumCreditsTransactionsQuery(
    { 
      id: user.id, 
      page: transactionsPage, 
      per_page: 25,
      type: transactionTypeFilter !== 'all' ? transactionTypeFilter : undefined
    },
    { skip: !open || activeTab !== 'quantum-credits' }
  )
  const { data: boostersData, refetch: refetchBoosters } = useGetUserBoostersQuery(
    user.id,
    { skip: !open || activeTab !== 'boosters' }
  )

  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation()
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleToUserMutation()
  const [removeRole, { isLoading: isRemoving }] = useRemoveRoleFromUserMutation()
  const [grantQuantumCredits, { isLoading: isGranting }] = useGrantQuantumCreditsMutation()
  const [adjustQuantumCredits, { isLoading: isAdjusting }] = useAdjustQuantumCreditsMutation()
  const [deleteBooster, { isLoading: isDeletingBooster }] = useDeleteBoosterMutation()

  const passwordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const grantForm = useForm<GrantQuantumCreditsFormData>({
    resolver: zodResolver(grantQuantumCreditsSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  })

  const adjustForm = useForm<AdjustQuantumCreditsFormData>({
    resolver: zodResolver(adjustQuantumCreditsSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
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

  const handleGrantQuantumCredits = async (data: GrantQuantumCreditsFormData) => {
    try {
      const result = await grantQuantumCredits({
        id: fullUser.id,
        data,
      }).unwrap()
      toast.success(`Granted ${data.amount} QC. New balance: ${result.new_balance}`)
      grantForm.reset()
      refetch()
      refetchTransactions()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to grant quantum credits')
    }
  }

  const handleAdjustQuantumCredits = async (data: AdjustQuantumCreditsFormData) => {
    try {
      const result = await adjustQuantumCredits({
        id: fullUser.id,
        data,
      }).unwrap()
      const action = data.amount > 0 ? 'Added' : 'Deducted'
      toast.success(`${action} ${Math.abs(data.amount)} QC. New balance: ${result.new_balance}`)
      adjustForm.reset()
      refetch()
      refetchTransactions()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to adjust quantum credits')
    }
  }

  const handleDeleteBooster = async (boosterId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booster? This action cannot be undone.')) {
      return
    }

    try {
      await deleteBooster({
        id: boosterId,
        data: { reason: 'Cancelled by admin' },
      }).unwrap()
      toast.success('Booster cancelled successfully')
      refetchBoosters()
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel booster')
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

  const transactionColumns: Column<QuantumCreditsTransaction>[] = [
    {
      key: 'type',
      header: 'Type',
      accessor: (tx) => {
        const typeColors: Record<string, string> = {
          earned: 'text-green-400',
          purchased: 'text-blue-400',
          spent: 'text-red-400',
          granted: 'text-purple-400',
          adjusted: 'text-yellow-400',
        }
        return (
          <Badge variant="outline" className={typeColors[tx.type] || ''}>
            {tx.type}
          </Badge>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (tx) => (
        <span className={`font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {tx.amount > 0 ? '+' : ''}{tx.amount}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (tx) => <span className="text-sm">{tx.reason}</span>,
    },
    {
      key: 'created_at',
      header: 'Date',
      accessor: (tx) => <span className="text-sm">{formatDate(tx.created_at)}</span>,
    },
  ]

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details: {fullUser.username}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="quantum-credits">
              <Gift className="w-4 h-4 mr-1" />
              Quantum Credits
            </TabsTrigger>
            <TabsTrigger value="boosters">
              <Zap className="w-4 h-4 mr-1" />
              Boosters
            </TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-4">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="font-mono text-foreground">{fullUser.id}</div>
                </CardContent>
              </Card>
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-4">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="text-foreground">{fullUser.email}</div>
                </CardContent>
              </Card>
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-4">
                  <Label className="text-muted-foreground">Created At</Label>
                  <div className="text-foreground">{formatDate(fullUser.created_at)}</div>
                </CardContent>
              </Card>
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-4">
                  <Label className="text-muted-foreground">Last Login</Label>
                  <div className="text-foreground">{fullUser.last_login ? formatDate(fullUser.last_login) : 'Never'}</div>
                </CardContent>
              </Card>
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-4">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    {fullUser.suspended_at ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-400/50">Active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              {fullUser.quantum_credits !== undefined && (
                <Card className="panel-glass border-cyan-400/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-cyan-400" />
                      <Label className="text-muted-foreground">Quantum Credits</Label>
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">{fullUser.quantum_credits}</div>
                    {fullUser.quantum_credits_purchased_total !== undefined && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Purchased: {fullUser.quantum_credits_purchased_total}
                      </div>
                    )}
                    {fullUser.daily_login_streak !== undefined && fullUser.daily_login_streak > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {fullUser.daily_login_streak} day streak
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {fullUser.suspended_at && fullUser.suspended_reason && (
                <Card className="panel-glass border-red-400/30 col-span-2">
                  <CardContent className="pt-4">
                    <Label className="text-muted-foreground">Suspension Reason</Label>
                    <div className="text-foreground">{fullUser.suspended_reason}</div>
                  </CardContent>
                </Card>
              )}
              {fullUser.empire && (
                <Card className="panel-glass border-purple-400/30 col-span-2">
                  <CardContent className="pt-4">
                    <Label className="text-muted-foreground">Empire</Label>
                    <div className="text-foreground">{fullUser.empire.name} (ID: {fullUser.empire.id})</div>
                  </CardContent>
                </Card>
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

          <TabsContent value="quantum-credits" className="space-y-4 mt-4">
            {/* Current Balance Display */}
            <Card className="panel-glass border-cyan-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src={getQuantumCreditsImage()} alt="QC" className="w-6 h-6" />
                  <span className="glow-cyan">Quantum Credits Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold text-cyan-400">
                      {transactionsData?.current_balance ?? fullUser.quantum_credits ?? 0}
                    </p>
                  </div>
                  {fullUser.quantum_credits_purchased_total !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Total Purchased</p>
                      <p className="text-xl font-semibold text-foreground">
                        {fullUser.quantum_credits_purchased_total}
                      </p>
                    </div>
                  )}
                  {fullUser.daily_login_streak !== undefined && fullUser.daily_login_streak > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Streak</p>
                      <p className="text-xl font-semibold text-orange-400 flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        {fullUser.daily_login_streak}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grant Form */}
            <Card className="panel-glass border-purple-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  Grant Quantum Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={grantForm.handleSubmit(handleGrantQuantumCredits)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grant_amount">Amount</Label>
                      <Input
                        id="grant_amount"
                        type="number"
                        min="1"
                        {...grantForm.register('amount', { valueAsNumber: true })}
                      />
                      {grantForm.formState.errors.amount && (
                        <p className="text-sm text-destructive">
                          {grantForm.formState.errors.amount.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grant_reason">Reason *</Label>
                      <Input
                        id="grant_reason"
                        {...grantForm.register('reason')}
                        placeholder="e.g., Compensation for bug"
                      />
                      {grantForm.formState.errors.reason && (
                        <p className="text-sm text-destructive">
                          {grantForm.formState.errors.reason.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button type="submit" disabled={isGranting} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-400/30">
                    {isGranting ? 'Granting...' : 'Grant Credits'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Adjust Form */}
            <Card className="panel-glass border-yellow-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-yellow-400" />
                  Adjust Quantum Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={adjustForm.handleSubmit(handleAdjustQuantumCredits)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjust_amount">Amount (positive to add, negative to subtract)</Label>
                      <Input
                        id="adjust_amount"
                        type="number"
                        {...adjustForm.register('amount', { valueAsNumber: true })}
                        placeholder="e.g., 100 or -50"
                      />
                      {adjustForm.formState.errors.amount && (
                        <p className="text-sm text-destructive">
                          {adjustForm.formState.errors.amount.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adjust_reason">Reason (optional)</Label>
                      <Input
                        id="adjust_reason"
                        {...adjustForm.register('reason')}
                        placeholder="e.g., Adjustment for balance correction"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isAdjusting} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-400/30">
                    {isAdjusting ? 'Adjusting...' : 'Adjust Credits'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="panel-glass border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem>
                      <SelectItem value="purchased">Purchased</SelectItem>
                      <SelectItem value="spent">Spent</SelectItem>
                      <SelectItem value="granted">Granted</SelectItem>
                      <SelectItem value="adjusted">Adjusted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={transactionsData?.data || []}
                  columns={transactionColumns}
                  loading={!transactionsData}
                  meta={transactionsData?.meta}
                  onPageChange={setTransactionsPage}
                  emptyMessage="No transactions found"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boosters" className="space-y-4 mt-4">
            {boostersData?.boosters && boostersData.boosters.length > 0 ? (
              <div className="space-y-4">
                {boostersData.boosters.map((booster: AdminBooster) => {
                  const timeRemaining = booster.time_remaining ?? 0
                  const expiresAt = new Date(booster.expires_at)
                  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 3600 // Less than 1 hour
                  
                  return (
                    <Card 
                      key={booster.id} 
                      className={`panel-glass border-border/50 ${
                        isExpiringSoon ? 'border-yellow-400/50' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-400" />
                            {booster.type.charAt(0).toUpperCase() + booster.type.slice(1)} Booster
                          </CardTitle>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBooster(booster.id)}
                            disabled={isDeletingBooster}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Multiplier</Label>
                            <div className="text-xl font-bold text-cyan-400">{booster.multiplier}x</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Time Remaining</Label>
                            <div className={`text-xl font-bold ${isExpiringSoon ? 'text-yellow-400' : 'text-foreground'}`}>
                              {formatTimeRemaining(timeRemaining)}
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Started</Label>
                            <div className="text-sm text-foreground">{formatDate(booster.started_at)}</div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Expires</Label>
                            <div className="text-sm text-foreground">{formatDate(booster.expires_at)}</div>
                          </div>
                          {booster.empire && (
                            <div className="col-span-2">
                              <Label className="text-muted-foreground">Empire</Label>
                              <div className="text-foreground">
                                {booster.empire.name} (ID: {booster.empire.id})
                                {booster.empire.user && ` - User: ${booster.empire.user.username}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="panel-glass border-border/50">
                <CardContent className="pt-6 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active boosters</p>
                </CardContent>
              </Card>
            )}
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

