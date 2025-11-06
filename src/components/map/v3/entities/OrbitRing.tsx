/**
 * OrbitRing - Planet orbit visualization
 * 
 * Renders an elliptical orbit ring around a system star
 */

import * as THREE from 'three'

interface OrbitRingProps {
  centerX: number
  centerY: number
  radius: number
  eccentricity?: number
  rotation?: number
  opacity?: number
  color?: string
}

export function OrbitRing({
  centerX,
  centerY,
  radius,
  eccentricity = 0,
  rotation = 0,
  opacity = 0.5,
  color = '#4a9eff'
}: OrbitRingProps) {
  // Convert grid coordinates to Three.js world coordinates
  const worldX = centerX - 1000
  const worldY = -(centerY - 500)
  
  // Create ellipse geometry
  const points: THREE.Vector3[] = []
  const segments = 64
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle) * (1 - eccentricity)
    
    // Apply rotation
    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation)
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation)
    
    points.push(new THREE.Vector3(rotatedX, rotatedY, 0))
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  
  return (
    <lineSegments
      geometry={geometry}
      position={[worldX, worldY, 0]}
    >
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        linewidth={1}
      />
    </lineSegments>
  )
}

