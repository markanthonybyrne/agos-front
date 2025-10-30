import { useGetTravelTimeMutation } from '@/api/endpoints/fleetsApi'
import { parseCoordinate, formatCoordinate } from '@/lib/coordinates'
import { TravelTimeRequest, Coordinate, Planet, ShipDefinition } from '@/types/api.types'

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

    // Convert ships from array format [{ definition_id, quantity }] to slug-based object { "fighter": 10, "cruiser": 5 }
    const shipsBySlug: Record<string, number> = {}
    
    ships.forEach(ship => {
      const definitionId = Number(ship.definition_id)
      const quantity = Number(ship.quantity)
      
      if (!definitionId || !quantity || isNaN(definitionId) || isNaN(quantity)) {
        throw new Error(`Invalid ship format: definition_id=${ship.definition_id}, quantity=${ship.quantity}`)
      }
      
      // Find ship definition by ID to get the slug
      const shipDef = shipDefinitions.find(def => def.id === definitionId)
      if (!shipDef || !shipDef.slug) {
        throw new Error(`Ship definition not found for definition_id=${definitionId}`)
      }
      
      // Aggregate quantities if same ship appears multiple times
      if (shipsBySlug[shipDef.slug]) {
        shipsBySlug[shipDef.slug] += quantity
      } else {
        shipsBySlug[shipDef.slug] = quantity
      }
    })

    if (Object.keys(shipsBySlug).length === 0) {
      throw new Error('No valid ships found')
    }

    const request: TravelTimeRequest = {
      ships: shipsBySlug,
      origin_quadrant: originCoord.quadrant,
      origin_sector: originCoord.sector,
      origin_galaxy: originCoord.galaxy,
      origin_planet: originCoord.planet,
      destination_quadrant: destCoord.quadrant,
      destination_sector: destCoord.sector,
      destination_galaxy: destCoord.galaxy,
      destination_planet: destCoord.planet,
    }

    console.log('Travel time request:', JSON.stringify(request, null, 2))
    console.log('Ships object:', JSON.stringify(request.ships, null, 2))

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

