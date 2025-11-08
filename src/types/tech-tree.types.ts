/**
 * Tech Tree Type Definitions
 * Unified type system for facilities, research, ships, and defences
 */

import { TechTreePosition } from './api.types'

export type TechNodeType = 'facility' | 'research' | 'ship' | 'defence'

export type TechNodeStatus = 
  | 'locked' 
  | 'available' 
  | 'queued' 
  | 'researching'
  | 'building'
  | 'researched' 
  | 'completed'
  | 'highlighted' 
  | 'path-preview'

export type SpecializationType = 'general' | 'industrial' | 'military' | 'relic'

export interface RadialPosition {
  angle: number // in radians
  radius: number
  x: number // calculated from angle/radius
  y: number // calculated from angle/radius
}

export interface TechNodeCosts {
  tellerium?: number
  krypton?: number
  dark_matter?: number
  research_points?: number
}

export interface TechNodeProduction {
  tellerium?: number
  krypton?: number
  dark_matter?: number
}

export interface TechNodeUpkeep {
  tellerium?: number
  krypton?: number
  energy?: number
}

export interface TechNodeEffects {
  [key: string]: number | boolean | string
}

/**
 * Unified tech node data structure
 */
export interface TechNodeData {
  id: string // Format: "{type}-{slug}", e.g. "facility-mining_station"
  slug: string
  name: string
  type: TechNodeType
  status: TechNodeStatus
  
  // Era and specialization
  era?: number
  specialization?: SpecializationType
  
  // Prerequisites
  prerequisites?: string[] // Array of node IDs
  
  // Graph placement metadata
  column?: number // Derived column index for hierarchical layouts
  row?: number // Derived row index within column/era

  // Dependency metadata
  dependents?: string[] // Direct child node IDs
  unlockSummary?: Partial<Record<TechNodeType, number>> // Direct unlock counts
  prerequisiteSummary?: {
    depth: number // Longest prerequisite chain depth
    prerequisiteCount: number // Total unique prerequisites
    totalCost: TechNodeCosts // Aggregated cost of prerequisites
  }

  // Costs and resources
  costs?: TechNodeCosts
  production?: TechNodeProduction
  upkeep?: TechNodeUpkeep
  
  // Build/research time
  build_time_ticks?: number
  
  // Effects (bonuses, unlocks, etc.)
  effects?: TechNodeEffects
  
  // Description and metadata
  description?: string
  
  // Visual assets
  imageUrl?: string
  
  // Layout position (optional - calculated if not provided)
  position?: RadialPosition
  
  // Backend-provided tech tree position (optional)
  tech_tree_position?: TechTreePosition
  
  // Quantity (for items that allow multiples like facilities)
  quantity?: number
  
  // Queue information
  queuePosition?: number
  queueStartTick?: number
  queueEndTick?: number
}

/**
 * Edge connection between nodes
 */
export interface TechTreeEdge {
  from: string // Node ID
  to: string // Node ID
  type?: 'prerequisite' | 'facilitating' | 'exclusive'
}

/**
 * Complete tech tree graph data
 */
export interface TechTreeGraphData {
  nodes: TechNodeData[]
  edges: TechTreeEdge[]
  empireState: {
    active_era: number
    specializations_unlocked: SpecializationType[]
    completed_nodes: string[] // Node IDs
    queued_nodes: string[] // Node IDs
    in_progress_nodes: string[] // Node IDs with current progress
  }
}

/**
 * Radial layout configuration
 */
export interface RadialLayoutConfig {
  centerX: number
  centerY: number
  baseRadius: number
  ringSpacing: number
  angleStart?: number
  angleEnd?: number
  specializationSectors?: {
    [key in SpecializationType]?: {
      angleStart: number
      angleEnd: number
    }
  }
}

/**
 * Pathfinding result
 */
export interface TechPath {
  nodes: string[] // Node IDs in order
  totalCost: TechNodeCosts
  totalTime: number // in ticks
  isValid: boolean
  errors?: string[]
}

/**
 * Filter state for tech tree
 */
export interface TechTreeFilters {
  eras: number[] // Selected eras (empty = all)
  specializations: SpecializationType[] // Selected specializations (empty = all)
  searchQuery: string
  nodeTypes: TechNodeType[] // Filter by node type
  showLocked: boolean
  showCompleted: boolean
}

/**
 * Viewport bounds for culling
 */
export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Node position with metadata for rendering
 */
export interface NodeRenderPosition extends RadialPosition {
  era?: number
  specialization?: SpecializationType
  visible: boolean // Whether node is in viewport
}
