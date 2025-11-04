import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { DarkMatterInfo } from '@/types/api.types'
import { formatNumber } from '@/lib/formatters'

interface DarkMatterDisplayProps {
  darkMatterInfo: DarkMatterInfo
  className?: string
}

export function DarkMatterDisplay({ darkMatterInfo, className }: DarkMatterDisplayProps) {
  const {
    dark_matter_current,
    dark_matter_capacity,
    production_per_tick,
    capacity_utilization,
    production_by_planet,
  } = darkMatterInfo

  const isNearCapacity = capacity_utilization > 0.8
  const isAtCapacity = capacity_utilization >= 1.0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Dark Matter</span>
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Era 5 Resource
          </Badge>
        </CardTitle>
        <CardDescription>
          Exotic resource for late-game content. Produced at empire level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current and Capacity */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className="font-mono text-purple-400">
              {formatNumber(dark_matter_current)} / {formatNumber(dark_matter_capacity)}
            </span>
          </div>
          <Progress
            value={capacity_utilization * 100}
            className={`h-3 ${
              isAtCapacity
                ? 'bg-destructive'
                : isNearCapacity
                ? 'bg-yellow-500'
                : 'bg-purple-500'
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(capacity_utilization * 100)}% capacity</span>
            <span>+{formatNumber(production_per_tick)}/tick</span>
          </div>
        </div>

        {/* Warnings */}
        {isAtCapacity && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              Dark matter capacity reached! Production overflow is being discarded.
            </span>
          </div>
        )}
        {isNearCapacity && !isAtCapacity && (
          <div className="flex items-center gap-2 p-3 bg-yellow/10 border border-yellow/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              Dark matter capacity nearly full ({Math.round(capacity_utilization * 100)}%)
            </span>
          </div>
        )}

        {/* Production Breakdown by Planet */}
        {production_by_planet && production_by_planet.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold">Production by Planet:</h4>
            <div className="space-y-1">
              {production_by_planet.map((planet) => (
                <div
                  key={planet.planet_id}
                  className="flex justify-between text-sm p-2 bg-muted/20 rounded-lg"
                >
                  <span className="text-muted-foreground">{planet.planet_name}</span>
                  <span className="text-purple-400 font-mono">
                    +{formatNumber(planet.production_per_tick)}/tick
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

