/**
 * GraphEngine - Pure logic module for tech tree graph operations
 * No React dependencies - can be used by backend and frontend
 */

import {
  TechNodeData,
  TechTreeGraphData,
  TechTreeEdge,
  TechPath,
  TechNodeCosts,
  SpecializationType,
  TechNodeType,
} from '@/types/tech-tree.types'

/**
 * Build graph structure from API data
 * Handles both old TechTreeApiResponse and new TechTreeDefinitionsResponse formats
 */
export function buildGraph(
  apiData: any,
  completedNodes: string[] = [],
  queuedNodes: string[] = [],
  inProgressNodes: string[] = []
): TechTreeGraphData {
  const nodes: TechNodeData[] = []
  const edges: TechTreeEdge[] = []
  
  // Detect if this is the new definitions API format (has empire.active_era and empire.specializations_unlocked)
  const isDefinitionsFormat = apiData.empire && typeof apiData.empire.active_era === 'number'
  
  // Process facilities
  if (apiData.facilities) {
    apiData.facilities.forEach((facility: any) => {
      const nodeId = `facility-${facility.slug}`
      
      // Determine status - handle both old and new API formats
      let status: TechNodeData['status'] = 'locked'
      
      if (isDefinitionsFormat) {
        // New format: use completed, can_build, available, unlocked fields
        // When planet_id is provided, can_build indicates planet-specific availability
        if (facility.completed) {
          status = 'completed'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'building'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (facility.can_build !== undefined) {
          // Planet context: use can_build if provided (more accurate for planet-specific view)
          if (facility.can_build) {
            status = 'available'
          } else {
            status = 'locked'
          }
        } else if (facility.available && facility.unlocked) {
          // No planet context: use available and unlocked
          status = 'available'
        } else if (facility.unlocked) {
          status = 'locked' // Unlocked but not available (missing prerequisites)
        } else {
          status = 'locked' // Not unlocked
        }
      } else {
        // Old format: use completedNodes array
        if (completedNodes.includes(nodeId)) {
          status = 'completed'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'building'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (facility.can_build && facility.unlocked) {
          status = 'available'
        } else if (facility.unlocked) {
          status = 'locked'
        }
      }
      
      const node: TechNodeData = {
        id: nodeId,
        slug: facility.slug,
        name: facility.name,
        type: 'facility',
        status,
        era: facility.era,
        specialization: facility.specialization || 'general',
        prerequisites: facility.prerequisites || [],
        costs: {
          tellerium: facility.base_tellerium_cost,
          krypton: facility.base_krypton_cost,
        },
        production: facility.per_tick ? {
          tellerium: facility.per_tick.tellerium,
          krypton: facility.per_tick.krypton,
        } : undefined,
        upkeep: facility.upkeep ? {
          tellerium: facility.upkeep.tellerium,
          krypton: facility.upkeep.krypton,
          energy: facility.upkeep.energy,
        } : undefined,
        build_time_ticks: facility.build_time_ticks,
        description: facility.description,
        effects: facility.effects,
        quantity: facility.quantity,
        // Include tech_tree_position from new API format
        tech_tree_position: facility.tech_tree_position,
      }
      
      nodes.push(node)
      
      // Create edges for prerequisites
      if (facility.prerequisites && facility.prerequisites.length > 0) {
        facility.prerequisites.forEach((prereq: string) => {
          // Determine prereq ID (could be facility, research, etc.)
          const prereqId = prereq.includes('-') ? prereq : `facility-${prereq}`
          edges.push({
            from: prereqId,
            to: nodeId,
            type: 'prerequisite',
          })
        })
      }
    })
  }
  
  // Process research
  if (apiData.research) {
    apiData.research.forEach((research: any) => {
      const nodeId = `research-${research.slug}`
      
      let status: TechNodeData['status'] = 'locked'
      
      if (isDefinitionsFormat) {
        // New format
        if (research.completed) {
          status = 'researched'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'researching'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (research.can_research !== undefined) {
          // Planet context: use can_research if provided
          if (research.can_research) {
            status = 'available'
          } else {
            status = 'locked'
          }
        } else if (research.available && research.unlocked) {
          // No planet context: use available and unlocked
          status = 'available'
        } else if (research.unlocked) {
          status = 'locked'
        } else {
          status = 'locked'
        }
      } else {
        // Old format
        if (completedNodes.includes(nodeId)) {
          status = 'researched'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'researching'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (research.can_research && research.unlocked) {
          status = 'available'
        } else if (research.unlocked) {
          status = 'locked'
        }
      }
      
      const node: TechNodeData = {
        id: nodeId,
        slug: research.slug,
        name: research.name,
        type: 'research',
        status,
        era: research.era,
        specialization: research.specialization || 'general',
        prerequisites: [
          ...(research.prerequisite_facilities || []).map((p: string) => 
            p.includes('-') ? p : `facility-${p}`
          ),
          ...(research.prerequisite_research || []).map((p: string) => 
            p.includes('-') ? p : `research-${p}`
          ),
        ],
        costs: {
          tellerium: research.cost_tellerium,
          krypton: research.cost_krypton,
          research_points: research.cost_research_points,
        },
        build_time_ticks: research.build_time_ticks,
        description: research.description,
        effects: research.effects,
        tech_tree_position: research.tech_tree_position,
      }
      
      nodes.push(node)
      
      // Create edges
      node.prerequisites?.forEach((prereq) => {
        edges.push({
          from: prereq,
          to: nodeId,
          type: 'prerequisite',
        })
      })
    })
  }
  
  // Process ships
  if (apiData.ships) {
    apiData.ships.forEach((ship: any) => {
      const nodeId = `ship-${ship.slug}`
      
      let status: TechNodeData['status'] = 'locked'
      
      if (isDefinitionsFormat) {
        if (ship.completed) {
          status = 'completed'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'building'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (ship.can_build !== undefined) {
          // Planet context: use can_build if provided
          if (ship.can_build) {
            status = 'available'
          } else {
            status = 'locked'
          }
        } else if (ship.available && ship.unlocked) {
          // No planet context: use available and unlocked
          status = 'available'
        } else if (ship.unlocked) {
          status = 'locked'
        } else {
          status = 'locked'
        }
      } else {
        if (ship.can_build && ship.unlocked) {
          status = 'available'
        } else if (ship.unlocked) {
          status = 'locked'
        }
      }
      
      const node: TechNodeData = {
        id: nodeId,
        slug: ship.slug,
        name: ship.name,
        type: 'ship',
        status,
        era: ship.era,
        specialization: ship.specialization || 'general',
        prerequisites: (ship.prerequisites || []).map((p: string) => 
          p.includes('-') ? p : `facility-${p}`
        ),
        costs: {
          tellerium: ship.tellerium_cost,
          krypton: ship.krypton_cost,
        },
        build_time_ticks: ship.build_time_ticks,
        description: ship.description,
        tech_tree_position: ship.tech_tree_position,
      }
      
      nodes.push(node)
      
      // Create edges
      node.prerequisites?.forEach((prereq) => {
        edges.push({
          from: prereq,
          to: nodeId,
          type: 'prerequisite',
        })
      })
    })
  }
  
  // Process defences
  if (apiData.defences) {
    apiData.defences.forEach((defence: any) => {
      const nodeId = `defence-${defence.slug}`
      
      let status: TechNodeData['status'] = 'locked'
      
      if (isDefinitionsFormat) {
        if (defence.completed) {
          status = 'completed'
        } else if (inProgressNodes.includes(nodeId)) {
          status = 'building'
        } else if (queuedNodes.includes(nodeId)) {
          status = 'queued'
        } else if (defence.can_build !== undefined) {
          // Planet context: use can_build if provided
          if (defence.can_build) {
            status = 'available'
          } else {
            status = 'locked'
          }
        } else if (defence.available && defence.unlocked) {
          // No planet context: use available and unlocked
          status = 'available'
        } else if (defence.unlocked) {
          status = 'locked'
        } else {
          status = 'locked'
        }
      } else {
        if (defence.can_build && defence.unlocked) {
          status = 'available'
        } else if (defence.unlocked) {
          status = 'locked'
        }
      }
      
      const node: TechNodeData = {
        id: nodeId,
        slug: defence.slug,
        name: defence.name,
        type: 'defence',
        status,
        era: defence.era,
        specialization: defence.specialization || 'general',
        prerequisites: (defence.prerequisites || []).map((p: string) => 
          p.includes('-') ? p : `facility-${p}`
        ),
        costs: {
          tellerium: defence.tellerium_cost,
          krypton: defence.krypton_cost,
        },
        build_time_ticks: defence.build_time_ticks,
        description: defence.description,
        tech_tree_position: defence.tech_tree_position,
      }
      
      nodes.push(node)
      
      // Create edges
      node.prerequisites?.forEach((prereq) => {
        edges.push({
          from: prereq,
          to: nodeId,
          type: 'prerequisite',
        })
      })
    })
  }
  
  // Enrich graph with derived metadata (columns, dependency summaries, etc.)
  enrichGraphMetadata(nodes, edges)

  // Extract empire state - handle both formats
  let activeEra = 1
  let specializationsUnlocked: string[] = []
  
  if (isDefinitionsFormat) {
    // New format
    activeEra = apiData.empire?.active_era || 1
    specializationsUnlocked = apiData.empire?.specializations_unlocked || []
  } else {
    // Old format
    activeEra = apiData.empire?.active_era || 1
    specializationsUnlocked = apiData.empire?.specializations_unlocked || []
  }
  
  return {
    nodes,
    edges,
    empireState: {
      active_era: activeEra,
      specializations_unlocked: specializationsUnlocked as any[],
      completed_nodes: completedNodes,
      queued_nodes: queuedNodes,
      in_progress_nodes: inProgressNodes,
    },
  }
}

/**
 * Enrich nodes with derived metadata for layouts and analytics
 */
function enrichGraphMetadata(nodes: TechNodeData[], edges: TechTreeEdge[]) {
  const nodeMap = new Map<string, TechNodeData>()
  const prerequisitesMap = new Map<string, Set<string>>()
  const dependentsMap = new Map<string, Set<string>>()

  nodes.forEach((node) => {
    nodeMap.set(node.id, node)
    if (!prerequisitesMap.has(node.id)) {
      prerequisitesMap.set(node.id, new Set())
    }
    if (!dependentsMap.has(node.id)) {
      dependentsMap.set(node.id, new Set())
    }
  })

  edges.forEach(({ from, to }) => {
    if (!prerequisitesMap.has(to)) {
      prerequisitesMap.set(to, new Set())
    }
    prerequisitesMap.get(to)!.add(from)

    if (!dependentsMap.has(from)) {
      dependentsMap.set(from, new Set())
    }
    dependentsMap.get(from)!.add(to)
  })

  const levelMemo = new Map<string, number>()

  const computeLevel = (nodeId: string): number => {
    if (levelMemo.has(nodeId)) {
      return levelMemo.get(nodeId)!
    }
    const prereqs = prerequisitesMap.get(nodeId)
    if (!prereqs || prereqs.size === 0) {
      levelMemo.set(nodeId, 0)
      return 0
    }
    let maxLevel = 0
    prereqs.forEach((prereqId) => {
      if (!nodeMap.has(prereqId)) return
      const level = computeLevel(prereqId)
      if (level + 1 > maxLevel) {
        maxLevel = level + 1
      }
    })
    levelMemo.set(nodeId, maxLevel)
    return maxLevel
  }

  const ancestorMemo = new Map<string, Set<string>>()

  const gatherAncestors = (nodeId: string, visited: Set<string> = new Set()): Set<string> => {
    if (ancestorMemo.has(nodeId)) {
      return ancestorMemo.get(nodeId)!
    }
    const result = new Set<string>()
    const prereqs = prerequisitesMap.get(nodeId)
    if (!prereqs) {
      ancestorMemo.set(nodeId, result)
      return result
    }
    prereqs.forEach((prereqId) => {
      if (visited.has(prereqId)) return
      visited.add(prereqId)
      result.add(prereqId)
      gatherAncestors(prereqId, visited).forEach((ancestor) => result.add(ancestor))
    })
    ancestorMemo.set(nodeId, result)
    return result
  }

  const addCosts = (base: TechNodeCosts = {}, addition?: TechNodeCosts): TechNodeCosts => {
    if (!addition) return { ...base }
    return {
      tellerium: (base.tellerium ?? 0) + (addition.tellerium ?? 0),
      krypton: (base.krypton ?? 0) + (addition.krypton ?? 0),
      dark_matter: (base.dark_matter ?? 0) + (addition.dark_matter ?? 0),
      research_points: (base.research_points ?? 0) + (addition.research_points ?? 0),
    }
  }

  // Assign metadata per node
  nodes.forEach((node) => {
    const level = computeLevel(node.id)
    node.column = level

    // Dependents
    const dependents = Array.from(dependentsMap.get(node.id) ?? [])
    node.dependents = dependents

    // Unlock summary (direct dependents per type)
    if (dependents.length > 0) {
      const summary: Partial<Record<TechNodeType, number>> = {}
      dependents.forEach((depId) => {
        const depNode = nodeMap.get(depId)
        if (!depNode) return
        summary[depNode.type] = (summary[depNode.type] ?? 0) + 1
      })
      node.unlockSummary = summary
    } else {
      node.unlockSummary = {}
    }

    // Prerequisite summary
    const ancestors = gatherAncestors(node.id)
    let depth = 0
    ancestors.forEach((ancestorId) => {
      const ancestorLevel = computeLevel(ancestorId)
      if (ancestorLevel + 1 > depth) {
        depth = ancestorLevel + 1
      }
    })

    let aggregatedCost: TechNodeCosts = {}
    ancestors.forEach((ancestorId) => {
      const ancestorNode = nodeMap.get(ancestorId)
      if (ancestorNode?.costs) {
        aggregatedCost = addCosts(aggregatedCost, ancestorNode.costs)
      }
    })

    node.prerequisiteSummary = {
      depth,
      prerequisiteCount: ancestors.size,
      totalCost: aggregatedCost,
    }
  })
}

/**
 * Find path from completed nodes to target node using BFS
 */
export function findPath(
  graph: TechTreeGraphData,
  targetNodeId: string,
  specializationFilter?: SpecializationType
): TechPath {
  const completedNodes = new Set(graph.empireState.completed_nodes)
  const targetNode = graph.nodes.find((n) => n.id === targetNodeId)
  
  if (!targetNode) {
    return {
      nodes: [],
      totalCost: {},
      totalTime: 0,
      isValid: false,
      errors: ['Target node not found'],
    }
  }
  
  // If target is already completed, return empty path
  if (completedNodes.has(targetNodeId)) {
    return {
      nodes: [],
      totalCost: {},
      totalTime: 0,
      isValid: true,
    }
  }
  
  // Build adjacency list (reverse: from prerequisites to dependents)
  const reverseEdges = new Map<string, string[]>()
  graph.edges.forEach((edge) => {
    if (!reverseEdges.has(edge.to)) {
      reverseEdges.set(edge.to, [])
    }
    reverseEdges.get(edge.to)!.push(edge.from)
  })
  
  // BFS from target backwards to find what we need
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: targetNodeId, path: [targetNodeId] },
  ]
  const visited = new Set<string>()
  const neededNodes = new Set<string>()
  
  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!
    
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    
    // If this node is completed, we don't need to traverse further
    if (completedNodes.has(nodeId)) {
      continue
    }
    
    // Mark as needed
    neededNodes.add(nodeId)
    
    // Get prerequisites
    const prerequisites = reverseEdges.get(nodeId) || []
    prerequisites.forEach((prereqId) => {
      if (!visited.has(prereqId)) {
        queue.push({ nodeId: prereqId, path: [...path, prereqId] })
      }
    })
  }
  
  // Build path in forward order (from completed to target)
  // Use topological sort to order prerequisites
  const pathNodes: string[] = []
  const processing = new Set<string>()
  const processed = new Set<string>()
  
  function processNode(nodeId: string) {
    if (processed.has(nodeId)) return
    if (processing.has(nodeId)) return // Circular dependency
    
    processing.add(nodeId)
    
    const prerequisites = reverseEdges.get(nodeId) || []
    prerequisites.forEach((prereq) => {
      if (neededNodes.has(prereq) && !completedNodes.has(prereq)) {
        processNode(prereq)
      }
    })
    
    processing.delete(nodeId)
    processed.add(nodeId)
    
    if (neededNodes.has(nodeId) && !completedNodes.has(nodeId)) {
      pathNodes.push(nodeId)
    }
  }
  
  processNode(targetNodeId)
  
  // Calculate total cost and time
  let totalCost: TechNodeCosts = {}
  let totalTime = 0
  
  pathNodes.forEach((nodeId) => {
    const node = graph.nodes.find((n) => n.id === nodeId)
    if (node) {
      if (node.costs) {
        totalCost.tellerium = (totalCost.tellerium || 0) + (node.costs.tellerium || 0)
        totalCost.krypton = (totalCost.krypton || 0) + (node.costs.krypton || 0)
        totalCost.dark_matter = (totalCost.dark_matter || 0) + (node.costs.dark_matter || 0)
        totalCost.research_points = (totalCost.research_points || 0) + (node.costs.research_points || 0)
      }
      totalTime += node.build_time_ticks || 0
    }
  })
  
  // Apply specialization filter preference (reduce cost weight for matching nodes)
  if (specializationFilter && specializationFilter !== 'general') {
    // Path is valid if it exists
    // Could prioritize specialization nodes in path selection, but BFS gives shortest path
  }
  
  return {
    nodes: pathNodes,
    totalCost,
    totalTime,
    isValid: pathNodes.length > 0 || completedNodes.has(targetNodeId),
  }
}

/**
 * Get neighbors of a node (nodes that depend on this node, or nodes this depends on)
 */
export function getNeighbors(
  graph: TechTreeGraphData,
  nodeId: string,
  direction: 'dependents' | 'prerequisites' = 'dependents'
): string[] {
  if (direction === 'dependents') {
    // Nodes that depend on this one
    return graph.edges
      .filter((edge) => edge.from === nodeId)
      .map((edge) => edge.to)
  } else {
    // Prerequisites of this node
    return graph.edges
      .filter((edge) => edge.to === nodeId)
      .map((edge) => edge.from)
  }
}

/**
 * Check if a node is available (all prerequisites met)
 */
export function checkAvailability(
  graph: TechTreeGraphData,
  nodeId: string
): { available: boolean; missingPrerequisites: string[] } {
  const node = graph.nodes.find((n) => n.id === nodeId)
  if (!node) {
    return { available: false, missingPrerequisites: [] }
  }
  
  const completedNodes = new Set(graph.empireState.completed_nodes)
  const missingPrerequisites: string[] = []
  
  node.prerequisites?.forEach((prereqId) => {
    if (!completedNodes.has(prereqId)) {
      missingPrerequisites.push(prereqId)
    }
  })
  
  return {
    available: missingPrerequisites.length === 0,
    missingPrerequisites,
  }
}

/**
 * Filter nodes by specialization
 */
export function filterBySpecialization(
  nodes: TechNodeData[],
  specializations: SpecializationType[]
): TechNodeData[] {
  if (specializations.length === 0) return nodes
  
  return nodes.filter((node) => {
    // Always show general nodes
    if (node.specialization === 'general') return true
    // Show if specialization is in filter
    return node.specialization && specializations.includes(node.specialization)
  })
}

/**
 * Filter nodes by era
 */
export function filterByEra(
  nodes: TechNodeData[],
  maxEra: number
): TechNodeData[] {
  return nodes.filter((node) => {
    if (!node.era) return true
    return node.era <= maxEra
  })
}

/**
 * Filter nodes by type
 */
export function filterByType(
  nodes: TechNodeData[],
  types: TechNodeType[]
): TechNodeData[] {
  if (types.length === 0) return nodes
  return nodes.filter((node) => types.includes(node.type))
}
