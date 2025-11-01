import { useState, useEffect } from 'react'
import {
  useGetActiveBoostersQuery,
  useActivateBoosterMutation,
  useGetQuantumCreditsQuery,
} from '@/api/endpoints/premiumApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatTimeRemaining, getBoosterDisplayName, calculateBoosterCost } from '@/lib/premiumHelpers'
import { Zap, Hammer, AlertTriangle, Clock, Coins } from 'lucide-react'

const BOOSTER_CONFIG = {
  production: {
    baseCost: 50,
    duration: 24,
    name: 'Production Booster',
    icon: Zap,
    description: 'Double all resource production across your empire',
  },
  construction: {
    baseCost: 30,
    duration: 12,
    name: 'Construction Booster',
    icon: Hammer,
    description: 'Reduce all build times by 33%',
  },
} as const

export function BoostersPanel() {
  const { data: boostersData, isLoading: boostersLoading, refetch } = useGetActiveBoostersQuery(undefined, {
    pollingInterval: 5 * 60 * 1000, // Poll every 5 minutes
  })
  const { data: qcData } = useGetQuantumCreditsQuery()
  const [activateBooster, { isLoading: isActivating }] = useActivateBoosterMutation()

  const [timeRemaining, setTimeRemaining] = useState<Record<number, string>>({})

  // Update timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (boostersData?.boosters) {
        const timers: Record<number, string> = {}
        boostersData.boosters.forEach((booster) => {
          timers[booster.id] = formatTimeRemaining(booster.expires_at)
        })
        setTimeRemaining(timers)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [boostersData])

  const handleActivateBooster = async (type: 'production' | 'construction') => {
    try {
      const result = await activateBooster({ type }).unwrap()
      toast.success(
        `${getBoosterDisplayName(type)} activated! Cost: ${result.cost} QC (Balance: ${result.new_balance})`
      )
      refetch()
      if (qcData) {
        // Trigger refetch of QC balance
        window.dispatchEvent(new Event('refetch-quantum-credits'))
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to activate booster'
      if (errorMessage.includes('Insufficient')) {
        toast.error('Not enough Quantum Credits')
      } else {
        toast.error(errorMessage)
      }
    }
  }

  if (boostersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const activeBoosters = boostersData?.boosters ?? []
  const balance = qcData?.balance ?? 0
  const transactions = qcData?.transactions ?? []

  return (
    <div className="space-y-6">
      {/* Active Boosters */}
      <Card className="panel-glass border-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Active Boosters ({activeBoosters.length})
          </CardTitle>
          <CardDescription>Currently active enhancements</CardDescription>
        </CardHeader>
        <CardContent>
          {activeBoosters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active boosters</p>
          ) : (
            <div className="space-y-3">
              {activeBoosters.map((booster) => {
                const remaining = timeRemaining[booster.id] || formatTimeRemaining(booster.expires_at)
                const displayName = getBoosterDisplayName(booster.type)
                const isExpiringSoon = remaining.includes('m') && parseInt(remaining) < 60

                return (
                  <div
                    key={booster.id}
                    className="p-4 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            Multiplier: {booster.multiplier}x
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-mono ${isExpiringSoon ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                            {remaining}
                          </p>
                          <p className="text-xs text-muted-foreground">remaining</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Boosters */}
      <Card className="panel-glass border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Available Boosters
          </CardTitle>
          <CardDescription>Purchase temporary enhancements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(BOOSTER_CONFIG).map(([type, config]) => {
            const boosterType = type as 'production' | 'construction'
            const cost = calculateBoosterCost(config.baseCost, transactions)
            const canAfford = balance >= cost
            const recentPurchases = transactions.filter(
              (t) => t.type === 'spent' && t.reason === `booster_${type}`
            )
            const hasRecentPurchase = recentPurchases.length > 0 && 
              new Date(recentPurchases[0].created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            const Icon = config.icon

            return (
              <div
                key={type}
                className="p-4 rounded-lg bg-muted/10 border border-border/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{config.name}</p>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {config.duration} hours
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">{cost} QC</p>
                    {cost > config.baseCost && (
                      <p className="text-xs text-yellow-400">
                        Base: {config.baseCost} QC
                      </p>
                    )}
                  </div>
                </div>

                {hasRecentPurchase && cost > config.baseCost && (
                  <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-400">
                      Repeated use within 7 days costs more. Next purchase will be even higher.
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => handleActivateBooster(boosterType)}
                  disabled={!canAfford || isActivating}
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                >
                  {isActivating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : canAfford ? (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Activate for {cost} QC
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Insufficient Credits (Need {cost} QC)
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

