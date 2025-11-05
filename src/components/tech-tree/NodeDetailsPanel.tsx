import { Clock, CheckCircle2, Lock, ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TechNodeData, TechTreeGraphData } from '@/types/tech-tree.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SlidingPanel } from '@/components/common/SlidingPanel'
import { PanelSize } from '@/app/slices/panelSlice'
import { HexNode } from './HexNode'

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
}

function formatTicks(ticks: number): string {
  if (ticks < 60) return `${ticks} ticks`
  const minutes = Math.floor(ticks / 60)
  const remainingTicks = ticks % 60
  if (remainingTicks === 0) return `${minutes}m`
  return `${minutes}m ${remainingTicks}t`
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
}: NodeDetailsPanelProps) {
  // Always render SlidingPanel to maintain hook order, use isOpen to control visibility
  const isLocked = node?.status === 'locked'
  const isAvailable = node?.status === 'available'
  const isCompleted = node?.status === 'completed' || node?.status === 'researched'
  const isQueued = node?.status === 'queued' || node?.status === 'researching' || node?.status === 'building'
  
  // Format costs for display
  const totalCost = {
    tellerium: node?.costs?.tellerium || 0,
    krypton: node?.costs?.krypton || 0,
    dark_matter: node?.costs?.dark_matter || 0,
    research_points: node?.costs?.research_points || 0,
  }
  
  return (
    <SlidingPanel
      isOpen={!!node}
      onClose={onClose}
      title={
        node ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <HexNode
                node={node}
                size={48}
                variant={node.status}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {node.name}
              </h2>
              {node.specialization && node.specialization !== 'general' && (
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                  {node.specialization}
                </span>
              )}
            </div>
          </div>
        ) : null
      }
      size={PanelSize.MEDIUM}
      zIndex={9999}
      className={cn('w-full sm:w-96 md:w-[420px]', className)}
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {node ? (
          <div className="p-6 space-y-6">
            {/* Hero Visual */}
            {node.imageUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-primary/10 to-primary/5">
              <img
                src={node.imageUrl}
                alt={node.name}
                className="w-full h-full object-contain p-4"
              />
              {node.era && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-primary/80 text-primary-foreground text-xs font-bold">
                  Era {node.era}
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          {node.description && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {node.description}
              </p>
            </div>
          )}
          
          {/* Costs */}
          {(totalCost.tellerium > 0 || totalCost.krypton > 0 || totalCost.research_points > 0) && (
            <Card className="bg-muted/30 border-cyan-500/20">
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-foreground">Cost</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {totalCost.tellerium > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-tellerium/80" />
                      <span className="text-sm text-foreground">Tellerium</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {totalCost.tellerium.toLocaleString()}
                    </span>
                  </div>
                )}
                {totalCost.krypton > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-krypton/80" />
                      <span className="text-sm text-foreground">Krypton</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {totalCost.krypton.toLocaleString()}
                    </span>
                  </div>
                )}
                {totalCost.research_points > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-600/80" />
                      <span className="text-sm text-foreground">Research Points</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {totalCost.research_points.toLocaleString()}
                    </span>
                  </div>
                )}
                {node.build_time_ticks && (
                  <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Build Time</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatTicks(node.build_time_ticks)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Production (for facilities) */}
          {node.production && (node.production.tellerium || node.production.krypton) && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-foreground">Production per Tick</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {node.production.tellerium && node.production.tellerium > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Tellerium</span>
                    <span className="text-sm font-bold text-green-400">
                      +{node.production.tellerium.toLocaleString()}
                    </span>
                  </div>
                )}
                {node.production.krypton && node.production.krypton > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Krypton</span>
                    <span className="text-sm font-bold text-green-400">
                      +{node.production.krypton.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Prerequisites */}
          {node.prerequisites && node.prerequisites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Prerequisites
              </h3>
              <div className="flex flex-wrap gap-2">
                {node.prerequisites.map((prereqId) => (
                  <button
                    key={prereqId}
                    onClick={() => onJumpToNode?.(prereqId)}
                    className="group relative"
                  >
                    <div className="w-10 h-10 rounded border border-cyan-500/30 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {prereqId.split('-')[1]?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-cyan-500/30 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                      {prereqId}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Effects */}
          {node.effects && Object.keys(node.effects).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Effects
              </h3>
              <ul className="space-y-2">
                {Object.entries(node.effects).map(([key, value]) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>
                      <span className="font-semibold capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>{' '}
                      {typeof value === 'boolean'
                        ? value
                          ? 'Enabled'
                          : 'Disabled'
                        : String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Footer - Actions */}
          <div className="p-4 border-t border-cyan-500/20 space-y-2 bg-muted/20 backdrop-blur-sm">
            {/* Primary Action */}
            {!isCompleted && (
              <Button
                onClick={() => onQueue?.(node.id)}
                disabled={isLocked}
                className="w-full glow-cyan"
                size="lg"
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Locked
                  </>
                ) : isQueued ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Queued
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Queue {node.type === 'research' ? 'Research' : 'Build'}
                  </>
                )}
              </Button>
            )}
            
            {/* Secondary Actions */}
            <div className="flex gap-2">
              {isLocked && onViewPath && (
                <Button
                  onClick={() => onViewPath(node.id)}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Path
                </Button>
              )}
              {node.prerequisites && node.prerequisites.length > 0 && (
                <Button
                  onClick={() => {
                    // Navigate to first prerequisite
                    const firstPrereq = node.prerequisites?.[0]
                    if (firstPrereq && onJumpToNode) {
                      onJumpToNode(firstPrereq)
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  Jump to Prereq
                </Button>
              )}
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </SlidingPanel>
  )
}
