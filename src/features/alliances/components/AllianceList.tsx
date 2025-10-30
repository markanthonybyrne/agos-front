import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/formatters'
import { 
  Users, 
  Trophy, 
  Star,
  Calendar,
  UserPlus,
  Eye
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alliance } from '@/types/api.types'

interface AllianceListProps {
  alliances: Alliance[]
  isLoading: boolean
  onSelectAlliance: (allianceId: number) => void
  selectedAlliance: number | null
}

export function AllianceList({ 
  alliances, 
  isLoading, 
  onSelectAlliance, 
  selectedAlliance 
}: AllianceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="panel-glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (alliances.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Alliances Found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No alliances match your search criteria. Try adjusting your search terms.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {alliances.map((alliance, index) => (
        <Card
          key={alliance.id}
          className={`panel-glass cursor-pointer transition-all hover:border-primary/50 ${
            selectedAlliance === alliance.id ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onSelectAlliance(alliance.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/20 text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Alliance Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{alliance.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {alliance.tag}
                    </Badge>
                    {index < 3 && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          index === 1 ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                          'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alliance.description || 'No description available'}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {alliance.total_score ? formatNumber(alliance.total_score) : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {alliance.member_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {formatNumber(alliance.fund_tellerium)}
                  </div>
                  <div className="text-xs text-muted-foreground">Tellerium</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {formatNumber(alliance.fund_krypton)}
                  </div>
                  <div className="text-xs text-muted-foreground">Krypton</div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectAlliance(alliance.id)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement join alliance
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created {new Date(alliance.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>Rank #{index + 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Average: {alliance.total_score && alliance.member_count 
                    ? formatNumber(Math.round(alliance.total_score / alliance.member_count)) 
                    : 'N/A'} per member</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
