import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useGetMarketPricesQuery } from '@/api/endpoints/marketApi'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

interface PriceDisplayProps {
  resource: string
}

export function PriceDisplay({ resource }: PriceDisplayProps) {
  const { data: prices, isLoading } = useGetMarketPricesQuery()
  const { getMetadata } = useResourcesCatalog()
  const metadata = getMetadata(resource)
  const priceData = prices?.lookup?.[resource]
  const price = priceData?.price ?? 0

  // Placeholder change values until history integration
  const priceChange = priceData?.change_percent ?? 0
  const priceChangePercent = priceChange

  return (
    <Card
      className="panel-glass border-2"
      style={{ borderColor: `${metadata.color}40` }}
    >
      <CardContent className="p-6 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{metadata.name}</h3>
              <Badge style={{ borderColor: `${metadata.color}80`, color: metadata.color }}>
                {metadata.category === 'primary' ? 'Primary' : metadata.rarity}
              </Badge>
            </div>
            <div className={cn('text-3xl font-bold font-mono')} style={{ color: metadata.color }}>
              {price.toFixed(4)}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Current market price</span>
              {priceChangePercent !== 0 && (
                <span
                  className={cn(
                    'flex items-center gap-1 font-medium',
                    priceChangePercent > 0 ? 'text-green-400' : 'text-red-400',
                  )}
                >
                  {priceChangePercent > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {priceChangePercent > 0 ? '+' : ''}
                  {priceChangePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

