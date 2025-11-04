import { useState, useMemo, useRef, useEffect } from 'react'
import { useGetUniverseConfigQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useAuth } from '@/hooks/useAuth'
import { useZoomPan } from '@/hooks/useZoomPan'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { getPlanetXY, parseCoordinate } from '@/lib/coordinates'
import { 
  groupPlanetsBySystem,
  convertSystemGroupsToData,
  getPlanetSystemKey,
  type SystemData
} from '@/lib/systemUtils'
import { getPlanetImage } from '@/lib/planetImages'
import { getGalaxyImage, getRandomGalaxyTypeForSystem } from '@/lib/galaxyImages'
import { getQuadrantXyRange, getSectorXyRange, getGalaxyXyRange, getSystemXyRange } from '@/lib/coordinateUtils'
import { SystemViewMemo } from './SystemView'
import { GridOverlay } from './GridOverlay'
import { QuadrantOverlay } from './QuadrantOverlay'
import { SectorOverlay } from './SectorOverlay'
import { Planet } from '@/types/api.types'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { CoordinateJumpPanel } from './CoordinateJumpPanel'

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
  const [showJumpPanel, setShowJumpPanel] = useState(false)
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig } = useGetUniverseConfigQuery()
  // Support both old format (single grid_size) and new format (grid_width/grid_height)
  // If API returns single number, assume square; otherwise use separate width/height
  const gridWidth = configData?.grid_width 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.width : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.height : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_HEIGHT)
  const maxPlanets = configData?.capacities?.max_planets || 24000

  // Use global planets from Redux store (loaded on login)
  const { allPlanets, isLoading: isLoadingPlanets } = useAppSelector((state) => state.planets)
  
  // Fetch map data to get planets with galaxy_name and system_name
  const { data: mapData, isLoading: isLoadingMapData } = useGetMapQuery({})
  
  // Debug: Log mapData when it loads
  useEffect(() => {
    if (mapData) {
      console.log('[UnifiedUniverseMapV2] MapData loaded:', {
        hasPlanets: !!mapData.planets,
        planetsCount: mapData.planets?.length || 0,
        hasGalaxies: !!mapData.galaxies,
        galaxiesCount: mapData.galaxies?.length || 0,
        samplePlanet: mapData.planets?.[0] ? {
          id: mapData.planets[0].id,
          galaxy_name: mapData.planets[0].galaxy_name,
          system_name: mapData.planets[0].system_name,
          coordinate: mapData.planets[0].coordinate
        } : null,
        sampleGalaxy: mapData.galaxies?.[0] || null
      })
    }
  }, [mapData])
  
  // Create a lookup map for planet names (by ID and by coordinate)
  const planetNameLookup = useMemo(() => {
    const lookupById = new Map<number, { galaxy_name: string | null; system_name: string | null }>()
    const lookupByCoord = new Map<string, { galaxy_name: string | null; system_name: string | null }>()
    
    if (mapData?.planets) {
      console.log('[UnifiedUniverseMapV2] MapData planets count:', mapData.planets.length)
      mapData.planets.forEach(planet => {
        // Store by ID
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
        
        // Also store by coordinate for fallback matching
        if (planet.coordinate) {
          const coordKey = typeof planet.coordinate === 'string' 
            ? planet.coordinate 
            : `${planet.coordinate.quadrant}:${planet.coordinate.sector}:${planet.coordinate.galaxy}:${planet.coordinate.system}:${planet.coordinate.planet}`
          const galaxyName = (planet.galaxy_name && planet.galaxy_name.trim()) || null
          const systemName = (planet.system_name && planet.system_name.trim()) || null
          if (galaxyName || systemName) {
            lookupByCoord.set(coordKey, {
              galaxy_name: galaxyName,
              system_name: systemName
            })
          }
        }
      })
      
      // Log sample of what we found
      if (lookupById.size > 0) {
        const sample = Array.from(lookupById.entries())[0]
        console.log('[UnifiedUniverseMapV2] Sample planet name from mapData:', {
          id: sample[0],
          names: sample[1]
        })
      }
    } else {
      console.warn('[UnifiedUniverseMapV2] No planets in mapData:', mapData)
    }
    
    return { lookupById, lookupByCoord }
  }, [mapData])
  
  // Enrich planets with names from map data
  const enrichedPlanets = useMemo(() => {
    let enrichedCount = 0
    const enriched = allPlanets.map(planet => {
      // Try ID match first
      let names = planetNameLookup.lookupById.get(planet.id)
      
      // Fallback to coordinate match if ID doesn't match
      if (!names) {
        const coordKey = typeof planet.coordinate === 'string' 
          ? planet.coordinate 
          : `${planet.coordinate.quadrant}:${planet.coordinate.sector}:${planet.coordinate.galaxy}:${planet.coordinate.system}:${planet.coordinate.planet}`
        names = planetNameLookup.lookupByCoord.get(coordKey)
      }
      
      if (names) {
        enrichedCount++
        return {
          ...planet,
          galaxy_name: names.galaxy_name,
          system_name: names.system_name
        }
      }
      return planet
    })
    
    if (enrichedCount > 0) {
      console.log(`[UnifiedUniverseMapV2] Enriched ${enrichedCount} planets with names`)
    }
    
    return enriched
  }, [allPlanets, planetNameLookup])

  // Zoom and pan hook
  // Start at sector level (showing all galaxies across all quadrants)
  // Extended max scale to allow very high zoom (700%) for detailed system viewing
  const zoomPan = useZoomPan({
    minScale: 0.01,  // Sector view - shows all galaxies
    maxScale: 7.0,   // Very high zoom for detailed system/planet viewing (allows 700%)
    initialScale: 0.05, // Start at sector level (5% zoom) - shows all galaxies
    gridWidth: gridWidth,
    gridHeight: gridHeight
  })

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

  // Removed auto-centering on homeworld system
  // User can pan freely without any snapping behavior

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

  // Create galaxy name lookup map from planets and galaxies array
  const galaxyNames = useMemo(() => {
    const names = new Map<string, string | null>()
    
    // First, try to get names from the galaxies array in mapData (most reliable)
    if (mapData?.galaxies) {
      mapData.galaxies.forEach(galaxy => {
        const key = `${galaxy.quadrant}:${galaxy.sector}:${galaxy.galaxy}`
        // Only store non-empty names
        if (galaxy.name && galaxy.name.trim()) {
          names.set(key, galaxy.name.trim())
        }
      })
    }
    
    // Fallback: extract from enriched planets (group by quadrant:sector:galaxy)
    enrichedPlanets.forEach(planet => {
      const coord = typeof planet.coordinate === 'string' 
        ? parseCoordinate(planet.coordinate)
        : planet.coordinate
      
      if (coord && typeof coord.quadrant === 'number' && typeof coord.sector === 'number' && typeof coord.galaxy === 'number') {
        const key = `${coord.quadrant}:${coord.sector}:${coord.galaxy}`
        // Only set if not already set and name is non-empty
        if (!names.has(key) && planet.galaxy_name && planet.galaxy_name.trim()) {
          names.set(key, planet.galaxy_name.trim())
        }
      }
    })
    
    return names
  }, [enrichedPlanets, mapData])

  // Determine current zoom level
  // Start at sector level (no quadrant view) - shows all galaxies across all quadrants
  // Extended sector view to show galaxies at more zoom levels with better spacing
  const zoomLevel = useMemo(() => {
    const scale = zoomPan.scale
    if (scale < 0.5) return 'sector'  // Sector view - shows galaxies with more zoom room (1%-50%)
    if (scale < 0.8) return 'galaxy'  // Galaxy view - shows systems with stars (50%-80%)
    if (scale < 3.0) return 'system'  // System view - shows full system details (80%-300%)
    return 'planet'  // Very high zoom for individual planet detail (300%+)
  }, [zoomPan.scale])

  // Filter entities visible in viewport with smart limiting for performance
  // Balance between showing everything and maintaining smooth performance
  // Uses distance-based filtering to prevent systems from overlapping
  const visibleSystems = useMemo(() => {
    const bounds = zoomPan.viewportBounds
    const scale = zoomPan.scale
    const allInViewport: SystemData[] = []
    
    // Padding based on zoom level - more padding at lower zoom for smoother panning
    const padding = scale >= 7.0 ? 5   // Very high zoom: minimal padding, single system
      : scale > 5.0 ? 15                // Very high zoom: small padding
      : scale > 4.0 ? 25                // High zoom: moderate padding
      : scale > 2.5 ? 40                // Medium-high: moderate padding
      : scale > 1.5 ? 60                // Medium-high: generous padding
      : scale > 0.5 ? 100               // Medium: very generous padding
      : scale > 0.1 ? 150              // Low: very generous padding
      : 200                              // Very low: maximum padding
    
    // First, collect all systems in viewport
    systemsByKey.forEach(system => {
      const centerX = system.center.x
      const centerY = system.center.y
      
      if (
        centerX >= bounds.minX - padding &&
        centerX <= bounds.maxX + padding &&
        centerY >= bounds.minY - padding &&
        centerY <= bounds.maxY + padding
      ) {
        allInViewport.push(system)
      }
    })
    
    // Calculate minimum distance between systems based on zoom level
    // At higher zoom, systems need more space to avoid visual overlap
    // Increased spacing in sector view to reduce clustering
    const minSystemDistance = scale >= 7.0 ? 200  // Very high zoom: large spacing (single system)
      : scale > 5.6 ? 150                         // 560% zoom: large spacing for 2-3 systems
      : scale > 4.48 ? 100                        // 448% zoom: medium-large spacing
      : scale > 4.0 ? 80                          // 400% zoom: medium spacing
      : scale > 3.0 ? 60                          // 300% zoom: medium spacing
      : scale > 2.5 ? 50                          // 250% zoom: smaller spacing
      : scale > 1.5 ? 40                          // 150% zoom: smaller spacing
      : scale > 0.8 ? 35                          // 80% zoom: medium spacing
      : scale > 0.5 ? 40                          // 50% zoom: increased spacing for sector view
      : scale > 0.3 ? 35                          // 30% zoom: good spacing
      : scale > 0.15 ? 30                         // 15% zoom: moderate spacing
      : scale > 0.1 ? 25                          // 10% zoom: better spacing
      : 20                                         // Very low zoom: increased spacing to reduce clustering
    
    // Maximum number of systems to show at each zoom level
    // Reduced counts in sector view to reduce clustering and improve spacing
    const maxSystems = scale >= 7.0 ? 1     // 700%+: 1 system (detailed planet view)
      : scale > 5.6 ? 2                      // 560%: 2 systems (still very detailed)
      : scale > 4.48 ? 4                     // 448%: 4 systems (detailed but more visible)
      : scale > 4.0 ? 6                      // 400%: 6 systems
      : scale > 3.0 ? 10                     // 300%: 10 systems
      : scale > 2.5 ? 15                     // 250%: 15 systems
      : scale > 1.5 ? 25                     // 150%: 25 systems
      : scale > 0.8 ? 40                     // 80%: 40 systems
      : scale > 0.5 ? 60                     // 50%: 60 systems (reduced from unlimited)
      : scale > 0.3 ? 80                     // 30%: 80 systems
      : scale > 0.15 ? 100                    // 15%: 100 systems
      : scale > 0.1 ? 120                    // 10%: 120 systems (reduced from 150)
      : 100                                  // Very low: 100 systems (reduced to reduce clustering)
    
    // If we have fewer systems than max, return them all
    if (allInViewport.length <= maxSystems) {
      // But still filter by minimum distance to prevent overlap
      const filtered: SystemData[] = []
      const viewportCenterX = (bounds.minX + bounds.maxX) / 2
      const viewportCenterY = (bounds.minY + bounds.maxY) / 2
      
      // Sort by distance from viewport center
      const sorted = allInViewport
        .map(system => {
          const dx = system.center.x - viewportCenterX
          const dy = system.center.y - viewportCenterY
          const distance = Math.sqrt(dx * dx + dy * dy)
          return { system, distance }
        })
        .sort((a, b) => a.distance - b.distance)
      
      // Add systems, ensuring minimum distance between them
      for (const { system } of sorted) {
        if (filtered.length >= maxSystems) break
        
        // Check if this system is far enough from already included systems
        const tooClose = filtered.some(addedSystem => {
          const dx = system.center.x - addedSystem.center.x
          const dy = system.center.y - addedSystem.center.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance < minSystemDistance
        })
        
        if (!tooClose) {
          filtered.push(system)
        }
      }
      
      return filtered
    }
    
    // If we have more systems than max, filter by distance and take closest ones
    const viewportCenterX = (bounds.minX + bounds.maxX) / 2
    const viewportCenterY = (bounds.minY + bounds.maxY) / 2
    
    // Sort by distance from viewport center
    const sorted = allInViewport
      .map(system => {
        const dx = system.center.x - viewportCenterX
        const dy = system.center.y - viewportCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)
        return { system, distance }
      })
      .sort((a, b) => a.distance - b.distance)
    
    // Take systems, ensuring minimum distance between them
    const filtered: SystemData[] = []
    for (const { system } of sorted) {
      if (filtered.length >= maxSystems) break
      
      // Check if this system is far enough from already included systems
      const tooClose = filtered.some(addedSystem => {
        const dx = system.center.x - addedSystem.center.x
        const dy = system.center.y - addedSystem.center.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance < minSystemDistance
      })
      
      if (!tooClose) {
        filtered.push(system)
      }
    }
    
    return filtered
  }, [systemsByKey, zoomPan.viewportBounds, zoomPan.scale])

  const visiblePlanets = useMemo(() => {
    if (zoomLevel !== 'planet') return []
    
    const bounds = zoomPan.viewportBounds
    return enrichedPlanets.filter(planet => {
      const xy = getPlanetXY(planet)
      if (!xy) return false
      return xy.x >= bounds.minX && xy.x <= bounds.maxX &&
             xy.y >= bounds.minY && xy.y <= bounds.maxY
    })
  }, [enrichedPlanets, zoomPan.viewportBounds, zoomLevel])

  // Handle planet click - open sliding panel with planet info and actions
  const handlePlanetClick = (planet: Planet) => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
      planet: planet
    })
  }

  // Debug logging - MUST be before early return to maintain hook order
  useEffect(() => {
    if (!isLoadingConfig && !isLoadingPlanets && allPlanets.length > 0) {
      const planetsWithNames = enrichedPlanets.filter(p => p.galaxy_name || p.system_name).length
      console.log('[UnifiedUniverseMapV2] Render state:', {
        allPlanetsCount: allPlanets.length,
        enrichedPlanetsCount: enrichedPlanets.length,
        planetsWithNames,
        mapDataPlanets: mapData?.planets?.length || 0,
        mapDataGalaxies: mapData?.galaxies?.length || 0,
        galaxyNamesMapSize: galaxyNames.size,
        systemsCount: systemsByKey.size,
        zoomLevel,
        scale: zoomPan.scale,
        visibleSystems: visibleSystems.length,
        visiblePlanets: visiblePlanets.length
      })
      
      // Log sample of enriched planets with names
      if (planetsWithNames > 0) {
        const sample = enrichedPlanets.find(p => p.galaxy_name || p.system_name)
        if (sample) {
          console.log('[UnifiedUniverseMapV2] Sample planet with names:', {
            id: sample.id,
            galaxy_name: sample.galaxy_name,
            system_name: sample.system_name,
            coordinate: sample.coordinate
          })
        }
        
        // Log sample system with names
        const sampleSystem = Array.from(systemsByKey.values()).find(s => s.system_name || s.galaxy_name)
        if (sampleSystem) {
          console.log('[UnifiedUniverseMapV2] Sample system with names:', {
            key: sampleSystem.key,
            galaxy_name: sampleSystem.galaxy_name,
            system_name: sampleSystem.system_name
          })
        }
      }
      
      // Log galaxy names map sample
      if (galaxyNames.size > 0) {
        const sampleGalaxy = Array.from(galaxyNames.entries())[0]
        console.log('[UnifiedUniverseMapV2] Sample galaxy name:', {
          key: sampleGalaxy[0],
          name: sampleGalaxy[1]
        })
      }
    }
  }, [allPlanets.length, enrichedPlanets, mapData, galaxyNames.size, systemsByKey.size, zoomLevel, zoomPan.scale, visibleSystems.length, visiblePlanets.length, isLoadingConfig, isLoadingPlanets])

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
  // Use minimal rounding for smooth panning at all zoom levels (like 140% zoom feels)
  // Only round scale slightly to reduce micro-updates, keep pan values precise
  const roundedPanX = zoomPan.panX  // No rounding for smooth panning
  const roundedPanY = zoomPan.panY  // No rounding for smooth panning
  const roundedScale = Math.round(zoomPan.scale * 1000) / 1000  // Fine-grained rounding for scale only
  
  const dynamicViewBox = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { viewBox: `0 0 ${gridWidth} ${gridHeight}`, bounds: { minX: 0, minY: 0, maxX: gridWidth, maxY: gridHeight } }
    }
    
    const containerWidth = containerSize.width
    const containerHeight = containerSize.height
    const containerAspectRatio = containerWidth / containerHeight
    
    // Calculate what grid coordinates are visible based on current scale and pan
    // Use rounded values to reduce calculation complexity and improve performance
    const scale = roundedScale
    const panX = roundedPanX
    const panY = roundedPanY
    
    // Calculate center point in grid coordinates
    const centerX = gridWidth / 2 - panX / scale
    const centerY = gridHeight / 2 - panY / scale
    
    // Calculate visible width/height in grid coordinates
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
    
    // Add generous padding to prevent items from popping in/out during pan
    // Reduced slightly for better performance while maintaining smoothness
    const padding = Math.max(width, height) * 0.10
    const viewBoxX = Math.max(0, minX - padding)
    const viewBoxY = Math.max(0, minY - padding)
    const viewBoxWidth = Math.min(gridWidth, width + padding * 2)
    const viewBoxHeight = Math.min(gridHeight, height + padding * 2)
    
    // Round values to prevent micro-updates that cause visual "clicking"
    return {
      viewBox: `${Math.round(viewBoxX * 10) / 10} ${Math.round(viewBoxY * 10) / 10} ${Math.round(viewBoxWidth * 10) / 10} ${Math.round(viewBoxHeight * 10) / 10}`,
      bounds: {
        minX: viewBoxX,
        minY: viewBoxY,
        maxX: viewBoxX + viewBoxWidth,
        maxY: viewBoxY + viewBoxHeight
      }
    }
  }, [roundedScale, roundedPanX, roundedPanY, containerSize.width, containerSize.height, gridWidth, gridHeight])

  // Show loading state only if actively loading config or planets
  // Note: mapData loading is optional - we can show the map without it, names will appear when it loads
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
          backgroundColor: 'transparent',
          // Performance optimizations for smooth panning
          willChange: 'transform',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
      >
        {/* SVG overlay for rendering entities */}
        {/* Dynamic viewBox ensures visible content always fills viewport at all zoom levels */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            width: '100%',
            height: '100%',
            // Performance optimizations for smooth rendering
            willChange: 'contents',
            transform: 'translateZ(0)', // Force GPU acceleration
            backfaceVisibility: 'hidden',
            // Smooth transitions for panning
            transition: 'none', // Disable CSS transitions - we handle updates manually
          }}
          viewBox={dynamicViewBox.viewBox}
          preserveAspectRatio="none"
        >
          <g>
          {/* Transparent background */}
          <rect width={gridWidth} height={gridHeight} fill="transparent" />
          
          {/* Grid overlay */}
          <GridOverlay
            width={gridWidth}
            height={gridHeight}
            scale={zoomPan.scale}
            viewportBounds={zoomPan.viewportBounds}
          />

          {/* Navigation overlays */}
          {/* Quadrant overlay still available for navigation, but zooms to sector level */}
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
              // Zoom to sector level (0.05) to show all galaxies in quadrant
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
          {/* Sector level - show systems as galaxy images (extended range) */}
          {zoomLevel === 'sector' && (
            <g className="systems-layer" style={{ pointerEvents: 'all' }}>
              {visibleSystems.map(system => {
                // Get a deterministic random galaxy type based on system coordinates
                const galaxyType = getRandomGalaxyTypeForSystem(system.key)
                const galaxyImage = getGalaxyImage(galaxyType)
                // Scale image size based on zoom level for better visibility and spacing
                // Larger images at higher zoom to reduce clustering and improve visibility
                const baseImageSize = 40
                const imageSize = zoomPan.scale < 0.1 ? baseImageSize 
                  : zoomPan.scale < 0.2 ? Math.min(baseImageSize * 1.3, 52)
                  : zoomPan.scale < 0.3 ? Math.min(baseImageSize * 1.5, 60)
                  : Math.min(baseImageSize * 1.8, 72)  // Even larger as you zoom in more
                
                return (
                  <g key={system.key}>
                    <image
                      href={galaxyImage}
                      x={system.center.x - imageSize / 2}
                      y={system.center.y - imageSize / 2}
                      width={imageSize}
                      height={imageSize}
                      className="cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                      onClick={() => handleSystemClick(system)}
                      style={{ pointerEvents: 'all' }}
                    />
                    {/* Show galaxy name - visible from 0.02 scale onwards in sector view */}
                    {zoomPan.scale >= 0.02 && (() => {
                      const galaxyKey = `${system.quadrant}:${system.sector}:${system.galaxy}`
                      const galaxyName = galaxyNames.get(galaxyKey)
                      return galaxyName && galaxyName.trim() ? (
                        <text
                          x={system.center.x}
                          y={system.center.y + imageSize / 2 + 12}
                          textAnchor="middle"
                          className="fill-cyan-300 font-mono font-semibold pointer-events-none"
                          style={{ 
                            fontSize: `${Math.max(10, Math.min(14, zoomPan.scale * 120))}px`,
                            textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                          }}
                        >
                          {galaxyName}
                        </text>
                      ) : null
                    })()}
                    {/* Show system identifier below galaxy name (only if no galaxy name shown) */}
                    {zoomPan.scale >= 0.02 && !(galaxyNames.get(`${system.quadrant}:${system.sector}:${system.galaxy}`)?.trim()) && (
                      <text
                        x={system.center.x}
                        y={system.center.y + imageSize / 2 + 12}
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
            </g>
          )}

          {/* Galaxy level - show systems with SystemView component */}
          {zoomLevel === 'galaxy' && visibleSystems.length > 0 && (
            <g className="systems-layer">
              {visibleSystems.map(system => (
                <SystemViewMemo
                  key={system.key}
                  system={system}
                  scale={zoomPan.scale}
                  onPlanetClick={handlePlanetClick}
                  onPlanetHover={setHoveredPlanet}
                  hoveredPlanet={hoveredPlanet}
                  systemName={(system.system_name && system.system_name.trim()) || null}
                />
              ))}
            </g>
          )}

          {/* System view - show at scale >= 0.5 */}
          {(zoomLevel === 'system' || zoomLevel === 'planet') && (
            <g className="systems-layer">
              {visibleSystems.map(system => (
                <SystemViewMemo
                  key={system.key}
                  system={system}
                  scale={zoomPan.scale}
                  onPlanetClick={handlePlanetClick}
                  onPlanetHover={setHoveredPlanet}
                  hoveredPlanet={hoveredPlanet}
                  systemName={(system.system_name && system.system_name.trim()) || null}
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
                // Use deterministic random galaxy type based on galaxy key
                const galaxyType = getRandomGalaxyTypeForSystem(galaxyKey)
                const galaxyImage = getGalaxyImage(galaxyType)
                
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
                    {zoomPan.scale > 0.2 && (() => {
                      const galaxyName = galaxyNames.get(galaxyKey)
                      const displayName = (galaxyName && galaxyName.trim()) ? galaxyName : `Galaxy ${galaxyKey}`
                      return (
                        <text
                          x={centerX}
                          y={centerY + 30}
                          textAnchor="middle"
                          className="text-xs fill-cyan-300 font-mono font-semibold"
                          style={{ 
                            textShadow: '0 0 4px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 0.8)'
                          }}
                        >
                          {displayName}
                        </text>
                      )
                    })()}
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

          
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur-sm px-4 py-3 angled-corners border border-gray-700">
          <button
            onClick={() => zoomPan.zoomIn()}
            className="p-2 bg-blue-600 hover:bg-blue-700 angled-corners text-white font-bold text-lg"
            title="Zoom In"
          >
            +
          </button>
          <div className="text-center text-xs text-white px-2 font-mono">
            {Math.round(zoomPan.scale * 100)}%
          </div>
          <button
            onClick={() => zoomPan.zoomOut()}
            className="p-2 bg-blue-600 hover:bg-blue-700 angled-corners text-white font-bold text-lg"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => zoomPan.reset()}
            className="p-2 bg-gray-600 hover:bg-gray-700 angled-corners text-white text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm px-4 py-3 angled-corners text-white text-sm border border-gray-700">
          <div className="font-mono">
            Zoom: {zoomLevel} ({Math.round(zoomPan.scale * 100)}%)
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Planets: {allPlanets.length} | Systems: {systemsByKey.size}
          </div>
        </div>

        {/* Jump button */}
        <button
          onClick={() => setShowJumpPanel(true)}
          className="absolute bottom-4 right-4 z-50 bg-cyan-600 hover:bg-cyan-700 angled-corners text-white px-4 py-2 text-sm font-semibold border border-cyan-400/30 hover:border-cyan-400/50 transition-all"
          title="Jump to Coordinates"
        >
          Jump
        </button>

        {/* Coordinate Jump Panel */}
        {showJumpPanel && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]">
            <CoordinateJumpPanel
              onJump={(centerX, centerY, zoom) => {
                // Use the same approach as homeworld centering
                // Formula: panX = (gridWidth / 2 - targetX) * scale
                // This centers the viewport on the target coordinate
                const targetPanX = (gridWidth / 2 - centerX) * zoom
                const targetPanY = (gridHeight / 2 - centerY) * zoom
                
                // Use setZoomAndPan to set both together atomically
                if (zoomPan.setZoomAndPan) {
                  zoomPan.setZoomAndPan(zoom, targetPanX, targetPanY)
                } else {
                  // Fallback: set zoom first, then pan
                  zoomPan.setZoom(zoom)
                  requestAnimationFrame(() => {
                    zoomPan.setPan(targetPanX, targetPanY)
                  })
                }
                
                setShowJumpPanel(false)
              }}
              onClose={() => setShowJumpPanel(false)}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
            />
          </div>
        )}
      </div>
    </div>
  )
}

