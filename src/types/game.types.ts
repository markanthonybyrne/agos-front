// Game Entity Types
export interface Coordinate {
  // Legacy hierarchical coordinates
  quadrant?: number
  sector?: number
  galaxy?: number
  system?: number  // System level (5-level hierarchy)
  planet?: number
  // New Region:System:Planet coordinates
  region?: number
  // X/Y coordinates (0-1999 x 0-999 grid) - source of truth for positioning
  x?: number
  y?: number
}

// X/Y coordinate type for positioning
export interface XYCoordinate {
  x: number
  y: number
}

export interface ShipType {
  name: string
  cost: {
    tellerium: number
    krypton: number
  }
  stats: {
    armour: number
    init: number
    travel_ticks: number
    gun_power: number
    accuracy: number
    agility: number
  }
}

export interface FacilityType {
  name: string
  cost: {
    tellerium: number
    krypton: number
  }
  build_time_ticks: number
  prerequisites?: string[]
}

export interface ResearchType {
  name: string
  cost: {
    tellerium: number
    krypton: number
  }
  research_time_ticks: number
  prerequisites?: string[]
}

export interface DefenceType {
  name: string
  cost: {
    tellerium: number
    krypton: number
  }
  stats: {
    armour: number
    gun_power: number
  }
}

