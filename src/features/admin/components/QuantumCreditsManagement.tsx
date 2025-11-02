import { useState } from 'react'
import { useListUsersQuery } from '@/api/endpoints/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column } from './DataTable'
import { Gift, Coins, Search, TrendingUp, Users } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { AdminUser } from '@/types/api.types'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'
import { useNavigate } from 'react-router-dom'

export function QuantumCreditsManagement() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [minBalance, setMinBalance] = useState<string>('')

  const { data, isLoading } = useListUsersQuery({
    page,
    per_page: 25,
    search: search || undefined,
  })

  // Calculate statistics from filtered data
  const stats = data?.data.reduce(
    (acc, user) => {
      const qc = user.quantum_credits ?? 0
      return {
        total: acc.total + qc,
        purchased: acc.purchased + (user.quantum_credits_purchased_total ?? 0),
        count: acc.count + (qc > 0 ? 1 : 0),
      }
    },
    { total: 0, purchased: 0, count: 0 }
  ) ?? { total: 0, purchased: 0, count: 0 }

  const averageBalance = data?.data.length ? stats.total / data.data.length : 0

  // Filter by minimum balance
  const filteredUsers = data?.data.filter((user) => {
    if (!minBalance) return true
    const min = parseInt(minBalance, 10)
    if (isNaN(min)) return true
    return (user.quantum_credits ?? 0) >= min
  }) ?? []

  const columns: Column<AdminUser>[] = [
    {
      key: 'username',
      header: 'User',
      accessor: (user) => (
        <div>
          <div className="font-medium">{user.username}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'quantum_credits',
      header: 'Balance',
      accessor: (user) => {
        const balance = user.quantum_credits ?? 0
        return (
          <div className="flex items-center gap-2">
            <img src={getQuantumCreditsImage()} alt="QC" className="w-4 h-4" />
            <span className={`font-mono font-bold ${balance > 0 ? 'text-cyan-400' : 'text-muted-foreground'}`}>
              {balance}
            </span>
          </div>
        )
      },
    },
    {
      key: 'quantum_credits_purchased_total',
      header: 'Purchased',
      accessor: (user) => {
        const purchased = user.quantum_credits_purchased_total ?? 0
        return (
          <span className="text-sm text-muted-foreground">{purchased}</span>
        )
      },
    },
    {
      key: 'daily_login_streak',
      header: 'Streak',
      accessor: (user) => {
        const streak = user.daily_login_streak ?? 0
        return streak > 0 ? (
          <Badge variant="outline" className="text-orange-400 border-orange-400/50">
            {streak} days
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/admin/users`, { state: { openUserDetail: user.id } })}
        >
          <Gift className="w-4 h-4 mr-1" />
          Manage
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-cyan-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span className="glow-cyan">Total QC</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cyan-400">{stats.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all users</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Total Purchased</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{stats.purchased.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime purchases</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Users with QC</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-400">{stats.count}</p>
            <p className="text-xs text-muted-foreground mt-1">Active holders</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Avg Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{averageBalance.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Per user average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="panel-glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minBalance">Minimum Balance</Label>
              <Input
                id="minBalance"
                type="number"
                placeholder="Filter by minimum QC balance..."
                value={minBalance}
                onChange={(e) => {
                  setMinBalance(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="panel-glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredUsers}
            columns={columns}
            loading={isLoading}
            meta={data?.meta}
            onPageChange={setPage}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  )
}

