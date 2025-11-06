/**
 * UniverseMapCanvas - Three.js canvas wrapper for universe map
 * 
 * Sets up the Three.js scene with proper aspect ratio handling
 */

import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { calculateCameraSettings, updateCamera } from '@/lib/v3/CameraController'
import { ProjectionConfig } from '@/lib/v3/ViewportProjection'

interface UniverseMapCanvasProps {
  children: React.ReactNode
  gridWidth: number
  gridHeight: number
  scale: number
  panX: number
  panY: number
  onCameraUpdate?: (camera: THREE.OrthographicCamera) => void
}

/**
 * Camera controller component that updates camera based on zoom/pan
 */
function CameraController({
  gridWidth,
  gridHeight,
  scale,
  panX,
  panY,
  onCameraUpdate
}: {
  gridWidth: number
  gridHeight: number
  scale: number
  panX: number
  panY: number
  onCameraUpdate?: (camera: THREE.OrthographicCamera) => void
}) {
  const { camera, size } = useThree()
  const orthoCamera = camera as THREE.OrthographicCamera
  
  useEffect(() => {
    const settings = calculateCameraSettings(
      size.width,
      size.height,
      gridWidth,
      gridHeight,
      scale
    )
    
    orthoCamera.left = settings.left
    orthoCamera.right = settings.right
    orthoCamera.top = settings.top
    orthoCamera.bottom = settings.bottom
    orthoCamera.near = settings.near
    orthoCamera.far = settings.far
    
    updateCamera(orthoCamera, panX, panY, scale, gridWidth, gridHeight)
    orthoCamera.updateProjectionMatrix()
    
    onCameraUpdate?.(orthoCamera)
  }, [size.width, size.height, gridWidth, gridHeight, scale, panX, panY, orthoCamera, onCameraUpdate])
  
  return null
}

export function UniverseMapCanvas({
  children,
  gridWidth,
  gridHeight,
  scale,
  panX,
  panY,
  onCameraUpdate
}: UniverseMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
    
    updateSize()
    
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    
    return () => resizeObserver.disconnect()
  }, [])
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ backgroundColor: 'transparent' }}
    >
      {containerSize.width > 0 && containerSize.height > 0 && (
        <Canvas
          camera={{
            position: [0, 0, 100],
            zoom: scale,
            left: -1000,
            right: 1000,
            top: 500,
            bottom: -500,
            near: 0.1,
            far: 1000
          }}
          orthographic
          gl={{ 
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
          style={{ backgroundColor: 'transparent' }}
        >
          <CameraController
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            scale={scale}
            panX={panX}
            panY={panY}
            onCameraUpdate={onCameraUpdate}
          />
          {children}
        </Canvas>
      )}
    </div>
  )
}


