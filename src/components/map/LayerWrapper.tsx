import { motion, type Transition } from 'framer-motion'
import { getLayerOpacity } from '@/lib/zoomLevels'
import { ReactNode } from 'react'

interface LayerWrapperProps {
  layerName: string
  normalizedZoom: number
  children: ReactNode
  transition?: Transition
}

/**
 * LayerWrapper - Generic wrapper for fading layers with smooth opacity transitions
 * 
 * Enhanced crossfades with longer durations (0.4s-0.6s) and cubic-bezier easing
 * for smooth transitions between zoom levels
 * 
 * Performance optimization: Removes layer from DOM when opacity < 0.05
 */
export function LayerWrapper({ 
  layerName, 
  normalizedZoom, 
  children,
  transition 
}: LayerWrapperProps) {
  const opacity = getLayerOpacity(layerName, normalizedZoom)
  
  // Don't render if opacity too low (performance optimization)
  // Lowered threshold to allow very low opacity layers to render during fade-in
  if (opacity < 0.01) {
    return null
  }
  
  // If fully visible, don't apply opacity wrapper to avoid compounding with child element opacities
  if (opacity >= 0.99) {
    return <>{children}</>
  }
  
  // Default transition: smooth cubic-bezier easing with longer duration
  // Custom transition can be provided per-layer for fine-tuning
  const defaultTransition: Transition = {
    duration: 0.5, // Longer duration (0.4s-0.6s) for smoother crossfades
    ease: [0.4, 0.0, 0.2, 1] // cubic-bezier for smooth fade
  }
  
  const finalTransition = transition || defaultTransition
  
  return (
    <motion.g
      style={{ opacity }}
      initial={{ opacity }}
      animate={{ opacity }}
      transition={finalTransition}
    >
      {children}
    </motion.g>
  )
}

