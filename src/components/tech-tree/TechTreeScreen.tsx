import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useGetTechTreeDefinitionsQuery } from '@/api/endpoints/empiresApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectNode, setHighlightedPath, setFilters } from '@/app/slices/techTreeSlice'
import { TechNodeType } from '@/types/tech-tree.types'
import { buildGraph } from '@/lib/graphEngine'
import { calculateHierarchicalLayout } from '@/lib/layoutAlgorithms'
import { filterBySpecialization, filterByEra, filterByType, findPath } from '@/lib/graphEngine'
import { TechTreeGraphData } from '@/types/tech-tree.types'
import { useTechNodeDetails } from '@/hooks/useTechNodeDetails'
import { useZoomPan } from '@/hooks/useZoomPan'
import { ConnectionsCanvas } from '@/components/tech-tree/ConnectionsCanvas'
import { NodesLayer } from '@/components/tech-tree/NodesLayer'
import { NodeDetailsPanel } from '@/components/tech-tree/NodeDetailsPanel'
import { TechTreeFilterBar } from '@/components/tech-tree/TechTreeFilterBar'
import { Loader2 } from 'lucide-react'

export function TechTreeScreen() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  
  // Get filter from URL params or location state (optional - full tree shows all by default)
  const urlNodeType = searchParams.get('type') as TechNodeType | null
  const stateNodeType = (location.state as any)?.nodeType as TechNodeType | null
  const filterNodeType = urlNodeType || stateNodeType
  const planetId = (location.state as any)?.planetId as number | undefined
  
  // Use new definitions endpoint
  // When no planetId: fetch ALL definitions (no type filter)
  // When planetId exists: fetch with type filter if provided (from planet detail tab)
  const { data: apiData, isLoading, error } = useGetTechTreeDefinitionsQuery({
    type: planetId && filterNodeType ? filterNodeType : undefined, // Only filter by type when coming from planet detail
    planet_id: planetId,
  })
  
  const { selectedNodeId, highlightedPath, activeFilters } = useAppSelector((state) => state.techTree)
  const { selectedNode, openDetails, closeDetails } = useTechNodeDetails()
  
  // Apply node type filter ONLY when coming from planet detail (has planetId)
  // When no planetId, show ALL categories unfiltered
  useEffect(() => {
    if (planetId && filterNodeType && ['facility', 'research', 'ship', 'defence'].includes(filterNodeType)) {
      // Coming from planet detail - apply filter based on tab selection
      dispatch(setFilters({ nodeTypes: [filterNodeType] }))
    } else if (!planetId) {
      // Full tech tree view (no planet context) - show ALL categories
      dispatch(setFilters({ nodeTypes: [] }))
    }
    // If planetId exists but no filterNodeType, don't change filters (user can use filter bar)
  }, [filterNodeType, planetId, dispatch])
  
  // Build graph from API data
  // New definitions API format doesn't have completed_research, queued_items, in_progress_items
  // Instead, it has completed, can_build fields per item
  const graphData = useMemo<TechTreeGraphData | null>(() => {
    if (!apiData) return null
    
    // For new API format, buildGraph handles completed status from item.completed field
    // But we still need empty arrays for queued/in-progress as those come from elsewhere
    const completedNodes: string[] = []
    const queuedNodes: string[] = []
    const inProgressNodes: string[] = []
    
    return buildGraph(apiData, completedNodes, queuedNodes, inProgressNodes)
  }, [apiData])
  
  // Calculate layout positions - use backend positions if available, otherwise hierarchical layout
  const layoutPositions = useMemo(() => {
    if (!graphData) return new Map()
    
    // Use hierarchical layout which can integrate backend positions
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
    
    // Filter by era - only if explicitly filtered, not by default
    // The full tech tree should show ALL eras regardless of current empire era
    if (activeFilters.eras.length > 0) {
      const maxEra = Math.max(...activeFilters.eras)
      nodes = filterByEra(nodes, maxEra)
    }
    // Remove automatic era filtering - show all eras in full tech tree
    
    // Filter by type - only apply if filters are explicitly set
    // When no planet context, don't filter by type by default (show all)
    // When coming from planet detail, type filter is already applied via useEffect
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

  // Calculate node bounds for zoom/pan (must be after filteredNodes)
  const nodeBounds = useMemo(() => {
    if (filteredNodes.length === 0) {
      return { minX: 0, minY: 0, maxX: window.innerWidth, maxY: window.innerHeight, width: window.innerWidth, height: window.innerHeight }
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
    
    const padding = 200
    const width = Math.max(window.innerWidth, maxX - minX + padding * 2)
    const height = Math.max(window.innerHeight, maxY - minY + padding * 2)
    
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width,
      height,
    }
  }, [filteredNodes])
  
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
  
  // Initialize zoom/pan hook - MUST be before early returns to maintain hook order
  const zoomPan = useZoomPan({
    minScale: 0.1,
    maxScale: 2.0,
    initialScale: 0.8,
    gridWidth: nodeBounds.width,
    gridHeight: nodeBounds.height,
    enableWheelZoom: true,
    // Don't auto-reset - we handle centering manually
  })

  // Viewport bounds for culling - account for panning and zoom
  const actualViewport = useMemo(() => {
    const padding = 500 // Padding around visible area for pre-rendering
    const panX = zoomPan.panX
    const panY = zoomPan.panY
    const scale = zoomPan.scale
    
    return {
      minX: (-panX - padding) / scale,
      maxX: (-panX + window.innerWidth + padding) / scale,
      minY: (-panY - padding) / scale,
      maxY: (-panY + window.innerHeight + padding) / scale,
    }
  }, [zoomPan.panX, zoomPan.panY, zoomPan.scale])

  // Center the tree on initial load and after bounds change
  const lastBoundsRef = useRef({ width: 0, height: 0 })
  useEffect(() => {
    // Center when nodeBounds are first calculated or when they change significantly
    if (
      filteredNodes.length > 0 && 
      nodeBounds.width > 0 && 
      nodeBounds.height > 0 &&
      (lastBoundsRef.current.width !== nodeBounds.width || lastBoundsRef.current.height !== nodeBounds.height)
    ) {
      const centerX = (nodeBounds.minX + nodeBounds.maxX) / 2
      const centerY = (nodeBounds.minY + nodeBounds.maxY) / 2
      
      // Calculate pan to center the content in the viewport
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      
      // Account for the filter bar at the bottom (pb-20 = 80px padding)
      const filterBarHeight = 80
      const adjustedViewportCenterY = (window.innerHeight - filterBarHeight) / 2
      
      const targetPanX = viewportCenterX - centerX * zoomPan.scale
      const targetPanY = adjustedViewportCenterY - centerY * zoomPan.scale
      
      // Set zoom and pan to center the tree
      // Use a small delay to ensure this runs after any reset from useZoomPan
      setTimeout(() => {
        zoomPan.setZoomAndPan(zoomPan.scale, targetPanX, targetPanY)
      }, 0)
      
      lastBoundsRef.current = { width: nodeBounds.width, height: nodeBounds.height }
    }
  }, [filteredNodes, nodeBounds, zoomPan])

  // Focus on a specific node (for jump to prerequisite) - MUST be before early returns
  const focusOnNode = useCallback((nodeId: string) => {
    const node = graphData?.nodes.find((n) => n.id === nodeId)
    if (!node || !node.position) return

    // Center view on the node
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    // Calculate pan to center the node
    const targetPanX = centerX - node.position.x * zoomPan.scale
    const targetPanY = centerY - node.position.y * zoomPan.scale
    
    // Set zoom and pan to focus on node
    zoomPan.setZoomAndPan(zoomPan.scale, targetPanX, targetPanY)
    
    // Optionally zoom in slightly for better visibility
    setTimeout(() => {
      zoomPan.zoomIn(centerX, centerY)
    }, 100)
  }, [graphData, zoomPan])
  
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
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded">
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
      ref={zoomPan.containerRef}
      className="fixed inset-0 overflow-hidden pb-20" 
      style={{ zIndex: 1 }}
      onMouseDown={zoomPan.onMouseDown}
      onMouseMove={zoomPan.onMouseMove}
      onMouseUp={zoomPan.onMouseUp}
      onWheel={zoomPan.onWheel}
    >
      {/* Background gradient - Fixed, doesn't move with panning */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      {/* Main Canvas - This moves with panning */}
      <div
        className="relative"
        style={{
          width: nodeBounds.width,
          height: nodeBounds.height,
          minWidth: '100%',
          minHeight: '100%',
          transform: `translate(${zoomPan.panX}px, ${zoomPan.panY}px) scale(${zoomPan.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connections Layer */}
        {graphData && (
          <ConnectionsCanvas
            nodes={filteredNodes}
            edges={graphData.edges}
            highlightedPath={highlightedPath}
            viewport={actualViewport}
            panX={zoomPan.panX}
            panY={zoomPan.panY}
            zoom={zoomPan.scale}
          />
        )}
        
        {/* Nodes Layer */}
        {graphData && (
          <NodesLayer
            nodes={filteredNodes}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            viewport={actualViewport}
            panX={zoomPan.panX}
            panY={zoomPan.panY}
            zoom={zoomPan.scale}
            highlightedNodes={highlightedPath}
          />
        )}
      </div>
      
      {/* Details Panel */}
      <NodeDetailsPanel
        node={selectedNode}
        planetId={planetId}
        graphData={graphData}
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
          focusOnNode(nodeId)
          handleNodeClick(nodeId)
        }}
      />
      
      {/* Filter Bar */}
      <TechTreeFilterBar />
    </div>
  )
}
