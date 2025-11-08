import { useMemo } from 'react'
import { Activity, Rocket, FlaskConical, ArrowRight, Droplets, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { selectEmpireSecondaryCapacity, selectEmpireSecondaryCapacityUsed } from '@/app/selectors/resourceSelectors'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'
import { formatNumber } from '@/lib/formatters'

interface ActiveOperationsWidgetProps {
  fleetsInTransit: number
  activeResearch: number
}

export function ActiveOperationsWidget({ fleetsInTransit, activeResearch }: ActiveOperationsWidgetProps) {
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const secondaryDelta = useAppSelector((state) => state.game.secondaryResourceDelta)
  const secondaryCapacity = useAppSelector(selectEmpireSecondaryCapacity)
  const secondaryUsed = useAppSelector(selectEmpireSecondaryCapacityUsed)
  const { ledger, getMetadata } = useResourcesCatalog()

  const materialsEvents = useMemo(() => {
    if (!secondaryDelta) return []
    return Object.entries(secondaryDelta)
      .filter(([, amount]) => amount !== 0)
      .map(([slug, amount]) => {
        const metadata = getMetadata(slug)
        return {
          slug,
          label: metadata.name,
          amount,
          sign: amount > 0 ? '+' : amount < 0 ? '-' : '',
          color: metadata.color,
        }
      })
  }, [secondaryDelta, getMetadata])

  const totalMaterialsDelta = useMemo(
    () => materialsEvents.reduce((sum, entry) => sum + entry.amount, 0),
    [materialsEvents],
  )

  const isNearCapacity =
    secondaryCapacity > 0 && secondaryUsed / secondaryCapacity >= 0.9 && ledger.length > 0

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
          {(materialsEvents.length > 0 || isNearCapacity) && (
            <div className="flex flex-col gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-cyan-300" />
                  <div>
                    <p className="font-semibold text-cyan-200">Materials Intake</p>
                    <p className="text-xs text-muted-foreground">
                      Ledger updated with latest extraction tick
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openPanel(PanelType.BOOSTERS, PanelSize.MEDIUM)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Boost Yield <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              {materialsEvents.length > 0 && (
                <div className="space-y-1">
                  {materialsEvents.map((event) => (
                    <div key={event.slug} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        {event.label}
                      </span>
                      <span className="font-mono text-cyan-100">
                        {event.sign}
                        {formatNumber(Math.abs(event.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {totalMaterialsDelta !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Net change:{' '}
                  <span className="font-semibold text-cyan-100">
                    {totalMaterialsDelta > 0 ? '+' : '-'}
                    {formatNumber(Math.abs(totalMaterialsDelta))}
                  </span>
                </div>
              )}
              {isNearCapacity && (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  Storage nearing capacity — expand vaults or trade materials.
                </div>
              )}
            </div>
          )}
          {fleetsInTransit > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="font-semibold">{fleetsInTransit} Fleet{fleetsInTransit !== 1 ? 's' : ''} in Transit</p>
                  <p className="text-sm text-muted-foreground">Check fleet status</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/fleets')
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
              >
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/planets')
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
              >
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

