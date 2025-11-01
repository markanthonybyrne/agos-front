import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateMarketOrderMutation, useGetMarketPricesQuery } from '@/api/endpoints/marketApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { apiSlice } from '@/api/apiSlice'
import { useAppDispatch } from '@/app/hooks'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import { Coins, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const orderSchema = z.object({
  planet_id: z.number().min(1, 'Planet is required'),
  resource_type: z.enum(['tellerium', 'krypton']),
  quantity: z.number().min(1000, 'Minimum quantity is 1,000').max(100000000, 'Maximum quantity is 100,000,000'),
  price_limit: z.number().min(0.01, 'Price limit must be positive').optional().nullable(),
})

type OrderFormData = z.infer<typeof orderSchema>

interface OrderFormProps {
  defaultOrderType?: 'buy' | 'sell'
}

export function OrderForm({ defaultOrderType = 'buy' }: OrderFormProps) {
  const dispatch = useAppDispatch()
  const [orderType, setOrderType] = useState<'buy' | 'sell'>(defaultOrderType)
  const { data: planetsData } = useGetPlanetsQuery()
  const { data: prices } = useGetMarketPricesQuery()
  const [createOrder, { isLoading }] = useCreateMarketOrderMutation()

  const planets = planetsData?.planets || []

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      planet_id: planets[0]?.id || 0,
      resource_type: 'tellerium',
      quantity: 10000,
      price_limit: null,
    },
  })

  const watchQuantity = form.watch('quantity')
  const watchResourceType = form.watch('resource_type')
  const watchPlanetId = form.watch('planet_id')
  const watchPriceLimit = form.watch('price_limit')

  const selectedPlanet = planets.find(p => p.id === watchPlanetId)
  const currentPrice = prices?.[watchResourceType]?.price || 0
  const effectivePrice = watchPriceLimit || currentPrice
  const estimatedCost = watchQuantity * effectivePrice

  // Get available resources for validation
  const availableResource = orderType === 'sell' 
    ? (watchResourceType === 'tellerium' 
        ? selectedPlanet?.tellerium_balance || 0 
        : selectedPlanet?.krypton_balance || 0)
    : (watchResourceType === 'tellerium' 
        ? selectedPlanet?.krypton_balance || 0 // Need Krypton to buy Tellerium
        : selectedPlanet?.tellerium_balance || 0) // Need Tellerium to buy Krypton

  const hasInsufficientResources = orderType === 'sell' 
    ? availableResource < watchQuantity
    : availableResource < estimatedCost

  const onSubmit = async (data: OrderFormData) => {
    try {
      const result = await createOrder({
        ...data,
        order_type: orderType,
      }).unwrap()

      toast.success('Order placed successfully!')
      form.reset()
      // Invalidate trades cache in case order fills immediately
      dispatch(apiSlice.util.invalidateTags(['MarketTrade']))
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to place order')
    }
  }

  return (
    <Card className="panel-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-cyan-400" />
          {orderType === 'buy' ? 'Buy' : 'Sell'} Order
        </CardTitle>
        <CardDescription>
          Place a {orderType} order on the market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={orderType === 'buy' ? 'default' : 'outline'}
            onClick={() => setOrderType('buy')}
            className={orderType === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={orderType === 'sell' ? 'default' : 'outline'}
            onClick={() => setOrderType('sell')}
            className={orderType === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Sell
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Planet Selector */}
          <div className="space-y-2">
            <Label htmlFor="planet_id">Planet</Label>
            <Select
              value={watchPlanetId?.toString() || ''}
              onValueChange={(value) => form.setValue('planet_id', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a planet" />
              </SelectTrigger>
              <SelectContent>
                {planets.map((planet) => (
                  <SelectItem key={planet.id} value={planet.id.toString()}>
                    {planet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.planet_id && (
              <p className="text-sm text-destructive">{form.formState.errors.planet_id.message}</p>
            )}
          </div>

          {/* Resource Type */}
          <div className="space-y-2">
            <Label htmlFor="resource_type">Resource Type</Label>
            <Select
              value={watchResourceType}
              onValueChange={(value) => form.setValue('resource_type', value as 'tellerium' | 'krypton')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tellerium">Tellerium (T)</SelectItem>
                <SelectItem value="krypton">Krypton (K)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1000}
              max={100000000}
              step={1000}
              {...form.register('quantity', { valueAsNumber: true })}
            />
            {form.formState.errors.quantity && (
              <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Min: 1,000 | Max: 100,000,000
            </p>
          </div>

          {/* Price Limit (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="price_limit">Price Limit (Optional)</Label>
            <Input
              id="price_limit"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="Leave empty to use market price"
              {...form.register('price_limit', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' || v === null ? null : Number(v)
              })}
            />
            <p className="text-xs text-muted-foreground">
              {orderType === 'buy' 
                ? 'Maximum price per unit (leave empty for market price)'
                : 'Minimum price per unit (leave empty for market price)'}
            </p>
          </div>

          {/* Current Price Display */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Market Price:</span>
              <span className="font-mono font-semibold">{currentPrice.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {orderType === 'buy' ? 'Estimated Cost:' : 'Estimated Proceeds:'}
              </span>
              <span className="font-mono font-semibold">{formatNumber(estimatedCost)}</span>
            </div>
            {selectedPlanet && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span>
                  Available {orderType === 'sell' ? watchResourceType : watchResourceType === 'tellerium' ? 'krypton' : 'tellerium'}:
                </span>
                <span className="font-mono">{formatNumber(availableResource)}</span>
              </div>
            )}
          </div>

          {/* Insufficient Resources Warning */}
          {hasInsufficientResources && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient {orderType === 'sell' ? watchResourceType : watchResourceType === 'tellerium' ? 'krypton' : 'tellerium'}.
                Required: {formatNumber(orderType === 'sell' ? watchQuantity : estimatedCost)} | 
                Available: {formatNumber(availableResource)}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || hasInsufficientResources}
          >
            {isLoading ? 'Placing Order...' : `Place ${orderType === 'buy' ? 'Buy' : 'Sell'} Order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

