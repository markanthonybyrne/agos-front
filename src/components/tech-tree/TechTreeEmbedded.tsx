import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useGetTechTreeQuery } from '@/api/endpoints/empiresApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectNode, setHighlightedPath, setFilters } from '@/app/slices/techTreeSlice'
import { buildGraph } from '@/lib/graphEngine'
import { calculateRadialLayout, getDefaultLayoutConfig } from '@/lib/layoutAlgorithms'
import { filterBySpecialization, filterByEra, filterByType, findPath } from '@/lib/graphEngine'
import { TechTreeGraphData, TechNodeType } from '@/types/tech-tree.types'
import { useTechNodeDetails } from '@/hooks/useTechNodeDetails'
import { useZoomPan } from '@/hooks/useZoomPan'
import { ConnectionsCanvas } from '@/components/tech-tree/ConnectionsCanvas'
import { NodesLayer } from '@/components/tech-tree/NodesLayer'
import { NodeDetailsPanel } from '@/components/tech-tree/NodeDetailsPanel'
import { Button } from '@/components/ui/button'
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
  const { data: apiData, isLoading, error } = useGetTechTreeQuery()
  const { selectedNodeId, highlightedPath, activeFilters } = useAppSelector((state) => state.techTree)
  const { selectedNode, openDetails, closeDetails } = useTechNodeDetails()
  
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
  
  // Camera controls
  const canvasRef = useRef<HTMLDivElement>(null)
  const { scale, panX, panY, setPan, onWheel, reset } = useZoomPan({
    minScale: 0.3,
    maxScale: 1.5,
    initialScale: 0.8,
  })
  
  // Build graph from API data
  const graphData = useMemo<TechTreeGraphData | null>(() => {
    if (!apiData) return null
    
    const completedNodes: string[] = []
    const queuedNodes: string[] = []
    const inProgressNodes: string[] = []
    
    // Extract completed/queued/in-progress nodes from API response
    if (apiData.completed_research) {
      apiData.completed_research.forEach((slug) => {
        completedNodes.push(`research-${slug}`)
      })
    }
    
    if (apiData.queued_items) {
      apiData.queued_items.forEach((item) => {
        queuedNodes.push(`${item.type}-${item.slug}`)
      })
    }
    
    if (apiData.in_progress_items) {
      apiData.in_progress_items.forEach((item) => {
        inProgressNodes.push(`${item.type}-${item.slug}`)
      })
    }
    
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
    
    // Filter by era
    if (activeFilters.eras.length > 0) {
      const maxEra = Math.max(...activeFilters.eras)
      nodes = filterByEra(nodes, maxEra)
    } else if (graphData.empireState.active_era) {
      nodes = filterByEra(nodes, graphData.empireState.active_era)
    }
    
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
  
  // Viewport bounds for culling
  const viewport = useMemo(() => {
    const padding = 200
    const container = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 }
    return {
      minX: -panX / scale - padding,
      maxX: (-panX + container.width) / scale + padding,
      minY: -panY / scale - padding,
      maxY: (-panY + container.height) / scale + padding,
    }
  }, [panX, panY, scale])
  
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
          <Button onClick={() => window.location.reload()} size="sm">Retry</Button>
        </div>
      </div>
    )
  }
  
  if (!graphData) {
    return null
  }
  
  return (
    <div className={cn("relative overflow-hidden bg-background rounded-lg border border-border", className)} style={{ height }}>
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={(e) => {
          if (e.button === 0 && canvasRef.current) {
            // Left mouse button - pan
            const startX = e.clientX - panX
            const startY = e.clientY - panY
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              setPan(moveEvent.clientX - startX, moveEvent.clientY - startY)
            }
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }
        }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Connections Layer */}
        {graphData && (
          <ConnectionsCanvas
            nodes={filteredNodes}
            edges={graphData.edges}
            highlightedPath={highlightedPath}
            viewport={viewport}
            panX={panX}
            panY={panY}
            zoom={scale}
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
            zoom={scale}
            highlightedNodes={highlightedPath}
          />
        )}
      </div>
      
      {/* Controls */}
      <div className="absolute top-2 right-2 z-50">
        <Button onClick={reset} variant="outline" size="sm">
          Reset View
        </Button>
      </div>
      
      {/* Details Panel */}
      <NodeDetailsPanel
        node={selectedNode}
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
