import { FacilityDefinition, Facility, Empire } from '@/types/api.types'

/**
 * Resource production calculation helpers for the tech tree system
 */

export interface ProductionBreakdown {
  tellerium: number
  krypton: number
  dark_matter: number
}

export interface UpkeepBreakdown {
  tellerium: number
  krypton: number
}

export interface NetProduction {
  production: ProductionBreakdown
  upkeep: UpkeepBreakdown
  net: ProductionBreakdown
}

/**
 * Calculate total production from all active facilities on a planet
 * @param facilities - Array of facility instances on the planet
 * @param facilityDefinitions - Map of facility definitions by slug
 * @param researchEffects - Active research effects that apply multipliers
 * @returns Production breakdown per resource
 */
export function calculateFacilityProduction(
  facilities: Facility[],
  facilityDefinitions: Map<string, FacilityDefinition>,
  researchEffects: Record<string, number | boolean> = {}
): ProductionBreakdown {
  const production: ProductionBreakdown = {
    tellerium: 0,
    krypton: 0,
    dark_matter: 0,
  }

  // Sum production from all active facilities
  facilities.forEach((facility) => {
    if (!facility.is_active) return

    const definition = facilityDefinitions.get(facility.facility_slug)
    if (!definition?.per_tick) return

    // Add base production multiplied by facility level
    const level = facility.level || 1
    Object.entries(definition.per_tick).forEach(([resource, baseValue]) => {
      const value = baseValue * level
      if (resource === 'tellerium') {
        production.tellerium += value
      } else if (resource === 'krypton') {
        production.krypton += value
      } else if (resource === 'dark_matter') {
        production.dark_matter += value
      }
    })
  })

  // Apply research multipliers multiplicatively
  const perTickProdMul = (researchEffects.per_tick_prod_mul as number) || 1
  const telleriumPerTickMul = (researchEffects.tellerium_per_tick_mul as number) || 1

  production.tellerium = production.tellerium * perTickProdMul * telleriumPerTickMul
  production.krypton = production.krypton * perTickProdMul
  production.dark_matter = production.dark_matter * perTickProdMul

  return production
}

/**
 * Calculate total upkeep from all active facilities on a planet
 * @param facilities - Array of facility instances on the planet
 * @param facilityDefinitions - Map of facility definitions by slug
 * @param researchEffects - Active research effects that reduce upkeep
 * @returns Upkeep breakdown per resource
 */
export function calculateFacilityUpkeep(
  facilities: Facility[],
  facilityDefinitions: Map<string, FacilityDefinition>,
  researchEffects: Record<string, number | boolean> = {}
): UpkeepBreakdown {
  const upkeep: UpkeepBreakdown = {
    tellerium: 0,
    krypton: 0,
  }

  // Sum upkeep from all active facilities
  facilities.forEach((facility) => {
    if (!facility.is_active) return

    const definition = facilityDefinitions.get(facility.facility_slug)
    if (!definition?.upkeep) return

    // Add base upkeep multiplied by facility level
    const level = facility.level || 1
    Object.entries(definition.upkeep).forEach(([resource, baseValue]) => {
      const value = baseValue * level
      if (resource === 'tellerium') {
        upkeep.tellerium += value
      } else if (resource === 'krypton') {
        upkeep.krypton += value
      }
    })
  })

  // Apply upkeep reduction (reduces upkeep, so multiply by (1 - reduction))
  const upkeepReduction = (researchEffects.upkeep_reduction as number) || 0
  const upkeepMultiplier = 1 - upkeepReduction

  upkeep.tellerium = upkeep.tellerium * upkeepMultiplier
  upkeep.krypton = upkeep.krypton * upkeepMultiplier

  return upkeep
}

/**
 * Calculate net production (production - upkeep) for a planet
 * @param facilities - Array of facility instances on the planet
 * @param facilityDefinitions - Map of facility definitions by slug
 * @param researchEffects - Active research effects
 * @returns Net production breakdown
 */
export function calculateNetProduction(
  facilities: Facility[],
  facilityDefinitions: Map<string, FacilityDefinition>,
  researchEffects: Record<string, number | boolean> = {}
): NetProduction {
  const production = calculateFacilityProduction(facilities, facilityDefinitions, researchEffects)
  const upkeep = calculateFacilityUpkeep(facilities, facilityDefinitions, researchEffects)

  return {
    production,
    upkeep,
    net: {
      tellerium: production.tellerium - upkeep.tellerium,
      krypton: production.krypton - upkeep.krypton,
      dark_matter: production.dark_matter, // Dark matter has no upkeep
    },
  }
}

/**
 * Preview production for a facility before building
 * @param facilityDefinition - The facility definition to preview
 * @param level - The level of the facility to preview
 * @param researchEffects - Active research effects
 * @returns Preview production breakdown
 */
export function previewFacilityProduction(
  facilityDefinition: FacilityDefinition,
  level: number = 1,
  researchEffects: Record<string, number | boolean> = {}
): ProductionBreakdown {
  const production: ProductionBreakdown = {
    tellerium: 0,
    krypton: 0,
    dark_matter: 0,
  }

  if (!facilityDefinition.per_tick) return production

  // Calculate base production
  Object.entries(facilityDefinition.per_tick).forEach(([resource, baseValue]) => {
    const value = baseValue * level
    if (resource === 'tellerium') {
      production.tellerium = value
    } else if (resource === 'krypton') {
      production.krypton = value
    } else if (resource === 'dark_matter') {
      production.dark_matter = value
    }
  })

  // Apply research multipliers
  const perTickProdMul = (researchEffects.per_tick_prod_mul as number) || 1
  const telleriumPerTickMul = (researchEffects.tellerium_per_tick_mul as number) || 1

  production.tellerium = production.tellerium * perTickProdMul * telleriumPerTickMul
  production.krypton = production.krypton * perTickProdMul
  production.dark_matter = production.dark_matter * perTickProdMul

  return production
}

/**
 * Preview upkeep for a facility before building
 * @param facilityDefinition - The facility definition to preview
 * @param level - The level of the facility to preview
 * @param researchEffects - Active research effects
 * @returns Preview upkeep breakdown
 */
export function previewFacilityUpkeep(
  facilityDefinition: FacilityDefinition,
  level: number = 1,
  researchEffects: Record<string, number | boolean> = {}
): UpkeepBreakdown {
  const upkeep: UpkeepBreakdown = {
    tellerium: 0,
    krypton: 0,
  }

  if (!facilityDefinition.upkeep) return upkeep

  // Calculate base upkeep
  Object.entries(facilityDefinition.upkeep).forEach(([resource, baseValue]) => {
    const value = baseValue * level
    if (resource === 'tellerium') {
      upkeep.tellerium = value
    } else if (resource === 'krypton') {
      upkeep.krypton = value
    }
  })

  // Apply upkeep reduction
  const upkeepReduction = (researchEffects.upkeep_reduction as number) || 0
  const upkeepMultiplier = 1 - upkeepReduction

  upkeep.tellerium = upkeep.tellerium * upkeepMultiplier
  upkeep.krypton = upkeep.krypton * upkeepMultiplier

  return upkeep
}

/**
 * Check if a facility would cause negative net production
 * @param currentNetProduction - Current net production
 * @param newFacilityProduction - Production from new facility
 * @param newFacilityUpkeep - Upkeep from new facility
 * @returns True if adding facility would cause negative net production
 */
export function wouldCauseNegativeNetProduction(
  currentNetProduction: NetProduction,
  newFacilityProduction: ProductionBreakdown,
  newFacilityUpkeep: UpkeepBreakdown
): boolean {
  const newNet = {
    tellerium: currentNetProduction.net.tellerium + newFacilityProduction.tellerium - newFacilityUpkeep.tellerium,
    krypton: currentNetProduction.net.krypton + newFacilityProduction.krypton - newFacilityUpkeep.krypton,
    dark_matter: currentNetProduction.net.dark_matter + newFacilityProduction.dark_matter,
  }

  return newNet.tellerium < 0 || newNet.krypton < 0
}





