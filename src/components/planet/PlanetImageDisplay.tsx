import { getPlanetImage } from '@/lib/planetImages'
import { cn } from '@/lib/utils'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource, formatNumber } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { GeodesicGrid } from './GeodesicGrid'
import { useState, useEffect, useRef } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [planetSize, setPlanetSize] = useState(800)
  
  const { data: planetData, isLoading } = useGetPlanetQuery(planetId, {
    skip: !planetId,
  })

  // Calculate responsive planet size based on viewport
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current.parentElement
        if (container) {
          const containerWidth = container.clientWidth
          const containerHeight = container.clientHeight
          // Use 90% of the smaller dimension to ensure planet fits
          const maxSize = Math.min(containerWidth, containerHeight) * 0.9
          setPlanetSize(Math.max(400, maxSize)) // Minimum 400px
        }
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

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

  // Calculate planet display size (25% larger than grid)
  const planetDisplaySize = planetSize * 1.25

  return (
    <div 
      ref={containerRef}
      className={cn("relative flex flex-col items-center justify-center h-full w-full", className)}
    >
      {/* Planet image */}
      <div className="relative flex items-center justify-center flex-1 w-full h-full">
        <img
          src={getPlanetImage(planetSlug) || getPlanetImage('arid')}
          alt={planetName}
          className={cn(
            "object-contain filter drop-shadow-2xl transition-all duration-300",
            getPlanetGlowColor(planetSlug),
            "planet-glow-animate"
          )}
          style={{ 
            imageRendering: 'auto',
            width: `${planetDisplaySize}px`,
            height: `${planetDisplaySize}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            transform: 'translateX(60px)', // Move to the right
          }}
          onError={(e) => {
            console.error('Planet image failed to load:', planetSlug)
          }}
        />
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 blur-2xl rounded-full -z-10 pointer-events-none",
          getPlanetGlowColor(planetSlug).replace('shadow-', 'bg-').replace('/50', '/20')
        )} style={{
          width: `${planetDisplaySize}px`,
          height: `${planetDisplaySize}px`,
          left: '50%',
          top: '50%',
          transform: 'translate(calc(-50% + 60px), -50%)', // Move to the right
        }} />
        {/* Geodesic grid overlay - keep original size */}
        <GeodesicGrid planetId={planetId} planetSize={planetSize} />
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
              <div>
                <Badge variant="secondary" className="capitalize">
                  {planet.type.name}
                </Badge>
                {planet?.type?.description && (
                  <p className="mt-1 text-xs text-muted-foreground italic">{planet.type.description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-4 gap-2">
          <div className="panel-glass border-tellerium/30 p-2 vignette rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <img src={getTelleriumImage()} alt="T" className="w-3 h-3" style={{ imageRendering: 'auto' }} />
              <span className="text-[10px] text-tellerium font-semibold">Tellerium</span>
            </div>
            <p className="text-lg font-mono text-tellerium glow-cyan">
              {formatResource(planet.tellerium_balance)}
            </p>
          </div>
          <div className="panel-glass border-krypton/30 p-2 vignette rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <img src={getKryptonImage()} alt="K" className="w-3 h-3" style={{ imageRendering: 'auto' }} />
              <span className="text-[10px] text-krypton font-semibold">Krypton</span>
            </div>
            <p className="text-lg font-mono text-krypton glow-blue">
              {formatResource(planet.krypton_balance)}
            </p>
          </div>
          <div className="panel-glass border-green/20 p-2 vignette rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <img src={getMineImage()} alt="Mines" className="w-3 h-3" style={{ imageRendering: 'auto' }} />
              <span className="text-[10px] text-green-400 font-semibold">Mines</span>
            </div>
            <p className="text-lg font-mono text-green-400 glow-green">
              {formatNumber(planet.mines || 0)}
            </p>
          </div>
          <div className="panel-glass border-purple/20 p-2 vignette rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <img src={getProbeImage()} alt="Probes" className="w-3 h-3" style={{ imageRendering: 'auto' }} />
              <span className="text-[10px] text-purple-400 font-semibold">Probes</span>
            </div>
            <p className="text-lg font-mono text-purple-400 glow-purple">
              {formatNumber(planet.probes || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

