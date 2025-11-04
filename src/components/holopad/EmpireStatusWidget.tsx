import { TrendingUp } from 'lucide-react'
import { WidgetWindow } from './WidgetWindow'
import { EraBadge } from '@/components/era/EraBadge'
import { SpecializationBadge } from '@/components/specialization/SpecializationBadge'

interface EmpireStatusWidgetProps {
  score: number
  planetCount: number
  maxPlanets: number
  fleetCount: number
  activeEra?: number
  specializationsUnlocked?: string[]
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function EmpireStatusWidget({ 
  score, 
  planetCount, 
  maxPlanets, 
  fleetCount,
  activeEra,
  specializationsUnlocked = [],
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
        {activeEra && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Era</p>
            <div className="flex items-center gap-2">
              <EraBadge era={activeEra} />
            </div>
          </div>
        )}
        {specializationsUnlocked.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Specializations</p>
            <div className="flex flex-wrap gap-1">
              {specializationsUnlocked.map((spec) => (
                <SpecializationBadge key={spec} specialization={spec as 'industrial' | 'military' | 'relic'} />
              ))}
            </div>
          </div>
        )}
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

