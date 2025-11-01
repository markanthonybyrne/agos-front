import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface GameState {
  currentTick: number | null
  nextTickETA: string | null
  tickIntervalSeconds: number | null // Store the tick interval (e.g., 300 for 5 minutes)
  isTickProcessing: boolean
}

const initialState: GameState = {
  currentTick: null,
  nextTickETA: null,
  tickIntervalSeconds: null,
  isTickProcessing: false,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setTick: (state, action: PayloadAction<{ tick: number; nextTickETA: string; tickIntervalSeconds?: number }>) => {
      state.currentTick = action.payload.tick
      state.nextTickETA = action.payload.nextTickETA
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

