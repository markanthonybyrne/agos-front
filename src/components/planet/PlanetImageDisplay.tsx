import { getPlanetImage } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

interface PlanetImageDisplayProps {
  planetId: number
  className?: string
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'
}

export function PlanetImageDisplay({ 
  planetId, 
  className,
  size = 'xxlarge' 
}: PlanetImageDisplayProps) {
  const { data: planetData, isLoading } = useGetPlanetQuery(planetId, {
    skip: !planetId,
  })

  if (isLoading || !planetData?.planet) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Skeleton className="w-[600px] h-[600px] rounded-full" />
      </div>
    )
  }

  const planet = planetData.planet
  const planetSlug = planet?.type?.slug || 'arid'
  const planetName = planet?.name || 'Planet'
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
    xlarge: 'w-96 h-96',
    xxlarge: 'w-[600px] h-[600px]',
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
    <div className={cn("relative flex flex-col items-center justify-center h-full", className)}>
      {/* Planet image */}
      <div className="relative flex items-center justify-center flex-1">
        <img
          src={getPlanetImage(planetSlug) || getPlanetImage('arid')}
          alt={planetName}
          className={cn(
            "object-contain filter drop-shadow-2xl transition-all duration-300",
            sizeClasses[size],
            getPlanetGlowColor(planetSlug),
            "planet-glow-animate"
          )}
          style={{ imageRendering: 'auto' }}
          onError={(e) => {
            console.error('Planet image failed to load:', planetSlug)
          }}
        />
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 blur-2xl rounded-full -z-10 pointer-events-none",
          getPlanetGlowColor(planetSlug).replace('shadow-', 'bg-').replace('/50', '/20')
        )} />
      </div>

      {/* Planet info overlay */}
      <div className="absolute bottom-8 left-8 right-8 space-y-4 z-[100] pointer-events-auto">
        {/* Planet name and type */}
        <div className="space-y-2">
          <h2 className="text-4xl font-heading glow-cyan">{planet.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-sm">
              {formatCoordinate(planet.coordinate)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {planet.state}
            </Badge>
            {planet?.type?.name && (
              <Badge variant="secondary" className="capitalize">
                {planet.type.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-2 gap-3">
          <div className="panel-glass border-tellerium/30 p-3 vignette rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <img src={getTelleriumImage()} alt="T" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
              <span className="text-xs text-tellerium font-semibold">Tellerium</span>
            </div>
            <p className="text-2xl font-mono text-tellerium glow-cyan">
              {formatResource(planet.tellerium_balance)}
            </p>
          </div>
          <div className="panel-glass border-krypton/30 p-3 vignette rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <img src={getKryptonImage()} alt="K" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
              <span className="text-xs text-krypton font-semibold">Krypton</span>
            </div>
            <p className="text-2xl font-mono text-krypton glow-blue">
              {formatResource(planet.krypton_balance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

