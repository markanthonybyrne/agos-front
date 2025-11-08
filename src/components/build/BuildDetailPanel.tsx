import { useMemo, useState } from 'react'
import { useGetFacilityDefinitionsQuery, useBuildFacilityMutation } from '@/api/endpoints/facilitiesApi'
import { useGetShipDefinitionsQuery, useBuildShipsMutation } from '@/api/endpoints/shipsApi'
import { useGetDefenceDefinitionsQuery, useBuildDefencesMutation, useGetAvailableDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetResearchDefinitionsQuery, useStartResearchMutation } from '@/api/endpoints/researchApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Zap, TrendingUp, Info, Clock } from 'lucide-react'
import { formatResource, formatNumber } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { formatPrerequisiteSlug, getDefenceRequirements } from '@/lib/prerequisites'
import { getFacilityImage } from '@/lib/facilityImages'
import { getShipImage } from '@/lib/shipImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { Skeleton } from '@/components/ui/skeleton'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType } from '@/app/slices/panelSlice'
import { toast } from 'sonner'

interface BuildDetailPanelProps {
  type: 'facility' | 'ship' | 'defense' | 'research'
  slug: string
  planetId: number
}

function extractDefinitions<T = any>(source: any, keys: string[]): T[] {
  if (!source) return []

  for (const key of keys) {
    const direct = source?.[key]
    if (Array.isArray(direct)) {
      return direct as T[]
    }
  }

  const dataWrapper = source?.data
  if (dataWrapper) {
    for (const key of keys) {
      const nested = dataWrapper?.[key]
      if (Array.isArray(nested)) {
        return nested as T[]
      }
    }
  }

  return []
}

export function BuildDetailPanel({ type, slug, planetId }: BuildDetailPanelProps) {
  const [level, setLevel] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const { closePanelsByType } = usePanel()

  // Get planet data for resources
  const { data: planetData } = useGetPlanetQuery(planetId)
  const planet = planetData?.planet

  // Get definitions based on type
  const { data: facilityDefs, isLoading: isLoadingFacilities } = useGetFacilityDefinitionsQuery(undefined, {
    skip: type !== 'facility',
  })
  const { data: shipDefs, isLoading: isLoadingShips } = useGetShipDefinitionsQuery(undefined, {
    skip: type !== 'ship',
  })
  const { data: defenseDefs, isLoading: isLoadingDefences } = useGetDefenceDefinitionsQuery(undefined, {
    skip: type !== 'defense',
  })
  const { data: researchDefs, isLoading: isLoadingResearch } = useGetResearchDefinitionsQuery(undefined, {
    skip: type !== 'research',
  })
  const { data: availableDefences, isLoading: isLoadingAvailableDefences } = useGetAvailableDefencesQuery(planetId, {
    skip: type !== 'defense',
  })

  const isLoadingDefinitions =
    (type === 'facility' && isLoadingFacilities) ||
    (type === 'ship' && isLoadingShips) ||
    (type === 'defense' && (isLoadingDefences || isLoadingAvailableDefences)) ||
    (type === 'research' && isLoadingResearch)

  const defenceAvailability = useMemo(() => {
    if (type !== 'defense') return undefined
    return availableDefences?.defences?.find((defence) => defence.slug === slug)
  }, [availableDefences?.defences, slug, type])

  const defenceCanBuild = type === 'defense' ? defenceAvailability?.can_build !== false : true
  const missingDefencePrereqs = type === 'defense' ? defenceAvailability?.missing_prerequisites ?? [] : []

  const defenceRequirementConfig = useMemo(() => {
    if (type !== 'defense') {
      return { facilities: [], research: [] }
    }
    return getDefenceRequirements(slug)
  }, [slug, type])

  const defenceRequirementBadges = useMemo(() => {
    if (type !== 'defense') return []
    const badges: { slug: string; type: 'facility' | 'research' | 'unknown'; met: boolean }[] = []
    const seen = new Set<string>()

    defenceRequirementConfig.facilities.forEach((facilitySlug) => {
      badges.push({ slug: facilitySlug, type: 'facility', met: !missingDefencePrereqs.includes(facilitySlug) })
      seen.add(facilitySlug)
    })

    defenceRequirementConfig.research.forEach((researchSlug) => {
      badges.push({ slug: researchSlug, type: 'research', met: !missingDefencePrereqs.includes(researchSlug) })
      seen.add(researchSlug)
    })

    missingDefencePrereqs.forEach((missingSlug) => {
      if (seen.has(missingSlug)) return
      badges.push({ slug: missingSlug, type: 'unknown', met: false })
    })

    return badges
  }, [defenceRequirementConfig, missingDefencePrereqs, type])

  const facilityList = useMemo(
    () => extractDefinitions(facilityDefs, ['facilities']),
    [facilityDefs]
  )
  const shipList = useMemo(
    () => extractDefinitions(shipDefs, ['ships']),
    [shipDefs]
  )
  const defenceList = useMemo(
    () => extractDefinitions(defenseDefs, ['defences', 'defenses']),
    [defenseDefs]
  )
  const researchList = useMemo(
    () => extractDefinitions(researchDefs, ['research']),
    [researchDefs]
  )

  const baseItemDef = useMemo(() => {
    if (type === 'facility') {
      return facilityList.find((f: any) => f?.slug === slug)
    }
    if (type === 'ship') {
      return shipList.find((s: any) => s?.slug === slug)
    }
    if (type === 'defense') {
      return defenceList.find((d: any) => d?.slug === slug)
    }
    if (type === 'research') {
      return researchList.find((r: any) => r?.slug === slug)
    }
    return undefined
  }, [type, slug, facilityList, shipList, defenceList, researchList])

  const itemDef = useMemo(() => {
    if (type === 'defense') {
      return defenceAvailability || baseItemDef
    }
    return baseItemDef
  }, [baseItemDef, defenceAvailability, type])

  const defenceBuildTimeTicks = type === 'defense'
    ? defenceAvailability?.build_time_ticks ?? (itemDef as any)?.build_time_ticks ?? 0
    : 0
  const totalDefenceBuildTicks = type === 'defense' ? defenceBuildTimeTicks * quantity : 0
  const quantityControlsDisabled = type === 'defense' && !defenceCanBuild

  const [buildFacility, { isLoading: isBuilding }] = useBuildFacilityMutation()
  const [buildDefense, { isLoading: isBuildingDefense }] = useBuildDefencesMutation()
  const [startResearch, { isLoading: isStartingResearch }] = useStartResearchMutation()
  const [buildShips, { isLoading: isBuildingShips }] = useBuildShipsMutation()

  if (isLoadingDefinitions && !itemDef) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!itemDef) {
    return (
      <div className="space-y-4">
        <Card className="panel-glass border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load item details</CardTitle>
            <CardDescription>
              We could not find additional data for this {type}. Please try again later or contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Calculate costs
  const telleriumCost =
    type === 'facility'
      ? ((itemDef as any).base_tellerium_cost ?? (itemDef as any).tellerium_cost ?? 0) * level
      : type === 'ship'
        ? ((itemDef as any).tellerium_cost || (itemDef as any).cost_tellerium || 0) * quantity
        : type === 'defense'
          ? ((itemDef as any).tellerium_cost || (itemDef as any).cost_tellerium || 0) * quantity
          : (itemDef as any).cost_tellerium

  const kryptonCost =
    type === 'facility'
      ? ((itemDef as any).base_krypton_cost ?? (itemDef as any).krypton_cost ?? 0) * level
      : type === 'ship'
        ? ((itemDef as any).krypton_cost || (itemDef as any).cost_krypton || 0) * quantity
        : type === 'defense'
          ? ((itemDef as any).krypton_cost || (itemDef as any).cost_krypton || 0) * quantity
          : (itemDef as any).cost_krypton

  const canAfford =
    planet &&
    planet.tellerium_balance >= telleriumCost &&
    planet.krypton_balance >= kryptonCost

  // Get item image
  const getItemImage = () => {
    if (type === 'facility') return getFacilityImage(slug)
    if (type === 'ship') return getShipImage(slug)
    if (type === 'defense') return getDefenseImage(slug)
    return undefined
  }

  const handleBuild = async () => {
    if (!planet) return

    try {
      if (type === 'facility') {
        await buildFacility({
          planetId,
          data: {
            facility_slug: slug,
            level,
          },
        }).unwrap()
        toast.success('Facility queued for construction!')
        // Auto-close panel after successful queue
        // Small delay to ensure toast appears before panel closes
        setTimeout(() => {
          closePanelsByType(PanelType.BUILD_DETAIL)
        }, 100)
      } else if (type === 'defense') {
        await buildDefense({
          planetId,
          data: {
            defence_slug: slug,
            quantity,
          },
        }).unwrap()
        toast.success('Defence queued for construction!')
        // Auto-close panel after successful queue
        // Small delay to ensure toast appears before panel closes
        setTimeout(() => {
          closePanelsByType(PanelType.BUILD_DETAIL)
        }, 100)
      } else if (type === 'research') {
        await startResearch({
          planet_id: planetId,
          research_slug: slug,
        }).unwrap()
        toast.success('Research queued successfully!')
        // Auto-close panel after successful queue
        // Small delay to ensure toast appears before panel closes
        setTimeout(() => {
          closePanelsByType(PanelType.BUILD_DETAIL)
        }, 100)
      } else if (type === 'ship') {
        await buildShips({
          planetId,
          data: {
            ship_slug: slug,
            quantity,
          },
        }).unwrap()
        toast.success(`Ship queued for construction!`)
        // Auto-close panel after successful queue
        // Small delay to ensure toast appears before panel closes
        setTimeout(() => {
          closePanelsByType(PanelType.BUILD_DETAIL)
        }, 100)
      }
    } catch (error: any) {
      const missing = error?.data?.missing_prerequisites
        || error?.data?.details?.missing_prerequisites
      if (Array.isArray(missing) && missing.length > 0) {
        const formatted = missing.map((slug: string) => formatPrerequisiteSlug(slug)).join(', ')
        toast.error('Missing prerequisites', {
          description: formatted,
        })
        return
      }

      const errorCode = error?.data?.code
      if (errorCode === 'MISSING_PREREQUISITES') {
        toast.error('Prerequisites not met', {
          description: 'Complete the required research and facilities before queuing this defence.',
        })
        return
      }

      toast.error(error?.data?.message || `Failed to build ${type}`)
    }
  }

  const isLoading =
    isBuilding || isBuildingDefense || isStartingResearch || isBuildingShips

  const buildButtonDisabled =
    isLoading ||
    !canAfford ||
    (type === 'defense' && !defenceCanBuild)
  const buildButtonLabel = type === 'defense' ? 'Queue Defence Construction' : 'Build Now'
  const buildButtonLoadingLabel = type === 'defense' ? 'Queueing…' : 'Building...'

  return (
    <div className="space-y-6">
      {/* Item Preview */}
      <Card className="panel-glass border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            {getItemImage() && (
              <img
                src={getItemImage()}
                alt={itemDef.name}
                className="w-32 h-32 object-contain"
                style={{ imageRendering: 'auto' }}
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl">{itemDef.name}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {itemDef.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Visual Level/Quantity Selector */}
      {(type === 'facility' || type === 'ship' || type === 'defense') && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              {type === 'facility' ? 'Level' : 'Quantity'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {type === 'facility' ? 'Level' : 'Quantity'}
                </span>
                <span className="font-mono text-xl">
                  {type === 'facility' ? level : quantity}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={type === 'facility' ? 10 : 999}
                value={type === 'facility' ? level : quantity}
                onChange={(e) =>
                  type === 'facility'
                    ? setLevel(Number(e.target.value))
                    : setQuantity(Number(e.target.value))
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={quantityControlsDisabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>{type === 'facility' ? 10 : 999}</span>
              </div>
              {quantityControlsDisabled && (
                <p className="text-[11px] text-red-200">
                  Complete the required facilities and research before queuing this defence.
                </p>
              )}
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2">
              {[1, 5, 10].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    type === 'facility' ? setLevel(val) : setQuantity(val)
                  }
                  className={type === 'facility' ? (level === val ? 'border-primary' : '') : (quantity === val ? 'border-primary' : '')}
                  disabled={quantityControlsDisabled}
                >
                  {val}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {type === 'defense' && defenceRequirementBadges.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
            <Info className="h-4 w-4 text-cyan-300" />
            Prerequisites
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {defenceRequirementBadges.map((badge) => {
              const met = badge.met
              const badgeClass = met
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
              const prefix = badge.type === 'facility' ? 'Facility' : badge.type === 'research' ? 'Research' : 'Requirement'
              return (
                <Badge
                  key={`${badge.type}-${badge.slug}`}
                  variant="outline"
                  className={cn('text-[11px]', badgeClass)}
                  title={`${prefix}: ${formatPrerequisiteSlug(badge.slug)}`}
                >
                  {prefix}: {formatPrerequisiteSlug(badge.slug)}
                </Badge>
              )
            })}
          </div>
          {missingDefencePrereqs.length > 0 && (
            <p className="mt-3 text-[11px] text-red-200">
              {missingDefencePrereqs.length === 1
                ? 'This defence is locked until the missing requirement is complete.'
                : 'This defence is locked until all missing requirements are complete.'}
            </p>
          )}
        </div>
      )}

      {/* Cost Breakdown */}
      <Card className="panel-glass border-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            Resource Cost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tellerium */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={getTelleriumImage()}
                alt="Tellerium"
                className="w-8 h-8 object-contain"
                style={{ imageRendering: 'auto' }}
              />
              <span className="font-semibold text-tellerium">Tellerium</span>
            </div>
            <span
              className={`text-xl font-mono ${
                canAfford && planet
                  ? 'text-tellerium'
                  : 'text-destructive'
              }`}
            >
              {formatResource(telleriumCost)}
            </span>
          </div>

          {/* Krypton */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={getKryptonImage()}
                alt="Krypton"
                className="w-8 h-8 object-contain"
                style={{ imageRendering: 'auto' }}
              />
              <span className="font-semibold text-krypton">Krypton</span>
            </div>
            <span
              className={`text-xl font-mono ${
                canAfford && planet ? 'text-krypton' : 'text-destructive'
              }`}
            >
              {formatResource(kryptonCost)}
            </span>
          </div>

          {type === 'defense' && defenceBuildTimeTicks > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold text-cyan-100">Build Time</p>
                  <p className="text-xs text-muted-foreground">
                    Per unit: {defenceBuildTimeTicks.toLocaleString()} ticks
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono text-cyan-200">
                Total: {totalDefenceBuildTicks.toLocaleString()} ticks
              </span>
            </div>
          )}

          {/* Available Resources */}
          {planet && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-sm text-muted-foreground font-semibold">
                Available Resources
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-tellerium">Tellerium:</span>
                <span className="font-mono">
                  {formatResource(planet.tellerium_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-krypton">Krypton:</span>
                <span className="font-mono">
                  {formatResource(planet.krypton_balance)}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          {!canAfford && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm text-destructive">
                Insufficient resources
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Build Button */}
      <Button
        onClick={handleBuild}
        disabled={buildButtonDisabled}
        className="w-full text-lg py-6"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {buildButtonLoadingLabel}
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            {buildButtonLabel}
          </>
        )}
      </Button>
    </div>
  )
}

