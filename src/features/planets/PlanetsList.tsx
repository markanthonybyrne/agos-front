import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatResource } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { getPlanetImage } from '@/lib/planetImages'

export function PlanetsList() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useGetPlanetsQuery()

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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  {planet?.type?.slug && (
                    <img
                      src={getPlanetImage(planet.type.slug)}
                      alt={planet?.type?.name || planet.type.slug}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  {planet.name}
                </span>
                <span className="text-sm font-normal capitalize text-muted-foreground">
                  {planet.state}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Coordinate:</span>
                  <span className="font-mono">{formatCoordinate(planet.coordinate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tellerium:</span>
                  <span className="font-mono text-cyan">{formatResource(planet.tellerium_balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Krypton:</span>
                  <span className="font-mono text-blue">{formatResource(planet.krypton_balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mines:</span>
                  <span className="font-mono">{planet.mines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Probes:</span>
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

