import { useEffect, useState, useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { cn } from '@/lib/utils'

export function TickCountdownTimer() {
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA)
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [millisecondsRemaining, setMillisecondsRemaining] = useState<number>(0)
  const [isInCountdown, setIsInCountdown] = useState(false) // Last 10 seconds
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null)

  // Listen for tick countdown events from tick service
  useEffect(() => {
    const handleCountdown = (e: CustomEvent) => {
      setTimeRemaining(e.detail.seconds)
      setMillisecondsRemaining(e.detail.milliseconds || 0)
      setIsInCountdown(true)
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
      setTimeRemaining(null)
      setIsInCountdown(false)
      setMinutesRemaining(null)
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
          setTimeRemaining(null)
          setIsInCountdown(false)
          setMinutesRemaining(null)
          return
        }
      } else {
        setTimeRemaining(null)
        setIsInCountdown(false)
        setMinutesRemaining(null)
        return
      }

      const now = new Date()
      const diff = tickDate.getTime() - now.getTime()
      const secondsRemaining = Math.floor(diff / 1000)
      const msRemaining = diff % 1000
      const totalSeconds = Math.floor(diff / 1000)

      if (totalSeconds < 0) {
        // Tick has passed, show 0 until next tick data arrives
        setTimeRemaining(0)
        setMillisecondsRemaining(0)
        setIsInCountdown(false)
        setMinutesRemaining(null)
      } else if (totalSeconds <= 10) {
        // Last 10 seconds - show detailed countdown
        setTimeRemaining(secondsRemaining)
        setMillisecondsRemaining(msRemaining)
        setIsInCountdown(true)
        setMinutesRemaining(null)
      } else {
        // More than 10 seconds - show minutes/seconds
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setMinutesRemaining(mins)
        setTimeRemaining(secs)
        setMillisecondsRemaining(0)
        setIsInCountdown(false)
      }
    }

    // Update immediately
    updateTimer()

    // Update every 100ms for smooth millisecond display
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [nextTickETA, tickIntervalSeconds])

  // Calculate progress (0-1) for the circle (only show progress in last 10 seconds)
  const progress = useMemo(() => {
    if (!isInCountdown || timeRemaining === null || timeRemaining < 0) return 0
    return Math.min((10 - timeRemaining) / 10, 1)
  }, [isInCountdown, timeRemaining])

  // Calculate stroke-dasharray for the circle
  const circumference = useMemo(() => 2 * Math.PI * 45, []) // radius = 45
  const strokeDashoffset = useMemo(() => {
    return circumference * (1 - progress)
  }, [circumference, progress])

  // Don't show if not authenticated, no tick data, or not in countdown (last 10 seconds)
  if (!isAuthenticated || !nextTickETA || timeRemaining === null || !isInCountdown) {
    return null
  }

  return (
    <div 
      className="fixed bottom-6 right-6 pointer-events-none"
      style={{ zIndex: 999999 }}
    >
      <div className="relative">
        {/* Pulsing glow effect */}
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
            
            {/* Progress circle */}
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
            
            {/* Second markers (10 markers for 10 seconds) */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 360) / 10 - 90 // Start from top, rotate clockwise
              const radian = (angle * Math.PI) / 180
              const markerX = 50 + 45 * Math.cos(radian)
              const markerY = 50 + 45 * Math.sin(radian)
              const isActive = i < 10 - (timeRemaining || 0)
              
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
            <span className="text-2xl font-mono font-bold text-cyan-400 glow-cyan">
              {timeRemaining !== null
                ? `${timeRemaining}.${Math.floor(millisecondsRemaining / 100)}`
                : '0'}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">
              TICK
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
