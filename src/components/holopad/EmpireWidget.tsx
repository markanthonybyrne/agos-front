import { Avatar } from '@/components/common/Avatar'
import { getUserAvatarUrl } from '@/lib/avatar'
import { formatTickETA } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EmpireWidgetProps {
  empireName: string
  user: any
  currentTick: number
  nextTickETA: string
}

export function EmpireWidget({ empireName, user, currentTick, nextTickETA }: EmpireWidgetProps) {
  return (
    <Card className="panel-glass border-cyan/20 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={getUserAvatarUrl(user)}
              name={empireName}
              size="xl"
              className="border-2 border-cyan/50 shadow-lg shadow-cyan/20"
            />
            <div>
              <CardTitle className="text-3xl font-heading glow-cyan">
                Command Center
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {empireName} • Tick {currentTick?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Next Tick</p>
            <p className="text-xl font-mono font-bold text-primary">
              {nextTickETA ? formatTickETA(nextTickETA) : 'N/A'}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

