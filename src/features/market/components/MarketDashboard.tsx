import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetMarketStatisticsQuery } from '@/api/endpoints/marketApi'
import { TrendingUp, TrendingDown, Activity, Package, ShoppingCart, DollarSign } from 'lucide-react'
import { PriceDisplay } from './PriceDisplay'
import { PriceChart } from './PriceChart'
import { formatNumber } from '@/lib/formatters'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MarketDashboard() {
  const { primaryResources, secondaryResources, allResources, getMetadata } = useResourcesCatalog()
  const [selectedResource, setSelectedResource] = useState(allResources[0]?.slug ?? '')

  useEffect(() => {
    if (!selectedResource && allResources.length > 0) {
      setSelectedResource(allResources[0].slug)
    } else if (selectedResource && !allResources.find((resource) => resource.slug === selectedResource)) {
      setSelectedResource(allResources[0]?.slug ?? '')
    }
  }, [allResources, selectedResource])

  const { data: stats, isLoading: statsLoading } = useGetMarketStatisticsQuery(
    { resource_type: selectedResource || 'tellerium' },
    { skip: !selectedResource },
  )

  const metadata = selectedResource ? getMetadata(selectedResource) : null

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {primaryResources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Primary Markets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {primaryResources.map((resource) => (
              <PriceDisplay key={resource.slug} resource={resource.slug} />
            ))}
          </div>
        </div>
        )}
        {secondaryResources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Secondary Materials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {secondaryResources.map((resource) => (
                <PriceDisplay key={resource.slug} resource={resource.slug} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedResource && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="panel-glass">
            <CardHeader className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Price History
                </CardTitle>
                <CardDescription>Historical market trend</CardDescription>
              </div>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {allResources.map((resource) => (
                    <SelectItem key={resource.slug} value={resource.slug}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <PriceChart resource={selectedResource} />
            </CardContent>
          </Card>

          <Card className="panel-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" style={{ color: metadata?.color }} />
                {metadata?.name} Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : stats ? (
                <div className="space-y-3">
                  <StatRow label="Current Price" value={stats.current_price.toFixed(4)} />
                  <StatRow label="Total Supply" value={formatNumber(stats.total_supply)} />
                  <StatRow label="Production/Tick" value={formatNumber(stats.total_production)} />
                  <StatRow label="Consumption/Tick" value={formatNumber(stats.total_consumption)} />
                  <StatRow
                    label="Active Buy Orders"
                    value={stats.active_orders_buy.toString()}
                    icon={<ShoppingCart className="w-4 h-4" />}
                  />
                  <StatRow
                    label="Active Sell Orders"
                    value={stats.active_orders_sell.toString()}
                    icon={<ShoppingCart className="w-4 h-4" />}
                  />
                  <StatRow label="Trade Volume" value={formatNumber(stats.trade_volume)} />
                  <StatRow
                    label="Supply/Demand Ratio"
                    value={stats.supply_demand_ratio.toFixed(2)}
                    indicator={stats.supply_demand_ratio > 1 ? 'up' : 'down'}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No statistics available for this resource</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
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

