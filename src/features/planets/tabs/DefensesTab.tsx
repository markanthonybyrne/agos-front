import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetDefenceDefinitionsQuery, useGetPlanetDefencesQuery, useBuildDefencesMutation, useDestroyDefencesMutation } from '@/api/endpoints/defencesApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Planet } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { Shield, Zap, AlertTriangle, Target, Bomb, Plus, Trash2, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface DefensesTabProps {
  planet: Planet
}

const buildDefenceSchema = z.object({
  defence_slug: z.string().min(1, 'Select a defense type'),
  quantity: z.number().min(1, 'Must build at least 1').max(100, 'Cannot build more than 100 at once'),
})

type BuildDefenceFormData = z.infer<typeof buildDefenceSchema>

export function DefensesTab({ planet }: DefensesTabProps) {
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)
  const [destroyDefenceId, setDestroyDefenceId] = useState<number | null>(null)
  const [destroyQuantity, setDestroyQuantity] = useState<number>(1)

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetDefenceDefinitionsQuery()
  const { data: planetDefences, isLoading: isLoadingDefences } = useGetPlanetDefencesQuery(Number(planet.id))
  const { data: meData } = useGetMeQuery()

  // Debug logging for defence definitions
  console.log('Full defence definitions response:', definitions)
  if (definitions?.defences) {
    console.log('Defence definitions from API:', definitions.defences)
    console.log('First defence definition:', definitions.defences[0])
    console.log('First defence definition keys:', Object.keys(definitions.defences[0] || {}))
  }
  const [buildDefences, { isLoading: isBuilding }] = useBuildDefencesMutation()
  const [destroyDefences, { isLoading: isDestroying }] = useDestroyDefencesMutation()

  // Get all defence definitions for prerequisite checking
  const allDefenceDefinitions = (definitions?.defences || []) as any[]
  const { canBuildItem } = usePrerequisites(Number(planet.id), allDefenceDefinitions as any)

  const buildForm = useForm<BuildDefenceFormData>({
    resolver: zodResolver(buildDefenceSchema),
    defaultValues: {
      defence_slug: '',
      quantity: 1,
    },
  })

  // Convert defence_grid object on Planet detail to list shape when endpoint not populated
  const defencesFromPlanetObj = Object.entries((planet as any).defence_grid || {}).map(([slug, quantity]: any, idx) => ({
    id: idx + 1,
    defence_slug: slug,
    quantity: Number(quantity),
  }))
  // Optional fallback from auth/me planets array
  const mePlanet = (meData?.planets || []).find((p: any) => Number(p.id) === Number(planet.id)) as any
  const meDefObj: Record<string, number> = (mePlanet?.defence_grid as any) || {}
  const meDefList = Object.entries(meDefObj).map(([slug, quantity], idx) => ({ id: idx + 1, defence_slug: slug, quantity: Number(quantity) }))
  const pd: any = planetDefences as any
  const defFromEndpoint: any[] = pd?.defences || pd?.data?.defences || []
  const defencesList = defFromEndpoint.length > 0
    ? defFromEndpoint
    : (defencesFromPlanetObj.length > 0 ? defencesFromPlanetObj : meDefList)

  const handleBuildDefences = async (data: BuildDefenceFormData) => {
    try {
      await buildDefences({
        planetId: Number(planet.id),
        data: {
          defence_slug: data.defence_slug,
          quantity: data.quantity,
        },
      }).unwrap()

      toast.success(`Built ${data.quantity} ${getDefenceDefinition(data.defence_slug)?.name || 'defences'}!`)
      setBuildDialogOpen(false)
      buildForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to build defences')
    }
  }

  const handleDestroyDefences = async (defenceId: number) => {
    try {
      await destroyDefences({
        id: defenceId,
        quantity: destroyQuantity > 0 ? destroyQuantity : undefined,
      }).unwrap()

      toast.success('Defences destroyed successfully!')
      setDestroyDefenceId(null)
      setDestroyQuantity(1)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to destroy defences')
    }
  }

  const getDefenceDefinition = (slug: string) => {
    return definitions?.defences?.find(d => d.slug === slug)
  }

  const getTotalDefenseValue = () => {
    return defencesList.reduce((total, defence) => total + defence.quantity, 0)
  }

  const getDefenseRating = () => {
    const total = getTotalDefenseValue()
    if (total === 0) return { rating: 'None', color: 'text-muted-foreground' }
    if (total < 10) return { rating: 'Light', color: 'text-yellow-400' }
    if (total < 25) return { rating: 'Moderate', color: 'text-orange-400' }
    if (total < 50) return { rating: 'Heavy', color: 'text-red-400' }
    return { rating: 'Fortress', color: 'text-purple-400' }
  }

  const defenseRating = getDefenseRating()
  const selectedDefenceSlug = buildForm.watch('defence_slug')
  const selectedDefenceDef = selectedDefenceSlug ? getDefenceDefinition(selectedDefenceSlug) : null
  const buildQuantity = buildForm.watch('quantity') || 1

  if (isLoadingDefinitions || isLoadingDefences) {
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
      {/* Defense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="panel-glass border-red/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Defenses</p>
                <p className="text-2xl font-mono glow-red">
                  {getTotalDefenseValue()}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-purple/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Defense Rating</p>
                <p className={`text-2xl font-mono ${defenseRating.color}`}>
                  {defenseRating.rating}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="panel-glass border-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Defense Types</p>
                <p className="text-2xl font-mono glow-blue">
                  {defencesList.length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build Defenses Button */}
      <div className="flex justify-end">
        <Dialog open={buildDialogOpen} onOpenChange={setBuildDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Build Defenses
            </Button>
          </DialogTrigger>
          <DialogContent className="panel-glass border-red/20">
            <DialogHeader>
              <DialogTitle>Build Defenses</DialogTitle>
              <DialogDescription>
                Select a defense type and quantity to build on this planet
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={buildForm.handleSubmit(handleBuildDefences)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defence_slug">Defense Type</Label>
                <Select
                  value={buildForm.watch('defence_slug')}
                  onValueChange={(value) => buildForm.setValue('defence_slug', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select defense type" />
                  </SelectTrigger>
                  <SelectContent>
                    {definitions?.defences?.filter(defence => canBuildItem(defence.slug)).map((defence) => (
                      <SelectItem key={defence.slug} value={defence.slug}>
                        {defence.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {buildForm.formState.errors.defence_slug && (
                  <p className="text-sm text-destructive">
                    {buildForm.formState.errors.defence_slug.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  {...buildForm.register('quantity', { valueAsNumber: true })}
                />
                {buildForm.formState.errors.quantity && (
                  <p className="text-sm text-destructive">
                    {buildForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>

              {selectedDefenceDef && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedDefenceDef.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedDefenceDef.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Cost:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Tellerium:</span>
                      <span className={`font-mono ${
                        planet.tellerium_balance >= (selectedDefenceDef.tellerium_cost * buildQuantity)
                          ? 'text-cyan-400'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedDefenceDef.tellerium_cost * buildQuantity)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Krypton:</span>
                      <span className={`font-mono ${
                        planet.krypton_balance >= (selectedDefenceDef.krypton_cost * buildQuantity)
                          ? 'text-blue-400'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedDefenceDef.krypton_cost * buildQuantity)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Defense Stats:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Target Class:</span>
                      <span className="text-cyan-400">
                        {selectedDefenceDef.target_class || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Initiative:</span>
                      <span className="text-purple-400">
                        {(selectedDefenceDef.init || 0) * buildQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Build Time:</span>
                      <span className="text-muted-foreground">
                        {selectedDefenceDef.build_time_ticks || 0} ticks
                      </span>
                    </div>
                    {selectedDefenceDef.attack_power && (
                      <div className="flex justify-between text-sm">
                        <span>Attack Power:</span>
                        <span className="text-red-400">
                          {selectedDefenceDef.attack_power * buildQuantity}
                        </span>
                      </div>
                    )}
                    {selectedDefenceDef.defence_power && (
                      <div className="flex justify-between text-sm">
                        <span>Defense Power:</span>
                        <span className="text-blue-400">
                          {selectedDefenceDef.defence_power * buildQuantity}
                        </span>
                      </div>
                    )}
                    {selectedDefenceDef.energy_consumption && (
                      <div className="flex justify-between text-sm">
                        <span>Energy Consumption:</span>
                        <span className="text-yellow-400">
                          {selectedDefenceDef.energy_consumption * buildQuantity}/tick
                        </span>
                      </div>
                    )}
                  </div>

                  {((planet.tellerium_balance < selectedDefenceDef.tellerium_cost * buildQuantity) ||
                    (planet.krypton_balance < selectedDefenceDef.krypton_cost * buildQuantity)) && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
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
                    !selectedDefenceDef ||
                    planet.tellerium_balance < ((selectedDefenceDef?.tellerium_cost || 0) * buildQuantity) ||
                    planet.krypton_balance < ((selectedDefenceDef?.krypton_cost || 0) * buildQuantity)
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
                      Build Defenses
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Defense Systems */}
      {defencesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defencesList.map((defence) => {
            const dslug = (defence as any)?.defence_slug || (defence as any)?.slug || ''
            const definition = definitions?.defences?.find(d => d.slug === dslug)
            const name = definition?.name || (dslug ? dslug.replace(/_/g, ' ') : 'Defence')
            const description = definition?.description || 'Defence system'

            return (
              <Card key={defence.id} className="panel-glass border-red/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    {name}
                  </CardTitle>
                  <CardDescription>
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity</span>
                    <Badge variant="outline" className="text-red-400">
                      {defence.quantity}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {definition && (
                      <>
                    <div className="flex justify-between text-sm">
                      <span>Total Attack Power:</span>
                      <span className="text-red-400">
                            {(definition.attack_power ?? 0) * defence.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Defense Power:</span>
                      <span className="text-blue-400">
                            {(definition.defence_power ?? 0) * defence.quantity}
                      </span>
                    </div>
                        {(definition.energy_consumption ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Energy Consumption:</span>
                        <span className="text-yellow-400">
                              {(definition.energy_consumption ?? 0) * defence.quantity}/tick
                        </span>
                      </div>
                        )}
                      </>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setDestroyDefenceId(defence.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Destroy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="panel-glass border-destructive/20">
                      <DialogHeader>
                        <DialogTitle>Destroy Defenses</DialogTitle>
                        <DialogDescription>
                          How many {definition?.name || defence.defence_slug || 'defences'} do you want to destroy? Leave empty to destroy all.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="destroy-quantity">Quantity (leave empty for all)</Label>
                          <Input
                            id="destroy-quantity"
                            type="number"
                            min="1"
                            max={defence.quantity}
                            value={destroyQuantity || ''}
                            onChange={(e) => setDestroyQuantity(e.target.value ? parseInt(e.target.value) : 0)}
                            placeholder={`Max: ${defence.quantity}`}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDestroyDefenceId(null)
                              setDestroyQuantity(1)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDestroyDefences(defence.id)}
                            disabled={isDestroying || (destroyQuantity > 0 && destroyQuantity > defence.quantity)}
                          >
                            {isDestroying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Destroying...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Destroy {destroyQuantity > 0 ? destroyQuantity : 'All'}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="panel-glass border-muted/20">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Defenses Built</h3>
            <p className="text-muted-foreground mb-4">
              This planet has no defensive systems. Build defenses to protect against enemy attacks.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Defense Information */}
      {definitions && definitions.defences && definitions.defences.length > 0 && (
        <Card className="panel-glass border-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Defense Systems Guide
            </CardTitle>
            <CardDescription>
              Information about different defense types and their effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {definitions.defences.filter(defence => canBuildItem(defence.slug)).map((defence) => {
                const currentDefence = defencesList.find(d => d.defence_slug === defence.slug)
                const currentQuantity = currentDefence?.quantity || 0
                
                return (
                  <div key={defence.id} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                    <Shield className="w-5 h-5 text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{defence.name}</h4>
                        {currentQuantity > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {currentQuantity} built
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {defence.description}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>
                            {formatResource(defence.tellerium_cost ?? 0)} T, {formatResource(defence.krypton_cost ?? 0)} K
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attack:</span>
                          <span>{defence.attack_power}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Defense:</span>
                          <span>{defence.defence_power}</span>
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