import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useBuyMinesMutation, useBuyProbesMutation } from '@/api/endpoints/planetsApi'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetPlanetResourcesQuery } from '@/api/endpoints/resourcesApi'
import { useGetDarkMatterInfoQuery } from '@/api/endpoints/empiresApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Planet } from '@/types/api.types'
import { formatResource, formatNumber } from '@/lib/formatters'
import { Zap, Settings, AlertCircle, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Layers, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { DarkMatterDisplay } from '@/components/resources/DarkMatterDisplay'
import {
  calculateNetProduction,
  previewFacilityProduction,
  previewFacilityUpkeep,
} from '@/lib/productionHelpers'
import { useGetFacilityDefinitionsQuery } from '@/api/endpoints/facilitiesApi'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import { cn } from '@/lib/utils'

const mineSchema = z.object({
  quantity: z.number().min(1, 'Must buy at least 1 mine').max(100, 'Cannot buy more than 100 mines at once'),
})

const probeSchema = z.object({
  quantity: z.number().min(1, 'Must buy at least 1 probe').max(50, 'Cannot buy more than 50 probes at once'),
})

type MineFormData = z.infer<typeof mineSchema>
type ProbeFormData = z.infer<typeof probeSchema>

interface ResourcesTabProps {
  planet: Planet
}

export function ResourcesTab({ planet }: ResourcesTabProps) {
  const [buyMines, { isLoading: isBuyingMines }] = useBuyMinesMutation()
  const [buyProbes, { isLoading: isBuyingProbes }] = useBuyProbesMutation()
  const [showOreVeins, setShowOreVeins] = useState(true)

  const { data: facilitiesData } = useGetPlanetFacilitiesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { data: resourcesData } = useGetPlanetResourcesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { data: darkMatterInfo } = useGetDarkMatterInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: meData } = useGetMeQuery()
  const { data: facilityDefinitions } = useGetFacilityDefinitionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { ledger, getMetadata } = useResourcesCatalog({ reserves: planet.secondary_reserves })
  const { openPanel } = usePanel()
  const secondaryReserves = planet.secondary_reserves || []

  const ledgerMap = useMemo(() => {
    const map = new Map<string, typeof ledger[number]>()
    ledger.forEach((entry) => {
      map.set(entry.slug, entry)
    })
    return map
  }, [ledger])

  const oreVeins = useMemo(() => {
    return secondaryReserves.map((reserve) => {
      const metadata = getMetadata(reserve.slug)
      const ledgerEntry = ledgerMap.get(reserve.slug)
      const initial = reserve.initial ?? (reserve.remaining > 0 ? reserve.remaining : 0)
      const remaining = reserve.remaining ?? 0
      const remainingPercent = initial > 0 ? Math.max(0, Math.round((remaining / initial) * 100)) : 0
      const richnessMultiplier = reserve.richness ?? 1
      const richnessPercent = Math.round((richnessMultiplier - 1) * 100)
      const isDepleted = Boolean(reserve.depleted_at) || remainingPercent <= 0
      const capacityCapped =
        ledgerEntry?.capacity && ledgerEntry.capacity > 0
          ? ledgerEntry.quantity >= ledgerEntry.capacity
          : false
      return {
        reserve,
        metadata,
        ledgerEntry,
        remaining,
        initial,
        remainingPercent,
        richnessPercent,
        isDepleted,
        capacityCapped,
      }
    })
  }, [secondaryReserves, ledgerMap, getMetadata])

  // Calculate production/upkeep from facilities
  const facilitiesList = useMemo(() => {
    const pf: any = facilitiesData
    return pf?.facilities || pf?.data?.facilities || []
  }, [facilitiesData])

  const facilityDefinitionsMap = useMemo(() => {
    const map = new Map<string, any>()
    facilityDefinitions?.facilities?.forEach(fac => {
      map.set(fac.slug, fac)
    })
    return map
  }, [facilityDefinitions?.facilities])

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

  // Check for facility deactivation warnings
  const hasDeactivationWarning = useMemo(() => {
    if (!netProduction) return false
    return (
      netProduction.net.tellerium < 0 ||
      netProduction.net.krypton < 0
    )
  }, [netProduction])

  const mineForm = useForm<MineFormData>({
    resolver: zodResolver(mineSchema),
    defaultValues: { quantity: 1 },
  })

  const probeForm = useForm<ProbeFormData>({
    resolver: zodResolver(probeSchema),
    defaultValues: { quantity: 1 },
  })

  const calculateMineCost = (quantity: number) => {
    const baseCost = 25000
    const currentMines = planet.mines
    let totalCost = 0
    
    for (let i = 0; i < quantity; i++) {
      const mineNumber = currentMines + i + 1
      totalCost += baseCost * mineNumber
    }
    
    return {
      tellerium: totalCost,
      krypton: Math.floor(totalCost / 2),
    }
  }

  const calculateProbeCost = (quantity: number) => {
    const baseCost = 15000
    const currentProbes = planet.probes
    let totalCost = 0
    
    for (let i = 0; i < quantity; i++) {
      const probeNumber = currentProbes + i + 1
      totalCost += baseCost * probeNumber
    }
    
    return {
      tellerium: totalCost,
      krypton: Math.floor(totalCost * 1.5),
    }
  }

  const onBuyMines = async (data: MineFormData) => {
    try {
      await buyMines({
        id: Number(planet.id),
        data: { quantity: data.quantity },
      }).unwrap()
      
      toast.success(`Successfully bought ${data.quantity} mines!`)
      mineForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to buy mines')
    }
  }

  const onBuyProbes = async (data: ProbeFormData) => {
    try {
      await buyProbes({
        id: Number(planet.id),
        data: { quantity: data.quantity },
      }).unwrap()
      
      toast.success(`Successfully bought ${data.quantity} probes!`)
      probeForm.reset()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to buy probes')
    }
  }

  const mineQuantity = mineForm.watch('quantity') || 1
  const probeQuantity = probeForm.watch('quantity') || 1
  const mineCost = calculateMineCost(mineQuantity)
  const probeCost = calculateProbeCost(probeQuantity)

  const canAffordMines = planet.tellerium_balance >= mineCost.tellerium && planet.krypton_balance >= mineCost.krypton
  const canAffordProbes = planet.tellerium_balance >= probeCost.tellerium && planet.krypton_balance >= probeCost.krypton

  return (
    <div className="space-y-6">
      {oreVeins.length > 0 && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-300" />
              <div>
                <CardTitle className="text-base">Ore Veins</CardTitle>
                <CardDescription>Secondary materials present on this world</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowOreVeins((prev) => !prev)}
            >
              {showOreVeins ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CardHeader>
          {showOreVeins && (
            <CardContent className="space-y-3">
              {oreVeins.map(({ reserve, metadata, ledgerEntry, remaining, initial, remainingPercent, richnessPercent, isDepleted, capacityCapped }) => (
                <div
                  key={reserve.slug}
                  className={cn(
                    'rounded-lg border border-border/40 bg-muted/10 p-4 transition-colors',
                    isDepleted && 'border-destructive/50 bg-destructive/5',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: metadata.color }}
                      />
                      <div>
                        <p className="text-sm font-semibold">{metadata.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(remaining)} remaining
                          {initial > 0 && ` / ${formatNumber(initial)} total`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {capacityCapped && ledgerEntry && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openPanel(PanelType.BOOSTERS, PanelSize.MEDIUM)
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="border-amber-500/40 text-amber-300"
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Expand Storage
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              Ledger capacity reached ({formatNumber(ledgerEntry.quantity)} /{' '}
                              {formatNumber(ledgerEntry.capacity || 0)}). Activate storage upgrades to prevent waste.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isDepleted ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          Depleted
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-border/40 text-muted-foreground"
                          style={{ borderColor: metadata.color }}
                        >
                          {richnessPercent >= 0 ? '+' : ''}
                          {richnessPercent}% yield
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Vein Longevity</span>
                      <span>{remainingPercent}% remaining</span>
                    </div>
                    <Progress value={remainingPercent} className="h-2 bg-border/60" />
                  </div>
                  {reserve.depleted_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Depleted at {reserve.depleted_at}
                    </p>
                  )}
                  {ledgerEntry && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="w-3 h-3" />
                      <span>
                        Ledger: {formatNumber(ledgerEntry.quantity)} / {formatNumber(ledgerEntry.capacity || 0)} stored
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Buy Mines */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src={getMineImage()}
              alt="Mine"
              className="w-5 h-5 object-contain"
              style={{ imageRendering: 'auto' }}
            />
            Buy Mines
          </CardTitle>
          <CardDescription>
            Mines produce Tellerium. Each mine produces 1,000 Tellerium per tick.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={mineForm.handleSubmit(onBuyMines)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mine-quantity">Quantity</Label>
              <Input
                id="mine-quantity"
                type="number"
                min="1"
                max="100"
                {...mineForm.register('quantity', { valueAsNumber: true })}
              />
              {mineForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {mineForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tellerium">Tellerium Cost:</span>
                  <span className={`font-mono ${canAffordMines ? 'text-tellerium' : 'text-destructive'}`}>
                    {formatResource(mineCost.tellerium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-krypton">Krypton Cost:</span>
                  <span className={`font-mono ${canAffordMines ? 'text-krypton' : 'text-destructive'}`}>
                    {formatResource(mineCost.krypton)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Production:</span>
                  <span className="text-cyan-400">
                    +{formatNumber(mineQuantity * 1000)} T/tick
                  </span>
                </div>
              </div>
            </div>

            {!canAffordMines && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient resources
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isBuyingMines || !canAffordMines}
            >
              {isBuyingMines ? 'Buying...' : `Buy ${mineQuantity} Mine${mineQuantity > 1 ? 's' : ''}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Buy Probes */}
      <Card className="panel-glass border-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img
              src={getProbeImage()}
              alt="Probe"
              className="w-5 h-5 object-contain"
              style={{ imageRendering: 'auto' }}
            />
            Buy Probes
          </CardTitle>
          <CardDescription>
            Probes produce Krypton. Each probe produces 750 Krypton per tick.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={probeForm.handleSubmit(onBuyProbes)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="probe-quantity">Quantity</Label>
              <Input
                id="probe-quantity"
                type="number"
                min="1"
                max="50"
                {...probeForm.register('quantity', { valueAsNumber: true })}
              />
              {probeForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {probeForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tellerium">Tellerium Cost:</span>
                  <span className={`font-mono ${canAffordProbes ? 'text-tellerium' : 'text-destructive'}`}>
                    {formatResource(probeCost.tellerium)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-krypton">Krypton Cost:</span>
                  <span className={`font-mono ${canAffordProbes ? 'text-krypton' : 'text-destructive'}`}>
                    {formatResource(probeCost.krypton)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Production:</span>
                  <span className="text-blue-400">
                    +{formatNumber(probeQuantity * 750)} K/tick
                  </span>
                </div>
              </div>
            </div>

            {!canAffordProbes && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient resources
                </span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isBuyingProbes || !canAffordProbes}
            >
              {isBuyingProbes ? 'Buying...' : `Buy ${probeQuantity} Probe${probeQuantity > 1 ? 's' : ''}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Production/Upkeep Breakdown */}
      {netProduction && (
        <Card className="panel-glass border-cyan/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Production & Upkeep Breakdown
            </CardTitle>
            <CardDescription>
              Net production after facility upkeep costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Production */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-green-400">Production</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTelleriumImage()}
                        alt="T"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-tellerium">Tellerium:</span>
                    </div>
                    <span className="text-sm font-mono text-tellerium">
                      +{formatNumber(netProduction.production.tellerium)}/tick
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getKryptonImage()}
                        alt="K"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-krypton">Krypton:</span>
                    </div>
                    <span className="text-sm font-mono text-krypton">
                      +{formatNumber(netProduction.production.krypton)}/tick
                    </span>
                  </div>
                </div>
              </div>

              {/* Upkeep */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-yellow-400">Upkeep</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTelleriumImage()}
                        alt="T"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-tellerium">Tellerium:</span>
                    </div>
                    <span className="text-sm font-mono text-yellow-400">
                      -{formatNumber(netProduction.upkeep.tellerium)}/tick
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getKryptonImage()}
                        alt="K"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-krypton">Krypton:</span>
                    </div>
                    <span className="text-sm font-mono text-yellow-400">
                      -{formatNumber(netProduction.upkeep.krypton)}/tick
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Production */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Net Production</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTelleriumImage()}
                        alt="T"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-tellerium">Tellerium:</span>
                    </div>
                    <span className={`text-sm font-mono font-semibold ${
                      netProduction.net.tellerium >= 0 ? 'text-tellerium' : 'text-destructive'
                    }`}>
                      {netProduction.net.tellerium >= 0 ? '+' : ''}
                      {formatNumber(netProduction.net.tellerium)}/tick
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getKryptonImage()}
                        alt="K"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm text-krypton">Krypton:</span>
                    </div>
                    <span className={`text-sm font-mono font-semibold ${
                      netProduction.net.krypton >= 0 ? 'text-krypton' : 'text-destructive'
                    }`}>
                      {netProduction.net.krypton >= 0 ? '+' : ''}
                      {formatNumber(netProduction.net.krypton)}/tick
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deactivation Warning */}
            {hasDeactivationWarning && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Warning: Facility Deactivation Risk
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your planet's upkeep costs exceed production. If resources become insufficient,
                    all facilities on this planet will be deactivated until resources are restored.
                  </p>
                  {netProduction.net.tellerium < 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Tellerium deficit: {formatNumber(Math.abs(netProduction.net.tellerium))}/tick
                    </p>
                  )}
                  {netProduction.net.krypton < 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Krypton deficit: {formatNumber(Math.abs(netProduction.net.krypton))}/tick
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dark Matter Display */}
      {darkMatterInfo && (
        <Card className="panel-glass border-purple/20 lg:col-span-2">
          <CardContent className="pt-6">
            <DarkMatterDisplay darkMatterInfo={darkMatterInfo} className="border-0 shadow-none" />
          </CardContent>
        </Card>
      )}

      {/* Current Resources */}
      <Card className="panel-glass border-green/20 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            Current Resources
          </CardTitle>
          <CardDescription>
            Your current resource balances on this planet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={getTelleriumImage()}
                    alt="Tellerium"
                    className="w-6 h-6 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="font-semibold text-tellerium">Tellerium</span>
                </div>
                <span className="text-2xl font-mono text-tellerium glow-cyan">
                  {formatResource(planet.tellerium_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={getKryptonImage()}
                    alt="Krypton"
                    className="w-6 h-6 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="font-semibold text-krypton">Krypton</span>
                </div>
                <span className="text-2xl font-mono text-krypton glow-blue">
                  {formatResource(planet.krypton_balance)}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <img
                    src={getMineImage()}
                    alt="Mine"
                    className="w-4 h-4 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-sm text-muted-foreground">Current Mines</span>
                </div>
                <Badge variant="outline" className="text-cyan-400">
                  {planet.mines}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <img
                    src={getProbeImage()}
                    alt="Probe"
                    className="w-4 h-4 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-sm text-muted-foreground">Current Probes</span>
                </div>
                <Badge variant="outline" className="text-blue-400">
                  {planet.probes}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}
