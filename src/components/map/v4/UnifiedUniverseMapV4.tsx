/**
 * UnifiedUniverseMapV4 - Main component for the lightweight 2D universe map using PixiJS
 * 
 * Features:
 * - GPU-accelerated WebGL rendering with PixiJS
 * - CSS gradient background matching V2
 * - 4 zoom levels: Sector → Galaxy → System → Planetary
 * - Smooth zoom/pan without image asset loading overhead
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { useGetUniverseConfigQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { useGetIncidentsQuery } from '@/api/endpoints/incidentsApi'
import { useAuth } from '@/hooks/useAuth'
import { useZoomPan } from '@/hooks/useZoomPan'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { 
  groupPlanetsBySystem,
  convertSystemGroupsToData,
  type SystemData
} from '@/lib/systemUtils'
import { getZoomLevel } from '@/lib/zoomLevels'
import { useUniverseData } from '@/hooks/useUniverseData'
import { Planet, Incident } from '@/types/api.types'
import { Loader } from '@/components/ui/loader'
import { BackgroundLayer } from './layers/BackgroundLayer'
import { GalaxyLayer } from './layers/GalaxyLayer'
import { SystemLayer } from './layers/SystemLayer'
import { PlanetLayer } from './layers/PlanetLayer'
import { MapControlsPanel } from '../MapControlsPanel'
import { IncidentLayer } from '@/components/incidents/IncidentLayer'
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel'
import { FogOfWarLayer } from '@/components/map/FogOfWarLayer'
import { GalacticCoreLayer } from '@/components/map/GalacticCoreLayer'
import { SpiralArmGuidelinesLayer } from '@/components/map/SpiralArmGuidelinesLayer'
import { GALACTIC_CORE } from '@/lib/spiralUtils'
import { ViewportBounds } from '@/lib/v3/ViewportProjection'
import { calculateViewportBounds, ProjectionConfig } from '@/lib/v3/ViewportProjection'

// Default grid dimensions (square grid for circular galaxy)
const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 2000

export function UnifiedUniverseMapV4() {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null)
  const [showSpiralGuidelines, setShowSpiralGuidelines] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const rootContainerRef = useRef<PIXI.Container | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Load universe config
  const { data: configData, isLoading: isLoadingConfig, error: configError } = useGetUniverseConfigQuery()
  const gridWidth = configData?.grid_width 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.width : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.height : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_HEIGHT)

  // Use global planets from Redux store
  const { allPlanets, isLoading: isLoadingPlanets } = useAppSelector((state) => state.planets)
  
  // Fetch map data to get planets with galaxy_name and system_name
  const { data: mapData } = useGetMapQuery({})
  
  // Fetch incidents (filtered by visibility automatically by API)
  const { data: incidentsData } = useGetIncidentsQuery()

  // Enrich planets with names from map data
  const enrichedPlanets = useMemo(() => {
    const lookupById = new Map<number, { galaxy_name: string | null; system_name: string | null }>()
    
    if (mapData?.planets) {
      mapData.planets.forEach(planet => {
        if (planet.id) {
          const galaxyName = (planet.galaxy_name && planet.galaxy_name.trim()) || null
          const systemName = (planet.system_name && planet.system_name.trim()) || null
          if (galaxyName || systemName) {
            lookupById.set(planet.id, {
              galaxy_name: galaxyName,
              system_name: systemName
            })
          }
        }
      })
    }
    
    return allPlanets.map(planet => {
      const names = lookupById.get(planet.id)
      if (names) {
        return {
          ...planet,
          galaxy_name: names.galaxy_name,
          system_name: names.system_name
        }
      }
      return planet
    })
  }, [allPlanets, mapData])

  // Zoom and pan hook
  const zoomPan = useZoomPan({
    minScale: 0.09,
    maxScale: 1.554,
    initialScale: 0.103,
    gridWidth: gridWidth,
    gridHeight: gridHeight
  })

  // Calculate normalized zoom and zoom level
  const normalizedZoom = useMemo(() => zoomPan.normalizedZoom, [zoomPan.normalizedZoom])
  const zoomLevel = useMemo(() => getZoomLevel(normalizedZoom), [normalizedZoom])

  // Group planets by system
  const systemsByKey = useMemo(() => {
    if (enrichedPlanets.length === 0) return new Map<string, SystemData>()
    
    const systemGroups = groupPlanetsBySystem(enrichedPlanets)
    const systems = convertSystemGroupsToData(systemGroups)
    
    const systemsMap = new Map<string, SystemData>()
    systems.forEach(system => {
      systemsMap.set(system.key, system)
    })
    
    return systemsMap
  }, [enrichedPlanets])

  const systemsArray = useMemo(() => Array.from(systemsByKey.values()), [systemsByKey])

  // Calculate viewport bounds
  const viewportBounds = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { minX: 0, minY: 0, maxX: gridWidth, maxY: gridHeight }
    }
    
    const config: ProjectionConfig = {
      gridWidth,
      gridHeight,
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      scale: zoomPan.scale,
      panX: zoomPan.panX,
      panY: zoomPan.panY
    }
    
    return calculateViewportBounds(config)
  }, [gridWidth, gridHeight, containerSize, zoomPan.scale, zoomPan.panX, zoomPan.panY])

  // Initialize PixiJS Application
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const app = new PIXI.Application()
    const cancelledRef = { current: false }
    
    app.init({
      canvas: canvasRef.current,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (cancelledRef.current) {
        app.destroy(true, { children: true, texture: true })
        return
      }
      
      appRef.current = app
      
      // Create root container
      const rootContainer = new PIXI.Container()
      rootContainerRef.current = rootContainer
      app.stage.addChild(rootContainer)
      
      // Update container size
      const rect = canvasRef.current!.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
      
      // Start render loop
      app.ticker.start()
    })

    return () => {
      cancelledRef.current = true
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
        rootContainerRef.current = null
      }
    }
  }, [])

  // Update container size on resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
      
      if (appRef.current) {
        appRef.current.renderer.resize(rect.width, rect.height)
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(canvas)

    return () => resizeObserver.disconnect()
  }, [])

  // Update PixiJS container transform based on zoom/pan
  useEffect(() => {
    if (!rootContainerRef.current || containerSize.width === 0) return

    // Update container scale and position
    // PixiJS coordinate system: (0,0) is top-left, grid is centered
    const container = rootContainerRef.current
    container.scale.set(zoomPan.scale)
    
    // Calculate position: center grid in viewport, then apply pan
    const centerX = containerSize.width / 2
    const centerY = containerSize.height / 2
    
    // Grid center is at (gridWidth/2, gridHeight/2)
    // To center it, we offset by half the grid size
    const gridCenterX = gridWidth / 2
    const gridCenterY = gridHeight / 2
    
    // Position = viewport center + pan offset - grid center offset
    container.position.set(
      centerX + zoomPan.panX - gridCenterX * zoomPan.scale,
      centerY + zoomPan.panY - gridCenterY * zoomPan.scale
    )
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, gridWidth, gridHeight, containerSize])

  // Handle planet click
  const handlePlanetClick = useCallback((planet: Planet) => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
      planet: planet
    })
  }, [openPanel])

  // Handle system click
  const handleSystemClick = useCallback((system: SystemData) => {
    // Zoom to system level
    const centerX = system.center.x
    const centerY = system.center.y
    const screen = zoomPan.gridToScreen(centerX, centerY)
    zoomPan.setNormalizedZoom(0.67, screen.x, screen.y)
  }, [zoomPan])

  // Handle incident click
  const handleIncidentClick = useCallback((incident: Incident) => {
    setSelectedIncident(incident)
  }, [])

  // Navigate to galactic core
  const handleNavigateToCore = useCallback(() => {
    const targetScale = 0.09 // Full galaxy view
    const targetPanX = (gridWidth / 2 - GALACTIC_CORE.x) * targetScale
    const targetPanY = (gridHeight / 2 - GALACTIC_CORE.y) * targetScale
    
    zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 800)
  }, [zoomPan, gridWidth, gridHeight])

  // Show loading state
  if (isLoadingConfig && !configError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Initializing map...</p>
        </div>
      </div>
    )
  }

  const isPlanetsLoading = isLoadingPlanets && allPlanets.length === 0

  return (
    <div 
      className="fixed inset-0 overflow-hidden z-0" 
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Background gradient fade - Fixed, doesn't move with panning */}
      <BackgroundLayer />
      
      {/* Map container with zoom/pan */}
      <div
        ref={zoomPan.containerRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={zoomPan.onMouseDown}
        onMouseMove={zoomPan.onMouseMove}
        onMouseUp={zoomPan.onMouseUp}
        onWheel={zoomPan.onWheel}
        onTouchStart={zoomPan.onTouchStart}
        onTouchMove={zoomPan.onTouchMove}
        onTouchEnd={zoomPan.onTouchEnd}
        style={{ 
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: 'transparent',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* PixiJS Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Render layers */}
        {rootContainerRef.current && (
          <>
            <GalaxyLayer
              systems={systemsArray}
              container={rootContainerRef.current}
              normalizedZoom={normalizedZoom}
              scale={zoomPan.scale}
              viewportBounds={viewportBounds}
              onSystemClick={handleSystemClick}
            />
            
            <SystemLayer
              systems={systemsArray}
              container={rootContainerRef.current}
              normalizedZoom={normalizedZoom}
              scale={zoomPan.scale}
              viewportBounds={viewportBounds}
              onPlanetClick={handlePlanetClick}
              onPlanetHover={setHoveredPlanet}
            />
            
            <PlanetLayer
              planets={enrichedPlanets}
              container={rootContainerRef.current}
              normalizedZoom={normalizedZoom}
              viewportBounds={viewportBounds}
              onPlanetClick={handlePlanetClick}
              onPlanetHover={setHoveredPlanet}
            />
          </>
        )}

        {/* Spiral Arm Guidelines Layer (SVG overlay) - optional visual guide */}
        {showSpiralGuidelines && containerSize.width > 0 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 5,
              top: 0,
              left: 0,
              transform: containerSize.width > 0 
                ? `translate(${containerSize.width / 2 + zoomPan.panX - (gridWidth / 2) * zoomPan.scale}px, ${containerSize.height / 2 + zoomPan.panY - (gridHeight / 2) * zoomPan.scale}px) scale(${zoomPan.scale})`
                : 'none',
              transformOrigin: '0 0',
            }}
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            preserveAspectRatio="none"
          >
            <SpiralArmGuidelinesLayer
              scale={zoomPan.scale}
              panX={zoomPan.panX}
              panY={zoomPan.panY}
              minScale={0.15}
            />
          </svg>
        )}

        {/* Galactic Core Layer (SVG overlay) */}
        {containerSize.width > 0 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 10,
              top: 0,
              left: 0,
              transform: containerSize.width > 0 
                ? `translate(${containerSize.width / 2 + zoomPan.panX - (gridWidth / 2) * zoomPan.scale}px, ${containerSize.height / 2 + zoomPan.panY - (gridHeight / 2) * zoomPan.scale}px) scale(${zoomPan.scale})`
                : 'none',
              transformOrigin: '0 0',
            }}
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            preserveAspectRatio="none"
          >
            <GalacticCoreLayer
              scale={zoomPan.scale}
              panX={zoomPan.panX}
              panY={zoomPan.panY}
              containerWidth={gridWidth}
              containerHeight={gridHeight}
              minScale={0.15}
            />
          </svg>
        )}

        {/* Fog of War Layer (SVG overlay) - positioned to match PixiJS container transform */}
        {containerSize.width > 0 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 900,
              top: 0,
              left: 0,
              transform: containerSize.width > 0 
                ? `translate(${containerSize.width / 2 + zoomPan.panX - (gridWidth / 2) * zoomPan.scale}px, ${containerSize.height / 2 + zoomPan.panY - (gridHeight / 2) * zoomPan.scale}px) scale(${zoomPan.scale})`
                : 'none',
              transformOrigin: '0 0',
            }}
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            preserveAspectRatio="none"
          >
            <FogOfWarLayer
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              viewportBounds={viewportBounds}
              scale={zoomPan.scale}
            />
          </svg>
        )}

        {/* Incident Layer (SVG overlay) */}
        {incidentsData?.incidents && incidentsData.incidents.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              zIndex: 10,
            }}
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
            preserveAspectRatio="none"
          >
            <g
              style={{
                transform: `translate(${zoomPan.panX}px, ${zoomPan.panY}px) scale(${zoomPan.scale})`,
                transformOrigin: 'center center',
              }}
            >
              <IncidentLayer
                incidents={incidentsData.incidents}
                scale={zoomPan.scale}
                viewportBounds={viewportBounds}
                onIncidentClick={handleIncidentClick}
                onIncidentHover={setHoveredIncident}
              />
            </g>
          </svg>
        )}

        {/* Map Controls Panel */}
        <MapControlsPanel
          zoomPan={zoomPan}
          zoomLevel={zoomLevel}
          allPlanets={allPlanets}
          onSearch={(centerX, centerY, normalizedZoom) => {
            const targetScale = zoomPan.normalizedZoom ? 
              (0.09 + (normalizedZoom * (1.554 - 0.09))) : 0.09
            
            const targetPanX = (gridWidth / 2 - centerX) * targetScale
            const targetPanY = (gridHeight / 2 - centerY) * targetScale
            
            zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 800)
          }}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          systemsCount={systemsByKey.size}
          minScale={0.09}
          maxScale={1.554}
          onNavigateToCore={handleNavigateToCore}
          showSpiralGuidelines={showSpiralGuidelines}
          onToggleSpiralGuidelines={setShowSpiralGuidelines}
        />
        
        {/* Loading indicator overlay */}
        {isPlanetsLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4" />
              <p className="text-sm text-muted-foreground">Loading planets...</p>
            </div>
          </div>
        )}

        {/* Planet hover tooltip */}
        {hoveredPlanet && (
          <div
            className="absolute z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: `${zoomPan.gridToScreen(
                typeof hoveredPlanet.coordinate === 'object' && hoveredPlanet.coordinate?.x
                  ? hoveredPlanet.coordinate.x
                  : 0,
                typeof hoveredPlanet.coordinate === 'object' && hoveredPlanet.coordinate?.y
                  ? hoveredPlanet.coordinate.y
                  : 0
              ).x}px`,
              top: `${zoomPan.gridToScreen(
                typeof hoveredPlanet.coordinate === 'object' && hoveredPlanet.coordinate?.x
                  ? hoveredPlanet.coordinate.x
                  : 0,
                typeof hoveredPlanet.coordinate === 'object' && hoveredPlanet.coordinate?.y
                  ? hoveredPlanet.coordinate.y
                  : 0
              ).y - 40}px`,
            }}
          >
            <div className="text-sm font-mono">
              <div className="font-semibold">
                {hoveredPlanet.coordinate && typeof hoveredPlanet.coordinate === 'object'
                  ? `${hoveredPlanet.coordinate.quadrant}:${hoveredPlanet.coordinate.sector}:${hoveredPlanet.coordinate.galaxy}:${hoveredPlanet.coordinate.system}:${hoveredPlanet.coordinate.planet}`
                  : hoveredPlanet.coordinate}
              </div>
              <div className="text-xs text-muted-foreground">
                {hoveredPlanet.type?.name || 'Unknown'}
                {hoveredPlanet.state && ` • ${hoveredPlanet.state}`}
                {hoveredPlanet.owner_empire_id && ` • Owned`}
              </div>
            </div>
          </div>
        )}

        {/* Incident Detail Panel */}
        {selectedIncident && (
          <div className="absolute top-4 right-4 z-50">
            <IncidentDetailPanel
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

