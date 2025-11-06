/**
 * GalaxyIcon - Galaxy marker at sector level
 * 
 * Renders a galaxy icon as a sprite or textured plane
 */

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getGalaxyImage } from '@/lib/galaxyImages'

interface GalaxyIconProps {
  x: number
  y: number
  galaxyType?: string
  size?: number
  onClick?: () => void
  onHover?: (hovered: boolean) => void
}

export function GalaxyIcon({
  x,
  y,
  galaxyType,
  size = 40,
  onClick,
  onHover
}: GalaxyIconProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const hoveredRef = useRef(false)
  
  // Load galaxy image texture
  const texture = useRef<THREE.Texture | null>(null)
  
  // Create texture from image - getGalaxyImage expects a number, not a string
  // Convert galaxyType string to number, or use default type 1
  const galaxyTypeNum = galaxyType ? parseInt(galaxyType, 10) : 1
  const imageUrl = getGalaxyImage(isNaN(galaxyTypeNum) ? 1 : galaxyTypeNum)
  if (imageUrl && !texture.current) {
    const loader = new THREE.TextureLoader()
    loader.load(imageUrl, (loadedTexture) => {
      texture.current = loadedTexture
      if (meshRef.current) {
        const material = meshRef.current.material as THREE.MeshBasicMaterial
        material.map = loadedTexture
        material.needsUpdate = true
      }
    })
  }
  
  // Convert grid coordinates to Three.js world coordinates
  // Grid: (0, 0) is top-left, (2000, 1000) is bottom-right
  // Three.js: center at origin, Y up
  const worldX = x - 1000 // Grid center is 1000, world center is 0
  const worldY = -(y - 500) // Flip Y and center
  
  // Animate slight rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })
  
  const handlePointerEnter = () => {
    if (!hoveredRef.current) {
      hoveredRef.current = true
      onHover?.(true)
      if (meshRef.current) {
        meshRef.current.scale.setScalar(1.1)
      }
    }
  }
  
  const handlePointerLeave = () => {
    if (hoveredRef.current) {
      hoveredRef.current = false
      onHover?.(false)
      if (meshRef.current) {
        meshRef.current.scale.setScalar(1)
      }
    }
  }
  
  // Debug logging removed - was causing performance issues
  
  return (
    <mesh
      ref={meshRef}
      position={[worldX, worldY, 0]}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture.current || undefined}
        transparent
        alphaTest={0.1}
        color={texture.current ? undefined : '#4a9eff'} // Fallback color if texture not loaded
      />
    </mesh>
  )
}

