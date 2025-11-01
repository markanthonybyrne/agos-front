import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { startTutorial } from '@/app/slices/tutorialSlice'
import { useGetMeQuery } from '@/api/endpoints/authApi'

/**
 * Hook to detect first-time users and trigger tutorial
 * Checks user creation date and localStorage flag
 */
export function useTutorialDetection() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const isTutorialCompleted = useAppSelector((state) => state.tutorial.isTutorialCompleted)
  const isTutorialActive = useAppSelector((state) => state.tutorial.isActive)
  
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated })
  
  useEffect(() => {
    // Only check if authenticated and tutorial not already completed or active
    if (!isAuthenticated || isTutorialCompleted || isTutorialActive) {
      return
    }
    
    // Check localStorage first (fastest check)
    const tutorialCompletedFlag = localStorage.getItem('tutorial_completed')
    if (tutorialCompletedFlag === 'true') {
      return
    }
    
    // If we have user data, check creation date
    if (meData?.user) {
      const user = meData.user as any
      const createdAt = user.created_at || user.createdAt
      
      if (createdAt) {
        const createdDate = new Date(createdAt)
        const now = new Date()
        const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
        
        // Trigger tutorial if account was created within last 24 hours
        if (hoursSinceCreation < 24) {
          // Small delay to ensure UI is ready
          const timer = setTimeout(() => {
            dispatch(startTutorial())
          }, 1000)
          
          return () => clearTimeout(timer)
        }
      }
    }
  }, [isAuthenticated, isTutorialCompleted, isTutorialActive, meData, dispatch])
}

