import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SpecializationType, TechNodeType } from '@/types/tech-tree.types'

export interface TechTreeState {
  selectedNodeId: string | null
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
}

const initialState: TechTreeState = {
  selectedNodeId: null,
  highlightedPath: [],
  activeFilters: {
    eras: [],
    specializations: [],
    searchQuery: '',
    nodeTypes: [],
    showLocked: true,
    showCompleted: true,
  },
  viewMode: 'radial',
  showPathPreview: false,
}

const techTreeSlice = createSlice({
  name: 'techTree',
  initialState,
  reducers: {
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload
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
    resetView: (state) => {
      state.selectedNodeId = null
      state.highlightedPath = []
      state.activeFilters = initialState.activeFilters
      state.showPathPreview = false
    },
  },
})

export const {
  selectNode,
  setHighlightedPath,
  clearHighlightedPath,
  setFilters,
  setViewMode,
  setPathPreview,
  resetView,
} = techTreeSlice.actions

export default techTreeSlice.reducer
