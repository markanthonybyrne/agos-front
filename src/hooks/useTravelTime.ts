import { useGetTravelTimeMutation } from '@/api/endpoints/fleetsApi'
import { normalizeCoordinate } from '@/lib/coordinates'
import { TravelTimeRequest, Planet, ShipDefinition } from '@/types/api.types'
import { Coordinate } from '@/types/game.types'

type CoordinateInput = Planet | { coordinate: Coordinate | string } | Coordinate | string

interface NormalizedCoordinate {
  region: number
  system: number
  planet: number
}

export function useTravelTime() {
  const [getTravelTime, { isLoading }] = useGetTravelTimeMutation()

  const extractCoordinate = (input: CoordinateInput): NormalizedCoordinate => {
    if (!input) {
      throw new Error('Coordinate is required')
    }

    if (typeof input === 'object' && input !== null && 'coordinate' in (input as Record<string, unknown>)) {
      const normalized = normalizeCoordinate((input as Record<string, unknown>).coordinate as any)
      if (normalized) {
        return normalized
      }
    }

    const normalized = normalizeCoordinate(input as any)
    if (!normalized) {
      throw new Error('Invalid coordinate')
    }

    return normalized
  }

  const calculateTravelTime = async (
    originPlanet: CoordinateInput,
    destinationPlanet: CoordinateInput,
    ships: Array<{ definition_id: number; quantity: number }>,
    shipDefinitions?: ShipDefinition[]
  ) => {
    const originCoord = extractCoordinate(originPlanet)
    const destCoord = extractCoordinate(destinationPlanet)

    if (!shipDefinitions || shipDefinitions.length === 0) {
      throw new Error('Ship definitions are required to calculate travel time')
    }

    // API expects ships as array of { definition_id, quantity }
    const shipsArray = ships.map(ship => {
      const definitionId = Number(ship.definition_id)
      const quantity = Number(ship.quantity)
      
      if (!definitionId || !quantity || isNaN(definitionId) || isNaN(quantity) || quantity < 1) {
        throw new Error(`Invalid ship format: definition_id=${ship.definition_id}, quantity=${ship.quantity}`)
      }
      
      return {
        definition_id: definitionId,
        quantity: quantity
      }
    })

    if (shipsArray.length === 0) {
      throw new Error('No valid ships found')
    }

    // Validate planet numbers (API expects 1-17)
    if (originCoord.planet === undefined || originCoord.planet < 1 || originCoord.planet > 17) {
      throw new Error(`Invalid origin planet number: ${originCoord.planet}. Must be between 1-17.`)
    }
    if (destCoord.planet === undefined || destCoord.planet < 1 || destCoord.planet > 17) {
      throw new Error(`Invalid destination planet number: ${destCoord.planet}. Must be between 1-17.`)
    }

    const request: TravelTimeRequest = {
      ships: shipsArray,
      origin_region: Number(originCoord.region),
      origin_system: Number(originCoord.system),
      origin_planet: Number(originCoord.planet),
      destination_region: Number(destCoord.region),
      destination_system: Number(destCoord.system),
      destination_planet: Number(destCoord.planet),
    }

    try {
      const result = await getTravelTime(request).unwrap()
      return result
    } catch (error: any) {
      console.error('Travel time API error:', error)
      console.error('Error data:', error?.data)
      console.error('Error details:', error?.data?.details)
      throw new Error(error?.data?.message || 'Failed to calculate travel time')
    }
  }

  return {
    calculateTravelTime,
    isLoading,
  }
}

