import { store } from '@/app/store'
import { setTick, setTickProcessing } from '@/app/slices/gameSlice'

/**
 * Tick countdown service with API-first initialization
 * Manages tick countdown timer and dispatches events for UI updates
 */

interface TickInfo {
  current_tick: number
  next_tick_eta: number // Seconds until next tick (relative)
  next_tick_at: string // ISO 8601 timestamp (absolute) - USE THIS
  tick_interval: number // Duration in seconds between ticks
  last_tick_at: string | null
  timestamp: string
}

let countdownTimer: NodeJS.Timeout | null = null
let updateTimer: NodeJS.Timeout | null = null
let nextTickTimestamp: string | null = null
let tickInterval: number = 1800 // Default 30 minutes

/**
 * Initialize tick countdown from API
 */
export async function initializeTickCountdown(): Promise<TickInfo | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
    const state = store.getState()
    const token = (state as any).auth?.token
    
    // Remove trailing slash from apiUrl and ensure proper path construction
    const baseUrl = apiUrl.replace(/\/$/, '')
    const endpoint = `/game/tick-info`
    
    const headers: HeadersInit = {
      Accept: 'application/json',
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers,
    })

    if (!response.ok) {
      console.error('[TickService] Failed to fetch tick info:', response.statusText)
      return null
    }

    const tickInfo: TickInfo = await response.json()

    nextTickTimestamp = tickInfo.next_tick_at
    tickInterval = tickInfo.tick_interval

    // Update Redux store
    store.dispatch(
      setTick({
        tick: tickInfo.current_tick,
        nextTickETA: tickInfo.next_tick_at,
        tickIntervalSeconds: tickInfo.tick_interval,
      })
    )

    startCountdown(tickInfo.next_tick_at, tickInfo.tick_interval)

    return tickInfo
  } catch (error) {
    console.error('[TickService] Failed to fetch tick info:', error)
    return null
  }
}

/**
 * Start countdown timer
 */
function startCountdown(nextTickAt: string, interval: number): void {
  // Clear existing timers
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  if (updateTimer) {
    clearInterval(updateTimer)
  }

  nextTickTimestamp = nextTickAt
  tickInterval = interval

  // Update every 100ms for smooth animation
  updateTimer = setInterval(() => {
    updateCountdownDisplay()
  }, 100)
}

/**
 * Update countdown display and dispatch events
 */
function updateCountdownDisplay(): void {
  if (!nextTickTimestamp) return

  const now = new Date().getTime()
  const nextTick = new Date(nextTickTimestamp).getTime()
  const diff = Math.max(0, nextTick - now)

  const seconds = Math.floor(diff / 1000)
  const milliseconds = diff % 1000

  // Only show countdown in last 10 seconds
  if (seconds <= 10) {
    const displayValue = `${seconds}.${Math.floor(milliseconds / 100)}`

    // Dispatch custom event for UI updates
    window.dispatchEvent(
      new CustomEvent('tick:countdown', {
        detail: { value: displayValue, seconds, milliseconds },
      })
    )

    // Flash/alert when under 5 seconds
    if (seconds <= 5) {
      window.dispatchEvent(
        new CustomEvent('tick:alert', {
          detail: { seconds },
        })
      )
    }
  } else {
    // Show time until countdown starts
    const minutesUntil = Math.floor((diff - 10000) / 60000)
    window.dispatchEvent(
      new CustomEvent('tick:time-until', {
        detail: { minutes: minutesUntil },
      })
    )
  }

  // If tick has passed, recalculate
  if (diff <= 0) {
    recalculateCountdown()
  }
}

/**
 * Recalculate countdown after tick passes
 */
function recalculateCountdown(): void {
  if (!nextTickTimestamp) return

  // Add tick interval to last known tick time
  const lastTick = new Date(nextTickTimestamp)
  const nextTick = new Date(lastTick.getTime() + tickInterval * 1000)

  nextTickTimestamp = nextTick.toISOString()

  // Update Redux store with new tick time
  const currentTick = store.getState().game.currentTick || 0
  store.dispatch(
    setTick({
      tick: currentTick + 1,
      nextTickETA: nextTickTimestamp,
      tickIntervalSeconds: tickInterval,
    })
  )

  startCountdown(nextTickTimestamp, tickInterval)
}

/**
 * Update countdown from WebSocket tick.processed event
 */
export function updateCountdownFromWebSocket(data: {
  tick_number: number
  next_tick_at: string
  tick_interval: number
  next_tick_eta?: number
}): void {
  nextTickTimestamp = data.next_tick_at
  tickInterval = data.tick_interval

  // Update Redux store
  store.dispatch(
    setTick({
      tick: data.tick_number,
      nextTickETA: data.next_tick_at,
      tickIntervalSeconds: data.tick_interval,
    })
  )

  store.dispatch(setTickProcessing(false))

  // Restart countdown with new data
  startCountdown(data.next_tick_at, data.tick_interval)
}

/**
 * Cleanup timers
 */
export function cleanupTickService(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  nextTickTimestamp = null
}

