import { useState } from 'react'
import { useGetQuantumCreditsQuery, useClaimDailyLoginMutation } from '@/api/endpoints/premiumApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'
import { Calendar, Coins, TrendingUp, TrendingDown, Clock, Flame } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function QuantumCreditsPanel() {
  const { data, isLoading, refetch } = useGetQuantumCreditsQuery(undefined, {
    pollingInterval: 60000, // Poll every 60 seconds when panel is open
  })
  const [claimDailyLogin, { isLoading: isClaiming }] = useClaimDailyLoginMutation()

  const handleClaimDaily = async () => {
    try {
      const result = await claimDailyLogin().unwrap()
      toast.success(
        `Daily bonus claimed! +${result.data?.reward || 0} QC (Balance: ${result.data?.new_balance || 0})`
      )
      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to claim daily bonus'
      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const balance = data?.balance ?? 0
  const canClaim = data?.can_claim_daily ?? false
  const streak = data?.daily_login_streak ?? 0
  const transactions = data?.transactions ?? []

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src={getQuantumCreditsImage()}
              alt="Quantum Credits"
              className="w-8 h-8"
            />
            <span>Quantum Credits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-cyan-400">{balance}</p>
              <p className="text-sm text-muted-foreground mt-1">Available Balance</p>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Login Section */}
      <Card className="panel-glass border-yellow/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            Daily Login Bonus
          </CardTitle>
          <CardDescription>
            Claim your daily reward and build your streak
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium">Current Streak: {streak} days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {streak < 7
                  ? `Day ${streak + 1} reward: 1 QC (${7 - streak} days until 2 QC/day)`
                  : 'Day 7+ reward: 2 QC per day'}
              </p>
            </div>
            <Button
              onClick={handleClaimDaily}
              disabled={!canClaim || isClaiming}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30"
            >
              {isClaiming ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : canClaim ? (
                <>
                  <Coins className="w-4 h-4 mr-2" />
                  Claim Daily Bonus
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Already Claimed
                </>
              )}
            </Button>
          </div>
          {!canClaim && data?.last_daily_login_claim && (
            <p className="text-xs text-muted-foreground">
              Last claimed: {formatDistanceToNow(new Date(data.last_daily_login_claim), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="panel-glass border-border/20">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Last 20 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction, index) => {
                const isPositive = transaction.amount > 0
                const isEarned = transaction.type === 'earned'
                const isSpent = transaction.type === 'spent'
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isPositive ? 'default' : 'destructive'}
                      className={
                        isPositive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                    >
                      {isPositive ? '+' : ''}{transaction.amount} QC
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

