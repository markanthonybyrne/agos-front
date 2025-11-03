import { useState, useMemo, useRef, useEffect } from 'react'
import { useGetUniverseConfigQuery } from '@/api/endpoints/universeApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useAuth } from '@/hooks/useAuth'
import { useZoomPan } from '@/hooks/useZoomPan'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { getPlanetXY } from '@/lib/coordinates'
import { 
  groupPlanetsBySystem,
  convertSystemGroupsToData,
  getPlanetSystemKey,
  type SystemData
} from '@/lib/systemUtils'
import { getPlanetImage } from '@/lib/planetImages'
import { getGalaxyImage } from '@/lib/galaxyImages'
import { getQuadrantXyRange, getSectorXyRange, getGalaxyXyRange } from '@/lib/coordinateUtils'
import { SystemViewMemo as SystemView } from './SystemView'
import { GridOverlay } from './GridOverlay'
import { QuadrantOverlay } from './QuadrantOverlay'
import { SectorOverlay } from './SectorOverlay'
import { Planet } from '@/types/api.types'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'

// Default grid dimensions (will be overridden by config)
// Universe is now rectangular: 2000 x 1000
const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 1000

/**
 * UnifiedUniverseMapV2 - Main component for the 5-level universe map
 * 
 * Features:
 * - Pre-loads all planet data before rendering
 * - Single flat grid with zoom/pan
 * - 5 zoom levels: Universe → Quadrant → Sector → Galaxy → System → Planet
 * - System-level rendering with central stars and orbit lines
 * - Navigation overlays for quadrant/sector
 */
export function UnifiedUniverseMapV2() {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<SystemData | null>(null)
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig } = useGetUniverseConfigQuery()
  // Support both old format (single grid_size) and new format (grid_width/grid_height)
  // If API returns single number, assume square; otherwise use separate width/height
  const gridWidth = configData?.grid_width || (typeof configData?.grid_size === 'object' ? configData.grid_size.width : null) || (configData?.grid_size || DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height || (typeof configData?.grid_size === 'object' ? configData.grid_size.height : null) || (configData?.grid_size || DEFAULT_GRID_HEIGHT)
  const maxPlanets = configData?.capacities?.max_planets || 24000

  // Fetch homeworld planet to center map on it at 600% zoom
  const { data: homeworldData } = useGetPlanetQuery(empire?.homeworld_planet_id || 0, {
    skip: !empire?.homeworld_planet_id
  })

  // Use global planets from Redux store (loaded on login)
  const { allPlanets, isLoading: isLoadingPlanets } = useAppSelector((state) => state.planets)
  const hasSetInitialPosition = useRef(false)

  // Zoom and pan hook
  // Extended max scale to allow very high zoom (700%) for detailed system viewing
  // Default view: zoomed to 600% on user's homeworld system
  const zoomPan = useZoomPan({
    minScale: 0.01,  // Universe view
    maxScale: 7.0,   // Very high zoom for detailed system/planet viewing (allows 700%)
    initialScale: 0.05, // Start at sector level, will update when homeworld system is found
    gridWidth: gridWidth,
    gridHeight: gridHeight
  })

  // Group planets by system
  const systemsByKey = useMemo(() => {
    if (allPlanets.length === 0) return new Map<string, SystemData>()
    
    const systemGroups = groupPlanetsBySystem(allPlanets)
    const systems = convertSystemGroupsToData(systemGroups)
    
    const systemsMap = new Map<string, SystemData>()
    systems.forEach(system => {
      systemsMap.set(system.key, system)
    })
    
    return systemsMap
  }, [allPlanets])

  // Calculate initial pan position to center on homeworld system at 600% zoom
  // Find the system containing the homeworld planet and center on its center
  const homeworldSystemCenter = useMemo(() => {
    if (!homeworldData?.planet || systemsByKey.size === 0) {
      return null
    }
    
    const homeworldSystemKey = getPlanetSystemKey(homeworldData.planet)
    if (!homeworldSystemKey) {
      return null
    }
    
    const system = systemsByKey.get(homeworldSystemKey)
    if (!system) {
      return null
    }
    
    return system.center
  }, [homeworldData, systemsByKey])

  // Update pan and zoom when homeworld system is found (only once on initial load)
  useEffect(() => {
    if (!hasSetInitialPosition.current && homeworldSystemCenter) {
      // Center on homeworld system at 600% zoom
      // Formula: panX = (gridWidth / 2 - targetX) * scale
      // This centers the viewport on the target coordinate
      const initialScale = 6.0 // 600% zoom
      const panX = (gridWidth / 2 - homeworldSystemCenter.x) * initialScale
      const panY = (gridHeight / 2 - homeworldSystemCenter.y) * initialScale
      
      zoomPan.setZoom(initialScale)
      zoomPan.setPan(panX, panY)
      hasSetInitialPosition.current = true
    }
  }, [homeworldSystemCenter, gridWidth, gridHeight, zoomPan])

  // Group systems by galaxy for rendering
  const systemsByGalaxy = useMemo(() => {
    const grouped = new Map<string, SystemData[]>()
    
    systemsByKey.forEach(system => {
      const key = `${system.quadrant}:${system.sector}:${system.galaxy}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(system)
    })
    
    return grouped
  }, [systemsByKey])

  // Determine current zoom level
  // System view should show at scale >= 0.5, planet detail at scale >= 3.0
  const zoomLevel = useMemo(() => {
    const scale = zoomPan.scale
    if (scale < 0.01) return 'universe'
    if (scale < 0.05) return 'quadrant'
    if (scale < 0.1) return 'sector'
    if (scale < 0.5) return 'galaxy'
    if (scale < 3.0) return 'system'  // Extended system view range
    return 'planet'  // Very high zoom for individual planet detail
  }, [zoomPan.scale])

  // Filter entities visible in viewport
  // At very high zoom (scale > 2.0), only show the system closest to viewport center
  const visibleSystems = useMemo(() => {
    const bounds = zoomPan.viewportBounds
    const scale = zoomPan.scale
    const visible: SystemData[] = []
    
    systemsByKey.forEach(system => {
      // Check if system center is in viewport (simpler check)
      const centerX = system.center.x
      const centerY = system.center.y
      
      // Add padding to viewport bounds to include systems near edges
      // Reduce padding at high zoom to show fewer systems and improve performance
      const padding = scale > 2.5 ? 10 : scale > 1.5 ? 30 : 50
      
      if (
        centerX >= bounds.minX - padding &&
        centerX <= bounds.maxX + padding &&
        centerY >= bounds.minY - padding &&
        centerY <= bounds.maxY + padding
      ) {
        visible.push(system)
      }
    })
    
    // At high zoom (scale > 1.5), limit visible systems to reduce rendering load
    // At very high zoom (scale > 2.5), only show the closest system
    if (scale > 2.5 && visible.length > 1) {
      const viewportCenterX = (bounds.minX + bounds.maxX) / 2
      const viewportCenterY = (bounds.minY + bounds.maxY) / 2
      
      // Find the system closest to viewport center
      let closestSystem = visible[0]
      let closestDistance = Infinity
      
      visible.forEach(system => {
        const dx = system.center.x - viewportCenterX
        const dy = system.center.y - viewportCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < closestDistance) {
          closestDistance = distance
          closestSystem = system
        }
      })
      
      return [closestSystem]
    }
    
    // At medium-high zoom (1.5-2.5), limit to 10 closest systems for performance
    if (scale > 1.5 && scale <= 2.5 && visible.length > 10) {
      const viewportCenterX = (bounds.minX + bounds.maxX) / 2
      const viewportCenterY = (bounds.minY + bounds.maxY) / 2
      
      // Sort by distance and take closest 10
      return visible
        .map(system => {
          const dx = system.center.x - viewportCenterX
          const dy = system.center.y - viewportCenterY
          const distance = Math.sqrt(dx * dx + dy * dy)
          return { system, distance }
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10)
        .map(item => item.system)
    }
    
    return visible
  }, [systemsByKey, zoomPan.viewportBounds, zoomPan.scale])

  const visiblePlanets = useMemo(() => {
    if (zoomLevel !== 'planet') return []
    
    const bounds = zoomPan.viewportBounds
    return allPlanets.filter(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return false
      return xy.x >= bounds.minX && xy.x <= bounds.maxX &&
             xy.y >= bounds.minY && xy.y <= bounds.maxY
    })
  }, [allPlanets, zoomPan.viewportBounds, zoomLevel])

  // Handle planet click - open sliding panel with planet info and actions
  const handlePlanetClick = (planet: Planet) => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
      planet: planet
    })
  }

  // Debug logging - MUST be before early return to maintain hook order
  useEffect(() => {
    if (!isLoadingConfig && !isLoadingPlanets && allPlanets.length > 0) {
      console.log('[UnifiedUniverseMapV2] Render state:', {
        allPlanetsCount: allPlanets.length,
        systemsCount: systemsByKey.size,
        zoomLevel,
        scale: zoomPan.scale,
        visibleSystems: visibleSystems.length,
        visiblePlanets: visiblePlanets.length
      })
    }
  }, [allPlanets.length, systemsByKey.size, zoomLevel, zoomPan.scale, visibleSystems.length, visiblePlanets.length, isLoadingConfig, isLoadingPlanets])

  // Handle system click
  const handleSystemClick = (system: SystemData) => {
    if (zoomLevel === 'system') {
      // Zoom out to galaxy
      const galaxyRange = getGalaxyXyRange(system.quadrant, system.sector, system.galaxy)
      const centerX = (galaxyRange.x_min + galaxyRange.x_max) / 2
      const centerY = (galaxyRange.y_min + galaxyRange.y_max) / 2
      const screen = zoomPan.gridToScreen(centerX, centerY)
      zoomPan.setZoom(0.4, screen.x, screen.y)
    } else {
      // Zoom in to system
      const centerX = system.center.x
      const centerY = system.center.y
      const screen = zoomPan.gridToScreen(centerX, centerY)
      zoomPan.setZoom(0.6, screen.x, screen.y)
      setSelectedSystem(system)
    }
  }

  // Track container dimensions for resize handling
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // Update container size when it changes
  useEffect(() => {
    const container = zoomPan.containerRef.current
    if (!container) return
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
    
    // Initial size
    updateSize()
    
    // Listen for resize
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    
    return () => resizeObserver.disconnect()
  }, [zoomPan.containerRef])
  
  // Calculate dynamic viewBox based on actual container dimensions to ensure content always fills viewport
  // MUST be before early return to maintain hook order
  const dynamicViewBox = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { viewBox: `0 0 ${gridWidth} ${gridHeight}`, bounds: { minX: 0, minY: 0, maxX: gridWidth, maxY: gridHeight } }
    }
    
    const containerWidth = containerSize.width
    const containerHeight = containerSize.height
    const containerAspectRatio = containerWidth / containerHeight
    
    // Calculate what grid coordinates are visible based on current scale and pan
    // Since we removed the transform scale, we need to calculate based on viewBox mapping
    const scale = zoomPan.scale
    const panX = zoomPan.panX
    const panY = zoomPan.panY
    
    // Calculate visible grid area: the viewBox shows this area of the grid
    // The viewBox width/height in grid coordinates depends on the scale
    // At scale 1.0, 1 grid unit = 1 screen pixel (roughly)
    // But we need to account for the container size
    
    // Calculate center point in grid coordinates
    const centerX = gridWidth / 2 - panX / scale
    const centerY = gridHeight / 2 - panY / scale
    
    // Calculate visible width/height in grid coordinates
    // The container size divided by scale gives us grid units visible
    const visibleGridWidth = containerWidth / scale
    const visibleGridHeight = containerHeight / scale
    
    // Calculate bounds
    let minX = Math.max(0, centerX - visibleGridWidth / 2)
    let maxX = Math.min(gridWidth, centerX + visibleGridWidth / 2)
    let minY = Math.max(0, centerY - visibleGridHeight / 2)
    let maxY = Math.min(gridHeight, centerY + visibleGridHeight / 2)
    
    let width = maxX - minX
    let height = maxY - minY
    
    // Adjust to match container aspect ratio so viewBox fills viewport
    const currentAspectRatio = width / height
    if (containerAspectRatio > currentAspectRatio) {
      // Container is wider - increase width
      const newWidth = height * containerAspectRatio
      const widthDiff = newWidth - width
      width = newWidth
      minX = Math.max(0, minX - widthDiff / 2)
      maxX = Math.min(gridWidth, maxX + widthDiff / 2)
    } else if (containerAspectRatio < currentAspectRatio) {
      // Container is taller - increase height
      const newHeight = width / containerAspectRatio
      const heightDiff = newHeight - height
      height = newHeight
      minY = Math.max(0, minY - heightDiff / 2)
      maxY = Math.min(gridHeight, maxY + heightDiff / 2)
    }
    
    // Add small padding to ensure content at edges is visible
    const padding = Math.max(width, height) * 0.05
    const viewBoxX = Math.max(0, minX - padding)
    const viewBoxY = Math.max(0, minY - padding)
    const viewBoxWidth = Math.min(gridWidth, width + padding * 2)
    const viewBoxHeight = Math.min(gridHeight, height + padding * 2)
    
    return {
      viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      bounds: {
        minX: viewBoxX,
        minY: viewBoxY,
        maxX: viewBoxX + viewBoxWidth,
        maxY: viewBoxY + viewBoxHeight
      }
    }
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, containerSize, gridWidth, gridHeight])

  // Show loading state only if actively loading config or planets
  if (isLoadingConfig || isLoadingPlanets || allPlanets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {isLoadingPlanets ? 'Loading universe data...' : 'Initializing map...'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {allPlanets.length > 0 ? `${allPlanets.length.toLocaleString()} planets loaded` : 'Waiting for planet data...'}
          </p>
        </div>
      </div>
    )
  }

  // Convert grid coordinates to viewport position
  const gridToViewport = (gridX: number, gridY: number) => {
    const screen = zoomPan.gridToScreen(gridX, gridY)
    const container = zoomPan.containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: screen.x,
      y: screen.y
    }
  }

  // Debug logging removed for performance - only log in development if needed
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[UnifiedUniverseMapV2] Rendering:', { zoomLevel, scale: zoomPan.scale, visible: visibleSystems.length })
  // }

  return (
    <div 
      className="fixed inset-0 overflow-hidden" 
      style={{ 
        backgroundColor: 'transparent',
        top: '64px', // Account for PersistentHUD height
        left: '64px', // Account for QuickAccessSidebar width
        width: 'calc(100vw - 64px)',
        height: 'calc(100vh - 64px)'
      }}
    >
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
          backgroundColor: 'transparent'
        }}
      >
        {/* SVG overlay for rendering entities */}
        {/* Dynamic viewBox ensures visible content always fills viewport at all zoom levels */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            width: '100%',
            height: '100%'
          }}
          viewBox={dynamicViewBox.viewBox}
          preserveAspectRatio="none"
        >
          <g>
          {/* Transparent background */}
          <rect width={gridWidth} height={gridHeight} fill="transparent" />
          
          {/* Debug: Show viewport bounds - now matches the actual viewBox */}
          <g className="debug-viewport">
            <rect
              x={dynamicViewBox.bounds.minX}
              y={dynamicViewBox.bounds.minY}
              width={dynamicViewBox.bounds.maxX - dynamicViewBox.bounds.minX}
              height={dynamicViewBox.bounds.maxY - dynamicViewBox.bounds.minY}
              fill="none"
              stroke="rgba(255, 255, 0, 0.5)"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          </g>
          
          {/* Grid overlay */}
          <GridOverlay
            width={gridWidth}
            height={gridHeight}
            scale={zoomPan.scale}
            viewportBounds={zoomPan.viewportBounds}
          />

          {/* Navigation overlays */}
          <QuadrantOverlay
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            scale={zoomPan.scale}
            viewportBounds={zoomPan.viewportBounds}
            onQuadrantClick={(quadrant) => {
              const range = getQuadrantXyRange(quadrant)
              const centerX = (range.x_min + range.x_max) / 2
              const centerY = (range.y_min + range.y_max) / 2
              const screen = zoomPan.gridToScreen(centerX, centerY)
              zoomPan.setZoom(0.05, screen.x, screen.y)
            }}
          />
          <SectorOverlay
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            scale={zoomPan.scale}
            viewportBounds={zoomPan.viewportBounds}
            onSectorClick={(quadrant, sector) => {
              const range = getSectorXyRange(quadrant, sector)
              const centerX = (range.x_min + range.x_max) / 2
              const centerY = (range.y_min + range.y_max) / 2
              const screen = zoomPan.gridToScreen(centerX, centerY)
              zoomPan.setZoom(0.1, screen.x, screen.y)
            }}
          />

          {/* Render based on zoom level */}
          {/* Sector level - show systems as simple markers */}
          {zoomLevel === 'sector' && (
            <g className="systems-layer" style={{ pointerEvents: 'all' }}>
              {visibleSystems.map(system => {
                // Use a larger radius that's visible even at low zoom
                // Radius in SVG coordinates (0-1000 grid)
                const radius = 20 // Visible radius in grid coordinates
                return (
                  <g key={system.key}>
                    <circle
                      cx={system.center.x}
                      cy={system.center.y}
                      r={radius}
                      fill="rgba(100, 200, 255, 0.9)"
                      stroke="rgba(150, 220, 255, 1)"
                      strokeWidth={2}
                      className="system-marker cursor-pointer hover:opacity-100"
                      onClick={() => handleSystemClick(system)}
                      style={{ pointerEvents: 'all' }}
                    />
                    {/* Show system identifier */}
                    {zoomPan.scale > 0.06 && (
                      <text
                        x={system.center.x}
                        y={system.center.y + radius + 12}
                        textAnchor="middle"
                        className="fill-blue-300 font-mono pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {system.key}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Debug: Show count if no systems visible */}
              {visibleSystems.length === 0 && systemsByKey.size > 0 && (
                <text
                  x={gridWidth / 2}
                  y={gridHeight / 2}
                  textAnchor="middle"
                  className="fill-yellow-400"
                  style={{ fontSize: '16px' }}
                >
                  {systemsByKey.size} systems exist but none visible in viewport
                </text>
              )}
            </g>
          )}

          {/* Galaxy level - show systems with SystemView component */}
          {zoomLevel === 'galaxy' && visibleSystems.length > 0 && (
            <g className="systems-layer">
              {visibleSystems.map(system => (
                <SystemView
                  key={system.key}
                  system={system}
                  scale={zoomPan.scale}
                  onPlanetClick={handlePlanetClick}
                  onPlanetHover={setHoveredPlanet}
                  hoveredPlanet={hoveredPlanet}
                />
              ))}
            </g>
          )}

          {/* System view - show at scale >= 0.5 */}
          {(zoomLevel === 'system' || zoomLevel === 'planet') && (
            <g className="systems-layer">
              {visibleSystems.map(system => (
                <SystemView
                  key={system.key}
                  system={system}
                  scale={zoomPan.scale}
                  onPlanetClick={handlePlanetClick}
                  onPlanetHover={setHoveredPlanet}
                  hoveredPlanet={hoveredPlanet}
                />
              ))}
            </g>
          )}

          {/* Fallback: show galaxies if no systems visible at galaxy level */}
          {zoomLevel === 'galaxy' && visibleSystems.length === 0 && (
            <g className="galaxies-layer">
              {Array.from(systemsByGalaxy.entries()).map(([galaxyKey, systems]) => {
                const [q, s, g] = galaxyKey.split(':').map(Number)
                const galaxyRange = getGalaxyXyRange(q, s, g)
                const centerX = (galaxyRange.x_min + galaxyRange.x_max) / 2
                const centerY = (galaxyRange.y_min + galaxyRange.y_max) / 2
                const galaxyImage = getGalaxyImage(((g - 1) % 4) + 1)
                
                return (
                  <g
                    key={galaxyKey}
                    className="galaxy-marker"
                    onClick={() => {
                      const screen = zoomPan.gridToScreen(centerX, centerY)
                      zoomPan.setZoom(0.6, screen.x, screen.y)
                    }}
                  >
                    <image
                      href={galaxyImage}
                      x={centerX - 20}
                      y={centerY - 20}
                      width={40}
                      height={40}
                      className="cursor-pointer opacity-80 hover:opacity-100"
                    />
                    {zoomPan.scale > 0.2 && (
                      <text
                        x={centerX}
                        y={centerY + 30}
                        textAnchor="middle"
                        className="text-xs fill-blue-300 font-mono"
                      >
                        Galaxy {galaxyKey}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )}

          {/* Planet detail view - only show individual planets when zoomed very high and outside system view */}
          {zoomLevel === 'planet' && visibleSystems.length === 0 && (
            <g className="planets-layer">
              {visiblePlanets.map(planet => {
                const xy = getPlanetXY(planet)
                if (!xy) return null
                // Get planet image, but ensure we never use sol images for planets
                let planetSlug = planet.type?.slug
                // If planet type is sol-related, fall back to default planet image
                if (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
                    planetSlug === 'sol_massive' || planetSlug === 'sol-massive') {
                  planetSlug = undefined // Will fall back to aridImg
                }
                const planetImage = getPlanetImage(planetSlug)
                const isHovered = hoveredPlanet?.id === planet.id
                
                return (
                  <g
                    key={planet.id}
                    className={cn('planet-marker', isHovered && 'planet-hovered')}
                    onClick={() => handlePlanetClick(planet)}
                    onMouseEnter={() => setHoveredPlanet(planet)}
                    onMouseLeave={() => setHoveredPlanet(null)}
                  >
                    {planetImage && (
                      <image
                        href={planetImage}
                        x={xy.x - 10}
                        y={xy.y - 10}
                        width={isHovered ? 24 : 20}
                        height={isHovered ? 24 : 20}
                        className="cursor-pointer"
                      />
                    )}
                    {zoomPan.scale > 2.5 && (
                      <text
                        x={xy.x}
                        y={xy.y + 15}
                        textAnchor="middle"
                        className="text-xs fill-white font-mono"
                      >
                        {formatCoordinate(planet.coordinate)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )}

          {/* Debug info - always show some visual feedback */}
          {allPlanets.length > 0 && (
            <g className="debug-info">
              <text
                x={gridWidth / 2}
                y={50}
                textAnchor="middle"
                className="text-sm fill-yellow-400 font-mono"
              >
                Planets: {allPlanets.length} | Systems: {systemsByKey.size} | Zoom: {zoomLevel} ({Math.round(zoomPan.scale * 100)}%)
              </text>
              {(visibleSystems.length === 0 && visiblePlanets.length === 0) && (
                <>
                  <text
                    x={gridWidth / 2}
                    y={gridHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-lg fill-yellow-400"
                  >
                    No entities visible at current zoom level
                  </text>
                  <text
                    x={gridWidth / 2}
                    y={gridHeight / 2 + 25}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm fill-yellow-300"
                  >
                    Zoom in or pan to explore
                  </text>
                </>
              )}
            </g>
          )}
          
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur-sm p-2 rounded-lg border border-gray-700">
          <button
            onClick={() => zoomPan.zoomIn()}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold text-lg"
            title="Zoom In"
          >
            +
          </button>
          <div className="text-center text-xs text-white px-2 font-mono">
            {Math.round(zoomPan.scale * 100)}%
          </div>
          <button
            onClick={() => zoomPan.zoomOut()}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold text-lg"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => zoomPan.reset()}
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm p-2 rounded-lg text-white text-sm border border-gray-700">
          <div className="font-mono">
            Zoom: {zoomLevel} ({Math.round(zoomPan.scale * 100)}%)
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Planets: {allPlanets.length} | Systems: {systemsByKey.size}
          </div>
        </div>
      </div>
    </div>
  )
}

