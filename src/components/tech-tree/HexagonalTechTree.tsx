import { useMemo } from 'react'
import { HexagonNode, HexagonStatus } from './HexagonNode'
import { cn } from '@/lib/utils'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'

export interface TechTreeItem {
  id: string
  slug: string
  name: string
  imageUrl?: string
  status: HexagonStatus
  prerequisites?: string[] // IDs of prerequisite items
  era?: number // Era this item belongs to
  position?: { row: number; col: number } // Optional manual positioning
  // Additional info for tooltips
  description?: string
  costTellerium?: number
  costKrypton?: number
  productionTellerium?: number
  productionKrypton?: number
  buildTime?: number
}

interface Connection {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

interface HexagonalTechTreeProps {
  items: TechTreeItem[]
  onItemClick?: (item: TechTreeItem) => void
  className?: string
  hexagonSize?: number
}

// Calculate hexagonal grid positions grouped by era
function calculatePositions(items: TechTreeItem[], hexagonSize: number): Map<string, { x: number; y: number; era?: number }> {
  const positions = new Map<string, { x: number; y: number; era?: number }>()
  
  // If items have manual positions, use those
  const hasManualPositions = items.some(item => item.position)
  if (hasManualPositions) {
    items.forEach(item => {
      if (item.position) {
        const { row, col } = item.position
        // Staggered hexagonal grid
        const x = col * (hexagonSize * 1.2) + (row % 2 === 1 ? hexagonSize * 0.6 : 0)
        const y = row * (hexagonSize * 1.1)
        positions.set(item.id, { x, y })
      }
    })
    return positions
  }

  // Group by era first
  const eraGroups: Map<number, TechTreeItem[]> = new Map()
  items.forEach(item => {
    const era = item.era || 1 // Default to era 1 if not specified
    if (!eraGroups.has(era)) {
      eraGroups.set(era, [])
    }
    eraGroups.get(era)!.push(item)
  })

  // Position items era by era
  const eras = Array.from(eraGroups.keys()).sort((a, b) => a - b)
  const itemsPerRow = 4 // Slightly wider for era-based layout
  
  eras.forEach((era, eraIndex) => {
    const eraItems = eraGroups.get(era) || []
    const offsetY = eraIndex * (hexagonSize * 10) // Larger gap between eras
    
    eraItems.forEach((item, index) => {
      const col = index % itemsPerRow
      const row = Math.floor(index / itemsPerRow)
      const x = col * (hexagonSize * 1.8) // Better horizontal spacing
      const y = row * (hexagonSize * 1.9) + offsetY // Better vertical spacing with era offset
      positions.set(item.id, { x, y, era })
    })
  })

  return positions
}

function calculateConnections(
  items: TechTreeItem[],
  positions: Map<string, { x: number; y: number }>,
  hexagonSize: number
): Connection[] {
  const connections: Connection[] = []
  
  items.forEach(item => {
    if (item.prerequisites && item.prerequisites.length > 0) {
      const toPos = positions.get(item.id)
      if (toPos) {
        // Only connect to the first prerequisite to reduce visual clutter
        const prereqId = item.prerequisites[0]
        const fromPos = positions.get(prereqId)
        if (fromPos) {
          connections.push({ from: fromPos, to: toPos })
        }
      }
    }
  })

  return connections
}

export function HexagonalTechTree({
  items,
  onItemClick,
  className,
  hexagonSize = 120,
}: HexagonalTechTreeProps) {
  const { positions, connections, bounds, eraHeaders } = useMemo(() => {
    const pos = calculatePositions(items, hexagonSize)
    const conn = calculateConnections(items, pos, hexagonSize)
    
    // Group items by era for headers
    const eraGroups: Map<number, TechTreeItem[]> = new Map()
    items.forEach(item => {
      const era = item.era || 1
      if (!eraGroups.has(era)) {
        eraGroups.set(era, [])
      }
      eraGroups.get(era)!.push(item)
    })
    
    // Create era headers
    const eraHeaders = Array.from(eraGroups.entries()).map(([era, eraItems]) => {
      // Find the average X position for this era
      let sumX = 0
      let count = 0
      eraItems.forEach(item => {
        const posInfo = pos.get(item.id)
        if (posInfo) {
          sumX += posInfo.x
          count++
        }
      })
      const avgX = count > 0 ? sumX / count : 0
      
      // Find the Y position (first item of this era)
      const firstItem = eraItems[0]
      const firstPos = pos.get(firstItem.id)
      const y = firstPos ? firstPos.y - (hexagonSize * 1.5) : 0
      
      return { era, x: avgX, y }
    })
    
    // Calculate bounding box including era headers
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    
    pos.forEach(({ x, y }) => {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })
    
    // Include era headers in bounds
    eraHeaders.forEach(({ y: headerY }) => {
      minY = Math.min(minY, headerY)
    })
    
    // Add padding
    const padding = hexagonSize
    const bounds = {
      width: maxX - minX + hexagonSize + padding * 2,
      height: maxY - minY + hexagonSize + padding * 2,
      offsetX: minX - padding,
      offsetY: minY - padding,
    }
    
    return { positions: pos, connections: conn, bounds, eraHeaders }
  }, [items, hexagonSize])

  return (
    <div className={cn('relative w-full h-full overflow-auto', className)}>
      <svg
        width={bounds.width}
        height={bounds.height}
        className="absolute inset-0"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Connection lines */}
        <g transform={`translate(${-bounds.offsetX}, ${-bounds.offsetY})`}>
          {connections.map((conn, index) => (
            <line
              key={index}
              x1={conn.from.x + hexagonSize / 2}
              y1={conn.from.y + hexagonSize / 2}
              x2={conn.to.x + hexagonSize / 2}
              y2={conn.to.y + hexagonSize / 2}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="text-cyan-400/25 transition-all duration-300"
              markerEnd="url(#arrowhead)"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.3))',
              }}
            />
          ))}
          
          {/* Era headers */}
          {eraHeaders.map(({ era, x, y }) => (
            <g key={era}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                className="text-xs font-heading fill-cyan-400/80"
                style={{ 
                  pointerEvents: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textShadow: '0 0 8px rgba(34, 211, 238, 0.4)',
                }}
              >
                ERA {era}
              </text>
              <line
                x1={x - hexagonSize * 12}
                y1={y + 8}
                x2={x + hexagonSize * 12}
                y2={y + 8}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 2"
                className="text-cyan-500/30"
              />
            </g>
          ))}
          
          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill="currentColor"
                className="text-cyan-400/40"
              />
            </marker>
          </defs>
        </g>
      </svg>

      {/* Hexagon nodes */}
      <div
        className="relative"
        style={{
          width: bounds.width,
          height: bounds.height,
        }}
      >
        {items.map(item => {
          const pos = positions.get(item.id)
          if (!pos) return null
          
          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: pos.x - bounds.offsetX,
                top: pos.y - bounds.offsetY,
              }}
            >
              <div className="relative group">
                <HexagonNode
                  size={hexagonSize}
                  status={item.status}
                  onClick={() => onItemClick?.(item)}
                  imageUrl={item.imageUrl}
                  name={item.name}
                >
                  <span className="text-[10px] font-semibold text-center leading-tight px-1 line-clamp-2 tracking-tight">
                    {item.name}
                  </span>
                </HexagonNode>
                
                {/* Hover tooltip */}
                <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-72 scale-95 group-hover:scale-100">
                  <div className="panel-glass surface-gradient border border-cyan-500/40 card-glow p-4 shadow-2xl backdrop-blur-md">
                    <div className="space-y-3">
                      <div className="text-sm font-bold text-cyan-400 mb-1 tracking-wide">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {item.description}
                        </div>
                      )}
                      {(item.costTellerium !== undefined || item.costKrypton !== undefined) && (
                        <div className="pt-3 border-t border-cyan-500/20 space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cost</div>
                          {item.costTellerium !== undefined && item.costTellerium > 0 && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <img src={getTelleriumImage()} alt="T" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
                                <span className="text-xs font-medium">Tellerium</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-tellerium">{item.costTellerium.toLocaleString()}</span>
                            </div>
                          )}
                          {item.costKrypton !== undefined && item.costKrypton > 0 && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <img src={getKryptonImage()} alt="K" className="w-4 h-4" style={{ imageRendering: 'auto' }} />
                                <span className="text-xs font-medium">Krypton</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-krypton">{item.costKrypton.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

