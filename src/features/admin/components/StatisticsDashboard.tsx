import { useGetStatisticsQuery } from '@/api/endpoints/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Shield, Building2, Rocket, Users as AllianceIcon, Mail, Clock, Coins, Sword } from 'lucide-react'
import { formatNumber } from '@/lib/formatters'

export function StatisticsDashboard() {
  const { data: stats, isLoading, error } = useGetStatisticsQuery()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="panel-glass border-destructive/20">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: 'Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active, ${stats.users.suspended} suspended`,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Empires',
      value: stats.empires.total,
      subtitle: `${stats.empires.active} active`,
      icon: Shield,
      color: 'text-purple-400',
    },
    {
      title: 'Planets',
      value: stats.planets.total,
      subtitle: `${stats.planets.colonized} colonized, ${stats.planets.unsettled} unsettled`,
      icon: Building2,
      color: 'text-green-400',
    },
    {
      title: 'Fleets',
      value: stats.fleets.total,
      subtitle: `${stats.fleets.in_transit} in transit`,
      icon: Rocket,
      color: 'text-orange-400',
    },
    {
      title: 'Alliances',
      value: stats.alliances.total,
      subtitle: `Avg ${stats.alliances.average_members.toFixed(1)} members`,
      icon: AllianceIcon,
      color: 'text-cyan-400',
    },
    {
      title: 'Resources',
      value: formatNumber(stats.resources.total_tellerium + stats.resources.total_krypton),
      subtitle: `T: ${formatNumber(stats.resources.total_tellerium)} K: ${formatNumber(stats.resources.total_krypton)}`,
      icon: Coins,
      color: 'text-yellow-400',
    },
    {
      title: 'Mines & Probes',
      value: formatNumber(stats.resources.total_mines + stats.resources.total_probes),
      subtitle: `${formatNumber(stats.resources.total_mines)} mines, ${formatNumber(stats.resources.total_probes)} probes`,
      icon: Building2,
      color: 'text-emerald-400',
    },
    {
      title: 'Current Tick',
      value: stats.tick.current,
      subtitle: `Next: ${new Date(stats.tick.next_eta).toLocaleString()}`,
      icon: Clock,
      color: 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.title} 
              className="panel-glass border-border/50 hover:border-cyan-400/30 transition-all group"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <span className="glow-cyan">{stat.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

