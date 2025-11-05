/**
 * Layout Algorithms for Tech Tree Visualization
 * Radial layout with era-based rings and specialization-based sectors
 */

import {
  TechNodeData,
  RadialPosition,
  RadialLayoutConfig,
  SpecializationType,
  NodeRenderPosition,
  TechTreeEdge,
} from '@/types/tech-tree.types'

/**
 * Default specialization sector angles (in radians)
 * Divides circle into 4 sectors: general, industrial, military, relic
 */
const DEFAULT_SPECIALIZATION_SECTORS: Record<SpecializationType, { angleStart: number; angleEnd: number }> = {
  general: { angleStart: 0, angleEnd: Math.PI / 2 }, // 0° to 90°
  industrial: { angleStart: Math.PI / 2, angleEnd: Math.PI }, // 90° to 180°
  military: { angleStart: Math.PI, angleEnd: (3 * Math.PI) / 2 }, // 180° to 270°
  relic: { angleStart: (3 * Math.PI) / 2, angleEnd: 2 * Math.PI }, // 270° to 360°
}

/**
 * Calculate radial layout positions for all nodes
 */
export function calculateRadialLayout(
  nodes: TechNodeData[],
  config: RadialLayoutConfig
): Map<string, RadialPosition> {
  const positions = new Map<string, RadialPosition>()
  
  // Group nodes by era
  const eraGroups = new Map<number, TechNodeData[]>()
  nodes.forEach((node) => {
    const era = node.era || 1
    if (!eraGroups.has(era)) {
      eraGroups.set(era, [])
    }
    eraGroups.get(era)!.push(node)
  })
  
  const eras = Array.from(eraGroups.keys()).sort((a, b) => a - b)
  
  eras.forEach((era) => {
    const eraNodes = eraGroups.get(era)!
    
    // Group by specialization within era
    const specGroups = new Map<SpecializationType | string, TechNodeData[]>()
    eraNodes.forEach((node) => {
      const spec = node.specialization || 'general'
      if (!specGroups.has(spec)) {
        specGroups.set(spec, [])
      }
      specGroups.get(spec)!.push(node)
    })
    
    // Process each specialization group
    specGroups.forEach((specNodes, spec) => {
      const specialization = spec as SpecializationType
      
      // Get angle range for this specialization
      let angleStart: number
      let angleEnd: number
      
      if (config.specializationSectors && config.specializationSectors[specialization]) {
        angleStart = config.specializationSectors[specialization]!.angleStart
        angleEnd = config.specializationSectors[specialization]!.angleEnd
      } else {
        const defaultSector = DEFAULT_SPECIALIZATION_SECTORS[specialization] || DEFAULT_SPECIALIZATION_SECTORS.general
        angleStart = defaultSector.angleStart
        angleEnd = defaultSector.angleEnd
      }
      
      // Calculate radius for this era
      const radius = config.baseRadius + (era - 1) * config.ringSpacing
      
      // Distribute nodes evenly across the angle range
      const angleRange = angleEnd - angleStart
      const angleStep = specNodes.length > 1 ? angleRange / (specNodes.length + 1) : angleRange / 2
      
      specNodes.forEach((node, index) => {
        // Skip if node already has a manual position
        if (node.position) {
          positions.set(node.id, node.position)
          return
        }
        
        // Calculate angle (offset by 1 to avoid starting at sector edge)
        const angle = angleStart + (index + 1) * angleStep
        
        // Add slight randomization for visual variation
        const angleVariation = (Math.random() - 0.5) * 0.1 // ±0.05 radians
        
        // Calculate x, y from polar coordinates
        const finalAngle = angle + angleVariation
        const x = config.centerX + radius * Math.cos(finalAngle)
        const y = config.centerY + radius * Math.sin(finalAngle)
        
        positions.set(node.id, {
          angle: finalAngle,
          radius,
          x,
          y,
        })
      })
    })
  })
  
  return positions
}

/**
 * Calculate hex grid cluster layout for dense node groups
 * Used as fallback when nodes would overlap in radial layout
 */
export function calculateHexClusterLayout(
  nodes: TechNodeData[],
  centerPos: RadialPosition,
  hexSize: number = 100
): Map<string, RadialPosition> {
  const positions = new Map<string, RadialPosition>()
  
  // Hex grid parameters
  const hexRadius = hexSize / 2
  const hexWidth = hexSize * Math.sqrt(3)
  const hexHeight = hexSize * 1.5
  
  // Arrange in spiral pattern
  let ring = 0
  let nodeIndex = 0
  
  while (nodeIndex < nodes.length) {
    if (ring === 0) {
      // Center hex
      const node = nodes[nodeIndex]
      if (node) {
        positions.set(node.id, {
          ...centerPos,
          angle: 0,
          radius: 0,
        })
      }
      nodeIndex++
      ring++
      continue
    }
    
    // Calculate nodes in this ring
    const nodesInRing = ring * 6
    const startAngle = (Math.PI / 6) // Start at 30 degrees
    
    for (let i = 0; i < nodesInRing && nodeIndex < nodes.length; i++) {
      const node = nodes[nodeIndex]
      if (!node) break
      
      const angle = startAngle + (i * (2 * Math.PI) / nodesInRing)
      const radius = ring * hexWidth
      
      const x = centerPos.x + radius * Math.cos(angle)
      const y = centerPos.y + radius * Math.sin(angle)
      
      positions.set(node.id, {
        angle,
        radius,
        x,
        y,
      })
      
      nodeIndex++
    }
    
    ring++
  }
  
  return positions
}

/**
 * Calculate hierarchical tree layout - nodes arranged top-to-bottom by era,
 * left-to-right within each era, with proper spacing for connections
 */
export function calculateHierarchicalLayout(
  nodes: TechNodeData[],
  edges: TechTreeEdge[],
  config: { width: number; height: number }
): Map<string, RadialPosition> {
  const positions = new Map<string, RadialPosition>()
  
  if (nodes.length === 0) return positions
  
  // Group nodes by era
  const eraGroups = new Map<number, TechNodeData[]>()
  nodes.forEach((node) => {
    const era = node.era || 1
    if (!eraGroups.has(era)) {
      eraGroups.set(era, [])
    }
    eraGroups.get(era)!.push(node)
  })
  
  const eras = Array.from(eraGroups.keys()).sort((a, b) => a - b)
  
  // Layout configuration
  const nodeWidth = 120 // Hex node width
  const nodeHeight = 140 // Hex node height
  const padding = 40
  const eraSpacing = 250 // Vertical spacing between eras
  const horizontalPadding = 100
  
  const centerX = config.width / 2
  let currentY = 100 // Start from top
  
  eras.forEach((era, eraIndex) => {
    const eraNodes = eraGroups.get(era)!
    
    if (eraNodes.length === 0) return
    
    // Calculate horizontal spacing
    const totalWidth = eraNodes.length * (nodeWidth + padding) - padding
    const startX = centerX - totalWidth / 2
    
    // Position nodes horizontally
    eraNodes.forEach((node, index) => {
      const x = startX + index * (nodeWidth + padding) + nodeWidth / 2
      
      positions.set(node.id, {
        x,
        y: currentY,
        angle: 0,
        radius: 0,
      })
    })
    
    // Move to next era
    currentY += eraSpacing
  })
  
  return positions
}

/**
 * Calculate default layout configuration
 */
export function getDefaultLayoutConfig(
  width: number,
  height: number
): RadialLayoutConfig {
  return {
    centerX: width / 2,
    centerY: height / 2,
    baseRadius: 150,
    ringSpacing: 200,
    specializationSectors: DEFAULT_SPECIALIZATION_SECTORS,
  }
}

/**
 * Check if two nodes would overlap and need cluster layout
 */
export function checkOverlap(
  pos1: RadialPosition,
  pos2: RadialPosition,
  minDistance: number = 120
): boolean {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < minDistance
}

/**
 * Optimize node positions to avoid overlaps
 */
export function optimizePositions(
  positions: Map<string, RadialPosition>,
  minDistance: number = 120,
  maxIterations: number = 10
): Map<string, RadialPosition> {
  const optimized = new Map(positions)
  const nodeIds = Array.from(positions.keys())
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let moved = false
    
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const id1 = nodeIds[i]
        const id2 = nodeIds[j]
        const pos1 = optimized.get(id1)!
        const pos2 = optimized.get(id2)!
        
        if (checkOverlap(pos1, pos2, minDistance)) {
          // Push nodes apart
          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          
          const pushDistance = (minDistance - distance) / 2
          const pushX = (dx / distance) * pushDistance
          const pushY = (dy / distance) * pushDistance
          
          // Update positions
          const newPos1: RadialPosition = {
            angle: Math.atan2(pos1.y - pushY - pos1.y, pos1.x - pushX - pos1.x),
            radius: Math.sqrt((pos1.x - pushX) ** 2 + (pos1.y - pushY) ** 2),
            x: pos1.x - pushX,
            y: pos1.y - pushY,
          }
          
          const newPos2: RadialPosition = {
            angle: Math.atan2(pos2.y + pushY - pos2.y, pos2.x + pushX - pos2.x),
            radius: Math.sqrt((pos2.x + pushX) ** 2 + (pos2.y + pushY) ** 2),
            x: pos2.x + pushX,
            y: pos2.y + pushY,
          }
          
          optimized.set(id1, newPos1)
          optimized.set(id2, newPos2)
          moved = true
        }
      }
    }
    
    if (!moved) break
  }
  
  return optimized
}

/**
 * Apply viewport culling to filter visible nodes
 */
export function applyViewportCulling(
  positions: Map<string, RadialPosition>,
  viewport: { minX: number; maxX: number; minY: number; maxY: number },
  buffer: number = 200
): Map<string, NodeRenderPosition> {
  const visible = new Map<string, NodeRenderPosition>()
  
  positions.forEach((pos, nodeId) => {
    const inViewport =
      pos.x >= viewport.minX - buffer &&
      pos.x <= viewport.maxX + buffer &&
      pos.y >= viewport.minY - buffer &&
      pos.y <= viewport.maxY + buffer
    
    if (inViewport) {
      visible.set(nodeId, {
        ...pos,
        visible: true,
      })
    }
  })
  
  return visible
}
