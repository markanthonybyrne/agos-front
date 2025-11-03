import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Planet } from '@/types/api.types'
import { logout } from './authSlice'

interface PlanetsState {
  allPlanets: Planet[]
  isLoading: boolean
  loadingProgress: number
  loadingPhase: 'initializing' | 'fetching' | 'processing' | 'complete' | null
  isLoaded: boolean
  lastLoadedAt: number | null
}

const CACHE_KEY = 'global_planets_cache'
const CACHE_TIMESTAMP_KEY = 'global_planets_cache_timestamp'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

const getInitialState = (): PlanetsState => {
  // Try to load from cache
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10)
      if (age < CACHE_EXPIRY) {
        const planets = JSON.parse(cached)
        return {
          allPlanets: planets,
          isLoading: false,
          loadingProgress: 100,
          loadingPhase: 'complete',
          isLoaded: true,
          lastLoadedAt: parseInt(timestamp, 10),
        }
      }
    }
  } catch (error) {
    console.error('Error loading cached planets:', error)
  }
  
  return {
    allPlanets: [],
    isLoading: false,
    loadingProgress: 0,
    loadingPhase: null,
    isLoaded: false,
    lastLoadedAt: null,
  }
}

const initialState: PlanetsState = getInitialState()

const planetsSlice = createSlice({
  name: 'planets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      if (!action.payload) {
        state.loadingProgress = 100
        state.loadingPhase = 'complete'
      }
    },
    setLoadingPhase: (state, action: PayloadAction<PlanetsState['loadingPhase']>) => {
      state.loadingPhase = action.payload
    },
    setLoadingProgress: (state, action: PayloadAction<number>) => {
      state.loadingProgress = Math.min(100, Math.max(0, action.payload))
    },
    setAllPlanets: (state, action: PayloadAction<Planet[]>) => {
      state.allPlanets = action.payload
      state.isLoaded = true
      state.lastLoadedAt = Date.now()
      state.isLoading = false
      state.loadingProgress = 100
      state.loadingPhase = 'complete'
      
      // Cache planets
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(action.payload))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
      } catch (error) {
        console.error('Error caching planets:', error)
      }
    },
    addPlanets: (state, action: PayloadAction<Planet[]>) => {
      const newPlanets = action.payload.filter(
        planet => !state.allPlanets.some(p => p.id === planet.id)
      )
      state.allPlanets = [...state.allPlanets, ...newPlanets]
    },
    clearPlanets: (state) => {
      state.allPlanets = []
      state.isLoaded = false
      state.lastLoadedAt = null
      state.loadingProgress = 0
      state.loadingPhase = null
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    },
  },
  extraReducers: (builder) => {
    // Listen for logout action to clear planets
    builder.addCase(logout, (state) => {
      state.allPlanets = []
      state.isLoaded = false
      state.lastLoadedAt = null
      state.loadingProgress = 0
      state.loadingPhase = null
      state.isLoading = false
    })
  },
})

export const {
  setLoading,
  setLoadingPhase,
  setLoadingProgress,
  setAllPlanets,
  addPlanets,
  clearPlanets,
} = planetsSlice.actions

export default planetsSlice.reducer

