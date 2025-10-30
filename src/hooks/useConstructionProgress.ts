import { useState, useEffect, useCallback } from 'react'
import { useGetConstructionQueueQuery } from '@/api/endpoints/planetsApi'

interface ConstructionProgress {
  planetId: number
  itemId: number
  progress: number
  timeRemaining: number
  isCompleted: boolean
}

export function useConstructionProgress(planetId: number) {
  const [progressData, setProgressData] = useState<ConstructionProgress[]>([])
  
  const { data: constructionData, refetch } = useGetConstructionQueueQuery(planetId, {
    pollingInterval: 30000, // Poll every 30 seconds
  })

  const calculateProgress = useCallback(() => {
    if (!constructionData?.construction_queue) {
      return []
    }

    return constructionData.construction_queue.map((item) => {
      const ticksCompleted = Math.floor((item as any).progress_ticks || 0)
      const buildTime = (item as any).build_time_ticks || 1
      const ticksRemaining = Math.max(0, buildTime - ticksCompleted)
      const timeRemaining = 0

      return {
        planetId,
        itemId: item.id,
        progress: Math.min(100, (((item as any).progress_ticks || 0) / buildTime) * 100),
        timeRemaining: Math.max(0, timeRemaining),
        isCompleted: (item as any).is_completed || ticksRemaining <= 0,
      }
    })
  }, [constructionData, planetId])

  useEffect(() => {
    const newProgress = calculateProgress()
    setProgressData(newProgress)
  }, [calculateProgress])

  // Check for completed constructions
  useEffect(() => {
    const completedItems = progressData.filter(item => item.isCompleted && item.progress >= 100)
    if (completedItems.length > 0) {
      // Trigger refetch to get updated construction queue
      refetch()
    }
  }, [progressData, refetch])

  const getItemProgress = useCallback((itemId: number) => {
    return progressData.find(item => item.itemId === itemId)
  }, [progressData])

  const getTotalProgress = useCallback(() => {
    if (progressData.length === 0) return 0
    const totalProgress = progressData.reduce((sum, item) => sum + item.progress, 0)
    return totalProgress / progressData.length
  }, [progressData])

  const getActiveConstructions = useCallback(() => {
    return progressData.filter(item => !item.isCompleted)
  }, [progressData])

  const getCompletedConstructions = useCallback(() => {
    return progressData.filter(item => item.isCompleted)
  }, [progressData])

  return {
    progressData,
    getItemProgress,
    getTotalProgress,
    getActiveConstructions,
    getCompletedConstructions,
    refetch,
    isLoading: !constructionData,
  }
}

