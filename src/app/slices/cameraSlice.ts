import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CameraState {
  normalizedZoom: number  // 0.0 (Universe) to 1.0 (System)
  cameraX: number         // Pan offset in grid coordinates
  cameraY: number
  targetCoordinate: string | null  // Active coordinate search target
  isTransitioning: boolean
  renderScale: number      // Mapped from normalizedZoom (0.01-7.0)
}

const initialState: CameraState = {
  normalizedZoom: 0.05,  // Start at sector level
  cameraX: 0,
  cameraY: 0,
  targetCoordinate: null,
  isTransitioning: false,
  renderScale: 0.05
}

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setNormalizedZoom: (state, action: PayloadAction<number>) => {
      state.normalizedZoom = Math.max(0, Math.min(1, action.payload))
      // Update render scale based on normalized zoom
      state.renderScale = 0.01 + (state.normalizedZoom * (7.0 - 0.01))
    },
    setCameraPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.cameraX = action.payload.x
      state.cameraY = action.payload.y
    },
    setTargetCoordinate: (state, action: PayloadAction<string | null>) => {
      state.targetCoordinate = action.payload
    },
    setIsTransitioning: (state, action: PayloadAction<boolean>) => {
      state.isTransitioning = action.payload
    },
    transitionToCoordinate: (
      state, 
      action: PayloadAction<{ 
        normalizedZoom: number
        cameraX: number
        cameraY: number
        targetCoordinate: string | null
      }>
    ) => {
      state.normalizedZoom = action.payload.normalizedZoom
      state.cameraX = action.payload.cameraX
      state.cameraY = action.payload.cameraY
      state.targetCoordinate = action.payload.targetCoordinate
      state.isTransitioning = true
      state.renderScale = 0.01 + (state.normalizedZoom * (7.0 - 0.01))
    },
    transitionComplete: (state) => {
      state.isTransitioning = false
    },
    reset: (state) => {
      return initialState
    }
  }
})

export const {
  setNormalizedZoom,
  setCameraPosition,
  setTargetCoordinate,
  setIsTransitioning,
  transitionToCoordinate,
  transitionComplete,
  reset
} = cameraSlice.actions

export default cameraSlice.reducer

