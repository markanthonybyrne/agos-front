import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatResource } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'

export function PlanetsList() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load planets</p>
        </CardContent>
      </Card>
    )
  }

        const planets = Array.isArray(data?.planets) ? data.planets : []

  if (planets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No planets owned</p>
          <Button onClick={() => navigate('/map')}>Explore Universe</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading">Your Planets</h1>
        <Button onClick={() => navigate('/map')}>Explore Universe</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planets.map((planet) => (
          <Card
            key={planet.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate(`/planets/${planet.id}`)}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <img
                  src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                  alt={planet?.type?.name || planet.type?.slug || 'Planet'}
                  className="w-24 h-24 object-contain flex-shrink-0"
                  style={{ imageRendering: 'auto', display: 'block' }}
                  loading="lazy"
                  onError={(e) => {
                    console.error('Planet image failed to load:', planet?.type?.slug, getPlanetImage(planet?.type?.slug))
                  }}
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center justify-between mb-2">
                    <span className="truncate">{planet.name}</span>
                    <span className="text-sm font-normal capitalize text-muted-foreground ml-2 flex-shrink-0">
                      {planet.state}
                    </span>
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Coordinate:</span>
                  <span className="font-mono">{formatCoordinate(planet.coordinate)}</span>
                </div>
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
                  <span className="font-mono text-tellerium">{formatResource(planet.tellerium_balance)}</span>
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
                  <span className="font-mono text-krypton">{formatResource(planet.krypton_balance)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getMineImage()}
                      alt="Mine"
                      className="w-4 h-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <span className="text-muted-foreground">Mines:</span>
                  </div>
                  <span className="font-mono">{planet.mines}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getProbeImage()}
                      alt="Probe"
                      className="w-4 h-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <span className="text-muted-foreground">Probes:</span>
                  </div>
                  <span className="font-mono">{planet.probes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

