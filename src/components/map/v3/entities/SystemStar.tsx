/**
 * SystemStar - Central star for a system
 * 
 * Renders a glowing star at system center
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SystemStarProps {
  x: number
  y: number
  size?: number
  color?: string
  intensity?: number
}

export function SystemStar({
  x,
  y,
  size = 8,
  color = '#ffffaa',
  intensity = 1
}: SystemStarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // Convert grid coordinates to Three.js world coordinates
  const worldX = x - 1000
  const worldY = -(y - 500)
  
  // Animate star (pulsing glow)
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 1
      glowRef.current.scale.setScalar(pulse * intensity)
    }
  })
  
  return (
    <group position={[worldX, worldY, 0]}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <circleGeometry args={[size * 1.5, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4 * intensity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Star core */}
      <mesh ref={meshRef}>
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9 * intensity}
        />
      </mesh>
    </group>
  )
}



