import { motion, MotionProps } from 'framer-motion'
import { CheckCircle, Lock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TechNodeData, TechNodeStatus } from '@/types/tech-tree.types'
import { HexNodeBadges } from './HexNodeBadges'

interface HexNodeProps {
  node: TechNodeData
  size?: number
  onClick?: (nodeId: string) => void
  onHover?: (nodeId: string | null) => void
  variant?: TechNodeStatus
  className?: string
}

const HEX_SIZE_DEFAULT = 80
const HEX_POINTS = 6
const HEX_APOTHEM = 0.866 // cos(30°) for regular hexagon

/**
 * Calculate hexagon points for SVG path
 */
function getHexagonPoints(size: number): string {
  const radius = size / 2
  const points: string[] = []
  
  for (let i = 0; i < HEX_POINTS; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6 // Start at top
    const x = radius + radius * Math.cos(angle)
    const y = radius + radius * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  
  return points.join(' ')
}

/**
 * Framer Motion variants for different node states
 */
const nodeVariants = {
  locked: {
    opacity: 0.3,
    scale: 0.95,
    filter: 'grayscale(1)',
  },
  available: {
    opacity: 1,
    scale: 1,
    filter: 'grayscale(0)',
  },
  queued: {
    opacity: 1,
    scale: 1.02,
    filter: 'grayscale(0)',
  },
  researching: {
    opacity: 1,
    scale: 1.02,
    filter: 'grayscale(0)',
  },
  building: {
    opacity: 1,
    scale: 1.02,
    filter: 'grayscale(0)',
  },
  researched: {
    opacity: 1,
    scale: 1,
    filter: 'grayscale(0)',
  },
  completed: {
    opacity: 1,
    scale: 1,
    filter: 'grayscale(0)',
  },
  highlighted: {
    opacity: 1,
    scale: 1.08,
    filter: 'grayscale(0)',
    zIndex: 10,
  },
  'path-preview': {
    opacity: 1,
    scale: 1.05,
    filter: 'grayscale(0)',
  },
}

const hoverVariants = {
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
  },
}

export function HexNode({
  node,
  size = HEX_SIZE_DEFAULT,
  onClick,
  onHover,
  variant,
  className,
}: HexNodeProps) {
  const status = variant || node.status
  const hexPoints = getHexagonPoints(size)
  
  // Determine visual state
  const isLocked = status === 'locked'
  const isAvailable = status === 'available'
  const isQueued = status === 'queued' || status === 'researching' || status === 'building'
  const isCompleted = status === 'researched' || status === 'completed'
  const isHighlighted = status === 'highlighted'
  const isPathPreview = status === 'path-preview'
  
  // Glass effect classes
  const glassClasses = cn(
    'backdrop-blur-md',
    'bg-gradient-to-br from-primary/10 to-primary/5',
    'border border-cyan-500/40',
    {
      'shadow-[0_0_20px_rgba(6,182,212,0.6)]': isAvailable || isHighlighted,
      'shadow-[0_0_15px_rgba(6,182,212,0.4)]': isQueued || isPathPreview,
      'shadow-[0_0_10px_rgba(107,114,128,0.3)]': isLocked,
      'shadow-[0_0_15px_rgba(34,197,94,0.5)]': isCompleted,
    }
  )
  
  return (
    <motion.div
      className={cn('relative cursor-pointer', className)}
      style={{ width: size, height: size }}
      variants={nodeVariants}
      initial={status}
      animate={status}
      whileHover={hoverVariants.hover}
      whileTap={hoverVariants.tap}
      onClick={() => onClick?.(node.id)}
      onHoverStart={() => onHover?.(node.id)}
      onHoverEnd={() => onHover?.(null)}
      role="button"
      aria-label={`${node.name} - ${status}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(node.id)
        }
      }}
    >
      {/* SVG Hexagon */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.3))' }}
      >
        <defs>
          <linearGradient id={`hexGradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.05)" />
          </linearGradient>
        </defs>
        <polygon
          points={hexPoints}
          className={glassClasses}
          fill={`url(#hexGradient-${node.id})`}
          stroke="currentColor"
          strokeWidth={isHighlighted ? 2 : 1.5}
          strokeOpacity={isLocked ? 0.3 : 0.6}
        />
      </svg>
      
      {/* Icon/Image */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {node.imageUrl ? (
          <img
            src={node.imageUrl}
            alt={node.name}
            className={cn(
              'w-12 h-12 object-contain',
              { 'opacity-50 grayscale': isLocked }
            )}
          />
        ) : (
          <div className={cn(
            'text-2xl font-bold text-primary',
            { 'opacity-50': isLocked }
          )}>
            {node.name.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Status Indicators */}
      {isLocked && (
        <motion.div
          className="absolute top-1 right-1 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Lock className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      )}
      
      {isCompleted && (
        <motion.div
          className="absolute top-1 right-1 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckCircle className="w-4 h-4 text-green-500" />
        </motion.div>
      )}
      
      {isQueued && (
        <motion.div
          className="absolute top-1 right-1 z-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-4 h-4 text-yellow-400" />
        </motion.div>
      )}
      
      {/* Progress Ring for Queued/Building */}
      {isQueued && (
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke="rgba(250,204,21,0.3)"
            strokeWidth="2"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke="rgba(250,204,21,0.8)"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * (size / 2 - 4)}`}
            initial={{ strokeDashoffset: 2 * Math.PI * (size / 2 - 4) }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: node.build_time_ticks || 60, repeat: Infinity }}
          />
        </svg>
      )}
      
      {/* Badges */}
      <HexNodeBadges node={node} size={size} />
    </motion.div>
  )
}
