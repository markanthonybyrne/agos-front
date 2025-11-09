import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useGetUniverseConfigQuery, useGetMapQuery, useGetVisibilityQuery } from '@/api/endpoints/universeApi'
import { useGetIncidentsQuery } from '@/api/endpoints/incidentsApi'
import { useNavigate } from 'react-router-dom'
import { buildGalaxyData, SystemData, RegionData } from '@/lib/galaxyUtils'
import { useZoomPan, normalizedToRenderScale } from '@/hooks/useZoomPan'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/app/hooks'
import { useWindow } from '@/components/common/WindowManager'
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Eye, Ship, Globe, MapPin, Search, Target, Users, FileText, Navigation } from 'lucide-react'
import { EVEStyleMapControls } from './EVEStyleMapControls'
import { GalaxyRegionLayer } from './GalaxyRegionLayer'
import { HyperspaceRoutesLayer } from './HyperspaceRoutesLayer'
import { SystemMarkersLayer } from './SystemMarkersLayer'
import { GalaxyMapLegend } from './GalaxyMapLegend'
import { GalacticCoreLayer } from './GalacticCoreLayer'
import { SpiralArmGuidelinesLayer } from './SpiralArmGuidelinesLayer'
import { GalacticOrbitalRingsLayer } from './GalacticOrbitalRingsLayer'
// import { PlanetOrbitsLayer } from './PlanetOrbitsLayer' // Disabled - orbit lines removed at region level
import { FogOfWarLayer } from './FogOfWarLayer'
import { IncidentLayer } from '@/components/incidents/IncidentLayer'
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel'
import { Incident } from '@/types/api.types'
// import { Loader } from '@/components/ui/loader' // Replaced with blurred glass overlay
import { GALACTIC_CORE } from '@/lib/spiralUtils'
import { getPlanetXY, formatCoordinate } from '@/lib/coordinates'
import { isPlanetVisible } from '@/lib/visibilityUtils'
import { getPlanetRegionAndSystem } from '@/lib/galaxyUtils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { formatNumber } from '@/lib/formatters'
import { ResourceRarity } from '@/types/api.types'
import { toast } from 'sonner'

const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 2000

type RarityFilter = 'all' | ResourceRarity

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
  const { openPanel } = useWindow()
  const [hoveredSystem, setHoveredSystem] = useState<SystemData | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null)
  const [showSpiralGuidelines, setShowSpiralGuidelines] = useState(false)
  const [zoomedIntoRegion, setZoomedIntoRegion] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false) // Toggle for hyperspace routes
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [contextMenuSystem, setContextMenuSystem] = useState<SystemData | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  
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

  const aggregatedReserves = useMemo(
    () => planetsToUse.flatMap((planet) => planet.secondary_reserves ?? []),
    [planetsToUse],
  )

  const { secondaryResources, getMetadata } = useResourcesCatalog({
    reserves: aggregatedReserves,
  })
  
  // Fetch incidents (filtered by visibility automatically by API)
  const { data: incidentsData } = useGetIncidentsQuery()
  
  // Fetch visibility data to filter planets/systems/regions
  const { data: visibilityData } = useGetVisibilityQuery()
  
  // Filter planets by visibility before building galaxy data
  const visiblePlanets = useMemo(() => {
    if (!planetsToUse || planetsToUse.length === 0) {
      return []
    }
    
    // Filter planets that are visible based on fog of war or visibility data
    return planetsToUse.filter(planet => {
      // Check planet's own visibility flags first (most direct)
      if (planet.fog_of_war) {
        if (!planet.fog_of_war.is_visible) return false
      } else if (planet.visibility) {
        if (!planet.visibility.is_visible) return false
      } else {
        // Fallback: Check against visibility data
        if (!isPlanetVisible(planet, visibilityData)) return false
      }
      
      return true
    })
  }, [planetsToUse, visibilityData])
  
  // Build galaxy data structure from visible planets only
  const galaxyData = useMemo(() => {
    // Build galaxy data with region and system names from API response
    const regionNames = mapData?.region_names || {}
    const systemNames = mapData?.system_names || {}
    
    // If no visible planets, still create empty regions with names for the legend
    if (!visiblePlanets || visiblePlanets.length === 0) {
      const regions = new Map<number, RegionData>()
      // Create all 20 regions with names (for legend display)
      for (let i = 1; i <= 20; i++) {
        const regionName = regionNames[i.toString()] || regionNames[i] || null
        const trimmedName = regionName && typeof regionName === 'string' ? regionName.trim() : null
        regions.set(i, {
          region: i,
          name: trimmedName,
          systems: [],
          bounds: {
            minX: 0,
            maxX: gridWidth,
            minY: 0,
            maxY: gridHeight,
            centerX: gridWidth / 2,
            centerY: gridHeight / 2,
          }
        })
      }
      return { regions, systems: new Map(), systemMap: [] }
    }
    
    const built = buildGalaxyData(visiblePlanets, regionNames, systemNames)
    
    // Ensure all 20 regions exist in the map (even if empty) for legend display
    // This preserves region names even when regions have no visible planets
    // Also update existing regions to ensure they have names from regionNames map
    for (let i = 1; i <= 20; i++) {
      const existingRegion = built.regions.get(i)
      
      // Get region name from regionNames map (most reliable source)
      const regionName = regionNames[i.toString()] || regionNames[i] || null
      const trimmedName = regionName && typeof regionName === 'string' ? regionName.trim() : null
      
      // Try to get name from any planet (even if not visible) as fallback
      let fallbackName: string | null = null
      if (!trimmedName && planetsToUse.length > 0) {
        const planetWithRegion = planetsToUse.find(p => {
          const { region } = getPlanetRegionAndSystem(p)
          return region === i
        })
        fallbackName = planetWithRegion?.region_name?.trim() || null
      }
      
      const finalName = trimmedName || fallbackName
      
      if (existingRegion) {
        // Update existing region to ensure it has the name from regionNames map
        // Only update if we have a name and the existing one is different/null
        if (finalName && existingRegion.name !== finalName) {
          built.regions.set(i, {
            ...existingRegion,
            name: finalName
          })
        }
      } else {
        // Create missing region
        built.regions.set(i, {
          region: i,
          name: finalName,
          systems: [],
          bounds: {
            minX: 0,
            maxX: gridWidth,
            minY: 0,
            maxY: gridHeight,
            centerX: gridWidth / 2,
            centerY: gridHeight / 2,
          }
        })
      }
    }
    
    return built
  }, [visiblePlanets, mapData?.region_names, mapData?.system_names, planetsToUse, gridWidth, gridHeight])
  
  // Find the user's home system (always visible, even if not in visible planets)
  const homeSystem = useMemo(() => {
    if (!empire?.homeworld_planet_id) {
      return null
    }
    
    // First try to find in visible planets
    let homeworldPlanet = visiblePlanets.find(p => p.id === empire.homeworld_planet_id)
    
    // If not found in visible planets, try all planets (home system should always be visible)
    if (!homeworldPlanet && planetsToUse.length > 0) {
      homeworldPlanet = planetsToUse.find(p => p.id === empire.homeworld_planet_id)
    }
    
    if (!homeworldPlanet) {
      return null
    }
    
    // Find the system containing this homeworld (check visible systems first, then all)
    let homeSystem = galaxyData.systemMap.find(system => 
      system.planets.some(p => p.id === empire.homeworld_planet_id)
    )
    
    // If not found in visible systems, build a temporary system data for homeworld
    if (!homeSystem && homeworldPlanet) {
      const { region, system } = getPlanetRegionAndSystem(homeworldPlanet)
      if (region !== null && system !== null) {
        // Build a minimal system data for home system
        const xy = getPlanetXY(homeworldPlanet)
        if (xy) {
          homeSystem = {
            region,
            system,
            name: homeworldPlanet.system_name || null,
            center: xy,
            bounds: {
              minX: xy.x - 10,
              maxX: xy.x + 10,
              minY: xy.y - 10,
              maxY: xy.y + 10,
            },
            planets: [homeworldPlanet],
          }
        }
      }
    }
    
    return homeSystem || null
  }, [empire?.homeworld_planet_id, visiblePlanets, planetsToUse, galaxyData.systemMap])
  
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
  
  const minZoomScale = initialScale * 0.5  // Can zoom out a bit more
  const maxZoomScale = initialScale * 8    // Can zoom in 8x
  
  const zoomPan = useZoomPan({
    minScale: minZoomScale,
    maxScale: maxZoomScale,
    initialScale: initialScale,
    initialPanX: 0,  // Start centered (0,0 centers on grid center)
    initialPanY: 0,
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    enableWheelZoom: true,
    zoomSensitivity: 0.1
  })
  
  useEffect(() => {
    const handleCenter = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number; zoom?: number }>).detail
      if (!detail) return
      const { x, y, zoom = 0.95 } = detail
      const targetScale = normalizedToRenderScale(zoom)
      const targetPanX = (gridWidth / 2 - x) * targetScale
      const targetPanY = (gridHeight / 2 - y) * targetScale
      zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 600)
    }

    window.addEventListener('map:centerOn', handleCenter as EventListener)
    return () => window.removeEventListener('map:centerOn', handleCenter as EventListener)
  }, [gridWidth, gridHeight, zoomPan])
  
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

  // Handle system right-click
  const handleSystemRightClick = useCallback((system: SystemData, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenuSystem(system)
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setShowContextMenu(true)
  }, [])

  // Handle map background right-click
  const handleMapContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuSystem(null)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }, [])

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setShowContextMenu(false)
    setContextMenuSystem(null)
  }, [])

  // Track when menu was opened to prevent immediate closure
  const menuOpenedAtRef = useRef<number>(0)
  
  // Update opened time when menu opens
  useEffect(() => {
    if (showContextMenu) {
      menuOpenedAtRef.current = Date.now()
    }
  }, [showContextMenu])

  // Close context menu when clicking on map (with delay to prevent immediate closure)
  useEffect(() => {
    if (!showContextMenu) return

    const handleMapClick = () => {
      // Prevent immediate closure from the right-click that opened the menu
      const timeSinceOpen = Date.now() - menuOpenedAtRef.current
      if (timeSinceOpen < 200) {
        return
      }
      
      // Close menu on any click outside (the ContextMenu component will handle checking if click is inside)
      closeContextMenu()
    }

    // Use capture phase to catch events before they bubble
    // Add delay to prevent immediate closure from the right-click that opened the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleMapClick, true)
    }, 250)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleMapClick, true)
    }
  }, [showContextMenu, closeContextMenu])

  // Get context menu items
  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (contextMenuSystem) {
      // Check if system has any planets owned by the player
      const hasOwnedPlanets = contextMenuSystem.planets.some(
        p => p.owner_empire_id === empire?.id
      )
      const hasAnyOwner = contextMenuSystem.planets.some(p => p.owner_empire_id)

      return [
        {
          label: 'View System',
          icon: Eye,
          onClick: () => {
            closeContextMenu()
            navigate(`/map/system/${contextMenuSystem.region}/${contextMenuSystem.system}`)
          },
        },
        {
          label: 'Zoom to System',
          icon: Navigation,
          onClick: () => {
            closeContextMenu()
            const systemViewThreshold = initialScale * 5
            const targetPanX = (gridWidth / 2 - contextMenuSystem.center.x) * systemViewThreshold
            const targetPanY = (gridHeight / 2 - contextMenuSystem.center.y) * systemViewThreshold
            zoomPan.smoothSetZoomAndPan(systemViewThreshold, targetPanX, targetPanY, 500)
          },
        },
        { label: '', icon: undefined, onClick: () => {}, separator: true },
        ...(!hasAnyOwner
          ? [
              {
                label: 'Explore System',
                icon: Search,
                onClick: () => {
                  closeContextMenu()
                  if (!contextMenuSystem) return
                  const firstPlanet = contextMenuSystem.planets?.[0]
                  if (!firstPlanet) {
                    toast.error('No planets available in this system to scan yet.')
                    return
                  }
                  const coordinate = formatCoordinate(firstPlanet.coordinate)
                  if (!coordinate || coordinate === 'Invalid coordinate') {
                    toast.error('Unable to determine system coordinates for scanning.')
                    return
                  }
                  openPanel(PanelType.SIGNALS, PanelSize.LARGE, {
                    initialTarget: {
                      coordinate,
                      type: 'all_frequency',
                    },
                  })
                },
              },
            ]
          : []),
        {
          label: 'Send Fleet',
          icon: Ship,
          onClick: () => {
            closeContextMenu()
            // Use first planet in system as destination, or allow user to choose
            const firstPlanet = contextMenuSystem.planets[0]
            if (firstPlanet) {
              openPanel(PanelType.FLEET_COMMAND, PanelSize.MEDIUM, {
                destinationPlanet: firstPlanet.id,
              })
            }
          },
        },
        ...(hasOwnedPlanets
          ? [
              { label: '', icon: undefined, onClick: () => {}, separator: true },
              {
                label: 'My Planets in System',
                icon: Target,
                onClick: () => {
                  closeContextMenu()
                  navigate(`/map/system/${contextMenuSystem.region}/${contextMenuSystem.system}`)
                },
              },
            ]
          : []),
      ]
    } else {
      // Map background context menu
      return [
        {
          label: 'View Galaxy Map',
          icon: Globe,
          onClick: () => {
            closeContextMenu()
            navigate('/map')
          },
        },
        {
          label: 'My Planets',
          icon: MapPin,
          onClick: () => {
            closeContextMenu()
            navigate('/planets')
          },
        },
        { label: '', icon: undefined, onClick: () => {}, separator: true },
        {
          label: 'Fleet Management',
          icon: Ship,
          onClick: () => {
            closeContextMenu()
            openPanel(PanelType.FLEETS, PanelSize.LARGE)
          },
        },
        {
          label: 'Alliances',
          icon: Users,
          onClick: () => {
            closeContextMenu()
            openPanel(PanelType.POLITICS, PanelSize.LARGE)
          },
        },
        {
          label: 'Messages',
          icon: FileText,
          onClick: () => {
            closeContextMenu()
            openPanel(PanelType.MESSAGING, PanelSize.LARGE)
          },
        },
      ]
    }
  }, [contextMenuSystem, empire?.id, openPanel, navigate, closeContextMenu, initialScale, zoomPan, gridWidth, gridHeight])
  
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
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, gridWidth, gridHeight, zoomPan.containerRef])

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
  }, [zoomPan.scale, zoomPan.panX, zoomPan.panY, gridWidth, gridHeight, zoomPan.containerRef])
  
  // Wait for planets to be loaded from Redux store before rendering map
  // This ensures we have all 8,000+ planets available
  // Show blurred glass overlay while loading
  const isLoading = isLoadingConfig || isLoadingMap || !planetsLoaded || planetsToUse.length === 0
  
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
  
  return (
    <div 
      ref={zoomPan.containerRef}
      className="fixed inset-0 overflow-hidden z-0"
      data-onboarding-target="galaxy-map"
      style={{ 
        backgroundColor: 'transparent',
      }}
      onWheel={zoomPan.onWheel}
      onContextMenu={handleMapContextMenu}
    >
      <div className="absolute bottom-6 right-6 z-[200] w-64 space-y-2">
        <div className="rounded-lg border border-cyan-500/20 bg-slate-900/80 backdrop-blur-sm p-3 shadow-lg shadow-cyan-500/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200 mb-2">
            Materials Overlay
          </p>
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] uppercase text-muted-foreground tracking-wide">
                Highlight Resource
              </label>
              <Select
                value={resourceFilter}
                onValueChange={(value) => setResourceFilter(value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All materials</SelectItem>
                  {secondaryResources.map((resource) => (
                    <SelectItem key={resource.slug} value={resource.slug}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: resource.color }}
                        />
                        {resource.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase text-muted-foreground tracking-wide">
                Rarity Filter
              </label>
              <Select
                value={rarityFilter}
                onValueChange={(value) => setRarityFilter(value as RarityFilter)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All rarities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rarities</SelectItem>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="exotic">Exotic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
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
        
        {/* Layer 1.5: Galactic Orbital Rings (dashed circles around core - region boundaries) */}
        {/* Show region boundary lines up to system view threshold (5x initial scale) */}
        <GalacticOrbitalRingsLayer
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          scale={zoomPan.scale}
          maxScale={initialScale * 5} // Show up to system view threshold
        />
        
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
        
        {/* Layer 3.5: Planet Orbits - Disabled at region level per user request */}
        {/* <PlanetOrbitsLayer
          systems={galaxyData.systemMap}
          scale={zoomPan.scale}
          initialScale={initialScale}
          viewBox={viewBox}
          minZoomRatio={2.5}
          maxZoomRatio={4.9}
        /> */}
        
        {/* Layer 4: System Markers */}
        <SystemMarkersLayer
          systems={galaxyData.systemMap}
          onSystemClick={handleSystemClick}
          onSystemRightClick={handleSystemRightClick}
          hoveredSystem={hoveredSystem}
          onSystemHover={setHoveredSystem}
          scale={zoomPan.scale}
          showNames={zoomedIntoRegion}
          viewportBounds={viewportBounds}
          homeSystem={homeSystem}
          initialScale={initialScale}
          visibilityData={visibilityData}
          highlightResource={resourceFilter === 'all' ? null : resourceFilter}
          highlightRarity={rarityFilter}
          getResourceMetadata={getMetadata}
        />
        
        {/* Layer 5: Incidents */}
        {incidentsData?.incidents && incidentsData.incidents.length > 0 && (
          <IncidentLayer
            incidents={incidentsData.incidents}
            scale={zoomPan.scale}
            viewportBounds={viewportBounds}
            onIncidentClick={setSelectedIncident}
            onIncidentHover={() => {}} // Not using hover state for incidents
          />
        )}
        
        {/* Layer 6: Fog of War - dark cloudy overlay for undiscovered areas (rendered last so it's on top) */}
        <g style={{ pointerEvents: 'none' }}>
          <FogOfWarLayer
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            viewportBounds={viewportBounds}
            scale={zoomPan.scale}
            planets={mapData?.planets || planetsToUse.filter(p => p.fog_of_war?.is_visible !== false)}
            systems={galaxyData.systemMap}
            homeSystem={homeSystem}
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
      
      {/* System hover tooltip with connecting line */}
      {hoveredSystem && (() => {
        const systemScreenPos = zoomPan.gridToScreen(hoveredSystem.center.x, hoveredSystem.center.y)
        const tooltipY = systemScreenPos.y - 70
        const tooltipX = systemScreenPos.x
        const tooltipHeight = 60 // Approximate tooltip height
        const lineStartY = tooltipY + tooltipHeight // Bottom of tooltip
        const lineEndY = systemScreenPos.y // System center
        const lineLength = lineEndY - lineStartY

        const materialSummaryMap = new Map<
          string,
          {
            slug: string
            metadataColor: string
            name: string
            totalRemaining: number
            planetCount: number
            rarity?: string
          }
        >()

        hoveredSystem.planets.forEach((planet) => {
          const reserves = planet.secondary_reserves ?? []
          reserves.forEach((reserve) => {
            const metadata = getMetadata(reserve.slug)
            const summary = materialSummaryMap.get(reserve.slug) || {
              slug: reserve.slug,
              metadataColor: metadata.color,
              name: metadata.name,
              totalRemaining: 0,
              planetCount: 0,
              rarity: metadata.rarity,
            }
            summary.totalRemaining += reserve.remaining ?? 0
            summary.planetCount += 1
            materialSummaryMap.set(reserve.slug, summary)
          })
        })

        const materialSummaries = Array.from(materialSummaryMap.values()).sort(
          (a, b) => b.totalRemaining - a.totalRemaining,
        )
        
        return (
          <>
            {/* Connecting line from tooltip to system with draw animation */}
            <svg
              className="fixed z-40 pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
              }}
            >
              <line
                x1={tooltipX}
                y1={lineStartY}
                x2={tooltipX}
                y2={lineEndY}
                stroke="#00FFFF"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeDasharray="8 4"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 1px rgba(0, 255, 255, 0.5))',
                  strokeDashoffset: lineLength,
                  animation: `drawLine-${hoveredSystem.region}-${hoveredSystem.system} 0.4s ease-out forwards`,
                  animationDelay: '0.1s',
                }}
              />
              <style>{`
                @keyframes drawLine-${hoveredSystem.region}-${hoveredSystem.system} {
                  from {
                    stroke-dashoffset: ${lineLength};
                    opacity: 0;
                  }
                  to {
                    stroke-dashoffset: 0;
                    opacity: 1;
                  }
                }
              `}</style>
            </svg>
            
            {/* Tooltip */}
            <div
              className="fixed z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{
                left: `${tooltipX}px`,
                top: `${tooltipY}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="panel-glass border border-cyan-500/30 rounded-none px-4 py-3 shadow-2xl shadow-cyan-500/10 min-w-[200px] relative">
                {/* Glowing Cyan Stripe at Top */}
                <div 
                  className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                  style={{
                    height: '2px',
                    background: 'linear-gradient(to right, transparent 0%, #00FFFF 20%, #00FFFF 80%, transparent 100%)',
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.9), 0 0 5px rgba(0, 255, 255, 0.7), 0 0 2px rgba(0, 255, 255, 0.5)',
                  }}
                />
                <div className="space-y-1.5" style={{ paddingTop: 'calc(0.25rem + 2px)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-base text-cyan-400">
                      {hoveredSystem.name || `System ${hoveredSystem.region}:${hoveredSystem.system}`}
                    </h4>
                    {homeSystem?.region === hoveredSystem.region && 
                     homeSystem?.system === hoveredSystem.system && (
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300">
                        Home
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Region {hoveredSystem.region} • System {hoveredSystem.system}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hoveredSystem.planets.length} {hoveredSystem.planets.length === 1 ? 'planet' : 'planets'}
                    {hoveredSystem.planets.some(p => p.owner_empire_id === empire?.id) && (
                      <span className="ml-2 text-cyan-400">
                        • {hoveredSystem.planets.filter(p => p.owner_empire_id === empire?.id).length} owned
                      </span>
                    )}
                  </div>
                  {materialSummaries.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Materials
                      </p>
                      {materialSummaries.slice(0, 4).map((summary) => (
                        <div
                          key={`${hoveredSystem.region}-${hoveredSystem.system}-${summary.slug}`}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: summary.metadataColor }}
                            />
                            <span className="text-white">{summary.name}</span>
                            <span className="text-[10px] uppercase text-muted-foreground">
                              ×{summary.planetCount}
                            </span>
                          </div>
                          <span className="font-mono text-white">
                            {formatNumber(summary.totalRemaining)}
                          </span>
                        </div>
                      ))}
                      {materialSummaries.length > 4 && (
                        <p className="text-[10px] text-muted-foreground/80">
                          +{materialSummaries.length - 4} more ores
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      })()}
      
      {/* Region Tooltip - Glass style with connecting line */}
      {hoveredRegion && (() => {
        const regionCenter = zoomPan.gridToScreen(hoveredRegion.bounds.centerX, hoveredRegion.bounds.centerY)
        const tooltipY = regionCenter.y - 80
        const tooltipX = regionCenter.x
        const tooltipHeight = 80 // Approximate tooltip height
        const lineStartY = tooltipY + tooltipHeight // Bottom of tooltip
        const lineEndY = regionCenter.y // Region center
        const lineLength = lineEndY - lineStartY
        
        // Calculate total planets in region
        const totalPlanets = hoveredRegion.systems.reduce((sum, system) => sum + system.planets.length, 0)
        const totalSystems = hoveredRegion.systems.length
        
        return (
          <>
            {/* Connecting line from tooltip to region center with draw animation */}
            <svg
              className="fixed z-40 pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
              }}
            >
              <line
                x1={tooltipX}
                y1={lineStartY}
                x2={tooltipX}
                y2={lineEndY}
                stroke="#00FFFF"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeDasharray="8 4"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.9)) drop-shadow(0 0 1px rgba(0, 255, 255, 0.5))',
                  strokeDashoffset: lineLength,
                  animation: `drawLine-region-${hoveredRegion.region} 0.4s ease-out forwards`,
                  animationDelay: '0.1s',
                }}
              />
              <style>{`
                @keyframes drawLine-region-${hoveredRegion.region} {
                  from {
                    stroke-dashoffset: ${lineLength};
                    opacity: 0;
                  }
                  to {
                    stroke-dashoffset: 0;
                    opacity: 1;
                  }
                }
              `}</style>
            </svg>
            
            {/* Tooltip */}
            <div
              className="fixed z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{
                left: `${tooltipX}px`,
                top: `${tooltipY}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="panel-glass border border-cyan-500/30 rounded-none px-4 py-3 shadow-2xl shadow-cyan-500/10 min-w-[200px] relative">
                {/* Glowing Cyan Stripe at Top */}
                <div 
                  className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
                  style={{
                    height: '2px',
                    background: 'linear-gradient(to right, transparent 0%, #00FFFF 20%, #00FFFF 80%, transparent 100%)',
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.9), 0 0 5px rgba(0, 255, 255, 0.7), 0 0 2px rgba(0, 255, 255, 0.5)',
                  }}
                />
                <div className="space-y-1.5" style={{ paddingTop: 'calc(0.25rem + 2px)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-base text-cyan-400">
                      {hoveredRegion.name || `Region ${hoveredRegion.region}`}
                    </h4>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Region {hoveredRegion.region}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalSystems} {totalSystems === 1 ? 'system' : 'systems'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalPlanets} {totalPlanets === 1 ? 'planet' : 'planets'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      })()}
      
      {/* UI Overlay: Legend */}
      <GalaxyMapLegend regions={galaxyData.regions} />
      
      {/* EVE-Style Navigation Controls */}
      <EVEStyleMapControls
        onNavigateToCore={handleNavigateToCore}
        onToggleSpiralGuidelines={(show) => setShowSpiralGuidelines(show)}
        showSpiralGuidelines={showSpiralGuidelines}
        onToggleRoutes={(show) => setShowRoutes(show)}
        showRoutes={showRoutes}
        onZoomIn={zoomPan.zoomIn}
        onZoomOut={zoomPan.zoomOut}
        onReset={handleReset}
        zoomLevel={zoomPan.scale}
        onOpenPanel={openPanel}
        onPan={(deltaX, deltaY) => {
          const currentPanX = zoomPan.panX
          const currentPanY = zoomPan.panY
          zoomPan.setPan(currentPanX + deltaX, currentPanY + deltaY)
        }}
        panStep={100 / zoomPan.scale} // Adjust pan step based on zoom level
        minZoom={minZoomScale}
        maxZoom={maxZoomScale}
      />

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenuPosition}
          onClose={closeContextMenu}
        />
      )}
      
      {/* CSS animations for loading overlay */}
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
      `}</style>
    </div>
  )
}

