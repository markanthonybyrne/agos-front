import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface GameState {
  currentTick: number | null
  nextTickETA: string | null
  nextTickAt: string | null // ISO 8601 timestamp (absolute) for tick countdown
  tickIntervalSeconds: number | null // Store the tick interval (e.g., 300 for 5 minutes)
  isTickProcessing: boolean
}

const initialState: GameState = {
  currentTick: null,
  nextTickETA: null,
  nextTickAt: null,
  tickIntervalSeconds: null,
  isTickProcessing: false,
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
  },
})

export const { setTick, setTickProcessing } = gameSlice.actions
export default gameSlice.reducer

