import { TrendingUp } from 'lucide-react'
import { WidgetWindow } from './WidgetWindow'

interface EmpireStatusWidgetProps {
  score: number
  planetCount: number
  maxPlanets: number
  fleetCount: number
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function EmpireStatusWidget({ 
  score, 
  planetCount, 
  maxPlanets, 
  fleetCount,
  onMinimize,
  onClose,
  isMinimized
}: EmpireStatusWidgetProps) {
  return (
    <WidgetWindow
      title="Empire Status"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-purple/20"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Score</p>
          <p className="text-2xl font-bold text-primary">
            {score?.toLocaleString() || '0'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Planets</p>
          <p className="text-2xl font-bold">
            {planetCount} / {maxPlanets}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Fleets</p>
          <p className="text-2xl font-bold">
            {fleetCount}
          </p>
        </div>
      </div>
    </WidgetWindow>
  )
}

