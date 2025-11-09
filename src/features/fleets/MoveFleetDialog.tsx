import { useState, useEffect } from 'react'
import { FleetDetails } from '@/types/api.types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useMoveFleetMutation } from '@/api/endpoints/fleetsApi'
import { useValidateFleetRangeMutation } from '@/api/endpoints/universeApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useTick } from '@/hooks/useTick'
import { formatCoordinate, normalizeCoordinate } from '@/lib/coordinates'
import { formatTicksToTime } from '@/lib/formatters'
import { Rocket, Clock, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTravelTime } from '@/hooks/useTravelTime'

interface MoveFleetDialogProps {
  fleet: FleetDetails
  isOpen: boolean
  onClose: () => void
}

type NormalizedCoordinate = {
  region: number
  system: number
  planet: number
}

export function MoveFleetDialog({ fleet, isOpen, onClose }: MoveFleetDialogProps) {
  const normalizeCandidate = (value: unknown): NormalizedCoordinate | null => {
    if (!value) {
      return null
    }

    if (typeof value === 'object' && value !== null && 'coordinate' in (value as Record<string, unknown>)) {
      const nested = normalizeCoordinate((value as Record<string, unknown>).coordinate as any)
      if (nested) {
        return nested
      }
    }

    const normalized = normalizeCoordinate(value as any)
    return normalized
  }

  const [destinationCoord, setDestinationCoord] = useState<NormalizedCoordinate>(() => {
    const fromRegion =
      normalizeCandidate(
        fleet.destination_region !== undefined && fleet.destination_system !== undefined
          ? {
              region: fleet.destination_region,
              system: fleet.destination_system,
              planet:
                (fleet as any).destination_planet ??
                fleet.destination_coordinate?.planet ??
                1,
            }
          : null,
      ) ??
      normalizeCandidate(fleet.destination_coordinate) ??
      normalizeCandidate((fleet as any).destination?.coordinate) ??
      normalizeCandidate((fleet as any).destination)

    return fromRegion ?? { region: 1, system: 1, planet: 1 }
  })
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'>(
    (fleet.order_type === 'colonize' || fleet.order_type === 'transport' ? 'station' : fleet.order_type) || 'station'
  )
  const [travelTime, setTravelTime] = useState<any>(null)
  const [isCalculatingTravelTime, setIsCalculatingTravelTime] = useState(false)
  
  const [moveFleet, { isLoading: isMoving }] = useMoveFleetMutation()
  const [validateRange, { data: rangeValidation, isLoading: isValidating }] = useValidateFleetRangeMutation()
  const { calculateTravelTime } = useTravelTime()
  const { data: planetsData, isLoading: isLoadingPlanets } = useGetPlanetsQuery()
  const { data: shipDefinitionsData } = useGetShipDefinitionsQuery()
  const { currentTick } = useTick()
  const ownedPlanets = (planetsData?.planets || []).filter((planet) => {
    if (!planet || !planet.id || !planet.coordinate) {
      return false
    }
    return normalizeCandidate(planet.coordinate) !== null
  })
  const shipDefinitions = shipDefinitionsData?.ships || []

  const originCoordinate =
    normalizeCandidate(
      (fleet as any).origin_region !== undefined && (fleet as any).origin_system !== undefined
        ? {
            region: (fleet as any).origin_region,
            system: (fleet as any).origin_system,
            planet:
              (fleet as any).origin_planet ??
              fleet.origin_coordinate?.planet ??
              1,
          }
        : null,
    ) ??
    normalizeCandidate(fleet.origin_coordinate) ??
    normalizeCandidate((fleet as any).origin?.coordinate) ??
    normalizeCandidate((fleet as any).origin)

  // Validate fleet range when destination changes
  useEffect(() => {
    if (!originCoordinate) {
      return
    }

    if (!destinationCoord) {
      return
    }

    validateRange({
      origin_region: originCoordinate.region,
      origin_system: originCoordinate.system,
      destination_region: destinationCoord.region,
      destination_system: destinationCoord.system,
    })
  }, [
    destinationCoord.region,
    destinationCoord.system,
    originCoordinate?.region,
    originCoordinate?.system,
    validateRange,
  ])

  const handlePlanetSelect = (value: string) => {
    if (value === 'manual') {
      setSelectedPlanetId(null)
      return
    }

    const planetId = parseInt(value)
    const planet = ownedPlanets.find((p) => p.id === planetId)

    if (planet) {
      const coord = normalizeCandidate(planet.coordinate)
      if (coord) {
        setDestinationCoord(coord)
        setSelectedPlanetId(planetId)
        setTravelTime(null) // Reset travel time when destination changes
      }
    }
  }

  const handleCalculateTravelTime = async () => {
    if (!originCoordinate) {
      toast.error('Unable to calculate travel time: missing origin coordinates')
      return
    }
    if (!destinationCoord) {
      toast.error('Select a destination coordinate first')
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
      
      const formattedShips = shipsArray
        .map((ship: { definition_id?: number; quantity?: number; id?: number; count?: number } | number) => {
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
        })
        .filter((ship: { definition_id: number; quantity: number }) => ship.definition_id && ship.quantity > 0)
      
      if (formattedShips.length === 0) {
        toast.error('No valid ships found in fleet')
        setIsCalculatingTravelTime(false)
        return
      }

      if (shipDefinitions.length === 0) {
        toast.error('Ship definitions not loaded. Please wait and try again.')
        setIsCalculatingTravelTime(false)
        return
      }

      const result = await calculateTravelTime(originCoordinate, destinationCoord, formattedShips, shipDefinitions)
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
          destination_region: destinationCoord.region,
          destination_system: destinationCoord.system,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto panel-glass surface-gradient card-glow border-cyan/30">
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
              {originCoordinate ? (
                <div className="font-mono text-sm">
                  {formatCoordinate(originCoordinate)}
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
                      const coord = normalizeCandidate(planet.coordinate)
                      if (!coord) return null
                      return (
                        <SelectItem key={planet.id} value={planet.id.toString()}>
                          {planet.name || `Planet ${formatCoordinate(coord)}`} ({formatCoordinate(coord)})
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dest-region">Region</Label>
              <Input
                id="dest-region"
                type="number"
                min={1}
                max={20}
                value={destinationCoord.region}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  const clamped = Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 20) : 1
                  setDestinationCoord((prev) => ({ ...prev, region: clamped }))
                  setSelectedPlanetId(null)
                  setTravelTime(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-system">System</Label>
              <Input
                id="dest-system"
                type="number"
                min={1}
                max={125}
                value={destinationCoord.system}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  const clamped = Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 125) : 1
                  setDestinationCoord((prev) => ({ ...prev, system: clamped }))
                  setSelectedPlanetId(null)
                  setTravelTime(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dest-planet">Planet</Label>
              <Input
                id="dest-planet"
                type="number"
                min={1}
                max={17}
                value={destinationCoord.planet}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  const clamped = Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 17) : 1
                  setDestinationCoord((prev) => ({ ...prev, planet: clamped }))
                  setSelectedPlanetId(null)
                  setTravelTime(null)
                }}
              />
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

          {/* Range Validation Alert */}
          {rangeValidation && !rangeValidation.can_reach && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-950/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Destination Out of Range</AlertTitle>
              <AlertDescription>
                {rangeValidation.reason}
                {rangeValidation.required_research && rangeValidation.required_research.length > 0 && (
                  <div className="mt-2 text-sm">
                    <strong>Required Research:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {rangeValidation.required_research.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

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
                disabled={isCalculatingTravelTime || !originCoordinate}
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
            <Button onClick={handleMove} disabled={isMoving || (rangeValidation && !rangeValidation.can_reach)}>
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

