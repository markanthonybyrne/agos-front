import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetShipDefinitionsQuery, useGetPlanetShipsQuery, useBuildShipsMutation } from '@/api/endpoints/shipsApi'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Planet } from '@/types/api.types'
import { formatResource } from '@/lib/formatters'
import { toast } from 'sonner'
import { Ship, Zap, Shield, Target, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ShipsTabProps {
  planet: Planet
}

const buildShipSchema = z.object({
  ship_slug: z.string().min(1, 'Select a ship type'),
  quantity: z.number().min(1, 'Must build at least 1').max(1000, 'Cannot build more than 1000 at once'),
})

type BuildShipFormData = z.infer<typeof buildShipSchema>

export function ShipsTab({ planet }: ShipsTabProps) {
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetShipDefinitionsQuery()
  const { data: planetShips, isLoading: isLoadingShips } = useGetPlanetShipsQuery(Number(planet.id))
  const [buildShips, { isLoading: isBuilding }] = useBuildShipsMutation()

  // Debug logging for ship definitions
  console.log('Full definitions response:', definitions)
  if (definitions?.ships) {
    console.log('Ship definitions from API:', definitions.ships)
    console.log('First ship definition:', definitions.ships[0])
    console.log('First ship definition keys:', Object.keys(definitions.ships[0] || {}))
  }

  // Get all ship definitions for prerequisite checking
  const allShipDefinitions = definitions?.ships || []
  const { canBuildItem } = usePrerequisites(Number(planet.id), allShipDefinitions as unknown as any[])

  const buildForm = useForm<BuildShipFormData>({
    resolver: zodResolver(buildShipSchema),
    defaultValues: {
      ship_slug: '',
      quantity: 1,
    },
  })

  const ps: any = planetShips as any
  const shipsList: Array<{ definition_id: number; quantity: number; definition?: any }> = ps?.ships || ps?.data?.ships || []

  const handleBuildShips = async (data: BuildShipFormData) => {
    try {
      console.log('Building ships with data:', data)
      
      // Validate ship definition has required fields
      const shipDef = getShipDefinition(data.ship_slug)
      if (!shipDef) {
        toast.error('Ship definition not found')
        return
      }
      
      // Log the ship definition to see what fields are available
      console.log('Ship definition for validation:', shipDef)
      
            // Check if build_time exists, if not, use a default value
            if (!shipDef.build_time_ticks || shipDef.build_time_ticks <= 0) {
              console.warn('Ship definition missing build_time, using default value of 1')
              // Don't return error, just log a warning
            }
      
      const result = await buildShips({
        planetId: Number(planet.id),
        data: {
          ship_slug: data.ship_slug,
          quantity: data.quantity,
        },
      }).unwrap()

      console.log('Build ships result:', result)
      toast.success(`Built ${result.data?.ships_built || data.quantity} ${shipDef.name}!`)
      setBuildDialogOpen(false)
      buildForm.reset()
    } catch (error: any) {
      console.error('Build ships error:', error)
      toast.error(error?.data?.message || 'Failed to build ships')
    }
  }

  const getShipDefinition = (slug: string) => {
    return definitions?.ships?.find(s => s.slug === slug)
  }

  const getTotalShips = () => {
    return shipsList.reduce((total, ship) => total + ship.quantity, 0)
  }

  const getTotalGunPower = () => {
    return shipsList.reduce((total, ship) => {
      const def = definitions?.ships?.find(s => s.id === ship.definition_id)
      return total + ((def?.gun_power || 0) * ship.quantity)
    }, 0)
  }

  const getTotalArmour = () => {
    return shipsList.reduce((total, ship) => {
      const def = definitions?.ships?.find(s => s.id === ship.definition_id)
      return total + ((def?.armour || 0) * ship.quantity)
    }, 0)
  }

  const getTotalInitiative = () => {
    return shipsList.reduce((total, ship) => {
      const def = definitions?.ships?.find(s => s.id === ship.definition_id)
      return total + ((def?.init || 0) * ship.quantity)
    }, 0)
  }

  const selectedShipSlug = buildForm.watch('ship_slug')
  const selectedShipDef = selectedShipSlug ? getShipDefinition(selectedShipSlug) : null
  const buildQuantity = buildForm.watch('quantity') || 1

  if (isLoadingDefinitions || isLoadingShips) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ship Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ships</p>
                <p className="text-2xl font-mono glow-blue">
                  {getTotalShips()}
                </p>
              </div>
              <Ship className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-red/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gun Power</p>
                <p className="text-2xl font-mono glow-red">
                  {getTotalGunPower()}
                </p>
              </div>
              <Target className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-green/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Armour</p>
                <p className="text-2xl font-mono glow-green">
                  {getTotalArmour()}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Initiative</p>
                <p className="text-2xl font-mono glow-purple">
                  {getTotalInitiative()}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build Ships Button */}
      <div className="flex justify-end">
        <Dialog open={buildDialogOpen} onOpenChange={setBuildDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Build Ships
            </Button>
          </DialogTrigger>
          <DialogContent className="panel-glass border-blue/20">
            <DialogHeader>
              <DialogTitle>Build Ships</DialogTitle>
              <DialogDescription>
                Select a ship type and quantity to build on this planet
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={buildForm.handleSubmit(handleBuildShips)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ship_slug">Ship Type</Label>
                <Select
                  value={buildForm.watch('ship_slug')}
                  onValueChange={(value) => buildForm.setValue('ship_slug', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {definitions?.ships?.filter(ship => canBuildItem(ship.slug)).map((ship) => (
                      <SelectItem key={ship.slug} value={ship.slug}>
                        {ship.name} ({ship.class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {buildForm.formState.errors.ship_slug && (
                  <p className="text-sm text-destructive">
                    {buildForm.formState.errors.ship_slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  {...buildForm.register('quantity', { valueAsNumber: true })}
                />
                {buildForm.formState.errors.quantity && (
                  <p className="text-sm text-destructive">
                    {buildForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>

              {selectedShipDef && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedShipDef.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedShipDef.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Cost:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Tellerium:</span>
                      <span className={`font-mono ${
                        planet.tellerium_balance >= (selectedShipDef.tellerium_cost * buildQuantity)
                          ? 'text-cyan-400'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedShipDef.tellerium_cost * buildQuantity)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Krypton:</span>
                      <span className={`font-mono ${
                        planet.krypton_balance >= (selectedShipDef.krypton_cost * buildQuantity)
                          ? 'text-blue-400'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedShipDef.krypton_cost * buildQuantity)}
                      </span>
                    </div>
        <div className="flex justify-between text-sm">
          <span>Build Time:</span>
          <span className="text-muted-foreground">
            {selectedShipDef.build_time_ticks || 0} ticks
          </span>
        </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Ship Stats:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Gun Power:</span>
                      <span className="text-red-400">
                        {selectedShipDef.gun_power || 0} per ship
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Armour:</span>
                      <span className="text-blue-400">
                        {selectedShipDef.armour || 0} per ship
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accuracy:</span>
                      <span className="text-green-400">
                        {selectedShipDef.accuracy || '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Agility:</span>
                      <span className="text-yellow-400">
                        {selectedShipDef.agility || '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Initiative:</span>
                      <span className="text-purple-400">
                        {selectedShipDef.init || 0} per ship
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Travel Time:</span>
                      <span className="text-cyan-400">
                        {selectedShipDef.travel_ticks || 0} ticks
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Fleet Totals:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Total Gun Power:</span>
                      <span className="text-red-400">
                        {(selectedShipDef.gun_power || 0) * buildQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Armour:</span>
                      <span className="text-blue-400">
                        {(selectedShipDef.armour || 0) * buildQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Initiative:</span>
                      <span className="text-purple-400">
                        {(selectedShipDef.init || 0) * buildQuantity}
                      </span>
                    </div>
                  </div>

                  {((planet.tellerium_balance < selectedShipDef.tellerium_cost * buildQuantity) ||
                    (planet.krypton_balance < selectedShipDef.krypton_cost * buildQuantity)) && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive">
                        Insufficient resources
                      </span>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBuildDialogOpen(false)
                    buildForm.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isBuilding ||
                    !selectedShipDef ||
                    planet.tellerium_balance < ((selectedShipDef?.tellerium_cost || 0) * buildQuantity) ||
                    planet.krypton_balance < ((selectedShipDef?.krypton_cost || 0) * buildQuantity)
                  }
                >
                  {isBuilding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Build Ships
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ship List */}
      {shipsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shipsList.map((ship) => {
            const defFromDefs = definitions?.ships?.find(s => s.id === ship.definition_id)
            const def = defFromDefs || ship.definition || {}
            const displayName = def.name || `Ship #${ship.definition_id}`
            const displayClass = def.class || '—'

            return (
              <Card key={ship.definition_id} className="panel-glass border-blue/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-400" />
                    {displayName}
                  </CardTitle>
                  <CardDescription>
                    {displayClass}{def.description ? ` • ${def.description}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <Badge variant="outline" className="text-blue-400">
                      {ship.quantity}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Attack Power:</span>
                      <span className="text-red-400">
                        {(def.attack_power || def.gun_power || 0)} per ship ({(def.attack_power || def.gun_power || 0) * ship.quantity} total)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Defense Power:</span>
                      <span className="text-blue-400">
                        {(def.defence_power || def.armor || def.armour || 0)} per ship ({(def.defence_power || def.armor || def.armour || 0) * ship.quantity} total)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Speed:</span>
                      <span className="text-green-400">
                        {def.speed || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cargo Capacity:</span>
                      <span className="text-yellow-400">
                        {(def.cargo_capacity || 0)} per ship ({(def.cargo_capacity || 0) * ship.quantity} total)
                      </span>
                    </div>
                    {(def.energy_consumption || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Energy Consumption:</span>
                        <span className="text-purple-400">
                          {(def.energy_consumption || 0) * ship.quantity}/tick
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="panel-glass border-muted/20">
          <CardContent className="pt-6 text-center">
            <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ships</h3>
            <p className="text-muted-foreground mb-4">
              This planet has no ships. Build ships to create fleets and expand your empire.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Ships */}
      {definitions && definitions.ships && definitions.ships.length > 0 && (
        <Card className="panel-glass border-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-400" />
              Available Ship Types
            </CardTitle>
            <CardDescription>
              All ship types you can build on planets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {definitions.ships.filter(ship => canBuildItem(ship.slug)).map((ship) => {
                const currentShip = shipsList.find(s => s.definition_id === ship.id)
                const currentQuantity = currentShip?.quantity || 0
                
                return (
                  <div key={ship.id} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                    <Ship className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{ship.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {ship.class}
                        </Badge>
                        {currentQuantity > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {currentQuantity} built
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {ship.description}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Cost:</span>
                      <span>
                            {formatResource(ship.tellerium_cost || 0)} T, {formatResource(ship.krypton_cost || 0)} K
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attack:</span>
                          <span>{ship.gun_power || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Defense:</span>
                          <span>{ship.armour || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span>{(ship as any).speed || 0}</span>
                        </div>
          <div className="flex justify-between">
            <span>Build Time:</span>
            <span>{ship.build_time_ticks || 0} ticks</span>
          </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
