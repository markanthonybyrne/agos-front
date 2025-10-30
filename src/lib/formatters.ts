import { formatDistanceToNow, format } from 'date-fns'

// Format large numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

// Format resources (Tellerium/Krypton)
export function formatResource(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`
  }
  return formatNumber(amount)
}

// Format time remaining until tick
export function formatTickETA(eta: string): string {
  try {
    const etaDate = new Date(eta)
    const now = new Date()
    const diff = etaDate.getTime() - now.getTime()

    if (diff < 0) {
      return 'Processing...'
    }

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  } catch {
    return 'Unknown'
  }
}

// Format date/time
export function formatDateTime(date: string): string {
  try {
    return format(new Date(date), 'MMM dd, yyyy HH:mm')
  } catch {
    return date
  }
}

// Format date only
export function formatDate(date: string): string {
  try {
    return format(new Date(date), 'MMM dd, yyyy')
  } catch {
    return date
  }
}

// Format relative time
export function formatRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return date
  }
}

// Format ticks to human-readable time
export function formatTicksToTime(ticks: number, tickIntervalMinutes: number = 5): string {
  const minutes = ticks * tickIntervalMinutes
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}m`
}

