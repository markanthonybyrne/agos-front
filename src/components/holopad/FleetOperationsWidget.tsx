import { Rocket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCoordinate } from '@/lib/coordinates'
import { FleetDetails } from '@/types/api.types'
import { useNavigate } from 'react-router-dom'
import { WidgetWindow } from './WidgetWindow'

interface FleetOperationsWidgetProps {
  fleetsInTransit: FleetDetails[]
  fleetsStationed: FleetDetails[]
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function FleetOperationsWidget({ 
  fleetsInTransit, 
  fleetsStationed,
  onMinimize,
  onClose,
  isMinimized 
}: FleetOperationsWidgetProps) {
  const navigate = useNavigate()

  return (
    <WidgetWindow
      title="Fleet Operations"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-blue/20"
    >
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">In Transit</span>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                {fleetsInTransit.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{fleetsInTransit.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Fleets traveling</p>
          </div>
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Stationed</span>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {fleetsStationed.length}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{fleetsStationed.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Fleets on planets</p>
          </div>
        </div>
        {fleetsInTransit.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold mb-2">Fleets in Transit:</p>
            {fleetsInTransit.slice(0, 3).map((fleet: FleetDetails) => (
              <div key={fleet.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span className="font-mono text-xs">
                  {formatCoordinate(fleet.destination_coordinate)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {fleet.order_type}
                </Badge>
              </div>
            ))}
            {fleetsInTransit.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/fleets')}>
                View {fleetsInTransit.length - 3} more... <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
        <div className="pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/fleets')} className="w-full">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
    </WidgetWindow>
  )
}

