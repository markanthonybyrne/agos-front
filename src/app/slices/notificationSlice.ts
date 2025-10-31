import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  category: 'construction' | 'fleet' | 'combat' | 'alliance' | 'research' | 'general' | 'tick' | 'attack'
  actionUrl?: string
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isNotificationCenterOpen: boolean
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isNotificationCenterOpen: false,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'isRead'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        isRead: false,
      }
      state.notifications.unshift(notification) // Add to beginning
      state.unreadCount += 1
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100)
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount -= 1
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true
        }
      })
      state.unreadCount = 0
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        if (!notification.isRead) {
          state.unreadCount -= 1
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload)
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    setNotificationCenterOpen: (state, action: PayloadAction<boolean>) => {
      state.isNotificationCenterOpen = action.payload
    },
    // WebSocket event handlers
    handleConstructionCompleted: (state, action: PayloadAction<{ planetId: number; itemType: string; itemName: string }>) => {
      const { planetId, itemType, itemName } = action.payload
      state.notifications.unshift({
        id: `construction_${Date.now()}`,
        type: 'success',
        title: 'Construction Completed',
        message: `${itemName} has been completed on Planet ${planetId}`,
        timestamp: new Date(),
        isRead: false,
        category: 'construction',
        actionUrl: `/planets/${planetId}`,
        data: { planetId, itemType, itemName }
      })
      state.unreadCount += 1
    },
    handleFleetArrived: (state, action: PayloadAction<{ fleetId: number; destination: string; fleetName: string }>) => {
      const { fleetId, destination, fleetName } = action.payload
      state.notifications.unshift({
        id: `fleet_${Date.now()}`,
        type: 'info',
        title: 'Fleet Arrived',
        message: `${fleetName} has arrived at ${destination}`,
        timestamp: new Date(),
        isRead: false,
        category: 'fleet',
        actionUrl: `/fleets/${fleetId}`,
        data: { fleetId, destination, fleetName }
      })
      state.unreadCount += 1
    },
    handleFleetAttacked: (state, action: PayloadAction<{ fleetId: number; attacker: string; location: string }>) => {
      const { fleetId, attacker, location } = action.payload
      state.notifications.unshift({
        id: `attack_${Date.now()}`,
        type: 'warning',
        title: 'Fleet Under Attack',
        message: `Your fleet at ${location} is under attack by ${attacker}`,
        timestamp: new Date(),
        isRead: false,
        category: 'combat',
        actionUrl: `/fleets/${fleetId}`,
        data: { fleetId, attacker, location }
      })
      state.unreadCount += 1
    },
    handleEmpireAttacked: (state, action: PayloadAction<{ planetId: number; attacker: string; location: string }>) => {
      const { planetId, attacker, location } = action.payload
      state.notifications.unshift({
        id: `empire_attack_${Date.now()}`,
        type: 'error',
        title: 'Empire Under Attack',
        message: `Your planet at ${location} is under attack by ${attacker}`,
        timestamp: new Date(),
        isRead: false,
        category: 'attack',
        actionUrl: `/planets/${planetId}`,
        data: { planetId, attacker, location }
      })
      state.unreadCount += 1
    },
    handleResearchCompleted: (state, action: PayloadAction<{ researchName: string; planetId: number }>) => {
      const { researchName, planetId } = action.payload
      state.notifications.unshift({
        id: `research_${Date.now()}`,
        type: 'success',
        title: 'Research Completed',
        message: `${researchName} research has been completed`,
        timestamp: new Date(),
        isRead: false,
        category: 'research',
        actionUrl: `/planets/${planetId}`,
        data: { researchName, planetId }
      })
      state.unreadCount += 1
    },
    handleAllianceMessage: (state, action: PayloadAction<{ senderName: string; message: string; allianceId: number }>) => {
      const { senderName, message, allianceId } = action.payload
      state.notifications.unshift({
        id: `alliance_${Date.now()}`,
        type: 'info',
        title: 'Alliance Message',
        message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        timestamp: new Date(),
        isRead: false,
        category: 'alliance',
        actionUrl: `/alliances/${allianceId}`,
        data: { senderName, message, allianceId }
      })
      state.unreadCount += 1
    },
    handleTickProcessed: (state, action: PayloadAction<{ tickNumber: number; nextTickEta: string }>) => {
      const { tickNumber, nextTickEta } = action.payload
      state.notifications.unshift({
        id: `tick_${Date.now()}`,
        type: 'info',
        title: 'Tick Processed',
        message: `Tick ${tickNumber} has been processed. Next tick in ${nextTickEta}`,
        timestamp: new Date(),
        isRead: false,
        category: 'tick',
        data: { tickNumber, nextTickEta }
      })
      state.unreadCount += 1
    },
  },
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  setNotificationCenterOpen,
  handleConstructionCompleted,
  handleFleetArrived,
  handleFleetAttacked,
  handleEmpireAttacked,
  handleResearchCompleted,
  handleAllianceMessage,
  handleTickProcessed,
} = notificationSlice.actions

export default notificationSlice.reducer






