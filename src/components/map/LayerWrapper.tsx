import { motion } from 'framer-motion'
import { getLayerOpacity } from '@/lib/zoomLevels'
import { ReactNode } from 'react'

interface LayerWrapperProps {
  layerName: string
  normalizedZoom: number
  children: ReactNode
}

/**
 * LayerWrapper - Generic wrapper for fading layers with smooth opacity transitions
 * 
 * Performance optimization: Removes layer from DOM when opacity < 0.05
 */
export function LayerWrapper({ layerName, normalizedZoom, children }: LayerWrapperProps) {
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
  
  return (
    <motion.g
      style={{ opacity }}
      initial={{ opacity }}
      animate={{ opacity }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.g>
  )
}

