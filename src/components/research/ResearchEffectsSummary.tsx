import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResearchEffectsSummary as ResearchEffectsSummaryType } from '@/types/api.types'
import { formatNumber } from '@/lib/formatters'

interface ResearchEffectsSummaryProps {
  effectsSummary: ResearchEffectsSummaryType
  className?: string
}

export function ResearchEffectsSummary({ effectsSummary, className }: ResearchEffectsSummaryProps) {
  const { active_effects, effects_by_research } = effectsSummary

  // Group effects by category
  const productionEffects: Array<[string, number | boolean]> = []
  const combatEffects: Array<[string, number | boolean]> = []
  const travelEffects: Array<[string, number | boolean]> = []
  const otherEffects: Array<[string, number | boolean]> = []

  Object.entries(active_effects).forEach(([key, value]) => {
    if (
      key.includes('prod') ||
      key.includes('tellerium') ||
      key.includes('krypton') ||
      key.includes('upkeep')
    ) {
      productionEffects.push([key, value])
    } else if (
      key.includes('armor') ||
      key.includes('attack') ||
      key.includes('shield') ||
      key.includes('defence') ||
      key.includes('fleet') ||
      key.includes('detection')
    ) {
      combatEffects.push([key, value])
    } else if (key.includes('travel') || key.includes('ticks')) {
      travelEffects.push([key, value])
    } else {
      otherEffects.push([key, value])
    }
  })

  const formatEffectValue = (key: string, value: number | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled'
    }
    if (key.includes('mul') || key.includes('reduction')) {
      // Multiplier - show as percentage
      if (value < 1) {
        return `${(value * 100).toFixed(1)}% reduction`
      } else {
        return `${((value - 1) * 100).toFixed(1)}% increase`
      }
    }
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(1)}%`
    }
    return `+${formatNumber(value)}`
  }

  const formatEffectName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace('Mul', 'Multiplier')
      .replace('Per Tick', '/Tick')
  }

  const renderEffectGroup = (
    title: string,
    effects: Array<[string, number | boolean]>,
    color: string
  ) => {
    if (effects.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className={`text-sm font-semibold text-${color}-400`}>{title}</h4>
        <div className="space-y-1">
          {effects.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between text-sm p-2 bg-muted/20 rounded-lg"
            >
              <span className="text-muted-foreground">{formatEffectName(key)}</span>
              <Badge variant="outline" className={`text-${color}-400 border-${color}-500/30`}>
                {formatEffectValue(key, value)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Active Research Effects</CardTitle>
        <CardDescription>
          Summary of all active research effects applied to your empire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {productionEffects.length > 0 &&
          renderEffectGroup('Production Effects', productionEffects, 'green')}
        {combatEffects.length > 0 && renderEffectGroup('Combat Effects', combatEffects, 'red')}
        {travelEffects.length > 0 && renderEffectGroup('Travel Effects', travelEffects, 'cyan')}
        {otherEffects.length > 0 && renderEffectGroup('Other Effects', otherEffects, 'purple')}

        {Object.keys(active_effects).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active research effects</p>
            <p className="text-xs mt-2">Complete research to unlock effects</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



