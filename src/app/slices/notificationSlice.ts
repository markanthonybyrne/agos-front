import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string // ISO string for Redux serialization
  isRead: boolean
  category: 'construction' | 'fleet' | 'combat' | 'alliance' | 'research' | 'general' | 'tick' | 'attack' | 'colonization' | 'capture' | 'announcement' | 'incident'
  actionUrl?: string
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isNotificationCenterOpen: boolean
}

// Load notifications from localStorage
const loadNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('notifications')
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // Timestamps are already stored as ISO strings, no conversion needed
    return parsed.map((n: any) => ({
      ...n,
      // Ensure timestamp is a string (in case old data has Date objects)
      timestamp: typeof n.timestamp === 'string' ? n.timestamp : new Date(n.timestamp).toISOString(),
    }))
  } catch (error) {
    console.error('Error loading notifications from localStorage:', error)
    return []
  }
}

// Save notifications to localStorage
const saveNotificationsToStorage = (notifications: Notification[]) => {
  try {
    // Keep only last 100 notifications for storage
    const toStore = notifications.slice(0, 100)
    localStorage.setItem('notifications', JSON.stringify(toStore))
  } catch (error) {
    console.error('Error saving notifications to localStorage:', error)
  }
}

const loadedNotifications = loadNotificationsFromStorage()
const initialUnreadCount = loadedNotifications.filter(n => !n.isRead).length

const initialState: NotificationState = {
  notifications: loadedNotifications,
  unreadCount: initialUnreadCount,
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
        timestamp: new Date().toISOString(),
        isRead: false,
      }
      state.notifications.unshift(notification) // Add to beginning
      state.unreadCount += 1
      
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100)
      }
      
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount -= 1
        // Persist to localStorage
        saveNotificationsToStorage(state.notifications)
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true
        }
      })
      state.unreadCount = 0
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        if (!notification.isRead) {
          state.unreadCount -= 1
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload)
        // Persist to localStorage
        saveNotificationsToStorage(state.notifications)
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
      // Clear from localStorage
      localStorage.removeItem('notifications')
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
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'construction',
        actionUrl: `/planets/${planetId}`,
        data: { planetId, itemType, itemName }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleFleetArrived: (state, action: PayloadAction<{ fleetId: number; destination: string; fleetName: string }>) => {
      const { fleetId, destination, fleetName } = action.payload
      state.notifications.unshift({
        id: `fleet_${Date.now()}`,
        type: 'info',
        title: 'Fleet Arrived',
        message: `${fleetName} has arrived at ${destination}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'fleet',
        actionUrl: `/fleets/${fleetId}`,
        data: { fleetId, destination, fleetName }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleFleetAttacked: (state, action: PayloadAction<{ fleetId: number; attacker: string; location: string }>) => {
      const { fleetId, attacker, location } = action.payload
      state.notifications.unshift({
        id: `attack_${Date.now()}`,
        type: 'warning',
        title: 'Fleet Under Attack',
        message: `Your fleet at ${location} is under attack by ${attacker}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'combat',
        actionUrl: `/fleets/${fleetId}`,
        data: { fleetId, attacker, location }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleEmpireAttacked: (state, action: PayloadAction<{ planetId: number; attacker: string; location: string }>) => {
      const { planetId, attacker, location } = action.payload
      state.notifications.unshift({
        id: `empire_attack_${Date.now()}`,
        type: 'error',
        title: 'Empire Under Attack',
        message: `Your planet at ${location} is under attack by ${attacker}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'attack',
        actionUrl: `/planets/${planetId}`,
        data: { planetId, attacker, location }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleResearchCompleted: (state, action: PayloadAction<{ researchName: string; planetId: number }>) => {
      const { researchName, planetId } = action.payload
      state.notifications.unshift({
        id: `research_${Date.now()}`,
        type: 'success',
        title: 'Research Completed',
        message: `${researchName} research has been completed`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'research',
        actionUrl: `/planets/${planetId}`,
        data: { researchName, planetId }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleAllianceMessage: (state, action: PayloadAction<{ senderName: string; message: string; allianceId: number }>) => {
      const { senderName, message, allianceId } = action.payload
      state.notifications.unshift({
        id: `alliance_${Date.now()}`,
        type: 'info',
        title: 'Alliance Message',
        message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'alliance',
        actionUrl: `/alliances/${allianceId}`,
        data: { senderName, message, allianceId }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleTickProcessed: (state, action: PayloadAction<{ tickNumber: number; nextTickEta: string }>) => {
      const { tickNumber, nextTickEta } = action.payload
      state.notifications.unshift({
        id: `tick_${Date.now()}`,
        type: 'info',
        title: 'Tick Processed',
        message: `Tick ${tickNumber} has been processed. Next tick in ${nextTickEta}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'tick',
        data: { tickNumber, nextTickEta }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleFleetLaunched: (state, action: PayloadAction<{ 
      isDefender: boolean
      attacker?: { id: number; name: string }
      fleet: { id: number; destination: any; arrival_tick: number }
      destinationPlanetId?: number
    }>) => {
      const { isDefender, attacker, fleet, destinationPlanetId } = action.payload
      
      if (isDefender) {
        // Critical defender warning
        state.notifications.unshift({
          id: `fleet_launched_defender_${Date.now()}`,
          type: 'error',
          title: '⚠️ Incoming Fleet Attack!',
          message: `${attacker?.name || 'Unknown'} has launched a fleet at your planet ${fleet.destination.planet_name || fleet.destination.coordinate || 'Unknown'}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          category: 'attack',
          actionUrl: destinationPlanetId ? `/planets/${destinationPlanetId}` : undefined,
          data: { attacker, fleet, destinationPlanetId, isDefender: true }
        })
      } else {
        // Attacker confirmation
        state.notifications.unshift({
          id: `fleet_launched_attacker_${Date.now()}`,
          type: 'info',
          title: 'Fleet Launched',
          message: `Your fleet has been launched and will arrive at tick ${fleet.arrival_tick}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          category: 'fleet',
          actionUrl: `/fleets/${fleet.id}`,
          data: { fleet, isDefender: false }
        })
      }
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handlePlanetCaptured: (state, action: PayloadAction<{ 
      isPreviousOwner: boolean
      isNewOwner: boolean
      planet: { id: number; name: string; coordinate: any }
      previousOwner?: { id: number; name: string } | null
      newOwner: { id: number; name: string }
      combatLogId?: number | null
    }>) => {
      const { isPreviousOwner, isNewOwner, planet, previousOwner, newOwner, combatLogId } = action.payload
      
      if (isPreviousOwner) {
        // Planet lost
        state.notifications.unshift({
          id: `planet_lost_${Date.now()}`,
          type: 'error',
          title: '⚠️ Planet Lost!',
          message: `${planet.name} has been captured by ${newOwner.name}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          category: 'capture',
          actionUrl: combatLogId ? `/combat/${combatLogId}` : `/planets/${planet.id}`,
          data: { planet, capturedBy: newOwner, combatLogId, isLost: true }
        })
      } else if (isNewOwner) {
        // Planet captured
        state.notifications.unshift({
          id: `planet_captured_${Date.now()}`,
          type: 'success',
          title: '🎯 Planet Captured!',
          message: `You have successfully captured ${planet.name}!`,
          timestamp: new Date().toISOString(),
          isRead: false,
          category: 'capture',
          actionUrl: `/planets/${planet.id}`,
          data: { planet, capturedFrom: previousOwner, combatLogId, isCaptured: true }
        })
      }
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handlePlanetColonized: (state, action: PayloadAction<{ 
      planet: { id: number; name: string; coordinate: any }
      empire: { id: number; name: string }
    }>) => {
      const { planet, empire } = action.payload
      state.notifications.unshift({
        id: `planet_colonized_${Date.now()}`,
        type: 'success',
        title: '🎉 Planet Colonized!',
        message: `Successfully colonized ${planet.name} at ${planet.coordinate?.quadrant}:${planet.coordinate?.sector}:${planet.coordinate?.galaxy}:${planet.coordinate?.planet}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'colonization',
        actionUrl: `/planets/${planet.id}`,
        data: { planet, empire }
      })
      state.unreadCount += 1
      // Persist to localStorage
      saveNotificationsToStorage(state.notifications)
    },
    handleIncidentSpawned: (state, action: PayloadAction<{
      incident: {
        id: number
        type: string
        name: string
        location: { x: number; y: number; region: number; system: number }
      }
    }>) => {
      const { incident } = action.payload
      const typeEmoji = {
        wormhole: '🌀',
        asteroid_storm: '☄️',
        resource_rush: '💎',
        pirate_raid: '⚔️',
        anomaly: '✨',
      }[incident.type] || '📡'
      
      state.notifications.unshift({
        id: `incident_spawned_${incident.id}_${Date.now()}`,
        type: 'info',
        title: `${typeEmoji} New Incident: ${incident.name}`,
        message: `A ${incident.type.replace('_', ' ')} has appeared in Region ${incident.location.region}, System ${incident.location.system}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'incident',
        data: { incident }
      })
      state.unreadCount += 1
      saveNotificationsToStorage(state.notifications)
    },
    handleIncidentExpired: (state, action: PayloadAction<{
      incident: {
        id: number
        type: string
        name: string
      }
    }>) => {
      const { incident } = action.payload
      state.notifications.unshift({
        id: `incident_expired_${incident.id}_${Date.now()}`,
        type: 'warning',
        title: `⚠️ Incident Expired: ${incident.name}`,
        message: `The ${incident.type.replace('_', ' ')} has ended`,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'incident',
        data: { incident }
      })
      state.unreadCount += 1
      saveNotificationsToStorage(state.notifications)
    },
    handleIncidentInteraction: (state, action: PayloadAction<{
      incident: {
        id: number
        type: string
        name: string
      }
      success: boolean
      message: string
      result?: any
    }>) => {
      const { incident, success, message, result } = action.payload
      state.notifications.unshift({
        id: `incident_interaction_${incident.id}_${Date.now()}`,
        type: success ? 'success' : 'error',
        title: success ? `✅ ${incident.name}` : `❌ ${incident.name}`,
        message: message,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'incident',
        data: { incident, result }
      })
      state.unreadCount += 1
      saveNotificationsToStorage(state.notifications)
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
  handleFleetLaunched,
  handlePlanetCaptured,
  handlePlanetColonized,
  handleIncidentSpawned,
  handleIncidentExpired,
  handleIncidentInteraction,
} = notificationSlice.actions

export default notificationSlice.reducer






