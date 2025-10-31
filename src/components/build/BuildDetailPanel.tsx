import { useState } from 'react'
import { useGetFacilityDefinitionsQuery, useBuildFacilityMutation } from '@/api/endpoints/facilitiesApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useGetDefenceDefinitionsQuery, useBuildDefencesMutation } from '@/api/endpoints/defencesApi'
import { useGetResearchDefinitionsQuery, useStartResearchMutation } from '@/api/endpoints/researchApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Zap, TrendingUp } from 'lucide-react'
import { formatResource, formatNumber } from '@/lib/formatters'
import { toast } from 'sonner'
import { getFacilityImage } from '@/lib/facilityImages'
import { getShipImage } from '@/lib/shipImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { Skeleton } from '@/components/ui/skeleton'

interface BuildDetailPanelProps {
  type: 'facility' | 'ship' | 'defense' | 'research'
  slug: string
  planetId: number
}

export function BuildDetailPanel({ type, slug, planetId }: BuildDetailPanelProps) {
  const [level, setLevel] = useState(1)
  const [quantity, setQuantity] = useState(1)

  // Get planet data for resources
  const { data: planetData } = useGetPlanetQuery(planetId)
  const planet = planetData?.planet

  // Get definitions based on type
  const { data: facilityDefs } = useGetFacilityDefinitionsQuery(undefined, {
    skip: type !== 'facility',
  })
  const { data: shipDefs } = useGetShipDefinitionsQuery(undefined, {
    skip: type !== 'ship',
  })
  const { data: defenseDefs } = useGetDefenceDefinitionsQuery(undefined, {
    skip: type !== 'defense',
  })
  const { data: researchDefs } = useGetResearchDefinitionsQuery(undefined, {
    skip: type !== 'research',
  })

  // Get mutations
  const [buildFacility, { isLoading: isBuilding }] = useBuildFacilityMutation()
  const [buildDefense, { isLoading: isBuildingDefense }] = useBuildDefencesMutation()
  const [startResearch, { isLoading: isStartingResearch }] = useStartResearchMutation()

  // Get the item definition
  const itemDef =
    type === 'facility'
      ? facilityDefs?.facilities?.find((f) => f.slug === slug)
      : type === 'ship'
        ? shipDefs?.ships?.find((s) => s.slug === slug)
        : type === 'defense'
          ? defenseDefs?.defences?.find((d) => d.slug === slug)
          : researchDefs?.research?.find((r) => r.slug === slug)

  if (!itemDef) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Calculate costs
  const telleriumCost =
    type === 'facility'
      ? (itemDef as any).base_tellerium_cost * level
      : type === 'ship'
        ? ((itemDef as any).tellerium_cost || (itemDef as any).cost_tellerium || 0) * quantity
        : type === 'defense'
          ? (itemDef as any).tellerium_cost * quantity
          : (itemDef as any).cost_tellerium

  const kryptonCost =
    type === 'facility'
      ? (itemDef as any).base_krypton_cost * level
      : type === 'ship'
        ? ((itemDef as any).krypton_cost || (itemDef as any).cost_krypton || 0) * quantity
        : type === 'defense'
          ? (itemDef as any).krypton_cost * quantity
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
      } else if (type === 'defense') {
        await buildDefense({
          planetId,
          data: {
            defence_slug: slug,
            quantity,
          },
        }).unwrap()
        toast.success('Defense queued for construction!')
      } else if (type === 'research') {
        await startResearch({
          planet_id: planetId,
          research_slug: slug,
        }).unwrap()
        toast.success('Research queued successfully!')
      }
      // Ships are built from fleet builder, not here
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to build ${type}`)
    }
  }

  const isLoading =
    isBuilding || isBuildingDefense || isStartingResearch

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
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>{type === 'facility' ? 10 : 999}</span>
              </div>
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
                >
                  {val}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
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
        disabled={isLoading || !canAfford}
        className="w-full text-lg py-6"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Building...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Build Now
          </>
        )}
      </Button>
    </div>
  )
}

