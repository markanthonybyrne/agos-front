import { TachyonSignal } from '@/types/api.types'
import { getSystemXyRange, hierarchicalToXy } from '@/lib/coordinateUtils'

interface XYCoordinate {
  x: number
  y: number
}

export function getSignalXY(signal: TachyonSignal): XYCoordinate | null {
  if (typeof signal.target_x === 'number' && typeof signal.target_y === 'number') {
    return {
      x: Math.round(signal.target_x),
      y: Math.round(signal.target_y),
    }
  }

  if (
    typeof signal.target_quadrant === 'number' &&
    typeof signal.target_sector === 'number' &&
    typeof signal.target_galaxy === 'number'
  ) {
    if (typeof signal.target_system === 'number' && signal.target_system > 0) {
      const systemRange = getSystemXyRange(
        signal.target_quadrant,
        signal.target_sector,
        signal.target_galaxy,
        signal.target_system,
      )
      return {
        x: Math.floor((systemRange.x_min + systemRange.x_max) / 2),
        y: Math.floor((systemRange.y_min + systemRange.y_max) / 2),
      }
    }

    if (typeof signal.target_planet === 'number' && signal.target_planet > 0) {
      const xy = hierarchicalToXy(
        signal.target_quadrant,
        signal.target_sector,
        signal.target_galaxy,
        signal.target_planet,
      )
      return {
        x: Math.round(xy.x),
        y: Math.round(xy.y),
      }
    }
  }

  return null
}

export function formatSignalCoordinate(signal: TachyonSignal): string {
  const xy = getSignalXY(signal)
  if (!xy) {
    return 'Unknown'
  }
  return `X:${xy.x}:${xy.y}`
}


