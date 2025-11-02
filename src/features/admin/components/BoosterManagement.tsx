import { useState, useMemo } from 'react'
import { useListUsersQuery } from '@/api/endpoints/adminApi'
import { useGetUserBoostersQuery, useDeleteBoosterMutation } from '@/api/endpoints/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Search, Clock, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { AdminBooster } from '@/types/api.types'
import { toast } from 'sonner'

export function BoosterManagement() {
  const [search, setSearch] = useState('')
  const [boosterTypeFilter, setBoosterTypeFilter] = useState<string>('all')
  const [expirationFilter, setExpirationFilter] = useState<string>('all')

  const [usersPage, setUsersPage] = useState(1)

  const { data: usersData, isLoading: usersLoading } = useListUsersQuery({
    page: usersPage,
    per_page: 100, // API limit is 100
    search: search || undefined,
  })

  const [deleteBooster, { isLoading: isDeleting }] = useDeleteBoosterMutation()

  // Fetch boosters for users who have empires
  const usersWithEmpires = usersData?.data.filter((u) => u.empire !== null) ?? []
  
  // Calculate statistics
  const allBoosters = useMemo(() => {
    // This would ideally come from a single API call, but for now we aggregate
    // In a real implementation, you'd have an endpoint like GET /admin/boosters
    return [] as AdminBooster[]
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()
    return {
      total: allBoosters.length,
      expiringSoon: allBoosters.filter((b) => {
        const expires = new Date(b.expires_at).getTime()
        return expires > now && expires < now + 24 * 60 * 60 * 1000 // Next 24 hours
      }).length,
      byType: {
        production: allBoosters.filter((b) => b.type === 'production').length,
        construction: allBoosters.filter((b) => b.type === 'construction').length,
        signal: allBoosters.filter((b) => b.type === 'signal').length,
      },
    }
  }, [allBoosters])

  const filteredBoosters = useMemo(() => {
    return allBoosters.filter((booster) => {
      if (boosterTypeFilter !== 'all' && booster.type !== boosterTypeFilter) return false
      
      if (expirationFilter === 'expiring-soon') {
        const expires = new Date(booster.expires_at).getTime()
        const now = Date.now()
        return expires > now && expires < now + 24 * 60 * 60 * 1000
      }
      if (expirationFilter === 'expired') {
        return new Date(booster.expires_at).getTime() < Date.now()
      }
      if (expirationFilter === 'active') {
        return new Date(booster.expires_at).getTime() > Date.now()
      }
      
      return true
    })
  }, [allBoosters, boosterTypeFilter, expirationFilter])

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
      // Refetch would happen automatically via RTK Query cache invalidation
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel booster')
    }
  }

  const formatTimeRemaining = (booster: AdminBooster): string => {
    const timeRemaining = booster.time_remaining ?? 0
    if (timeRemaining <= 0) return 'Expired'
    const hours = Math.floor(timeRemaining / 3600)
    const minutes = Math.floor((timeRemaining % 3600) / 60)
    const secs = timeRemaining % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="glow-cyan">Total Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">Active boosters</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-yellow-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>Expiring Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{stats.expiringSoon}</p>
            <p className="text-xs text-muted-foreground mt-1">Next 24 hours</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Production</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-400">{stats.byType.production}</p>
            <p className="text-xs text-muted-foreground mt-1">Production boosters</p>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>Construction</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{stats.byType.construction}</p>
            <p className="text-xs text-muted-foreground mt-1">Construction boosters</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="panel-glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Empire</Label>
              <Input
                id="search"
                placeholder="Search by empire name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boosterType">Booster Type</Label>
              <Select value={boosterTypeFilter} onValueChange={setBoosterTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="signal">Signal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration Status</Label>
              <Select value={expirationFilter} onValueChange={setExpirationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boosters List */}
      <div className="space-y-4">
        {filteredBoosters.length > 0 ? (
          filteredBoosters.map((booster) => {
            const timeRemaining = booster.time_remaining ?? 0
            const isExpiringSoon = timeRemaining > 0 && timeRemaining < 3600
            const isExpired = timeRemaining <= 0

            return (
              <Card
                key={booster.id}
                className={`panel-glass border-border/50 ${
                  isExpiringSoon ? 'border-yellow-400/50' : ''
                } ${isExpired ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      {booster.type.charAt(0).toUpperCase() + booster.type.slice(1)} Booster
                      <Badge
                        variant="outline"
                        className={
                          isExpired
                            ? 'border-red-400/50 text-red-400'
                            : isExpiringSoon
                            ? 'border-yellow-400/50 text-yellow-400'
                            : 'border-green-400/50 text-green-400'
                        }
                      >
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBooster(booster.id)}
                      disabled={isDeleting || isExpired}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Multiplier</Label>
                      <div className="text-xl font-bold text-cyan-400">{booster.multiplier}x</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Time Remaining</Label>
                      <div
                        className={`text-xl font-bold ${
                          isExpiringSoon ? 'text-yellow-400' : 'text-foreground'
                        }`}
                      >
                        {formatTimeRemaining(booster)}
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
                      <div className="col-span-2 md:col-span-4">
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
          })
        ) : (
          <Card className="panel-glass border-border/50">
            <CardContent className="pt-6 text-center">
              <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No boosters found matching your filters</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Note: To view all boosters, you may need to implement a dedicated API endpoint
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

