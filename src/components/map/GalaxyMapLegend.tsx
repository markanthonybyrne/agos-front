import { REGION_COLORS } from '@/lib/regionColors'
import { RegionData } from '@/lib/galaxyUtils'
import { DesktopWindow } from '@/components/common/DesktopWindow'
import { PanelSize } from '@/app/slices/panelSlice'
import { useState, useMemo, useCallback, useEffect } from 'react'

interface GalaxyMapLegendProps {
  regions?: Map<number, RegionData>
  className?: string
}

/**
 * GalaxyMapLegend - Displays legend and scale bar in a minimizable window
 * 
 * Shows region colors and distance scale in a glass panel window
 * that can be minimized, positioned at bottom-left by default.
 */
export function GalaxyMapLegend({ regions, className = '' }: GalaxyMapLegendProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 280,
    height: 350,
  })

  // Initialize position on mount - bottom-left corner
  useEffect(() => {
    if (position === null) {
      setPosition({ 
        x: 20, 
        y: window.innerHeight - dimensions.height - 20 // Position near bottom
      })
    }
  }, [position, dimensions.height])

  // Get regions to display - use provided regions or show all 20
  const regionsToShow = useMemo(() => {
    return regions 
      ? Array.from(regions.values()).sort((a, b) => a.region - b.region)
      : Array.from({ length: 20 }, (_, i) => ({ region: i + 1, name: null } as RegionData))
  }, [regions])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const handleRestore = useCallback(() => {
    setIsMinimized(false)
  }, [])

  // If minimized, show a small button to restore
  if (isMinimized && position) {
    // Calculate bottom position from top position
    const bottomPosition = window.innerHeight - position.y - dimensions.height
    
    return (
      <button
        onClick={handleRestore}
        className="fixed z-50 px-3 py-2 panel-glass border border-cyan-500/30 rounded-none cut-corners text-xs text-cyan-300 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-all duration-200"
        style={{ 
          left: `${position.x}px`, 
          bottom: `${Math.max(20, bottomPosition)}px` 
        }}
      >
        Region Legend
      </button>
    )
  }

  // Don't render window until position is initialized
  if (!position) {
    return null
  }

  return (
    <DesktopWindow
      id="galaxy-map-legend"
      isOpen={true}
      onClose={() => setIsMinimized(true)}
      title="Region Legend"
      size={PanelSize.SMALL}
      position={position}
      dimensions={dimensions}
      onMinimize={handleMinimize}
      onPositionChange={setPosition}
      onDimensionsChange={setDimensions}
      zIndex={50}
      persistPosition={true}
      className={className}
    >
      <div className="h-full flex flex-col">
        {/* Scale bar */}
        <div className="mb-3 pb-3 border-b border-cyan-500/20">
          <div className="text-white text-xs font-mono">
            1×10⁶ LY
          </div>
        </div>
        
        {/* Region colors legend */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            <div className="text-white text-xs font-semibold mb-2">Regions</div>
            <div className="grid grid-cols-2 gap-2">
              {regionsToShow.map(regionData => {
                const region = regionData.region
                const regionName = regionData.name || `Region ${region}`
                const color = REGION_COLORS[region]
                // Extract RGB from rgba string
                const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
                const rgbColor = rgbMatch 
                  ? `rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`
                  : '#888888'
                
                return (
                  <div key={region} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-none border border-white/30 flex-shrink-0"
                      style={{ backgroundColor: rgbColor }}
                    />
                    <span className="text-white text-xs font-mono truncate" title={regionName}>
                      {regionName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DesktopWindow>
  )
}


