import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useGetTechTreeQuery } from '@/api/endpoints/empiresApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectNode, setHighlightedPath, setFilters } from '@/app/slices/techTreeSlice'
import { TechNodeType } from '@/types/tech-tree.types'
import { buildGraph } from '@/lib/graphEngine'
import { calculateRadialLayout, calculateHierarchicalLayout, getDefaultLayoutConfig } from '@/lib/layoutAlgorithms'
import { filterBySpecialization, filterByEra, filterByType, findPath } from '@/lib/graphEngine'
import { TechTreeGraphData } from '@/types/tech-tree.types'
import { useTechNodeDetails } from '@/hooks/useTechNodeDetails'
import { useZoomPan } from '@/hooks/useZoomPan'
import { ConnectionsCanvas } from '@/components/tech-tree/ConnectionsCanvas'
import { NodesLayer } from '@/components/tech-tree/NodesLayer'
import { NodeDetailsPanel } from '@/components/tech-tree/NodeDetailsPanel'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function TechTreeScreen() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { data: apiData, isLoading, error } = useGetTechTreeQuery()
  const { selectedNodeId, highlightedPath, activeFilters } = useAppSelector((state) => state.techTree)
  const { selectedNode, openDetails, closeDetails } = useTechNodeDetails()
  
  // Get filter from URL params or location state (optional - full tree shows all by default)
  const urlNodeType = searchParams.get('type') as TechNodeType | null
  const stateNodeType = (location.state as any)?.nodeType as TechNodeType | null
  const filterNodeType = urlNodeType || stateNodeType
  
  // Apply node type filter from URL/state only if explicitly provided
  // Otherwise, clear nodeType filter to show ALL definitions
  useEffect(() => {
    if (filterNodeType && ['facility', 'research', 'ship', 'defence'].includes(filterNodeType)) {
      // Apply filter if explicitly requested
      dispatch(setFilters({ nodeTypes: [filterNodeType] }))
    } else {
      // Clear nodeType filter to show all definitions in full tech tree
      dispatch(setFilters({ nodeTypes: [] }))
    }
  }, [filterNodeType, dispatch])
  
  // Camera controls
  const canvasRef = useRef<HTMLDivElement>(null)
  const { scale, panX, panY, setPan, onWheel, reset } = useZoomPan({
    minScale: 0.5,
    maxScale: 2,
    initialScale: 1,
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
  
  // Calculate layout positions - use hierarchical layout for better visibility
  const layoutPositions = useMemo(() => {
    if (!graphData) return new Map()
    
    // Use hierarchical layout instead of radial for now
    return calculateHierarchicalLayout(
      graphData.nodes,
      graphData.edges,
      { width: window.innerWidth, height: window.innerHeight }
    )
  }, [graphData])
  
  // Apply filters
  const filteredNodes = useMemo(() => {
    if (!graphData) return []
    
    let nodes = graphData.nodes
    
    // Apply position from layout - ensure all nodes get a position
    nodes = nodes.map((node) => {
      const position = layoutPositions.get(node.id)
      if (position) {
        return { ...node, position }
      }
      // Fallback: assign a default position if layout didn't provide one
      return {
        ...node,
        position: {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          angle: 0,
          radius: 0,
        },
      }
    })
    
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
    
    // Filter by type
    if (activeFilters.nodeTypes.length > 0) {
      nodes = filterByType(nodes, activeFilters.nodeTypes)
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
  }, [graphData, layoutPositions, activeFilters])
  
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
  
  // Viewport bounds for culling - make it very permissive to ensure nodes render
  const viewport = useMemo(() => {
    const padding = 5000 // Large padding to ensure all nodes are visible
    return {
      minX: -panX / scale - padding,
      maxX: (-panX + window.innerWidth) / scale + padding,
      minY: -panY / scale - padding,
      maxY: (-panY + window.innerHeight) / scale + padding,
    }
  }, [panX, panY, scale])
  
  // Debug: Log filtered nodes count
  useEffect(() => {
    if (filteredNodes.length > 0) {
      console.log('TechTree: Filtered nodes count:', filteredNodes.length)
      console.log('TechTree: Sample node positions:', filteredNodes.slice(0, 3).map(n => ({ id: n.id, pos: n.position })))
    }
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load tech tree</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }
  
  if (!graphData) {
    return null
  }
  
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 1 }}>
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing w-full h-full"
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
      <div className="absolute top-4 right-4 z-40 flex gap-2">
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
          // TODO: Focus camera on node
          handleNodeClick(nodeId)
        }}
      />
    </div>
  )
}
