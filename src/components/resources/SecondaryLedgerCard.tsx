import { useMemo, useState } from 'react'
import { Layers, ChevronDown, ChevronUp, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProgressRing } from '@/components/construction/ProgressRing'
import { formatNumber } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { getRarityColor } from '@/config/resources'
import { SecondaryLedgerEntryWithMetadata } from '@/hooks/useResourcesCatalog'
import { SecondaryResourceDelta } from '@/types/api.types'

interface SecondaryLedgerCardProps {
  ledger: SecondaryLedgerEntryWithMetadata[]
  totalCapacity: number
  usedCapacity: number
  capacityBonusPercent?: number
  recentDelta?: SecondaryResourceDelta | null
  isBoosted?: boolean
  onUpgradeClick?: () => void
  className?: string
}

export function SecondaryLedgerCard({
  ledger,
  totalCapacity,
  usedCapacity,
  capacityBonusPercent,
  recentDelta,
  isBoosted = false,
  onUpgradeClick,
  className,
}: SecondaryLedgerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const fillPercent = useMemo(() => {
    if (!totalCapacity) return 0
    return Math.min(100, Math.round((usedCapacity / totalCapacity) * 100))
  }, [totalCapacity, usedCapacity])

  const isNearCapacity = fillPercent >= 90
  const capacityRemaining = Math.max(totalCapacity - usedCapacity, 0)

  const sortedLedger = useMemo(() => {
    return [...ledger].sort((a, b) => b.quantity - a.quantity)
  }, [ledger])

  return (
    <div className={cn('bg-card border border-border/50 rounded-xl p-4 shadow-sm shadow-black/10', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-300" />
            <h3 className="text-base font-semibold">Materials</h3>
            {isBoosted && (
              <Badge variant="outline" className="border-cyan-400/40 text-cyan-300 gap-1 h-6">
                <Sparkles className="w-3 h-3" />
                Booster Active
              </Badge>
            )}
            {typeof capacityBonusPercent === 'number' && capacityBonusPercent > 0 && (
              <Badge variant="outline" className="border-purple-400/40 text-purple-200 h-6">
                +{capacityBonusPercent}% Capacity
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {formatNumber(usedCapacity)} / {formatNumber(totalCapacity)} stored
            {capacityRemaining > 0 && (
              <span className="text-xs text-muted-foreground/80 ml-2">
                ({formatNumber(capacityRemaining)} free)
              </span>
            )}
          </div>
          {isNearCapacity && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              Storage nearly full — expand vaults to prevent waste.
            </div>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3">
                <ProgressRing
                  progress={fillPercent}
                  size={68}
                  strokeWidth={6}
                  color={isNearCapacity ? 'red' : 'cyan'}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {fillPercent}%
                  </span>
                </ProgressRing>
                {onUpgradeClick && (
                  <Button variant="outline" size="sm" onClick={onUpgradeClick}>
                    Upgrade Vault (120 QC)
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="border border-border/60 rounded-full h-8 w-8"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              <p>Ledger storage utilisation across all materials.</p>
              <p className="text-muted-foreground mt-1">
                Keep below 90% to avoid extraction waste.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isExpanded && (
        <ScrollArea className="mt-4 max-h-60 pr-2">
          <div className="space-y-3">
            {sortedLedger.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No materials stored yet. Extract secondary resources from colonies to populate your ledger.
              </div>
            )}
            {sortedLedger.map((entry) => {
              const capacity = entry.capacity || 1
              const percent = Math.min(100, Math.round((entry.quantity / capacity) * 100))
              const delta = recentDelta?.[entry.slug] ?? entry.delta ?? 0
              const rarityColor = getRarityColor(entry.metadata.rarity)
              const isCapped = entry.quantity >= capacity && capacity > 0

              return (
                <div
                  key={entry.slug}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5',
                    isCapped && 'border-amber-500/40 bg-amber-500/5',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: rarityColor }}
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {entry.metadata.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(entry.quantity)} / {formatNumber(capacity)} stored
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground font-mono">
                      {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${formatNumber(delta)}/tick`}
                    </div>
                    <div className="w-32 h-1.5 rounded-full bg-border/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          background: rarityColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}


