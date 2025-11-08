import { useMemo, useState } from 'react'
import { Planet } from '@/types/api.types'
import { cn } from '@/lib/utils'
import {
  createPlanetManagementActions,
  type OpenPanelHandler,
  type PlanetManagementAction
} from './planetManagementActions'

interface PlanetActionWheelProps {
  planet: Planet
  openPanel: OpenPanelHandler
  className?: string
}

const WHEEL_SIZE = 280
const WHEEL_CENTER = WHEEL_SIZE / 2
const OUTER_RADIUS = 120
const INNER_RADIUS = 72

const ACCENT_CLASS: Record<
  PlanetManagementAction['accent'],
  string
> = {
  cyan: 'text-brand-cyan bg-[rgba(46,121,141,0.16)] border-brand-cyan/40',
  green: 'text-brand-green bg-[rgba(50,142,119,0.16)] border-brand-green/35',
  red: 'text-red-400 bg-[rgba(244,63,94,0.16)] border-red-500/40',
  purple: 'text-purple-300 bg-[rgba(168,85,247,0.16)] border-purple-500/35'
}

const ACCENT_FILL_BASE: Record<PlanetManagementAction['accent'], string> = {
  cyan: 'rgba(46, 121, 141, 0.18)',
  green: 'rgba(50, 142, 119, 0.18)',
  red: 'rgba(244, 63, 94, 0.18)',
  purple: 'rgba(168, 85, 247, 0.18)',
}

const ACCENT_FILL_ACTIVE: Record<PlanetManagementAction['accent'], string> = {
  cyan: 'rgba(46, 121, 141, 0.32)',
  green: 'rgba(50, 142, 119, 0.32)',
  red: 'rgba(244, 63, 94, 0.32)',
  purple: 'rgba(168, 85, 247, 0.32)',
}

const ACCENT_STROKE: Record<PlanetManagementAction['accent'], string> = {
  cyan: 'rgba(46, 121, 141, 0.7)',
  green: 'rgba(50, 142, 119, 0.7)',
  red: 'rgba(244, 63, 94, 0.7)',
  purple: 'rgba(168, 85, 247, 0.7)',
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function describeArcSegment(
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius: number
) {
  const startOuter = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    outerRadius,
    startAngle
  )
  const endOuter = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    outerRadius,
    endAngle
  )
  const startInner = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    innerRadius,
    endAngle
  )
  const endInner = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    innerRadius,
    startAngle
  )

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ')
}

function describeArcLine(
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const startPoint = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    radius,
    startAngle
  )
  const endPoint = polarToCartesian(
    WHEEL_CENTER,
    WHEEL_CENTER,
    radius,
    endAngle
  )
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${startPoint.x} ${startPoint.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`,
  ].join(' ')
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

  return (
    <div className={cn('pointer-events-none select-none', className)}>
      {/* Wheel for medium+ viewports */}
      <div
        className="relative hidden md:block"
        style={{ width: `${WHEEL_SIZE}px`, height: `${WHEEL_SIZE}px` }}
      >
        <svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          className="absolute inset-0 drop-shadow-[0_25px_55px_rgba(0,0,0,0.55)]"
        >
          <defs>
            <radialGradient id="planet-wheel-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(34, 211, 238, 0.18)" />
              <stop offset="100%" stopColor="rgba(8, 14, 23, 0.9)" />
            </radialGradient>
          </defs>

          <circle
            cx={WHEEL_CENTER}
            cy={WHEEL_CENTER}
            r={OUTER_RADIUS}
            fill="url(#planet-wheel-bg)"
            stroke="rgba(46,121,141,0.25)"
            strokeWidth={2}
          />

          {actions.map((action, index) => {
            const segmentAngle = 360 / actions.length
            const startAngle = -90 + index * segmentAngle
            const endAngle = startAngle + segmentAngle
            const path = describeArcSegment(
              startAngle,
              endAngle,
              OUTER_RADIUS,
              INNER_RADIUS
            )
            const isActive = activeAction?.id === action.id
            const fill = isActive
              ? ACCENT_FILL_ACTIVE[action.accent]
              : ACCENT_FILL_BASE[action.accent]
            const stroke = ACCENT_STROKE[action.accent]

            return (
              <path
                key={action.id}
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 3 : 1.5}
                className="cursor-pointer transition-all duration-200 pointer-events-auto"
                role="button"
                tabIndex={0}
                onMouseEnter={() => setActiveId(action.id)}
                onFocus={() => setActiveId(action.id)}
                onClick={() => {
                  setActiveId(action.id)
                  action.onClick()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setActiveId(action.id)
                    action.onClick()
                  }
                }}
              />
            )
          })}
        </svg>

        {actions.map((action, index) => {
          const segmentAngle = 360 / actions.length
          const startAngle = -90 + index * segmentAngle
          const endAngle = startAngle + segmentAngle
          const labelRadius = (OUTER_RADIUS + INNER_RADIUS) / 2
          const inset = Math.min(12, segmentAngle / 4)
          const labelPath = describeArcLine(
            labelRadius,
            startAngle + inset,
            endAngle - inset
          )
          const isActive = activeAction?.id === action.id
          return (
            <g key={`${action.id}-label`}>
              <path
                id={`segment-label-${action.id}`}
                d={labelPath}
                fill="none"
                stroke="none"
                pointerEvents="none"
              />
              <text
                className={cn(
                  'uppercase tracking-[0.24em] text-white/75 transition-all duration-200 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]',
                  isActive && 'text-brand-cyan drop-shadow-[0_0_10px_rgba(46,121,141,0.6)]'
                )}
                fontSize={10}
                fontWeight={600}
              >
                <textPath
                  href={`#segment-label-${action.id}`}
                  startOffset="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {action.shortLabel}
                </textPath>
              </text>
            </g>
          )
        })}

        {activeAction && (
          <div
            className={cn(
              'absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border backdrop-blur-xl text-center text-[10px] tracking-wide text-white/80 transition-all duration-200',
              ACCENT_CLASS[activeAction.accent] ?? ACCENT_CLASS.cyan
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
              {activeAction.shortLabel}
            </p>
            <p className="max-w-[100px] text-[9px] leading-relaxed text-white/60">
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


