import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TechNodeData, TechNodeStatus, TechNodeType } from '@/types/tech-tree.types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Lock, Rocket, Ship, ShieldCheck, Brain } from 'lucide-react'

interface NodeCardProps {
  node: TechNodeData
  highlighted?: boolean
  onClick?: (nodeId: string) => void
  onHover?: (nodeId: string | null) => void
  heatmapValue?: number
  progressState?: 'completed' | 'queued' | 'in-progress' | 'locked'
  comparisonInfo?: {
    selected: number
    ready: number
  }
}

const TYPE_ICON: Record<TechNodeType, JSX.Element> = {
  facility: <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />,
  research: <Brain className="h-3.5 w-3.5 text-emerald-300" />,
  ship: <Ship className="h-3.5 w-3.5 text-sky-300" />,
  defence: <ShieldCheck className="h-3.5 w-3.5 text-rose-300" />,
}

const STATUS_BADGE: Record<TechNodeStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  locked: { label: 'Locked', variant: 'outline', className: 'border-white/20 text-white/60' },
  available: { label: 'Ready', variant: 'secondary', className: 'bg-cyan-500/15 text-cyan-200' },
  queued: { label: 'Queued', variant: 'secondary', className: 'bg-amber-500/15 text-amber-200' },
  researching: { label: 'Researching', variant: 'secondary', className: 'bg-amber-500/15 text-amber-200' },
  building: { label: 'Building', variant: 'secondary', className: 'bg-amber-500/15 text-amber-200' },
  researched: { label: 'Completed', variant: 'default', className: 'bg-emerald-500/20 text-emerald-200' },
  completed: { label: 'Completed', variant: 'default', className: 'bg-emerald-500/20 text-emerald-200' },
  highlighted: { label: 'Focus', variant: 'secondary', className: 'bg-cyan-500/20 text-cyan-100' },
  'path-preview': { label: 'Path', variant: 'outline', className: 'border-cyan-400/40 text-cyan-100' },
}

const FALLBACK_IMAGE = '/assets/images/sections/tech-placeholder.webp'

const statusVariants = {
  locked: { opacity: 0.7, scale: 0.97, filter: 'grayscale(0.8)' },
  available: { opacity: 1, scale: 1, filter: 'grayscale(0)' },
  queued: { opacity: 1, scale: 1.02, filter: 'grayscale(0)' },
  researching: { opacity: 1, scale: 1.02, filter: 'grayscale(0)' },
  building: { opacity: 1, scale: 1.02, filter: 'grayscale(0)' },
  researched: { opacity: 1, scale: 1, filter: 'grayscale(0)' },
  completed: { opacity: 1, scale: 1, filter: 'grayscale(0)' },
  highlighted: { opacity: 1, scale: 1.05, filter: 'grayscale(0)' },
  'path-preview': { opacity: 1, scale: 1.03, filter: 'grayscale(0)' },
}

export function NodeCard({
  node,
  highlighted = false,
  onClick,
  onHover,
  heatmapValue,
  progressState,
  comparisonInfo,
}: NodeCardProps) {
  const [imageError, setImageError] = useState(false)
  const status: TechNodeStatus = highlighted ? 'highlighted' : node.status

  const imageSrc = useMemo(() => {
    if (imageError || !node.slug) return FALLBACK_IMAGE
    const folderMap: Record<TechNodeType, string> = {
      facility: 'facilities',
      research: 'research',
      ship: 'ships',
      defence: 'defenses',
    }
    const folder = folderMap[node.type] ?? 'research'
    return `/assets/images/${folder}/${node.slug}.webp`
  }, [imageError, node.slug, node.type])

  const statusBadge = STATUS_BADGE[status] ?? STATUS_BADGE.locked

  const unlockLabel = useMemo(() => {
    if (!node.unlockSummary) return ''
    const entries = Object.entries(node.unlockSummary).filter(([, count]) => count && count > 0)
    if (entries.length === 0) return ''
    return entries
      .map(([type, count]) => `${count} ${type.replace('defence', 'defence').replace('ship', 'ship')}`)
      .join(' • ')
  }, [node.unlockSummary])

  const handleClick = () => {
    if (onClick) onClick(node.id)
  }

  const handleMouseEnter = () => {
    onHover?.(node.id)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  const progressBadge = useMemo(() => {
    if (!progressState) return null
    switch (progressState) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-200">Completed</Badge>
      case 'queued':
        return <Badge className="bg-amber-500/20 text-amber-200">Queued</Badge>
      case 'in-progress':
        return <Badge className="bg-amber-400/20 text-amber-100">Researching</Badge>
      case 'locked':
        return <Badge className="bg-rose-500/20 text-rose-200">Locked</Badge>
      default:
        return null
    }
  }, [progressState])

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative w-[260px] cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 text-left shadow-[0_18px_55px_rgba(8,17,40,0.65)] transition-colors hover:border-cyan-400/50 hover:shadow-[0_25px_70px_rgba(23,98,199,0.6)]',
        highlighted && 'border-cyan-400/60 bg-cyan-500/10'
      )}
      variants={statusVariants}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={statusVariants[status] ?? statusVariants.locked}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {typeof heatmapValue === 'number' && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.6rem] opacity-70 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 50% 20%, rgba(14,199,255,${0.4 + heatmapValue * 0.4}), transparent 70%)`,
          }}
        />
      )}
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <img
          src={imageSrc}
          alt={node.name}
          className="h-36 w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
          onError={() => setImageError(true)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(8,12,24,0.96)] via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-1 backdrop-blur">
          {TYPE_ICON[node.type]}
          <span className="text-[10px] uppercase tracking-[0.35em] text-white/80">{node.type}</span>
        </div>
        {node.specialization && (
          <Badge variant="outline" className="absolute right-3 top-3 border-white/30 text-[10px] uppercase tracking-[0.3em] text-white/80">
            {node.specialization}
          </Badge>
        )}
        {progressBadge && (
          <div className="absolute bottom-3 left-3">{progressBadge}</div>
        )}
        {comparisonInfo && comparisonInfo.selected > 0 && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="border-cyan-400/40 bg-black/40 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
              {comparisonInfo.ready}/{comparisonInfo.selected} ready
            </Badge>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-white">{node.name}</h3>
            {node.era && (
              <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground/80">
                Era {node.era}
              </p>
            )}
          </div>
          <Badge variant={statusBadge.variant} className={cn('rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.35em]', statusBadge.className)}>
            {status === 'completed' || status === 'researched' ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : status === 'locked' ? (
              <Lock className="mr-1 h-3 w-3" />
            ) : (
              <Rocket className="mr-1 h-3 w-3" />
            )}
            {statusBadge.label}
          </Badge>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80">
            {node.costs?.tellerium !== undefined && (
              <>
                <dt>T</dt>
                <dd className="text-right text-white/80">{node.costs.tellerium.toLocaleString()}</dd>
              </>
            )}
            {node.costs?.krypton !== undefined && (
              <>
                <dt>K</dt>
                <dd className="text-right text-white/80">{node.costs.krypton.toLocaleString()}</dd>
              </>
            )}
            {node.build_time_ticks !== undefined && (
              <>
                <dt>Ticks</dt>
                <dd className="text-right text-white/80">{node.build_time_ticks}</dd>
              </>
            )}
          </dl>
        </div>

        {unlockLabel && (
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">
            Unlocks {unlockLabel}
          </p>
        )}
      </div>
    </motion.button>
  )
}

