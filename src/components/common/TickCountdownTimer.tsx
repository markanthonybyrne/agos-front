import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAppSelector } from '@/app/hooks'
import { cn } from '@/lib/utils'

export function TickCountdownTimer() {
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA)
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState<number | null>(null)
  const [millisecondsRemaining, setMillisecondsRemaining] = useState<number>(0)
  const [isInCountdown, setIsInCountdown] = useState(false) // Last 10 seconds
  const [mounted, setMounted] = useState(false)

  // Ensure we only render portal after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for tick countdown events from tick service
  useEffect(() => {
    const handleCountdown = (e: CustomEvent) => {
      const seconds = e.detail.seconds
      setTotalSecondsRemaining(seconds)
      setMillisecondsRemaining(e.detail.milliseconds || 0)
      setIsInCountdown(seconds <= 10)
    }

    const handleAlert = (e: CustomEvent) => {
      // Visual alert is already handled by the component's styling
      if (e.detail.seconds <= 3) {
        // Could add sound here if needed
      }
    }

    window.addEventListener('tick:countdown', handleCountdown as EventListener)
    window.addEventListener('tick:alert', handleAlert as EventListener)

    return () => {
      window.removeEventListener('tick:countdown', handleCountdown as EventListener)
      window.removeEventListener('tick:alert', handleAlert as EventListener)
    }
  }, [])

  // Calculate time remaining until tick (fallback if tick service events not received)
  useEffect(() => {
    if (!nextTickETA) {
      setTotalSecondsRemaining(null)
      setIsInCountdown(false)
      return
    }

    const updateTimer = () => {
      let tickDate: Date
      
      // Handle both ISO string and potential number format
      if (typeof nextTickETA === 'string') {
        tickDate = new Date(nextTickETA)
      } else if (typeof nextTickETA === 'number') {
        // If it's a number (eta_seconds), calculate from now
        const etaSeconds = nextTickETA
        if (etaSeconds < 0 && tickIntervalSeconds) {
          // Tick has passed, calculate next tick
          const ticksPassed = Math.ceil(Math.abs(etaSeconds) / tickIntervalSeconds)
          tickDate = new Date(Date.now() + (tickIntervalSeconds - (Math.abs(etaSeconds) % tickIntervalSeconds)) * 1000)
        } else if (etaSeconds >= 0) {
          tickDate = new Date(Date.now() + etaSeconds * 1000)
        } else {
          // Can't calculate without interval
          setTotalSecondsRemaining(null)
          setIsInCountdown(false)
          return
        }
      } else {
        setTotalSecondsRemaining(null)
        setIsInCountdown(false)
        return
      }

      const now = new Date()
      const diff = tickDate.getTime() - now.getTime()
      const totalSeconds = Math.floor(diff / 1000)
      const msRemaining = diff % 1000

      if (totalSeconds < 0) {
        // Tick has passed, show 0 until next tick data arrives
        setTotalSecondsRemaining(0)
        setMillisecondsRemaining(0)
        setIsInCountdown(false)
      } else {
        // Always show total time remaining
        setTotalSecondsRemaining(totalSeconds)
        setMillisecondsRemaining(msRemaining)
        setIsInCountdown(totalSeconds <= 10)
      }
    }

    // Update immediately
    updateTimer()

    // Update every 100ms for smooth millisecond display
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [nextTickETA, tickIntervalSeconds])

  // Calculate progress (0-1) for the circle based on total time remaining
  const progress = useMemo(() => {
    if (totalSecondsRemaining === null || totalSecondsRemaining < 0) return 0
    
    // Calculate progress based on tick interval
    // Use tickIntervalSeconds if available, otherwise estimate from current remaining time
    const tickInterval = tickIntervalSeconds || 300 // Default to 5 minutes if not available
    const progressValue = Math.max(0, Math.min(1, (tickInterval - totalSecondsRemaining) / tickInterval))
    
    return progressValue
  }, [totalSecondsRemaining, tickIntervalSeconds])

  // Calculate stroke-dasharray for the circle
  const circumference = useMemo(() => 2 * Math.PI * 45, []) // radius = 45
  const strokeDashoffset = useMemo(() => {
    return circumference * (1 - progress)
  }, [circumference, progress])

  // Format time display based on remaining time
  const displayTime = useMemo(() => {
    if (totalSecondsRemaining === null) return '0'
    
    if (isInCountdown) {
      // Last 10 seconds - show detailed countdown with milliseconds
      return `${totalSecondsRemaining}.${Math.floor(millisecondsRemaining / 100)}`
    } else {
      // More than 10 seconds - show minutes:seconds format
      const mins = Math.floor(totalSecondsRemaining / 60)
      const secs = totalSecondsRemaining % 60
      if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}`
      } else {
        return secs.toString()
      }
    }
  }, [totalSecondsRemaining, millisecondsRemaining, isInCountdown])

  // Don't show if not authenticated or no tick data
  if (!isAuthenticated || !nextTickETA || totalSecondsRemaining === null || !mounted) {
    return null
  }

  const timerContent = (
    <div 
      className="fixed bottom-6 right-6 pointer-events-none"
      style={{ 
        zIndex: 9999999,
        position: 'fixed',
        isolation: 'isolate',
      }}
    >
      <div className="relative" style={{ isolation: 'isolate' }}>
        {/* Pulsing glow effect - always visible */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse" />
        
        {/* Timer circle container */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* SVG Circle */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-border/30"
            />
            
            {/* Progress circle - always visible */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-cyan-400 transition-all duration-300"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))',
              }}
            />
            
            {/* Second markers - only show in last 10 seconds */}
            {isInCountdown && Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 360) / 10 - 90 // Start from top, rotate clockwise
              const radian = (angle * Math.PI) / 180
              const markerX = 50 + 45 * Math.cos(radian)
              const markerY = 50 + 45 * Math.sin(radian)
              const isActive = i < 10 - (totalSecondsRemaining || 0)
              
              return (
                <circle
                  key={i}
                  cx={markerX}
                  cy={markerY}
                  r={isActive ? '2' : '1.5'}
                  fill="currentColor"
                  className={cn(
                    'transition-all duration-300',
                    isActive ? 'text-cyan-400' : 'text-border/50'
                  )}
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.8))' : 'none',
                  }}
                />
              )
            })}
          </svg>
          
          {/* Time display */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className={cn(
              "font-mono font-bold text-cyan-400 glow-cyan",
              isInCountdown ? "text-2xl" : "text-xl"
            )}>
              {displayTime}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
              TICK
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  // Render to document.body via portal to ensure it's always on top
  return createPortal(timerContent, document.body)
}
