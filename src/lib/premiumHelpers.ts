import { QuantumCreditsTransaction } from '@/types/api.types'

/**
 * Format time remaining until booster expiration
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) {
    return 'Expired'
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m ${seconds}s`
}

/**
 * Get display name for booster type with icon
 */
export function getBoosterDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    production: '⚡ 2x Resource Production',
    construction: '🔨 1.5x Build Speed',
    signal: '📡 Signal Bonus',
    secondary_extraction: '💠 Secondary Extraction Boost',
  }
  return displayNames[type] || type
}

/**
 * Get readable name for achievement slug
 */
export function getAchievementDisplayName(slug: string): string {
  const displayNames: Record<string, string> = {
    first_colony: 'First Colony',
    five_colonies: 'Five Colonies',
    first_battle_won: 'First Battle Won',
    ten_battles_won: '10 Battles Won',
    era_2_complete: 'ERA 2 Complete',
    era_3_complete: 'ERA 3 Complete',
    era_4_complete: 'ERA 4 Complete',
    era_5_complete: 'ERA 5 Complete',
    alliance_created: 'Alliance Created',
    top_100: 'Top 100 Empire',
    top_10: 'Top 10 Empire',
  }
  return displayNames[slug] || slug.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Calculate booster cost with diminishing returns
 * Checks for purchases within last 7 days
 */
export function calculateBoosterCost(
  baseCost: number,
  recentPurchases: QuantumCreditsTransaction[]
): number {
  // Filter for booster purchases in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentBoosterPurchases = recentPurchases.filter((transaction) => {
    if (transaction.type !== 'spent' || !transaction.reason.startsWith('booster_')) {
      return false
    }
    const transactionDate = new Date(transaction.created_at)
    return transactionDate >= sevenDaysAgo
  })

  const purchaseCount = recentBoosterPurchases.length

  if (purchaseCount === 0) {
    return baseCost
  }

  // Diminishing returns: +50% for 2nd, +100% for 3rd, etc.
  const multiplier = 1 + purchaseCount * 0.5
  return Math.floor(baseCost * multiplier)
}

