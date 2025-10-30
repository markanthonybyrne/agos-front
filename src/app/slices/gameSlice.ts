import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface GameState {
  currentTick: number | null
  nextTickETA: string | null
  isTickProcessing: boolean
}

const initialState: GameState = {
  currentTick: null,
  nextTickETA: null,
  isTickProcessing: false,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setTick: (state, action: PayloadAction<{ tick: number; nextTickETA: string }>) => {
      state.currentTick = action.payload.tick
      state.nextTickETA = action.payload.nextTickETA
    },
    setTickProcessing: (state, action: PayloadAction<boolean>) => {
      state.isTickProcessing = action.payload
    },
  },
})

export const { setTick, setTickProcessing } = gameSlice.actions
export default gameSlice.reducer

