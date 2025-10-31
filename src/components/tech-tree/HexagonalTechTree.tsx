import { useMemo } from 'react'
import { HexagonNode, HexagonStatus } from './HexagonNode'
import { cn } from '@/lib/utils'

export interface TechTreeItem {
  id: string
  slug: string
  name: string
  imageUrl?: string
  status: HexagonStatus
  prerequisites?: string[] // IDs of prerequisite items
  position?: { row: number; col: number } // Optional manual positioning
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

// Calculate hexagonal grid positions
function calculatePositions(items: TechTreeItem[], hexagonSize: number): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  
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

  // Otherwise, auto-layout based on prerequisites
  // Group by tier (number of prerequisites)
  const tierGroups: Map<number, TechTreeItem[]> = new Map()
  items.forEach(item => {
    const tier = item.prerequisites?.length || 0
    if (!tierGroups.has(tier)) {
      tierGroups.set(tier, [])
    }
    tierGroups.get(tier)!.push(item)
  })

  // Position items tier by tier
  tierGroups.forEach((tierItems, tier) => {
    const itemsPerRow = Math.ceil(Math.sqrt(tierItems.length)) + 1
    tierItems.forEach((item, index) => {
      const row = tier
      const col = index
      // Staggered hexagonal grid
      const x = col * (hexagonSize * 1.2) + (row % 2 === 1 ? hexagonSize * 0.6 : 0)
      const y = row * (hexagonSize * 1.1)
      positions.set(item.id, { x, y })
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
        item.prerequisites.forEach(prereqId => {
          const fromPos = positions.get(prereqId)
          if (fromPos) {
            connections.push({ from: fromPos, to: toPos })
          }
        })
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
  const { positions, connections, bounds } = useMemo(() => {
    const pos = calculatePositions(items, hexagonSize)
    const conn = calculateConnections(items, pos, hexagonSize)
    
    // Calculate bounding box
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
    
    // Add padding
    const padding = hexagonSize
    const bounds = {
      width: maxX - minX + hexagonSize + padding * 2,
      height: maxY - minY + hexagonSize + padding * 2,
      offsetX: minX - padding,
      offsetY: minY - padding,
    }
    
    return { positions: pos, connections: conn, bounds }
  }, [items, hexagonSize])

  return (
    <div className={cn('relative w-full h-full min-h-[600px] overflow-auto', className)}>
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
              strokeWidth="2"
              className="text-primary/30"
              markerEnd="url(#arrowhead)"
            />
          ))}
          
          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="currentColor"
                className="text-primary/30"
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
              <HexagonNode
                size={hexagonSize}
                status={item.status}
                onClick={() => onItemClick?.(item)}
                imageUrl={item.imageUrl}
                name={item.name}
              >
                <span className="text-xs font-semibold text-center line-clamp-2">
                  {item.name}
                </span>
              </HexagonNode>
            </div>
          )
        })}
      </div>
    </div>
  )
}

