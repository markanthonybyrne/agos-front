import { useAppSelector } from '@/app/hooks'
import { formatTickETA } from '@/lib/formatters'

export function useTick() {
  const currentTick = useAppSelector((state) => state.game.currentTick)
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA)
  const isTickProcessing = useAppSelector((state) => state.game.isTickProcessing)

  const tickETAFormatted = nextTickETA ? formatTickETA(nextTickETA) : null

  return {
    currentTick,
    nextTickETA,
    tickETAFormatted,
    isTickProcessing,
  }
}

