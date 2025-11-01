import { useEffect, useRef } from 'react'
import { useGetAchievementsQuery } from '@/api/endpoints/premiumApi'
import { getAchievementDisplayName } from '@/lib/premiumHelpers'
import { toast } from 'sonner'
import { Trophy } from 'lucide-react'

const STORAGE_KEY = 'seen_achievements'

function getSeenAchievements(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveSeenAchievements(slugs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  } catch {
    // Ignore localStorage errors
  }
}

export function useAchievementNotifications() {
  const { data } = useGetAchievementsQuery()
  const seenAchievementsRef = useRef<string[]>(getSeenAchievements())
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!data?.achievements) return

    const currentAchievements = data.achievements
      .filter((a) => a.unlocked_at !== null)
      .map((a) => a.slug)

    // On first load, just store what we see (don't show notifications)
    if (!hasInitialized.current) {
      seenAchievementsRef.current = currentAchievements
      saveSeenAchievements(currentAchievements)
      hasInitialized.current = true
      return
    }

    // Find new achievements
    const seen = seenAchievementsRef.current
    const newAchievements = currentAchievements.filter((slug) => !seen.includes(slug))

    if (newAchievements.length > 0) {
      // Find full achievement data for new unlocks
      const newAchievementData = newAchievements
        .map((slug) => {
          const fullAchievement = data.achievements.find((a) => a.slug === slug && a.unlocked_at !== null)
          return fullAchievement || null
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)

      // Show notifications for each new achievement
      newAchievementData.forEach((achievement) => {
        const displayName = getAchievementDisplayName(achievement.slug)
        const reward = achievement.quantum_credits_awarded || data.available[achievement.slug] || 0

        toast.success(`Achievement Unlocked: ${displayName} (+${reward} QC)`, {
          duration: 6000,
          description: `You've earned ${reward} Quantum Credits!`,
        })
      })

      // Update seen achievements
      seenAchievementsRef.current = currentAchievements
      saveSeenAchievements(currentAchievements)
    }
  }, [data])
}

