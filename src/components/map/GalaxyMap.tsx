import { useState, useMemo } from 'react'
import { useGetUniverseConfigQuery, useGetMapQuery } from '@/api/endpoints/universeApi'
import { useNavigate } from 'react-router-dom'
import { buildGalaxyData, SystemData, RegionData } from '@/lib/galaxyUtils'
import { useZoomPan } from '@/hooks/useZoomPan'
import { GalaxyRegionLayer } from './GalaxyRegionLayer'
import { HyperspaceRoutesLayer } from './HyperspaceRoutesLayer'
import { SystemMarkersLayer } from './SystemMarkersLayer'
import { GalaxyMapLegend } from './GalaxyMapLegend'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 1000

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
  const [hoveredSystem, setHoveredSystem] = useState<SystemData | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null)
  
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig } = useGetUniverseConfigQuery()
  const gridWidth = configData?.grid_width || 
    (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.width : null) || 
    (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height || 
    (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.height : null) || 
    (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_HEIGHT)
  
  // Fetch all planets for galaxy map
  const { data: mapData, isLoading: isLoadingMap } = useGetMapQuery({ 
    limit: 5000 
  })
  
  // Build galaxy data structure from planets
  const galaxyData = useMemo(() => {
    if (!mapData?.planets || mapData.planets.length === 0) {
      return { regions: new Map(), systems: new Map(), systemMap: [] }
    }
    
    // Build galaxy data with region names from API response
    const regionNames = mapData.region_names || {}
    return buildGalaxyData(mapData.planets, regionNames)
  }, [mapData])
  
  // Initialize zoom/pan - start with scale to fit entire galaxy
  const initialScale = useMemo(() => {
    // Calculate scale to fit entire grid in viewport (assuming 1920x1080 viewport)
    const viewportWidth = 1920
    const viewportHeight = 1080
    const scaleX = viewportWidth / gridWidth
    const scaleY = viewportHeight / gridHeight
    return Math.min(scaleX, scaleY) * 0.95 // 95% to add some padding
  }, [gridWidth, gridHeight])
  
  const zoomPan = useZoomPan({
    minScale: initialScale * 0.5,  // Can zoom out a bit more
    maxScale: initialScale * 8,    // Can zoom in 8x
    initialScale: initialScale,
    initialPanX: 0,
    initialPanY: 0,
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    enableWheelZoom: true,
    zoomSensitivity: 0.1
  })
  
  // Handle system click - navigate to system view when zoomed in enough
  const handleSystemClick = (system: SystemData) => {
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
  }
  
  // Handle region click - zoom to region
  const handleRegionClick = (region: RegionData, event: React.MouseEvent) => {
    event.stopPropagation()
    const targetScale = initialScale * 2.5 // Zoom to 2.5x to show region clearly
    
    // Calculate pan to center the region
    const targetPanX = (gridWidth / 2 - region.bounds.centerX) * targetScale
    const targetPanY = (gridHeight / 2 - region.bounds.centerY) * targetScale
    
    zoomPan.smoothSetZoomAndPan(targetScale, targetPanX, targetPanY, 600)
  }
  
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
  
  if (isLoadingConfig || isLoadingMap) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Loading galaxy map...
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
        }}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background - transparent */}
        <rect width={gridWidth} height={gridHeight} fill="transparent" />
        
        {/* Layer 1: Region Overlays */}
        <GalaxyRegionLayer 
          regions={galaxyData.regions}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          onRegionClick={handleRegionClick}
          onRegionHover={setHoveredRegion}
          hoveredRegion={hoveredRegion}
        />
        
        {/* Layer 2: Hyperspace Routes */}
        <HyperspaceRoutesLayer 
          systems={galaxyData.systemMap}
          maxConnectionDistance={75}
        />
        
        {/* Layer 3: System Markers */}
        <SystemMarkersLayer
          systems={galaxyData.systemMap}
          onSystemClick={handleSystemClick}
          hoveredSystem={hoveredSystem}
          onSystemHover={setHoveredSystem}
        />
      </svg>
      
      {/* UI Overlay: Legend */}
      <GalaxyMapLegend regions={galaxyData.regions} />
      
      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
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
          onClick={zoomPan.reset}
          className="bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

