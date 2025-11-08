import { useGetAchievementsQuery } from '@/api/endpoints/premiumApi'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidgetWindow } from './WidgetWindow'
import { getAchievementDisplayName } from '@/lib/premiumHelpers'
import { Trophy, CheckCircle, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

interface AchievementsWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function AchievementsWidget({
  onMinimize,
  onClose,
  isMinimized,
}: AchievementsWidgetProps) {
  const { data, isLoading } = useGetAchievementsQuery()
  const { openPanel } = usePanel()

  const handleOpenFullPanel = () => {
    openPanel(PanelType.ACHIEVEMENTS, PanelSize.MEDIUM)
  }

  if (isLoading) {
    return (
      <WidgetWindow
        title="Achievements"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-amber/20"
      >
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </WidgetWindow>
    )
  }

  const achievements = data?.achievements ?? []
  const available = data?.available ?? {}
  
  const unlockedAchievements = achievements.filter((a) => a.unlocked_at !== null)
  const totalCount = Object.keys(available).length

  // Get 3 most recent achievements
  const recentAchievements = [...unlockedAchievements]
    .sort((a, b) => {
      if (!a.unlocked_at || !b.unlocked_at) return 0
      return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
    })
    .slice(0, 3)

  const totalEarned = unlockedAchievements.reduce((sum, a) => sum + a.quantum_credits_awarded, 0)

  return (
    <WidgetWindow
      title="Achievements"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-amber/20"
    >
      <div className="space-y-4">
        {/* Progress Summary */}
        <div className="glass-section border-amber/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">
                {unlockedAchievements.length} / {totalCount}
              </span>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              +{totalEarned} QC
            </Badge>
          </div>
          <div className="w-full bg-muted/20 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (unlockedAchievements.length / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Recent Unlocks</p>
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.slug}
                className="glass-section border-green-500/30 p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <p className="text-xs font-medium truncate">
                    {getAchievementDisplayName(achievement.slug)}
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  +{achievement.quantum_credits_awarded}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">No achievements unlocked yet</p>
          </div>
        )}

        {/* View Full Panel */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenFullPanel}
          className="w-full text-amber-400 hover:text-amber-300"
        >
          View All Achievements
          <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </div>
    </WidgetWindow>
  )
}

