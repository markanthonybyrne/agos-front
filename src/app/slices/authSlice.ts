import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User, Empire } from '@/types/api.types'

interface AuthState {
  user: User | null
  empire: Empire | null
  token: string | null
  isAuthenticated: boolean
  socialProviders: string[]
  socialProvidersLoaded: boolean
  verificationRequired: boolean
  pendingVerificationEmail: string | null
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const empireStr = localStorage.getItem('empire')
  const providersStr = localStorage.getItem('social_providers')
  
  let user = null
  let empire = null
  let socialProviders: string[] = []
  
  try {
    if (userStr) user = JSON.parse(userStr)
    if (empireStr) empire = JSON.parse(empireStr)
    if (providersStr) socialProviders = JSON.parse(providersStr)
  } catch (error) {
    console.error('Error parsing stored auth data:', error)
    // Clear invalid data
    localStorage.removeItem('user')
    localStorage.removeItem('empire')
    localStorage.removeItem('token')
    localStorage.removeItem('social_providers')
    socialProviders = []
  }
  
  return {
    user,
    empire,
    token,
    isAuthenticated: !!(token && user),
    socialProviders,
    socialProvidersLoaded: socialProviders.length > 0,
    verificationRequired: false,
    pendingVerificationEmail: null,
  }
}

const initialState: AuthState = getInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; empire: Empire; token: string }>) => {
      state.user = action.payload.user
      state.empire = action.payload.empire
      state.token = action.payload.token
      state.isAuthenticated = true
      state.verificationRequired = false
      state.pendingVerificationEmail = null
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('empire', JSON.stringify(action.payload.empire))
      // Set flag to indicate fresh login
      sessionStorage.setItem('auth_transition', 'true')
    },
    logout: (state) => {
      state.user = null
      state.empire = null
      state.token = null
      state.isAuthenticated = false
      state.socialProviders = []
      state.socialProvidersLoaded = false
      state.verificationRequired = false
      state.pendingVerificationEmail = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('empire')
      localStorage.removeItem('social_providers')
      // Clear universe map cache on logout
      localStorage.removeItem('universe_map_planets')
      localStorage.removeItem('universe_map_planets_timestamp')
      // Clear global planets cache
      localStorage.removeItem('global_planets_cache')
      localStorage.removeItem('global_planets_cache_timestamp')
      // Clear session flag so map data loads on next login
      sessionStorage.removeItem('planets_session_loaded')
    },
    updateEmpire: (state, action: PayloadAction<Empire>) => {
      state.empire = action.payload
      localStorage.setItem('empire', JSON.stringify(action.payload))
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    setSocialProviders: (state, action: PayloadAction<string[]>) => {
      state.socialProviders = action.payload
      state.socialProvidersLoaded = true
      localStorage.setItem('social_providers', JSON.stringify(action.payload))
    },
    clearSocialProviders: (state) => {
      state.socialProviders = []
      state.socialProvidersLoaded = false
      localStorage.removeItem('social_providers')
    },
    setVerificationPending: (state, action: PayloadAction<{ email?: string }>) => {
      state.verificationRequired = true
      state.pendingVerificationEmail = action.payload.email ?? null
      state.isAuthenticated = false
      state.user = null
      state.empire = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('empire')
    },
    clearVerificationPending: (state) => {
      state.verificationRequired = false
      state.pendingVerificationEmail = null
    },
  },
})

export const {
  setCredentials,
  logout,
  updateEmpire,
  updateUser,
  setSocialProviders,
  clearSocialProviders,
  setVerificationPending,
  clearVerificationPending,
} = authSlice.actions
export default authSlice.reducer

