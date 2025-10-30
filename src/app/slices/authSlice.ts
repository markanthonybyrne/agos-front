import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User, Empire } from '@/types/api.types'

interface AuthState {
  user: User | null
  empire: Empire | null
  token: string | null
  isAuthenticated: boolean
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const empireStr = localStorage.getItem('empire')
  
  let user = null
  let empire = null
  
  try {
    if (userStr) user = JSON.parse(userStr)
    if (empireStr) empire = JSON.parse(empireStr)
  } catch (error) {
    console.error('Error parsing stored auth data:', error)
    // Clear invalid data
    localStorage.removeItem('user')
    localStorage.removeItem('empire')
    localStorage.removeItem('token')
  }
  
  return {
    user,
    empire,
    token,
    isAuthenticated: !!(token && user),
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
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('empire', JSON.stringify(action.payload.empire))
    },
    logout: (state) => {
      state.user = null
      state.empire = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('empire')
    },
    updateEmpire: (state, action: PayloadAction<Empire>) => {
      state.empire = action.payload
    },
  },
})

export const { setCredentials, logout, updateEmpire } = authSlice.actions
export default authSlice.reducer

