import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useCreateFleetMutation } from '@/api/endpoints/fleetsApi'
import { useGetPlanetShipsQuery, useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { formatNumber, formatResource } from '@/lib/formatters'
import { calculateDistance } from '@/lib/coordinates'
import { Ship, MapPin, Clock, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const fleetSchema = z.object({
  origin_planet_id: z.number().min(1, 'Select an origin planet'),
  destination_coordinate: z.string().min(1, 'Enter destination coordinate'),
  order_type: z.enum(['attack', 'defend', 'station', 'return']),
  auto_return_on_failure: z.boolean().default(false),
})

type FleetFormData = z.infer<typeof fleetSchema>

interface FleetBuilderProps {
  planetId?: number
  onSuccess?: () => void
}

export function FleetBuilder({ planetId, onSuccess }: FleetBuilderProps) {
  const [ships, setShips] = useState<Record<string, number>>({})
  const [createFleet, { isLoading }] = useCreateFleetMutation()
  const { data: planetsData } = useGetPlanetsQuery()
  const { data: planetShipsData } = useGetPlanetShipsQuery(planetId || 0, { skip: !planetId })
  const { data: shipDefinitions } = useGetShipDefinitionsQuery()
  
  // Get ships available on the planet if planetId is provided
  const availableShips = useMemo(() => {
    if (!planetId || !planetShipsData) return []
    
    const ps: any = planetShipsData as any
    const shipsFromResponse: any[] = ps?.ships || ps?.data?.ships || []
    
    // Map to ship definitions with quantities
    return shipsFromResponse.map((ship: any) => {
      const shipDef = shipDefinitions?.ships?.find(s => s.id === ship.definition_id)
      return {
        definition_id: ship.definition_id,
        slug: shipDef?.slug || `ship_${ship.definition_id}`,
        name: shipDef?.name || ship.definition?.name || `Ship #${ship.definition_id}`,
        quantity: ship.quantity || 0,
        description: shipDef?.description || ship.definition?.description || '',
      }
    }).filter(ship => ship.quantity > 0) // Only show ships that are available
  }, [planetId, planetShipsData, shipDefinitions])

  const form = useForm<FleetFormData>({
    resolver: zodResolver(fleetSchema),
    defaultValues: {
      origin_planet_id: planetId || undefined,
      order_type: 'attack',
      auto_return_on_failure: false,
    },
  })
  
  // Set origin planet if planetId is provided
  useEffect(() => {
    if (planetId) {
      form.setValue('origin_planet_id', planetId)
    }
  }, [planetId, form])

  const watchedOrigin = form.watch('origin_planet_id')
  const watchedDestination = form.watch('destination_coordinate')

  const planets: any[] = Array.isArray(planetsData) ? planetsData : (planetsData as any)?.planets || []
  const originPlanet = planets?.find((p: any) => p.id === watchedOrigin)
  const destinationCoord = watchedDestination

  // Calculate travel time and costs
  const travelTime = originPlanet && destinationCoord ? 
    calculateDistance(originPlanet.coordinate, destinationCoord) : 0

  const totalCost = Object.entries(ships).reduce((total, [shipSlug, count]) => {
    // Find ship definition by slug
    const shipDef = shipDefinitions?.ships?.find(s => s.slug === shipSlug)
    if (shipDef) {
      const telleriumCost = (shipDef as any).tellerium_cost || (shipDef as any).cost_tellerium || 0
      const kryptonCost = (shipDef as any).krypton_cost || (shipDef as any).cost_krypton || 0
      total.tellerium += telleriumCost * count
      total.krypton += kryptonCost * count
    }
    return total
  }, { tellerium: 0, krypton: 0 })

  const canAfford = originPlanet && 
    originPlanet.tellerium_balance >= totalCost.tellerium && 
    originPlanet.krypton_balance >= totalCost.krypton

  const totalShips = Object.values(ships).reduce((total, count) => total + count, 0)

  const updateShipCount = (shipType: string, count: number) => {
    setShips(prev => ({
      ...prev,
      [shipType]: Math.max(0, count)
    }))
  }

  const onSubmit = async (data: FleetFormData) => {
    if (totalShips === 0) {
      toast.error('Please add at least one ship to your fleet')
      return
    }

    if (!canAfford) {
      toast.error('Insufficient resources on the origin planet')
      return
    }

    try {
      // Ships are already in slug-based format from the form state
      // Just filter out ships with quantity 0
      const fleetShips: Record<string, number> = {}
      Object.entries(ships).forEach(([shipSlug, count]) => {
        if (count > 0) {
          fleetShips[shipSlug] = count
        }
      })

      if (Object.keys(fleetShips).length === 0) {
        toast.error('Please select at least one ship')
        return
      }

      // Parse destination coordinate
      const coordParts = data.destination_coordinate.split(':').map(Number)
      if (coordParts.length !== 4 || coordParts.some(isNaN)) {
        toast.error('Invalid destination coordinate format')
        return
      }

      await createFleet({
        ships: fleetShips,
        origin_planet_id: data.origin_planet_id,
        destination_quadrant: coordParts[0],
        destination_sector: coordParts[1],
        destination_galaxy: coordParts[2],
        destination_planet: coordParts[3],
        order_type: data.order_type,
        auto_return_on_failure: data.auto_return_on_failure,
      }).unwrap()

      toast.success('Fleet created successfully!')
      setShips({})
      form.reset()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create fleet')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fleet Configuration */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            Fleet Configuration
          </CardTitle>
          <CardDescription>
            Select ships and configure your fleet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Origin Planet */}
            {!planetId && (
              <div className="space-y-2">
                <Label htmlFor="origin_planet">Origin Planet</Label>
                <select
                  id="origin_planet"
                  {...form.register('origin_planet_id', { valueAsNumber: true })}
                  className="w-full p-2 bg-background border border-input rounded-md"
                >
                  <option value="">Select a planet</option>
                  {planets?.map((planet: any) => (
                    <option key={planet.id} value={planet.id}>
                      {planet.name} ({formatCoordinate(planet.coordinate)}) - 
                      T: {formatResource(planet.tellerium_balance)} K: {formatResource(planet.krypton_balance)}
                    </option>
                  ))}
                </select>
                {form.formState.errors.origin_planet_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.origin_planet_id.message}
                  </p>
                )}
              </div>
            )}

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Coordinate</Label>
              <Input
                id="destination"
                placeholder="1:1:2:1"
                {...form.register('destination_coordinate')}
              />
              {form.formState.errors.destination_coordinate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.destination_coordinate.message}
                </p>
              )}
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <Label htmlFor="order_type">Order Type</Label>
              <select
                id="order_type"
                {...form.register('order_type')}
                className="w-full p-2 bg-background border border-input rounded-md"
              >
                <option value="attack">Attack</option>
                <option value="defend">Defend</option>
                <option value="station">Station</option>
                <option value="return">Return</option>
              </select>
            </div>

            {/* Ship Selection */}
            <div className="space-y-4">
              <h4 className="font-semibold">Ship Selection</h4>
              {planetId ? (
                // Show only ships available on this planet
                availableShips.length > 0 ? (
                  availableShips.map((ship: any) => {
                    const shipDef = shipDefinitions?.ships?.find(s => s.id === ship.definition_id)
                    const telleriumCost = (shipDef as any)?.tellerium_cost || (shipDef as any)?.cost_tellerium || 0
                    const kryptonCost = (shipDef as any)?.krypton_cost || (shipDef as any)?.cost_krypton || 0
                    const maxAvailable = ship.quantity
                    const selected = ships[ship.slug] || 0
                    
                    return (
                      <div key={ship.definition_id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{ship.name}</h5>
                            {(telleriumCost > 0 || kryptonCost > 0) && (
                              <Badge variant="outline">
                                {formatResource(telleriumCost)}T / {formatResource(kryptonCost)}K
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              Available: {maxAvailable}
                            </Badge>
                          </div>
                          {ship.description && (
                            <p className="text-sm text-muted-foreground">{ship.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateShipCount(ship.slug, Math.max(0, selected - 1))}
                            disabled={selected === 0}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-mono">
                            {selected}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateShipCount(ship.slug, Math.min(maxAvailable, selected + 1))}
                            disabled={selected >= maxAvailable}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No ships available on this planet. Build ships first.
                  </p>
                )
              ) : (
                // Show all ship definitions (for main fleet builder)
                shipDefinitions?.ships?.map((shipDef: any) => {
                  const telleriumCost = shipDef.tellerium_cost || shipDef.cost_tellerium || 0
                  const kryptonCost = shipDef.krypton_cost || shipDef.cost_krypton || 0
                  const slug = shipDef.slug || `ship_${shipDef.id}`
                  
                  return (
                    <div key={shipDef.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium">{shipDef.name}</h5>
                          {(telleriumCost > 0 || kryptonCost > 0) && (
                            <Badge variant="outline">
                              {formatResource(telleriumCost)}T / {formatResource(kryptonCost)}K
                            </Badge>
                          )}
                        </div>
                        {shipDef.description && (
                          <p className="text-sm text-muted-foreground">{shipDef.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateShipCount(slug, (ships[slug] || 0) - 1)}
                          disabled={!ships[slug]}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-mono">
                          {ships[slug] || 0}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateShipCount(slug, (ships[slug] || 0) + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )
                }) || (
                  <p className="text-muted-foreground text-sm">Loading ship definitions...</p>
                )
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || totalShips === 0 || !canAfford}
            >
              {isLoading ? 'Creating Fleet...' : 'Create Fleet'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fleet Summary */}
      <div className="space-y-6">
        {/* Cost Summary */}
        <Card className="panel-glass border-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tellerium Cost:</span>
                <span className={`font-mono ${canAfford ? 'text-cyan-400' : 'text-destructive'}`}>
                  {formatResource(totalCost.tellerium)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Krypton Cost:</span>
                <span className={`font-mono ${canAfford ? 'text-blue-400' : 'text-destructive'}`}>
                  {formatResource(totalCost.krypton)}
                </span>
              </div>
            </div>

            {originPlanet && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Available Resources</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tellerium:</span>
                    <span className="font-mono text-cyan-400">
                      {formatResource(originPlanet.tellerium_balance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Krypton:</span>
                    <span className="font-mono text-blue-400">
                      {formatResource(originPlanet.krypton_balance)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!canAfford && originPlanet && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient resources on origin planet
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Travel Information */}
        <Card className="panel-glass border-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Travel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {originPlanet && destinationCoord ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-mono text-sm">
                      {formatCoordinate(originPlanet.coordinate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-mono text-sm">
                      {formatCoordinate(destinationCoord)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-mono text-sm">
                      {formatNumber(travelTime)} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Travel Time:</span>
                    <span className="font-mono text-sm">
                      {formatNumber(travelTime)} ticks
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Select origin planet and destination to see travel information
              </p>
            )}
          </CardContent>
        </Card>

        {/* Fleet Summary */}
        <Card className="panel-glass border-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-purple-400" />
              Fleet Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalShips > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Ships:</span>
                  <span className="font-mono text-lg glow-purple">{totalShips}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(ships).map(([shipType, count]) => (
                    count > 0 && (
                      <div key={shipType} className="flex justify-between text-sm">
                        <span className="capitalize">{shipType}:</span>
                        <span className="font-mono">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No ships selected
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
