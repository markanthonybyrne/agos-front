import type { ReactNode } from 'react'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePanel } from '@/components/common/PanelManager'
import { PanelSize, PanelType } from '@/app/slices/panelSlice'
import {
  useGetBuildableItemsQuery,
  useGetConstructionQueueQuery,
} from '@/api/endpoints/planetsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cog, PanelRightOpen, PanelRightClose, Hammer, Clock, ExternalLink, ChevronDown, ChevronUp, Users, Target } from 'lucide-react'
import { BuildableItems as BuildableItemsSection } from '@/components/construction/BuildableItems'
import { formatResource } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { ConstructionQueueItem, Planet } from '@/types/api.types'
import { useConstructionProgress } from '@/hooks/useConstructionProgress'
import { PlanetPopulationPanel } from '@/components/planet/population/PlanetPopulationPanel'
import { FleetActionsPanel } from '@/components/planet/population/FleetActionsPanel'

interface PlanetBuildConsoleProps {
  planet: Planet
  onGridRefresh?: () => void
}

export function PlanetBuildConsole({ planet, onGridRefresh }: PlanetBuildConsoleProps) {
  const planetId = planet.id
  const { openPanel } = usePanel()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sectionState, setSectionState] = useState({
    population: true,
    fleet: true,
    queue: true,
    buildables: true,
  })
  const completedSignatureRef = useRef<string>('')
  const lastQueueCountRef = useRef<number>(0)

  const {
    data: buildableItems,
    isFetching: isFetchingBuildables,
  } = useGetBuildableItemsQuery(planetId, {
    skip: !planetId,
  })

  const {
    data: constructionQueue,
    isFetching: isFetchingQueue,
  } = useGetConstructionQueueQuery(planetId, {
    skip: !planetId,
    pollingInterval: 15000,
  })

  const { progressData } = useConstructionProgress(planetId)

  useEffect(() => {
    if (!constructionQueue?.construction_queue) return

    const completedSignature = constructionQueue.construction_queue
      .filter((item) => item.is_completed || (item.progress_percentage ?? 0) >= 100)
      .map((item) => `${item.id}:${item.is_completed}:${Math.round(item.progress_percentage ?? 0)}`)
      .join('|')

    if (completedSignature && completedSignature !== completedSignatureRef.current) {
      completedSignatureRef.current = completedSignature
      onGridRefresh?.()
    }

    if (!completedSignature && completedSignatureRef.current) {
      completedSignatureRef.current = ''
    }

    const currentCount = constructionQueue.construction_queue.length
    if (lastQueueCountRef.current && currentCount < lastQueueCountRef.current) {
      onGridRefresh?.()
    }
    lastQueueCountRef.current = currentCount
  }, [constructionQueue?.construction_queue, onGridRefresh])

  const activeQueueItems = useMemo<ConstructionQueueItem[]>(() => {
    if (!constructionQueue?.construction_queue) return []
    return constructionQueue.construction_queue
      .map((item) => {
        const progress = progressData.find((p) => p.itemId === item.id)
        return {
          ...item,
          progress_percentage: progress?.progress ?? item.progress_percentage ?? 0,
        }
      })
      .sort((a, b) => {
        if (a.is_completed === b.is_completed) {
          return new Date(a.completes_at).getTime() - new Date(b.completes_at).getTime()
        }
        return a.is_completed ? 1 : -1
      })
  }, [constructionQueue?.construction_queue, progressData])

  const handleOpenTechTree = () => {
    onGridRefresh?.()
    navigate(`/tech-tree?planetId=${planetId}`)
  }

  const handleBuildAction = (type: string, slug: string) => {
    const buildTypeMap: Record<string, 'facility' | 'defense' | 'ship'> = {
      facilities: 'facility',
      defences: 'defense',
      ships: 'ship',
    }

    if (type === 'research') {
      openPanel(PanelType.RESEARCH_DETAIL, PanelSize.MEDIUM, {
        slug,
        planetId,
      })
      return
    }

    const mappedType = buildTypeMap[type]
    if (!mappedType) return

    openPanel(PanelType.BUILD_DETAIL, PanelSize.MEDIUM, {
      type: mappedType,
      slug,
      planetId,
    })
  }

  const queueIsEmpty = !activeQueueItems || activeQueueItems.length === 0

  useEffect(() => {
    setSectionState({
      population: true,
      fleet: true,
      queue: true,
      buildables: true,
    })
  }, [planetId])

  const toggleSection = useCallback((key: 'population' | 'fleet' | 'queue' | 'buildables') => {
    setSectionState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  return (
    <div className="pointer-events-auto fixed right-8 top-16 z-[10004]">
      {isCollapsed && (
        <Button
          variant="outline"
          size="icon"
          className="mb-3 ml-auto mr-2 flex h-10 w-10 items-center justify-center border-cyan-500/40 bg-black/70 text-cyan-200 hover:bg-black/80"
          onClick={() => setIsCollapsed(false)}
        >
          <PanelRightOpen className="h-5 w-5" />
        </Button>
      )}

      <div
        className={cn(
          'flex max-h-[80vh] flex-col overflow-hidden transition-all duration-300',
          isCollapsed ? 'w-14' : 'w-[360px]'
        )}
      >
        <div
          className={cn(
            'panel-glass surface-gradient border border-cyan/30 shadow-xl backdrop-blur-xl transition-all duration-300 flex h-full flex-col overflow-hidden',
            isCollapsed ? 'rounded-full' : 'rounded-2xl',
          )}
        >
          <div className="relative flex items-center justify-between px-4 py-3">
            <div className={cn('flex items-center gap-2', isCollapsed && 'opacity-0 pointer-events-none')}>
              <Cog className="h-4 w-4 text-cyan-300" />
              <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">Planet Console</span>
            </div>
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <Button variant="ghost" size="icon" onClick={handleOpenTechTree} className="text-cyan-200">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(true)}
                  className="text-cyan-200"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              <SectionCard
                title="Population"
                icon={<Users className="h-4 w-4 text-cyan-200" />}
                isOpen={sectionState.population}
                onToggle={() => toggleSection('population')}
              >
                <PlanetPopulationPanel planetId={planetId} isOpen={sectionState.population} />
              </SectionCard>

              <SectionCard
                title="Fleet Command"
                icon={<Target className="h-4 w-4 text-cyan-200" />}
                isOpen={sectionState.fleet}
                onToggle={() => toggleSection('fleet')}
              >
                <FleetActionsPanel planet={planet} />
              </SectionCard>

              <SectionCard
                title="Active Projects"
                icon={<Hammer className="h-4 w-4" />}
                isOpen={sectionState.queue}
                onToggle={() => toggleSection('queue')}
              >
                {isFetchingQueue ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin" />
                    Updating queue…
                  </div>
                ) : queueIsEmpty ? (
                  <div className="rounded-md border border-border/30 bg-black/40 px-3 py-4 text-xs text-muted-foreground">
                    No active construction or research. Queue something from the list below.
                  </div>
                ) : (
                  <ScrollArea className="max-h-48">
                    <div className="space-y-3">
                      {activeQueueItems.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-lg border border-border/30 bg-black/30 px-3 py-2',
                            item.is_completed && 'border-green-400/40 bg-green-500/10',
                          )}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-cyan-100">
                            <span className="uppercase tracking-[0.2em]">{item.type}</span>
                            <span>
                              {formatResource(item.cost_tellerium)} T · {formatResource(item.cost_krypton)} K
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.item_slug.replace(/_/g, ' ')}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {item.progress_percentage >= 100 || item.is_completed
                                  ? 'Completing…'
                                  : `${item.progress_percentage?.toFixed?.(0) ?? 0}%`}
                              </span>
                            </div>
                            <Badge
                              variant={item.is_completed ? 'default' : 'outline'}
                              className={cn(
                                'text-[10px] uppercase tracking-[0.18em]',
                                item.is_completed
                                  ? 'bg-green-500/20 text-green-300 border-green-400/40'
                                  : 'border-cyan-400/40 text-cyan-200',
                              )}
                            >
                              {item.is_completed ? 'Completed' : 'In Queue'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </SectionCard>

              <SectionCard
                title="Available Projects"
                icon={<Hammer className="h-4 w-4" />}
                isOpen={sectionState.buildables}
                onToggle={() => toggleSection('buildables')}
              >
                {buildableItems ? (
                  <BuildableItemsSection
                    planetId={planetId}
                    buildableItems={buildableItems}
                    onBuildItem={handleBuildAction}
                    className="border-border/30 bg-black/30"
                    layout="list"
                  />
                ) : (
                  <div className="rounded-md border border-border/30 bg-black/30 px-4 py-8 text-center text-xs text-muted-foreground">
                    Gathering available projects…
                  </div>
                )}
                {(isFetchingBuildables || !buildableItems) && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 animate-spin" />
                    Checking available projects…
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: ReactNode
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-black/30 shadow-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm text-cyan-200">
          {icon}
          <span className="uppercase tracking-[0.3em] text-xs">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-cyan-200" /> : <ChevronDown className="h-4 w-4 text-cyan-200" />}
      </button>
      {isOpen && <div className="px-3 pb-4">{children}</div>}
    </div>
  )
}

function UsersIcon() {
  return <Users className="h-4 w-4 text-cyan-200" />
}

