import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useGetConstructionQueueQuery } from '@/api/endpoints/planetsApi'
import { useCancelFacilityConstructionMutation } from '@/api/endpoints/facilitiesApi'
import { useCancelDefenceConstructionMutation } from '@/api/endpoints/defencesApi'
import { useCancelShipConstructionMutation } from '@/api/endpoints/shipsApi'
import { useCancelResearchMutation } from '@/api/endpoints/researchApi'
import { ConstructionQueueItem } from '@/types/api.types'
import { formatResource } from '@/lib/formatters'
import { Clock, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { apiSlice } from '@/api/apiSlice'
import { useAppSelector } from '@/app/hooks'
import { ConstructionCard } from './ConstructionCard'
import { QueueStats } from './QueueStats'
import { Skeleton } from '@/components/ui/skeleton'

interface ConstructionQueueProps {
  planetId: number
  onConstructionComplete?: () => void
}

export function ConstructionQueue({ 
  planetId, 
  onConstructionComplete 
}: ConstructionQueueProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const empire = useAppSelector((state) => state.auth.empire)

  const { data: constructionData, isLoading, error, refetch } = useGetConstructionQueueQuery(planetId, {
    // Refetch when the component mounts or when planetId changes
    refetchOnMountOrArgChange: true,
    // Remove polling - rely on WebSocket events instead
    pollingInterval: 0,
  })
  const [cancelFacility] = useCancelFacilityConstructionMutation()
  const [cancelDefence] = useCancelDefenceConstructionMutation()
  const [cancelShip] = useCancelShipConstructionMutation()
  const [cancelResearch] = useCancelResearchMutation()

  const constructions = constructionData?.construction_queue || []

  // Subscribe to WebSocket events for real-time construction updates
  useEffect(() => {
    if (!empire) return

    // Listen for tick.processed events (items complete at tick time)
    const handleTickProcessed = () => {
      // Immediately refetch construction queue when tick processes
      // This ensures items are marked as completed exactly when the tick completes
      refetch()
      
      // Call optional callback if provided
      if (onConstructionComplete) {
        onConstructionComplete()
      }
    }

    // Listen for construction.completed events (fired when specific items complete)
    const handleConstructionUpdated = (event: CustomEvent) => {
      const { planetId: eventPlanetId, completed } = event.detail
      
      // Only refetch if this event is for our planet
      if (eventPlanetId === planetId) {
        // Always refetch when construction updates (completion or progress change)
        // This ensures progress and ticks_remaining are up-to-date
        refetch()
        
        // Call optional callback if provided
        if (completed && onConstructionComplete) {
          onConstructionComplete()
        }
      }
    }

    // Subscribe to custom events dispatched by WebSocket handlers
    window.addEventListener('tick:processed', handleTickProcessed)
    window.addEventListener('planet:construction:updated', handleConstructionUpdated as EventListener)

    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
      window.removeEventListener('planet:construction:updated', handleConstructionUpdated as EventListener)
    }
  }, [empire, planetId, refetch, onConstructionComplete])


  const handleCancel = async (construction: ConstructionQueueItem) => {
    if (cancellingId === construction.id) return

    setCancellingId(construction.id)

    try {
      let result
      switch (construction.type) {
        case 'facility':
          result = await cancelFacility({
            planetId,
            constructionId: construction.id,
          }).unwrap()
          break
        case 'defence':
          result = await cancelDefence({
            planetId,
            constructionId: construction.id,
          }).unwrap()
          break
        case 'ship':
          result = await cancelShip({
            planetId,
            constructionId: construction.id,
          }).unwrap()
          break
        case 'research':
          result = await cancelResearch({
            planetId,
            constructionId: construction.id,
          }).unwrap()
          break
        default:
          throw new Error('Unknown construction type')
      }

      toast.success(result.data?.message || 'Construction cancelled successfully')
      
      if (result.data?.refund) {
        toast.info(
          `Refunded: ${formatResource(result.data.refund.tellerium)} T, ${formatResource(result.data.refund.krypton)} K`
        )
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to cancel construction')
    } finally {
      setCancellingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Construction Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="panel-glass border-red/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-400" />
            Construction Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 text-sm">
            Failed to load construction queue. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (constructions.length === 0) {
    return (
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Construction Queue
          </CardTitle>
          <CardDescription>
            No ongoing constructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mb-4"
            >
              <Clock className="w-16 h-16 text-muted-foreground/30" />
            </motion.div>
            <p className="text-muted-foreground text-sm mb-2">
              Queue is empty
            </p>
            <p className="text-muted-foreground/70 text-xs">
              Start building facilities, defences, ships, or research to see them here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="panel-glass border-cyan/20">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <CardTitle>Construction Queue</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-3">
          <QueueStats constructions={constructions} />
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {constructions.map((construction) => (
            <ConstructionCard
              key={construction.id}
              construction={construction}
              onCancel={handleCancel}
              isCancelling={cancellingId === construction.id}
            />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
