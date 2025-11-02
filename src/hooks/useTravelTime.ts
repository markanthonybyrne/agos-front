import { useGetTravelTimeMutation } from '@/api/endpoints/fleetsApi'
import { parseCoordinate, formatCoordinate } from '@/lib/coordinates'
import { TravelTimeRequest, Planet, ShipDefinition } from '@/types/api.types'
import { Coordinate } from '@/types/game.types'

export function useTravelTime() {
  const [getTravelTime, { isLoading }] = useGetTravelTimeMutation()

  const calculateTravelTime = async (
    originPlanet: Planet,
    destinationPlanet: Planet,
    ships: Array<{ definition_id: number; quantity: number }>,
    shipDefinitions?: ShipDefinition[]
  ) => {
    const originCoord = parseCoordinate(originPlanet.coordinate)
    const destCoord = parseCoordinate(destinationPlanet.coordinate)

    if (!originCoord || !destCoord) {
      throw new Error('Invalid coordinates')
    }

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

    // Validate planet numbers (API expects 1-10)
    if (originCoord.planet < 1 || originCoord.planet > 10) {
      throw new Error(`Invalid origin planet number: ${originCoord.planet}. Must be between 1-10.`)
    }
    if (destCoord.planet < 1 || destCoord.planet > 10) {
      throw new Error(`Invalid destination planet number: ${destCoord.planet}. Must be between 1-10.`)
    }

    const request: TravelTimeRequest = {
      ships: shipsArray,
      origin_quadrant: Number(originCoord.quadrant),
      origin_sector: Number(originCoord.sector),
      origin_galaxy: Number(originCoord.galaxy),
      origin_planet: Number(originCoord.planet),
      destination_quadrant: Number(destCoord.quadrant),
      destination_sector: Number(destCoord.sector),
      destination_galaxy: Number(destCoord.galaxy),
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

