import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Settings, Shield, Ship, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConstructionQueueItem } from '@/types/api.types'
import { ProgressRing } from './ProgressRing'
import { getFacilityImage } from '@/lib/facilityImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { getShipImage } from '@/lib/shipImages'
import { formatResource } from '@/lib/formatters'
import { useAppSelector } from '@/app/hooks'

interface ConstructionCardProps {
  construction: ConstructionQueueItem
  onCancel: (construction: ConstructionQueueItem) => void
  isCancelling?: boolean
}

export function ConstructionCard({ construction, onCancel, isCancelling }: ConstructionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tickUpdateTrigger, setTickUpdateTrigger] = useState(0)

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'facility':
        return Settings
      case 'defence':
        return Shield
      case 'ship':
        return Ship
      case 'research':
        return FlaskConical
      default:
        return Settings
    }
  }

  const getItemColor = (type: string): 'cyan' | 'purple' | 'red' | 'blue' | 'green' => {
    switch (type) {
      case 'facility':
        return 'purple'
      case 'defence':
        return 'red'
      case 'ship':
        return 'blue'
      case 'research':
        return 'green'
      default:
        return 'cyan'
    }
  }

  const getItemImage = (type: string, slug: string): string | undefined => {
    switch (type) {
      case 'facility':
        return getFacilityImage(slug)
      case 'defence':
        return getDefenseImage(slug)
      case 'ship':
        return getShipImage(slug)
      default:
        return undefined
    }
  }

  const Icon = getItemIcon(construction.type)
  const color = getItemColor(construction.type)
  const itemImage = getItemImage(construction.type, construction.item_slug)
  const currentTick = useAppSelector((state) => state.game.currentTick)
  const tickIntervalSeconds = useAppSelector((state) => state.game.tickIntervalSeconds)
  
  // Calculate progress based on ticks (more accurate than time-based)
  // Progress is calculated as: (total_ticks - ticks_remaining) / total_ticks
  // We infer total_ticks from started_at and completes_at if available, otherwise use current progress
  const calculateTickBasedProgress = useMemo(() => {
    const ticksRemaining = construction.ticks_remaining || 0
    
    // If completed, progress is 100%
    if (construction.is_completed || ticksRemaining <= 0) {
      return 100
    }
    
    // Try to calculate total ticks from start and completion dates
    if (construction.started_at && construction.completes_at) {
      try {
        const startDate = new Date(construction.started_at)
        const completeDate = new Date(construction.completes_at)
        const totalMs = completeDate.getTime() - startDate.getTime()
        
        // If we have tick interval, calculate total ticks
        if (tickIntervalSeconds && tickIntervalSeconds > 0) {
          const totalSeconds = totalMs / 1000
          const totalTicks = Math.ceil(totalSeconds / tickIntervalSeconds)
          
          if (totalTicks > 0) {
            const progressTicks = totalTicks - ticksRemaining
            const progress = Math.max(0, Math.min(100, (progressTicks / totalTicks) * 100))
            return progress
          }
        }
      } catch (e) {
        // Fall through to API progress
      }
    }
    
    // Fallback to API progress_percentage if we can't calculate from ticks
    // But update it based on ticks_remaining decreasing
    return construction.progress_percentage || 0
  }, [construction.ticks_remaining, construction.is_completed, construction.started_at, construction.completes_at, construction.progress_percentage, tickIntervalSeconds, tickUpdateTrigger])
  
  const progress = calculateTickBasedProgress
  const isNearCompletion = progress >= 90 || construction.ticks_remaining <= 1
  const isCompleted = construction.is_completed || progress >= 100 || construction.ticks_remaining <= 0
  
  // Update progress when tick processes or construction updates (via WebSocket)
  useEffect(() => {
    const handleTickProcessed = () => {
      // Force re-calculation of progress when tick processes
      // This ensures progress updates even if construction data hasn't refetched yet
      setTickUpdateTrigger(prev => prev + 1)
    }
    
    const handleConstructionUpdated = (event: CustomEvent) => {
      const { planetId: eventPlanetId, completed } = event.detail
      // If this construction completed, ensure UI updates
      if (completed) {
        // Force update to show completion
        setTickUpdateTrigger(prev => prev + 1)
      }
    }
    
    window.addEventListener('tick:processed', handleTickProcessed)
    window.addEventListener('planet:construction:updated', handleConstructionUpdated as EventListener)
    
    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
      window.removeEventListener('planet:construction:updated', handleConstructionUpdated as EventListener)
    }
  }, [construction.id])

  // Format item name
  const itemName = construction.item_slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'panel-glass border-border/50 hover:border-primary/30 transition-all',
          'relative overflow-hidden',
          isNearCompletion && 'border-cyan-400/50',
          isCompleted && 'opacity-75'
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Holographic glow effect */}
        {isNearCompletion && !isCompleted && (
          <motion.div
            className={cn(
              'absolute inset-0 pointer-events-none',
              color === 'cyan' && 'bg-cyan-400/5',
              color === 'purple' && 'bg-purple-400/5',
              color === 'red' && 'bg-red-400/5',
              color === 'blue' && 'bg-blue-400/5',
              color === 'green' && 'bg-green-400/5'
            )}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Item Image */}
            <motion.div
              className="flex-shrink-0 relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {itemImage ? (
                <div className="relative">
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-24 h-24 object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                  {/* Glow overlay */}
                  <div
                    className={cn(
                      'absolute inset-0 rounded-lg pointer-events-none',
                      color === 'cyan' && 'bg-cyan-400/20 blur-xl',
                      color === 'purple' && 'bg-purple-400/20 blur-xl',
                      color === 'red' && 'bg-red-400/20 blur-xl',
                      color === 'blue' && 'bg-blue-400/20 blur-xl',
                      color === 'green' && 'bg-green-400/20 blur-xl'
                    )}
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    'w-24 h-24 rounded-lg flex items-center justify-center',
                    'bg-muted/20 border-2 border-border/50',
                    color === 'cyan' && 'border-cyan-400/30',
                    color === 'purple' && 'border-purple-400/30',
                    color === 'red' && 'border-red-400/30',
                    color === 'blue' && 'border-blue-400/30',
                    color === 'green' && 'border-green-400/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-12 h-12',
                      color === 'cyan' && 'text-cyan-400',
                      color === 'purple' && 'text-purple-400',
                      color === 'red' && 'text-red-400',
                      color === 'blue' && 'text-blue-400',
                      color === 'green' && 'text-green-400'
                    )}
                  />
                </div>
              )}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-lg font-semibold truncate">{itemName}</h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        color === 'cyan' && 'border-cyan-400/50 text-cyan-400',
                        color === 'purple' && 'border-purple-400/50 text-purple-400',
                        color === 'red' && 'border-red-400/50 text-red-400',
                        color === 'blue' && 'border-blue-400/50 text-blue-400',
                        color === 'green' && 'border-green-400/50 text-green-400'
                      )}
                    >
                      {construction.type}
                    </Badge>
                    {construction.quantity > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        ×{construction.quantity}
                      </Badge>
                    )}
                    {construction.level && (
                      <Badge variant="secondary" className="text-xs">
                        Lv.{construction.level}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                        COMPLETE
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Cancel Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel(construction)
                  }}
                  disabled={isCancelling || isCompleted}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Progress Section */}
              <div className="flex items-center gap-4">
                {/* Progress Ring */}
                <ProgressRing
                  progress={progress}
                  size={60}
                  strokeWidth={5}
                  color={color}
                  animated={!isCompleted}
                >
                  <span className="text-xs font-bold text-foreground">
                    {Math.round(progress)}%
                  </span>
                </ProgressRing>

                {/* Progress Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono text-foreground">
                      {construction.ticks_remaining} ticks remaining
                    </span>
                  </div>
                  {/* Linear progress bar as backup */}
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        color === 'cyan' && 'bg-cyan-400',
                        color === 'purple' && 'bg-purple-400',
                        color === 'red' && 'bg-red-400',
                        color === 'blue' && 'bg-blue-400',
                        color === 'green' && 'bg-green-400'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        boxShadow: `0 0 8px ${color === 'cyan' ? 'rgba(34,211,238,0.6)' : 
                          color === 'purple' ? 'rgba(168,85,247,0.6)' :
                          color === 'red' ? 'rgba(248,113,113,0.6)' :
                          color === 'blue' ? 'rgba(96,165,250,0.6)' :
                          'rgba(74,222,128,0.6)'}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-border/50"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <span className="ml-2 font-mono">
                          {new Date(construction.started_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="ml-2 font-mono">
                          {formatResource(construction.cost_tellerium)} T
                          {construction.cost_krypton > 0 && (
                            <> / {formatResource(construction.cost_krypton)} K</>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

