/**
 * IncidentLayer - Renders incidents on the map as icons with radius circles
 */

import { useMemo } from 'react'
import { Incident } from '@/types/api.types'
import { IncidentIcon } from './IncidentIcon'

interface IncidentLayerProps {
  incidents: Incident[]
  scale: number
  viewportBounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  onIncidentClick?: (incident: Incident) => void
  onIncidentHover?: (incident: Incident | null) => void
}

export function IncidentLayer({
  incidents,
  scale,
  viewportBounds,
  onIncidentClick,
  onIncidentHover,
}: IncidentLayerProps) {
  // Make the layer interactive
  const handleClick = (e: React.MouseEvent<SVGGElement>, incident: Incident) => {
    e.stopPropagation()
    onIncidentClick?.(incident)
  }

  const handleMouseEnter = (e: React.MouseEvent<SVGGElement>, incident: Incident) => {
    e.stopPropagation()
    onIncidentHover?.(incident)
  }

  const handleMouseLeave = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation()
    onIncidentHover?.(null)
  }
  // Filter incidents visible in viewport
  const visibleIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const { x, y } = incident.location
      const padding = incident.radius + 50 // Add padding for radius
      return (
        x >= viewportBounds.minX - padding &&
        x <= viewportBounds.maxX + padding &&
        y >= viewportBounds.minY - padding &&
        y <= viewportBounds.maxY + padding
      )
    })
  }, [incidents, viewportBounds])

  const getRadiusColor = (type: Incident['type']): string => {
    switch (type) {
      case 'wormhole':
        return 'rgba(59, 130, 246, 0.3)' // blue-500
      case 'asteroid_storm':
        return 'rgba(249, 115, 22, 0.3)' // orange-500
      case 'resource_rush':
        return 'rgba(34, 197, 94, 0.3)' // green-500
      case 'pirate_raid':
        return 'rgba(185, 28, 28, 0.3)' // red-700
      case 'anomaly':
        return 'rgba(234, 179, 8, 0.3)' // yellow-500
      default:
        return 'rgba(156, 163, 175, 0.3)' // gray-400
    }
  }

  const getRadiusStrokeColor = (type: Incident['type']): string => {
    switch (type) {
      case 'wormhole':
        return 'rgba(59, 130, 246, 0.6)'
      case 'asteroid_storm':
        return 'rgba(249, 115, 22, 0.6)'
      case 'resource_rush':
        return 'rgba(34, 197, 94, 0.6)'
      case 'pirate_raid':
        return 'rgba(185, 28, 28, 0.6)'
      case 'anomaly':
        return 'rgba(234, 179, 8, 0.6)'
      default:
        return 'rgba(156, 163, 175, 0.6)'
    }
  }

  return (
    <g className="incident-layer" style={{ pointerEvents: 'auto' }}>
      {visibleIncidents.map(incident => {
        const { x, y } = incident.location
        const radius = incident.radius
        const iconSize = Math.max(20, Math.min(40, scale * 10))

        return (
          <g
            key={incident.id}
            className="cursor-pointer"
            onClick={(e) => handleClick(e, incident)}
            onMouseEnter={(e) => handleMouseEnter(e, incident)}
            onMouseLeave={(e) => handleMouseLeave(e)}
          >
            {/* Radius circle */}
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={getRadiusColor(incident.type)}
              stroke={getRadiusStrokeColor(incident.type)}
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.6}
            />
            
            {/* Incident icon */}
            <foreignObject
              x={x - iconSize / 2}
              y={y - iconSize / 2}
              width={iconSize}
              height={iconSize}
            >
              <IncidentIcon incident={incident} size={iconSize} />
            </foreignObject>
            
            {/* Incident name label */}
            <text
              x={x}
              y={y + iconSize / 2 + 15}
              textAnchor="middle"
              className="fill-white text-xs font-semibold"
              style={{
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 0.6)',
                pointerEvents: 'none',
              }}
            >
              {incident.name}
            </text>
          </g>
        )
      })}
    </g>
  )
}

