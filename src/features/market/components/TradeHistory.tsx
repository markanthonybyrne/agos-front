import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useGetMarketTradesQuery } from '@/api/endpoints/marketApi'
import { formatNumber, formatDateTime } from '@/lib/formatters'
import { History, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

export function TradeHistory() {
  const { allResources, getMetadata } = useResourcesCatalog()
  const [resourceFilter, setResourceFilter] = useState<string | undefined>(undefined)
  const { data: tradesData, isLoading, refetch } = useGetMarketTradesQuery({
    resource_type: resourceFilter,
    limit: 50,
  })

  const trades = tradesData?.trades || []

  // Listen for tick processed events to refetch trades
  useEffect(() => {
    const handleTickProcessed = () => {
      refetch()
    }
    
    window.addEventListener('tick:processed', handleTickProcessed)
    
    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
    }
  }, [refetch])

  return (
    <Card className="panel-glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Trade History
            </CardTitle>
            <CardDescription>
              View your completed trades
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="mb-4">
          <Select 
            value={resourceFilter || 'all'} 
            onValueChange={(value) => setResourceFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {allResources.map((resource) => (
                <SelectItem key={resource.slug} value={resource.slug}>
                  {resource.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trades List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trades found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => {
              const metadata = getMetadata(trade.resource_type)
              return (
                <Card key={trade.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {trade.side === 'buy' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline"
                            className={cn(
                              trade.side === 'buy' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : 'bg-red-500/20 text-red-400 border-red-500/50'
                            )}
                          >
                            {trade.side.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">
                            {formatNumber(trade.quantity)} {metadata.name}
                          </span>
                          <span className="text-sm text-muted-foreground">@</span>
                          <span className="font-mono font-semibold">{trade.price.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Total: {formatNumber(trade.total_value)}</span>
                          <span>•</span>
                          <span>Counterparty: {trade.counterparty.name}</span>
                          <span>•</span>
                          <span>Tick: {trade.tick_number}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDateTime(trade.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

