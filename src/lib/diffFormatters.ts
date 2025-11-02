import { DetailedDiff, ValueDiff } from '@/types/api.types'

/**
 * Color code for changes: green for increases, red for decreases
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-muted-foreground'
}

/**
 * Format change value with sign indicator
 */
export function formatChange(change: number): string {
  if (change > 0) return `+${change}`
  if (change < 0) return String(change)
  return '0'
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(before: number, after: number): number {
  if (before === 0) return after > 0 ? 100 : 0
  return ((after - before) / before) * 100
}

/**
 * Group changes by entity type
 */
export type DiffGroup = {
  type: 'planets' | 'empires' | 'fleets' | 'construction_queues'
  count: number
  changes: Array<{
    id: number
    changes: Record<string, ValueDiff>
  }>
}

export function groupDiffByType(diff?: DetailedDiff): DiffGroup[] {
  if (!diff) return []
  
  const groups: DiffGroup[] = []
  
  if (diff.planets) {
    groups.push({
      type: 'planets',
      count: Object.keys(diff.planets).length,
      changes: Object.entries(diff.planets).map(([id, changes]) => ({
        id: parseInt(id),
        changes,
      })),
    })
  }
  
  if (diff.empires) {
    groups.push({
      type: 'empires',
      count: Object.keys(diff.empires).length,
      changes: Object.entries(diff.empires).map(([id, changes]) => ({
        id: parseInt(id),
        changes,
      })),
    })
  }
  
  if (diff.fleets) {
    groups.push({
      type: 'fleets',
      count: Object.keys(diff.fleets).length,
      changes: Object.entries(diff.fleets).map(([id, changes]) => ({
        id: parseInt(id),
        changes,
      })),
    })
  }
  
  if (diff.construction_queues) {
    groups.push({
      type: 'construction_queues',
      count: Object.keys(diff.construction_queues).length,
      changes: Object.entries(diff.construction_queues).map(([id, changes]) => ({
        id: parseInt(id),
        changes,
      })),
    })
  }
  
  return groups
}

/**
 * Format entity type name for display
 */
export function formatEntityType(type: DiffGroup['type']): string {
  const names = {
    planets: 'Planets',
    empires: 'Empires',
    fleets: 'Fleets',
    construction_queues: 'Construction Queues',
  }
  return names[type]
}

/**
 * Get summary statistics from diff
 */
export function getDiffSummary(diff?: DetailedDiff): {
  totalEntities: number
  totalFields: number
} {
  if (!diff) return { totalEntities: 0, totalFields: 0 }
  
  let entities = 0
  let fields = 0
  
  if (diff.planets) {
    entities += Object.keys(diff.planets).length
    fields += Object.values(diff.planets).reduce((sum, changes) => sum + Object.keys(changes).length, 0)
  }
  
  if (diff.empires) {
    entities += Object.keys(diff.empires).length
    fields += Object.values(diff.empires).reduce((sum, changes) => sum + Object.keys(changes).length, 0)
  }
  
  if (diff.fleets) {
    entities += Object.keys(diff.fleets).length
    fields += Object.values(diff.fleets).reduce((sum, changes) => sum + Object.keys(changes).length, 0)
  }
  
  if (diff.construction_queues) {
    entities += Object.keys(diff.construction_queues).length
    fields += Object.values(diff.construction_queues).reduce((sum, changes) => sum + Object.keys(changes).length, 0)
  }
  
  return { totalEntities: entities, totalFields: fields }
}

