import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetFacilityDefinitionsQuery, useGetPlanetFacilitiesQuery, useBuildFacilityMutation, useUpgradeFacilityMutation, useUpgradeFacilityBySlugMutation, useDestroyFacilityMutation } from '@/api/endpoints/facilitiesApi'
import { useGetBuildableItemsQuery } from '@/api/endpoints/planetsApi'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BuildingPanel } from '@/components/planet/BuildingPanel'
import { VisualItemGrid } from '@/components/planet/VisualItemGrid'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Planet, FacilityDefinition } from '@/types/api.types'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { formatResource, formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { Settings, Zap, Shield, Building, AlertCircle, CheckCircle, Plus, TrendingUp, Trash2, Loader2, Eye } from 'lucide-react'
import { FacilityPreviewDialog } from '@/components/planet/FacilityPreviewDialog'
import { useCheckPrerequisitesMutation } from '@/api/endpoints/prerequisitesApi'
import { Skeleton } from '@/components/ui/skeleton'
import { getFacilityImage } from '@/lib/facilityImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import {
  calculateNetProduction,
  previewFacilityProduction,
  previewFacilityUpkeep,
  wouldCauseNegativeNetProduction,
} from '@/lib/productionHelpers'

interface FacilitiesTabProps {
  planet: Planet
}

const buildFacilitySchema = z.object({
  facility_slug: z.string().min(1, 'Select a facility type'),
  level: z.number().min(1).max(10).optional(),
})

type BuildFacilityFormData = z.infer<typeof buildFacilitySchema>

export function FacilitiesTab({ planet }: FacilitiesTabProps) {
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [upgradeFacilityId, setUpgradeFacilityId] = useState<number | null>(null)
  const [destroyFacilityId, setDestroyFacilityId] = useState<number | null>(null)
  const [prerequisiteErrors, setPrerequisiteErrors] = useState<string[]>([])

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetFacilityDefinitionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetFacilities, isLoading: isLoadingFacilities } = useGetPlanetFacilitiesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { data: meData } = useGetMeQuery()

  // Get buildable items to see what can be built on this planet
  const { data: buildableItemsData } = useGetBuildableItemsQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })

  // Debug logging for facility definitions
  console.log('Full facility definitions response:', definitions)
  if (definitions?.facilities) {
    console.log('Facility definitions from API:', definitions.facilities)
    console.log('First facility definition:', definitions.facilities[0])
    console.log('First facility definition keys:', Object.keys(definitions.facilities[0] || {}))
  }
  
  console.log('BuildableItems data:', buildableItemsData)
  
  const [buildFacility, { isLoading: isBuilding }] = useBuildFacilityMutation()
  const [upgradeFacility, { isLoading: isUpgrading }] = useUpgradeFacilityMutation()
  const [upgradeFacilityBySlug] = useUpgradeFacilityBySlugMutation()
  const [destroyFacility, { isLoading: isDestroying }] = useDestroyFacilityMutation()
  const [checkPrerequisites, { isLoading: isCheckingPrerequisites }] = useCheckPrerequisitesMutation()

  // Get all facility definitions for prerequisite checking
  const allFacilityDefinitions = (definitions?.facilities || []) as any[]
  
  // Extract buildable facilities from buildable items data
  const buildableFacilities = useMemo(() => {
    if (!buildableItemsData?.facilities) {
      return []
    }
    
    console.log('Raw buildableItemsData.facilities:', buildableItemsData.facilities)
    console.log('Type of buildableItemsData.facilities:', typeof buildableItemsData.facilities)
    console.log('Is array?', Array.isArray(buildableItemsData.facilities))
    
    if (Array.isArray(buildableItemsData.facilities)) {
      console.log('✅ Extracted facilities as array:', buildableItemsData.facilities)
      return buildableItemsData.facilities
    } else if (typeof buildableItemsData.facilities === 'object') {
      // If it's an object, try to extract array from it
      const values = Object.values(buildableItemsData.facilities)
      console.log('Object values:', values)
      
      // Check if any value is an array
      const arrayValue = values.find(Array.isArray)
      if (arrayValue) {
        console.log('✅ Extracted facilities from nested array:', arrayValue)
        return arrayValue as any[]
      } else {
        // Try to get facilities from object keys directly
        console.log('✅ Extracted facilities from object values:', values)
        return values as any[]
      }
    }
    
    return []
  }, [buildableItemsData?.facilities])
  
  const { canBuildItem } = usePrerequisites(Number(planet.id), allFacilityDefinitions as any)

  const buildForm = useForm<BuildFacilityFormData>({
    resolver: zodResolver(buildFacilitySchema),
    defaultValues: {
      facility_slug: '',
      level: 1,
    },
  })

  // Get facility levels from planet data
  const facilities = planet.facilities || {}
  // Convert facilities object on Planet detail to list shape when endpoint not populated
  const facilitiesFromPlanetObj = !Array.isArray(facilities)
    ? Object.entries(facilities || {}).map(([slug, level], idx) => ({
        id: idx + 1,
        facility_slug: slug,
        level: Number(level as number),
        is_active: true,
      }))
    : []
  const facilitiesFromPlanetArray = Array.isArray(facilities)
    ? (facilities as any[])
    : []
  // Fallback from auth/me planets array if both endpoint and planet obj are empty
  const mePlanet = (meData?.planets || []).find((p: any) => Number(p.id) === Number(planet.id)) as any
  const meFacilitiesObj: Record<string, number> = (mePlanet?.facilities as any) || (mePlanet?.facility_levels as any) || {}
  const meFacilitiesList = Array.isArray(mePlanet?.facilities)
    ? (mePlanet?.facilities as any[])
    : Object.entries(meFacilitiesObj || {}).map(([slug, level], idx) => ({
        id: idx + 1,
        facility_slug: slug,
        level: Number(level),
        is_active: true,
      }))
  const pf: any = planetFacilities as any
  const facilitiesFromEndpoint: any[] = pf?.facilities || pf?.data?.facilities || []
  const facilitiesList = facilitiesFromEndpoint.length > 0
    ? facilitiesFromEndpoint
    : (facilitiesFromPlanetArray.length > 0
        ? facilitiesFromPlanetArray
        : (facilitiesFromPlanetObj.length > 0 ? facilitiesFromPlanetObj : meFacilitiesList))

  // Log facility IDs for debugging
  console.log('Facilities from endpoint:', facilitiesFromEndpoint)
  console.log('Final facilities list:', facilitiesList)
  console.log('Facility IDs:', facilitiesList.map((f: any) => ({ id: f.id, slug: f.facility_slug || f.slug })))

  const handleBuildFacility = async (data: BuildFacilityFormData) => {
    try {
      // Check prerequisites first
      const checkResult = await checkPrerequisites({
        type: 'facility',
        slug: data.facility_slug,
      }).unwrap()

      if (!checkResult.data?.can_build) {
        setPrerequisiteErrors(checkResult.data?.errors || [])
        toast.error('Cannot build facility: Missing prerequisites')
        return
      }

      setPrerequisiteErrors([])

      const result = await buildFacility({
        planetId: Number(planet.id),
        data: {
          facility_slug: data.facility_slug,
          level: data.level || 1,
        },
      }).unwrap()

      toast.success(`Facility queued for construction!`)
      setBuildDialogOpen(false)
      buildForm.reset()
      setPrerequisiteErrors([])
    } catch (error: any) {
      if (error?.data?.errors) {
        setPrerequisiteErrors(error.data.errors)
      }
      toast.error(error?.data?.message || 'Failed to build facility')
    }
  }

  const handleUpgradeFacility = async (facilityId: number, facilitySlug?: string) => {
    // If we have a facility ID, use the ID-based endpoint
    if (facilityId && !isNaN(facilityId) && facilityId > 0) {
      const id = Number(facilityId)
      console.log('Upgrading facility with ID:', id)
      
      try {
        setUpgradeFacilityId(id)
        await upgradeFacility(id).unwrap()
        toast.success('Facility upgraded successfully!')
        setUpgradeFacilityId(null)
        return
      } catch (error: any) {
        console.error('Upgrade facility error:', error)
        toast.error(error?.data?.message || 'Failed to upgrade facility')
        setUpgradeFacilityId(null)
        return
      }
    }
    
    // Fallback: If no ID but we have a slug, use the slug-based endpoint
    if (facilitySlug && planet.id) {
      console.log('Upgrading facility by slug:', facilitySlug, 'on planet:', planet.id)
      
      try {
        setUpgradeFacilityId(-1) // Use -1 as a marker for slug-based upgrade
        await upgradeFacilityBySlug({
          planetId: Number(planet.id),
          facilitySlug: facilitySlug,
        }).unwrap()
        toast.success('Facility upgraded successfully!')
        setUpgradeFacilityId(null)
      } catch (error: any) {
        console.error('Upgrade facility by slug error:', error)
        toast.error(error?.data?.message || 'Failed to upgrade facility')
        setUpgradeFacilityId(null)
      }
      return
    }
    
    // No valid ID or slug
    toast.error('Invalid facility ID. Please refresh the page and try again.')
    console.error('Invalid facility ID:', facilityId, 'slug:', facilitySlug)
  }

  const handleDestroyFacility = async (facilityId: number) => {
    try {
      await destroyFacility(facilityId).unwrap()
      toast.success('Facility destroyed successfully!')
      setDestroyFacilityId(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to destroy facility')
    }
  }

  const getFacilityDefinition = (slug: string) => {
    // First check buildable facilities (they already have all needed fields)
    if (buildableFacilities.length > 0) {
      const found = buildableFacilities.find(f => f.slug === slug)
      if (found) return found
    }
    // Fallback to all definitions
    return definitions?.facilities?.find(f => f.slug === slug)
  }
  
  // Determine which facilities to show in dropdown
  const availableFacilities = useMemo(() => {
    // If we have buildable facilities, use them directly (they already have all needed fields)
    if (buildableFacilities.length > 0) {
      console.log('✅ Using buildable facilities from API:', buildableFacilities.length)
      return buildableFacilities
    }
    
    // Wait for definitions to load before using fallback
    if (isLoadingDefinitions || !definitions?.facilities || allFacilityDefinitions.length === 0) {
      console.log('⏳ Waiting for facility definitions to load...')
      return []
    }
    
    // Fallback: Show all facility definitions if buildable facilities aren't available
    // Backend will validate prerequisites when building
    console.log('⚠️ Using fallback: all facility definitions')
    return allFacilityDefinitions
  }, [buildableFacilities, isLoadingDefinitions, definitions?.facilities, allFacilityDefinitions])

  const getFacilityLevel = (slug: string) => {
    const facility = facilitiesList.find(f => f.facility_slug === slug)
    return facility?.level || 0
  }

  const getProductionBonus = () => {
    const molecularLevel = getFacilityLevel('molecular_extraction')
    return molecularLevel > 0 ? 1 + (molecularLevel * 0.20) : 1
  }

  const productionBonus = getProductionBonus()
  const selectedFacilitySlug = buildForm.watch('facility_slug')
  const selectedFacilityDef = selectedFacilitySlug ? getFacilityDefinition(selectedFacilitySlug) : null

  // Calculate net production for all facilities
  const facilityDefinitionsMap = useMemo(() => {
    const map = new Map<string, FacilityDefinition>()
    definitions?.facilities?.forEach(fac => {
      map.set(fac.slug, fac)
    })
    return map
  }, [definitions?.facilities])

  const researchEffects = meData?.empire?.active_research_effects || {}
  const netProduction = useMemo(() => {
    if (facilitiesList.length === 0 || facilityDefinitionsMap.size === 0) {
      return null
    }
    return calculateNetProduction(
      facilitiesList as any[],
      facilityDefinitionsMap,
      researchEffects
    )
  }, [facilitiesList, facilityDefinitionsMap, researchEffects])

  // Helper to get era badge color
  const getEraBadgeColor = (era?: number): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (!era) return 'default'
    const colors: Record<number, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      1: 'default',
      2: 'secondary',
      3: 'outline',
      4: 'default',
      5: 'default',
    }
    return colors[era] || 'default'
  }

  // Helper to get specialization badge color
  const getSpecializationBadgeColor = (specialization?: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (!specialization || specialization === 'general') return 'default'
    const colors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      industrial: 'secondary',
      military: 'destructive',
      relic: 'outline',
    }
    return colors[specialization] || 'default'
  }

  if (isLoadingDefinitions || isLoadingFacilities) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Production Bonus */}
      {productionBonus > 1 && (
        <Card className="panel-glass border-green/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="font-semibold text-green-400">Production Bonus Active</h3>
                <p className="text-sm text-muted-foreground">
                  Molecular Extraction facilities provide a {Math.round((productionBonus - 1) * 100)}% bonus to all resource production
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Build Facility Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={() => setBuildDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Build Facility
        </Button>
      </div>

      {/* Building Panel */}
      <BuildingPanel
        isOpen={buildDialogOpen}
        onClose={() => {
          setBuildDialogOpen(false)
          buildForm.reset()
        }}
        title="Build New Facility"
        description="Select a facility type and initial level to build on this planet"
      >
        <form onSubmit={buildForm.handleSubmit(handleBuildFacility)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facility_slug">Facility Type</Label>
            <Select
              value={buildForm.watch('facility_slug')}
              onValueChange={(value) => buildForm.setValue('facility_slug', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {availableFacilities.map((facility) => (
                  <SelectItem key={facility.slug} value={facility.slug}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {buildForm.formState.errors.facility_slug && (
              <p className="text-sm text-destructive">
                {buildForm.formState.errors.facility_slug.message}
              </p>
            )}
          </div>

          {selectedFacilityDef && (
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex items-start gap-4">
                {getFacilityImage(selectedFacilityDef.slug) ? (
                  <img
                    src={getFacilityImage(selectedFacilityDef.slug)}
                    alt={selectedFacilityDef.name}
                    className="w-32 h-32 object-contain flex-shrink-0"
                    style={{ imageRendering: 'auto' }}
                  />
                ) : (
                  <Building className="w-32 h-32 text-purple-400 opacity-50 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 text-lg">{selectedFacilityDef.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedFacilityDef.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">Initial Level</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="10"
                  {...buildForm.register('level', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 1 (can be upgraded later)
                </p>
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
                    planet.tellerium_balance >= selectedFacilityDef.base_tellerium_cost
                      ? 'text-tellerium'
                      : 'text-destructive'
                  }`}>
                    {formatResource(selectedFacilityDef.base_tellerium_cost)}
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
                    planet.krypton_balance >= selectedFacilityDef.base_krypton_cost
                      ? 'text-krypton'
                      : 'text-destructive'
                  }`}>
                    {formatResource(selectedFacilityDef.base_krypton_cost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Build Time:</span>
                  <span className="text-muted-foreground">
                    {selectedFacilityDef.build_time_ticks || 0} ticks
                  </span>
                </div>
              </div>

              {/* Era and Specialization Badges */}
              <div className="flex gap-2 flex-wrap mb-2">
                {selectedFacilityDef.era && (
                  <Badge variant={getEraBadgeColor(selectedFacilityDef.era)}>
                    Era {selectedFacilityDef.era}
                  </Badge>
                )}
                {selectedFacilityDef.specialization && selectedFacilityDef.specialization !== 'general' && (
                  <Badge variant={getSpecializationBadgeColor(selectedFacilityDef.specialization)}>
                    {selectedFacilityDef.specialization.charAt(0).toUpperCase() + selectedFacilityDef.specialization.slice(1)}
                  </Badge>
                )}
              </div>

              {/* Production and Upkeep from per_tick/upkeep fields */}
              {(selectedFacilityDef.per_tick || selectedFacilityDef.upkeep) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {/* Production */}
                  {selectedFacilityDef.per_tick && Object.keys(selectedFacilityDef.per_tick).length > 0 && (
                    <>
                      <h5 className="text-sm font-semibold">Production:</h5>
                      {selectedFacilityDef.per_tick.tellerium !== undefined && (
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
                          <span className="text-tellerium">
                            +{formatNumber(selectedFacilityDef.per_tick.tellerium || 0)}/tick
                          </span>
                        </div>
                      )}
                      {selectedFacilityDef.per_tick.krypton !== undefined && (
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
                          <span className="text-krypton">
                            +{formatNumber(selectedFacilityDef.per_tick.krypton || 0)}/tick
                          </span>
                        </div>
                      )}
                      {selectedFacilityDef.per_tick.dark_matter !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span>Dark Matter:</span>
                          <span className="text-purple-400">
                            +{formatNumber(selectedFacilityDef.per_tick.dark_matter || 0)}/tick
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Upkeep */}
                  {selectedFacilityDef.upkeep && Object.keys(selectedFacilityDef.upkeep).length > 0 && (
                    <>
                      <h5 className="text-sm font-semibold text-yellow-400 mt-2">Upkeep:</h5>
                      {selectedFacilityDef.upkeep.tellerium !== undefined && selectedFacilityDef.upkeep.tellerium > 0 && (
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
                          <span className="text-yellow-400">
                            -{formatNumber(selectedFacilityDef.upkeep.tellerium || 0)}/tick
                          </span>
                        </div>
                      )}
                      {selectedFacilityDef.upkeep.krypton !== undefined && selectedFacilityDef.upkeep.krypton > 0 && (
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
                          <span className="text-yellow-400">
                            -{formatNumber(selectedFacilityDef.upkeep.krypton || 0)}/tick
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Fallback to old production fields */}
              {!selectedFacilityDef.per_tick && (selectedFacilityDef.production_tellerium || selectedFacilityDef.production_krypton || selectedFacilityDef.energy_consumption) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h5 className="text-sm font-semibold">Production:</h5>
                  {selectedFacilityDef.production_tellerium && (
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
                      <span className="text-tellerium">
                        +{formatNumber(selectedFacilityDef.production_tellerium)}/tick
                      </span>
                    </div>
                  )}
                  {selectedFacilityDef.production_krypton && (
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
                      <span className="text-krypton">
                        +{formatNumber(selectedFacilityDef.production_krypton)}/tick
                      </span>
                    </div>
                  )}
                  {selectedFacilityDef.energy_consumption && (
                    <div className="flex justify-between text-sm">
                      <span>Energy Consumption:</span>
                      <span className="text-yellow-400">
                        {selectedFacilityDef.energy_consumption}/tick
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Prerequisite Errors */}
              {prerequisiteErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      Missing Prerequisites:
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-destructive ml-4">
                    {prerequisiteErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((planet.tellerium_balance < selectedFacilityDef.base_tellerium_cost) ||
                (planet.krypton_balance < selectedFacilityDef.base_krypton_cost)) && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    Insufficient resources
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Preview Button */}
          {selectedFacilityDef && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewDialogOpen(true)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Production & Upkeep
              </Button>
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
                isCheckingPrerequisites ||
                !selectedFacilityDef ||
                planet.tellerium_balance < (selectedFacilityDef?.base_tellerium_cost || 0) ||
                planet.krypton_balance < (selectedFacilityDef?.base_krypton_cost || 0) ||
                prerequisiteErrors.length > 0
              }
              className="flex-1"
            >
              {isBuilding || isCheckingPrerequisites ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isCheckingPrerequisites ? 'Checking...' : 'Building...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Build Facility
                </>
              )}
            </Button>
          </div>
        </form>
      </BuildingPanel>

      {/* Facilities Grid */}
      {facilitiesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facilitiesList.map((facility) => {
            const slug = (facility as any)?.facility_slug || (facility as any)?.slug || ''
            const definition = slug ? getFacilityDefinition(slug) : undefined
            const name = definition?.name || (slug ? slug.replace(/_/g, ' ') : 'Facility')
            const description = definition?.description || 'Built facility'
            const productionT = definition?.production_tellerium || 0
            const productionK = definition?.production_krypton || 0
            const energyUse = definition?.energy_consumption || 0
            const canAffordUpgrade = true
            
            const facilityImage = getFacilityImage(slug)

            return (
              <Card key={`${(facility as any)?.id || slug}-${slug}`} className="panel-glass border-purple/20">
                <div className="flex gap-6 p-6">
                  {/* Facility Image on Left */}
                  <div className="flex-shrink-0">
                    {facilityImage ? (
                      <img
                        src={facilityImage}
                        alt={name}
                        className="w-40 h-40 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Building className="w-40 h-40 text-purple-400 opacity-50" />
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
                        <span className="text-sm font-medium">Level</span>
                        <Badge variant="outline" className="text-purple-400 text-base px-3">
                          {facility.level}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <span className="text-sm font-medium">Status</span>
                        <Badge variant={(facility as any)?.is_active ? 'default' : 'outline'}>
                          {(facility as any)?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Era and Specialization Badges */}
                      <div className="flex gap-2 flex-wrap">
                        {definition?.era && (
                          <Badge variant={getEraBadgeColor(definition.era)}>
                            Era {definition.era}
                          </Badge>
                        )}
                        {definition?.specialization && definition.specialization !== 'general' && (
                          <Badge variant={getSpecializationBadgeColor(definition.specialization)}>
                            {definition.specialization.charAt(0).toUpperCase() + definition.specialization.slice(1)}
                          </Badge>
                        )}
                      </div>

                      {/* Production and Upkeep from per_tick/upkeep fields */}
                      {(definition?.per_tick || definition?.upkeep) && (
                        <div className="p-3 bg-muted/20 rounded-lg space-y-3">
                          {/* Production */}
                          {definition.per_tick && Object.keys(definition.per_tick).length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Production</p>
                              <div className="space-y-2 text-sm">
                                {definition.per_tick.tellerium !== undefined && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getTelleriumImage()}
                                        alt="T"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-tellerium">Tellerium:</span>
                                    </div>
                                    <span className="text-tellerium font-semibold">
                                      +{formatNumber((definition.per_tick.tellerium || 0) * facility.level)}/tick
                                    </span>
                                  </div>
                                )}
                                {definition.per_tick.krypton !== undefined && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getKryptonImage()}
                                        alt="K"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-krypton">Krypton:</span>
                                    </div>
                                    <span className="text-krypton font-semibold">
                                      +{formatNumber((definition.per_tick.krypton || 0) * facility.level)}/tick
                                    </span>
                                  </div>
                                )}
                                {definition.per_tick.dark_matter !== undefined && (
                                  <div className="flex justify-between items-center">
                                    <span>Dark Matter:</span>
                                    <span className="text-purple-400 font-semibold">
                                      +{formatNumber((definition.per_tick.dark_matter || 0) * facility.level)}/tick
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Upkeep */}
                          {definition.upkeep && Object.keys(definition.upkeep).length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-sm font-medium mb-2 text-yellow-400">Upkeep</p>
                              <div className="space-y-2 text-sm">
                                {definition.upkeep.tellerium !== undefined && definition.upkeep.tellerium > 0 && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getTelleriumImage()}
                                        alt="T"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-tellerium">Tellerium:</span>
                                    </div>
                                    <span className="text-yellow-400 font-semibold">
                                      -{formatNumber((definition.upkeep.tellerium || 0) * facility.level)}/tick
                                    </span>
                                  </div>
                                )}
                                {definition.upkeep.krypton !== undefined && definition.upkeep.krypton > 0 && (
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={getKryptonImage()}
                                        alt="K"
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'auto' }}
                                      />
                                      <span className="text-krypton">Krypton:</span>
                                    </div>
                                    <span className="text-yellow-400 font-semibold">
                                      -{formatNumber((definition.upkeep.krypton || 0) * facility.level)}/tick
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback to old production fields if per_tick not available */}
                      {!definition?.per_tick && (productionT > 0 || productionK > 0) && (
                        <div className="p-3 bg-muted/20 rounded-lg">
                          <p className="text-sm font-medium mb-2">Production</p>
                          <div className="space-y-2 text-sm">
                            {productionT > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={getTelleriumImage()}
                                    alt="T"
                                    className="w-4 h-4 object-contain"
                                    style={{ imageRendering: 'auto' }}
                                  />
                                  <span className="text-tellerium">Tellerium:</span>
                                </div>
                                <span className="text-tellerium font-semibold">
                                  +{formatNumber(productionT * facility.level)}/tick
                                  {productionBonus > 1 && (
                                    <span className="text-green-400 ml-2">
                                      (+{Math.round((productionBonus - 1) * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {productionK > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={getKryptonImage()}
                                    alt="K"
                                    className="w-4 h-4 object-contain"
                                    style={{ imageRendering: 'auto' }}
                                  />
                                  <span className="text-krypton">Krypton:</span>
                                </div>
                                <span className="text-krypton font-semibold">
                                  +{formatNumber(productionK * facility.level)}/tick
                                  {productionBonus > 1 && (
                                    <span className="text-green-400 ml-2">
                                      (+{Math.round((productionBonus - 1) * 100)}%)
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Warning if upkeep would cause negative net production */}
                      {definition?.upkeep && netProduction && (facility as any)?.is_active && (
                        (() => {
                          const facilityUpkeep = previewFacilityUpkeep(definition, facility.level, researchEffects)
                          const facilityProduction = previewFacilityProduction(definition, facility.level, researchEffects)
                          const wouldCauseNegative = wouldCauseNegativeNetProduction(
                            netProduction,
                            facilityProduction,
                            facilityUpkeep
                          )
                          return wouldCauseNegative ? (
                            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <span className="text-xs text-destructive">
                                Upkeep may exceed production
                              </span>
                            </div>
                          ) : null
                        })()
                      )}

                      {energyUse > 0 && (
                        <div className="p-3 bg-yellow/10 rounded-lg">
                          <p className="text-sm font-medium text-yellow-400 mb-1">
                            Energy Consumption
                          </p>
                          <p className="text-sm font-semibold">
                            {formatNumber(energyUse * facility.level)} energy/tick
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const facilityId = (facility as any)?.id
                        const facilitySlug = slug || (facility as any)?.facility_slug || (facility as any)?.slug
                        handleUpgradeFacility(facilityId || 0, facilitySlug)
                      }}
                      disabled={isUpgrading || upgradeFacilityId === (facility as any)?.id || upgradeFacilityId === -1 || !canAffordUpgrade}
                    >
                      {isUpgrading && upgradeFacilityId === (facility as any)?.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Upgrade
                        </>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setDestroyFacilityId(facility.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Destroy
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="panel-glass border-destructive/20">
                        <DialogHeader>
                          <DialogTitle>Destroy Facility</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to destroy this facility? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDestroyFacilityId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDestroyFacility(facility.id)}
                            disabled={isDestroying}
                          >
                            {isDestroying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Destroying...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Destroy Facility
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Facilities Built</h3>
            <p className="text-muted-foreground mb-4">
              This planet doesn't have any facilities yet. Build facilities to enhance production and capabilities.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Facilities */}
      {definitions && definitions.facilities && definitions.facilities.length > 0 && (
        <Card className="panel-glass border-purple/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Available Facility Types
            </CardTitle>
            <CardDescription>
              All facility types you can build on planets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {definitions.facilities.filter(facility => canBuildItem(facility.slug)).map((facility) => {
                const currentLevel = getFacilityLevel(facility.slug)
                const facilityImg = getFacilityImage(facility.slug)
                return (
                  <div key={facility.id} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                    {facilityImg ? (
                      <img
                        src={facilityImg}
                        alt={facility.name}
                        className="w-12 h-12 object-contain flex-shrink-0"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <Building className="w-12 h-12 text-purple-400 mt-0.5 flex-shrink-0 opacity-50" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{facility.name}</h4>
                        {currentLevel > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Level {currentLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {facility.description}
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>
                            {formatResource((facility as any).tellerium_cost ?? (facility as any).base_tellerium_cost ?? 0)} T, {formatResource((facility as any).krypton_cost ?? (facility as any).base_krypton_cost ?? 0)} K
                          </span>
                        </div>
                        {((facility.production_tellerium ?? 0) > 0 || (facility.production_krypton ?? 0) > 0) && (
                          <div className="flex justify-between">
                            <span>Production:</span>
                            <span>
                              {(facility.production_tellerium ?? 0) > 0 && `+${facility.production_tellerium} T/tick`}
                              {(facility.production_tellerium ?? 0) > 0 && (facility.production_krypton ?? 0) > 0 && ', '}
                              {(facility.production_krypton ?? 0) > 0 && `+${facility.production_krypton} K/tick`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facility Preview Dialog */}
      <FacilityPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        planetId={Number(planet.id)}
        facility={selectedFacilityDef}
      />
    </div>
  )
}
