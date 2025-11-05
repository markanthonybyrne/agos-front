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
  
  // Get type-based colors
  const getTypeColor = () => {
    switch (node.type) {
      case 'facility':
        return {
          border: 'border-purple-500/60',
          bgFrom: 'from-purple-500/20',
          bgTo: 'to-purple-500/5',
          shadow: 'rgba(168, 85, 247, 0.6)',
          glow: 'rgba(168, 85, 247, 0.4)',
          gradientFrom: 'rgba(168, 85, 247, 0.2)',
          gradientTo: 'rgba(168, 85, 247, 0.05)',
        }
      case 'research':
        return {
          border: 'border-green-500/60',
          bgFrom: 'from-green-500/20',
          bgTo: 'to-green-500/5',
          shadow: 'rgba(34, 197, 94, 0.6)',
          glow: 'rgba(34, 197, 94, 0.4)',
          gradientFrom: 'rgba(34, 197, 94, 0.2)',
          gradientTo: 'rgba(34, 197, 94, 0.05)',
        }
      case 'ship':
        return {
          border: 'border-blue-500/60',
          bgFrom: 'from-blue-500/20',
          bgTo: 'to-blue-500/5',
          shadow: 'rgba(59, 130, 246, 0.6)',
          glow: 'rgba(59, 130, 246, 0.4)',
          gradientFrom: 'rgba(59, 130, 246, 0.2)',
          gradientTo: 'rgba(59, 130, 246, 0.05)',
        }
      case 'defence':
        return {
          border: 'border-red-500/60',
          bgFrom: 'from-red-500/20',
          bgTo: 'to-red-500/5',
          shadow: 'rgba(239, 68, 68, 0.6)',
          glow: 'rgba(239, 68, 68, 0.4)',
          gradientFrom: 'rgba(239, 68, 68, 0.2)',
          gradientTo: 'rgba(239, 68, 68, 0.05)',
        }
      default:
        return {
          border: 'border-cyan-500/40',
          bgFrom: 'from-primary/10',
          bgTo: 'to-primary/5',
          shadow: 'rgba(6,182,212,0.6)',
          glow: 'rgba(6,182,212,0.4)',
          gradientFrom: 'rgba(6,182,212,0.2)',
          gradientTo: 'rgba(6,182,212,0.05)',
        }
    }
  }

  // Get specialization accent colors
  const getSpecializationAccent = () => {
    switch (node.specialization) {
      case 'industrial':
        return {
          border: 'border-orange-500/40',
          glow: 'rgba(249, 115, 22, 0.5)',
        }
      case 'military':
        return {
          border: 'border-red-500/50',
          glow: 'rgba(239, 68, 68, 0.6)',
        }
      case 'relic':
        return {
          border: 'border-yellow-500/50',
          glow: 'rgba(234, 179, 8, 0.7)',
        }
      default:
        return null
    }
  }

  const typeColors = getTypeColor()
  const specAccent = getSpecializationAccent()

  // Glass effect classes with type and specialization styling
  const shadowStyle = (isAvailable || isHighlighted) 
    ? { boxShadow: `0 0 20px ${specAccent?.glow || typeColors.shadow}` }
    : (isQueued || isPathPreview)
    ? { boxShadow: `0 0 15px ${specAccent?.glow || typeColors.glow}` }
    : isLocked
    ? { boxShadow: '0 0 10px rgba(107,114,128,0.3)' }
    : isCompleted
    ? { boxShadow: '0 0 15px rgba(34,197,94,0.5)' }
    : {}

  const glassClasses = cn(
    'backdrop-blur-md',
    `bg-gradient-to-br ${typeColors.bgFrom} ${typeColors.bgTo}`,
    `border ${specAccent?.border || typeColors.border}`,
    specAccent && node.specialization === 'relic' && 'animate-pulse'
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
        style={{ filter: `drop-shadow(0 0 8px ${typeColors.gradientFrom})` }}
      >
        <defs>
          <linearGradient id={`hexGradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={typeColors.gradientFrom} />
            <stop offset="100%" stopColor={typeColors.gradientTo} />
          </linearGradient>
        </defs>
        <polygon
          points={hexPoints}
          className={glassClasses}
          style={shadowStyle}
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
