import { useCallback } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'
import { normalizedToRenderScale } from './useZoomPan'

interface UseCameraTransitionOptions {
  initialZoom: number  // Normalized zoom (0.0-1.0)
  initialPanX: number
  initialPanY: number
  gridWidth: number
  gridHeight: number
  getContainerDimensions: () => { width: number; height: number }
}

/**
 * Framer Motion-powered camera transition hook for smooth Google-Earth-style animations
 */
export function useCameraTransition({
  initialZoom,
  initialPanX,
  initialPanY,
  gridWidth,
  gridHeight,
  getContainerDimensions
}: UseCameraTransitionOptions) {
  // Motion values for smooth animation
  const normalizedZoomMotion = useMotionValue(initialZoom)
  const panXMotion = useMotionValue(initialPanX)
  const panYMotion = useMotionValue(initialPanY)
  
  // Spring animations for smooth, Google-Earth-style transitions
  const normalizedZoomSpring = useSpring(normalizedZoomMotion, {
    stiffness: 100,
    damping: 30,
    mass: 1
  })
  
  const panXSpring = useSpring(panXMotion, {
    stiffness: 100,
    damping: 30,
    mass: 1
  })
  
  const panYSpring = useSpring(panYMotion, {
    stiffness: 100,
    damping: 30,
    mass: 1
  })
  
  // Transform normalized zoom to render scale
  const renderScale = useTransform(normalizedZoomSpring, (normalized) => {
    return normalizedToRenderScale(normalized)
  })
  
  // Smooth transition to target coordinate
  const transitionToCoordinate = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,  // Normalized zoom (0.0-1.0)
    duration: number = 2000  // 2 seconds for Google-Earth feel
  ) => {
    // Calculate target pan to center on coordinate
    const container = getContainerDimensions()
    const targetScale = normalizedToRenderScale(targetZoom)
    const targetPanX = (gridWidth / 2 - targetX) * targetScale
    const targetPanY = (gridHeight / 2 - targetY) * targetScale
    
    // Animate to target
    normalizedZoomMotion.set(targetZoom)
    panXMotion.set(targetPanX)
    panYMotion.set(targetPanY)
  }, [gridWidth, gridHeight, getContainerDimensions, normalizedZoomMotion, panXMotion, panYMotion])
  
  // Update camera position (for panning)
  const updatePosition = useCallback((x: number, y: number) => {
    panXMotion.set(x)
    panYMotion.set(y)
  }, [panXMotion, panYMotion])
  
  // Update zoom
  const updateZoom = useCallback((normalized: number) => {
    normalizedZoomMotion.set(Math.max(0, Math.min(1, normalized)))
  }, [normalizedZoomMotion])
  
  return {
    normalizedZoom: normalizedZoomSpring,
    panX: panXSpring,
    panY: panYSpring,
    renderScale,
    transitionToCoordinate,
    updatePosition,
    updateZoom
  }
}

