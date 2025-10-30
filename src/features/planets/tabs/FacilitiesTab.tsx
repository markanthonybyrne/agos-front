import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useGetFacilityDefinitionsQuery, useGetPlanetFacilitiesQuery, useBuildFacilityMutation, useUpgradeFacilityMutation, useDestroyFacilityMutation } from '@/api/endpoints/facilitiesApi'
import { usePrerequisites } from '@/hooks/usePrerequisites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Planet } from '@/types/api.types'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { formatResource, formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { Settings, Zap, Shield, Building, AlertCircle, CheckCircle, Plus, TrendingUp, Trash2, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

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
  const [upgradeFacilityId, setUpgradeFacilityId] = useState<number | null>(null)
  const [destroyFacilityId, setDestroyFacilityId] = useState<number | null>(null)

  const { data: definitions, isLoading: isLoadingDefinitions } = useGetFacilityDefinitionsQuery()
  const { data: planetFacilities, isLoading: isLoadingFacilities } = useGetPlanetFacilitiesQuery(Number(planet.id))
  const { data: meData } = useGetMeQuery()

  // Debug logging for facility definitions
  console.log('Full facility definitions response:', definitions)
  if (definitions?.facilities) {
    console.log('Facility definitions from API:', definitions.facilities)
    console.log('First facility definition:', definitions.facilities[0])
    console.log('First facility definition keys:', Object.keys(definitions.facilities[0] || {}))
  }
  const [buildFacility, { isLoading: isBuilding }] = useBuildFacilityMutation()
  const [upgradeFacility, { isLoading: isUpgrading }] = useUpgradeFacilityMutation()
  const [destroyFacility, { isLoading: isDestroying }] = useDestroyFacilityMutation()

  // Get all facility definitions for prerequisite checking
  const allFacilityDefinitions = (definitions?.facilities || []) as any[]
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

  const handleBuildFacility = async (data: BuildFacilityFormData) => {
    try {
      const result = await buildFacility({
        planetId: Number(planet.id),
        data: {
          facility_slug: data.facility_slug,
          level: data.level || 1,
        },
      }).unwrap()

      toast.success(`Facility built successfully!`)
      setBuildDialogOpen(false)
      buildForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to build facility')
    }
  }

  const handleUpgradeFacility = async (facilityId: number) => {
    try {
      await upgradeFacility(facilityId).unwrap()
      toast.success('Facility upgraded successfully!')
      setUpgradeFacilityId(null)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upgrade facility')
    }
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
    return definitions?.facilities?.find(f => f.slug === slug)
  }

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
      <div className="flex justify-end">
        <Dialog open={buildDialogOpen} onOpenChange={setBuildDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Build Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="panel-glass border-cyan/20">
            <DialogHeader>
              <DialogTitle>Build New Facility</DialogTitle>
              <DialogDescription>
                Select a facility type and initial level to build on this planet
              </DialogDescription>
            </DialogHeader>
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
                    {definitions?.facilities?.filter(facility => canBuildItem(facility.slug)).map((facility) => (
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
                  <div>
                    <h4 className="font-semibold mb-2">{selectedFacilityDef.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedFacilityDef.description}
                    </p>
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
                    <div className="flex justify-between text-sm">
                      <span>Tellerium:</span>
                      <span className={`font-mono ${
                        planet.tellerium_balance >= selectedFacilityDef.base_tellerium_cost
                          ? 'text-cyan-400'
                          : 'text-destructive'
                      }`}>
                        {formatResource(selectedFacilityDef.base_tellerium_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Krypton:</span>
                      <span className={`font-mono ${
                        planet.krypton_balance >= selectedFacilityDef.base_krypton_cost
                          ? 'text-blue-400'
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

                  {(selectedFacilityDef.production_tellerium || selectedFacilityDef.production_krypton || selectedFacilityDef.energy_consumption) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h5 className="text-sm font-semibold">Production:</h5>
                      {selectedFacilityDef.production_tellerium && (
                        <div className="flex justify-between text-sm">
                          <span>Tellerium:</span>
                          <span className="text-cyan-400">
                            +{formatNumber(selectedFacilityDef.production_tellerium)}/tick
                          </span>
                        </div>
                      )}
                      {selectedFacilityDef.production_krypton && (
                        <div className="flex justify-between text-sm">
                          <span>Krypton:</span>
                          <span className="text-blue-400">
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
                    !selectedFacilityDef ||
                    planet.tellerium_balance < (selectedFacilityDef?.base_tellerium_cost || 0) ||
                    planet.krypton_balance < (selectedFacilityDef?.base_krypton_cost || 0)
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
                      Build Facility
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

            return (
              <Card key={`${(facility as any)?.id || slug}-${slug}`} className="panel-glass border-purple/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-400" />
                    {name}
                  </CardTitle>
                  <CardDescription>
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <Badge variant="outline" className="text-purple-400">
                      {facility.level}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={(facility as any)?.is_active ? 'default' : 'outline'}>
                      {(facility as any)?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {(productionT > 0 || productionK > 0) && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-sm font-medium mb-1">Production</p>
                      <div className="space-y-1 text-sm">
                        {productionT > 0 && (
                          <div className="flex justify-between">
                            <span>Tellerium:</span>
                            <span className="text-cyan-400">
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
                          <div className="flex justify-between">
                            <span>Krypton:</span>
                            <span className="text-blue-400">
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

                  {energyUse > 0 && (
                    <div className="p-3 bg-yellow/10 rounded-lg">
                      <p className="text-sm font-medium text-yellow-400 mb-1">
                        Energy Consumption
                      </p>
                      <p className="text-sm">
                        {formatNumber(energyUse * facility.level)} energy/tick
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUpgradeFacility(facility.id)}
                      disabled={isUpgrading || upgradeFacilityId === facility.id || !canAffordUpgrade}
                    >
                      {isUpgrading && upgradeFacilityId === facility.id ? (
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
                </CardContent>
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
                return (
                  <div key={facility.id} className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                    <Building className="w-5 h-5 text-purple-400 mt-0.5" />
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
    </div>
  )
}
