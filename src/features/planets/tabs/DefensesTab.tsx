import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetDefenceDefinitionsQuery, useGetPlanetDefencesQuery, useBuildDefencesMutation, useDestroyDefencesMutation } from '@/api/endpoints/defencesApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
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
import { getDefenseImage } from '@/lib/defenseImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

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

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetDefenceDefinitionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetDefences, isLoading: isLoadingDefences } = useGetPlanetDefencesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { data: meData } = useGetMeQuery()

  // Get buildable items to see what can be built on this planet
  const { data: buildableItemsData } = useGetBuildableItemsQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })

  // Debug logging for defence definitions
  console.log('Full defence definitions response:', definitions)
  if (definitions?.defences) {
    console.log('Defence definitions from API:', definitions.defences)
    console.log('First defence definition:', definitions.defences[0])
    console.log('First defence definition keys:', Object.keys(definitions.defences[0] || {}))
  }
  
  console.log('BuildableItems data:', buildableItemsData)
  
  const [buildDefences, { isLoading: isBuilding }] = useBuildDefencesMutation()
  const [destroyDefences, { isLoading: isDestroying }] = useDestroyDefencesMutation()

  // Get all defence definitions for prerequisite checking
  const allDefenceDefinitions = (definitions?.defences || []) as any[]
  
  // Extract buildable defences from buildable items data
  const buildableDefences = useMemo(() => {
    if (!buildableItemsData?.defences) {
      return []
    }
    
    console.log('Raw buildableItemsData.defences:', buildableItemsData.defences)
    console.log('Type of buildableItemsData.defences:', typeof buildableItemsData.defences)
    console.log('Is array?', Array.isArray(buildableItemsData.defences))
    
    if (Array.isArray(buildableItemsData.defences)) {
      console.log('✅ Extracted defences as array:', buildableItemsData.defences)
      return buildableItemsData.defences
    } else if (typeof buildableItemsData.defences === 'object') {
      // If it's an object, try to extract array from it
      const values = Object.values(buildableItemsData.defences)
      console.log('Object values:', values)
      
      // Check if any value is an array
      const arrayValue = values.find(Array.isArray)
      if (arrayValue) {
        console.log('✅ Extracted defences from nested array:', arrayValue)
        return arrayValue as any[]
      } else {
        // Try to get defences from object keys directly
        console.log('✅ Extracted defences from object values:', values)
        return values as any[]
      }
    }
    
    return []
  }, [buildableItemsData?.defences])
  
  const { canBuildItem } = usePrerequisites(Number(planet.id), allDefenceDefinitions as any)
  
  // Determine which defences to show in dropdown
  const availableDefences = useMemo(() => {
    // If we have buildable defences, use them directly (they already have all needed fields)
    if (buildableDefences.length > 0) {
      console.log('✅ Using buildable defences from API:', buildableDefences.length)
      return buildableDefences
    }
    
    // Wait for definitions to load before using fallback
    if (isLoadingDefinitions || !definitions?.defences || allDefenceDefinitions.length === 0) {
      console.log('⏳ Waiting for defence definitions to load...')
      return []
    }
    
    // Fallback: Show all defence definitions if buildable defences aren't available
    // Backend will validate prerequisites when building
    console.log('⚠️ Using fallback: all defence definitions')
    return allDefenceDefinitions
  }, [buildableDefences, isLoadingDefinitions, definitions?.defences, allDefenceDefinitions])

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

      toast.success(`Queued ${data.quantity} ${getDefenceDefinition(data.defence_slug)?.name || 'defences'} for construction!`)
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
    // First check buildable defences (they already have all needed fields)
    if (buildableDefences.length > 0) {
      const found = buildableDefences.find(d => d.slug === slug)
      if (found) return found
    }
    // Fallback to all definitions
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
                    {availableDefences.map((defence) => (
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
                  <div className="flex items-start gap-4">
                    {getDefenseImage(selectedDefenceDef.slug) ? (
                      <img
                        src={getDefenseImage(selectedDefenceDef.slug)}
                        alt={selectedDefenceDef.name}
                        className="w-20 h-20 object-contain flex-shrink-0"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Shield className="w-20 h-20 text-red-400 opacity-50 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{selectedDefenceDef.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedDefenceDef.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h5 className="text-sm font-semibold">Cost:</h5>
                    <div className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getTelleriumImage()}
                          alt="T"
                          className="w-4 h-4 object-contain"
                          style={{ imageRendering: 'auto' }}
                        />
                        <span className="text-tellerium">Tellerium:</span>
                      </div>
                      <span className={`font-mono ${
                        planet.tellerium_balance >= (selectedDefenceDef.tellerium_cost * buildQuantity)
                          ? 'text-tellerium'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedDefenceDef.tellerium_cost * buildQuantity)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getKryptonImage()}
                          alt="K"
                          className="w-4 h-4 object-contain"
                          style={{ imageRendering: 'auto' }}
                        />
                        <span className="text-krypton">Krypton:</span>
                      </div>
                      <span className={`font-mono ${
                        planet.krypton_balance >= (selectedDefenceDef.krypton_cost * buildQuantity)
                          ? 'text-krypton'
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
            const defenseImage = getDefenseImage(dslug)

            return (
              <Card key={defence.id} className="panel-glass border-red/20">
                <div className="flex gap-6 p-6">
                  {/* Defense Image on Left */}
                  <div className="flex-shrink-0">
                    {defenseImage ? (
                      <img
                        src={defenseImage}
                        alt={name}
                        className="w-40 h-40 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Shield className="w-40 h-40 text-red-400 opacity-50" />
                    )}
                  </div>
                  
                  {/* Info and Stats on Right */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold mb-1">{name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">Quantity</span>
                        <Badge variant="outline" className="text-red-400 text-base px-3">
                          {defence.quantity}
                        </Badge>
                      </div>

                      {definition && (
                        <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                          <div className="flex justify-between text-sm items-center">
                            <span>Total Attack Power:</span>
                            <span className="text-red-400 font-semibold">
                              {(definition.attack_power ?? 0) * defence.quantity}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span>Total Defense Power:</span>
                            <span className="text-blue-400 font-semibold">
                              {(definition.defence_power ?? 0) * defence.quantity}
                            </span>
                          </div>
                          {(definition.energy_consumption ?? 0) > 0 && (
                            <div className="flex justify-between text-sm items-center">
                              <span>Energy Consumption:</span>
                              <span className="text-yellow-400 font-semibold">
                                {(definition.energy_consumption ?? 0) * defence.quantity}/tick
                              </span>
                            </div>
                          )}
                        </div>
                      )}

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
                    </div>
                  </div>
                </div>
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
                const defenseImg = getDefenseImage(defence.slug)
                
                return (
                  <div key={defence.id} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                    {defenseImg ? (
                      <img
                        src={defenseImg}
                        alt={defence.name}
                        className="w-12 h-12 object-contain flex-shrink-0"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Shield className="w-12 h-12 text-red-400 mt-0.5 flex-shrink-0 opacity-50" />
                    )}
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