import { TachyonSignal } from '@/types/api.types'
import { regionSystemToXy } from '@/lib/coordinateUtils'

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
    typeof signal.target_region === 'number' &&
    typeof signal.target_system === 'number' &&
    typeof signal.target_planet === 'number'
  ) {
    const xy = regionSystemToXy(signal.target_region, signal.target_system, signal.target_planet)
    return { x: Math.round(xy.x), y: Math.round(xy.y) }
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


