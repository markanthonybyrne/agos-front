import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCoordinate } from '@/lib/coordinates'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { getPlanetImage } from '@/lib/planetImages'
import { formatResource } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Planet } from '@/types/api.types'
import { useAuth } from '@/hooks/useAuth'
import { PlanetTechProgressGauge } from '@/components/planets/PlanetTechProgressGauge'
import { PlanetHexGridView } from '@/components/map/PlanetHexGridView'
import { Badge } from '@/components/ui/badge'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

export function PlanetsList() {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [hexPlanet, setHexPlanet] = useState<Planet | null>(null)
  const { data, isLoading, error } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  // All hooks must be called before any early returns
  const planetsRaw = Array.isArray(data?.planets) ? data.planets : []
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollIndicators, setShowScrollIndicators] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [activePlanetIndex, setActivePlanetIndex] = useState(0)

  const PLANET_CARD_WIDTH = 280
  const PLANET_GAP = 64
  const SLOT_WIDTH = PLANET_CARD_WIDTH + PLANET_GAP

  // Sort planets to put homeworld in the center
  const sortedPlanets = useMemo(() => {
    if (planetsRaw.length === 0) return []
    
    const homeworldId = empire?.homeworld_planet_id
    const homeworld = planetsRaw.find(p => p.id === homeworldId || p.state === 'homeworld')
    const otherPlanets = planetsRaw.filter(p => p.id !== homeworldId && p.state !== 'homeworld')
    
    if (!homeworld) {
      // No homeworld found, return planets as-is
      return planetsRaw
    }
    
    // Place homeworld in the center
    const centerIndex = Math.floor(planetsRaw.length / 2)
    const before = otherPlanets.slice(0, centerIndex)
    const after = otherPlanets.slice(centerIndex)
    
    return [...before, homeworld, ...after]
  }, [planetsRaw, empire?.homeworld_planet_id])

  useEffect(() => {
    if (sortedPlanets.length === 0) return
    const homeworldId = empire?.homeworld_planet_id
    const homeworldIndex = sortedPlanets.findIndex(
      (p) => p.id === homeworldId || p.state === 'homeworld'
    )
    setActivePlanetIndex(homeworldIndex >= 0 ? homeworldIndex : 0)
  }, [sortedPlanets, empire?.homeworld_planet_id])

  // Check if scrolling is needed and update scroll indicators
  useEffect(() => {
    if (isLoading || error) return // Skip if loading or error
    const container = scrollContainerRef.current
    if (!container) return

    const checkScrollability = () => {
      const canScroll = container.scrollWidth > container.clientWidth
      const scrollLeft = container.scrollLeft
      const maxScroll = container.scrollWidth - container.clientWidth
      
      // Check if user can scroll in either direction
      setCanScrollLeft(scrollLeft > 10) // 10px threshold for smooth UX
      setCanScrollRight(scrollLeft < maxScroll - 10)

      if (sortedPlanets.length > 0) {
        const containerCenter = scrollLeft + container.clientWidth / 2
        const index = Math.round(containerCenter / SLOT_WIDTH)
        const clampedIndex = Math.min(sortedPlanets.length - 1, Math.max(0, index))
        setActivePlanetIndex(clampedIndex)
      }
      
      // Only show indicators if scrolling is needed
      if (!canScroll) {
        setShowScrollIndicators(false)
      } else if (!hasScrolled) {
        // On initial load, show indicators on both sides if scrolling is possible
        // This helps users know they can scroll even if homeworld is centered
        setCanScrollLeft(true)
        setCanScrollRight(true)
      }
    }

    // Delay check to allow layout to settle (after homeworld centering)
    const timeoutId = setTimeout(() => {
      checkScrollability()
    }, 600) // Wait for homeworld scroll animation to complete
    
    // Check on scroll
    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true)
      }
      checkScrollability()
    }
    
    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', checkScrollability)
    
    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [sortedPlanets, hasScrolled, isLoading, error])

  // Scroll to center homeworld on mount
  useEffect(() => {
    if (isLoading || error || sortedPlanets.length === 0 || !scrollContainerRef.current) return
    
    const homeworldId = empire?.homeworld_planet_id
    const homeworldIndex = sortedPlanets.findIndex(p => p.id === homeworldId || p.state === 'homeworld')
    
    if (homeworldIndex >= 0) {
      // Calculate scroll position to center the homeworld
      const container = scrollContainerRef.current
      const planetWithGap = SLOT_WIDTH
      
      // Calculate the position of the homeworld
      const homeworldPosition = homeworldIndex * planetWithGap
      
      // Center it in the viewport
      const scrollPosition = homeworldPosition - (container.clientWidth / 2) + (PLANET_CARD_WIDTH / 2)
      
      // Scroll to center
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      })
    }
  }, [sortedPlanets, empire?.homeworld_planet_id, isLoading, error])

  // Hide scroll indicators after user starts scrolling or after 5 seconds
  useEffect(() => {
    if (isLoading || error || !showScrollIndicators) return

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setShowScrollIndicators(false)
    }, 5000)

    // Hide immediately if user has scrolled
    if (hasScrolled) {
      setShowScrollIndicators(false)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [showScrollIndicators, hasScrolled, isLoading, error])

  // Early returns after all hooks
  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="flex gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-64" />
          ))}
        </div>
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

  if (sortedPlanets.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <Card className="panel-glass border-cyan/20">
          <CardContent className="pt-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No planets owned</p>
            <Button onClick={() => navigate('/map')}>Explore Universe</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePlanetClick = (planet: Planet) => {
    setHexPlanet(planet)
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

  const scrollToPlanet = (index: number) => {
    if (sortedPlanets.length === 0) return
    const container = scrollContainerRef.current
    if (!container) return
    if (!hasScrolled) {
      setHasScrolled(true)
    }
    const clampedIndex = Math.min(sortedPlanets.length - 1, Math.max(0, index))
    const target =
      clampedIndex * SLOT_WIDTH - container.clientWidth / 2 + PLANET_CARD_WIDTH / 2

    container.scrollTo({
      left: Math.max(0, target),
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main Content Area - Horizontal Planet Display */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 pb-20">
        {!hasScrolled && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 panel-glass surface-gradient border border-cyan/30 bg-[rgba(8,14,23,0.85)] px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <ChevronLeft className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.32em] text-cyan-200">
              Scroll horizontally to browse your worlds
            </span>
            <ChevronRight className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
        )}
        {/* Scroll Indicators - Show if scrolling is possible */}
        {showScrollIndicators && (canScrollLeft || canScrollRight) && (
          <>
            {/* Left Scroll Indicator */}
            {canScrollLeft && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 pointer-events-none transition-opacity duration-500">
                <div className="flex flex-col items-center gap-2 animate-pulse">
                  <ChevronLeft className="w-8 h-8 text-green-400 drop-shadow-lg" style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))',
                  }} />
                  <div className="text-xs text-green-400 glow-green font-semibold uppercase tracking-wider">
                    Scroll
                  </div>
                </div>
              </div>
            )}

            {/* Right Scroll Indicator */}
            {canScrollRight && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 pointer-events-none transition-opacity duration-500">
                <div className="flex flex-col items-center gap-2 animate-pulse">
                  <ChevronRight className="w-8 h-8 text-green-400 drop-shadow-lg" style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))',
                  }} />
                  <div className="text-xs text-green-400 glow-green font-semibold uppercase tracking-wider">
                    Scroll
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-center gap-16 px-8 overflow-x-auto w-full h-full scroll-smooth"
        >
          {sortedPlanets.map((planet) => {
            const isHomeworld = planet.id === empire?.homeworld_planet_id || planet.state === 'homeworld'
            
            return (
              <div
                key={planet.id}
                className="group flex-shrink-0 transition-all duration-300 relative"
                style={{
                  width: `${PLANET_CARD_WIDTH}px`,
                }}
              >
                {/* Homeworld Indicator - Techy Green Pointer */}
                {isHomeworld && (
                  <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="relative flex flex-col items-center">
                      {/* "Homeworld" Label */}
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-green-400 glow-green uppercase tracking-wider">
                          Homeworld
                        </span>
                      </div>
                      
                      {/* Pointer Arrow */}
                      <div className="relative">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          className="drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))',
                          }}
                        >
                          <defs>
                            <linearGradient id={`homeworld-gradient-${planet.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.95)" />
                              <stop offset="50%" stopColor="rgba(34, 197, 94, 0.8)" />
                              <stop offset="100%" stopColor="rgba(22, 163, 74, 0.95)" />
                            </linearGradient>
                            <filter id={`homeworld-glow-${planet.id}`}>
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          {/* Arrow pointing down - techy style */}
                          <path
                            d="M 16 4 L 24 20 L 20 20 L 20 28 L 12 28 L 12 20 L 8 20 Z"
                            fill={`url(#homeworld-gradient-${planet.id})`}
                            stroke="rgba(34, 197, 94, 1)"
                            strokeWidth="1.5"
                            filter={`url(#homeworld-glow-${planet.id})`}
                          />
                        </svg>
                        
                        {/* Pulsing glow effect */}
                        <div 
                          className="absolute inset-0 -z-10 flex items-center justify-center"
                          style={{
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        >
                          <div className="w-8 h-8 bg-green-500/40 rounded-full blur-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Panel Above Planet */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-8 w-full z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="panel-glass surface-gradient border border-border/30 backdrop-blur-md p-4 card-glow">
                    <div className="space-y-2">
                      <div className="text-center">
                        <h3 className="text-lg font-heading glow-cyan truncate mb-1">
                          {planet.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatCoordinate(planet.coordinate)}
                        </p>
                      </div>
                      
                      {planet.type && (
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {planet.type.name}
                          </Badge>
                          {planet.state && (
                            <Badge variant="outline" className="capitalize text-xs">
                              {planet.state}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getTelleriumImage()}
                            alt="Tellerium"
                            className="w-3 h-3 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-xs font-mono text-tellerium">
                            {formatResource(planet.tellerium_balance || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img
                            src={getKryptonImage()}
                            alt="Krypton"
                            className="w-3 h-3 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-xs font-mono text-krypton">
                            {formatResource(planet.krypton_balance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planet Container with Tech Progress Gauge */}
                <div
                  className="relative cursor-pointer transition-all duration-300 group-hover:scale-105"
                  onClick={() => handlePlanetClick(planet)}
                >
                  {/* Tech Progress Gauge - Positioned above planet */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <PlanetTechProgressGauge
                      planetId={planet.id}
                      size={280}
                    />
                  </div>

                  {/* Planet Image Container */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="relative">
                      <img
                        src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                        alt={planet?.type?.name || 'Planet'}
                        className={cn(
                          "w-64 h-64 object-contain filter drop-shadow-2xl transition-all duration-300",
                          "group-hover:scale-110 group-hover:brightness-125",
                          getPlanetGlowColor(planet?.type?.slug),
                        )}
                        style={{ imageRendering: 'auto' }}
                        onError={() => {
                          console.error('Planet image failed to load:', planet?.type?.slug)
                        }}
                      />
                    </div>
                  </div>

                  {/* Planet Name Below */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-full text-center">
                    <h3 className="text-base font-heading glow-cyan truncate">{planet.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {formatCoordinate(planet.coordinate)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {sortedPlanets.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-border/40 bg-[rgba(8,14,23,0.85)] px-4 py-2 shadow-lg backdrop-blur-md">
          {sortedPlanets.map((planet, index) => {
            const isActive = index === activePlanetIndex
            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => scrollToPlanet(index)}
                className={cn(
                  'relative h-2 w-8 rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                    : 'bg-border/60 hover:bg-border/80'
                )}
                aria-label={`Focus ${planet.name}`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full border border-cyan-200/70 animate-ping" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {hexPlanet && (
        <PlanetHexGridView
          planet={hexPlanet}
          onClose={() => setHexPlanet(null)}
      />
      )}
    </div>
  )
}
