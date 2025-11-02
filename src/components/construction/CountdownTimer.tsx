import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'

interface CountdownTimerProps {
  completesAt: string
  ticksRemaining?: number
  className?: string
}

export function CountdownTimer({ completesAt, ticksRemaining, className }: CountdownTimerProps) {
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds) || 300 // Default to 5 minutes
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA)
  
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number
    minutes: number
    seconds: number
    totalSeconds: number
  } | null>(null)

  useEffect(() => {
    const updateTimer = () => {
      try {
        // First, try to use completes_at if it's a valid date
        if (completesAt) {
          const completion = new Date(completesAt)
          
          // Check if date is valid
          if (!isNaN(completion.getTime())) {
            const now = new Date()
            const diff = completion.getTime() - now.getTime()

            if (diff > 0) {
              const totalSeconds = Math.floor(diff / 1000)
              const hours = Math.floor(totalSeconds / 3600)
              const minutes = Math.floor((totalSeconds % 3600) / 60)
              const seconds = totalSeconds % 60

              setTimeRemaining({ hours, minutes, seconds, totalSeconds })
              return
            }
          }
        }
        
        // Fallback: Calculate from ticks_remaining if available
        if (ticksRemaining !== undefined && ticksRemaining !== null && ticksRemaining >= 0) {
          let totalSeconds = 0
          
          if (nextTickETA) {
            // We know when the next tick is, so calculate more accurately
            const nextTick = new Date(nextTickETA)
            const now = new Date()
            const timeUntilNextTick = Math.max(0, (nextTick.getTime() - now.getTime()) / 1000)
            
            if (ticksRemaining === 0) {
              // Completion is this tick, use time until next tick
              totalSeconds = timeUntilNextTick
            } else {
              // Time until next tick + (remaining ticks - 1) * interval
              totalSeconds = timeUntilNextTick + (ticksRemaining - 1) * tickIntervalSeconds
            }
          } else {
            // No next tick info, use simple calculation
            totalSeconds = ticksRemaining * tickIntervalSeconds
          }
          
          const hours = Math.floor(totalSeconds / 3600)
          const minutes = Math.floor((totalSeconds % 3600) / 60)
          const seconds = Math.floor(totalSeconds % 60)
          
          setTimeRemaining({ hours, minutes, seconds, totalSeconds: Math.floor(totalSeconds) })
          return
        }
        
        // If we can't calculate, show 0
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 })
      } catch (error) {
        console.error('Error calculating countdown:', error, { completesAt, ticksRemaining })
        // Fallback to ticks-based calculation
        if (ticksRemaining !== undefined && ticksRemaining !== null && ticksRemaining >= 0) {
          let totalSeconds = ticksRemaining * tickIntervalSeconds
          
          if (nextTickETA) {
            const nextTick = new Date(nextTickETA)
            const now = new Date()
            const timeUntilNextTick = Math.max(0, (nextTick.getTime() - now.getTime()) / 1000)
            totalSeconds = timeUntilNextTick + (ticksRemaining - 1) * tickIntervalSeconds
          }
          
          const hours = Math.floor(totalSeconds / 3600)
          const minutes = Math.floor((totalSeconds % 3600) / 60)
          const seconds = Math.floor(totalSeconds % 60)
          
          setTimeRemaining({ hours, minutes, seconds, totalSeconds: Math.floor(totalSeconds) })
        } else {
          setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 })
        }
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [completesAt, ticksRemaining, tickIntervalSeconds, nextTickETA])

  if (!timeRemaining) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Clock className="w-4 h-4" />
        <span>Calculating...</span>
      </div>
    )
  }

  const { hours, minutes, seconds, totalSeconds } = timeRemaining

  // Determine urgency color
  const getUrgencyColor = () => {
    if (totalSeconds <= 60) return 'text-red-400' // Less than 1 minute
    if (totalSeconds <= 300) return 'text-yellow-400' // Less than 5 minutes
    return 'text-green-400' // More than 5 minutes
  }

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const isUrgent = totalSeconds <= 300 // Less than 5 minutes

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 text-sm font-mono',
        getUrgencyColor(),
        className
      )}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={{
        duration: 2,
        repeat: isUrgent ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <Clock className="w-4 h-4" />
      <AnimatePresence mode="wait">
        <motion.span
          key={totalSeconds}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'font-semibold',
            isUrgent && 'glow-cyan'
          )}
        >
          {formatTime()}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}

