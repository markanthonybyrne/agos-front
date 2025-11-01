import { useEffect, useState, useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { cn } from '@/lib/utils'

export function TickCountdownTimer() {
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA)
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Calculate time remaining until tick
  useEffect(() => {
    if (!nextTickETA) {
      setIsVisible(false)
      setTimeRemaining(null)
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
          setIsVisible(false)
          setTimeRemaining(null)
          return
        }
      } else {
        setIsVisible(false)
        setTimeRemaining(null)
        return
      }

      const now = new Date()
      const diff = tickDate.getTime() - now.getTime()
      const secondsRemaining = Math.floor(diff / 1000)

      if (secondsRemaining <= 10 && secondsRemaining >= 0) {
        setTimeRemaining(secondsRemaining)
        setIsVisible(true)
      } else if (secondsRemaining < 0) {
        // Tick has passed, hide timer
        setIsVisible(false)
        setTimeRemaining(null)
      } else {
        setIsVisible(false)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextTickETA, tickIntervalSeconds])

  // Calculate progress (0-1) for the circle
  const progress = useMemo(() => {
    if (timeRemaining === null || timeRemaining < 0) return 0
    return Math.min((10 - timeRemaining) / 10, 1)
  }, [timeRemaining])

  // Calculate stroke-dasharray for the circle
  const circumference = useMemo(() => 2 * Math.PI * 45, []) // radius = 45
  const strokeDashoffset = useMemo(() => {
    return circumference * (1 - progress)
  }, [circumference, progress])

  if (!isVisible || timeRemaining === null) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
              const isActive = i < 10 - timeRemaining
              
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
              {timeRemaining}
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
