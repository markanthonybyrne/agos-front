// Game Entity Types
export interface Coordinate {
  quadrant: number
  sector: number
  galaxy: number
  planet: number
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

