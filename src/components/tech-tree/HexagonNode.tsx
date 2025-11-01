import { ReactNode } from 'react'
import { CheckCircle, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export enum HexagonStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  BUILDING = 'BUILDING',
  RESEARCHING = 'RESEARCHING',
  COMPLETED = 'COMPLETED',
  PREREQUISITE_NOT_MET = 'PREREQUISITE_NOT_MET',
}

interface HexagonNodeProps {
  size?: number
  status: HexagonStatus
  onClick?: () => void
  children?: ReactNode
  imageUrl?: string
  name?: string
  className?: string
}

const STATUS_CONFIG: Record<HexagonStatus, {
  borderColor: string
  bgColor: string
  glowColor: string
  icon?: typeof CheckCircle
  pulse?: boolean
}> = {
  [HexagonStatus.LOCKED]: {
    borderColor: 'border-muted-foreground/50',
    bgColor: 'bg-muted/20',
    glowColor: 'glow-muted',
  },
  [HexagonStatus.AVAILABLE]: {
    borderColor: 'border-primary/50',
    bgColor: 'bg-primary/10',
    glowColor: 'glow-primary',
    pulse: true,
  },
  [HexagonStatus.BUILDING]: {
    borderColor: 'border-yellow-400/50',
    bgColor: 'bg-yellow-400/20',
    glowColor: 'glow-yellow',
    icon: Loader2,
    pulse: true,
  },
  [HexagonStatus.RESEARCHING]: {
    borderColor: 'border-yellow-400/50',
    bgColor: 'bg-yellow-400/20',
    glowColor: 'glow-yellow',
    icon: Loader2,
    pulse: true,
  },
  [HexagonStatus.COMPLETED]: {
    borderColor: 'border-green-500/50',
    bgColor: 'bg-green-500/20',
    glowColor: 'glow-green',
    icon: CheckCircle,
  },
  [HexagonStatus.PREREQUISITE_NOT_MET]: {
    borderColor: 'border-destructive/50',
    bgColor: 'bg-destructive/10',
    glowColor: 'glow-destructive',
    icon: AlertCircle,
  },
}

export function HexagonNode({
  size = 120,
  status,
  onClick,
  children,
  imageUrl,
  name,
  className,
}: HexagonNodeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  // Calculate hexagon points for SVG
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 6 // Better padding for cleaner look
  
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  const isInteractive = onClick && status !== HexagonStatus.LOCKED && status !== HexagonStatus.PREREQUISITE_NOT_MET

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={cn(
          'absolute inset-0 transition-all duration-300',
          config.pulse && 'animate-pulse',
          isInteractive && 'cursor-pointer hover:scale-110',
          `drop-shadow-[0_0_20px_theme(colors.${config.glowColor.replace('glow-', '')})]`
        )}
        onClick={onClick}
      >
        <polygon
          points={points}
          fill="currentColor"
          className={cn('text-transparent')}
          strokeWidth="2"
        />
        {/* Border */}
        <polygon
          points={points}
          fill="none"
          className={cn(config.borderColor, 'transition-colors duration-300')}
          strokeWidth="2"
        />
        {/* Glow effect */}
        <polygon
          points={points}
          fill="none"
          className={cn(config.borderColor, 'opacity-60 blur-md')}
          strokeWidth="3"
        />
      </svg>

      {/* Content */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center pointer-events-none',
          config.bgColor
        )}
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain p-3"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-5">
            {Icon && <Icon className={cn('w-7 h-7', config.borderColor)} />}
            {children}
          </div>
        )}
      </div>

      {/* Lock overlay for locked items */}
      {status === HexagonStatus.LOCKED && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock className="w-7 h-7 text-muted-foreground/40" />
        </div>
      )}
    </div>
  )
}

