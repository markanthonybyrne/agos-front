import { useState } from 'react'
import { FleetDetails } from '@/types/api.types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMoveFleetMutation } from '@/api/endpoints/fleetsApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useTick } from '@/hooks/useTick'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { formatTicksToTime } from '@/lib/formatters'
import { Rocket, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTravelTime } from '@/hooks/useTravelTime'

interface MoveFleetDialogProps {
  fleet: FleetDetails
  isOpen: boolean
  onClose: () => void
}

export function MoveFleetDialog({ fleet, isOpen, onClose }: MoveFleetDialogProps) {
  const [destinationCoord, setDestinationCoord] = useState({
    quadrant: fleet.destination_coordinate?.quadrant || 1,
    sector: fleet.destination_coordinate?.sector || 1,
    galaxy: fleet.destination_coordinate?.galaxy || 1,
    planet: fleet.destination_coordinate?.planet || 1,
  })
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'attack' | 'defend' | 'station' | 'return'>(fleet.order_type || 'station')
  const [travelTime, setTravelTime] = useState<any>(null)
  const [isCalculatingTravelTime, setIsCalculatingTravelTime] = useState(false)
  
  const [moveFleet, { isLoading: isMoving }] = useMoveFleetMutation()
  const { calculateTravelTime } = useTravelTime()
  const { data: planetsData, isLoading: isLoadingPlanets } = useGetPlanetsQuery()
  const { data: shipDefinitionsData } = useGetShipDefinitionsQuery()
  const { currentTick } = useTick()
  const ownedPlanets = planetsData?.planets || []
  const shipDefinitions = shipDefinitionsData?.ships || []

  const handlePlanetSelect = (value: string) => {
    if (value === 'manual') {
      setSelectedPlanetId(null)
      return
    }

    const planetId = parseInt(value)
    const planet = ownedPlanets.find(p => p.id === planetId)
    
    if (planet) {
      const coord = parseCoordinate(planet.coordinate)
      if (coord) {
        setDestinationCoord({
          quadrant: coord.quadrant,
          sector: coord.sector,
          galaxy: coord.galaxy,
          planet: coord.planet,
        })
        setSelectedPlanetId(planetId)
        setTravelTime(null) // Reset travel time when destination changes
      }
    }
  }

  const handleCalculateTravelTime = async () => {
    // Try to get origin coordinate from different possible locations
    // For stationed fleets, origin might be the current location
    let originCoord: { quadrant: number; sector: number; galaxy: number; planet: number } | null = null
    
    if (fleet.origin_coordinate) {
      originCoord = fleet.origin_coordinate
    } else if ((fleet as any).origin?.coordinate) {
      const parsed = parseCoordinate((fleet as any).origin.coordinate)
      if (parsed) {
        originCoord = parsed
      }
    }
    
    // If still no origin, try to construct from origin planet data
    if (!originCoord && (fleet as any).origin) {
      const origin = (fleet as any).origin
      if (origin.coordinate) {
        const parsed = parseCoordinate(origin.coordinate)
        if (parsed) {
          originCoord = parsed
        }
      } else if (origin.quadrant && origin.sector && origin.galaxy && origin.planet) {
        originCoord = {
          quadrant: origin.quadrant,
          sector: origin.sector,
          galaxy: origin.galaxy,
          planet: origin.planet
        }
      }
    }
    
    if (!originCoord) {
      toast.error('Unable to calculate travel time: missing origin coordinates')
      return
    }

    setIsCalculatingTravelTime(true)
    try {
      // Ensure ships are in the correct format: array of { definition_id, quantity }
      // Handle both array format and ensure proper types
      let shipsArray = fleet.ships
      if (!Array.isArray(shipsArray)) {
        // If ships is not an array, try to convert it
        if (typeof shipsArray === 'object' && shipsArray !== null) {
          shipsArray = Object.entries(shipsArray).map(([key, value]) => ({
            definition_id: parseInt(key) || 0,
            quantity: Number(value) || 0
          })).filter((s: { definition_id: number; quantity: number }) => s.definition_id > 0 && s.quantity > 0)
        } else {
          toast.error('Invalid ships format')
          setIsCalculatingTravelTime(false)
          return
        }
      }
      
      const formattedShips = shipsArray.map((ship: { definition_id?: number; quantity?: number; id?: number; count?: number } | number) => {
        if (typeof ship === 'number') {
          // If ship is just a number (definition_id), assume quantity of 1
          return { definition_id: ship, quantity: 1 }
        }
        if (ship.definition_id && ship.quantity) {
          return {
            definition_id: Number(ship.definition_id),
            quantity: Number(ship.quantity)
          }
        }
        // Fallback: try to extract from any structure
        return {
          definition_id: Number(ship.id || ship.definition_id || 0),
          quantity: Number(ship.quantity || ship.count || 1)
        }
      }).filter((ship: { definition_id: number; quantity: number }) => ship.definition_id && ship.quantity > 0)
      
      if (formattedShips.length === 0) {
        toast.error('No valid ships found in fleet')
        setIsCalculatingTravelTime(false)
        return
      }

      console.log('Formatted ships for travel time:', JSON.stringify(formattedShips, null, 2))
      console.log('Fleet ships (raw):', JSON.stringify(fleet.ships, null, 2))

      if (shipDefinitions.length === 0) {
        toast.error('Ship definitions not loaded. Please wait and try again.')
        setIsCalculatingTravelTime(false)
        return
      }

      const result = await calculateTravelTime(
        { coordinate: originCoord } as any,
        { coordinate: destinationCoord } as any,
        formattedShips,
        shipDefinitions
      )
      setTravelTime(result)
    } catch (error: unknown) {
      console.error('Travel time calculation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate travel time'
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError?.data?.message || errorMessage)
    } finally {
      setIsCalculatingTravelTime(false)
    }
  }

  const handleMove = async () => {
    try {
      await moveFleet({
        id: fleet.id,
        data: {
          destination_quadrant: destinationCoord.quadrant,
          destination_sector: destinationCoord.sector,
          destination_galaxy: destinationCoord.galaxy,
          destination_planet: destinationCoord.planet,
          order_type: orderType,
          auto_return_on_failure: (fleet as any).auto_return_on_failure || false,
        },
      }).unwrap()

      toast.success('Fleet order updated successfully!')
      onClose()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move fleet'
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError?.data?.message || errorMessage)
    }
  }

  // Determine origin coordinate - try multiple possible locations
  const getOriginCoord = () => {
    if (fleet.origin_coordinate) {
      return fleet.origin_coordinate
    }
    
    const origin = (fleet as any).origin
    if (origin?.coordinate) {
      const parsed = parseCoordinate(origin.coordinate)
      if (parsed) return parsed
    }
    
    if (origin?.quadrant && origin?.sector && origin?.galaxy && origin?.planet) {
      return {
        quadrant: origin.quadrant,
        sector: origin.sector,
        galaxy: origin.galaxy,
        planet: origin.planet
      }
    }
    
    return null
  }
  
  const originCoord = getOriginCoord()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-cyan-400" />
            Move Fleet: {fleet.name || `Fleet #${fleet.id}`}
          </DialogTitle>
          <DialogDescription>
            Update the destination and order type for this fleet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Location</Label>
            <div className="p-3 bg-muted/20 rounded-lg">
              {originCoord ? (
                <div className="font-mono text-sm">
                  {formatCoordinate(originCoord)}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Unknown</div>
              )}
            </div>
          </div>

          {/* Quick Select: My Planets */}
          <div className="space-y-2">
            <Label htmlFor="quick-select-planet">Quick Select: My Planets</Label>
            {isLoadingPlanets ? (
              <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                Loading planets...
              </div>
            ) : (
              <Select
                value={selectedPlanetId ? selectedPlanetId.toString() : 'manual'}
                onValueChange={handlePlanetSelect}
              >
                <SelectTrigger id="quick-select-planet" className="w-full">
                  <SelectValue placeholder="Select a planet or enter coordinates manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter coordinates manually</SelectItem>
                  {ownedPlanets.length > 0 ? (
                    ownedPlanets.map((planet) => {
                      const coord = parseCoordinate(planet.coordinate)
                      if (!coord) return null
                      return (
                        <SelectItem key={planet.id} value={planet.id.toString()}>
                          {planet.name || `Planet ${formatCoordinate(planet.coordinate)}`} ({formatCoordinate(planet.coordinate)})
                        </SelectItem>
                      )
                    }).filter(Boolean)
                  ) : (
                    <SelectItem value="manual" disabled>No planets owned</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Destination Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dest-quadrant">Quadrant</Label>
              <Select
                value={destinationCoord.quadrant.toString()}
                onValueChange={(value) => {
                  setDestinationCoord(prev => ({ ...prev, quadrant: parseInt(value) }))
                  setSelectedPlanetId(null) // Clear planet selection when manually editing
                  setTravelTime(null)
                }}
              >
                <SelectTrigger id="dest-quadrant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(q => (
                    <SelectItem key={q} value={q.toString()}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-sector">Sector</Label>
              <Select
                value={destinationCoord.sector.toString()}
                onValueChange={(value) => {
                  setDestinationCoord(prev => ({ ...prev, sector: parseInt(value) }))
                  setSelectedPlanetId(null) // Clear planet selection when manually editing
                  setTravelTime(null)
                }}
              >
                <SelectTrigger id="dest-sector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                    <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-galaxy">Galaxy</Label>
              <Select
                value={destinationCoord.galaxy.toString()}
                onValueChange={(value) => {
                  setDestinationCoord(prev => ({ ...prev, galaxy: parseInt(value) }))
                  setSelectedPlanetId(null) // Clear planet selection when manually editing
                  setTravelTime(null)
                }}
              >
                <SelectTrigger id="dest-galaxy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                    <SelectItem key={g} value={g.toString()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-planet">Planet</Label>
              <Select
                value={destinationCoord.planet.toString()}
                onValueChange={(value) => {
                  setDestinationCoord(prev => ({ ...prev, planet: parseInt(value) }))
                  setSelectedPlanetId(null) // Clear planet selection when manually editing
                  setTravelTime(null)
                }}
              >
                <SelectTrigger id="dest-planet">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Destination Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Destination</Label>
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="font-mono text-sm">
                {formatCoordinate(destinationCoord)}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label htmlFor="order-type">Order Type</Label>
            <Select value={orderType} onValueChange={(value) => setOrderType(value as any)}>
              <SelectTrigger id="order-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="station">Station</SelectItem>
                <SelectItem value="attack">Attack</SelectItem>
                <SelectItem value="defend">Defend</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Travel Time Calculator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Travel Time Estimate</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalculateTravelTime}
                disabled={isCalculatingTravelTime || !originCoord}
              >
                {isCalculatingTravelTime ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Calculate
                  </>
                )}
              </Button>
            </div>
            {travelTime && (
              <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Ticks:</span>
                    <span className="ml-2 font-mono font-semibold">{travelTime.travel_ticks}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <span className="ml-2 font-mono font-semibold">
                      {formatTicksToTime(travelTime.travel_ticks)}
                    </span>
                  </div>
                  {currentTick && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Arrival Tick:</span>
                      <span className="ml-2 font-mono font-semibold">{currentTick + travelTime.travel_ticks}</span>
                    </div>
                  )}
                  <div className="col-span-2 text-xs text-muted-foreground">
                    Slowest ship: <span className="font-semibold">{travelTime.slowest_ship}</span> ({travelTime.slowest_ship_travel_ticks} ticks base)
                    {travelTime.distance_multiplier !== 1 && (
                      <span className="ml-2">×{travelTime.distance_multiplier} distance multiplier</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground font-mono">
                    {travelTime.origin} → {travelTime.destination}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isMoving}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={isMoving}>
              {isMoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Move Fleet
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

