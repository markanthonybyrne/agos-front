import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SecondaryResourceDelta } from '@/types/api.types'

interface GameState {
  currentTick: number | null
  nextTickETA: string | null
  nextTickAt: string | null // ISO 8601 timestamp (absolute) for tick countdown
  tickIntervalSeconds: number | null // Store the tick interval (e.g., 300 for 5 minutes)
  isTickProcessing: boolean
  secondaryResourceDelta: SecondaryResourceDelta | null
  secondaryResourceDeltaTick: number | null
}

const initialState: GameState = {
  currentTick: null,
  nextTickETA: null,
  nextTickAt: null,
  tickIntervalSeconds: null,
  isTickProcessing: false,
  secondaryResourceDelta: null,
  secondaryResourceDeltaTick: null,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setTick: (state, action: PayloadAction<{ tick: number; nextTickETA: string; nextTickAt?: string; tickIntervalSeconds?: number }>) => {
      state.currentTick = action.payload.tick
      state.nextTickETA = action.payload.nextTickETA
      if (action.payload.nextTickAt !== undefined) {
        state.nextTickAt = action.payload.nextTickAt
      } else {
        // Use nextTickETA as nextTickAt if not explicitly provided
        state.nextTickAt = action.payload.nextTickETA
      }
      if (action.payload.tickIntervalSeconds !== undefined) {
        state.tickIntervalSeconds = action.payload.tickIntervalSeconds
      }
    },
    setTickProcessing: (state, action: PayloadAction<boolean>) => {
      state.isTickProcessing = action.payload
    },
    setSecondaryResourceDelta: (
      state,
      action: PayloadAction<{ delta: SecondaryResourceDelta; tick?: number }>,
    ) => {
      state.secondaryResourceDelta = action.payload.delta
      state.secondaryResourceDeltaTick =
        action.payload.tick ?? state.currentTick ?? null
    },
    clearSecondaryResourceDelta: (state) => {
      state.secondaryResourceDelta = null
      state.secondaryResourceDeltaTick = null
    },
  },
})

export const {
  setTick,
  setTickProcessing,
  setSecondaryResourceDelta,
  clearSecondaryResourceDelta,
} = gameSlice.actions
export default gameSlice.reducer

