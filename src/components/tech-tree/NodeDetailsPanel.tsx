import { useMemo, useState } from 'react'
import {
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Link2,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TechNodeData, TechTreeGraphData } from '@/types/tech-tree.types'
import { Button } from '@/components/ui/button'
import { SlidingPanel } from '@/components/common/SlidingPanel'
import { PanelSize } from '@/app/slices/panelSlice'
import { Badge } from '@/components/ui/badge'

interface NodeDetailsPanelProps {
  node: TechNodeData | null
  planetId?: number
  graphData?: TechTreeGraphData | null
  onClose: () => void
  onQueue?: (nodeId: string) => void
  onViewPath?: (nodeId: string) => void
  onJumpToNode?: (nodeId: string) => void
  isMobile?: boolean
  className?: string
  onAddToPlan?: (nodeId: string) => void
}

const FALLBACK_IMAGE = '/assets/images/sections/tech-placeholder.webp'

const STATUS_LABEL: Record<string, string> = {
  locked: 'Prerequisites Required',
  available: 'Ready to Queue',
  queued: 'Queued',
  researching: 'Researching',
  building: 'Constructing',
  researched: 'Completed',
  completed: 'Completed',
  highlighted: 'Focused',
  'path-preview': 'Path Preview',
}

const STATUS_CLASS: Record<string, string> = {
  locked: 'border-red-500/40 bg-red-500/10 text-red-200',
  available: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100',
  queued: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  researching: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  building: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  researched: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  completed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  highlighted: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-100',
  'path-preview': 'border-blue-400/40 bg-blue-400/10 text-blue-100',
}

function formatTicks(ticks: number): string {
  if (ticks < 60) return `${ticks} ticks`
  const minutes = Math.floor(ticks / 60)
  const remainingTicks = ticks % 60
  if (remainingTicks === 0) return `${minutes}m`
  return `${minutes}m ${remainingTicks} ticks`
}

function resolveNodeImage(node: TechNodeData | null): string {
  if (!node || !node.slug) return FALLBACK_IMAGE
  const folderMap: Record<TechNodeData['type'], string> = {
    facility: 'facilities',
    research: 'research',
    ship: 'ships',
    defence: 'defenses',
  }
  const folder = folderMap[node.type] ?? 'research'
  return `/assets/images/${folder}/${node.slug}.webp`
}

export function NodeDetailsPanel({
  node,
  planetId,
  graphData,
  onClose,
  onQueue,
  onViewPath,
  onJumpToNode,
  isMobile = false,
  className,
  onAddToPlan,
}: NodeDetailsPanelProps) {
  const [imageError, setImageError] = useState(false)

  const isLocked = node?.status === 'locked'
  const isAvailable = node?.status === 'available'
  const isCompleted = node?.status === 'completed' || node?.status === 'researched'
  const isQueued = node?.status === 'queued' || node?.status === 'researching' || node?.status === 'building'

  const resolvedImage = useMemo(() => {
    if (!node) return FALLBACK_IMAGE
    if (imageError) return FALLBACK_IMAGE
    return resolveNodeImage(node)
  }, [node, imageError])

  const prerequisiteNodes = useMemo(() => {
    if (!node?.prerequisites || !graphData) return []
    return node.prerequisites
      .map((id) => graphData.nodes.find((n) => n.id === id))
      .filter((n): n is TechNodeData => Boolean(n))
  }, [node?.prerequisites, graphData])

  const unlockNodes = useMemo(() => {
    if (!node?.dependents || !graphData) return []
    return node.dependents
      .map((id) => graphData.nodes.find((n) => n.id === id))
      .filter((n): n is TechNodeData => Boolean(n))
  }, [node?.dependents, graphData])

  const prerequisiteSummary = node?.prerequisiteSummary
  const unlockSummary = node?.unlockSummary
  
  return (
    <SlidingPanel
      isOpen={!!node}
      onClose={onClose}
      title={
        node ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">{node.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/5 text-xs uppercase tracking-[0.35em] text-muted-foreground/80">
                {node.type}
              </Badge>
              {node.specialization && node.specialization !== 'general' && (
                <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-200 text-xs uppercase tracking-[0.35em]">
                  {node.specialization}
                </Badge>
              )}
              {node.status && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs uppercase tracking-[0.35em] border',
                    STATUS_CLASS[node.status] ?? STATUS_CLASS.locked
                  )}
                >
                  {STATUS_LABEL[node.status] ?? node.status}
                </Badge>
              )}
            </div>
          </div>
        ) : null
      }
      size={PanelSize.LARGE}
      zIndex={9999}
      className={cn('w-full md:w-[520px] bg-[rgba(6,11,23,0.92)] backdrop-blur-2xl border-l border-white/10', className)}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {node ? (
          <div className="p-6 space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_18px_45px_rgba(10,18,36,0.7)]">
              <img
                src={resolvedImage}
                onError={() => setImageError(true)}
                alt={node.name}
                className="h-48 w-full object-cover opacity-90"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(5,12,24,0.95)] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-white/20 bg-black/40 text-[11px] uppercase tracking-[0.4em] text-white/80">
                    {node.type}
                  </Badge>
                  {node.specialization && (
                    <Badge variant="secondary" className="bg-cyan-500/30 text-white text-[11px] uppercase tracking-[0.4em]">
                      {node.specialization}
                    </Badge>
                  )}
                </div>
                {node.era && (
                  <Badge variant="outline" className="border-white/30 bg-black/40 text-[11px] uppercase tracking-[0.4em] text-white/80">
                    Era {node.era}
                  </Badge>
                )}
              </div>
            </div>

            {node.description && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-muted-foreground">Briefing</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{node.description}</p>
              </section>
            )}

            <MetricsGrid node={node} />

            {prerequisiteSummary && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  Dependency Analytics
                </div>
                <div className="mt-4 grid gap-3 text-sm text-foreground">
                  <MetricRow label="Chain Depth" value={`${prerequisiteSummary.depth}+ steps`} />
                  <MetricRow label="Unique Prerequisites" value={`${prerequisiteSummary.prerequisiteCount}`} />
                  <MetricRow
                    label="Aggregate Cost"
                    value={[
                      prerequisiteSummary.totalCost.tellerium
                        ? `${prerequisiteSummary.totalCost.tellerium.toLocaleString()} T`
                        : null,
                      prerequisiteSummary.totalCost.krypton
                        ? `${prerequisiteSummary.totalCost.krypton.toLocaleString()} K`
                        : null,
                      prerequisiteSummary.totalCost.research_points
                        ? `${prerequisiteSummary.totalCost.research_points.toLocaleString()} RP`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || '—'}
                  />
                </div>
              </section>
            )}

            {prerequisiteNodes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  Prerequisite Chain
                </div>
                <div className="flex flex-wrap gap-2">
                  {prerequisiteNodes.map((prereq) => (
                    <button
                      key={prereq.id}
                      onClick={() => onJumpToNode?.(prereq.id)}
                      className="group rounded-2xl border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-left transition hover:border-cyan-400/60 hover:bg-cyan-500/10"
                    >
                      <p className="text-xs font-semibold text-cyan-100">{prereq.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                        Era {prereq.era ?? '?'} • {prereq.type}
                      </p>
                    </button>
                  ))}
                </div>
                {isLocked && onViewPath && (
                  <Button variant="outline" size="sm" className="w-full border-cyan-500/40" onClick={() => onViewPath(node.id)}>
                    <Target className="mr-2 h-4 w-4" />
                    Highlight Full Path
                  </Button>
                )}
              </section>
            )}

            {unlockSummary && Object.keys(unlockSummary).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Unlocks
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(unlockSummary)
                    .filter(([, count]) => count && count > 0)
                    .map(([type, count]) => (
                      <Badge key={type} variant="outline" className="border-white/20 bg-white/5 text-[11px] uppercase tracking-[0.3em] text-white/70">
                        {count} × {type}
                      </Badge>
                    ))}
                </div>
                {unlockNodes.length > 0 && (
                  <div className="grid gap-2 text-sm text-foreground/90">
                    {unlockNodes.map((child) => (
                      <div key={child.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                            Era {child.era ?? '?'} • {child.type}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onJumpToNode?.(child.id)}>
                          Inspect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {node.effects && Object.keys(node.effects).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Effects
                </div>
                <ul className="space-y-2 text-sm text-foreground/90">
                  {Object.entries(node.effects).map(([key, value]) => (
                    <li key={key} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-muted-foreground">
                        {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <footer className="space-y-3 rounded-3xl border border-white/10 bg-[rgba(4,10,20,0.85)] px-4 py-4 backdrop-blur-xl">
              {!isCompleted && (
                <Button
                  onClick={() => onQueue?.(node.id)}
                  disabled={isLocked}
                  size="lg"
                  className="w-full bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                >
                  {isLocked ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Locked — review prerequisites
                    </>
                  ) : isQueued ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Already in queue
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {planetId ? 'Queue on selected planet' : 'Queue item'}
                    </>
                  )}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {onAddToPlan && (
                  <Button variant="outline" size="sm" className="border-white/20" onClick={() => onAddToPlan(node.id)}>
                    Save to Plan
                  </Button>
                )}
                {isLocked && onViewPath && (
                  <Button variant="outline" size="sm" className="border-cyan-500/40 text-cyan-100" onClick={() => onViewPath(node.id)}>
                    View Path
                  </Button>
                )}
                {node.prerequisites && node.prerequisites.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const firstPrereq = node.prerequisites?.[0]
                      if (firstPrereq && onJumpToNode) {
                        onJumpToNode(firstPrereq)
                      }
                    }}
                  >
                    Jump to Prereq
                  </Button>
                )}
              </div>
            </footer>
          </div>
        ) : null}
      </div>
    </SlidingPanel>
  )
}

interface MetricRowProps {
  label: string
  value: string
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value || '—'}</span>
    </div>
  )
}

interface MetricsGridProps {
  node: TechNodeData
}

function MetricsGrid({ node }: MetricsGridProps) {
  const costs = node.costs || {}
  const { build_time_ticks, production, upkeep } = node
  const hasProduction = production && (production.tellerium || production.krypton || production.dark_matter)
  const hasUpkeep = upkeep && (upkeep.tellerium || upkeep.krypton || upkeep.energy)

  return (
    <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {(costs.tellerium || costs.krypton || costs.dark_matter || costs.research_points) ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
            <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <Clock className="h-4 w-4" /> Cost
            </h4>
            <div className="space-y-1 text-sm text-foreground/90">
              {costs.tellerium && <MetricValue label="Tellerium" value={costs.tellerium.toLocaleString()} />}
              {costs.krypton && <MetricValue label="Krypton" value={costs.krypton.toLocaleString()} />}
              {costs.dark_matter && <MetricValue label="Dark Matter" value={costs.dark_matter.toLocaleString()} />}
              {costs.research_points && <MetricValue label="Research Points" value={costs.research_points.toLocaleString()} />}
            </div>
          </div>
        ) : null}
        {build_time_ticks !== undefined && (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
            <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <Clock className="h-4 w-4" /> Build Time
            </h4>
            <p className="text-sm font-semibold text-foreground">{formatTicks(build_time_ticks)}</p>
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {hasProduction && (
          <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <h4 className="text-xs uppercase tracking-[0.4em] text-emerald-200">Production</h4>
            <div className="space-y-1 text-sm text-emerald-100">
              {production?.tellerium && <MetricValue label="Tellerium" value={`+${production.tellerium.toLocaleString()}/tick`} />}
              {production?.krypton && <MetricValue label="Krypton" value={`+${production.krypton.toLocaleString()}/tick`} />}
              {production?.dark_matter && <MetricValue label="Dark Matter" value={`+${production.dark_matter.toLocaleString()}/tick`} />}
            </div>
          </div>
        )}
        {hasUpkeep && (
          <div className="space-y-2 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3">
            <h4 className="text-xs uppercase tracking-[0.4em] text-rose-200">Upkeep</h4>
            <div className="space-y-1 text-sm text-rose-100">
              {upkeep?.tellerium && <MetricValue label="Tellerium" value={`-${upkeep.tellerium.toLocaleString()}/tick`} />}
              {upkeep?.krypton && <MetricValue label="Krypton" value={`-${upkeep.krypton.toLocaleString()}/tick`} />}
              {upkeep?.energy && <MetricValue label="Energy" value={`-${upkeep.energy.toLocaleString()}`} />}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

interface MetricValueProps {
  label: string
  value: string
}

function MetricValue({ label, value }: MetricValueProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
