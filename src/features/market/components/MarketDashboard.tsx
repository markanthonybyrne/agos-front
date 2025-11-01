import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetMarketPricesQuery, useGetMarketStatisticsQuery } from '@/api/endpoints/marketApi'
import { TrendingUp, TrendingDown, Activity, Package, ShoppingCart, DollarSign } from 'lucide-react'
import { PriceDisplay } from './PriceDisplay'
import { PriceChart } from './PriceChart'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/formatters'

export function MarketDashboard() {
  const { data: prices, isLoading: pricesLoading } = useGetMarketPricesQuery()
  const { data: telleriumStats, isLoading: telleriumStatsLoading } = useGetMarketStatisticsQuery({
    resource_type: 'tellerium',
  })
  const { data: kryptonStats, isLoading: kryptonStatsLoading } = useGetMarketStatisticsQuery({
    resource_type: 'krypton',
  })

  return (
    <div className="space-y-6">
      {/* Current Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriceDisplay resource="tellerium" />
        <PriceDisplay resource="krypton" />
      </div>

      {/* Price Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="panel-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Tellerium Price History
            </CardTitle>
            <CardDescription>Price trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PriceChart resource="tellerium" />
          </CardContent>
        </Card>

        <Card className="panel-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Krypton Price History
            </CardTitle>
            <CardDescription>Price trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PriceChart resource="krypton" />
          </CardContent>
        </Card>
      </div>

      {/* Market Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="panel-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Tellerium Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {telleriumStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : telleriumStats ? (
              <div className="space-y-3">
                <StatRow label="Current Price" value={`${telleriumStats.current_price.toFixed(4)}`} />
                <StatRow label="Total Supply" value={formatNumber(telleriumStats.total_supply)} />
                <StatRow label="Production/Tick" value={formatNumber(telleriumStats.total_production)} />
                <StatRow label="Consumption/Tick" value={formatNumber(telleriumStats.total_consumption)} />
                <StatRow 
                  label="Active Buy Orders" 
                  value={telleriumStats.active_orders_buy.toString()}
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <StatRow 
                  label="Active Sell Orders" 
                  value={telleriumStats.active_orders_sell.toString()}
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <StatRow label="Trade Volume" value={formatNumber(telleriumStats.trade_volume)} />
                <StatRow 
                  label="Supply/Demand Ratio" 
                  value={telleriumStats.supply_demand_ratio.toFixed(2)}
                  indicator={telleriumStats.supply_demand_ratio > 1 ? 'up' : 'down'}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No statistics available</p>
            )}
          </CardContent>
        </Card>

        <Card className="panel-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Krypton Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kryptonStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : kryptonStats ? (
              <div className="space-y-3">
                <StatRow label="Current Price" value={`${kryptonStats.current_price.toFixed(4)}`} />
                <StatRow label="Total Supply" value={formatNumber(kryptonStats.total_supply)} />
                <StatRow label="Production/Tick" value={formatNumber(kryptonStats.total_production)} />
                <StatRow label="Consumption/Tick" value={formatNumber(kryptonStats.total_consumption)} />
                <StatRow 
                  label="Active Buy Orders" 
                  value={kryptonStats.active_orders_buy.toString()}
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <StatRow 
                  label="Active Sell Orders" 
                  value={kryptonStats.active_orders_sell.toString()}
                  icon={<ShoppingCart className="w-4 h-4" />}
                />
                <StatRow label="Trade Volume" value={formatNumber(kryptonStats.trade_volume)} />
                <StatRow 
                  label="Supply/Demand Ratio" 
                  value={kryptonStats.supply_demand_ratio.toFixed(2)}
                  indicator={kryptonStats.supply_demand_ratio > 1 ? 'up' : 'down'}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No statistics available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: string
  icon?: React.ReactNode
  indicator?: 'up' | 'down'
}

function StatRow({ label, value, icon, indicator }: StatRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {indicator && (
          indicator === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )
        )}
        <span className="font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}

