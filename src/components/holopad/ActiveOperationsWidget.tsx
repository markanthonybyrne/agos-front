import { Activity, Rocket, FlaskConical, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

interface ActiveOperationsWidgetProps {
  fleetsInTransit: number
  activeResearch: number
}

export function ActiveOperationsWidget({ fleetsInTransit, activeResearch }: ActiveOperationsWidgetProps) {
  const navigate = useNavigate()

  return (
    <Card className="panel-glass border-yellow-500/20 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <Activity className="w-5 h-5" />
          Active Operations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {fleetsInTransit > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="font-semibold">{fleetsInTransit} Fleet{fleetsInTransit !== 1 ? 's' : ''} in Transit</p>
                  <p className="text-sm text-muted-foreground">Check fleet status</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/fleets')}>
                View <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
          {activeResearch > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-semibold">{activeResearch} Active Research</p>
                  <p className="text-sm text-muted-foreground">Research in progress</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/planets')}>
                View <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
          {fleetsInTransit === 0 && activeResearch === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No active operations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

