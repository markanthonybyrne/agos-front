import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useGetTechTreeDefinitionsQuery } from '@/api/endpoints/empiresApi'
import {
  useCreateTechPlanMutation,
  useDeleteTechPlanMutation,
  useGetTechAdvisorStateQuery,
  useGetTechPlansQuery,
  useUpdateTechAdvisorStateMutation,
  useUpdateTechPlanNodesMutation,
} from '@/api/endpoints/techPlansApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  selectNode,
  setHighlightedPath,
  setFilters,
  setHoveredNode,
  toggleOverlay,
  setComparisonPlanets,
  hydratePlans,
  receivePlan,
  removePlan,
  setActivePlan,
  setAdvisorState,
  addPlan,
} from '@/app/slices/techTreeSlice'
import type { TechTreePlan, TechTreeState, TechAdvisorState } from '@/app/slices/techTreeSlice'
import { TechNodeData, TechNodeType, SpecializationType } from '@/types/tech-tree.types'
import { buildGraph, filterBySpecialization, filterByEra, filterByType, findPath } from '@/lib/graphEngine'
import { calculateHierarchicalLayout } from '@/lib/layoutAlgorithms'
import { TechTreeGraphData } from '@/types/tech-tree.types'
import { useTechNodeDetails } from '@/hooks/useTechNodeDetails'
import { useZoomPan } from '@/hooks/useZoomPan'
import { ConnectionsCanvas } from '@/components/tech-tree/ConnectionsCanvas'
import { NodesLayer } from '@/components/tech-tree/NodesLayer'
import { NodeDetailsPanel } from '@/components/tech-tree/NodeDetailsPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Sparkles, Layers, Map as MapIcon, Globe, Plus, Trash2, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useWindow } from '@/components/common/WindowManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { PlanetSelectorDialog } from '@/components/tech-tree/PlanetSelectorDialog'
import { SlidingPanel } from '@/components/common/SlidingPanel'
import { cn } from '@/lib/utils'

function mapPlanDtoToState(dto: TechPlanDto): TechTreePlan {
  return {
    id: dto.id,
    name: dto.name,
    nodeIds: Array.isArray(dto.node_ids) ? dto.node_ids : [],
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    notes: dto.notes ?? null,
    metadata: dto.metadata ?? null,
  }
}

function mapAdvisorDtoToState(dto: TechAdvisorStateDto): TechAdvisorState {
  return {
    currentFocusNodeId: dto.current_focus_node_id,
    dismissedSuggestions: dto.dismissed_suggestions.map((suggestion) => ({
      nodeId: suggestion.node_id,
      advisorId: suggestion.advisor_id ?? null,
      dismissedAt: suggestion.dismissed_at ?? null,
      pinnedAt: suggestion.pinned_at ?? null,
    })),
    pinnedSuggestions: dto.pinned_suggestions.map((suggestion) => ({
      nodeId: suggestion.node_id,
      advisorId: suggestion.advisor_id ?? null,
      dismissedAt: suggestion.dismissed_at ?? null,
      pinnedAt: suggestion.pinned_at ?? null,
    })),
    updatedAt: dto.updated_at ?? null,
    loaded: true,
  }
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') {
      return status
    }
  }
  return undefined
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (typeof data === 'string') {
      return data
    }
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as { message?: unknown; errors?: Record<string, unknown> }
      if (typeof dataObj.message === 'string') {
        return dataObj.message
      }
      if (dataObj.errors && typeof dataObj.errors === 'object') {
        for (const value of Object.values(dataObj.errors)) {
          if (Array.isArray(value) && value.length > 0) {
            const first = value[0]
            if (typeof first === 'string') {
              return first
            }
          } else if (typeof value === 'string') {
            return value
          }
        }
      }
    }
  }
  return null
}
import type { TechPlanDto, TechAdvisorStateDto } from '@/types/api.types'

function mapNodeTypeToBuildType(
  nodeType: TechNodeType
): 'facility' | 'ship' | 'defense' | 'research' | null {
  switch (nodeType) {
    case 'facility':
      return 'facility'
    case 'ship':
      return 'ship'
    case 'research':
      return 'research'
    case 'defence':
      return 'defense'
    default:
      return null
  }
}

export function TechTreeScreen() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { openPanel } = useWindow()
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [advisorNode, setAdvisorNode] = useState<TechNodeData | null>(null)
  const [pendingQueueNode, setPendingQueueNode] = useState<TechNodeData | null>(null)
  const [isPlanetSelectorOpen, setPlanetSelectorOpen] = useState(false)
  
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
  const { data: plansData, refetch: refetchPlans } = useGetTechPlansQuery()
  const { data: advisorApiState, refetch: refetchAdvisorState } = useGetTechAdvisorStateQuery()
  const [createTechPlan] = useCreateTechPlanMutation()
  const [updateTechPlanNodes] = useUpdateTechPlanNodesMutation()
  const [deleteTechPlan] = useDeleteTechPlanMutation()
  const [updateAdvisorStateMutation] = useUpdateTechAdvisorStateMutation()
  
  const {
    selectedNodeId,
    highlightedPath,
    activeFilters,
    overlays,
    comparison,
    savedPlans,
    activePlanId,
    advisorState,
  } = useAppSelector((state) => state.techTree)
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

  const openNodeForPlanet = useCallback(
    (node: TechNodeData, targetPlanetId: number) => {
      const buildType = mapNodeTypeToBuildType(node.type)
      if (!buildType) {
        toast.error(`Unsupported node type: ${node.type}`)
        return
      }

      if (!node.slug) {
        toast.error('Unable to queue item: missing identifier')
        return
      }

      openPanel(PanelType.BUILD_DETAIL, PanelSize.LARGE, {
        type: buildType,
        slug: node.slug,
        planetId: targetPlanetId,
      })
      closeDetails()
    },
    [closeDetails, openPanel]
  )

  const handleQueueAction = useCallback(
    (nodeId: string) => {
      const node = filteredNodes.find((n) => n.id === nodeId)
      if (!node) {
        toast.error('Unable to queue this item right now.')
        return
      }

      if (node.status === 'locked') {
        toast.error('This item is locked. Complete the prerequisites first.')
        return
      }

      if (node.status === 'completed' || node.status === 'researched') {
        toast.info('This item is already completed.')
        return
      }

      if (planetId) {
        openNodeForPlanet(node, planetId)
        return
      }

      setPendingQueueNode(node)
      setPlanetSelectorOpen(true)
    },
    [filteredNodes, planetId, openNodeForPlanet]
  )

  const handlePlanetSelect = useCallback(
    (selectedPlanetId: number) => {
      if (!pendingQueueNode) return
      openNodeForPlanet(pendingQueueNode, selectedPlanetId)
      setPendingQueueNode(null)
      setPlanetSelectorOpen(false)
    },
    [openNodeForPlanet, pendingQueueNode]
  )

  const handlePlanetDialogClose = useCallback(() => {
    setPlanetSelectorOpen(false)
    setPendingQueueNode(null)
  }, [])

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
  
  const updateAdvisorFocus = useCallback(
    async (nodeId: string | null) => {
      if (!nodeId || !advisorState.loaded) {
        return
      }
      if (advisorState.currentFocusNodeId === nodeId) {
        return
      }
      try {
        const payload: { current_focus_node_id: string; updated_at?: string } = {
          current_focus_node_id: nodeId,
        }
        if (advisorState.updatedAt) {
          payload.updated_at = advisorState.updatedAt
        }
        const response = await updateAdvisorStateMutation(payload).unwrap()
        dispatch(setAdvisorState(mapAdvisorDtoToState(response)))
      } catch (error) {
        const status = getErrorStatus(error)
        if (status === 409) {
          toast.warning('Advisor state changed elsewhere. Refreshing.')
          refetchAdvisorState()
          return
        }
        const message = extractErrorMessage(error)
        if (message) {
          toast.error(message)
        }
        console.error('Failed to update advisor focus:', error)
      }
    },
    [advisorState, updateAdvisorStateMutation, dispatch, refetchAdvisorState]
  )

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const node = graphData?.nodes.find((n) => n.id === nodeId)
      if (node) {
        dispatch(selectNode(nodeId))
        setAdvisorNode(node)
        openDetails(node)
        updateAdvisorFocus(node.id)
      }
    },
    [graphData, dispatch, openDetails, updateAdvisorFocus]
  )
  
  // Handle node hover (show path preview)
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      if (!nodeId || !graphData) {
        dispatch(setHighlightedPath([]))
        dispatch(setHoveredNode(null))
        return
      }
      
      const node = graphData.nodes.find((n) => n.id === nodeId)
      if (node && node.status === 'locked') {
        const path = findPath(graphData, nodeId)
        dispatch(setHighlightedPath(path.nodes))
      } else {
        dispatch(setHighlightedPath([]))
      }
      dispatch(setHoveredNode(nodeId))
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
      const viewportCenterX = window.innerWidth / 2
      const topInset = 120

      const targetPanX = viewportCenterX - centerX * zoomPan.scale
      const targetPanY = topInset - nodeBounds.minY * zoomPan.scale

      // Set zoom and pan to position the tree
      // Use a small delay to ensure this runs after any reset from useZoomPan
      setTimeout(() => {
        zoomPan.setZoomAndPan(zoomPan.scale, targetPanX, targetPanY)
      }, 0)
      
      lastBoundsRef.current = { width: nodeBounds.width, height: nodeBounds.height }
    }
  }, [filteredNodes, nodeBounds, zoomPan])

  const completedNodeSet = useMemo(
    () => new Set(graphData?.empireState.completed_nodes ?? []),
    [graphData?.empireState.completed_nodes]
  )
  const queuedNodeSet = useMemo(
    () => new Set(graphData?.empireState.queued_nodes ?? []),
    [graphData?.empireState.queued_nodes]
  )
  const inProgressNodeSet = useMemo(
    () => new Set(graphData?.empireState.in_progress_nodes ?? []),
    [graphData?.empireState.in_progress_nodes]
  )

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
      zoomPan.zoomIn()
    }, 100)
  }, [graphData, zoomPan])
  
  const handleToggleNodeType = useCallback(
    (type: TechNodeType) => {
      const current = activeFilters.nodeTypes
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
      dispatch(setFilters({ nodeTypes: next }))
    },
    [dispatch, activeFilters.nodeTypes]
  )

  const handleToggleEra = useCallback(
    (era: number) => {
      const current = activeFilters.eras
      const next = current.includes(era) ? current.filter((e) => e !== era) : [...current, era]
      dispatch(setFilters({ eras: next }))
    },
    [dispatch, activeFilters.eras]
  )

  const handleToggleSpecialization = useCallback(
    (spec: SpecializationType) => {
      const current = activeFilters.specializations
      const next = current.includes(spec)
        ? current.filter((s) => s !== spec)
        : [...current, spec]
      dispatch(setFilters({ specializations: next }))
    },
    [dispatch, activeFilters.specializations]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      dispatch(setFilters({ searchQuery: value }))
    },
    [dispatch]
  )

  const handleClearSearch = useCallback(() => {
    dispatch(setFilters({ searchQuery: '' }))
  }, [dispatch])

  const handleToggleShowLocked = useCallback(() => {
    dispatch(setFilters({ showLocked: !activeFilters.showLocked }))
  }, [dispatch, activeFilters.showLocked])

  const handleToggleShowCompleted = useCallback(() => {
    dispatch(setFilters({ showCompleted: !activeFilters.showCompleted }))
  }, [dispatch, activeFilters.showCompleted])

  const handleClearAllFilters = useCallback(() => {
    dispatch(
      setFilters({
        nodeTypes: [],
        eras: [],
        specializations: [],
        searchQuery: '',
        showLocked: true,
        showCompleted: true,
      })
    )
  }, [dispatch])

  const handleToggleOverlay = useCallback(
    (overlay: 'dependencyHeatmap' | 'planetComparison' | 'empireProgress' | 'advisorHints') => {
      dispatch(toggleOverlay({ overlay }))
    },
    [dispatch]
  )

  const handleSetComparisonPlanets = useCallback(
    (planetIds: number[]) => {
      dispatch(setComparisonPlanets(planetIds))
    },
    [dispatch]
  )

  const generatePlanName = useCallback(() => {
    const baseName = 'Untitled Plan'
    if (!savedPlans.some((plan) => plan.name === baseName)) {
      return baseName
    }
    let suffix = 2
    while (savedPlans.some((plan) => plan.name === `${baseName} ${suffix}`)) {
      suffix += 1
    }
    return `${baseName} ${suffix}`
  }, [savedPlans])

  const handleCreatePlan = useCallback(() => {
    const timestamp = new Date().toISOString()
    const localPlan: TechTreePlan = {
      id: `temp-${Date.now()}`,
      name: generatePlanName(),
      nodeIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: {
        local: true,
      },
    }
    dispatch(addPlan(localPlan))
    dispatch(setActivePlan(localPlan.id))
    toast.success('Draft plan created. Add a tech node to save it.')
  }, [dispatch, generatePlanName])

  const handleRemovePlan = useCallback(
    async (planId: string) => {
      const plan = savedPlans.find((p) => p.id === planId)
      if (!plan) {
        toast.error('Unable to find the selected plan.')
        return
      }

      if ((plan.metadata as any)?.local) {
        dispatch(removePlan(planId))
        toast.success('Draft plan discarded.')
        return
      }

      try {
        await deleteTechPlan({ id: planId, updated_at: plan.updatedAt }).unwrap()
        dispatch(removePlan(planId))
        toast.success('Plan removed.')
      } catch (error) {
        const status = getErrorStatus(error)
        if (status === 409) {
          toast.warning('Plan was updated elsewhere. Refreshing latest data.')
          refetchPlans()
          return
        }
        const message = extractErrorMessage(error)
        toast.error(message ?? 'Unable to remove this plan right now.')
        console.error('Failed to delete tech plan:', error)
      }
    },
    [savedPlans, deleteTechPlan, dispatch, refetchPlans]
  )

  const handleSetActivePlan = useCallback(
    (planId: string | null) => {
      dispatch(setActivePlan(planId))
    },
    [dispatch]
  )

  const normalizedPlans = useMemo(() => {
    if (!plansData) return []
    if (Array.isArray(plansData)) {
      return plansData
    }
    if (typeof plansData === 'object' && plansData !== null) {
      const maybePlans = (plansData as { plans?: unknown }).plans
      if (Array.isArray(maybePlans)) {
        return maybePlans as TechPlanDto[]
      }
    }
    console.warn('[TechTree] Unexpected tech plan payload shape:', plansData)
    return []
  }, [plansData])

  useEffect(() => {
    dispatch(hydratePlans(normalizedPlans.map(mapPlanDtoToState)))
  }, [normalizedPlans, dispatch])

  useEffect(() => {
    if (advisorApiState) {
      dispatch(setAdvisorState(mapAdvisorDtoToState(advisorApiState)))
    }
  }, [advisorApiState, dispatch])

  useEffect(() => {
    if (advisorApiState?.current_focus_node_id && graphData) {
      const focusNode = graphData.nodes.find((node) => node.id === advisorApiState.current_focus_node_id)
      if (focusNode) {
        setAdvisorNode(focusNode)
      }
    }
  }, [advisorApiState?.current_focus_node_id, graphData])

  const handleAddNodeToPlan = useCallback(
    async (nodeId: string) => {
      if (!activePlanId) {
        toast.info('Select or create a plan to store this node.')
        return
      }
      const plan = savedPlans.find((p) => p.id === activePlanId)
      if (!plan) {
        toast.info('Select a valid plan to continue.')
        return
      }
      if (plan.nodeIds.includes(nodeId)) {
        toast.info('This node is already present in the active plan.')
        return
      }

      const isLocalPlan = Boolean((plan.metadata as any)?.local)

      try {
        if (isLocalPlan) {
          const response = await createTechPlan({
            name: plan.name,
            node_ids: [...plan.nodeIds, nodeId],
          }).unwrap()
          dispatch(removePlan(plan.id))
          dispatch(receivePlan(mapPlanDtoToState(response)))
          dispatch(setActivePlan(response.id))
          toast.success('Plan saved and node added.')
        } else {
          const response = await updateTechPlanNodes({
            id: plan.id,
            node_ids: [...plan.nodeIds, nodeId],
            updated_at: plan.updatedAt,
          }).unwrap()
          dispatch(receivePlan(mapPlanDtoToState(response)))
          toast.success('Node added to active plan.')
        }
      } catch (error) {
        const status = getErrorStatus(error)
        if (status === 409) {
          toast.warning('Plan was updated elsewhere. Refreshing latest data.')
          refetchPlans()
          return
        }
        const message = extractErrorMessage(error)
        toast.error(message ?? 'Unable to add this node to the plan right now.')
        console.error('Failed to update plan nodes:', error)
      }
    },
    [activePlanId, savedPlans, createTechPlan, updateTechPlanNodes, dispatch, refetchPlans]
  )
  
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
        setAdvisorNode(node)
        updateAdvisorFocus(node.id)
      }
    } else if (!selectedNodeId) {
      closeDetails()
    }
  }, [selectedNodeId, graphData, openDetails, closeDetails, updateAdvisorFocus])
  
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
    <div className="relative flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(26,37,63,0.45),rgba(10,14,23,0.95))] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[url('/assets/images/sections/starfield-noise.png')] opacity-20 mix-blend-screen" />

      <StrategySidebar
        filters={activeFilters}
        overlays={overlays}
        savedPlans={savedPlans}
        activePlanId={activePlanId}
        comparison={comparison}
        className="hidden xl:flex"
        onToggleNodeType={handleToggleNodeType}
        onToggleEra={handleToggleEra}
        onToggleSpecialization={handleToggleSpecialization}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onToggleShowLocked={handleToggleShowLocked}
        onToggleShowCompleted={handleToggleShowCompleted}
        onClearAllFilters={handleClearAllFilters}
        onToggleOverlay={handleToggleOverlay}
        onCreatePlan={handleCreatePlan}
        onRemovePlan={handleRemovePlan}
        onSelectPlan={handleSetActivePlan}
        onSetComparisonPlanets={handleSetComparisonPlanets}
      />

      <main className="relative flex-1 overflow-hidden">
        <TopStatusBar
          graphData={graphData}
          overlays={overlays}
          comparison={comparison}
          onToggleOverlay={handleToggleOverlay}
          onOpenFilters={() => setMobileSidebarOpen(true)}
        />

    <div 
      ref={zoomPan.containerRef}
          className="relative h-[calc(100%-92px)] w-full overflow-hidden"
      onMouseDown={zoomPan.onMouseDown}
      onMouseMove={zoomPan.onMouseMove}
      onMouseUp={zoomPan.onMouseUp}
      onWheel={zoomPan.onWheel}
    >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10" />
      
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
          <ConnectionsCanvas
            nodes={filteredNodes}
            edges={graphData.edges}
            highlightedPath={highlightedPath}
            viewport={actualViewport}
            panX={zoomPan.panX}
            panY={zoomPan.panY}
            zoom={zoomPan.scale}
          />
        
          <NodesLayer
            nodes={filteredNodes}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            viewport={actualViewport}
            panX={zoomPan.panX}
            panY={zoomPan.panY}
            zoom={zoomPan.scale}
            highlightedNodes={highlightedPath}
            showHeatmap={overlays.dependencyHeatmap}
            showEmpireProgress={overlays.empireProgress}
            showComparison={overlays.planetComparison}
            comparisonPlanetCount={comparison.planetIds.length}
            completedNodes={completedNodeSet}
            queuedNodes={queuedNodeSet}
            inProgressNodes={inProgressNodeSet}
          />
      </div>
      
          {selectedNode && (
      <NodeDetailsPanel
        node={selectedNode}
        planetId={planetId}
        graphData={graphData}
        onClose={() => {
          dispatch(selectNode(null))
          closeDetails()
        }}
              onQueue={handleQueueAction}
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
              onAddToPlan={handleAddNodeToPlan}
      />
          )}
        </div>

        <TechFooterBar
          comparison={comparison}
          overlays={overlays}
          onToggleOverlay={handleToggleOverlay}
          onSetComparisonPlanets={handleSetComparisonPlanets}
        />
      </main>

      <AdvisorDrawer
        isOpen={overlays.advisorHints}
        onToggle={() => handleToggleOverlay('advisorHints')}
        selectedNode={advisorNode}
        graphData={graphData}
      />

      <SlidingPanel
        isOpen={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title="Tech Encyclopaedia Filters"
        size={PanelSize.MEDIUM}
        className="xl:hidden"
      >
        <div className="h-full overflow-y-auto">
          <StrategySidebar
            filters={activeFilters}
            overlays={overlays}
            savedPlans={savedPlans}
            activePlanId={activePlanId}
            comparison={comparison}
            className="w-full border-none bg-transparent shadow-none"
            onToggleNodeType={handleToggleNodeType}
            onToggleEra={handleToggleEra}
            onToggleSpecialization={handleToggleSpecialization}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onToggleShowLocked={handleToggleShowLocked}
            onToggleShowCompleted={handleToggleShowCompleted}
            onClearAllFilters={handleClearAllFilters}
            onToggleOverlay={handleToggleOverlay}
            onCreatePlan={handleCreatePlan}
            onRemovePlan={handleRemovePlan}
            onSelectPlan={handleSetActivePlan}
            onSetComparisonPlanets={handleSetComparisonPlanets}
          />
        </div>
      </SlidingPanel>

      <PlanetSelectorDialog
        open={isPlanetSelectorOpen}
        onClose={handlePlanetDialogClose}
        onSelect={handlePlanetSelect}
        requiredType={(pendingQueueNode?.type ?? 'facility') as 'facility' | 'ship' | 'defence' | 'research'}
        nodeName={pendingQueueNode?.name ?? 'Selected item'}
      />
    </div>
  )
}

interface StrategySidebarProps {
  filters: TechTreeState['activeFilters']
  overlays: TechTreeState['overlays']
  comparison: TechTreeState['comparison']
  savedPlans: TechTreePlan[]
  activePlanId: string | null
  className?: string
  onToggleNodeType: (type: TechNodeType) => void
  onToggleEra: (era: number) => void
  onToggleSpecialization: (spec: SpecializationType) => void
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onToggleShowLocked: () => void
  onToggleShowCompleted: () => void
  onClearAllFilters: () => void
  onToggleOverlay: (overlay: 'dependencyHeatmap' | 'planetComparison' | 'empireProgress' | 'advisorHints') => void
  onCreatePlan: () => void | Promise<void>
  onRemovePlan: (planId: string) => void | Promise<void>
  onSelectPlan: (planId: string | null) => void
  onSetComparisonPlanets: (planetIds: number[]) => void
}

const NODE_TYPE_FILTERS: { value: TechNodeType; label: string }[] = [
  { value: 'facility', label: 'Facilities' },
  { value: 'research', label: 'Research' },
  { value: 'ship', label: 'Ships' },
  { value: 'defence', label: 'Defences' },
]

const ERA_FILTERS = [1, 2, 3, 4, 5]

const SPECIALIZATION_FILTERS: { value: SpecializationType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'military', label: 'Military' },
  { value: 'relic', label: 'Relic' },
]

function StrategySidebar({
  filters,
  overlays,
  savedPlans,
  activePlanId,
  comparison,
  className,
  onToggleNodeType,
  onToggleEra,
  onToggleSpecialization,
  onSearchChange,
  onClearSearch,
  onToggleShowLocked,
  onToggleShowCompleted,
  onClearAllFilters,
  onToggleOverlay,
  onCreatePlan,
  onRemovePlan,
  onSelectPlan,
  onSetComparisonPlanets,
}: StrategySidebarProps) {
  return (
    <aside
      className={cn(
        'relative z-10 flex h-full w-[320px] flex-col border-r border-white/10 bg-[rgba(6,11,23,0.82)]/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(2,12,34,0.75)]',
        className
      )}
    >
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="text-xs uppercase tracking-[0.5em] text-cyan-300">Tech Encyclopaedia</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plan your empire’s next breakthrough.</p>
      </div>
      <ScrollArea className="flex-1 px-6 py-6">
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Filters</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearAllFilters}>
              Clear
            </Button>
          </header>
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Search</span>
              <div className="relative">
                <Input
                  value={filters.searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Find tech, facilities, ships..."
                  className="pl-3 pr-10 bg-white/5 border-white/10 focus:border-cyan-400/60"
                />
                {filters.searchQuery && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={onClearSearch}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <FilterGroup
              title="Node Type"
              options={NODE_TYPE_FILTERS}
              isSelected={(value) => filters.nodeTypes.includes(value)}
              onToggle={onToggleNodeType}
            />
            <FilterGroup
              title="Era"
              options={ERA_FILTERS.map((era) => ({ value: era, label: `Era ${era}` }))}
              isSelected={(value) => filters.eras.includes(value)}
              onToggle={onToggleEra}
            />
            <FilterGroup
              title="Specialization"
              options={SPECIALIZATION_FILTERS}
              isSelected={(value) => filters.specializations.includes(value)}
              onToggle={onToggleSpecialization}
            />
            <div className="flex gap-2">
              <Button
                variant={filters.showLocked ? 'default' : 'outline'}
                size="sm"
                className="h-7 flex-1 text-xs uppercase tracking-[0.3em]"
                onClick={onToggleShowLocked}
              >
                Locked
              </Button>
              <Button
                variant={filters.showCompleted ? 'default' : 'outline'}
                size="sm"
                className="h-7 flex-1 text-xs uppercase tracking-[0.3em]"
                onClick={onToggleShowCompleted}
              >
                Completed
              </Button>
            </div>
          </div>
        </section>

        <Separator className="my-6 border-white/10" />

        <section className="space-y-3">
          <header className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <h3 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Overlays</h3>
          </header>
          <div className="grid gap-2">
            <OverlayToggle
              label="Dependency Heatmap"
              active={overlays.dependencyHeatmap}
              onToggle={() => onToggleOverlay('dependencyHeatmap')}
            />
            <OverlayToggle
              label="Planet Comparison"
              active={overlays.planetComparison}
              badge={comparison.planetIds.length > 0 ? `${comparison.planetIds.length}` : undefined}
              onToggle={() => onToggleOverlay('planetComparison')}
            />
            <OverlayToggle
              label="Empire Progress"
              active={overlays.empireProgress}
              onToggle={() => onToggleOverlay('empireProgress')}
            />
            <OverlayToggle
              label="Advisor Hints"
              active={overlays.advisorHints}
              onToggle={() => onToggleOverlay('advisorHints')}
            />
          </div>
        </section>

        <Separator className="my-6 border-white/10" />

        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-300" />
              <h3 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Saved Plans</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreatePlan}>
              <Plus className="h-4 w-4" />
            </Button>
          </header>
          <div className="space-y-2">
            {savedPlans.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">
                Draft research roadmaps and revisit them anytime. Create your first plan to begin.
              </p>
            ) : (
              savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-cyan-400/40',
                    activePlanId === plan.id && 'border-cyan-400/60 bg-cyan-500/10'
                  )}
                >
                  <button
                    className="flex flex-col text-left"
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                      {plan.nodeIds.length} nodes
                    </span>
                  </button>
                  <button
                    className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    onClick={() => onRemovePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <Separator className="my-6 border-white/10" />

        <section className="space-y-3">
          <header className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-300" />
            <h3 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Comparison Scope</h3>
          </header>
          <p className="text-xs text-muted-foreground/80">
            Select planets to compare eligibility. Upcoming overlay will show readiness badges on each tech node.
          </p>
          <div className="flex flex-wrap gap-2">
            {comparison.planetIds.length === 0 ? (
              <Badge variant="outline" className="border-white/20 text-muted-foreground">
                No planets selected
              </Badge>
            ) : (
              comparison.planetIds.map((id) => (
                <Badge key={id} variant="secondary" className="bg-cyan-500/10 text-cyan-200">
                  Planet #{id}
                </Badge>
              ))
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-white/20 text-xs uppercase tracking-[0.3em]"
            onClick={() => onSetComparisonPlanets([])}
          >
            Reset Selection
          </Button>
        </section>
      </ScrollArea>
    </aside>
  )
}

interface FilterGroupProps<T> {
  title: string
  options: { value: T; label: string }[]
  isSelected: (value: T) => boolean
  onToggle: (value: T) => void
}

function FilterGroup<T extends string | number>({
  title,
  options,
  isSelected,
  onToggle,
}: FilterGroupProps<T>) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.label}
            variant={isSelected(option.value) ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 rounded-full px-3 text-xs uppercase tracking-[0.25em]',
              isSelected(option.value)
                ? 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                : 'border-white/15 text-muted-foreground hover:border-cyan-400/40'
            )}
            onClick={() => onToggle(option.value)}
            type="button"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface OverlayToggleProps {
  label: string
  active: boolean
  badge?: string
  onToggle: () => void
}

function OverlayToggle({ label, active, badge, onToggle }: OverlayToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center justify-between rounded-xl border px-3 py-2 text-left transition',
        active
          ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(8,170,255,0.25)]'
          : 'border-white/15 bg-white/5 text-muted-foreground hover:border-cyan-400/40 hover:text-cyan-100'
      )}
      type="button"
    >
      <span className="text-xs uppercase tracking-[0.35em]">{label}</span>
      {badge && <Badge variant="outline" className="border-cyan-400/40 text-cyan-200">{badge}</Badge>}
    </button>
  )
}

interface TopStatusBarProps {
  graphData: TechTreeGraphData
  overlays: TechTreeState['overlays']
  comparison: TechTreeState['comparison']
  onToggleOverlay: (overlay: 'dependencyHeatmap' | 'planetComparison' | 'empireProgress' | 'advisorHints') => void
  onOpenFilters: () => void
}

function TopStatusBar({ graphData, overlays, comparison, onToggleOverlay, onOpenFilters }: TopStatusBarProps) {
  const era = graphData.empireState.active_era ?? 1
  const specializations = graphData.empireState.specializations_unlocked ?? []
  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-[rgba(5,12,24,0.85)] px-8 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Active Era</p>
          <h2 className="text-lg font-semibold text-cyan-100">Era {era}</h2>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Specializations</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {specializations.length === 0 ? (
              <Badge variant="outline" className="border-white/20 text-muted-foreground">
                None unlocked
              </Badge>
            ) : (
              specializations.map((spec) => (
                <Badge key={spec} variant="secondary" className="bg-white/10 text-white/80">
                  {spec}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="xl:hidden"
          onClick={onOpenFilters}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button
          variant={overlays.planetComparison ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => onToggleOverlay('planetComparison')}
        >
          <MapIcon className="h-4 w-4" />
          Compare Planets
          {comparison.planetIds.length > 0 && (
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-100">
              {comparison.planetIds.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={overlays.dependencyHeatmap ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
          onClick={() => onToggleOverlay('dependencyHeatmap')}
        >
          <Filter className="h-4 w-4" />
          Heatmap
        </Button>
        {(overlays.dependencyHeatmap || overlays.empireProgress || overlays.planetComparison) && (
          <div className="flex items-center gap-2">
            {overlays.dependencyHeatmap && (
              <Badge variant="outline" className="border-cyan-400/40 bg-cyan-500/10 text-cyan-100">
                Heatmap
              </Badge>
            )}
            {overlays.empireProgress && (
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                Progress
              </Badge>
            )}
            {overlays.planetComparison && (
              <Badge variant="outline" className="border-purple-400/40 bg-purple-500/10 text-purple-100">
                Planet Overlay
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface TechFooterBarProps {
  comparison: TechTreeState['comparison']
  overlays: TechTreeState['overlays']
  onToggleOverlay: (overlay: 'dependencyHeatmap' | 'planetComparison' | 'empireProgress' | 'advisorHints') => void
  onSetComparisonPlanets: (planetIds: number[]) => void
}

function TechFooterBar({ comparison, overlays, onToggleOverlay, onSetComparisonPlanets }: TechFooterBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 bg-[rgba(6,11,23,0.85)] px-8 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Comparison Mode</span>
        {comparison.planetIds.length === 0 ? (
          <Badge variant="outline" className="border-white/20 text-muted-foreground">
            Select planets via overlays
          </Badge>
        ) : (
          comparison.planetIds.map((planetId) => (
            <Badge key={planetId} variant="secondary" className="bg-cyan-500/10 text-cyan-100">
              Planet #{planetId}
            </Badge>
          ))
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant={overlays.empireProgress ? 'default' : 'outline'}
          size="sm"
          onClick={() => onToggleOverlay('empireProgress')}
        >
          Empire Progress
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSetComparisonPlanets([])}>
          Reset Planets
        </Button>
      </div>
    </div>
  )
}

interface AdvisorDrawerProps {
  isOpen: boolean
  onToggle: () => void
  selectedNode: TechNodeData | null
  graphData: TechTreeGraphData
}

function AdvisorDrawer({ isOpen, onToggle, selectedNode, graphData }: AdvisorDrawerProps) {
  return (
    <aside
      className={cn(
        'relative z-20 flex h-full w-[340px] flex-col border-l border-white/10 bg-[rgba(5,12,24,0.88)] backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.55)] transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Advisor</p>
          <h3 className="text-sm font-semibold text-cyan-200">Strategic Guidance</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs" onClick={onToggle}>
          {isOpen ? 'Hide' : 'Show'}
        </Button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <section>
          <h4 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Current Focus</h4>
          {selectedNode ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-foreground">{selectedNode.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedNode.description || 'Deep-dive analysis coming soon.'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground/80">
              Select a node to receive tailored strategic advice and recommended build orders.
            </p>
          )}
        </section>
        <section>
          <h4 className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Empire Snapshot</h4>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground/80">
            <p>Completed nodes: {graphData.empireState.completed_nodes.length}</p>
            <p>Queued nodes: {graphData.empireState.queued_nodes.length}</p>
          </div>
        </section>
      </div>
    </aside>
  )
}
