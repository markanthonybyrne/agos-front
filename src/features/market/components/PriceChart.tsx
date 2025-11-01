import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGetPriceHistoryQuery } from '@/api/endpoints/marketApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface PriceChartProps {
  resource: 'tellerium' | 'krypton'
}

export function PriceChart({ resource }: PriceChartProps) {
  const { data: priceHistory, isLoading } = useGetPriceHistoryQuery({
    resource_type: resource,
    ticks: 100,
  })

  const chartData = useMemo(() => {
    if (!priceHistory?.history) return []
    
    return priceHistory.history.map((entry) => ({
      tick: entry.tick_number,
      price: entry.price,
      volume: entry.traded_volume,
    }))
  }, [priceHistory])

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="panel-glass">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">No price history available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="tick" 
            className="text-xs"
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            className="text-xs"
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={resource === 'tellerium' ? '#22d3ee' : '#a855f7'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

