import { useState, useMemo, useRef, useEffect } from 'react'
import { useGetUniverseConfigQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { useAuth } from '@/hooks/useAuth'
import { useZoomPan, normalizedToRenderScale } from '@/hooks/useZoomPan'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { getPlanetXY, parseCoordinate } from '@/lib/coordinates'
import { 
  groupPlanetsBySystem,
  convertSystemGroupsToData,
  type SystemData
} from '@/lib/systemUtils'
import { getPlanetImage } from '@/lib/planetImages'
import { getGalaxyImage, getRandomGalaxyTypeForSystem } from '@/lib/galaxyImages'
import { getSectorXyRange, getGalaxyXyRange } from '@/lib/coordinateUtils'
import { getLayerOpacity } from '@/lib/zoomLevels'
import { SystemViewMemo } from './SystemView'
import { GridOverlay } from './GridOverlay'
import { SectorOverlay } from './SectorOverlay'
import { LayerWrapper } from './LayerWrapper'
import { Planet } from '@/types/api.types'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { MapControlsPanel } from './MapControlsPanel'

// Default grid dimensions (will be overridden by config)
// Universe is now rectangular: 2000 x 1000
const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 1000

/**
 * UnifiedUniverseMapV2 - Main component for the 4-level universe map
 * 
 * Features:
 * - Pre-loads all planet data before rendering
 * - Single flat grid with zoom/pan
 * - 4 zoom levels: Sector → Galaxy → System → Planetary
 * - 0% zoom (scale 0.09) = sector view showing all galaxies clearly
 * - 350% zoom (scale 1.554) = systems view showing all systems clearly and pannable (slightly more zoomed than 277%)
 * - System-level rendering with central stars and orbit lines
 * - Navigation overlays for sector
 */
export function UnifiedUniverseMapV2() {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<SystemData | null>(null)
  const debugLoggedRef = useRef(false)
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig, error: configError } = useGetUniverseConfigQuery()
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
  // Start at sector level (showing all galaxies across the universe at 3% zoom)
  // 0% zoom (minScale) = sector view showing all galaxies clearly (like 9% in old version)
  // 350% zoom (maxScale) = systems view showing all systems clearly (slightly more zoomed than 277%)
  const zoomPan = useZoomPan({
    minScale: 0.09,  // 0% zoom - sector view showing all galaxies clearly
    maxScale: 1.554,  // 350% zoom - systems view showing all systems clearly (slightly more zoomed than 277%)
    initialScale: 0.103, // Start at 3% zoom (sector level) - shows all galaxies clearly
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

  // Get normalized zoom (0.0 = Sector, 1.0 = Systems)
  // 0% zoom (scale 0.09) = sector view showing all galaxies clearly
  // 350% zoom (scale 1.554) = systems view showing all systems clearly (slightly more zoomed than 277%)
  const normalizedZoom = zoomPan.normalizedZoom

  // Determine current zoom level based on normalized zoom
  const zoomLevel = useMemo(() => {
    const normalized = zoomPan.normalizedZoom
    if (normalized < 0.30) return 'sector'  // Sector view - shows all galaxies clearly
    if (normalized < 0.55) return 'galaxy'  // Galaxy view - shows systems with stars
    if (normalized < 0.80) return 'system'  // System view - shows full system details
    return 'planet'  // Planetary view - individual planet detail (at max zoom, shows all systems)
  }, [zoomPan.normalizedZoom])

  // Debug: Log viewport and system distribution (once per mount)
  useEffect(() => {
    if (systemsByKey.size > 0 && !debugLoggedRef.current && allPlanets.length > 0) {
      debugLoggedRef.current = true
      
      // Check how many planets have actual X/Y coordinates
      const planetsWithXY = allPlanets.filter(p => {
        if (typeof p.x === 'number' && typeof p.y === 'number') return true
        if (p.coordinate && typeof p.coordinate === 'object' && p.coordinate !== null) {
          const coord = p.coordinate as { x?: number; y?: number }
          return typeof coord.x === 'number' && typeof coord.y === 'number'
        }
        return false
      }).length
      const planetsNeedingConversion = allPlanets.length - planetsWithXY
      
      const allSystems = Array.from(systemsByKey.values())
      const minX = Math.min(...allSystems.map(s => s.center.x))
      const maxX = Math.max(...allSystems.map(s => s.center.x))
      const minY = Math.min(...allSystems.map(s => s.center.y))
      const maxY = Math.max(...allSystems.map(s => s.center.y))
      const avgX = allSystems.reduce((sum, s) => sum + s.center.x, 0) / allSystems.length
      const avgY = allSystems.reduce((sum, s) => sum + s.center.y, 0) / allSystems.length
      
      // Count systems in each quadrant
      const quadrantCounts = { q1: 0, q2: 0, q3: 0, q4: 0 }
      allSystems.forEach(s => {
        if (s.center.x < gridWidth / 2 && s.center.y < gridHeight / 2) quadrantCounts.q1++
        else if (s.center.x >= gridWidth / 2 && s.center.y < gridHeight / 2) quadrantCounts.q2++
        else if (s.center.x < gridWidth / 2 && s.center.y >= gridHeight / 2) quadrantCounts.q3++
        else quadrantCounts.q4++
      })
      
      console.log('[Map Debug] System distribution:', {
        totalSystems: allSystems.length,
        xRange: { min: minX, max: maxX, span: maxX - minX, avg: avgX, expectedSpan: gridWidth },
        yRange: { min: minY, max: maxY, span: maxY - minY, avg: avgY, expectedSpan: gridHeight },
        quadrantDistribution: quadrantCounts,
        viewportBounds: zoomPan.viewportBounds,
        pan: { x: zoomPan.panX, y: zoomPan.panY },
        scale: zoomPan.scale,
        gridSize: { width: gridWidth, height: gridHeight }
      })
      
      console.log('[Map Debug] Planet coordinate source:', {
        total: allPlanets.length,
        withDirectXY: planetsWithXY,
        needingConversion: planetsNeedingConversion,
        conversionPercentage: ((planetsNeedingConversion / allPlanets.length) * 100).toFixed(1) + '%'
      })
      
      // Warn if systems are clustered (span < 50% of grid)
      if ((maxX - minX) < gridWidth * 0.5 || (maxY - minY) < gridHeight * 0.5) {
        console.warn('[Map Debug] ⚠️ Systems appear clustered! Span is less than 50% of grid size.')
        console.warn('[Map Debug] X span:', (maxX - minX), 'of', gridWidth, '(' + (((maxX - minX) / gridWidth) * 100).toFixed(1) + '%)')
        console.warn('[Map Debug] Y span:', (maxY - minY), 'of', gridHeight, '(' + (((maxY - minY) / gridHeight) * 100).toFixed(1) + '%)')
        console.warn('[Map Debug] This suggests planets may not have proper X/Y coordinates and are using fallback conversion.')
        console.warn('[Map Debug] Check backend to ensure planets have x/y fields populated in database.')
      }
    }
  }, [systemsByKey, allPlanets, gridWidth, gridHeight, zoomPan.viewportBounds, zoomPan.panX, zoomPan.panY, zoomPan.scale])

  // Track container dimensions for resize handling (needed by dynamicViewBox)
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

  // Calculate dynamic viewBox FIRST (needed by visibleSystems)
  // Calculate dynamic viewBox preserving grid aspect ratio (2:1) to prevent coordinate distortion
  // No rounding for perfectly smooth panning at every zoom level
  // Keep all values precise to prevent any snapping or jumping
  const roundedPanX = zoomPan.panX  // No rounding - completely smooth
  const roundedPanY = zoomPan.panY  // No rounding - completely smooth
  const roundedScale = zoomPan.scale  // No rounding - completely smooth
  
  // Grid aspect ratio (2:1) - preserve this to maintain spatial relationships
  const gridAspectRatio = gridWidth / gridHeight
  
  const dynamicViewBox = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { viewBox: `0 0 ${gridWidth} ${gridHeight}`, bounds: { minX: 0, minY: 0, maxX: gridWidth, maxY: gridHeight } }
    }
    
    const containerWidth = containerSize.width
    const containerHeight = containerSize.height
    
    // Calculate what grid coordinates are visible based on current scale and pan
    const scale = roundedScale
    const panX = roundedPanX
    const panY = roundedPanY
    
    // Calculate center point in grid coordinates
    // This matches the formula in useZoomPan: centerX = -panX/scale + gridWidth/2
    const centerX = -panX / scale + gridWidth / 2
    const centerY = -panY / scale + gridHeight / 2
    
    // Calculate visible width/height in grid coordinates based on container size
    // Preserve grid aspect ratio - don't stretch to match container
    let visibleGridWidth = containerWidth / scale
    let visibleGridHeight = containerHeight / scale
    
    // Adjust visible area to preserve grid aspect ratio
    // If container is wider than grid aspect, we'll see more width (letterboxing)
    // If container is taller than grid aspect, we'll see more height (pillarboxing)
    const visibleAspectRatio = visibleGridWidth / visibleGridHeight
    if (visibleAspectRatio > gridAspectRatio) {
      // Container is wider relative to grid - adjust height to match grid aspect
      visibleGridHeight = visibleGridWidth / gridAspectRatio
    } else {
      // Container is taller relative to grid - adjust width to match grid aspect
      visibleGridWidth = visibleGridHeight * gridAspectRatio
    }
    
    // Calculate bounds - allow extending beyond grid at sector level
    const normalizedZoom = zoomPan.normalizedZoom
    const isSectorLevel = normalizedZoom < 0.30
    const allowOffCanvas = isSectorLevel
    
    let minX = centerX - visibleGridWidth / 2
    let maxX = centerX + visibleGridWidth / 2
    let minY = centerY - visibleGridHeight / 2
    let maxY = centerY + visibleGridHeight / 2
    
    // Only clamp to grid boundaries if not allowing off-canvas panning
    if (!allowOffCanvas) {
      minX = Math.max(0, minX)
      maxX = Math.min(gridWidth, maxX)
      minY = Math.max(0, minY)
      maxY = Math.min(gridHeight, maxY)
    }
    
    let width = maxX - minX
    let height = maxY - minY
    
    // Ensure aspect ratio is preserved (should already be, but double-check)
    const calculatedAspect = width / height
    if (Math.abs(calculatedAspect - gridAspectRatio) > 0.001) {
      // Correct any minor drift to maintain exact aspect ratio
      if (calculatedAspect > gridAspectRatio) {
        height = width / gridAspectRatio
        const heightDiff = height - (maxY - minY)
        minY = minY - heightDiff / 2
        maxY = maxY + heightDiff / 2
      } else {
        width = height * gridAspectRatio
        const widthDiff = width - (maxX - minX)
        minX = minX - widthDiff / 2
        maxX = maxX + widthDiff / 2
      }
    }
    
    // Add generous padding to prevent items from popping in/out during pan
    // More padding at sector level for smoother panning
    const paddingFactor = isSectorLevel ? 0.15 : 0.1
    const padding = Math.max(width, height) * paddingFactor
    
    let viewBoxX = minX - padding
    let viewBoxY = minY - padding
    let viewBoxWidth = width + padding * 2
    let viewBoxHeight = height + padding * 2
    
    // Ensure padding preserves aspect ratio
    const paddedAspect = viewBoxWidth / viewBoxHeight
    if (Math.abs(paddedAspect - gridAspectRatio) > 0.001) {
      if (paddedAspect > gridAspectRatio) {
        viewBoxHeight = viewBoxWidth / gridAspectRatio
        const heightDiff = viewBoxHeight - (height + padding * 2)
        viewBoxY = viewBoxY - heightDiff / 2
      } else {
        viewBoxWidth = viewBoxHeight * gridAspectRatio
        const widthDiff = viewBoxWidth - (width + padding * 2)
        viewBoxX = viewBoxX - widthDiff / 2
      }
    }
    
    // Only clamp to grid boundaries if not allowing off-canvas panning
    if (!allowOffCanvas) {
      viewBoxX = Math.max(0, viewBoxX)
      viewBoxY = Math.max(0, viewBoxY)
      viewBoxWidth = Math.min(gridWidth, viewBoxWidth)
      viewBoxHeight = Math.min(gridHeight, viewBoxHeight)
    }
    
    // No rounding - keep values completely precise for smooth panning at every zoom level
    // Maintain spatial relationships during pan/zoom operations
    return {
      viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
      bounds: {
        minX: viewBoxX,
        minY: viewBoxY,
        maxX: viewBoxX + viewBoxWidth,
        maxY: viewBoxY + viewBoxHeight
      }
    }
  }, [roundedPanX, roundedPanY, roundedScale, containerSize.width, containerSize.height, gridWidth, gridHeight, gridAspectRatio, zoomPan.normalizedZoom])

  // Filter entities visible in viewport
  // At all zoom levels except individual system zoom, show ALL entities in viewport
  // Only apply filtering when zoomed into individual systems (scale >= 3.0)
  const visibleSystems = useMemo(() => {
    // Use dynamicViewBox bounds instead of viewportBounds for more accurate visibility
    // This ensures we use the same bounds that the SVG viewBox uses
    const bounds = dynamicViewBox.bounds
    const scale = zoomPan.scale
    
    // When NOT zoomed into individual systems (scale < 1.5), show ALL entities in viewport
    // This includes sector, galaxy, and system overview levels
    if (scale < 1.5) {
      const allInViewport: SystemData[] = []
      
      // At low zoom levels, use the extended bounds from dynamicViewBox
      // No additional padding needed since viewBox already has generous padding
      const padding = scale >= 1.2 ? 40      // Medium-high: moderate padding
        : scale >= 0.8 ? 60                  // Medium: generous padding
        : scale >= 0.5 ? 100                 // Medium: very generous padding
        : scale >= 0.2 ? 150                 // Low: very generous padding
        : scale >= 0.1 ? 200                 // Low: maximum padding
        : 300                                 // Very low: extra maximum padding
      
      // Collect ALL systems in viewport (with padding for smooth panning)
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
      
      // Return all systems in viewport - no filtering, no limits
      return allInViewport
    }
    
    // When zoomed into individual systems (scale >= 1.5), apply filtering to prevent overlap
    const allInViewport: SystemData[] = []
    
    // Padding based on zoom level - more padding at lower zoom for smoother panning
    const padding = scale >= 1.554 ? 5   // 350% zoom (max): minimal padding
      : scale > 1.3 ? 15                 // 300% zoom: small padding
      : scale > 1.1 ? 25                 // 250% zoom: moderate padding
      : 40                               // Fallback
    
    // Collect systems in viewport
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
    // At max zoom (1.554), reduce spacing to show more systems clearly
    const minSystemDistance = scale >= 1.554 ? 70   // 350% zoom: medium spacing for systems view
      : scale > 1.3 ? 60                           // 300% zoom: smaller spacing
      : scale > 1.1 ? 50                           // 250% zoom: small spacing
      : 40                                         // Fallback
    
    // Maximum number of systems to show - at max zoom, show all systems in viewport
    const maxSystems = scale >= 1.554 ? 100  // 350% zoom: show all systems (no limit)
      : scale > 1.3 ? 50                     // 300% zoom: show many systems
      : scale > 1.1 ? 30                     // 250% zoom: show moderate systems
      : 20                                    // Fallback
    
    // Filter by distance and max systems
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
  }, [systemsByKey, dynamicViewBox.bounds, zoomPan.scale])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlanets.length, enrichedPlanets, mapData, zoomLevel, zoomPan.scale, visibleSystems.length, visiblePlanets.length, isLoadingConfig, isLoadingPlanets])

  // Handle system click - use normalized zoom for consistent transitions
  const handleSystemClick = (system: SystemData) => {
    const currentNormalized = zoomPan.normalizedZoom
    
    // Determine target zoom level based on current zoom
    // Use hierarchical zoom thresholds for smooth transitions
    if (currentNormalized >= 0.50 && currentNormalized < 0.80) {
      // Currently at system level - zoom out to galaxy level
      const galaxyRange = getGalaxyXyRange(system.quadrant, system.sector, system.galaxy)
      const centerX = (galaxyRange.x_min + galaxyRange.x_max) / 2
      const centerY = (galaxyRange.y_min + galaxyRange.y_max) / 2
      const screen = zoomPan.gridToScreen(centerX, centerY)
      // Zoom to galaxy level (normalized 0.30-0.40 for smooth transition)
      zoomPan.setNormalizedZoom(0.35, screen.x, screen.y)
    } else if (currentNormalized >= 0.75) {
      // Currently at planetary level - zoom out to system level
      const centerX = system.center.x
      const centerY = system.center.y
      const screen = zoomPan.gridToScreen(centerX, centerY)
      // Zoom to system level (normalized 0.65-0.70 for smooth transition)
      zoomPan.setNormalizedZoom(0.67, screen.x, screen.y)
      setSelectedSystem(system)
    } else {
      // Zoom in to system level
      const centerX = system.center.x
      const centerY = system.center.y
      const screen = zoomPan.gridToScreen(centerX, centerY)
      // Zoom to system level (normalized 0.65-0.70 for smooth transition)
      zoomPan.setNormalizedZoom(0.67, screen.x, screen.y)
      setSelectedSystem(system)
    }
  }

  // Show loading state only if actively loading config (and not errored)
  // If config errors, use defaults and show the map anyway
  // Allow map to show even if planets haven't loaded yet (they'll appear when loaded)
  // mapData loading is optional - we can show the map without it, names will appear when it loads
  if (isLoadingConfig && !configError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Initializing map...
          </p>
        </div>
      </div>
    )
  }
  
  // If planets are actively loading, show a loading indicator but don't block the map
  // This allows the map to render while planets load in the background
  const isPlanetsLoading = isLoadingPlanets && allPlanets.length === 0

  // Debug logging removed for performance - only log in development if needed
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[UnifiedUniverseMapV2] Rendering:', { zoomLevel, scale: zoomPan.scale, visible: visibleSystems.length })
  // }

  return (
    <div 
      className="fixed inset-0 overflow-hidden z-0" 
      style={{ 
        backgroundColor: 'transparent',
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
        {/* Background gradient fade - Fixed, doesn't move with panning */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none z-0" />
        
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
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
          {/* Transparent background */}
          <rect width={gridWidth} height={gridHeight} fill="transparent" />
          
          {/* Grid overlay - hide at 350% zoom (scale >= 1.554) */}
          {zoomPan.scale < 1.554 && (
            <GridOverlay
              width={gridWidth}
              height={gridHeight}
              scale={zoomPan.scale}
              normalizedZoom={normalizedZoom}
              viewportBounds={zoomPan.viewportBounds}
            />
          )}

          {/* Navigation overlays with layer fading */}
          <LayerWrapper layerName="sector" normalizedZoom={normalizedZoom}>
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
                // Zoom to sector level (normalized 0.05-0.10 for smooth transition)
                zoomPan.setNormalizedZoom(0.08, screen.x, screen.y)
              }}
            />
          </LayerWrapper>

          {/* Render based on zoom level with layer fading */}
          {/* Sector level - show systems as galaxy images (extended range) */}
          {/* Always render at 0% zoom and above - opacity will handle visibility */}
          <LayerWrapper layerName="sector" normalizedZoom={normalizedZoom}>
            {(getLayerOpacity('sector', normalizedZoom) > 0) && (
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
                      className="cursor-pointer hover:brightness-110 transition-all"
                      onClick={() => handleSystemClick(system)}
                      style={{ pointerEvents: 'all' }}
                    />
                    {/* Show galaxy name - visible from 0% zoom (0.09 scale) onwards in sector view */}
                    {zoomPan.scale >= 0.09 && (() => {
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
                    {zoomPan.scale >= 0.09 && !(galaxyNames.get(`${system.quadrant}:${system.sector}:${system.galaxy}`)?.trim()) && (
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
          </LayerWrapper>

          {/* Galaxy level - show systems with SystemView component */}
          {/* Performance: Use detail level based on zoom */}
          <LayerWrapper layerName="galaxy" normalizedZoom={normalizedZoom}>
            {(getLayerOpacity('galaxy', normalizedZoom) > 0) && visibleSystems.length > 0 && (
              <g className="systems-layer">
                {visibleSystems.map(system => {
                  // Determine detail level based on zoom for performance
                  // Low zoom (< 0.3): minimal (dots), Medium (0.3-0.7): standard (images, no labels), High (0.7+): full (all details)
                  const detailLevel: 'minimal' | 'standard' | 'full' = 
                    normalizedZoom < 0.3 ? 'minimal'
                    : normalizedZoom < 0.7 ? 'standard'
                    : 'full'
                  
                  return (
                    <SystemViewMemo
                      key={system.key}
                      system={system}
                      scale={zoomPan.scale}
                      normalizedZoom={normalizedZoom}
                      detailLevel={detailLevel}
                      onPlanetClick={handlePlanetClick}
                      onPlanetHover={setHoveredPlanet}
                      hoveredPlanet={hoveredPlanet}
                      systemName={(system.system_name && system.system_name.trim()) || null}
                    />
                  )
                })}
              </g>
            )}
          </LayerWrapper>

          {/* System view - show at scale >= 0.5 */}
          {/* Performance: Always use full detail at system level for best experience */}
          <LayerWrapper layerName="system" normalizedZoom={normalizedZoom}>
            {(zoomLevel === 'system' || zoomLevel === 'planet' || getLayerOpacity('system', normalizedZoom) > 0.01) && (
              <g className="systems-layer">
                {visibleSystems.map(system => (
                  <SystemViewMemo
                    key={system.key}
                    system={system}
                    scale={zoomPan.scale}
                    normalizedZoom={normalizedZoom}
                    detailLevel="full"  // Always full detail at system level
                    onPlanetClick={handlePlanetClick}
                    onPlanetHover={setHoveredPlanet}
                    hoveredPlanet={hoveredPlanet}
                    systemName={(system.system_name && system.system_name.trim()) || null}
                  />
                ))}
              </g>
            )}
          </LayerWrapper>

          {/* Fallback: show galaxies if no systems visible at galaxy level */}
          {zoomLevel === 'galaxy' && visibleSystems.length === 0 && (
            <g className="galaxies-layer">
              {Array.from(systemsByGalaxy.entries()).map(([galaxyKey]) => {
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
                      // Zoom to galaxy level using normalized zoom for consistent transitions
                      zoomPan.setNormalizedZoom(0.35, screen.x, screen.y)
                    }}
                  >
                    <image
                      href={galaxyImage}
                      x={centerX - 20}
                      y={centerY - 20}
                      width={40}
                      height={40}
                      className="cursor-pointer hover:brightness-110 transition-all"
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

        {/* Map Controls Panel - sliding from right */}
        <MapControlsPanel
          zoomPan={zoomPan}
          zoomLevel={zoomLevel}
          allPlanets={allPlanets}
          onSearch={(centerX, centerY, normalizedZoom) => {
            // Convert normalized zoom to render scale
            const targetScale = normalizedToRenderScale(normalizedZoom)
            
            // Calculate target pan to center the coordinate in the viewport
            const targetPanX = (gridWidth / 2 - centerX) * targetScale
            const targetPanY = (gridHeight / 2 - centerY) * targetScale
            
            // Use smooth transition for better UX
            zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 800)
          }}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          systemsCount={systemsByKey.size}
          minScale={0.09}
          maxScale={1.554}
        />
        
        {/* Loading indicator overlay for planets (non-blocking) */}
        {isPlanetsLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4" />
              <p className="text-sm text-muted-foreground">
                Loading planets...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

