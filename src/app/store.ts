import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../api/apiSlice'
import authReducer from './slices/authSlice'
import gameReducer from './slices/gameSlice'
import uiReducer from './slices/uiSlice'
import notificationReducer from './slices/notificationSlice'
import panelReducer from './slices/panelSlice'
import chatReducer from './slices/chatSlice'
import planetsReducer from './slices/planetsSlice'
import cameraReducer from './slices/cameraSlice'
import techTreeReducer from './slices/techTreeSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    game: gameReducer,
    ui: uiReducer,
    notifications: notificationReducer,
    panel: panelReducer,
    techTree: techTreeReducer,
    chat: chatReducer,
    planets: planetsReducer,
    camera: cameraReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

