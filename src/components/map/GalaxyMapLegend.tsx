import { REGION_COLORS } from '@/lib/regionColors'
import { RegionData } from '@/lib/galaxyUtils'

interface GalaxyMapLegendProps {
  regions?: Map<number, RegionData>
  className?: string
}

/**
 * GalaxyMapLegend - Displays legend and scale bar
 * 
 * Shows region colors and distance scale in bottom-left corner,
 * matching the reference image style.
 */
export function GalaxyMapLegend({ regions, className = '' }: GalaxyMapLegendProps) {
  // Get regions to display - use provided regions or show all 20
  const regionsToShow = regions 
    ? Array.from(regions.values()).sort((a, b) => a.region - b.region)
    : Array.from({ length: 20 }, (_, i) => ({ region: i + 1, name: null } as RegionData))
  
  return (
    <div className={`absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-h-[80vh] overflow-y-auto ${className}`}>
      {/* Scale bar */}
      <div className="mb-3 pb-3 border-b border-white/20">
        <div className="text-white text-xs font-mono">
          1×10⁶ LY
        </div>
      </div>
      
      {/* Region colors legend */}
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
                  className="w-4 h-4 rounded border border-white/30 flex-shrink-0"
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
  )
}


