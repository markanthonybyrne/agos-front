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
import { useAuth } from '@/hooks/useAuth'
import { parseCoordinate } from '@/lib/coordinates'

export function PlanetsList() {
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const { empire } = useAuth()
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

  const handleGalaxyMapClick = () => {
    // Find homeworld planet
    const homeworld = planets.find(p => p.id === empire?.homeworld_planet_id)
    
    if (homeworld) {
      const coord = parseCoordinate(homeworld.coordinate)
      if (coord) {
        // Navigate to map with homeworld galaxy coordinates
        navigate(`/map?quadrant=${coord.quadrant}&sector=${coord.sector}&galaxy=${coord.galaxy}`)
        return
      }
    }
    
    // Fallback to default map view
    navigate('/map')
  }

  // Generate random asteroid clusters
  const generateAsteroids = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      // Random positions across the viewable area
      const clusterX = Math.random() * 200 - 100 // -100% to 100% (centered at 0)
      const clusterY = Math.random() * 200 - 100
      const clusterSize = 3 + Math.random() * 3 // 3-6 asteroids per cluster
      
      return {
        id: `asteroid-${i}`,
        x: clusterX,
        y: clusterY,
        count: Math.floor(clusterSize),
        offsetX: (Math.random() - 0.5) * 5, // Spread within cluster
        offsetY: (Math.random() - 0.5) * 5,
      }
    })
  }
  
  const asteroids = generateAsteroids(8) // 8 clusters of asteroids

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
        <div className="panel-glass surface-gradient border-border/20 px-6 py-4 backdrop-blur-md rounded-lg">
          <h1 className="text-2xl font-heading glow-cyan mb-2">Planet Command</h1>
          <p className="text-lg text-muted-foreground">Select a planet to access its console</p>
        </div>
        <Button onClick={handleGalaxyMapClick} variant="outline" size="lg">
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
                        {planet.type?.description && (
                          <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-1">{planet.type.description}</p>
                        )}
                  </div>
                </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Asteroid clusters */}
          {asteroids.map((cluster) => (
            <div
              key={cluster.id}
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${cluster.x}%), calc(-50% + ${cluster.y}%))`,
              }}
            >
              {Array.from({ length: cluster.count }).map((_, i) => (
                <img
                  key={`${cluster.id}-${i}`}
                  src="/assets/images/planets/asteroid.png"
                  alt="Asteroid"
                  className="absolute opacity-60"
                  style={{
                    width: `${8 + Math.random() * 4}px`,
                    height: `${8 + Math.random() * 4}px`,
                    left: `${i * cluster.offsetX}px`,
                    top: `${i * cluster.offsetY}px`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

