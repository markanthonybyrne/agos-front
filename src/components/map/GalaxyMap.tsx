import { useState, useMemo, useEffect, useCallback } from 'react'
import { useGetUniverseConfigQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { useGetIncidentsQuery } from '@/api/endpoints/incidentsApi'
import { useNavigate } from 'react-router-dom'
import { buildGalaxyData, SystemData, RegionData } from '@/lib/galaxyUtils'
import { useZoomPan } from '@/hooks/useZoomPan'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/app/hooks'
import { GalaxyRegionLayer } from './GalaxyRegionLayer'
import { HyperspaceRoutesLayer } from './HyperspaceRoutesLayer'
import { SystemMarkersLayer } from './SystemMarkersLayer'
import { GalaxyMapLegend } from './GalaxyMapLegend'
import { GalacticCoreLayer } from './GalacticCoreLayer'
import { SpiralArmGuidelinesLayer } from './SpiralArmGuidelinesLayer'
import { GalacticOrbitalRingsLayer } from './GalacticOrbitalRingsLayer'
import { PlanetOrbitsLayer } from './PlanetOrbitsLayer'
import { FogOfWarLayer } from './FogOfWarLayer'
import { IncidentLayer } from '@/components/incidents/IncidentLayer'
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel'
import { Incident } from '@/types/api.types'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Home, Eye, GitBranch } from 'lucide-react'
import { GALACTIC_CORE } from '@/lib/spiralUtils'
import { getPlanetXY } from '@/lib/coordinates'

const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 2000

/**
 * GalaxyMap - Main galaxy-level map component
 * 
 * Displays the entire galaxy in viewport with:
 * - Colored region overlays
 * - Hyperspace routes (yellow lines)
 * - System markers (orange/red dots)
 * - Labels for regions and key systems
 * - Transparent background (galaxy image from app background)
 * 
 * Clicking a system navigates to a detailed system view.
 */
export function GalaxyMap() {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [hoveredSystem, setHoveredSystem] = useState<SystemData | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null)
  const [showSpiralGuidelines, setShowSpiralGuidelines] = useState(false)
  const [zoomedIntoRegion, setZoomedIntoRegion] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false) // Toggle for hyperspace routes
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null)
  
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig } = useGetUniverseConfigQuery()
  const gridWidth = configData?.grid_width || 
    (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.width : null) || 
    (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height || 
    (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.height : null) || 
    (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_HEIGHT)
  
  // Fetch all planets for galaxy map - use planets from Redux store (already loaded by InitialDataLoader)
  // Only use map query to get region/system names and structure, not planets
  const { data: mapData, isLoading: isLoadingMap } = useGetMapQuery({ 
    limit: 10000 // High limit to ensure we get all planets if needed (but prefer Redux store)
  })
  
  // Get planets from Redux store (loaded by InitialDataLoader) - this is the source of truth
  const { allPlanets: reduxPlanets, isLoaded: planetsLoaded } = useAppSelector((state) => state.planets)
  
  // Use planets from Redux store if available, otherwise fall back to mapData
  const planetsToUse = useMemo(() => {
    if (reduxPlanets.length > 0 && planetsLoaded) {
      return reduxPlanets
    }
    return mapData?.planets || []
  }, [reduxPlanets, planetsLoaded, mapData?.planets])
  
  // Fetch incidents (filtered by visibility automatically by API)
  const { data: incidentsData } = useGetIncidentsQuery()
  
  // Build galaxy data structure from planets
  // Use planets from Redux store (all 8,000+) instead of limited mapData
  const galaxyData = useMemo(() => {
    if (!planetsToUse || planetsToUse.length === 0) {
      return { regions: new Map(), systems: new Map(), systemMap: [] }
    }
    
    // Build galaxy data with region names from API response
    const regionNames = mapData?.region_names || {}
    return buildGalaxyData(planetsToUse, regionNames)
  }, [planetsToUse, mapData?.region_names])
  
  // Find the user's home system
  const homeSystem = useMemo(() => {
    if (!empire?.homeworld_planet_id || !planetsToUse || planetsToUse.length === 0) {
      return null
    }
    
    // Find the homeworld planet from Redux store (all planets) or mapData
    const homeworldPlanet = planetsToUse.find(p => p.id === empire.homeworld_planet_id)
    if (!homeworldPlanet) {
      return null
    }
    
    // Find the system containing this homeworld
    const homeSystem = galaxyData.systemMap.find(system => 
      system.planets.some(p => p.id === empire.homeworld_planet_id)
    )
    
    return homeSystem || null
  }, [empire?.homeworld_planet_id, planetsToUse, galaxyData.systemMap])
  
  // Initialize zoom/pan - start with scale to fit entire galaxy
  // Use actual window/viewport dimensions for responsive sizing
  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight }
    }
    return { width: 1920, height: 1080 }
  })
  
  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const initialScale = useMemo(() => {
    // Calculate scale based on actual viewport dimensions
    const scaleX = viewportSize.width / gridWidth
    const scaleY = viewportSize.height / gridHeight
    // Use 0.70 (70%) to zoom out significantly and ensure entire galaxy is visible with comfortable padding
    // This ensures both top and bottom of the galaxy are visible
    return Math.min(scaleX, scaleY) * 0.70
  }, [gridWidth, gridHeight, viewportSize.width, viewportSize.height])
  
  const zoomPan = useZoomPan({
    minScale: initialScale * 0.5,  // Can zoom out a bit more
    maxScale: initialScale * 8,    // Can zoom in 8x
    initialScale: initialScale,
    initialPanX: 0,  // Start centered (0,0 centers on grid center)
    initialPanY: 0,
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    enableWheelZoom: true,
    zoomSensitivity: 0.1
  })
  
  // Handle system click - navigate to system view when zoomed in enough
  const handleSystemClick = useCallback((system: SystemData) => {
    // If zoomed in enough (5x initial scale), navigate to system view
    // Otherwise, zoom to the system progressively
    const systemViewThreshold = initialScale * 5
    
    if (zoomPan.scale >= systemViewThreshold) {
      // Already zoomed in enough - navigate to system view
      navigate(`/map/system/${system.region}/${system.system}`)
    } else {
      // Zoom to system - use a progressive zoom level
      // If already somewhat zoomed, zoom more; otherwise start with moderate zoom
      const currentZoomRatio = zoomPan.scale / initialScale
      let targetScale: number
      
      if (currentZoomRatio < 2) {
        // Not very zoomed - zoom to 3x
        targetScale = initialScale * 3
      } else if (currentZoomRatio < 4) {
        // Moderately zoomed - zoom to 5x (system view threshold)
        targetScale = systemViewThreshold
      } else {
        // Close to system view - zoom to system view threshold
        targetScale = systemViewThreshold
      }
      
      // Calculate pan to center the system
      const targetPanX = (gridWidth / 2 - system.center.x) * targetScale
      const targetPanY = (gridHeight / 2 - system.center.y) * targetScale
      
      zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 500)
    }
  }, [navigate, initialScale, zoomPan, gridWidth, gridHeight])
  
  // Handle region click - zoom to region (spiral-aware positioning)
  const handleRegionClick = useCallback((region: RegionData, event: React.MouseEvent) => {
    event.stopPropagation()
    const targetScale = initialScale * 2.5 // Zoom to 2.5x to show region clearly
    
    // Calculate center from actual planet positions (spiral-aware)
    // Use planet distribution center instead of rectangular bounds center
    const planetPoints: { x: number; y: number }[] = []
    region.systems.forEach(system => {
      system.planets.forEach(planet => {
        const xy = getPlanetXY(planet)
        if (xy) {
          planetPoints.push(xy)
        }
      })
    })
    
    let centerX: number
    let centerY: number
    
    if (planetPoints.length > 0) {
      // Use actual planet distribution center
      const sumX = planetPoints.reduce((sum, p) => sum + p.x, 0)
      const sumY = planetPoints.reduce((sum, p) => sum + p.y, 0)
      centerX = sumX / planetPoints.length
      centerY = sumY / planetPoints.length
    } else {
      // Fallback to bounds center
      centerX = region.bounds.centerX
      centerY = region.bounds.centerY
    }
    
    // Calculate pan to center the region
    const targetPanX = (gridWidth / 2 - centerX) * targetScale
    const targetPanY = (gridHeight / 2 - centerY) * targetScale
    
    setZoomedIntoRegion(true) // Mark that we've zoomed into a region
    zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 600)
  }, [initialScale, zoomPan, gridWidth, gridHeight])
  
  // Reset zoomedIntoRegion when zooming out significantly
  useEffect(() => {
    const currentZoomRatio = zoomPan.scale / initialScale
    if (zoomedIntoRegion && currentZoomRatio < 1.5) {
      setZoomedIntoRegion(false)
    }
  }, [zoomPan.scale, initialScale, zoomedIntoRegion])
  
  // Reset when using reset button
  const handleReset = useCallback(() => {
    setZoomedIntoRegion(false)
    zoomPan.reset()
  }, [zoomPan])
  
  // Navigate to galactic core
  const handleNavigateToCore = useCallback(() => {
    const targetScale = initialScale * 0.8 // Slightly zoomed out to show full galaxy
    const targetPanX = (gridWidth / 2 - GALACTIC_CORE.x) * targetScale
    const targetPanY = (gridHeight / 2 - GALACTIC_CORE.y) * targetScale
    
    zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 800)
  }, [initialScale, zoomPan, gridWidth, gridHeight])
  
  // Calculate viewBox based on zoom/pan - maintain aspect ratio
  const viewBox = useMemo(() => {
    const container = zoomPan.containerRef.current
    if (!container) {
      const padding = 20
      return `${-padding} ${-padding} ${gridWidth + padding * 2} ${gridHeight + padding * 2}`
    }
    
    const rect = container.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height
    
    // Calculate visible area in grid coordinates
    const visibleWidth = containerWidth / zoomPan.scale
    const visibleHeight = containerHeight / zoomPan.scale
    
    // Calculate center point in grid coordinates
    const centerX = -zoomPan.panX / zoomPan.scale + gridWidth / 2
    const centerY = -zoomPan.panY / zoomPan.scale + gridHeight / 2
    
    // Maintain grid aspect ratio (2:1 for 2000x1000)
    const gridAspectRatio = gridWidth / gridHeight
    const containerAspectRatio = containerWidth / containerHeight
    
    let adjustedVisibleWidth = visibleWidth
    let adjustedVisibleHeight = visibleHeight
    
    // Adjust visible area to maintain grid aspect ratio
    if (containerAspectRatio > gridAspectRatio) {
      // Container is wider - adjust height to match grid aspect
      adjustedVisibleHeight = adjustedVisibleWidth / gridAspectRatio
    } else {
      // Container is taller - adjust width to match grid aspect
      adjustedVisibleWidth = adjustedVisibleHeight * gridAspectRatio
    }
    
    // Calculate viewBox bounds maintaining aspect ratio
    const minX = Math.max(0, centerX - adjustedVisibleWidth / 2)
    const maxX = Math.min(gridWidth, centerX + adjustedVisibleWidth / 2)
    const minY = Math.max(0, centerY - adjustedVisibleHeight / 2)
    const maxY = Math.min(gridHeight, centerY + adjustedVisibleHeight / 2)
    
    const width = maxX - minX
    const height = maxY - minY
    
    // Ensure aspect ratio is maintained
    const finalAspectRatio = width / height
    let finalWidth = width
    let finalHeight = height
    
    if (Math.abs(finalAspectRatio - gridAspectRatio) > 0.001) {
      if (finalAspectRatio > gridAspectRatio) {
        finalHeight = finalWidth / gridAspectRatio
      } else {
        finalWidth = finalHeight * gridAspectRatio
      }
    }
    
    // Add padding
    const padding = Math.max(finalWidth, finalHeight) * 0.1
    return `${minX - padding} ${minY - padding} ${finalWidth + padding * 2} ${finalHeight + padding * 2}`
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, gridWidth, gridHeight])

  // Calculate viewport bounds for FogOfWarLayer (from viewBox) - with padding for better culling
  const viewportBounds = useMemo(() => {
    const container = zoomPan.containerRef.current
    if (!container) {
      return { minX: 0, minY: 0, maxX: gridWidth, maxY: gridHeight }
    }
    
    const rect = container.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height
    
    // Calculate visible area in grid coordinates
    const visibleWidth = containerWidth / zoomPan.scale
    const visibleHeight = containerHeight / zoomPan.scale
    
    // Calculate center point in grid coordinates
    const centerX = -zoomPan.panX / zoomPan.scale + gridWidth / 2
    const centerY = -zoomPan.panY / zoomPan.scale + gridHeight / 2
    
    // Add padding for viewport culling (render slightly outside viewport for smooth panning)
    const padding = Math.max(visibleWidth, visibleHeight) * 0.2
    
    return {
      minX: Math.max(-padding, centerX - visibleWidth / 2 - padding),
      maxX: Math.min(gridWidth + padding, centerX + visibleWidth / 2 + padding),
      minY: Math.max(-padding, centerY - visibleHeight / 2 - padding),
      maxY: Math.min(gridHeight + padding, centerY + visibleHeight / 2 + padding),
    }
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, gridWidth, gridHeight])
  
  // Wait for planets to be loaded from Redux store before rendering map
  // This ensures we have all 8,000+ planets available
  if (isLoadingConfig || isLoadingMap || !planetsLoaded || planetsToUse.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {!planetsLoaded ? `Loading ${planetsToUse.length.toLocaleString()} planets...` : 'Loading galaxy map...'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      ref={zoomPan.containerRef}
      className="fixed inset-0 overflow-hidden z-0 cursor-grab active:cursor-grabbing"
      style={{ 
        backgroundColor: 'transparent',
      }}
      onMouseDown={zoomPan.onMouseDown}
      onMouseMove={zoomPan.onMouseMove}
      onMouseUp={zoomPan.onMouseUp}
      onWheel={zoomPan.onWheel}
      onTouchStart={zoomPan.onTouchStart}
      onTouchMove={zoomPan.onTouchMove}
      onTouchEnd={zoomPan.onTouchEnd}
    >
      {/* SVG map */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          willChange: 'transform', // GPU acceleration hint
        }}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background - transparent */}
        <rect width={gridWidth} height={gridHeight} fill="transparent" />
        
        {/* Layer 0: Spiral Arm Guidelines (optional, behind other layers) */}
        {showSpiralGuidelines && (
          <SpiralArmGuidelinesLayer
            scale={zoomPan.scale}
            panX={zoomPan.panX}
            panY={zoomPan.panY}
            minScale={initialScale * 2}
          />
        )}
        
        {/* Layer 1: Galactic Core */}
        <GalacticCoreLayer
          scale={zoomPan.scale}
          panX={zoomPan.panX}
          panY={zoomPan.panY}
          containerWidth={gridWidth}
          containerHeight={gridHeight}
          minScale={initialScale * 2}
        />
        
        {/* Layer 1.5: Galactic Orbital Rings (dashed circles around core - rendered on top) */}
        {/* Hide orbital rings when showing planet orbits (zoom level 2.5x - 4.9x) */}
        {(() => {
          const zoomRatio = zoomPan.scale / initialScale
          const showPlanetOrbits = zoomRatio >= 2.5 && zoomRatio < 4.9
          if (showPlanetOrbits) return null
          return (
            <GalacticOrbitalRingsLayer
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              scale={zoomPan.scale}
              minScale={initialScale * 3}
            />
          )
        })()}
        
        {/* Layer 2: Region Overlays */}
        <GalaxyRegionLayer 
          regions={galaxyData.regions}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          onRegionClick={handleRegionClick}
          onRegionHover={setHoveredRegion}
          hoveredRegion={hoveredRegion}
          viewportBounds={viewportBounds}
        />
        
        {/* Layer 3: Hyperspace Routes (toggleable at any zoom level) */}
        <HyperspaceRoutesLayer 
          systems={galaxyData.systemMap}
          maxConnectionDistance={zoomPan.scale > initialScale * 2 ? 100 : 75}
          showRoutes={showRoutes}
          viewportBounds={viewportBounds}
        />
        
        {/* Layer 3.5: Planet Orbits (only at second zoom level, before system view) */}
        <PlanetOrbitsLayer
          systems={galaxyData.systemMap}
          scale={zoomPan.scale}
          initialScale={initialScale}
          viewBox={viewBox}
          minZoomRatio={2.5}
          maxZoomRatio={4.9}
        />
        
        {/* Layer 4: System Markers */}
        <SystemMarkersLayer
          systems={galaxyData.systemMap}
          onSystemClick={handleSystemClick}
          hoveredSystem={hoveredSystem}
          onSystemHover={setHoveredSystem}
          scale={zoomPan.scale}
          showNames={zoomedIntoRegion}
          viewportBounds={viewportBounds}
          homeSystem={homeSystem}
        />
        
        {/* Layer 5: Incidents */}
        {incidentsData?.incidents && incidentsData.incidents.length > 0 && (
          <IncidentLayer
            incidents={incidentsData.incidents}
            scale={zoomPan.scale}
            viewportBounds={viewportBounds}
            onIncidentClick={setSelectedIncident}
            onIncidentHover={setHoveredIncident}
          />
        )}
        
        {/* Layer 6: Fog of War - dark cloudy overlay for undiscovered areas (rendered last so it's on top) */}
        <g style={{ pointerEvents: 'none' }}>
          <FogOfWarLayer
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            viewportBounds={viewportBounds}
            scale={zoomPan.scale}
          />
        </g>
      </svg>
      
      {/* Incident Detail Panel */}
      {selectedIncident && (
        <div className="absolute top-4 right-4 z-50">
          <IncidentDetailPanel
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        </div>
      )}
      
      {/* UI Overlay: Legend */}
      <GalaxyMapLegend regions={galaxyData.regions} />
      
      {/* Navigation Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNavigateToCore}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
          title="Navigate to Galactic Core"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSpiralGuidelines(!showSpiralGuidelines)}
          className={`bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90 ${showSpiralGuidelines ? 'bg-blue-900/50' : ''}`}
          title="Toggle Spiral Arm Guidelines"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowRoutes(!showRoutes)}
          className={`bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90 ${showRoutes ? 'bg-blue-900/50' : ''}`}
          title="Toggle Hyperspace Routes"
        >
          <GitBranch className="w-4 h-4" />
        </Button>
        <div className="h-px bg-white/20 my-1" />
        <Button
          variant="outline"
          size="icon"
          onClick={zoomPan.zoomIn}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomPan.zoomOut}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

