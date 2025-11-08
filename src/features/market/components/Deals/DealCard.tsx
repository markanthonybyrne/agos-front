import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DealResourceList } from './DealResourceList'
import { MarketDeal } from '@/api/endpoints/dealsApi'
import { formatDateTime, formatNumber } from '@/lib/formatters'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealCardProps {
  deal: MarketDeal
  onAccept?: (deal: MarketDeal) => void
  onCancel?: (deal: MarketDeal) => void
  showActions?: boolean
  isAccepting?: boolean
  isCancelling?: boolean
}

export function DealCard({
  deal,
  onAccept,
  onCancel,
  showActions = false,
  isAccepting,
  isCancelling,
}: DealCardProps) {
  const { getMetadata } = useResourcesCatalog()
  const isOpen = deal.status === 'open'

  const dealStatusBadge = (() => {
    switch (deal.status) {
      case 'open':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
          >
            Open
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/40">
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-300 border-gray-500/40">
            Cancelled
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/40">
            Expired
          </Badge>
        )
      default:
        return <Badge variant="outline">{deal.status}</Badge>
    }
  })()

  const expiresLabel = deal.expires_at ? formatDateTime(deal.expires_at) : 'No expiry'

  const totalOffered = deal.offered_resources.reduce((sum, resource) => sum + resource.quantity, 0)
  const totalRequested = deal.requested_resources.reduce(
    (sum, resource) => sum + resource.quantity,
    0,
  )

  return (
    <Card className="panel-glass border-border/40">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {deal.creator_empire.name}
              <span className="text-muted-foreground text-sm">Deal #{deal.id}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Expires: {expiresLabel}
            </CardDescription>
          </div>
          {dealStatusBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DealResourceList title="Offering" resources={deal.offered_resources} />
          <DealResourceList title="Requesting" resources={deal.requested_resources} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p>
              <strong className="text-foreground">Offered total:</strong>{' '}
              {formatNumber(totalOffered)} units
            </p>
            {deal.creator_planet_id && <p>Source planet: #{deal.creator_planet_id}</p>}
            {deal.creator_receive_planet_id && (
              <p>Receive planet: #{deal.creator_receive_planet_id}</p>
            )}
          </div>
          <div className="space-y-1">
            <p>
              <strong className="text-foreground">Requested total:</strong>{' '}
              {formatNumber(totalRequested)} units
            </p>
            {deal.responder_planet_id && <p>Responder source planet: #{deal.responder_planet_id}</p>}
            {deal.responder_receive_planet_id && (
              <p>Responder receive planet: #{deal.responder_receive_planet_id}</p>
            )}
          </div>
        </div>

        {showActions && isOpen && (
          <div className="flex flex-wrap gap-3 justify-end">
            {onAccept && (
              <Button
                variant="default"
                className="bg-emerald-500/80 hover:bg-emerald-500"
                onClick={() => onAccept(deal)}
                disabled={isAccepting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isAccepting ? 'Accepting...' : 'Accept Deal'}
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(deal)}
                disabled={isCancelling}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {isCancelling ? 'Cancelling...' : 'Cancel Deal'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


