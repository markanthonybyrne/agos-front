import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useGetTechTreeDefinitionsQuery } from '@/api/endpoints/empiresApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectNode, setHighlightedPath, setFilters } from '@/app/slices/techTreeSlice'
import { buildGraph } from '@/lib/graphEngine'
import { calculateRadialLayout, getDefaultLayoutConfig } from '@/lib/layoutAlgorithms'
import { filterBySpecialization, filterByEra, filterByType, findPath } from '@/lib/graphEngine'
import { TechTreeGraphData, TechNodeType } from '@/types/tech-tree.types'
import { useTechNodeDetails } from '@/hooks/useTechNodeDetails'
import { ConnectionsCanvas } from '@/components/tech-tree/ConnectionsCanvas'
import { NodesLayer } from '@/components/tech-tree/NodesLayer'
import { NodeDetailsPanel } from '@/components/tech-tree/NodeDetailsPanel'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TechTreeEmbeddedProps {
  nodeType?: TechNodeType // Filter by node type (facility, research, ship, defence)
  planetId?: number // Optional planet context
  className?: string
  height?: string // Optional height override
}

/**
 * Embedded tech tree component for use in planet tabs and other contexts
 * Filters to show only the specified node type
 */
export function TechTreeEmbedded({ 
  nodeType, 
  planetId, 
  className,
  height = '600px'
}: TechTreeEmbeddedProps) {
  const dispatch = useAppDispatch()
  
  // Use new definitions endpoint with planet context for embedded view
  const { data: apiData, isLoading, error } = useGetTechTreeDefinitionsQuery({
    type: nodeType || undefined,
    planet_id: planetId || undefined,
  })
  
  const { selectedNodeId, highlightedPath, activeFilters } = useAppSelector((state) => state.techTree)
  const { selectedNode, openDetails, closeDetails } = useTechNodeDetails()
  
  // Reset selected node when component unmounts or nodeType/planetId changes
  useEffect(() => {
    return () => {
      // Cleanup: close details when component unmounts or key changes
      closeDetails()
      dispatch(selectNode(null))
    }
  }, [nodeType, planetId, closeDetails, dispatch])
  
  // Apply node type filter - clear other filters and set the specific nodeType
  useEffect(() => {
    if (nodeType && ['facility', 'research', 'ship', 'defence'].includes(nodeType)) {
      // Clear any existing filters and set only the nodeType filter
      dispatch(setFilters({ 
        nodeTypes: [nodeType],
        // Keep other filters but prioritize nodeType
      }))
    } else if (!nodeType) {
      // If no nodeType prop, clear the nodeType filter
      dispatch(setFilters({ nodeTypes: [] }))
    }
  }, [nodeType, dispatch])
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Build graph from API data
  // New definitions API format uses completed, can_build fields per item
  const graphData = useMemo<TechTreeGraphData | null>(() => {
    if (!apiData) return null
    
    // For new API format, buildGraph handles completed status from item.completed field
    const completedNodes: string[] = []
    const queuedNodes: string[] = []
    const inProgressNodes: string[] = []
    
    return buildGraph(apiData, completedNodes, queuedNodes, inProgressNodes)
  }, [apiData])
  
  // Calculate layout positions
  const layoutPositions = useMemo(() => {
    if (!graphData) return new Map()
    
    const container = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 }
    const config = getDefaultLayoutConfig(container.width, container.height)
    return calculateRadialLayout(graphData.nodes, config)
  }, [graphData])
  
  // Apply filters
  const filteredNodes = useMemo(() => {
    if (!graphData) return []
    
    let nodes = graphData.nodes
    
    // Apply position from layout
    nodes = nodes.map((node) => {
      const position = layoutPositions.get(node.id)
      return position ? { ...node, position } : node
    })
    
    // Filter by node type - prioritize prop, then Redux state
    const effectiveNodeTypes = nodeType ? [nodeType] : activeFilters.nodeTypes
    if (effectiveNodeTypes.length > 0) {
      nodes = filterByType(nodes, effectiveNodeTypes)
    }
    
    // Filter by specialization
    if (activeFilters.specializations.length > 0) {
      nodes = filterBySpecialization(nodes, activeFilters.specializations)
    }
    
    // Filter by era - only if explicitly filtered
    // For planet detail view, show all eras for planning purposes
    if (activeFilters.eras.length > 0) {
      const maxEra = Math.max(...activeFilters.eras)
      nodes = filterByEra(nodes, maxEra)
    }
    // Remove automatic era filtering - show all eras for planning
    
    // Filter by search query
    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase()
      nodes = nodes.filter((node) =>
        node.name.toLowerCase().includes(query) ||
        node.slug.toLowerCase().includes(query)
      )
    }
    
    // Filter locked/completed
    if (!activeFilters.showLocked) {
      nodes = nodes.filter((node) => node.status !== 'locked')
    }
    if (!activeFilters.showCompleted) {
      nodes = nodes.filter(
        (node) => node.status !== 'completed' && node.status !== 'researched'
      )
    }
    
    return nodes
  }, [graphData, layoutPositions, activeFilters, nodeType])
  
  // Debug: Log filtering results
  useEffect(() => {
    if (filteredNodes.length > 0) {
      console.log(`TechTreeEmbedded (${nodeType || 'all'}):`, {
        nodeType,
        totalNodes: graphData?.nodes.length || 0,
        filteredCount: filteredNodes.length,
        nodeTypes: filteredNodes.map(n => n.type),
      })
    } else if (graphData) {
      console.warn(`TechTreeEmbedded (${nodeType || 'all'}): No nodes after filtering`, {
        nodeType,
        totalNodes: graphData.nodes.length,
        activeFilters,
      })
    }
  }, [filteredNodes, nodeType, graphData, activeFilters])
  
  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const node = graphData?.nodes.find((n) => n.id === nodeId)
      if (node) {
        dispatch(selectNode(nodeId))
        openDetails(node)
      }
    },
    [graphData, dispatch, openDetails]
  )
  
  // Handle node hover (show path preview)
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      if (!nodeId || !graphData) {
        dispatch(setHighlightedPath([]))
        return
      }
      
      const node = graphData.nodes.find((n) => n.id === nodeId)
      if (node && node.status === 'locked') {
        const path = findPath(graphData, nodeId)
        dispatch(setHighlightedPath(path.nodes))
      } else {
        dispatch(setHighlightedPath([]))
      }
    },
    [graphData, dispatch]
  )
  
  // Viewport bounds for culling - account for panning
  const viewport = useMemo(() => {
    const padding = 500
    const container = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 }
    return {
      minX: -panX - padding,
      maxX: -panX + container.width + padding,
      minY: -panY - padding,
      maxY: -panY + container.height + padding,
    }
  }, [panX, panY, canvasRef])
  
  // Calculate canvas bounds for proper scrolling
  // MUST be before early returns to maintain hooks order
  const canvasBounds = useMemo(() => {
    if (filteredNodes.length === 0) {
      const container = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 }
      return { width: container.width, height: container.height }
    }
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    filteredNodes.forEach((node) => {
      if (node.position) {
        minX = Math.min(minX, node.position.x)
        minY = Math.min(minY, node.position.y)
        maxX = Math.max(maxX, node.position.x)
        maxY = Math.max(maxY, node.position.y)
      }
    })
    
    const container = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 }
    const padding = 200
    const width = Math.max(container.width, maxX - minX + padding * 2)
    const height = Math.max(container.height, maxY - minY + padding * 2)
    
    return { width, height }
  }, [filteredNodes])
  
  // Find selected node data
  useEffect(() => {
    if (selectedNodeId && graphData) {
      const node = graphData.nodes.find((n) => n.id === selectedNodeId)
      if (node) {
        openDetails(node)
      }
    } else if (!selectedNodeId) {
      closeDetails()
    }
  }, [selectedNodeId, graphData, openDetails, closeDetails])
  
  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't pan if clicking on an interactive element (buttons, nodes, etc.)
    const target = e.target as HTMLElement
    if (target.closest('button, [role="button"], [data-node-id]')) {
      return
    }
    
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
      e.preventDefault()
    }
  }, [panX, panY])

  // Handle mouse move for panning
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load tech tree</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  if (!graphData) {
    return null
  }

  return (
    <div 
      className={cn("relative overflow-hidden bg-background rounded-lg border border-border", className)} 
      style={{ height }}
      onMouseDown={handleMouseDown}
    >
      {/* Background gradient - Fixed, doesn't move with panning */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      {/* Main Canvas - This moves with panning */}
      <div
        ref={canvasRef}
        className="relative"
        style={{
          width: canvasBounds.width,
          height: canvasBounds.height,
          minWidth: '100%',
          minHeight: '100%',
          transform: `translate(${panX}px, ${panY}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Connections Layer */}
        {graphData && (
          <ConnectionsCanvas
            nodes={filteredNodes}
            edges={graphData.edges}
            highlightedPath={highlightedPath}
            viewport={viewport}
            panX={panX}
            panY={panY}
            zoom={1}
          />
        )}
        
        {/* Nodes Layer */}
        {graphData && (
          <NodesLayer
            nodes={filteredNodes}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            viewport={viewport}
            panX={panX}
            panY={panY}
            zoom={1}
            highlightedNodes={highlightedPath}
          />
        )}
      </div>
      
      {/* Details Panel - Always render to maintain consistent hook order */}
      <NodeDetailsPanel
        key={`node-details-${nodeType}-${planetId}`}
        node={selectedNode}
        planetId={planetId}
        graphData={graphData || null}
        onClose={() => {
          dispatch(selectNode(null))
          closeDetails()
        }}
        onQueue={(nodeId) => {
          // TODO: Implement queue action
          console.log('Queue node:', nodeId)
        }}
        onViewPath={(nodeId) => {
          if (graphData) {
            const path = findPath(graphData, nodeId)
            dispatch(setHighlightedPath(path.nodes))
          }
        }}
        onJumpToNode={(nodeId) => {
          handleNodeClick(nodeId)
        }}
      />
    </div>
  )
}
