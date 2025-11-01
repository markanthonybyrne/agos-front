import { useGetActiveBoostersQuery } from '@/api/endpoints/premiumApi'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidgetWindow } from './WidgetWindow'
import { formatTimeRemaining, getBoosterDisplayName } from '@/lib/premiumHelpers'
import { Zap, ArrowRight, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'

interface BoostersWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function BoostersWidget({
  onMinimize,
  onClose,
  isMinimized,
}: BoostersWidgetProps) {
  const { data, isLoading } = useGetActiveBoostersQuery(undefined, {
    pollingInterval: 5 * 60 * 1000, // Poll every 5 minutes
  })
  const { openPanel } = usePanel()

  const [timeRemaining, setTimeRemaining] = useState<Record<number, string>>({})

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (data?.boosters) {
        const timers: Record<number, string> = {}
        data.boosters.forEach((booster) => {
          timers[booster.id] = formatTimeRemaining(booster.expires_at)
        })
        setTimeRemaining(timers)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [data])

  const handleOpenFullPanel = () => {
    openPanel(PanelType.BOOSTERS, PanelSize.MEDIUM)
  }

  const activeBoosters = data?.boosters ?? []

  return (
    <WidgetWindow
      title="Active Boosters"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-purple/20"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeBoosters.length === 0 ? (
            <div className="text-center py-6">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No active boosters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFullPanel}
                className="w-full"
              >
                Purchase Boosters
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {activeBoosters.map((booster) => {
                  const remaining = timeRemaining[booster.id] || formatTimeRemaining(booster.expires_at)
                  const displayName = getBoosterDisplayName(booster.type)

                  return (
                    <div
                      key={booster.id}
                      className="p-3 rounded-lg bg-muted/20 border border-purple/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {booster.multiplier}x multiplier
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {remaining}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFullPanel}
                className="w-full text-purple-400 hover:text-purple-300"
              >
                Manage Boosters
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </>
          )}
        </div>
      )}
    </WidgetWindow>
  )
}

