/**
 * PlanetMesh - 3D planet representation
 * 
 * Renders a planet as a textured sphere or sprite
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getPlanetImage } from '@/lib/planetImages'
import { Planet } from '@/types/api.types'

interface PlanetMeshProps {
  planet: Planet
  x: number
  y: number
  size?: number
  onClick?: () => void
  onHover?: (hovered: boolean) => void
}

export function PlanetMesh({
  planet,
  x,
  y,
  size = 10,
  onClick,
  onHover
}: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const hoveredRef = useRef(false)
  
  // Get planet image
  const planetSlug = planet.type?.slug
  // Avoid sol images for planets
  const finalSlug = (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
                     planetSlug === 'sol_massive' || planetSlug === 'sol-massive') 
    ? undefined 
    : planetSlug
  const imageUrl = getPlanetImage(finalSlug)
  
  // Convert grid coordinates to Three.js world coordinates
  const worldX = x - 1000
  const worldY = -(y - 500)
  
  // Load texture
  const texture = useRef<THREE.Texture | null>(null)
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
  
  // Animate rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5
    }
  })
  
  const handlePointerEnter = () => {
    if (!hoveredRef.current) {
      hoveredRef.current = true
      onHover?.(true)
      if (meshRef.current) {
        meshRef.current.scale.setScalar(1.2)
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
  
  // Determine planet color based on type if no texture
  // Note: Planet type doesn't have is_habitable, use state instead
  const planetColor = planet.type?.slug === 'arid' ? '#d4a574' :
                     planet.type?.slug === 'oceanic' ? '#4a9eff' :
                     planet.type?.slug === 'volcanic' ? '#ff4444' :
                     planet.type?.slug === 'ice' ? '#aaccff' :
                     planet.state === 'unsettled' ? '#888888' : '#4aff4a'
  
  return (
    <mesh
      ref={meshRef}
      position={[worldX, worldY, 0]}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {texture.current ? (
        <>
          <circleGeometry args={[size, 32]} />
          <meshBasicMaterial
            map={texture.current}
            transparent
            alphaTest={0.1}
          />
        </>
      ) : (
        <>
          <circleGeometry args={[size, 32]} />
          <meshBasicMaterial
            color={planetColor}
            transparent
            opacity={0.9}
          />
        </>
      )}
    </mesh>
  )
}

