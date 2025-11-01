import { useGetAchievementsQuery } from '@/api/endpoints/premiumApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAchievementDisplayName } from '@/lib/premiumHelpers'
import { Trophy, CheckCircle, Lock, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function AchievementsPanel() {
  const { data, isLoading } = useGetAchievementsQuery()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const achievements = data?.achievements ?? []
  const available = data?.available ?? {}
  
  const unlockedAchievements = achievements.filter((a) => a.unlocked_at !== null)
  const lockedAchievementSlugs = Object.keys(available).filter(
    (slug) => !achievements.some((a) => a.slug === slug && a.unlocked_at !== null)
  )

  const totalEarned = unlockedAchievements.reduce((sum, a) => sum + a.quantum_credits_awarded, 0)
  const totalPotential = Object.values(available).reduce((sum, reward) => sum + reward, 0)

  // Sort unlocked by date (most recent first)
  const sortedUnlocked = [...unlockedAchievements].sort((a, b) => {
    if (!a.unlocked_at || !b.unlocked_at) return 0
    return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card className="panel-glass border-amber/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Achievements Progress
          </CardTitle>
          <CardDescription>
            {unlockedAchievements.length} / {Object.keys(available).length} Complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Earned</span>
              <span className="text-lg font-bold text-green-400">+{totalEarned} QC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Potential</span>
              <span className="text-lg font-bold text-cyan-400">{totalPotential} QC</span>
            </div>
            <div className="w-full bg-muted/20 rounded-full h-2 mt-4">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all"
                style={{
                  width: `${(unlockedAchievements.length / Object.keys(available).length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {sortedUnlocked.length > 0 && (
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Unlocked Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedUnlocked.map((achievement) => (
                <div
                  key={achievement.slug}
                  className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{getAchievementDisplayName(achievement.slug)}</p>
                      {achievement.unlocked_at && (
                        <p className="text-xs text-muted-foreground">
                          Unlocked {formatDistanceToNow(new Date(achievement.unlocked_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    +{achievement.quantum_credits_awarded} QC
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Achievements */}
      {lockedAchievementSlugs.length > 0 && (
        <Card className="panel-glass border-border/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Locked Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lockedAchievementSlugs.map((slug) => {
                const reward = available[slug]
                // Check if this might be in progress (would need game state to determine)
                const isInProgress = false // TODO: Implement progress checking

                return (
                  <div
                    key={slug}
                    className="p-3 rounded-lg bg-muted/10 border border-border/50 flex items-center justify-between opacity-60"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isInProgress ? (
                        <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{getAchievementDisplayName(slug)}</p>
                        {isInProgress && (
                          <p className="text-xs text-yellow-400">In Progress...</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      +{reward} QC
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {sortedUnlocked.length === 0 && lockedAchievementSlugs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No achievements available</p>
      )}
    </div>
  )
}

