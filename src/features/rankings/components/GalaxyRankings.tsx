import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/formatters'
import { 
  MapPin, 
  Medal, 
  Award,
  Users,
  Star,
  Activity,
  TrendingUp
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Galaxy {
  id: number
  name: string
  quadrant: number
  sector: number
  galaxy: number
  total_empires: number
  total_planets: number
  total_activity: number
  created_at: string
}

interface GalaxyRankingsProps {
  galaxies: Galaxy[]
  isLoading: boolean
  searchTerm: string
  sortBy: 'score' | 'planets' | 'fleets'
}

export function GalaxyRankings({ 
  galaxies, 
  isLoading, 
  searchTerm, 
  sortBy 
}: GalaxyRankingsProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <MapPin className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 2:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 3:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  const filteredAndSortedGalaxies = galaxies
    .filter(galaxy =>
      (galaxy.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${galaxy.quadrant}:${galaxy.sector}:${galaxy.galaxy}`.includes(searchTerm)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.total_empires - a.total_empires
        case 'planets':
          return b.total_planets - a.total_planets
        case 'fleets':
          return b.total_activity - a.total_activity
        default:
          return b.total_empires - a.total_empires
      }
    })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <Card key={i} className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredAndSortedGalaxies.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Galaxies Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No galaxies match your search criteria. Try adjusting your search terms.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedGalaxies.map((galaxy, index) => (
        <Card
          key={galaxy.id}
          className={`panel-glass transition-all hover:border-primary/50 ${
            index < 3 ? 'border-primary/20' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/20">
                  {getRankIcon(index + 1)}
                </div>
                
                {/* Galaxy Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{galaxy.name || 'Unknown Galaxy'}</h3>
                    <Badge variant="outline" className="text-xs font-mono">
                      {galaxy.quadrant}:{galaxy.sector}:{galaxy.galaxy}
                    </Badge>
                    {index < 3 && (
                      <Badge 
                        variant="outline" 
                        className={getRankColor(index + 1)}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Galaxy ID: {galaxy.id}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {galaxy.total_empires}
                  </div>
                  <div className="text-xs text-muted-foreground">Empires</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {galaxy.total_planets}
                  </div>
                  <div className="text-xs text-muted-foreground">Planets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {galaxy.total_activity}
                  </div>
                  <div className="text-xs text-muted-foreground">Activity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {galaxy.total_planets > 0 ? Math.round(galaxy.total_planets / galaxy.total_empires) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Planets</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Created {new Date(galaxy.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Rank #{index + 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Density: {galaxy.total_empires > 0 ? Math.round(galaxy.total_planets / galaxy.total_empires) : 0} planets/empire</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
