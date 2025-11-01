import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetMarketPricesQuery } from '@/api/endpoints/marketApi'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  resource: 'tellerium' | 'krypton'
}

export function PriceDisplay({ resource }: PriceDisplayProps) {
  const { data: prices, isLoading } = useGetMarketPricesQuery()
  const priceData = prices?.[resource]
  const price = priceData?.price ?? 0

  // For now, we'll show static price (you can add price change tracking later)
  const priceChange = 0 // TODO: Calculate from price history
  const priceChangePercent = 0

  return (
    <Card className={cn(
      'panel-glass border-2',
      resource === 'tellerium' ? 'border-cyan-500/40' : 'border-purple-500/40'
    )}>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">
                {resource === 'tellerium' ? 'Tellerium (T)' : 'Krypton (K)'}
              </h3>
              {priceChange !== 0 && (
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  priceChange > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {priceChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{priceChange > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%</span>
                </div>
              )}
            </div>
            <div className="text-3xl font-bold font-mono">
              {price.toFixed(4)}
            </div>
            <p className="text-sm text-muted-foreground">
              Current market price
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

