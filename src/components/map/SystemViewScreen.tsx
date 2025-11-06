import { useParams, useNavigate } from 'react-router-dom'
import { useGetMapQuery } from '@/api/endpoints/universeApi'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { getPlanetRegionAndSystem } from '@/lib/galaxyUtils'
import { SystemViewMemo } from './SystemView'
import { SystemData } from '@/lib/systemUtils'
import { getPlanetXY, parseCoordinate } from '@/lib/coordinates'
import { Planet } from '@/types/api.types'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Loader } from '@/components/ui/loader'

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
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  
  const regionNum = region ? parseInt(region, 10) : null
  const systemNum = system ? parseInt(system, 10) : null
  
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
        x_min: Math.min(...xs),
        x_max: Math.max(...xs),
        y_min: Math.min(...ys),
        y_max: Math.max(...ys)
      },
      planets: systemPlanets,
      galaxy_name: firstPlanet.region_name || null,
      system_name: firstPlanet.system_name || null
    }
    
    return systemData
  }, [mapData, regionNum, systemNum])
  
  // Handle planet click
  const handlePlanetClick = (planet: Planet) => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
      planet: planet
    })
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Loading system...
          </p>
        </div>
      </div>
    )
  }
  
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
    <div 
      className="fixed inset-0 overflow-hidden z-0"
      style={{ 
        backgroundColor: 'transparent',
      }}
    >
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          onClick={() => navigate('/map')}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Galaxy Map
        </Button>
      </div>
      
      {/* System name header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
          <h2 className="text-white text-lg font-semibold">
            {systemViewData.system_name || `System ${regionNum}:${systemNum}`}
          </h2>
          {systemViewData.galaxy_name && (
            <p className="text-white/70 text-sm">
              {systemViewData.galaxy_name}
            </p>
          )}
        </div>
      </div>
      
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
          />
        </g>
      </svg>
    </div>
  )
}
