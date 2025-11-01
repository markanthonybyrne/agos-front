import { ExplorationStatus } from '@/types/api.types'

type MapItemType = 'quadrant' | 'sector' | 'galaxy' | 'planet'

export function getUnlockRequirement(
  currentStatus: ExplorationStatus | undefined,
  itemType: MapItemType
): string {
  if (!currentStatus) {
    return 'Loading exploration status...'
  }

  switch (itemType) {
    case 'quadrant':
      if (!currentStatus.unlocks.deep_space_scanning) {
        return 'Requires Deep Space Scanning research (ERA 3)'
      }
      break
    case 'sector':
      if (!currentStatus.unlocks.sensor_technology) {
        return 'Requires Sensor Technology research (ERA 2)'
      }
      break
    case 'galaxy':
      // Galaxies can be discovered by signals/scouts or unlocked by research
      if (!currentStatus.unlocks.sensor_technology) {
        return 'Requires Sensor Technology research (ERA 2) or a successful signal scan'
      }
      break
    case 'planet':
      // Planets are visible if their galaxy is visible
      if (!currentStatus.unlocks.sensor_technology) {
        return 'Requires Sensor Technology research (ERA 2) to view planets in undiscovered galaxies'
      }
      break
  }
  return 'Undiscovered'
}

export function getFleetRangeRequirement(
  currentRange: string,
  targetRange: string
): string {
  const requirements: Record<string, string> = {
    cross_galaxy: 'Research "Propulsion Technology" for cross-galaxy travel',
    cross_sector: 'Research "Warp Technology" for cross-sector travel',
    cross_quadrant: 'Research "Warp Technology" for cross-quadrant travel',
  }
  return requirements[targetRange] || 'Unknown requirement'
}

