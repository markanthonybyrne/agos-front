import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TechNodeData, ViewportBounds } from '@/types/tech-tree.types'
import { NodeCard } from './NodeCard'

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
  showHeatmap?: boolean
  showEmpireProgress?: boolean
  showComparison?: boolean
  comparisonPlanetCount?: number
  completedNodes?: Set<string>
  queuedNodes?: Set<string>
  inProgressNodes?: Set<string>
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
  showHeatmap = false,
  showEmpireProgress = false,
  showComparison = false,
  comparisonPlanetCount = 0,
  completedNodes,
  queuedNodes,
  inProgressNodes,
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
    return nodes.filter((node) => {
      if (!node.position) return false
      const { x, y } = node.position
      return (
        x >= viewport.minX - buffer &&
        x <= viewport.maxX + buffer &&
        y >= viewport.minY - buffer &&
        y <= viewport.maxY + buffer
      )
    })
  }, [nodes, viewport, buffer])

  const maxDepth = useMemo(() => {
    if (!showHeatmap) return 0
    return visibleNodes.reduce((max, node) => {
      const depth = node.prerequisiteSummary?.depth ?? 0
      return depth > max ? depth : max
    }, 0)
  }, [visibleNodes, showHeatmap])
  
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
        const heatmapValue =
          showHeatmap && maxDepth > 0 ? (node.prerequisiteSummary?.depth ?? 0) / maxDepth : undefined

        let progressState: 'completed' | 'queued' | 'in-progress' | 'locked' | undefined
        if (showEmpireProgress) {
          if (completedNodes?.has(node.id)) {
            progressState = 'completed'
          } else if (queuedNodes?.has(node.id)) {
            progressState = 'queued'
          } else if (inProgressNodes?.has(node.id)) {
            progressState = 'in-progress'
          } else if (node.status === 'locked') {
            progressState = 'locked'
          }
        }

        const comparisonInfo =
          showComparison && comparisonPlanetCount > 0
            ? {
                selected: comparisonPlanetCount,
                ready:
                  node.status === 'available' || node.status === 'completed'
                    ? comparisonPlanetCount
                    : 0,
              }
            : undefined
        
        return (
          <motion.div
            key={node.id}
            data-node-id={node.id}
            className="absolute"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              zIndex: isHighlighted ? 10 : 1,
            }}
          >
            <NodeCard
              node={node}
              highlighted={isHighlighted}
              onClick={onNodeClick}
              onHover={onNodeHover}
              heatmapValue={heatmapValue}
              progressState={progressState}
              comparisonInfo={comparisonInfo}
            />
          </motion.div>
        )
      })}
    </div>
  )
})
