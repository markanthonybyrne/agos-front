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
 * Uses hierarchical curvature - connections going upward get more curvature
 */
function getBezierPath(
  from: RadialPosition,
  to: RadialPosition,
  curvature: number = 0.15,
  fromNode?: { era?: number },
  toNode?: { era?: number }
): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Adjust curvature based on era difference (if available)
  // Higher era connections get slightly more curvature
  let adjustedCurvature = curvature
  if (fromNode?.era && toNode?.era) {
    const eraDiff = toNode.era - fromNode.era
    adjustedCurvature = curvature * (1 + eraDiff * 0.1)
  }
  
  // Use distance-based curvature for smoother long connections
  const distanceFactor = Math.min(distance / 500, 1.5)
  adjustedCurvature *= distanceFactor
  
  // Control points offset perpendicular to the line
  const perpX = -dy * adjustedCurvature
  const perpY = dx * adjustedCurvature
  
  const cp1x = from.x + perpX
  const cp1y = from.y + perpY
  const cp2x = to.x + perpX
  const cp2y = to.y + perpY
  
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`
}

/**
 * Calculate connection depth/importance for opacity
 */
function getConnectionOpacity(
  fromNode?: { era?: number },
  toNode?: { era?: number },
  distance?: number
): number {
  let opacity = 0.15 // Base opacity for normal connections
  
  // Connections to higher eras are slightly more visible
  if (fromNode?.era && toNode?.era) {
    const eraDiff = toNode.era - fromNode.era
    opacity += Math.min(eraDiff * 0.05, 0.1)
  }
  
  // Closer connections are slightly more visible
  if (distance) {
    const distanceFactor = Math.max(0, 1 - distance / 1000)
    opacity += distanceFactor * 0.05
  }
  
  return Math.min(opacity, 0.25)
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
  // Create maps for node positions and node data
  const nodePositions = new Map<string, RadialPosition>()
  const nodeData = new Map<string, TechNodeData>()
  
  nodes.forEach((node) => {
    if (node.position) {
      nodePositions.set(node.id, node.position)
      nodeData.set(node.id, node)
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
  
  // Sort edges by distance to render closer connections on top (slightly more visible)
  const sortedNormalEdges = [...normalEdges].sort((a, b) => {
    const posA = nodePositions.get(a.from)
    const posB = nodePositions.get(b.from)
    const posAto = nodePositions.get(a.to)
    const posBto = nodePositions.get(b.to)
    
    if (!posA || !posAto || !posB || !posBto) return 0
    
    const distA = Math.sqrt(Math.pow(posAto.x - posA.x, 2) + Math.pow(posAto.y - posA.y, 2))
    const distB = Math.sqrt(Math.pow(posBto.x - posB.x, 2) + Math.pow(posBto.y - posB.y, 2))
    
    return distA - distB // Closer connections first
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
          <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.5" />
        </linearGradient>
        
        {/* Arrow marker for connection direction */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="rgba(107,114,128,0.4)" />
        </marker>
        
        {/* Arrow marker for highlighted paths */}
        <marker
          id="arrowhead-highlight"
          markerWidth="12"
          markerHeight="12"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,8 L11,4 z" fill="rgb(6,182,212)" fillOpacity="0.8" />
        </marker>
      </defs>
      
      {/* Normal connections (subtle, thin) */}
      <g className="normal-connections">
        {sortedNormalEdges.map((edge, index) => {
          const fromPos = nodePositions.get(edge.from)
          const toPos = nodePositions.get(edge.to)
          const fromNode = nodeData.get(edge.from)
          const toNode = nodeData.get(edge.to)
          
          if (!fromPos || !toPos) return null
          
          // Check if edge is in viewport (rough culling)
          const minX = Math.min(fromPos.x, toPos.x)
          const maxX = Math.max(fromPos.x, toPos.x)
          const minY = Math.min(fromPos.y, toPos.y)
          const maxY = Math.max(fromPos.y, toPos.y)
          
          if (
            maxX < viewport.minX - 100 ||
            minX > viewport.maxX + 100 ||
            maxY < viewport.minY - 100 ||
            minY > viewport.maxY + 100
          ) {
            return null
          }
          
          // Calculate distance for opacity
          const distance = Math.sqrt(
            Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2)
          )
          
          // Use lower curvature for cleaner look
          const pathD = getBezierPath(fromPos, toPos, 0.1, fromNode, toNode)
          const opacity = getConnectionOpacity(fromNode, toNode, distance)
          
          // Different styling based on connection type
          const isPrerequisite = edge.type === 'prerequisite' || !edge.type
          const strokeColor = isPrerequisite 
            ? 'rgba(107,114,128,0.2)' // Darker for prerequisites
            : 'rgba(107,114,128,0.15)' // Lighter for facilitating
          
          return (
            <motion.path
              key={`normal-${edge.from}-${edge.to}-${index}`}
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isPrerequisite ? "1" : "0.8"}
              strokeOpacity={opacity}
              markerEnd={isPrerequisite ? "url(#arrowhead)" : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: opacity }}
              transition={{
                pathLength: { duration: 0.3, delay: index * 0.01 },
                opacity: { duration: 0.2 },
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
          const fromNode = nodeData.get(edge.from)
          const toNode = nodeData.get(edge.to)
          
          if (!fromPos || !toPos) return null
          
          // Use slightly more curvature for highlighted paths
          const pathD = getBezierPath(fromPos, toPos, 0.2, fromNode, toNode)
          
          return (
            <g key={`highlight-${edge.from}-${edge.to}-${index}`}>
              {/* Glow effect behind */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="rgb(6,182,212)"
                strokeWidth="6"
                strokeOpacity={0.3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{
                  pathLength: {
                    duration: 0.6,
                    delay: index * 0.08,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.2, delay: index * 0.08 },
                }}
              />
              {/* Main highlighted path */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="2.5"
                strokeOpacity={0.9}
                markerEnd="url(#arrowhead-highlight)"
                strokeDasharray="8,4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 0.9,
                  strokeDashoffset: [0, -12]
                }}
                transition={{
                  pathLength: {
                    duration: 0.6,
                    delay: index * 0.08,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.2, delay: index * 0.08 },
                  strokeDashoffset: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }
                }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
})
