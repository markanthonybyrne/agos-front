import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Lock, AlertCircle } from 'lucide-react'
import { EraProgression } from '@/types/api.types'
import { EraBadge } from './EraBadge'

interface EraProgressionCardProps {
  eraProgression: EraProgression
  className?: string
}

export function EraProgressionCard({ eraProgression, className }: EraProgressionCardProps) {
  const { current_era, next_era, can_progress, requirements, progress_percentage } = eraProgression

  const eraNames: Record<number, string> = {
    1: 'Awakening',
    2: 'Expansion',
    3: 'Consolidation',
    4: 'Ascension',
    5: 'Supremacy',
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Era Progression</span>
          <EraBadge era={current_era} />
        </CardTitle>
        <CardDescription>
          {current_era < 5
            ? `Progress to ${eraNames[next_era] || `Era ${next_era}`}`
            : 'Maximum era reached'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {current_era < 5 ? (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress_percentage}%</span>
              </div>
              <Progress value={progress_percentage} className="h-2" />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Requirements to Unlock Next Era:</h4>
              <div className="space-y-2">
                {requirements.facilities.map((facility) => (
                  <div
                    key={facility.slug}
                    className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg"
                  >
                    {facility.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span
                      className={
                        facility.completed
                          ? 'text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      {facility.name}
                    </span>
                    {facility.completed && (
                      <Badge variant="outline" className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
                        Complete
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {requirements.message}
              </p>
            </div>

            {/* Status */}
            {can_progress && (
              <div className="flex items-center gap-2 p-3 bg-green/10 border border-green/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  Ready to progress to {eraNames[next_era] || `Era ${next_era}`}!
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-cyan/10 border border-cyan/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">
              You have reached the maximum era!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



