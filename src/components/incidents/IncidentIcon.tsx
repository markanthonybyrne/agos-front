import { Incident, IncidentType } from '@/types/api.types'
import { cn } from '@/lib/utils'

interface IncidentIconProps {
  incident: Incident
  size?: number
  className?: string
}

/**
 * IncidentIcon - Renders an icon for an incident based on its type
 * Color coding:
 * - Wormhole: Blue/purple
 * - Asteroid Storm: Red/orange
 * - Resource Rush: Green
 * - Pirate Raid: Dark red
 * - Anomaly: Yellow/gold
 */
export function IncidentIcon({ incident, size = 24, className }: IncidentIconProps) {
  const getIconColor = (type: IncidentType): string => {
    switch (type) {
      case 'wormhole':
        return 'text-blue-500'
      case 'asteroid_storm':
        return 'text-orange-500'
      case 'resource_rush':
        return 'text-green-500'
      case 'pirate_raid':
        return 'text-red-700'
      case 'anomaly':
        return 'text-yellow-500'
      default:
        return 'text-gray-400'
    }
  }

  const getIconBgColor = (type: IncidentType): string => {
    switch (type) {
      case 'wormhole':
        return 'bg-blue-500/20'
      case 'asteroid_storm':
        return 'bg-orange-500/20'
      case 'resource_rush':
        return 'bg-green-500/20'
      case 'pirate_raid':
        return 'bg-red-700/20'
      case 'anomaly':
        return 'bg-yellow-500/20'
      default:
        return 'bg-gray-400/20'
    }
  }

  const getIconSymbol = (type: IncidentType): string => {
    switch (type) {
      case 'wormhole':
        return '🌀'
      case 'asteroid_storm':
        return '☄️'
      case 'resource_rush':
        return '💎'
      case 'pirate_raid':
        return '⚔️'
      case 'anomaly':
        return '✨'
      default:
        return '❓'
    }
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2',
        getIconBgColor(incident.type),
        getIconColor(incident.type),
        'border-current',
        className
      )}
      style={{ width: size, height: size }}
      title={incident.name}
    >
      <span style={{ fontSize: size * 0.6 }}>{getIconSymbol(incident.type)}</span>
    </div>
  )
}

