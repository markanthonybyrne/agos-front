import { memo } from 'react'
import { motion } from 'framer-motion'
import { TechNodeData, TechTreeEdge, RadialPosition } from '@/types/tech-tree.types'

interface ConnectionsCanvasProps {
  nodes: TechNodeData[]
  edges: TechTreeEdge[]
  highlightedPath?: string[]
  viewport: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  panX?: number
  panY?: number
  zoom?: number
}

/**
 * Calculate control points for smooth bezier curve between two points
 */
function getBezierPath(
  from: RadialPosition,
  to: RadialPosition,
  curvature: number = 0.3
): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  
  // Control points offset perpendicular to the line
  const perpX = -dy * curvature
  const perpY = dx * curvature
  
  const cp1x = from.x + perpX
  const cp1y = from.y + perpY
  const cp2x = to.x + perpX
  const cp2y = to.y + perpY
  
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

export const ConnectionsCanvas = memo(function ConnectionsCanvas({
  nodes,
  edges,
  highlightedPath = [],
  viewport,
  panX = 0,
  panY = 0,
  zoom = 1,
}: ConnectionsCanvasProps) {
  // Create a map of node positions
  const nodePositions = new Map<string, RadialPosition>()
  nodes.forEach((node) => {
    if (node.position) {
      nodePositions.set(node.id, node.position)
    }
  })
  
  // Separate highlighted edges from normal edges
  const highlightedEdges: TechTreeEdge[] = []
  const normalEdges: TechTreeEdge[] = []
  
  // Create a set of highlighted edge keys (from-to pairs)
  const highlightedEdgeKeys = new Set<string>()
  for (let i = 0; i < highlightedPath.length - 1; i++) {
    const from = highlightedPath[i]
    const to = highlightedPath[i + 1]
    highlightedEdgeKeys.add(`${from}-${to}`)
  }
  
  edges.forEach((edge) => {
    const edgeKey = `${edge.from}-${edge.to}`
    const reverseKey = `${edge.to}-${edge.from}`
    
    // Check if this edge is part of the highlighted path
    if (highlightedEdgeKeys.has(edgeKey) || highlightedEdgeKeys.has(reverseKey)) {
      highlightedEdges.push(edge)
    } else {
      normalEdges.push(edge)
    }
  })
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      <defs>
        {/* Gradient for highlighted paths */}
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.4" />
        </linearGradient>
        
        {/* Animated dash pattern for highlighted paths */}
        <pattern
          id="pathDashPattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect width="10" height="20" fill="rgba(6,182,212,0.6)" />
        </pattern>
      </defs>
      
      {/* Normal connections (gray, thin) */}
      <g className="normal-connections">
        {normalEdges.map((edge, index) => {
          const fromPos = nodePositions.get(edge.from)
          const toPos = nodePositions.get(edge.to)
          
          if (!fromPos || !toPos) return null
          
          // Check if edge is in viewport (rough culling)
          const minX = Math.min(fromPos.x, toPos.x)
          const maxX = Math.max(fromPos.x, toPos.x)
          const minY = Math.min(fromPos.y, toPos.y)
          const maxY = Math.max(fromPos.y, toPos.y)
          
          if (
            maxX < viewport.minX - 50 ||
            minX > viewport.maxX + 50 ||
            maxY < viewport.minY - 50 ||
            minY > viewport.maxY + 50
          ) {
            return null
          }
          
          const pathD = getBezierPath(fromPos, toPos, 0.2)
          
          return (
            <motion.path
              key={`normal-${edge.from}-${edge.to}-${index}`}
              d={pathD}
              fill="none"
              stroke="rgb(107,114,128)"
              strokeWidth="1.5"
              strokeOpacity={0.3}
              strokeDasharray={edge.type === 'prerequisite' ? 'none' : '5,5'}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{
                pathLength: { duration: 0.5, delay: index * 0.02 },
                opacity: { duration: 0.3 },
              }}
            />
          )
        })}
      </g>
      
      {/* Highlighted path connections (cyan, thick, animated) */}
      <g className="highlighted-connections">
        {highlightedEdges.map((edge, index) => {
          const fromPos = nodePositions.get(edge.from)
          const toPos = nodePositions.get(edge.to)
          
          if (!fromPos || !toPos) return null
          
          const pathD = getBezierPath(fromPos, toPos, 0.3)
          
          return (
            <motion.path
              key={`highlight-${edge.from}-${edge.to}-${index}`}
              d={pathD}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeOpacity={0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{
                pathLength: {
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: 'easeInOut',
                },
                opacity: { duration: 0.3, delay: index * 0.1 },
              }}
            >
              {/* Animated flow effect */}
              <animate
                attributeName="stroke-dashoffset"
                values="0;20"
                dur="2s"
                repeatCount="indefinite"
              />
            </motion.path>
          )
        })}
      </g>
    </svg>
  )
})
