// Shared prerequisite helpers for buildable items

export const DEFENCE_REQUIREMENTS: Record<string, { facilities: string[]; research: string[] }> = {
  basic_turret: {
    facilities: ['drone_factory'],
    research: ['military_doctrine'],
  },
  emp_mine: {
    facilities: ['drone_factory'],
    research: ['basic_combat'],
  },
  ion_cannon: {
    facilities: ['sensor_network'],
    research: ['basic_combat'],
  },
  laser_turret: {
    facilities: ['basic_shipyard'],
    research: ['advanced_combat'],
  },
  missile_battery: {
    facilities: ['basic_shipyard'],
    research: ['advanced_combat'],
  },
  plasma_cannon: {
    facilities: ['military_complex'],
    research: ['energy_shields'],
  },
  quantum_defence: {
    facilities: ['orbital_bastion'],
    research: ['quantum_armor', 'warp_technology'],
  },
}

export function getDefenceRequirements(slug: string): { facilities: string[]; research: string[] } {
  return DEFENCE_REQUIREMENTS[slug] || { facilities: [], research: [] }
}

export function formatPrerequisiteSlug(slug: string): string {
  if (!slug) return 'Unknown requirement'
  return slug
    .replace(/[:]/g, ' ')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
