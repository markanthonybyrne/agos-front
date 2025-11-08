import { TrendingUp, TrendingDown, Activity, Coins } from 'lucide-react'
import { WidgetWindow } from './WidgetWindow'
import { useGetMarketPricesQuery, useGetMarketStatisticsQuery, useGetMarketOrdersQuery } from '@/api/endpoints/marketApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface MarketTrendsWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function MarketTrendsWidget({ 
  onMinimize,
  onClose,
  isMinimized 
}: MarketTrendsWidgetProps) {
  const { data: prices, isLoading: pricesLoading } = useGetMarketPricesQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds for price updates
  })
  const { data: telleriumStats, isLoading: telleriumStatsLoading } = useGetMarketStatisticsQuery({
    resource_type: 'tellerium',
  })
  const { data: kryptonStats, isLoading: kryptonStatsLoading } = useGetMarketStatisticsQuery({
    resource_type: 'krypton',
  })
  const { data: ordersData, isLoading: ordersLoading } = useGetMarketOrdersQuery({})

  // Calculate user's order counts by resource and type
  const orderCounts = useMemo(() => {
    const orders = ordersData?.orders || []
    const activeOrders = orders.filter(order => 
      order.status === 'pending' || order.status === 'partial'
    )
    const map = new Map<string, { buy: number; sell: number }>()

    activeOrders.forEach((order) => {
      const entry = map.get(order.resource_type) ?? { buy: 0, sell: 0 }
      if (order.order_type === 'buy') {
        entry.buy += 1
      } else {
        entry.sell += 1
      }
      map.set(order.resource_type, entry)
    })

    return map
  }, [ordersData])

  const isLoading = pricesLoading || telleriumStatsLoading || kryptonStatsLoading || ordersLoading

  return (
    <WidgetWindow
      title="Market Trends"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-yellow/20"
    >
      <div className="h-full flex flex-col space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Tellerium Market */}
            <div className="p-3 bg-card rounded-lg border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-sm">Tellerium</span>
                </div>
                <span className="font-mono font-bold text-cyan-400">
                  {prices?.lookup?.tellerium?.price?.toFixed(4) || '0.0000'}
                </span>
              </div>
              {telleriumStats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Supply/Demand:</span>
                    <span className={cn(
                      "ml-1 font-semibold",
                      telleriumStats.supply_demand_ratio > 1 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {telleriumStats.supply_demand_ratio.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="ml-1 font-semibold">{formatNumber(telleriumStats.trade_volume)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buy Orders:</span>
                    <span className="ml-1 font-semibold text-green-400">
                      {orderCounts.get('tellerium')?.buy ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sell Orders:</span>
                    <span className="ml-1 font-semibold text-red-400">
                      {orderCounts.get('tellerium')?.sell ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Krypton Market */}
            <div className="p-3 bg-card rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-sm">Krypton</span>
                </div>
                <span className="font-mono font-bold text-purple-400">
                  {prices?.lookup?.krypton?.price?.toFixed(4) || '0.0000'}
                </span>
              </div>
              {kryptonStats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Supply/Demand:</span>
                    <span className={cn(
                      "ml-1 font-semibold",
                      kryptonStats.supply_demand_ratio > 1 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {kryptonStats.supply_demand_ratio.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="ml-1 font-semibold">{formatNumber(kryptonStats.trade_volume)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buy Orders:</span>
                    <span className="ml-1 font-semibold text-green-400">
                      {orderCounts.get('krypton')?.buy ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sell Orders:</span>
                    <span className="ml-1 font-semibold text-red-400">
                      {orderCounts.get('krypton')?.sell ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Summary */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">My Active Orders:</span>
                <span className="font-semibold">
                  {Array.from(orderCounts.values()).reduce(
                    (total, entry) => total + entry.buy + entry.sell,
                    0,
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </WidgetWindow>
  )
}

