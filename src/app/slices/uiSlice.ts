import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  activeModal: string | null
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload
    },
  },
})

export const { toggleSidebar, setSidebarOpen, setActiveModal } = uiSlice.actions
export default uiSlice.reducer

