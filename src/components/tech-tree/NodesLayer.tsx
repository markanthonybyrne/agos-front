import { memo, useMemo } from 'react'
import { TechNodeData, ViewportBounds } from '@/types/tech-tree.types'
import { HexNode } from './HexNode'
import { applyViewportCulling } from '@/lib/layoutAlgorithms'

interface NodesLayerProps {
  nodes: TechNodeData[]
  onNodeClick?: (nodeId: string) => void
  onNodeHover?: (nodeId: string | null) => void
  viewport: ViewportBounds
  panX?: number
  panY?: number
  zoom?: number
  buffer?: number
  highlightedNodes?: string[]
}

export const NodesLayer = memo(function NodesLayer({
  nodes,
  onNodeClick,
  onNodeHover,
  viewport,
  panX = 0,
  panY = 0,
  zoom = 1,
  buffer = 200,
  highlightedNodes = [],
}: NodesLayerProps) {
  // Create position map from nodes
  const positionsMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    nodes.forEach((node) => {
      if (node.position) {
        map.set(node.id, { x: node.position.x, y: node.position.y })
      }
    })
    return map
  }, [nodes])
  
  // Apply viewport culling - temporarily disabled to ensure all nodes render
  const visibleNodes = useMemo(() => {
    // For now, show all nodes to debug rendering issues
    return nodes.filter((node) => node.position !== undefined)
    
    // Original culling logic (commented out for debugging)
    /*
    const positions = new Map<string, { x: number; y: number; angle: number; radius: number }>()
    
    nodes.forEach((node) => {
      if (node.position) {
        positions.set(node.id, node.position)
      }
    })
    
    const culled = applyViewportCulling(positions, viewport, buffer)
    
    return nodes.filter((node) => {
      const pos = culled.get(node.id)
      return pos && pos.visible
    })
    */
  }, [nodes])
  
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {visibleNodes.map((node) => {
        const position = positionsMap.get(node.id)
        if (!position) return null
        
        const isHighlighted = highlightedNodes.includes(node.id)
        const variant = isHighlighted ? 'highlighted' : node.status
        
        return (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              zIndex: isHighlighted ? 10 : 1,
            }}
          >
            <HexNode
              node={node}
              onClick={onNodeClick}
              onHover={onNodeHover}
              variant={variant}
            />
          </div>
        )
      })}
    </div>
  )
})
