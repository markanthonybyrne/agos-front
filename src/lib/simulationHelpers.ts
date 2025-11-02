import {
  CombatSimulationResult,
  BatchSimulateResult,
  TestFleetResult,
  TestDefenceResult,
} from '@/types/api.types'

/**
 * Calculate win rate from batch simulation results
 */
export function calculateBatchWinRate(results: BatchSimulateResult[]): number {
  if (results.length === 0) return 0
  const successful = results.filter(r => r.success).length
  return (successful / results.length) * 100
}

/**
 * Calculate win rate from fleet test results
 */
export function calculateFleetWinRate(results: TestFleetResult[]): number {
  if (results.length === 0) return 0
  const wins = results.filter(r => r.fleet_won).length
  return (wins / results.length) * 100
}

/**
 * Calculate defence hold rate from defence test results
 */
export function calculateDefenceHoldRate(results: TestDefenceResult[]): number {
  if (results.length === 0) return 0
  const holds = results.filter(r => r.defence_won).length
  return (holds / results.length) * 100
}

/**
 * Format ship losses for display
 */
export function formatShipLosses(shipsLost: Record<number, Record<string, number>>): string {
  const entries = Object.entries(shipsLost)
  if (entries.length === 0) return 'None'
  
  return entries.map(([empireId, losses]) => {
    const shipEntries = Object.entries(losses)
    if (shipEntries.length === 0) return `Empire ${empireId}: None`
    
    const shipList = shipEntries
      .map(([ship, count]) => `${ship}: ${count}`)
      .join(', ')
    return `Empire ${empireId}: ${shipList}`
  }).join('; ')
}

/**
 * Format defence losses for display
 */
export function formatDefenceLosses(
  defencesDestroyed?: Array<{ defence_slug: string; quantity: number }>
): string {
  if (!defencesDestroyed || defencesDestroyed.length === 0) return 'None'
  
  return defencesDestroyed
    .map(d => `${d.defence_slug}: ${d.quantity}`)
    .join(', ')
}

/**
 * Export simulation result to JSON
 */
export function exportToJSON(data: any): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Export simulation result to CSV
 */
export function exportToCSV(simulation: CombatSimulationResult, name: string): string {
  const lines: string[] = []
  lines.push(`Battle Simulation: ${name}`)
  lines.push('')
  lines.push(`Winner Empire ID,${simulation.winner_empire_id}`)
  lines.push(`Battle ID,${simulation.battle_id}`)
  lines.push(`Seed,${simulation.seed}`)
  lines.push('')
  
  // Ship losses
  lines.push('Ships Lost')
  lines.push('Empire ID,Ship Type,Quantity')
  Object.entries(simulation.ships_lost).forEach(([empireId, losses]) => {
    Object.entries(losses).forEach(([ship, quantity]) => {
      lines.push(`${empireId},${ship},${quantity}`)
    })
  })
  
  lines.push('')
  
  // Defences destroyed
  if (simulation.defences_destroyed && simulation.defences_destroyed.length > 0) {
    lines.push('Defences Destroyed')
    lines.push('Defence Type,Quantity')
    simulation.defences_destroyed.forEach(d => {
      lines.push(`${d.defence_slug},${d.quantity}`)
    })
  }
  
  return lines.join('\n')
}

/**
 * Format number to percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get winner indicator color
 */
export function getWinnerColor(winnerId: number, empireId: number): string {
  return winnerId === empireId ? 'text-green-400' : 'text-red-400'
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

