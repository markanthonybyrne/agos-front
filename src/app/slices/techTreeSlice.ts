import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  SpecializationType,
  TechNodeType,
  TechNodeData,
  TechNodeCosts,
} from '@/types/tech-tree.types'

export interface TechTreePlan {
  id: string
  name: string
  nodeIds: string[]
  createdAt: string
  updatedAt: string
}

export interface TechTreeState {
  selectedNodeId: string | null
  hoveredNodeId: string | null
  highlightedPath: string[]
  activeFilters: {
    eras: number[]
    specializations: SpecializationType[]
    searchQuery: string
    nodeTypes: TechNodeType[]
    showLocked: boolean
    showCompleted: boolean
  }
  viewMode: 'radial' | 'flat'
  showPathPreview: boolean
  activeEraColumn: number | null
  overlays: {
    dependencyHeatmap: boolean
    planetComparison: boolean
    empireProgress: boolean
    advisorHints: boolean
  }
  comparison: {
    planetIds: number[]
    focusNodes: string[]
  }
  savedPlans: TechTreePlan[]
  activePlanId: string | null
  empireSnapshot: {
    lastUpdated: number | null
    completedNodes: string[]
    queuedNodes: string[]
    inProgressNodes: string[]
    activeEra: number | null
    specializationsUnlocked: SpecializationType[]
  }
  analyticsCache: Record<
    string,
    {
      prerequisiteDepth: number
      unlockSummary: Partial<Record<TechNodeType, number>>
      prerequisiteCount: number
      totalCost: TechNodeCosts
    }
  >
}

const initialState: TechTreeState = {
  selectedNodeId: null,
  hoveredNodeId: null,
  highlightedPath: [],
  activeFilters: {
    eras: [],
    specializations: [],
    searchQuery: '',
    nodeTypes: [],
    showLocked: true,
    showCompleted: true,
  },
  viewMode: 'flat',
  showPathPreview: false,
  activeEraColumn: null,
  overlays: {
    dependencyHeatmap: false,
    planetComparison: false,
    empireProgress: false,
    advisorHints: true,
  },
  comparison: {
    planetIds: [],
    focusNodes: [],
  },
  savedPlans: [],
  activePlanId: null,
  empireSnapshot: {
    lastUpdated: null,
    completedNodes: [],
    queuedNodes: [],
    inProgressNodes: [],
    activeEra: null,
    specializationsUnlocked: [],
  },
  analyticsCache: {},
}

const techTreeSlice = createSlice({
  name: 'techTree',
  initialState,
  reducers: {
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload
    },
    setHoveredNode: (state, action: PayloadAction<string | null>) => {
      state.hoveredNodeId = action.payload
    },
    setHighlightedPath: (state, action: PayloadAction<string[]>) => {
      state.highlightedPath = action.payload
    },
    clearHighlightedPath: (state) => {
      state.highlightedPath = []
    },
    setFilters: (state, action: PayloadAction<Partial<TechTreeState['activeFilters']>>) => {
      state.activeFilters = {
        ...state.activeFilters,
        ...action.payload,
      }
    },
    setViewMode: (state, action: PayloadAction<'radial' | 'flat'>) => {
      state.viewMode = action.payload
    },
    setPathPreview: (state, action: PayloadAction<boolean>) => {
      state.showPathPreview = action.payload
    },
    setActiveEraColumn: (state, action: PayloadAction<number | null>) => {
      state.activeEraColumn = action.payload
    },
    toggleOverlay: (
      state,
      action: PayloadAction<{ overlay: keyof TechTreeState['overlays']; value?: boolean }>
    ) => {
      const { overlay, value } = action.payload
      state.overlays[overlay] = value ?? !state.overlays[overlay]
    },
    setComparisonPlanets: (state, action: PayloadAction<number[]>) => {
      state.comparison.planetIds = action.payload
    },
    setComparisonFocus: (state, action: PayloadAction<string[]>) => {
      state.comparison.focusNodes = action.payload
    },
    hydratePlans: (state, action: PayloadAction<TechTreePlan[]>) => {
      state.savedPlans = action.payload
    },
    addPlan: (state, action: PayloadAction<TechTreePlan>) => {
      state.savedPlans.push(action.payload)
      state.activePlanId = action.payload.id
    },
    updatePlan: (
      state,
      action: PayloadAction<{ id: string; name?: string; nodeIds?: string[] }>
    ) => {
      const plan = state.savedPlans.find((p) => p.id === action.payload.id)
      if (!plan) return
      if (action.payload.name !== undefined) {
        plan.name = action.payload.name
      }
      if (action.payload.nodeIds !== undefined) {
        plan.nodeIds = action.payload.nodeIds
      }
      plan.updatedAt = new Date().toISOString()
    },
    removePlan: (state, action: PayloadAction<string>) => {
      state.savedPlans = state.savedPlans.filter((plan) => plan.id !== action.payload)
      if (state.activePlanId === action.payload) {
        state.activePlanId = state.savedPlans[0]?.id ?? null
      }
    },
    setActivePlan: (state, action: PayloadAction<string | null>) => {
      state.activePlanId = action.payload
    },
    updateEmpireSnapshot: (
      state,
      action: PayloadAction<{
        completedNodes?: string[]
        queuedNodes?: string[]
        inProgressNodes?: string[]
        activeEra?: number
        specializationsUnlocked?: SpecializationType[]
      }>
    ) => {
      const now = Date.now()
      state.empireSnapshot.lastUpdated = now
      if (action.payload.completedNodes) {
        state.empireSnapshot.completedNodes = action.payload.completedNodes
      }
      if (action.payload.queuedNodes) {
        state.empireSnapshot.queuedNodes = action.payload.queuedNodes
      }
      if (action.payload.inProgressNodes) {
        state.empireSnapshot.inProgressNodes = action.payload.inProgressNodes
      }
      if (action.payload.activeEra !== undefined) {
        state.empireSnapshot.activeEra = action.payload.activeEra
      }
      if (action.payload.specializationsUnlocked) {
        state.empireSnapshot.specializationsUnlocked = action.payload.specializationsUnlocked
      }
    },
    cacheNodeAnalytics: (
      state,
      action: PayloadAction<{
        nodeId: string
        prerequisiteDepth: number
        prerequisiteCount: number
        unlockSummary: Partial<Record<TechNodeType, number>>
        totalCost: TechNodeCosts
      }>
    ) => {
      state.analyticsCache[action.payload.nodeId] = {
        prerequisiteDepth: action.payload.prerequisiteDepth,
        prerequisiteCount: action.payload.prerequisiteCount,
        unlockSummary: action.payload.unlockSummary,
        totalCost: action.payload.totalCost,
      }
    },
    resetView: (state) => {
      state.selectedNodeId = null
      state.hoveredNodeId = null
      state.highlightedPath = []
      state.activeFilters = initialState.activeFilters
      state.showPathPreview = false
      state.activeEraColumn = null
      state.comparison = initialState.comparison
      state.overlays = initialState.overlays
    },
  },
})

export const {
  selectNode,
  setHoveredNode,
  setHighlightedPath,
  clearHighlightedPath,
  setFilters,
  setViewMode,
  setPathPreview,
  setActiveEraColumn,
  toggleOverlay,
  setComparisonPlanets,
  setComparisonFocus,
  hydratePlans,
  addPlan,
  updatePlan,
  removePlan,
  setActivePlan,
  updateEmpireSnapshot,
  cacheNodeAnalytics,
  resetView,
} = techTreeSlice.actions

export default techTreeSlice.reducer
