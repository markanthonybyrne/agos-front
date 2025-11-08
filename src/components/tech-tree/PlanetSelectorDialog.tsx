import { useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { formatResource } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { Planet } from '@/types/api.types'
import { Globe, Hammer, Shield, Ship, FlaskConical } from 'lucide-react'

type BuildType = 'facility' | 'ship' | 'defence' | 'research'

interface PlanetSelectorDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (planetId: number) => void
  requiredType: BuildType
  nodeName: string
}

const typeLabels: Record<BuildType, { label: string; icon: React.ComponentType<any> }> = {
  facility: { label: 'Facility', icon: Hammer },
  ship: { label: 'Ship', icon: Ship },
  defence: { label: 'Defence', icon: Shield },
  research: { label: 'Research', icon: FlaskConical },
}

export function PlanetSelectorDialog({
  open,
  onClose,
  onSelect,
  requiredType,
  nodeName,
}: PlanetSelectorDialogProps) {
  const { data: planetsData, isLoading } = useGetPlanetsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  })

  const planets = useMemo(() => {
    const list = planetsData?.planets ?? []
    return list
      .slice()
      .sort((a: Planet, b: Planet) => {
        // Prefer owned colonies/homeworld first
        const aOwned = a.state === 'homeworld' || a.state === 'colony'
        const bOwned = b.state === 'homeworld' || b.state === 'colony'
        if (aOwned && !bOwned) return -1
        if (!aOwned && bOwned) return 1
        return a.name.localeCompare(b.name)
      })
  }, [planetsData])

  const headerMeta = typeLabels[requiredType]

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? undefined : onClose())}>
      <DialogContent className="sm:max-w-[700px] panel-glass surface-gradient card-glow border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <headerMeta.icon className="w-5 h-5 text-cyan-400" />
            Choose Planet for {headerMeta.label}
          </DialogTitle>
          <DialogDescription>
            Select a planet to queue <strong>{nodeName}</strong>. Only planets you own can start new projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : planets.length === 0 ? (
            <Card className="panel-glass border-border/30">
              <CardHeader>
                <CardTitle>No Planets Found</CardTitle>
                <CardDescription>
                  You need at least one planet to begin construction or research.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explore the galaxy and colonize a planet to unlock this action.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {planets.map((planet) => {
                const isOwned = planet.state === 'homeworld' || planet.state === 'colony'
                return (
                  <Card
                    key={planet.id}
                    className="panel-glass border-border/40 hover:border-cyan/50 transition"
                  >
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {planet.name}
                          {planet.state && (
                            <Badge variant="outline" className="uppercase text-xs">
                              {planet.state}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {formatCoordinate(planet.coordinate) || 'Unknown coordinate'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        <headerMeta.icon className="w-4 h-4 mr-1" />
                        {headerMeta.label}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>
                            Tellerium:{' '}
                            <span className="text-foreground font-mono">
                              {formatResource(planet.tellerium_balance ?? 0)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <span>
                            Krypton:{' '}
                            <span className="text-foreground font-mono">
                              {formatResource(planet.krypton_balance ?? 0)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hammer className="w-4 h-4 text-violet-400" />
                          <span>Mines: {planet.mines ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>Probes: {planet.probes ?? 0}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => onSelect(planet.id)}
                        disabled={!isOwned}
                        className="self-end"
                      >
                        {isOwned ? 'Use this planet' : 'Unowned planet'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

