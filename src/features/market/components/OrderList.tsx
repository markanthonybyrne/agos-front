import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetMarketOrdersQuery, useCancelMarketOrderMutation } from '@/api/endpoints/marketApi'
import { apiSlice } from '@/api/apiSlice'
import { useAppDispatch } from '@/app/hooks'
import { toast } from 'sonner'
import { formatNumber, formatDateTime } from '@/lib/formatters'
import { ShoppingCart, X, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function OrderList() {
  const dispatch = useAppDispatch()
  const [statusFilter, setStatusFilter] = useState<'pending' | 'partial' | 'completed' | 'cancelled' | undefined>(undefined)
  const { data: ordersData, isLoading, refetch } = useGetMarketOrdersQuery({ status: statusFilter })
  const [cancelOrder] = useCancelMarketOrderMutation()

  // Listen for tick processed events to refetch orders (in case orders were filled)
  useEffect(() => {
    const handleTickProcessed = () => {
      refetch()
      // Also invalidate trades cache when tick processes (trades happen on tick)
      dispatch(apiSlice.util.invalidateTags(['MarketTrade']))
    }
    
    window.addEventListener('tick:processed', handleTickProcessed)
    
    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
    }
  }, [refetch, dispatch])

  const orders = ordersData?.orders || []

  const handleCancel = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      await cancelOrder(orderId).unwrap()
      toast.success('Order cancelled successfully')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel order')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>
      case 'partial':
        return <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/50">Partial</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Completed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/50">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'partial':
        return <AlertCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <Card className="panel-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          My Orders
        </CardTitle>
        <CardDescription>
          View and manage your market orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="mb-4">
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value as any)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const fillPercentage = order.quantity > 0 
                ? (order.filled_quantity / order.quantity) * 100 
                : 0
              const canCancel = order.status === 'pending' || order.status === 'partial'
              const expiresAt = new Date(order.expires_at)
              const now = new Date()
              const timeRemaining = expiresAt.getTime() - now.getTime()
              const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))

              return (
                <Card key={order.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'font-semibold',
                              order.order_type === 'buy' ? 'text-green-400' : 'text-red-400'
                            )}>
                              {order.order_type.toUpperCase()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {order.resource_type === 'tellerium' ? 'Tellerium' : 'Krypton'}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Planet: {order.planet.name}
                          </p>
                        </div>
                      </div>
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(order.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-mono font-semibold">{formatNumber(order.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Filled</p>
                        <p className="font-mono font-semibold">{formatNumber(order.filled_quantity)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-mono font-semibold">{formatNumber(order.remaining_quantity)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price Limit</p>
                        <p className="font-mono font-semibold">
                          {order.price_limit ? order.price_limit.toFixed(4) : 'Market'}
                        </p>
                      </div>
                    </div>

                    {(order.status === 'pending' || order.status === 'partial') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{fillPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={fillPercentage} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Created: {formatDateTime(order.created_at)}</span>
                      {canCancel && hoursRemaining > 0 && (
                        <span>Expires in: {hoursRemaining}h</span>
                      )}
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

