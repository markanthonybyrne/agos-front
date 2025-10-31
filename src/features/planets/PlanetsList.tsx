import { useState } from 'react'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCoordinate } from '@/lib/coordinates'
import { useNavigate } from 'react-router-dom'
import { Building2, Map } from 'lucide-react'
import { getPlanetImage } from '@/lib/planetImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { cn } from '@/lib/utils'

export function PlanetsList() {
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const [clickedPlanetId, setClickedPlanetId] = useState<number | null>(null)
  const { data, isLoading, error } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-96 w-full" />
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
      <Card className="panel-glass border-cyan/20">
        <CardContent className="pt-6 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No planets owned</p>
          <Button onClick={() => navigate('/map')}>Explore Universe</Button>
        </CardContent>
      </Card>
    )
  }

  const handlePlanetClick = (planet: any) => {
    // Trigger click animation
    setClickedPlanetId(planet.id)
    
    // Open planet console panel after animation starts
    setTimeout(() => {
      openPanel(PanelType.PLANET_VIEW, PanelSize.FULL_HEIGHT, { planetId: planet.id })
      setClickedPlanetId(null)
    }, 300)
  }

  const getPlanetGlowColor = (slug?: string) => {
    switch (slug) {
      case 'arid':
        return 'shadow-orange-500/50'
      case 'oceanic':
        return 'shadow-blue-500/50'
      case 'volcanic':
        return 'shadow-red-500/50'
      case 'ice':
        return 'shadow-cyan-500/50'
      case 'asteroid':
        return 'shadow-gray-500/50'
      default:
        return 'shadow-cyan-500/50'
    }
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-heading glow-cyan mb-2">Planet Command</h1>
          <p className="text-lg text-muted-foreground">Select a planet to access its console</p>
        </div>
        <Button onClick={() => navigate('/map')} variant="outline" size="lg">
          <Map className="w-5 h-5 mr-2" />
          Galaxy Map
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12">
        {planets.map((planet) => (
          <div
            key={planet.id}
            className="relative group cursor-pointer"
            onClick={() => handlePlanetClick(planet)}
          >
            {/* Planet container - no background, larger */}
            <div className="relative">
              {/* Planet image */}
              <div className="relative">
                <div className="flex items-center justify-center">
                  <img
                    src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                    alt={planet?.type?.name || 'Planet'}
                    className={cn(
                      "w-48 h-48 object-contain filter drop-shadow-2xl transition-all duration-300",
                      "group-hover:scale-110",
                      getPlanetGlowColor(planet?.type?.slug),
                      "group-hover:brightness-125",
                      clickedPlanetId === planet.id && "planet-click-animate"
                    )}
                    style={{ imageRendering: 'auto' }}
                    onError={(e) => {
                      console.error('Planet image failed to load:', planet?.type?.slug)
                    }}
                  />
                </div>
                
                {/* Planet name */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center mt-2">
                  <h3 className="text-lg font-heading glow-cyan truncate">{planet.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {formatCoordinate(planet.coordinate)}
                  </p>
                </div>
              </div>

              {/* Hover stats parallelogram box */}
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-80">
                <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-cyan-500/30 p-6 shadow-xl">
                  <div className="space-y-2 max-w-[200px] mr-[30px] ml-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Resources</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img src={getTelleriumImage()} alt="T" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
                        <span className="text-xs">T:</span>
                      </div>
                      <span className="text-xs font-mono text-tellerium">{formatResource(planet.tellerium_balance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img src={getKryptonImage()} alt="K" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
                        <span className="text-xs">K:</span>
                      </div>
                      <span className="text-xs font-mono text-krypton">{formatResource(planet.krypton_balance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mines:</span>
                      <span className="text-xs font-mono">{planet.mines}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Probes:</span>
                      <span className="text-xs font-mono">{planet.probes}</span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground capitalize">{planet.type?.name || planet.type?.slug}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

