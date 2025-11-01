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
      console.log('[Tutorial] Tutorial already completed (localStorage flag set)')
      return
    }
    
    // Check for manual trigger flag (for testing/manual start)
    const manualTrigger = sessionStorage.getItem('tutorial_manual_trigger')
    if (manualTrigger === 'true') {
      console.log('[Tutorial] Manual trigger detected - starting tutorial')
      sessionStorage.removeItem('tutorial_manual_trigger')
      const timer = setTimeout(() => {
        dispatch(startTutorial())
      }, 500)
      return () => clearTimeout(timer)
    }
    
    // If we have user data, check creation date
    if (meData?.user) {
      const user = meData.user as any
      const createdAt = user.created_at || user.createdAt
      
      if (createdAt) {
        const createdDate = new Date(createdAt)
        const now = new Date()
        const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
        
        console.log('[Tutorial] Checking user eligibility:', {
          createdAt,
          hoursSinceCreation,
          eligible: hoursSinceCreation < 24
        })
        
        // Trigger tutorial if account was created within last 24 hours
        if (hoursSinceCreation < 24) {
          console.log('[Tutorial] User eligible - starting tutorial in 1 second')
          // Small delay to ensure UI is ready
          const timer = setTimeout(() => {
            dispatch(startTutorial())
          }, 1000)
          
          return () => clearTimeout(timer)
        } else {
          console.log('[Tutorial] User account is older than 24 hours - tutorial will not auto-start')
        }
      }
    }
  }, [isAuthenticated, isTutorialCompleted, isTutorialActive, meData, dispatch])
}

