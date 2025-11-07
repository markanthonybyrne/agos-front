import { useEffect, useState, useRef } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function AuthTransitionOverlay() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [blurAmount, setBlurAmount] = useState(0)
  const transitionStartTime = useRef<number | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const blurIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedBlurReductionRef = useRef(false)
  const isDashboardRoute = location.pathname === '/map' || location.pathname === '/'

  useEffect(() => {
    // Only trigger transition when authenticated, on dashboard route, AND we have a fresh login flag
    const hasAuthTransition = sessionStorage.getItem('auth_transition') === 'true'
    
    if (isAuthenticated && isDashboardRoute && hasAuthTransition && !transitionStartTime.current) {
      // Clear the flag immediately so it doesn't trigger on refresh
      sessionStorage.removeItem('auth_transition')
      
      // Start transition
      setIsTransitioning(true)
      setBlurAmount(20) // Start with full blur
      transitionStartTime.current = Date.now()
      hasStartedBlurReductionRef.current = false

      // Maximum time to wait (2 seconds)
      const maxWaitTime = 2000

      // Wait for dashboard to load
      checkIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (transitionStartTime.current || 0)
        
        // Check if dashboard has loaded by looking for map content
        const mapContent = document.querySelector('.galaxy-map') || document.querySelector('[data-map]')
        const hasContent = mapContent !== null
        
        // Start blur reduction if content is loaded OR if max time has passed
        if (!hasStartedBlurReductionRef.current && (hasContent || elapsed >= maxWaitTime)) {
          hasStartedBlurReductionRef.current = true
          
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          
          // Gradually reduce blur
          blurIntervalRef.current = setInterval(() => {
            setBlurAmount((prev) => {
              const newBlur = Math.max(0, prev - 0.5)
              if (newBlur <= 0) {
                if (blurIntervalRef.current) {
                  clearInterval(blurIntervalRef.current)
                  blurIntervalRef.current = null
                }
                // Hide overlay after transition completes
                setTimeout(() => {
                  setIsTransitioning(false)
                  transitionStartTime.current = null
                  hasStartedBlurReductionRef.current = false
                }, 300)
                return 0
              }
              return newBlur
            })
          }, 30) // Update every 30ms for smooth animation
        }
      }, 100) // Check every 100ms

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
        if (blurIntervalRef.current) {
          clearInterval(blurIntervalRef.current)
          blurIntervalRef.current = null
        }
      }
    } else if (!isAuthenticated || !isDashboardRoute) {
      // Reset when logged out or not on dashboard
      setIsTransitioning(false)
      setBlurAmount(0)
      transitionStartTime.current = null
      hasStartedBlurReductionRef.current = false
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      if (blurIntervalRef.current) {
        clearInterval(blurIntervalRef.current)
        blurIntervalRef.current = null
      }
    }
  }, [isAuthenticated, isDashboardRoute])

  if (!isTransitioning) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[999999] pointer-events-none transition-opacity duration-500',
        blurAmount > 0 ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        background: 'rgba(0, 0, 0, 0.2)',
      }}
    />
  )
}

