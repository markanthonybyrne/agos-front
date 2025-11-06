/**
 * QuadrantBoundariesLayer - Quadrant overlay with grid lines
 * 
 * Shows quadrant boundaries and grid lines at sector level
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { gridToWorld } from '@/lib/v3/ViewportProjection'
import { ProjectionConfig } from '@/lib/v3/ViewportProjection'

interface QuadrantBoundariesLayerProps {
  gridWidth: number
  gridHeight: number
  config: ProjectionConfig
  opacity?: number
  normalizedZoom: number
}

export function QuadrantBoundariesLayer({
  gridWidth,
  gridHeight,
  config,
  opacity = 1,
  normalizedZoom
}: QuadrantBoundariesLayerProps) {
  // Only show boundaries at sector level (normalizedZoom < 0.30)
  const visible = normalizedZoom < 0.30
  const effectiveOpacity = visible ? opacity * (1 - normalizedZoom / 0.30) : 0
  
  // Quadrant boundaries (4 quadrants in 2x2 grid)
  const quadrantLines = useMemo(() => {
    const lines: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = []
    
    // Vertical line (middle of grid)
    lines.push({
      start: { x: gridWidth / 2, y: 0 },
      end: { x: gridWidth / 2, y: gridHeight }
    })
    
    // Horizontal line (middle of grid)
    lines.push({
      start: { x: 0, y: gridHeight / 2 },
      end: { x: gridWidth, y: gridHeight / 2 }
    })
    
    return lines
  }, [gridWidth, gridHeight])
  
  // Sector grid lines (16 sectors: 4x4 within each quadrant)
  const sectorLines = useMemo(() => {
    const lines: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = []
    
    // Vertical sector lines
    for (let i = 1; i < 4; i++) {
      const x = (gridWidth / 4) * i
      lines.push({
        start: { x, y: 0 },
        end: { x, y: gridHeight }
      })
    }
    
    // Horizontal sector lines
    for (let i = 1; i < 4; i++) {
      const y = (gridHeight / 4) * i
      lines.push({
        start: { x: 0, y },
        end: { x: gridWidth, y }
      })
    }
    
    return lines
  }, [gridWidth, gridHeight])
  
  // Create line geometries
  const quadrantLineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    
    quadrantLines.forEach(line => {
      const start = gridToWorld(line.start.x, line.start.y, config)
      const end = gridToWorld(line.end.x, line.end.y, config)
      points.push(new THREE.Vector3(start.x, start.y, start.z))
      points.push(new THREE.Vector3(end.x, end.y, end.z))
    })
    
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [quadrantLines, config])
  
  const sectorLineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    
    sectorLines.forEach(line => {
      const start = gridToWorld(line.start.x, line.start.y, config)
      const end = gridToWorld(line.end.x, line.end.y, config)
      points.push(new THREE.Vector3(start.x, start.y, start.z))
      points.push(new THREE.Vector3(end.x, end.y, end.z))
    })
    
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [sectorLines, config])
  
  if (!visible || effectiveOpacity <= 0) return null
  
  return (
    <group>
      {/* Quadrant boundaries - thicker, more visible */}
      <lineSegments geometry={quadrantLineGeometry}>
        <lineBasicMaterial
          color="#4a9eff"
          transparent
          opacity={effectiveOpacity * 0.8}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Sector grid lines - thinner */}
      <lineSegments geometry={sectorLineGeometry}>
        <lineBasicMaterial
          color="#5aaaff"
          transparent
          opacity={effectiveOpacity * 0.4}
          linewidth={1}
        />
      </lineSegments>
    </group>
  )
}


