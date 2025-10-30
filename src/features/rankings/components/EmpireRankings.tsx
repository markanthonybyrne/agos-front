import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/formatters'
import { 
  Crown, 
  Medal, 
  Award,
  MapPin,
  Users,
  Ship,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Empire, Alliance } from '@/types/api.types'

interface EmpireRankingsProps {
  empires: Empire[]
  alliances?: Alliance[]
  isLoading: boolean
  searchTerm: string
  sortBy: 'score' | 'planets' | 'fleets'
}

export function EmpireRankings({ 
  empires, 
  alliances = [],
  isLoading, 
  searchTerm, 
  sortBy 
}: EmpireRankingsProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
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

  const getEmpireAlliance = (empire: Empire) => {
    if (!empire.alliance_id || !alliances.length) return null
    return alliances.find(alliance => alliance.id === empire.alliance_id) || null
  }

  const filteredAndSortedEmpires = empires
    .filter(empire =>
      (empire.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'planets':
          return (b.planets?.length || 0) - (a.planets?.length || 0)
        case 'fleets':
          return (b.fleets?.length || 0) - (a.fleets?.length || 0)
        default:
          return b.score - a.score
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

  if (filteredAndSortedEmpires.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Crown className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Empires Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No empires match your search criteria. Try adjusting your search terms.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedEmpires.map((empire, index) => (
        <Card
          key={empire.id}
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
                
                {/* Empire Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{empire.name || 'Unknown Empire'}</h3>
                    {index < 3 && (
                      <Badge 
                        variant="outline" 
                        className={getRankColor(index + 1)}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Empire ID: {empire.id}
                    </p>
                    {getEmpireAlliance(empire) ? (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Shield className="w-3 h-3 mr-1" />
                        {getEmpireAlliance(empire)?.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border">
                        Independent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {formatNumber(empire.score)}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {empire.planets?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Planets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {empire.fleets?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Fleets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {empire.alliance?.name || 'Independent'}
                  </div>
                  <div className="text-xs text-muted-foreground">Alliance</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Created {new Date(empire.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Rank #{index + 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Score per planet: {empire.planets?.length ? formatNumber(Math.round(empire.score / empire.planets.length)) : '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
