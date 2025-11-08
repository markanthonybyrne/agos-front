import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Planet } from '@/types/api.types'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource, formatNumber } from '@/lib/formatters'
import { useGetPlanetResourcesQuery } from '@/api/endpoints/resourcesApi'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { MapPin, Clock, Zap, Shield, Settings, Droplets, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

interface OverviewTabProps {
  planet: Planet
}

export function OverviewTab({ planet }: OverviewTabProps) {
  const { data: resourcesData, isLoading: isLoadingResources } = useGetPlanetResourcesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { data: facilitiesData, isLoading: isLoadingFacilities } = useGetPlanetFacilitiesQuery(Number(planet.id), {
    refetchOnMountOrArgChange: true,
  })
  const { ledger, getMetadata } = useResourcesCatalog({ reserves: planet.secondary_reserves })

  const ledgerMap = useMemo(() => {
    const map = new Map<string, typeof ledger[number]>()
    ledger.forEach((entry) => {
      map.set(entry.slug, entry)
    })
    return map
  }, [ledger])

  // Get production data from resources API
  const production = resourcesData?.production || {
    tellerium_per_tick: 0,
    krypton_per_tick: 0,
  }

  // Get facilities from API or fallback to planet data
  const facilities = facilitiesData?.facilities || planet.facilities || {}
  const defenseGrid = planet.defence_grid || {}

  // Calculate production from mines and probes
  const minesProduction = planet.mines * 1000 // 1000 T per mine per tick
  const probesProduction = planet.probes * 750 // 750 K per probe per tick
  
  // Base planet production (if not included in API response)
  const baseProduction = {
    tellerium: 250,
    krypton: 250,
  }

  // Calculate facility production bonuses
  const molecularExtractionLevel = Array.isArray(facilities)
    ? (facilities.find((f: any) => f.facility_slug === 'molecular_extraction')?.level || 0)
    : ((facilities as Record<string, number>)?.molecular_extraction || 0)
  const productionBonus = molecularExtractionLevel > 0 ? 1 + (molecularExtractionLevel * 0.20) : 1

  // Format coordinate properly
  const coordinateString = formatCoordinate(planet.coordinate)

  if (isLoadingResources || isLoadingFacilities) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Planet Information */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <div className="flex items-start gap-4">
            <img
              src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
              alt={planet?.type?.name || planet.type?.slug || 'Planet'}
              className="w-32 h-32 object-contain flex-shrink-0"
              style={{ imageRendering: 'auto', display: 'block' }}
              onError={(e) => {
                console.error('Planet image failed to load:', planet?.type?.slug)
              }}
            />
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Planet Information
              </CardTitle>
              <CardDescription>
                Basic information about this planet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Coordinate</p>
              <p className="font-mono text-lg glow-cyan">
                {coordinateString}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={planet.state === 'homeworld' ? 'default' : 'secondary'}
                className={planet.state === 'homeworld' ? 'bg-cyan-500' : ''}
              >
                {planet.state ? planet.state.charAt(0).toUpperCase() + planet.state.slice(1) : 'Unknown'}
              </Badge>
            </div>
          </div>

          {planet.type && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Planet Type</p>
              <p className="font-semibold capitalize">{planet.type?.name || 'Unknown'}</p>
              {planet.type?.description && (
                <p className="mt-1 text-sm text-muted-foreground italic">{planet.type?.description}</p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold mb-3">Resource Balances</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={getTelleriumImage()}
                    alt="Tellerium"
                    className="w-5 h-5 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-sm text-tellerium">Tellerium</span>
                </div>
                <span className="font-mono text-tellerium glow-cyan">
                  {formatResource(planet.tellerium_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={getKryptonImage()}
                    alt="Krypton"
                    className="w-5 h-5 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  <span className="text-sm text-krypton">Krypton</span>
                </div>
                <span className="font-mono text-krypton glow-blue">
                  {formatResource(planet.krypton_balance)}
                </span>
              </div>
            </div>

            {planet.secondary_reserves && planet.secondary_reserves.length > 0 && (
              <div className="mt-4 border-t border-border pt-3 space-y-2">
                <p className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5" />
                  Materials
                </p>
                <div className="space-y-2">
                  {planet.secondary_reserves.map((reserve) => {
                    const metadata = getMetadata(reserve.slug)
                    const ledgerEntry = ledgerMap.get(reserve.slug)
                    const initial = reserve.initial ?? reserve.remaining ?? 0
                    const remaining = reserve.remaining ?? 0
                    const remainingPercent =
                      initial > 0 ? Math.max(0, Math.round((remaining / initial) * 100)) : 0

                    return (
                      <div
                        key={reserve.slug}
                        className="rounded-md border border-border/40 bg-muted/5 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{metadata.name}</span>
                          {ledgerEntry && (
                            <span className="text-xs text-muted-foreground">
                              {formatNumber(ledgerEntry.quantity)} / {formatNumber(ledgerEntry.capacity || 0)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatNumber(remaining)} remaining</span>
                          {initial > 0 && <span>{remainingPercent}%</span>}
                        </div>
                        <Progress value={remainingPercent} className="h-1.5 bg-border/60" />
                        {ledgerEntry?.capacity && ledgerEntry.capacity > 0 && ledgerEntry.quantity >= ledgerEntry.capacity && (
                          <div className="flex items-center gap-2 text-[10px] text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Ledger full — expand storage to prevent waste</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Production Rates */}
      <Card className="panel-glass border-green/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            Production Rates
          </CardTitle>
          <CardDescription>
            Resources produced per tick
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={getTelleriumImage()}
                  alt="T"
                  className="w-4 h-4 object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="text-sm text-tellerium">Tellerium/Tick</span>
              </div>
              <span className="font-mono text-lg text-tellerium glow-cyan">
                +{formatNumber(production.tellerium_per_tick)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={getKryptonImage()}
                  alt="K"
                  className="w-4 h-4 object-contain"
                  style={{ imageRendering: 'auto' }}
                />
                <span className="text-sm text-krypton">Krypton/Tick</span>
              </div>
              <span className="font-mono text-lg text-krypton glow-blue">
                +{formatNumber(production.krypton_per_tick)}
              </span>
            </div>
            {productionBonus > 1 && (
              <div className="mt-2 p-2 bg-green/10 rounded-lg border border-green/20">
                <p className="text-xs text-green-400">
                  Production Bonus: +{Math.round((productionBonus - 1) * 100)}% from Molecular Extraction
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold mb-3">Production Sources</h4>
            <div className="space-y-2 text-sm">
              {minesProduction > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getMineImage()}
                      alt="Mine"
                      className="w-4 h-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <span>Mines ({planet.mines})</span>
                  </div>
                  <span className="text-tellerium">
                    +{formatNumber(productionBonus > 1 ? minesProduction * productionBonus : minesProduction)} T/tick
                  </span>
                </div>
              )}
              {probesProduction > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getProbeImage()}
                      alt="Probe"
                      className="w-4 h-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <span>Probes ({planet.probes})</span>
                  </div>
                  <span className="text-krypton">
                    +{formatNumber(productionBonus > 1 ? probesProduction * productionBonus : probesProduction)} K/tick
                  </span>
                </div>
              )}
              {resourcesData && (
                <>
                  {production.tellerium_per_tick > minesProduction && (
                    <div className="flex justify-between">
                      <span>Facilities</span>
                      <span className="text-tellerium">
                        +{formatNumber(production.tellerium_per_tick - minesProduction)} T/tick
                      </span>
                    </div>
                  )}
                  {production.krypton_per_tick > probesProduction && (
                    <div className="flex justify-between">
                      <span>Facilities</span>
                      <span className="text-krypton">
                        +{formatNumber(production.krypton_per_tick - probesProduction)} K/tick
                      </span>
                    </div>
                  )}
                </>
              )}
              {baseProduction.tellerium > 0 && (
                <div className="flex justify-between">
                  <span>Base Planet</span>
                  <span className="text-muted-foreground">
                    +{formatNumber(baseProduction.tellerium)} T/tick, +{formatNumber(baseProduction.krypton)} K/tick
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facilities Summary */}
      <Card className="panel-glass border-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Facilities
          </CardTitle>
          <CardDescription>
            Current facility levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facilitiesData?.facilities && facilitiesData.facilities.length > 0 ? (
            <div className="space-y-3">
              {facilitiesData.facilities.map((facility) => (
                <div key={facility.id} className="flex items-center justify-between">
                  <span className="capitalize">{facility.definition?.name || facility.facility_slug.replace(/_/g, ' ')}</span>
                  <Badge variant="outline" className={facility.is_active ? '' : 'opacity-50'}>
                    Level {facility.level} {!facility.is_active && '(Inactive)'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : Object.keys(facilities).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(facilities).map(([facility, level]) => (
                <div key={facility} className="flex items-center justify-between">
                  <span className="capitalize">{facility.replace(/_/g, ' ')}</span>
                  <Badge variant="outline">{level}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No facilities built yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Defense Summary */}
      <Card className="panel-glass border-red/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Defense Grid
          </CardTitle>
          <CardDescription>
            Current defense systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(defenseGrid).map(([defense, level]) => (
              <div key={defense} className="flex items-center justify-between">
                <span className="capitalize">{defense.replace(/_/g, ' ')}</span>
                <Badge variant="outline">{level}</Badge>
              </div>
            ))}
            {Object.keys(defenseGrid).length === 0 && (
              <p className="text-muted-foreground text-sm">
                No defenses built yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
