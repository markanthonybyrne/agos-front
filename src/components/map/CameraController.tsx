import { motion, MotionValue } from 'framer-motion'
import { ReactNode } from 'react'

interface CameraControllerProps {
  normalizedZoom: MotionValue<number>
  panX: MotionValue<number>
  panY: MotionValue<number>
  renderScale: MotionValue<number>
  children: ReactNode
}

/**
 * CameraController - Animated wrapper for map content using Framer Motion
 * 
 * Provides smooth Google-Earth-style transitions for zoom and pan
 */
export function CameraController({
  normalizedZoom,
  panX,
  panY,
  renderScale,
  children
}: CameraControllerProps) {
  return (
    <motion.div
      style={{
        scale: renderScale,
        x: panX,
        y: panY,
        transformOrigin: 'center center',
        willChange: 'transform'
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  )
}



