import { useMemo } from 'react'
import { ConstructionQueueItem } from '@/types/api.types'
import { Clock, TrendingUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/app/hooks'

interface QueueStatsProps {
  constructions: ConstructionQueueItem[]
}

export function QueueStats({ constructions }: QueueStatsProps) {
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds)
  
  // Calculate tick-based progress for each construction
  const calculateTickProgress = (construction: ConstructionQueueItem): number => {
    const ticksRemaining = construction.ticks_remaining || 0
    
    if (construction.is_completed || ticksRemaining <= 0) {
      return 100
    }
    
    // Try to calculate from dates and tick interval
    if (construction.started_at && construction.completes_at && tickIntervalSeconds && tickIntervalSeconds > 0) {
      try {
        const startDate = new Date(construction.started_at)
        const completeDate = new Date(construction.completes_at)
        const totalMs = completeDate.getTime() - startDate.getTime()
        const totalSeconds = totalMs / 1000
        const totalTicks = Math.ceil(totalSeconds / tickIntervalSeconds)
        
        if (totalTicks > 0) {
          const progressTicks = totalTicks - ticksRemaining
          return Math.max(0, Math.min(100, (progressTicks / totalTicks) * 100))
        }
      } catch (e) {
        // Fall through
      }
    }
    
    // Fallback to API progress
    return construction.progress_percentage || 0
  }
  
  const stats = useMemo(() => {
    if (constructions.length === 0) {
      return {
        total: 0,
        nextCompletion: null,
        avgProgress: 0,
      }
    }

    // Find next completion time (based on ticks remaining, not just time)
    const sortedByCompletion = [...constructions]
      .filter((c) => !c.is_completed && c.ticks_remaining > 0)
      .sort((a, b) => {
        // Sort by ticks_remaining first (most accurate)
        if (a.ticks_remaining !== b.ticks_remaining) {
          return a.ticks_remaining - b.ticks_remaining
        }
        // Then by completion date
        return new Date(a.completes_at).getTime() - new Date(b.completes_at).getTime()
      })

    const nextCompletion = sortedByCompletion[0]?.completes_at || null

    // Calculate average progress using tick-based calculation
    const progressValues = constructions.map(calculateTickProgress)
    const avgProgress = progressValues.reduce((sum, p) => sum + p, 0) / constructions.length

    return {
      total: constructions.length,
      nextCompletion,
      avgProgress: Math.round(avgProgress),
    }
  }, [constructions, tickIntervalSeconds])

  const defenceCount = useMemo(
    () => constructions.filter((construction) => construction.type === 'defence').length,
    [constructions],
  )

  const formatNextCompletion = () => {
    if (!stats.nextCompletion) return 'N/A'

    const now = new Date()
    const completion = new Date(stats.nextCompletion)
    const diff = completion.getTime() - now.getTime()

    if (diff <= 0) return 'Now'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <span className="text-muted-foreground">Queue:</span>
        <span className="font-semibold text-foreground">{stats.total}</span>
      </div>

      {stats.nextCompletion && (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-muted-foreground">Next:</span>
          <span className="font-semibold text-cyan-400">{formatNextCompletion()}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Avg Progress:</span>
        <span className="font-semibold text-foreground">{stats.avgProgress}%</span>
      </div>

      {defenceCount > 0 && (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-muted-foreground">Defence Builds:</span>
          <span className="font-semibold text-red-300">{defenceCount}</span>
        </div>
      )}
    </div>
  )
}

