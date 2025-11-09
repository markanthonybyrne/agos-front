import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useGetMapQuery, useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { getPlanetRegionAndSystem } from '@/lib/galaxyUtils'
import { SystemViewMemo, BASE_ORBIT_RADIUS, ORBIT_SPACING } from './SystemView'
import { SystemData } from '@/lib/systemUtils'
import { getPlanetXY, parseCoordinate } from '@/lib/coordinates'
import { Planet } from '@/types/api.types'
import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
// import { Loader } from '@/components/ui/loader' // Replaced with blurred glass overlay
import { WarpTransition } from './WarpTransition'
import { PlanetZoomView } from './PlanetZoomView'
import { PlanetHexGridView } from './PlanetHexGridView'
import { useAuth } from '@/hooks/useAuth'
import { getAvatarUrl } from '@/lib/avatar'

/**
 * SystemViewScreen - Detailed system view screen
 * 
 * Shows a detailed view of a specific system with:
 * - Central star (sol)
 * - Orbit rings for each planet
 * - Planets positioned in orbits
 * - Planet hover/click interactions
 * 
 * Navigated to from galaxy map by clicking a system.
 */
export function SystemViewScreen() {
  const { region, system } = useParams<{ region: string; system: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const { empire } = useAuth()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [showWarp, setShowWarp] = useState(true)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [zoomedPlanet, setZoomedPlanet] = useState<Planet | null>(null)
  
  // Fetch visibility data for fog of war
  const { data: visibilityData } = useGetVisibilityQuery()
  const playerAvatarUrl = useMemo(() => getAvatarUrl(empire?.avatar_url || empire?.avatar_path), [empire?.avatar_url, empire?.avatar_path])
  
  const regionNum = region ? parseInt(region, 10) : null
  const systemNum = system ? parseInt(system, 10) : null
  
  // Show warp animation on mount
  useEffect(() => {
    setShowWarp(true)
  }, [])
  
  // Fetch planets for this system
  // Note: Remove limit or set it very high to ensure we get all planets in the system
  const { data: mapData, isLoading } = useGetMapQuery({
    region: regionNum || undefined,
    system: systemNum || undefined,
    limit: 10000 // Increased limit to ensure we get all planets
  })
  
  // Convert galaxy system data to SystemView format
  const systemViewData = useMemo(() => {
    if (!mapData?.planets || !regionNum || !systemNum) {
      console.debug('[SystemViewScreen] Missing data:', {
        hasPlanets: !!mapData?.planets,
        planetsCount: mapData?.planets?.length || 0,
        regionNum,
        systemNum
      })
      return null
    }
    
    // Filter planets for this specific system
    const systemPlanets = mapData.planets.filter(planet => {
      const { region: pRegion, system: pSystem } = getPlanetRegionAndSystem(planet)
      return pRegion === regionNum && pSystem === systemNum
    })
    
    // Log planet data structure to debug missing fields
    if (systemPlanets.length > 0) {
      console.log('[SystemViewScreen] Sample planet from map query:', {
        firstPlanet: systemPlanets[0],
        hasId: !!systemPlanets[0].id,
        hasOwnerId: systemPlanets[0].owner_empire_id !== undefined,
        allKeys: Object.keys(systemPlanets[0]),
        state: systemPlanets[0].state
      })
    }
    
    console.debug('[SystemViewScreen] Planet filtering:', {
      totalPlanetsFetched: mapData.planets.length,
      systemPlanetsFound: systemPlanets.length,
      targetRegion: regionNum,
      targetSystem: systemNum,
      samplePlanets: mapData.planets.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        coordinate: p.coordinate,
        regionAndSystem: getPlanetRegionAndSystem(p),
        x: p.x,
        y: p.y
      })),
      systemPlanetsDetails: systemPlanets.map(p => ({
        id: p.id,
        name: p.name,
        coordinate: p.coordinate,
        x: p.x,
        y: p.y
      }))
    })
    
    if (systemPlanets.length === 0) {
      console.warn('[SystemViewScreen] No planets found for system:', {
        region: regionNum,
        system: systemNum,
        totalPlanets: mapData.planets.length
      })
      return null
    }
    
    // Calculate system center
    const validPositions = systemPlanets
      .map(p => getPlanetXY(p))
      .filter((xy): xy is { x: number; y: number } => xy !== null)
    
    console.debug('[SystemViewScreen] Position calculation:', {
      totalSystemPlanets: systemPlanets.length,
      validPositions: validPositions.length,
      planetsWithoutXY: systemPlanets.filter(p => !getPlanetXY(p)).map(p => ({
        id: p.id,
        name: p.name,
        coordinate: p.coordinate,
        x: p.x,
        y: p.y
      }))
    })
    
    if (validPositions.length === 0) {
      console.warn('[SystemViewScreen] No valid planet positions found')
      return null
    }
    
    const xs = validPositions.map(p => p.x)
    const ys = validPositions.map(p => p.y)
    const center = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2
    }
    const maxRadius = BASE_ORBIT_RADIUS + Math.max(systemPlanets.length - 1, 0) * ORBIT_SPACING
    const orbitMargin = maxRadius + 220
    
    // Create SystemData for SystemView component
    // We need to adapt to the old format for compatibility
    const firstPlanet = systemPlanets[0]
    const coord = parseCoordinate(firstPlanet.coordinate)
    
    // Create a SystemData object compatible with SystemView
    // Use dummy quadrant/sector/galaxy values since we're using region/system
    const systemData: SystemData = {
      key: `${regionNum}:${systemNum}`,
      quadrant: 1, // Dummy value
      sector: 1,   // Dummy value
      galaxy: regionNum, // Use region as galaxy for compatibility
      system: systemNum,
      center,
      bounds: {
        x_min: center.x - orbitMargin,
        x_max: center.x + orbitMargin,
        y_min: center.y - orbitMargin,
        y_max: center.y + orbitMargin
      },
      planets: systemPlanets,
      galaxy_name: firstPlanet.region_name || null,
      system_name: firstPlanet.system_name || null
    }
    
    return systemData
  }, [mapData, regionNum, systemNum])
  
  // Handle planet click - show hex grid for owned planets, zoom view for others
  const handlePlanetClick = (planet: Planet) => {
    console.log('[SystemViewScreen] Planet clicked - full planet object:', planet)
    console.log('[SystemViewScreen] Planet clicked:', {
      planetId: planet.id,
      planetName: planet.name,
      ownerId: planet.owner_empire_id,
      empireId: empire?.id,
      state: planet.state,
      isOwned: planet.owner_empire_id === empire?.id,
      isHomeworldOrColony: planet.state === 'homeworld' || planet.state === 'colony',
      allKeys: Object.keys(planet),
      coordinate: planet.coordinate,
      coordinateType: typeof planet.coordinate
    })
    setZoomedPlanet(planet)
  }
  
  // Handle closing zoom/hex grid view
  const handleCloseZoom = () => {
    setZoomedPlanet(null)
  }
  
  // Check if planet is owned by player (homeworld or colony)
  // Note: If owner_empire_id is missing from map data, we can infer ownership from state
  const isPlanetOwned = (planet: Planet) => {
    // If we have owner_empire_id, use it
    if (planet.owner_empire_id !== undefined) {
      const owned = planet.owner_empire_id === empire?.id && 
             (planet.state === 'homeworld' || planet.state === 'colony')
      console.log('[SystemViewScreen] isPlanetOwned check (with owner_empire_id):', {
        planetId: planet.id,
        ownerId: planet.owner_empire_id,
        empireId: empire?.id,
        state: planet.state,
        owned
      })
      return owned
    }
    
    // Fallback: if state is homeworld or colony, assume it might be owned
    // We'll need to fetch full planet data to be sure
    const mightBeOwned = planet.state === 'homeworld' || planet.state === 'colony'
    console.log('[SystemViewScreen] isPlanetOwned check (fallback - no owner_empire_id):', {
      planetId: planet.id,
      state: planet.state,
      mightBeOwned,
      note: 'Will need to fetch full planet data to confirm ownership'
    })
    
    // For now, if it's homeworld or colony, show hex grid
    // The PlanetHexGridView will handle fetching full planet data
    return mightBeOwned
  }
  
  // Handle loading overlay fade-out
  useEffect(() => {
    if (!isLoading && showLoadingOverlay) {
      // Start fade-out animation
      setIsFadingOut(true)
      // Remove overlay after fade-out animation completes
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false)
        setIsFadingOut(false)
      }, 600) // Wait for fade-out animation (500ms) + small buffer
      return () => clearTimeout(timer)
    } else if (isLoading) {
      // Show overlay when loading starts
      setIsFadingOut(false)
      setShowLoadingOverlay(true)
    }
  }, [isLoading, showLoadingOverlay])

  // Auto-open planet view if planet ID is in query params
  useEffect(() => {
    const planetIdParam = searchParams.get('planet')
    if (planetIdParam && systemViewData?.planets && !zoomedPlanet) {
      const planetId = parseInt(planetIdParam, 10)
      const planet = systemViewData.planets.find(p => p.id === planetId)
      if (planet) {
        // Small delay to allow system view to render first
        setTimeout(() => {
          setZoomedPlanet(planet)
          // Remove query param from URL
          const newSearchParams = new URLSearchParams(searchParams)
          newSearchParams.delete('planet')
          navigate(`/map/system/${region}/${system}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { replace: true })
        }, 500)
      }
    }
  }, [searchParams, systemViewData, zoomedPlanet, navigate, region, system])
  
  if (!systemViewData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <p className="text-muted-foreground mb-4">System not found</p>
        <Button onClick={() => navigate('/map')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Galaxy Map
        </Button>
      </div>
    )
  }
  
  return (
    <>
      {/* Blurred glass overlay while loading - fades out when complete */}
      {showLoadingOverlay && (
        <div
          className="fixed inset-0 z-[10000] pointer-events-none"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: isFadingOut ? 'fadeOutGlass 0.5s ease-out forwards' : 'fadeInGlass 0.3s ease-out forwards',
          }}
        />
      )}
      
      {/* Frosted glass blur overlay - creates glass effect on background */}
      {showWarp && (
        <div
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            animation: 'fadeInBlur 0.4s ease-out forwards',
          }}
        />
      )}
      
      {/* Zoom animation wrapper - system view content zooms in */}
      <div 
        className="fixed inset-0 overflow-hidden"
        style={{ 
          backgroundColor: 'transparent',
          zIndex: showWarp ? 9999 : 0,
          animation: showWarp ? `zoomInFocus 800ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards` : 'none',
          transformOrigin: 'center center',
        }}
      >
        {/* Transition completion handler */}
        {showWarp && (
          <WarpTransition
            duration={800}
            onComplete={() => setShowWarp(false)}
            className="hidden"
          />
        )}
        
        {/* SVG system view */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            width: '100%',
            height: '100%',
          }}
          viewBox={`0 0 ${systemViewData.bounds.x_max - systemViewData.bounds.x_min + 200} ${systemViewData.bounds.y_max - systemViewData.bounds.y_min + 200}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${100 - systemViewData.bounds.x_min}, ${100 - systemViewData.bounds.y_min})`}>
            <SystemViewMemo
              system={systemViewData}
              scale={1.5}
              normalizedZoom={0.8}
              detailLevel="full"
              onPlanetClick={handlePlanetClick}
              onPlanetHover={setHoveredPlanet}
              hoveredPlanet={hoveredPlanet}
              systemName={systemViewData.system_name}
              visibilityData={visibilityData}
              playerEmpireId={empire?.id}
              playerAvatarUrl={playerAvatarUrl ?? undefined}
            />
          </g>
        </svg>
      </div>
      <div className="fixed bottom-6 right-6 z-10 max-w-xs sm:max-w-md">
        <div className="panel-glass surface-gradient border border-cyan-500/40 card-glow p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-right sm:text-left">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50 mb-1">
              Sector Intel
            </p>
            <h2 className="text-lg font-semibold text-white">
              {systemViewData.system_name || `System ${regionNum}:${systemNum}`}
            </h2>
            <p className="text-xs text-white/60 font-mono">
              {systemViewData.galaxy_name || `Region ${regionNum}`}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/map')}
            className="self-end sm:self-start border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/15"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Galaxy
          </Button>
        </div>
      </div>
      
      {/* Planet view - hex grid for owned planets, zoom view for others */}
      {zoomedPlanet && (
        isPlanetOwned(zoomedPlanet) ? (
          <PlanetHexGridView
            planet={zoomedPlanet}
            onClose={handleCloseZoom}
          />
        ) : (
          <PlanetZoomView
            planet={zoomedPlanet}
            onClose={handleCloseZoom}
          />
        )
      )}
      
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInGlass {
          from {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
            opacity: 0;
          }
          to {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background-color: rgba(0, 0, 0, 0.5);
            opacity: 1;
          }
        }
        
        @keyframes fadeOutGlass {
          from {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background-color: rgba(0, 0, 0, 0.5);
            opacity: 1;
          }
          to {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
            opacity: 0;
          }
        }
        
        @keyframes fadeInBlur {
          from {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background-color: rgba(0, 0, 0, 0.4);
          }
        }
        
        @keyframes zoomInFocus {
          0% {
            opacity: 0;
            transform: scale(0.2);
            filter: blur(25px);
          }
          30% {
            opacity: 0.5;
            filter: blur(15px);
          }
          60% {
            opacity: 0.8;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
        }
      `}</style>
    </>
  )
}
