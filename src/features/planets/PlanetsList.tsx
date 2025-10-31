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
import { cn } from '@/lib/utils'
import { Planet } from '@/types/api.types'

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

  const handlePlanetClick = (planet: Planet) => {
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-heading glow-cyan mb-2">Planet Command</h1>
          <p className="text-lg text-muted-foreground">Select a planet to access its console</p>
        </div>
        <Button onClick={() => navigate('/map')} variant="outline" size="lg">
          <Map className="w-5 h-5 mr-2" />
          Galaxy Map
        </Button>
      </div>

      {/* System View with Orbits */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          className="absolute w-[250%] h-[250%]" 
          style={{ 
            left: '-75%',
            top: '-75%',
            overflow: 'visible',
            animation: 'planet-orbit 300s linear infinite',
          }}
        >
          {/* Draw orbital rings */}
          {planets.map((_, index) => {
            const radius = 300 + (index * 150)
            return (
              <circle
                key={`orbit-${index}`}
                cx="50%"
                cy="50%"
                r={radius}
                fill="none"
                stroke="rgba(6, 182, 212, 0.2)"
                strokeWidth="2"
                strokeDasharray="8,8"
              />
            )
          })}
        </svg>

        {/* Planets positioned on orbits */}
        <div className="absolute inset-0">
          {planets.map((planet, index) => {
            // Calculate position on orbit
            const radius = 300 + (index * 150)
            const angle = (index * 137.5) * (Math.PI / 180) // Golden angle for even distribution
            const centerX = 50 // 50% of parent width
            const centerY = 50 // 50% of parent height
            const x = centerX + (radius * Math.cos(angle)) / 25 // Scale down for percentage
            const y = centerY + (radius * Math.sin(angle)) / 25
            
            return (
              <div
                key={planet.id}
                className="absolute group cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handlePlanetClick(planet)}
              >
                {/* Planet image */}
                <div className="relative">
                  <img
                    src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                    alt={planet?.type?.name || 'Planet'}
                    className={cn(
                      "w-56 h-56 object-contain filter drop-shadow-2xl transition-all duration-300",
                      "group-hover:scale-125",
                      getPlanetGlowColor(planet?.type?.slug),
                      "group-hover:brightness-125",
                      clickedPlanetId === planet.id && "planet-click-animate"
                    )}
                    style={{ imageRendering: 'auto' }}
                    onError={() => {
                      console.error('Planet image failed to load:', planet?.type?.slug)
                    }}
                  />
                  
                  {/* Planet name */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-full text-center mt-2">
                    <h3 className="text-base font-heading glow-cyan truncate">{planet.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {formatCoordinate(planet.coordinate)}
                    </p>
                  </div>
                </div>

                {/* Hover stats parallelogram box */}
                <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-72">
                  <div className="parallelogram-box bg-background/95 backdrop-blur-sm border border-cyan-500/30 p-4 shadow-xl">
                    <div className="space-y-1 max-w-[180px] mr-[30px] ml-auto">
                      <div className="text-xs font-semibold text-foreground mb-1">
                        {planet.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">T:</span>
                        <span className="text-xs font-mono text-tellerium">{formatResource(planet.tellerium_balance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">K:</span>
                        <span className="text-xs font-mono text-krypton">{formatResource(planet.krypton_balance)}</span>
                      </div>
                      <div className="pt-1 border-t border-border/50">
                        <span className="text-xs text-muted-foreground capitalize">{planet.type?.name || planet.type?.slug}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

