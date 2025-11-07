import { useMemo, useState } from 'react'
import { Planet } from '@/types/api.types'
import { cn } from '@/lib/utils'
import {
  createPlanetManagementActions,
  type OpenPanelHandler,
  type PlanetManagementAction
} from './planetManagementActions'
import { Button } from '@/components/ui/button'

interface PlanetActionWheelProps {
  planet: Planet
  openPanel: OpenPanelHandler
  className?: string
}

const RADIUS_LG = 110

const ACCENT_CLASS: Record<
  PlanetManagementAction['accent'],
  string
> = {
  cyan: 'text-brand-cyan bg-[rgba(46,121,141,0.16)] border-brand-cyan/40',
  green: 'text-brand-green bg-[rgba(50,142,119,0.16)] border-brand-green/35',
  red: 'text-red-400 bg-[rgba(244,63,94,0.16)] border-red-500/40',
  purple: 'text-purple-300 bg-[rgba(168,85,247,0.16)] border-purple-500/35'
}

export function PlanetActionWheel({
  planet,
  openPanel,
  className
}: PlanetActionWheelProps) {
  const actions = useMemo(
    () => createPlanetManagementActions(planet, openPanel),
    [planet, openPanel]
  )

  const [activeId, setActiveId] = useState<string | null>(
    actions[0]?.id ?? null
  )

  const activeAction =
    actions.find((action) => action.id === activeId) ?? actions[0] ?? null

  const renderActionButton = (
    action: PlanetManagementAction,
    index: number,
    total: number,
    radius: number
  ) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    const Icon = action.icon

    return (
      <div
        key={action.id}
        className="absolute pointer-events-auto"
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setActiveId(action.id)
            action.onClick()
          }}
          onMouseEnter={() => setActiveId(action.id)}
          className={cn(
            'h-14 w-14 rounded-full border border-brand-cyan/30 bg-[rgba(8,14,23,0.85)] backdrop-blur-md transition-all duration-200',
            'hover:border-brand-cyan/60 hover:bg-brand-cyan/20',
            activeId === action.id && 'border-brand-cyan/70 bg-brand-cyan/25'
          )}
          aria-label={action.label}
        >
          <Icon
            className={cn(
              'h-6 w-6 text-brand-cyan transition-transform duration-200',
              activeId === action.id && 'scale-110'
            )}
          />
        </Button>
        <div className="mt-2 text-center text-xs font-medium text-white/70">
          {action.shortLabel}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('pointer-events-none select-none', className)}>
      {/* Wheel for medium+ viewports */}
      <div className="relative hidden min-h-[300px] min-w-[300px] pointer-events-none md:block">
        <div
          className={cn(
            'absolute inset-0 rounded-full border border-brand-cyan/25',
            'bg-[radial-gradient(circle_at_center,rgba(46,121,141,0.12),rgba(8,14,23,0.92))]',
            'shadow-[0_25px_55px_rgba(0,0,0,0.55)]'
          )}
        />

        <div className="absolute inset-0">
          {actions.map((action, index) =>
            renderActionButton(action, index, actions.length, RADIUS_LG)
          )}
        </div>

        {activeAction && (
          <div
            className={cn(
              'absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-full border backdrop-blur-xl text-center text-xs tracking-wide text-white/80 transition-all duration-200',
              ACCENT_CLASS[activeAction.accent] ?? ACCENT_CLASS.cyan
            )}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              {activeAction.shortLabel}
            </p>
            <p className="max-w-[130px] text-[11px] leading-relaxed text-white/60">
              {activeAction.description}
            </p>
          </div>
        )}
      </div>

      {/* Responsive fallback */}
      <div className="grid gap-2 rounded-xl border border-brand-cyan/30 bg-[rgba(8,14,23,0.88)] p-3 backdrop-blur-md shadow-lg shadow-brand-cyan/10 md:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-cyan/80">
          Planet Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => {
                  setActiveId(action.id)
                  action.onClick()
                }}
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-lg border border-brand-cyan/20 bg-[rgba(8,14,23,0.75)] p-3 text-left transition-all duration-200',
                  'hover:border-brand-cyan/40 hover:bg-brand-cyan/10'
                )}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <span className="rounded-sm border border-brand-cyan/30 bg-brand-cyan/10 p-1">
                    <Icon className="h-4 w-4 text-brand-cyan" />
                  </span>
                  {action.shortLabel}
                </div>
                <p className="text-[11px] leading-relaxed text-white/55">
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


