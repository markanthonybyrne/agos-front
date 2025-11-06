/**
 * UnifiedUniverseMapV3 - Main component for the Three.js universe map
 * 
 * Features:
 * - WebGL rendering with Three.js
 * - 4 zoom levels: Sector → Galaxy → System → Planet
 * - Dynamic data loading from API
 * - Smooth zoom/pan transitions
 * - Quadrant boundaries and overlays
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useGetUniverseConfigQuery } from '@/api/endpoints/universeApi'
import { useAuth } from '@/hooks/useAuth'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Planet } from '@/types/api.types'
import { UniverseMapCanvas } from './UniverseMapCanvas'
import { BackgroundLayer } from './layers/BackgroundLayer'
import { QuadrantBoundariesLayer } from './layers/QuadrantBoundariesLayer'
import { SectorLayer } from './layers/SectorLayer'
import { GalaxyLayer } from './layers/GalaxyLayer'
import { SystemLayer } from './layers/SystemLayer'
import { PlanetLayer } from './layers/PlanetLayer'
import { useUniverseData } from '@/hooks/useUniverseData'
import { calculateViewportBounds, ProjectionConfig } from '@/lib/v3/ViewportProjection'
import { zoomToPoint, clampCameraPosition, smoothTransition, ZoomPanOptions } from '@/lib/v3/CameraController'
import { normalizedToRenderScale, renderScaleToNormalized } from '@/hooks/useZoomPan'
import { getZoomLevel } from '@/lib/zoomLevels'
import { MapControlsPanel } from '../MapControlsPanel'
import { Loader } from '@/components/ui/loader'

const DEFAULT_GRID_WIDTH = 2000
const DEFAULT_GRID_HEIGHT = 1000

export function UnifiedUniverseMapV3() {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [hoveredPlanet, setHoveredPlanet] = useState<Planet | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // Load universe config
  const { data: configData, isLoading: isLoadingConfig, error: configError } = useGetUniverseConfigQuery()
  const gridWidth = configData?.grid_width 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.width : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_WIDTH)
  const gridHeight = configData?.grid_height 
    || (typeof configData?.grid_size === 'object' && configData.grid_size !== null ? configData.grid_size.height : null) 
    || (typeof configData?.grid_size === 'number' ? configData.grid_size : DEFAULT_GRID_HEIGHT)
  
  // Zoom/pan state
  const minScale = 0.09
  const maxScale = 1.554
  const [scale, setScale] = useState(0.09) // Initial scale (sector level - 0% zoom)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastPanRef = useRef({ x: 0, y: 0 })
  
  // Calculate normalized zoom
  const normalizedZoom = useMemo(() => renderScaleToNormalized(scale), [scale])
  const zoomLevel = useMemo(() => getZoomLevel(normalizedZoom), [normalizedZoom])
  
  // Update container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
    
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    
    return () => resizeObserver.disconnect()
  }, [])
  
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
      scale,
      panX,
      panY
    }
    
    return calculateViewportBounds(config)
  }, [gridWidth, gridHeight, containerSize, scale, panX, panY])
  
  // Load universe data
  const { planets, isLoading: isLoadingPlanets } = useUniverseData({
    viewportBounds,
    zoomLevel: zoomLevel as 'sector' | 'galaxy' | 'system' | 'planet',
    enabled: !isLoadingConfig && containerSize.width > 0
  })
  
  // Prevent zoom beyond safe limits
  useEffect(() => {
    if (normalizedZoom > 0.95) {
      console.warn('[UnifiedUniverseMapV3] Zoom level too high, preventing crash:', normalizedZoom)
      // Clamp zoom to safe level
      const safeScale = normalizedToRenderScale(0.90)
      setScale(safeScale)
    }
  }, [normalizedZoom])
  
  // Zoom/pan handlers
  const handleZoom = useCallback((delta: number, centerX: number, centerY: number) => {
    // Prevent zooming beyond safe limits (95% normalized zoom)
    const currentNormalized = renderScaleToNormalized(scale)
    if (delta > 0 && currentNormalized >= 0.90) {
      // Zooming in beyond safe limit
      return
    }
    
    const options: ZoomPanOptions = {
      minScale,
      maxScale,
      initialScale: scale,
      gridWidth,
      gridHeight,
      containerWidth: containerSize.width,
      containerHeight: containerSize.height
    }
    
    const result = zoomToPoint(scale, { x: panX, y: panY }, delta, centerX, centerY, options)
    
    // Clamp to safe max zoom
    const newNormalized = renderScaleToNormalized(result.zoom)
    const finalZoom = newNormalized > 0.90 ? normalizedToRenderScale(0.90) : result.zoom
    
    setScale(finalZoom)
    setPanX(result.panX)
    setPanY(result.panY)
  }, [scale, panX, panY, gridWidth, gridHeight, containerSize])
  
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true
    dragStartRef.current = { x: clientX, y: clientY }
    lastPanRef.current = { x: panX, y: panY }
  }, [panX, panY])
  
  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return
    
    const deltaX = (clientX - dragStartRef.current.x) / scale
    const deltaY = (clientY - dragStartRef.current.y) / scale
    
    const newPanX = lastPanRef.current.x + deltaX
    const newPanY = lastPanRef.current.y + deltaY
    
    const options: ZoomPanOptions = {
      minScale,
      maxScale,
      initialScale: scale,
      gridWidth,
      gridHeight,
      containerWidth: containerSize.width,
      containerHeight: containerSize.height
    }
    
    const clamped = clampCameraPosition({ x: newPanX, y: newPanY }, scale, options)
    setPanX(clamped.x)
    setPanY(clamped.y)
  }, [scale, gridWidth, gridHeight, containerSize])
  
  const handlePanEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])
  
  // Mouse/touch handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handlePanStart(e.clientX, e.clientY)
  }, [handlePanStart])
  
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handlePanMove(e.clientX, e.clientY)
  }, [handlePanMove])
  
  const onMouseUp = useCallback(() => {
    handlePanEnd()
  }, [handlePanEnd])
  
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const centerX = e.clientX - rect.left
      const centerY = e.clientY - rect.top
      handleZoom(delta, centerX, centerY)
    }
  }, [handleZoom])
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handlePanStart(touch.clientX, touch.clientY)
    }
  }, [handlePanStart])
  
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      handlePanMove(touch.clientX, touch.clientY)
    }
  }, [handlePanMove])
  
  const onTouchEnd = useCallback(() => {
    handlePanEnd()
  }, [handlePanEnd])
  
  // Global mouse events for dragging
  useEffect(() => {
    if (!isDraggingRef.current) return
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handlePanMove(e.clientX, e.clientY)
    }
    
    const handleGlobalMouseUp = () => {
      handlePanEnd()
    }
    
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [handlePanMove, handlePanEnd])
  
  // Planet click handler
  const handlePlanetClick = useCallback((planet: Planet) => {
    openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
      planet: planet
    })
  }, [openPanel])
  
  // Galaxy click handler
  const handleGalaxyClick = useCallback((quadrant: number, sector: number, galaxy: number) => {
    // Zoom to galaxy level
    const galaxyRange = { x_min: 0, x_max: gridWidth, y_min: 0, y_max: gridHeight } // TODO: Calculate actual range
    const centerX = (galaxyRange.x_min + galaxyRange.x_max) / 2
    const centerY = (galaxyRange.y_min + galaxyRange.y_max) / 2
    
    const targetScale = normalizedToRenderScale(0.35) // Galaxy level
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const screenX = rect.width / 2
      const screenY = rect.height / 2
      handleZoom((targetScale / scale) - 1, screenX, screenY)
    }
  }, [gridWidth, gridHeight, scale, handleZoom])
  
  // System click handler
  const handleSystemClick = useCallback((system: any) => {
    // Zoom to system level
    const targetScale = normalizedToRenderScale(0.67) // System level
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const screenX = rect.width / 2
      const screenY = rect.height / 2
      handleZoom((targetScale / scale) - 1, screenX, screenY)
    }
  }, [scale, handleZoom])
  
  // Projection config for layers
  const projectionConfig: ProjectionConfig = useMemo(() => ({
    gridWidth,
    gridHeight,
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    scale,
    panX,
    panY
  }), [gridWidth, gridHeight, containerSize, scale, panX, panY])
  
  // Zoom controls
  const zoomIn = useCallback(() => {
    const zoomFactor = 1.15
    const newScale = Math.min(maxScale, scale * zoomFactor)
    const scaleRatio = newScale / scale
    setScale(newScale)
    setPanX(panX * scaleRatio)
    setPanY(panY * scaleRatio)
  }, [scale, panX, panY, maxScale])
  
  const zoomOut = useCallback(() => {
    const zoomFactor = 1 / 1.15
    const newScale = Math.max(minScale, scale * zoomFactor)
    const scaleRatio = newScale / scale
    setScale(newScale)
    setPanX(panX * scaleRatio)
    setPanY(panY * scaleRatio)
  }, [scale, panX, panY, minScale])
  
  const resetZoom = useCallback(() => {
    setScale(0.09)
    setPanX(0)
    setPanY(0)
  }, [])
  
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
  
  return (
    <div 
      className="fixed inset-0 overflow-hidden z-0" 
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Background gradient fade - Fixed, doesn't move with panning */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none z-0" />
      
      {/* Map container with zoom/pan */}
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ 
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: 'transparent',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* Three.js canvas */}
        <UniverseMapCanvas
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          scale={scale}
          panX={panX}
          panY={panY}
        >
          {/* Background layer */}
          <BackgroundLayer
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            opacity={1}
          />
          
          {/* Quadrant boundaries */}
          <QuadrantBoundariesLayer
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            config={projectionConfig}
            opacity={1}
            normalizedZoom={normalizedZoom}
          />
          
          {/* Sector layer */}
          {planets.length > 0 && (
            <SectorLayer
              planets={planets}
              viewportBounds={viewportBounds}
              normalizedZoom={normalizedZoom}
              onGalaxyClick={handleGalaxyClick}
            />
          )}
          
          {/* Galaxy layer */}
          {planets.length > 0 && (
            <GalaxyLayer
              planets={planets}
              viewportBounds={viewportBounds}
              normalizedZoom={normalizedZoom}
              onSystemClick={handleSystemClick}
            />
          )}
          
          {/* System layer */}
          {planets.length > 0 && (
            <SystemLayer
              planets={planets}
              viewportBounds={viewportBounds}
              normalizedZoom={normalizedZoom}
              onPlanetClick={handlePlanetClick}
              onPlanetHover={setHoveredPlanet}
              hoveredPlanet={hoveredPlanet}
            />
          )}
          
          {/* Planet layer */}
          {planets.length > 0 && (
            <PlanetLayer
              planets={planets}
              viewportBounds={viewportBounds}
              normalizedZoom={normalizedZoom}
              onPlanetClick={handlePlanetClick}
              onPlanetHover={setHoveredPlanet}
              hoveredPlanet={hoveredPlanet}
            />
          )}
        </UniverseMapCanvas>
        
        {/* Map Controls Panel */}
        <MapControlsPanel
          zoomPan={{
            scale,
            panX,
            panY,
            normalizedZoom,
            zoomLevel: zoomLevel as any,
            viewportBounds,
            containerRef,
            setZoom: (newScale: number) => setScale(newScale),
            setNormalizedZoom: (norm: number) => {
              const newScale = normalizedToRenderScale(norm)
              setScale(newScale)
            },
            setZoomAndPan: (newScale: number, newPanX: number, newPanY: number) => {
              setScale(newScale)
              setPanX(newPanX)
              setPanY(newPanY)
            },
            smoothSetZoomAndPan: (targetScale: number, targetPanX: number, targetPanY: number, duration: number) => {
              smoothTransition(
                { zoom: scale, panX, panY },
                { zoom: targetScale, panX: targetPanX, panY: targetPanY },
                duration,
                ({ zoom, panX, panY }) => {
                  setScale(zoom)
                  setPanX(panX)
                  setPanY(panY)
                }
              )
            },
            zoomIn,
            zoomOut,
            reset: resetZoom,
            onMouseDown: onMouseDown,
            onMouseMove: onMouseMove,
            onMouseUp: onMouseUp,
            onTouchStart: onTouchStart,
            onTouchMove: onTouchMove,
            onTouchEnd: onTouchEnd,
            onWheel: onWheel,
            screenToGrid: (screenX: number, screenY: number) => {
              // TODO: Implement
              return { x: 0, y: 0 }
            },
            gridToScreen: (gridX: number, gridY: number) => {
              // TODO: Implement
              return { x: 0, y: 0 }
            }
          } as any}
          zoomLevel={zoomLevel}
          allPlanets={planets}
          onSearch={(centerX, centerY, normalizedZoom) => {
            const targetScale = normalizedToRenderScale(normalizedZoom)
            const targetPanX = (gridWidth / 2 - centerX) * targetScale
            const targetPanY = (gridHeight / 2 - centerY) * targetScale
            smoothTransition(
              { zoom: scale, panX, panY },
              { zoom: targetScale, panX: targetPanX, panY: targetPanY },
              800,
              ({ zoom, panX, panY }) => {
                setScale(zoom)
                setPanX(panX)
                setPanY(panY)
              }
            )
          }}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          systemsCount={0} // TODO: Calculate from planets
          minScale={minScale}
          maxScale={maxScale}
        />
        
        {/* Loading indicator */}
        {isLoadingPlanets && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4" />
              <p className="text-sm text-muted-foreground">Loading planets...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

