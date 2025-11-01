import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OnlineUser } from '@/types/api.types'

interface ChatState {
  activeChannelSlug: string | null
  typingUsers: Record<string, Set<number>> // channelSlug -> Set<empireId>
  onlineUsers: Record<string, OnlineUser[]> // channelSlug -> OnlineUser[]
  rateLimitCooldowns: Record<string, number> // channelSlug -> timestamp (ms) when cooldown expires
  lastMessageIds: Record<string, number | null> // channelSlug -> last message ID for pagination
}

const initialState: ChatState = {
  activeChannelSlug: null,
  typingUsers: {},
  onlineUsers: {},
  rateLimitCooldowns: {},
  lastMessageIds: {},
}

// Helper functions to work with Sets in Redux (which doesn't support Set directly)
const updateTypingUserInState = (state: ChatState, channelSlug: string, empireId: number, isTyping: boolean) => {
  if (!state.typingUsers[channelSlug]) {
    state.typingUsers[channelSlug] = {} as any
  }
  const typingSet = state.typingUsers[channelSlug] as any
  if (isTyping) {
    typingSet[empireId] = true
  } else {
    delete typingSet[empireId]
  }
}

const getTypingUsersArray = (typingUsers: Record<string, any>, channelSlug: string): number[] => {
  if (!typingUsers[channelSlug]) return []
  return Object.keys(typingUsers[channelSlug] || {}).map(id => Number(id))
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<string | null>) => {
      state.activeChannelSlug = action.payload
    },
    
    setTypingUser: (state, action: PayloadAction<{ channelSlug: string; empireId: number; isTyping: boolean }>) => {
      const { channelSlug, empireId, isTyping } = action.payload
      updateTypingUserInState(state, channelSlug, empireId, isTyping)
    },
    
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      const channelSlug = action.payload
      state.typingUsers[channelSlug] = {} as any
    },
    
    setOnlineUsers: (state, action: PayloadAction<{ channelSlug: string; users: OnlineUser[] }>) => {
      const { channelSlug, users } = action.payload
      state.onlineUsers[channelSlug] = users
    },
    
    updateOnlineUser: (state, action: PayloadAction<{ channelSlug: string; user: OnlineUser; isOnline: boolean }>) => {
      const { channelSlug, user, isOnline } = action.payload
      if (!state.onlineUsers[channelSlug]) {
        state.onlineUsers[channelSlug] = []
      }
      
      const users = state.onlineUsers[channelSlug]
      const existingIndex = users.findIndex(u => u.empire_id === user.empire_id)
      
      if (isOnline) {
        if (existingIndex >= 0) {
          users[existingIndex] = user
        } else {
          users.push(user)
        }
      } else {
        if (existingIndex >= 0) {
          users.splice(existingIndex, 1)
        }
      }
    },
    
    setRateLimitCooldown: (state, action: PayloadAction<{ channelSlug: string; expiresAt: number }>) => {
      const { channelSlug, expiresAt } = action.payload
      state.rateLimitCooldowns[channelSlug] = expiresAt
    },
    
    clearRateLimitCooldown: (state, action: PayloadAction<string>) => {
      const channelSlug = action.payload
      delete state.rateLimitCooldowns[channelSlug]
    },
    
    setLastMessageId: (state, action: PayloadAction<{ channelSlug: string; messageId: number | null }>) => {
      const { channelSlug, messageId } = action.payload
      state.lastMessageIds[channelSlug] = messageId
    },
    
    resetChatState: (state) => {
      state.activeChannelSlug = null
      state.typingUsers = {}
      state.onlineUsers = {}
      state.rateLimitCooldowns = {}
      state.lastMessageIds = {}
    },
  },
})

export const {
  setActiveChannel,
  setTypingUser,
  clearTypingUsers,
  setOnlineUsers,
  updateOnlineUser,
  setRateLimitCooldown,
  clearRateLimitCooldown,
  setLastMessageId,
  resetChatState,
} = chatSlice.actions

// Selector helpers
export const getTypingUsersForChannel = (state: ChatState, channelSlug: string): number[] => {
  return getTypingUsersArray(state.typingUsers, channelSlug)
}

export const isRateLimited = (state: ChatState, channelSlug: string): boolean => {
  const cooldown = state.rateLimitCooldowns[channelSlug]
  if (!cooldown) return false
  return Date.now() < cooldown
}

export const getRateLimitRemaining = (state: ChatState, channelSlug: string): number => {
  const cooldown = state.rateLimitCooldowns[channelSlug]
  if (!cooldown) return 0
  const remaining = cooldown - Date.now()
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export default chatSlice.reducer

