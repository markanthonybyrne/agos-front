import { useMemo } from 'react'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { parseCoordinate, formatCoordinate } from '@/lib/coordinates'

export interface MapPoint {
  id: number | string
  x: number
  y: number
  name?: string
  ownerEmpireId?: number
}

export interface MapFleet {
  id: number
  x: number
  y: number
  originX: number
  originY: number
  destX: number
  destY: number
  status?: string
  ownerEmpireId?: number
}

function projectCoordinateToXY(coordString: string | undefined): { x: number; y: number } | null {
  if (!coordString) return null
  const c = parseCoordinate(coordString)
  if (!c) return null
  // Deterministic 2D placement based on hierarchical indices
  // Spread quadrants far apart, sectors medium, galaxies closer, planets tight
  const x = c.quadrant * 5000 + c.sector * 800 + c.galaxy * 120 + (c.planet % 10) * 20
  const y = c.quadrant * 500 + c.sector * 600 + (c.galaxy % 5) * 140 + (c.planet % 13) * 18
  return { x, y }
}

export function useUniverseMapData() {
  const { data: planetsData, isLoading: isLoadingPlanets } = useGetPlanetsQuery()
  const { data: fleetsData, isLoading: isLoadingFleets } = useGetFleetsQuery()

  const planets: MapPoint[] = useMemo(() => {
    const planets = planetsData?.planets || []
    return planets
      .map((p) => {
        const pos = projectCoordinateToXY(typeof p.coordinate === 'string' ? p.coordinate : formatCoordinate(p.coordinate as any))
        if (!pos) return null
        return {
          id: p.id ?? p.coordinate,
          x: pos.x,
          y: pos.y,
          name: p.name,
          ownerEmpireId: p.owner_empire_id,
        } as MapPoint
      })
      .filter(Boolean) as MapPoint[]
  }, [planetsData])

  const fleets: MapFleet[] = useMemo(() => {
    const fleets = fleetsData?.fleets || []
    return fleets
      .map((f) => {
        const origin = (f as any).origin_coordinate
        const destination = (f as any).destination_coordinate
        const originCoord = typeof origin === 'string' ? origin : `${origin?.quadrant}:${origin?.sector}:${origin?.galaxy}:${origin?.planet}`
        const destCoord = typeof destination === 'string' ? destination : `${destination?.quadrant}:${destination?.sector}:${destination?.galaxy}:${destination?.planet}`
        const originPos = projectCoordinateToXY(originCoord || '')
        const destPos = projectCoordinateToXY(destCoord || '')
        if (!originPos || !destPos) return null
        return {
          id: (f as any).id,
          x: originPos.x,
          y: originPos.y,
          originX: originPos.x,
          originY: originPos.y,
          destX: destPos.x,
          destY: destPos.y,
          status: (f as any).status,
          ownerEmpireId: (f as any).owner?.id,
        } as MapFleet
      })
      .filter(Boolean) as MapFleet[]
  }, [fleetsData])

  return {
    isLoading: isLoadingPlanets || isLoadingFleets,
    planets,
    fleets,
  }
}


