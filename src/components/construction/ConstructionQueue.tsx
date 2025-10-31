import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetConstructionQueueQuery } from '@/api/endpoints/planetsApi'
import { useCancelFacilityConstructionMutation } from '@/api/endpoints/facilitiesApi'
import { useCancelDefenceConstructionMutation } from '@/api/endpoints/defencesApi'
import { useCancelShipConstructionMutation } from '@/api/endpoints/shipsApi'
import { useCancelResearchMutation } from '@/api/endpoints/researchApi'
import { ConstructionQueueItem } from '@/types/api.types'
import { formatResource, formatDateTime } from '@/lib/formatters'
import { 
  Settings, 
  Shield, 
  Ship, 
  FlaskConical, 
  X, 
  Clock,
  RefreshCw
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { getFacilityImage } from '@/lib/facilityImages'
import { getDefenseImage } from '@/lib/defenseImages'
import { getShipImage } from '@/lib/shipImages'
import { toast } from 'sonner'
import { apiSlice } from '@/api/apiSlice'
import { useAppSelector } from '@/app/hooks'

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
    // Poll for updates every 30 seconds as a fallback
    pollingInterval: 30000,
  })
  const [cancelFacility] = useCancelFacilityConstructionMutation()
  const [cancelDefence] = useCancelDefenceConstructionMutation()
  const [cancelShip] = useCancelShipConstructionMutation()
  const [cancelResearch] = useCancelResearchMutation()

  const constructions = constructionData?.construction_queue || []

  // Subscribe to WebSocket events for this planet's construction updates
  useEffect(() => {
    if (!empire) return

    // RTK Query will automatically refetch when tags are invalidated
    // But we can also manually refetch when planet.updated events occur
    // The WebSocket hook already invalidates tags, so this should work automatically
    // However, we'll keep the refetch capability for manual refresh button
  }, [empire, planetId])

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
        return Clock
    }
  }

  const getItemColor = (type: string) => {
    switch (type) {
      case 'facility':
        return 'text-purple-400'
      case 'defence':
        return 'text-red-400'
      case 'ship':
        return 'text-blue-400'
      case 'research':
        return 'text-green-400'
      default:
        return 'text-muted-foreground'
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
            <Clock className="w-5 h-5 text-cyan-400" />
            Construction Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/10 rounded-lg animate-pulse" />
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
            <Clock className="w-5 h-5 text-red-400" />
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
            <Clock className="w-5 h-5 text-cyan-400" />
            Construction Queue
          </CardTitle>
          <CardDescription>
            No ongoing constructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Start building facilities, defences, ships, or research to see them here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="panel-glass border-cyan/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
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
        <CardDescription>
          {constructions.length} ongoing construction{constructions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {constructions.map((construction) => {
          const Icon = getItemIcon(construction.type)
          const isCancelling = cancellingId === construction.id
          const itemImage = getItemImage(construction.type, construction.item_slug)
          const total = (construction as any).build_time_ticks ?? (construction as any).build_time ?? 0
          const remaining = (construction as any).ticks_remaining ?? 0
          const done = Math.max(0, total - remaining)
          const progressPercent = total > 0 ? Math.min(100, (done / total) * 100) : 0

          return (
            <Card
              key={construction.id}
              className="panel-glass border-border/50 hover:border-primary/30 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Large Image */}
                  <div className="flex-shrink-0">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={construction.item_slug.replace(/_/g, ' ')}
                        className="w-32 h-32 object-contain large-image-display"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <div className="w-32 h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                        <Icon className={`w-16 h-16 ${getItemColor(construction.type)} opacity-50`} />
                      </div>
                    )}
                  </div>
                  
                  {/* Info and Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold">
                            {construction.item_slug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {construction.type}
                          </Badge>
                          {construction.quantity > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              x{construction.quantity}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Completes: {formatDateTime(construction.completes_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(construction)}
                        disabled={isCancelling || construction.is_completed}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono">
                          {done}/{total} {total ? 'ticks' : ''} ({Math.round(progressPercent)}%)
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
