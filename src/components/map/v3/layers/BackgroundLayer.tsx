/**
 * BackgroundLayer - Transparent background with nebulas, star particles, and visual effects
 * 
 * Rendered over existing gradient fade overlay from parent component
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface BackgroundLayerProps {
  gridWidth: number
  gridHeight: number
  opacity?: number
}

export function BackgroundLayer({ gridWidth, gridHeight, opacity = 1 }: BackgroundLayerProps) {
  const nebulaGroupRef = useRef<THREE.Group>(null)
  const starsGroupRef = useRef<THREE.Points>(null)
  
  // Create star particles
  const stars = useMemo(() => {
    const count = 5000
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Random positions across the grid
      positions[i3] = (Math.random() - 0.5) * gridWidth * 1.5
      positions[i3 + 1] = (Math.random() - 0.5) * gridHeight * 1.5
      positions[i3 + 2] = (Math.random() - 0.5) * 100
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 0.5
    }
    
    return { positions, sizes }
  }, [gridWidth, gridHeight])
  
  // Create nebula clouds using noise
  const nebulas = useMemo(() => {
    const nebulaCount = 20
    const nebulaMeshes: THREE.Mesh[] = []
    
    for (let i = 0; i < nebulaCount; i++) {
      const geometry = new THREE.PlaneGeometry(200 + Math.random() * 300, 200 + Math.random() * 300, 32, 32)
      
      // Create a simple noise texture for nebula
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      
      // Create gradient radial pattern for nebula
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
      const hue = Math.random() * 60 + 240 // Blue to purple range
      const saturation = 30 + Math.random() * 40
      const lightness = 20 + Math.random() * 30
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`)
      gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`)
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 256, 256)
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        (Math.random() - 0.5) * gridWidth * 1.2,
        (Math.random() - 0.5) * gridHeight * 1.2,
        -50 + Math.random() * 50
      )
      mesh.rotation.z = Math.random() * Math.PI * 2
      
      nebulaMeshes.push(mesh)
    }
    
    return nebulaMeshes
  }, [gridWidth, gridHeight])
  
  // Animate nebulas (slow rotation and drift)
  useFrame((state, delta) => {
    if (nebulaGroupRef.current) {
      nebulaGroupRef.current.rotation.z += delta * 0.01
      nebulaGroupRef.current.children.forEach((child, i) => {
        child.rotation.z += delta * (0.01 + i * 0.001)
        if (child.position) {
          child.position.x += Math.sin(state.clock.elapsedTime + i) * delta * 2
          child.position.y += Math.cos(state.clock.elapsedTime + i) * delta * 2
        }
      })
    }
  })
  
  return (
    <group>
      {/* Star particles */}
      <points ref={starsGroupRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.positions.length / 3}
            array={stars.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={stars.sizes.length}
            array={stars.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1}
          sizeAttenuation={false}
          color="#ffffff"
          transparent
          opacity={opacity * 0.6}
        />
      </points>
      
      {/* Nebula clouds */}
      <group ref={nebulaGroupRef}>
        {nebulas.map((nebula, i) => (
          <primitive key={i} object={nebula} />
        ))}
      </group>
    </group>
  )
}

