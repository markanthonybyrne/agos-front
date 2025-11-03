import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
      const panel: Panel = {
        id: `${type}-${Date.now()}`,
        type,
        size,
        state: PanelState.NORMAL,
        data,
        zIndex: state.nextZIndex++,
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
} = panelSlice.actions

export default panelSlice.reducer

