import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  getDefaultWindowDimensions,
  getDefaultWindowPosition,
  getWindowPositionFromStorage,
  getWindowDimensionsFromStorage,
} from '@/lib/windowUtils'

export enum PanelType {
  TECH_TREE_FACILITIES = 'TECH_TREE_FACILITIES',
  TECH_TREE_SHIPS = 'TECH_TREE_SHIPS',
  TECH_TREE_DEFENSES = 'TECH_TREE_DEFENSES',
  TECH_TREE_RESEARCH = 'TECH_TREE_RESEARCH',
  BUILD_DETAIL = 'BUILD_DETAIL',
  FLEET_COMMAND = 'FLEET_COMMAND',
  VISUAL_COORDINATE = 'VISUAL_COORDINATE',
  SHIP_SELECTOR = 'SHIP_SELECTOR',
  RESEARCH_DETAIL = 'RESEARCH_DETAIL',
  PLANET_VIEW = 'PLANET_VIEW',
  CONSTRUCTION_QUEUE = 'CONSTRUCTION_QUEUE',
  GALAXY_MAP = 'GALAXY_MAP',
  MESSAGING = 'MESSAGING',
  NOTIFICATIONS = 'NOTIFICATIONS',
  RANKINGS = 'RANKINGS',
  SETTINGS = 'SETTINGS',
  POLITICS = 'POLITICS',
  CREATE_ALLIANCE_REQUEST = 'CREATE_ALLIANCE_REQUEST',
  MAP_PLANET_INFO = 'MAP_PLANET_INFO',
  QUANTUM_CREDITS = 'QUANTUM_CREDITS',
  BOOSTERS = 'BOOSTERS',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
  SIGNALS = 'SIGNALS',
  COMBAT_LOGS = 'COMBAT_LOGS',
  COMPOSE_MAIL = 'COMPOSE_MAIL',
  CHAT = 'CHAT',
  MARKET = 'MARKET',
  FLEETS = 'FLEETS',
  PLANET_INTERACTION = 'PLANET_INTERACTION',
  HOLOPAD = 'HOLOPAD',
}

export enum PanelSize {
  SMALL = 'SMALL',      // 400px
  MEDIUM = 'MEDIUM',    // 600px
  LARGE = 'LARGE',      // 800px
  XLARGE = 'XLARGE',    // 1000px
  FULL_HEIGHT = 'FULL_HEIGHT', // full width with margins
}

export enum PanelState {
  NORMAL = 'NORMAL',
  MINIMIZED = 'MINIMIZED',
}

export interface Panel {
  id: string
  type: PanelType
  size: PanelSize
  state: PanelState
  data?: any // Panel-specific data
  zIndex: number
  position?: { x: number; y: number } // Window position for desktop mode
  dimensions?: { width: number; height: number } // Window dimensions
  isMaximized?: boolean // Whether window is maximized
  savedPosition?: { x: number; y: number } // Saved position before maximize
  savedDimensions?: { width: number; height: number } // Saved dimensions before maximize
}

interface PanelSliceState {
  panels: Panel[]
  backdropVisible: boolean
  nextZIndex: number
}

const initialState: PanelSliceState = {
  panels: [],
  backdropVisible: false,
  nextZIndex: 100,
}

const panelSlice = createSlice({
  name: 'panel',
  initialState,
  reducers: {
    openPanel: (state, action: PayloadAction<{ type: PanelType; size?: PanelSize; data?: any }>) => {
      const { type, size = PanelSize.MEDIUM, data } = action.payload
      console.log('[panelSlice] openPanel called:', { type, data })
      
      const panelId = `${type}-${Date.now()}`
      const dimensions = getWindowDimensionsFromStorage(panelId) || getDefaultWindowDimensions(size)
      const position = getWindowPositionFromStorage(panelId) || getDefaultWindowPosition(
        dimensions,
        { x: (state.panels.length % 3) * 30, y: (state.panels.length % 3) * 30 }
      )
      
      const panel: Panel = {
        id: panelId,
        type,
        size,
        state: PanelState.NORMAL,
        data,
        zIndex: state.nextZIndex++,
        position,
        dimensions,
        isMaximized: false,
      }
      console.log('[panelSlice] Created panel:', panel)
      
      state.panels.push(panel)
      state.backdropVisible = true
    },
    
    closePanel: (state, action: PayloadAction<string>) => {
      const panelId = action.payload
      state.panels = state.panels.filter(p => p.id !== panelId)
      state.backdropVisible = state.panels.length > 0
    },
    
    closePanelsByType: (state, action: PayloadAction<PanelType>) => {
      const type = action.payload
      state.panels = state.panels.filter(p => p.type !== type)
      state.backdropVisible = state.panels.length > 0
    },
    
    closeAllPanels: (state) => {
      state.panels = []
      state.backdropVisible = false
    },
    
    minimizePanel: (state, action: PayloadAction<string>) => {
      const panel = state.panels.find(p => p.id === action.payload)
      if (panel) {
        panel.state = PanelState.MINIMIZED
      }
    },
    
    maximizePanel: (state, action: PayloadAction<string>) => {
      const panel = state.panels.find(p => p.id === action.payload)
      if (panel) {
        panel.state = PanelState.NORMAL
        if (panel.isMaximized) {
          // Restore position and size
          if (panel.savedPosition) {
            panel.position = panel.savedPosition
          }
          if (panel.savedDimensions) {
            panel.dimensions = panel.savedDimensions
          }
          panel.isMaximized = false
        } else {
          // Save current position and size, then maximize
          if (panel.position) {
            panel.savedPosition = { ...panel.position }
          }
          if (panel.dimensions) {
            panel.savedDimensions = { ...panel.dimensions }
          }
          panel.isMaximized = true
        }
      }
    },
    
    updatePanelPosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const { id, position } = action.payload
      const panel = state.panels.find(p => p.id === id)
      if (panel && !panel.isMaximized) {
        panel.position = position
      }
    },
    
    updatePanelDimensions: (state, action: PayloadAction<{ id: string; dimensions: { width: number; height: number } }>) => {
      const { id, dimensions } = action.payload
      const panel = state.panels.find(p => p.id === id)
      if (panel && !panel.isMaximized) {
        panel.dimensions = dimensions
      }
    },
    
    updatePanelData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const { id, data } = action.payload
      const panel = state.panels.find(p => p.id === id)
      if (panel) {
        panel.data = data
      }
    },
    
    bringToFront: (state, action: PayloadAction<string>) => {
      const panelId = action.payload
      const panel = state.panels.find(p => p.id === panelId)
      if (panel) {
        panel.zIndex = state.nextZIndex++
      }
    },
  },
})

export const {
  openPanel,
  closePanel,
  closePanelsByType,
  closeAllPanels,
  minimizePanel,
  maximizePanel,
  updatePanelData,
  bringToFront,
  updatePanelPosition,
  updatePanelDimensions,
} = panelSlice.actions

export default panelSlice.reducer

