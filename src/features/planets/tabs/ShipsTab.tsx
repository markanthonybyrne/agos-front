import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetShipDefinitionsQuery, useGetPlanetShipsQuery, useBuildShipsMutation } from '@/api/endpoints/shipsApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BuildingPanel } from '@/components/planet/BuildingPanel'
import { Planet } from '@/types/api.types'
import { formatResource } from '@/lib/formatters'
import { toast } from 'sonner'
import { Ship, Zap, Shield, Target, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getShipImage } from '@/lib/shipImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

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

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetShipDefinitionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetShips, isLoading: isLoadingShips } = useGetPlanetShipsQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const [buildShips, { isLoading: isBuilding }] = useBuildShipsMutation()

  // Debug logging for ship definitions
  console.log('Full definitions response:', definitions)
  if (definitions?.ships) {
    console.log('Ship definitions from API:', definitions.ships)
    console.log('First ship definition:', definitions.ships[0])
    console.log('First ship definition keys:', Object.keys(definitions.ships[0] || {}))
  }

  // Get buildable items to check what ships can be built on this planet
  const { data: buildableItemsData } = useGetBuildableItemsQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  
  // Get all ship definitions
  const allShipDefinitions = definitions?.ships || []
  
  // Extract buildable ships from buildable items data - memoized to prevent recalculation
  const buildableShips = useMemo(() => {
    if (!buildableItemsData?.ships) {
      return []
    }
    
    console.log('Raw buildableItemsData.ships:', buildableItemsData.ships)
    console.log('Type of buildableItemsData.ships:', typeof buildableItemsData.ships)
    console.log('Is array?', Array.isArray(buildableItemsData.ships))
    
    if (Array.isArray(buildableItemsData.ships)) {
      console.log('✅ Extracted ships as array:', buildableItemsData.ships)
      return buildableItemsData.ships
    } else if (typeof buildableItemsData.ships === 'object') {
      // If it's an object, try to extract array from it
      const values = Object.values(buildableItemsData.ships)
      console.log('Object values:', values)
      
      // Check if any value is an array
      const arrayValue = values.find(Array.isArray)
      if (arrayValue) {
        console.log('✅ Extracted ships from nested array:', arrayValue)
        return arrayValue as any[]
      } else {
        // Try to get ships from object keys directly
        console.log('✅ Extracted ships from object values:', values)
        return values as any[]
      }
    }
    
    return []
  }, [buildableItemsData?.ships])
  
  // For prerequisite checking, we need to combine all buildable items (facilities, defences, ships, research)
  const facilitiesArray = Array.isArray(buildableItemsData?.facilities) 
    ? buildableItemsData.facilities 
    : (buildableItemsData?.facilities ? Object.values(buildableItemsData.facilities) : [])
  
  const defencesArray = Array.isArray(buildableItemsData?.defences)
    ? buildableItemsData.defences
    : (buildableItemsData?.defences ? Object.values(buildableItemsData.defences) : [])
  
  const researchArray = Array.isArray(buildableItemsData?.research)
    ? buildableItemsData.research
    : (buildableItemsData?.research ? Object.values(buildableItemsData.research) : [])
  
  const allBuildableItems = buildableItemsData
    ? [
        ...facilitiesArray,
        ...defencesArray,
        ...buildableShips,
        ...researchArray,
      ]
    : allShipDefinitions
  
  const { canBuildItem } = usePrerequisites(Number(planet.id), allBuildableItems as unknown as any[])
  
  // Debug logging
  console.log('Buildable items data:', buildableItemsData)
  console.log('Buildable ships extracted:', buildableShips)
  console.log('Buildable ships length:', buildableShips.length)
  console.log('Buildable ships content:', buildableShips)
  console.log('All ship definitions:', allShipDefinitions)
  console.log('All ship definitions length:', allShipDefinitions.length)
  
  // Determine which ships to show in dropdown using useMemo to prevent recalculation issues
  // Priority: 1) Buildable ships from API (already filtered by backend), 2) All definitions as fallback
  const availableShips = useMemo(() => {
    // If we have buildable ships, use them directly (they already have all needed fields)
    if (buildableShips.length > 0) {
      console.log('✅ Using buildable ships from API:', buildableShips.length)
      console.log('Buildable ships details:', buildableShips.map(bs => ({ 
        slug: bs.slug, 
        name: bs.name, 
        class: bs.class,
        hasSlug: !!bs.slug,
        hasName: !!bs.name 
      })))
      // Buildable ships already have all fields needed (slug, name, class, etc.)
      // No need to merge with definitions, they're already complete
      return buildableShips
    }
    
    // Wait for definitions to load before using fallback
    if (isLoadingDefinitions || !definitions?.ships || allShipDefinitions.length === 0) {
      console.log('⏳ Waiting for ship definitions to load...')
      return []
    }
    
    // Fallback: Show all ship definitions if buildable ships aren't available
    // Backend will validate prerequisites when building
    console.log('✅ Using all ship definitions (buildable ships not available or not extracted):', allShipDefinitions.length)
    console.log('Available ships:', allShipDefinitions.map(s => s.name || s.slug))
    return allShipDefinitions
  }, [isLoadingDefinitions, definitions?.ships, allShipDefinitions, buildableShips])
  
  console.log('🎯 FINAL Available ships for dropdown:', availableShips.length)
  if (availableShips.length > 0) {
    console.log('🎯 Ship details:', availableShips.map(s => ({ 
      slug: s.slug, 
      name: s.name, 
      class: s.class,
      hasSlug: !!s.slug,
      hasName: !!s.name
    })))
  } else {
    console.log('⚠️ No ships available!')
    console.log('  - isLoadingDefinitions:', isLoadingDefinitions)
    console.log('  - definitions?.ships:', definitions?.ships)
    console.log('  - allShipDefinitions.length:', allShipDefinitions.length)
    console.log('  - buildableShips.length:', buildableShips.length)
    console.log('  - buildableItemsData:', buildableItemsData)
  }

  const buildForm = useForm<BuildShipFormData>({
    resolver: zodResolver(buildShipSchema),
    defaultValues: {
      ship_slug: '',
      quantity: 1,
    },
  })

  // Get ships from the API endpoint
  const ps: any = planetShips as any
  const shipsFromResponse: any[] = ps?.ships || ps?.data?.ships || []
  
  // Debug logging
  console.log('Planet ships response:', planetShips)
  console.log('Ships from response:', shipsFromResponse)
  console.log('Ships list length:', shipsFromResponse.length)
  
  // Ships come from API with structure: { definition_id, quantity, definition: { name, class, attack_power } }
  const shipsList: Array<{ definition_id: number; quantity: number; definition?: any }> = shipsFromResponse

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
      
      // Check if build_time_ticks exists and is valid - backend needs this
      if (!shipDef.build_time_ticks || shipDef.build_time_ticks <= 0) {
        toast.error(`Ship definition missing build_time_ticks. Cannot build ${shipDef.name}. Please contact support.`)
        console.error('Ship definition missing build_time_ticks:', shipDef)
        return
      }
      
      const result = await buildShips({
        planetId: Number(planet.id),
        data: {
          ship_slug: data.ship_slug,
          quantity: data.quantity,
        },
      }).unwrap()

      console.log('Build ships result:', result)
      toast.success(`Queued ${data.quantity} ${shipDef.name} for construction!`)
      setBuildDialogOpen(false)
      buildForm.reset()
    } catch (error: any) {
      console.error('Build ships error:', error)
      toast.error(error?.data?.message || 'Failed to build ships')
    }
  }

  const getShipDefinition = (slug: string) => {
    // First check buildable ships (they have all the fields we need)
    const buildableShip = buildableShips.find(s => s.slug === slug)
    if (buildableShip) {
      return buildableShip
    }
    // Fallback to definitions
    return definitions?.ships?.find(s => s.slug === slug)
  }

  const getTotalShips = () => {
    return shipsList.reduce((total, ship) => total + ship.quantity, 0)
  }

  const getTotalGunPower = () => {
    return shipsList.reduce((total, ship) => {
      const defFromResponse = ship.definition || {}
      const defFromDefs = definitions?.ships?.find(s => s.id === ship.definition_id)
      const def = defFromDefs || defFromResponse
      const attackPower = def?.attack_power || def?.gun_power || defFromResponse?.attack_power || 0
      return total + (attackPower * ship.quantity)
    }, 0)
  }

  const getTotalArmour = () => {
    return shipsList.reduce((total, ship) => {
      const defFromResponse = ship.definition || {}
      const defFromDefs = definitions?.ships?.find(s => s.id === ship.definition_id)
      const def = defFromDefs || defFromResponse
      const defensePower = def?.defence_power || def?.armour || def?.armor || 0
      return total + (defensePower * ship.quantity)
    }, 0)
  }

  const getTotalInitiative = () => {
    return shipsList.reduce((total, ship) => {
      const defFromResponse = ship.definition || {}
      const defFromDefs = definitions?.ships?.find(s => s.id === ship.definition_id)
      const def = defFromDefs || defFromResponse
      return total + ((def?.init || 0) * ship.quantity)
    }, 0)
  }

  const selectedShipSlug = buildForm.watch('ship_slug')
  const selectedShipDef = selectedShipSlug ? getShipDefinition(selectedShipSlug) : null
  const buildQuantity = buildForm.watch('quantity') || 1

  const isLoadingBuildable = !buildableItemsData && buildableItemsData !== undefined // Still loading

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
      <div className="flex justify-end mb-6">
        <Button onClick={() => setBuildDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Build Ships
        </Button>
      </div>

      {/* Building Panel */}
      <BuildingPanel
        isOpen={buildDialogOpen}
        onClose={() => {
          setBuildDialogOpen(false)
          buildForm.reset()
        }}
        title="Build Ships"
        description="Select a ship type and quantity to build on this planet"
      >
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
                    {availableShips.length > 0 ? (
                      availableShips.map((ship) => {
                        const shipSlug = ship.slug || ship.id
                        const shipName = ship.name || shipSlug
                        const shipClass = ship.class || ''
                        console.log('Rendering ship in dropdown:', { slug: shipSlug, name: shipName, class: shipClass })
                        return (
                          <SelectItem key={shipSlug} value={shipSlug}>
                            {shipName} {shipClass ? `(${shipClass})` : ''}
                          </SelectItem>
                        )
                      })
                    ) : (
                      <SelectItem value="" disabled>
                        {isLoadingDefinitions ? 'Loading ships...' : 'No ships available - check prerequisites'}
                      </SelectItem>
                    )}
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
                  <div className="flex items-start gap-4">
                    {getShipImage(selectedShipDef.slug) ? (
                      <img
                        src={getShipImage(selectedShipDef.slug)}
                        alt={selectedShipDef.name}
                        className="w-32 h-32 object-contain flex-shrink-0"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Ship className="w-32 h-32 text-blue-400 opacity-50 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2 text-lg">{selectedShipDef.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedShipDef.description}
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
                  planet.tellerium_balance >= (selectedShipDef.tellerium_cost * buildQuantity)
                    ? 'text-tellerium'
                    : 'text-destructive'
                }`}>
                  {formatResource(selectedShipDef.tellerium_cost * buildQuantity)}
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
                      <span                     className={`font-mono ${
                      planet.krypton_balance >= (selectedShipDef.krypton_cost * buildQuantity)
                        ? 'text-krypton'
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

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBuildDialogOpen(false)
                buildForm.reset()
              }}
              className="flex-1"
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
              className="flex-1"
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
          </div>
        </form>
      </BuildingPanel>

      {/* Ship List */}
      {shipsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shipsList.map((ship) => {
            // Use definition from API response if available, otherwise look up from definitions
            const defFromResponse = ship.definition || {}
            const defFromDefs = definitions?.ships?.find(s => s.id === ship.definition_id)
            const def = defFromDefs || defFromResponse || {}
            
            // Prefer name from definition, then from response, then fallback
            const displayName = def.name || defFromResponse.name || `Ship #${ship.definition_id}`
            const displayClass = def.class || defFromResponse.class || '—'
            const attackPower = def.attack_power || def.gun_power || defFromResponse.attack_power || 0
            const defensePower = def.defence_power || def.armour || def.armor || 0

            const shipSlug = def.slug || defFromResponse.slug
            const shipImage = shipSlug ? getShipImage(shipSlug) : null

            return (
              <Card key={ship.definition_id} className="panel-glass border-blue/20">
                <div className="flex gap-6 p-6">
                  {/* Ship Image on Left */}
                  <div className="flex-shrink-0">
                    {shipImage ? (
                      <img
                        src={shipImage}
                        alt={displayName}
                        className="w-40 h-40 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Ship className="w-40 h-40 text-blue-400 opacity-50" />
                    )}
                  </div>
                  
                  {/* Info and Stats on Right */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold mb-1">{displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {displayClass}{def.description || defFromResponse.description ? ` • ${def.description || defFromResponse.description}` : ''}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">Quantity</span>
                        <Badge variant="outline" className="text-blue-400 text-base px-3">
                          {ship.quantity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                          <span>Attack Power:</span>
                          <span className="text-red-400 font-semibold">
                            {attackPower} per ship <span className="text-muted-foreground">({attackPower * ship.quantity} total)</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                          <span>Defense Power:</span>
                          <span className="text-blue-400 font-semibold">
                            {defensePower} per ship <span className="text-muted-foreground">({defensePower * ship.quantity} total)</span>
                          </span>
                        </div>
                        {(def.speed || 0) > 0 && (
                          <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                            <span>Speed:</span>
                            <span className="text-green-400 font-semibold">
                              {def.speed || 0}
                            </span>
                          </div>
                        )}
                        {(def.cargo_capacity || 0) > 0 && (
                          <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                            <span>Cargo Capacity:</span>
                            <span className="text-yellow-400 font-semibold">
                              {(def.cargo_capacity || 0)} per ship <span className="text-muted-foreground">({(def.cargo_capacity || 0) * ship.quantity} total)</span>
                            </span>
                          </div>
                        )}
                        {(def.energy_consumption || 0) > 0 && (
                          <div className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                            <span>Energy Consumption:</span>
                            <span className="text-purple-400 font-semibold">
                              {(def.energy_consumption || 0) * ship.quantity}/tick
                            </span>
                          </div>
                        )}
                      </div>
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
                
                const shipImage = ship.slug ? getShipImage(ship.slug) : null
                
                return (
                  <div key={ship.id} className="flex items-start gap-4 p-4 bg-muted/10 rounded-lg">
                    {shipImage ? (
                      <img
                        src={shipImage}
                        alt={ship.name}
                        className="w-20 h-20 object-contain flex-shrink-0"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Ship className="w-20 h-20 text-blue-400 flex-shrink-0 opacity-50" />
                    )}
                    <div className="flex-1 min-w-0">
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
