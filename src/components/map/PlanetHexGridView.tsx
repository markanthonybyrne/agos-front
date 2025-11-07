import { useRef, useEffect, useMemo } from 'react'
import { Planet } from '@/types/api.types'
import { GeodesicGrid } from '@/components/planet/GeodesicGrid'
import { usePanel } from '@/components/common/PanelManager'
import { getPlanetImage, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { useGetPlanetQuery, useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useAuth } from '@/hooks/useAuth'
import { formatCoordinate } from '@/lib/coordinates'
import { usePlanetImageScale } from '@/hooks/usePlanetImageScale'
import { PlanetActionWheel } from './PlanetActionWheel'
import { Button } from '@/components/ui/button'

interface PlanetHexGridViewProps {
  planet: Planet
  onClose: () => void
}

/**
 * Separate component for planet image to allow hook usage
 */
function PlanetImageWithScale({ planet }: { planet: Planet }) {
  // Get planet image
  let planetSlug = planet.type?.slug
  if (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
      planetSlug === 'sol_massive' || planetSlug === 'sol-massive') {
    planetSlug = undefined
  }
  
  let planetImage: string | undefined
  if (planetSlug === 'asteroid' || planetSlug === 'asteroid_belt' || planetSlug === 'asteroid-belt') {
    planetImage = getRandomAsteroidImageForPlanet(planet.coordinate)
  } else {
    planetImage = getPlanetImage(planetSlug)
  }
  
  // Analyze image to determine optimal scaling - hook must be called unconditionally
  // Use 730px as both target size and reference to ensure planets fill the space
  const { scale, offsetX, offsetY, isLoading: isAnalyzing } = usePlanetImageScale(planetImage, 730, 730)
  
  if (!planetImage) return null
  
  return (
    <div 
      className="relative flex items-center justify-center" 
      style={{ 
        zIndex: 1,
        width: '730px',
        height: '730px',
      }}
    >
      <div
        style={{
          width: '730px',
          height: '730px',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'auto',
          animation: 'planetAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <img
          src={planetImage}
          alt={planet.name || 'Planet'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.6))',
            transform: isAnalyzing 
              ? 'scale(1)' 
              : `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
            transformOrigin: 'center center',
            transition: isAnalyzing ? 'none' : 'transform 0.3s ease-out',
          }}
        />
      </div>
    </div>
  )
}

/**
 * PlanetHexGridView - Shows planet with hex grid overlay for owned planets
 *
 * Features:
 * - Planet image with hex grid overlay
 * - Radial action wheel for planetary operations
 * - Actions open in panels/windows
 */
export function PlanetHexGridView({ planet, onClose }: PlanetHexGridViewProps) {
  // ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL RETURNS
  const { openPanel } = usePanel()
  const { empire } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Always call hooks unconditionally - use skip to control when they run
  const needsPlanetLookup = !planet.id
  const { data: allPlanetsData, isLoading: isLoadingPlanets } = useGetPlanetsQuery(undefined, {
    skip: !needsPlanetLookup // Only fetch if we don't have an ID
  })
  
  // Find planet by coordinate if we don't have an ID
  // Use useMemo to avoid recalculating on every render
  const planetById = useMemo(() => {
    if (planet.id || !allPlanetsData?.planets || !planet.coordinate) {
      if (!planet.id && allPlanetsData?.planets) {
        console.log('[PlanetHexGridView] Cannot find planet by coordinate:', {
          hasPlanetsData: !!allPlanetsData?.planets,
          planetsCount: allPlanetsData.planets.length,
          hasCoordinate: !!planet.coordinate,
          coordinate: planet.coordinate
        })
      }
      return null
    }
    
    const planetCoord = formatCoordinate(planet.coordinate)
    console.log('[PlanetHexGridView] Looking for planet with coordinate:', planetCoord)
    
    const found = allPlanetsData.planets.find(p => {
      const pCoord = formatCoordinate(p.coordinate)
      const matches = pCoord === planetCoord
      if (matches) {
        console.log('[PlanetHexGridView] Found planet by coordinate:', {
          planetId: p.id,
          planetName: p.name,
          coordinate: pCoord
        })
      }
      return matches
    })
    
    if (!found) {
      console.warn('[PlanetHexGridView] Planet not found by coordinate:', {
        searchCoord: planetCoord,
        sampleCoords: allPlanetsData.planets.slice(0, 5).map(p => formatCoordinate(p.coordinate))
      })
    }
    
    return found || null
  }, [planet.id, planet.coordinate, allPlanetsData?.planets])
  
  // Use planet found by coordinate, or try to fetch by ID
  const planetToFetch = planet.id || planetById?.id || 0
  
  // Always call the hook, use skip to control execution
  const { data: planetData, isLoading: isLoadingPlanet } = useGetPlanetQuery(planetToFetch, {
    skip: !planetToFetch
  })
  
  // Use full planet data if available, otherwise use planet found by coordinate, otherwise use passed planet
  const displayPlanet = planetData?.planet || planetById || planet
  
  // Close on escape - must be after all hooks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  console.log('[PlanetHexGridView] Rendering for planet:', {
    planetId: planet.id,
    planetByIdId: planetById?.id,
    displayPlanetId: displayPlanet.id,
    planetName: planet.name,
    displayPlanetName: displayPlanet.name,
    ownerId: planet.owner_empire_id,
    displayOwnerId: displayPlanet.owner_empire_id,
    empireId: empire?.id,
    state: planet.state,
    hasPlanetData: !!planetData?.planet,
    foundByCoordinate: !!planetById,
    isLoadingPlanets,
    isLoadingPlanet,
    planetToFetch
  })
  
  // NOW we can do conditional returns AFTER all hooks
  // Show loading state while fetching planet data
  if ((!planet.id && isLoadingPlanets) || (planetToFetch && isLoadingPlanet)) {
    return (
      <div className="fixed inset-0 z-[10002] flex items-center justify-center">
        <div className="text-white">Loading planet data...</div>
      </div>
    )
  }
  
  // Don't render if we don't have a planet ID (can't show hex grid without it)
  if (!displayPlanet.id) {
    console.warn('[PlanetHexGridView] No planet ID available, cannot render hex grid. Planet:', planet)
    return (
      <div className="fixed inset-0 z-[10002] flex items-center justify-center">
        <div className="text-white">Unable to load planet data. Missing planet ID.</div>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    )
  }
  
  
  return (
    <>
      {/* Custom animations */}
      <style>{`
        @keyframes planetAppear {
          0% {
            opacity: 0;
            transform: scale(0.3);
            filter: blur(20px);
          }
          60% {
            opacity: 1;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }
        
        @keyframes hexGridAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes hexGridPulse {
          0% {
            stroke: rgba(255, 255, 255, 0.7);
            filter: drop-shadow(0 0 0px rgba(34, 211, 238, 0));
          }
          25% {
            stroke: rgba(34, 211, 238, 1);
            filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.8));
          }
          50% {
            stroke: rgba(34, 211, 238, 0.9);
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 1));
          }
          75% {
            stroke: rgba(34, 211, 238, 0.8);
            filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.6));
          }
          100% {
            stroke: rgba(255, 255, 255, 0.7);
            filter: drop-shadow(0 0 0px rgba(34, 211, 238, 0));
          }
        }
        
        .hex-grid-line {
          animation: hexGridPulse 2s ease-in-out;
        }
      `}</style>
      
      {/* Glass blur overlay */}
      <div
        className="fixed inset-0 z-[10001] pointer-events-auto"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          animation: 'fadeInGlass 0.4s ease-out forwards',
        }}
        onClick={onClose}
      />
      
      {/* Planet hex grid view container */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[10002] pointer-events-none flex items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Planet with hex grid overlay */}
        <div 
          className="relative flex items-center justify-center w-full h-full"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Planet image - behind hex grid, fixed size to match grid */}
          <PlanetImageWithScale planet={planet} />
          
          {/* Geodesic grid overlay - wraps around planet in 3D */}
          {displayPlanet.id && (
            <GeodesicGrid planetId={displayPlanet.id} planetSize={730} />
          )}
        </div>
      </div>
      
      {/* Planetary action wheel */}
      <PlanetActionWheel
        planet={displayPlanet}
        className="fixed bottom-6 left-6 z-[10003]"
        openPanel={openPanel}
      />
      
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInGlass {
          from {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </>
  )
}

