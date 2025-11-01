import { useGetQuantumCreditsQuery, useClaimDailyLoginMutation } from '@/api/endpoints/premiumApi'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidgetWindow } from './WidgetWindow'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'
import { Coins, Calendar, Flame, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface QuantumCreditsWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function QuantumCreditsWidget({
  onMinimize,
  onClose,
  isMinimized,
}: QuantumCreditsWidgetProps) {
  const { data, isLoading } = useGetQuantumCreditsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute
  })
  const [claimDailyLogin, { isLoading: isClaiming }] = useClaimDailyLoginMutation()
  const { openPanel } = usePanel()

  const handleClaimDaily = async () => {
    try {
      const result = await claimDailyLogin().unwrap()
      toast.success(
        `Daily bonus claimed! +${result.data?.reward || 0} QC (Balance: ${result.data?.new_balance || 0})`
      )
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to claim daily bonus'
      toast.error(errorMessage)
    }
  }

  const handleOpenFullPanel = () => {
    openPanel(PanelType.QUANTUM_CREDITS, PanelSize.MEDIUM)
  }

  const balance = data?.balance ?? 0
  const canClaim = data?.can_claim_daily ?? false
  const streak = data?.daily_login_streak ?? 0

  return (
    <WidgetWindow
      title="Quantum Credits"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-cyan/20"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-cyan/20">
            <div className="flex items-center gap-3">
              <img
                src={getQuantumCreditsImage()}
                alt="Quantum Credits"
                className="w-10 h-10"
              />
              <div>
                <p className="text-2xl font-bold text-cyan-400">{balance}</p>
                <p className="text-xs text-muted-foreground">Quantum Credits</p>
              </div>
            </div>
          </div>

          {/* Daily Login */}
          <div className="p-4 bg-card rounded-lg border border-yellow/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Daily Login</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-muted-foreground">{streak} day streak</span>
              </div>
            </div>
            <Button
              onClick={handleClaimDaily}
              disabled={!canClaim || isClaiming}
              size="sm"
              className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
            >
              {isClaiming ? 'Claiming...' : canClaim ? 'Claim Daily Bonus' : 'Already Claimed'}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPanel(PanelType.BOOSTERS, PanelSize.MEDIUM)}
              className="flex-1"
            >
              Boosters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPanel(PanelType.ACHIEVEMENTS, PanelSize.MEDIUM)}
              className="flex-1"
            >
              Achievements
            </Button>
          </div>

          {/* View Full Panel */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenFullPanel}
            className="w-full text-cyan-400 hover:text-cyan-300"
          >
            View Full Panel
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      )}
    </WidgetWindow>
  )
}

