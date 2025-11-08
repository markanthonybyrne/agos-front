import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateMarketOrderMutation, useGetMarketPricesQuery } from '@/api/endpoints/marketApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { apiSlice } from '@/api/apiSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'
import { Coins, AlertCircle } from 'lucide-react'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { selectEmpireSecondaryCapacity, selectEmpireSecondaryCapacityUsed } from '@/app/selectors/resourceSelectors'

const orderSchema = z.object({
  planet_id: z.number().min(1, 'Planet is required'),
  resource_type: z.string().min(1, 'Resource is required'),
  quantity: z
    .number()
    .min(1000, 'Minimum quantity is 1,000')
    .max(100000000, 'Maximum quantity is 100,000,000'),
  price_limit: z
    .number()
    .min(0.0001, 'Price limit must be positive')
    .optional()
    .nullable(),
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
  const { primaryResources, secondaryResources, allResources, ledger, getMetadata } = useResourcesCatalog()
  const secondaryCapacity = useAppSelector(selectEmpireSecondaryCapacity)
  const secondaryUsed = useAppSelector(selectEmpireSecondaryCapacityUsed)

  const planets = planetsData?.planets || []

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      planet_id: planets[0]?.id || 0,
      resource_type: allResources[0]?.slug || 'tellerium',
      quantity: 10000,
      price_limit: null,
    },
  })

  const watchQuantity = form.watch('quantity')
  const watchResourceType = form.watch('resource_type')
  const watchPlanetId = form.watch('planet_id')
  const watchPriceLimit = form.watch('price_limit')
  const quantity = Number.isFinite(watchQuantity) ? watchQuantity : 0
  const priceLimit = Number.isFinite(watchPriceLimit as number) ? watchPriceLimit : null

  useEffect(() => {
    if (planets.length > 0 && !form.getValues('planet_id')) {
      form.setValue('planet_id', planets[0].id)
    }
  }, [planets, form])

  useEffect(() => {
    if (!watchResourceType && allResources.length > 0) {
      form.setValue('resource_type', allResources[0].slug)
    }
  }, [watchResourceType, allResources, form])

  const selectedPlanet = planets.find((p) => p.id === watchPlanetId)
  const resourceMetadata = watchResourceType ? getMetadata(watchResourceType) : null
  const isSecondaryResource = resourceMetadata?.category === 'secondary'
  const ledgerEntry = ledger.find((entry) => entry.slug === watchResourceType)
  const currentPrice = watchResourceType ? prices?.lookup?.[watchResourceType]?.price ?? 0 : 0
  const effectivePrice = priceLimit || currentPrice
  const estimatedCost = quantity * effectivePrice
  const secondaryCapacityRemaining = Math.max(0, secondaryCapacity - secondaryUsed)

  const availableForSell = useMemo(() => {
    if (orderType !== 'sell') return 0
    if (isSecondaryResource) {
      return ledgerEntry?.quantity ?? 0
    }
    if (watchResourceType === 'tellerium') {
      return selectedPlanet?.tellerium_balance ?? 0
    }
    if (watchResourceType === 'krypton') {
      return selectedPlanet?.krypton_balance ?? 0
    }
    return 0
  }, [orderType, isSecondaryResource, ledgerEntry, watchResourceType, selectedPlanet])

  const fundingAvailable = useMemo(() => {
    if (orderType !== 'buy') return 0
    if (isSecondaryResource) {
      return selectedPlanet?.tellerium_balance ?? 0
    }
    if (watchResourceType === 'tellerium') {
      return selectedPlanet?.krypton_balance ?? 0
    }
    if (watchResourceType === 'krypton') {
      return selectedPlanet?.tellerium_balance ?? 0
    }
    return 0
  }, [orderType, isSecondaryResource, selectedPlanet, watchResourceType])

  const insufficientSellStock = orderType === 'sell' && availableForSell < quantity
  const insufficientBuyFunds =
    orderType === 'buy' && !isSecondaryResource && fundingAvailable < estimatedCost
  const insufficientCapacity =
    orderType === 'buy' && isSecondaryResource && quantity > secondaryCapacityRemaining

  const disableSubmit = isLoading || insufficientSellStock || insufficientBuyFunds || insufficientCapacity

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
              onValueChange={(value) => form.setValue('resource_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                  Primary Resources
                </div>
                {primaryResources.map((resource) => (
                  <SelectItem key={resource.slug} value={resource.slug}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: resource.color }}
                      />
                      {resource.name}
                    </div>
                  </SelectItem>
                ))}
                {secondaryResources.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                      Secondary Materials
                    </div>
                    {secondaryResources.map((resource) => (
                      <SelectItem key={resource.slug} value={resource.slug}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: resource.color }}
                          />
                          {resource.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {resourceMetadata && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="uppercase"
                  style={{ borderColor: `${resourceMetadata.color}60`, color: resourceMetadata.color }}
                >
                  {resourceMetadata.category === 'primary' ? 'Primary' : resourceMetadata.rarity}
                </Badge>
                <span>
                  {resourceMetadata.category === 'secondary'
                    ? 'Materials stored in the empire ledger'
                    : 'Standard strategic resource'}
                </span>
              </div>
            )}
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
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-2">
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
              {orderType === 'sell' && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>Available to sell:</span>
                  <span className="font-mono">
                    {formatNumber(availableForSell)}
                    {isSecondaryResource && ' (ledger)'}
                  </span>
                </div>
              )}
              {orderType === 'buy' && isSecondaryResource && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>Ledger capacity remaining:</span>
                  <span className="font-mono">{formatNumber(secondaryCapacityRemaining)}</span>
                </div>
              )}
            </div>

          {insufficientBuyFunds && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient {watchResourceType === 'tellerium' ? 'krypton' : 'tellerium'} to fund this purchase.
                Required: {formatNumber(estimatedCost)} | Available: {formatNumber(fundingAvailable)}
              </AlertDescription>
            </Alert>
          )}

          {insufficientSellStock && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient {resourceMetadata?.name ?? watchResourceType} to sell.
                Required: {formatNumber(watchQuantity)} | Available: {formatNumber(availableForSell)}
              </AlertDescription>
            </Alert>
          )}

          {insufficientCapacity && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ledger capacity reached. Free up storage or upgrade your materials vault before buying additional
                {` ${resourceMetadata?.name ?? 'materials'}.`}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={disableSubmit}
          >
            {isLoading ? 'Placing Order...' : `Place ${orderType === 'buy' ? 'Buy' : 'Sell'} Order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

