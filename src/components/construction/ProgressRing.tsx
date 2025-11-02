import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  color?: 'cyan' | 'purple' | 'red' | 'blue' | 'green'
  animated?: boolean
  className?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = 'cyan',
  animated = true,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const colorClasses = {
    cyan: {
      ring: 'stroke-cyan-400',
      glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]',
      bg: 'stroke-cyan-400/20',
    },
    purple: {
      ring: 'stroke-purple-400',
      glow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]',
      bg: 'stroke-purple-400/20',
    },
    red: {
      ring: 'stroke-red-400',
      glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]',
      bg: 'stroke-red-400/20',
    },
    blue: {
      ring: 'stroke-blue-400',
      glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]',
      bg: 'stroke-blue-400/20',
    },
    green: {
      ring: 'stroke-green-400',
      glow: 'drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]',
      bg: 'stroke-green-400/20',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: colors.glow }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn(colors.bg)}
        />

        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colors.ring)}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? { strokeDashoffset: offset } : undefined}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          strokeDasharray={circumference}
        />

        {/* Pulsing glow effect when near completion */}
        {progress > 90 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth * 0.5}
            strokeLinecap="round"
            className={cn(colors.ring, 'opacity-30')}
            animate={{
              strokeDashoffset: [offset, offset - circumference * 0.1, offset],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            strokeDasharray={circumference}
          />
        )}
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

