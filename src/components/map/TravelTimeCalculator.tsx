import { useState } from 'react'
import { Planet } from '@/types/api.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTravelTime } from '@/hooks/useTravelTime'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetShipDefinitionsQuery } from '@/api/endpoints/shipsApi'
import { useTick } from '@/hooks/useTick'
import { formatCoordinate } from '@/lib/coordinates'
import { formatTicksToTime } from '@/lib/formatters'
import { Clock, Rocket } from 'lucide-react'
import { toast } from 'sonner'

interface TravelTimeCalculatorProps {
  destinationPlanet: Planet | null | undefined
  onNavigateToFleet?: (destination: Planet) => void
}

export function TravelTimeCalculator({ destinationPlanet, onNavigateToFleet }: TravelTimeCalculatorProps) {
  const [originPlanetId, setOriginPlanetId] = useState<number | null>(null)
  const [travelTime, setTravelTime] = useState<any>(null)
  const { data: planetsData, isLoading: isLoadingPlanets, error: planetsError } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: shipDefinitionsData } = useGetShipDefinitionsQuery()
  const { calculateTravelTime, isLoading } = useTravelTime()
  const { currentTick } = useTick()
  
  // Validate destinationPlanet
  if (!destinationPlanet || !destinationPlanet.coordinate) {
    return (
      <Card className="panel-glass border-red/20">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            Invalid destination planet. Please select a valid planet.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get all planets from the API response
  // The API returns { planets: Planet[] }
  const allPlanets = planetsData?.planets || []
  
  // Filter to only include valid owned planets
  // Coordinate can be an object { quadrant, sector, galaxy, planet } or a string
  const ownedPlanets = allPlanets.filter((planet) => {
    if (!planet || !planet.id || !planet.coordinate) return false
    // If coordinate is an object, verify it has required fields
    if (typeof planet.coordinate === 'object' && planet.coordinate !== null) {
      const coord = planet.coordinate as any
      if (coord.quadrant === undefined || coord.quadrant === null) return false
    }
    return true
  }).filter(planet => {
    // Exclude destination planet from origin list if it's owned
    if (!destinationPlanet?.id) return true
    return Number(planet.id) !== Number(destinationPlanet.id)
  })
  
  const shipDefinitions = shipDefinitionsData?.ships || []

  const handleCalculate = async () => {
    if (!originPlanetId) {
      toast.error('Please select an origin planet')
      return
    }

    const originPlanet = ownedPlanets.find(p => p.id === originPlanetId)
    if (!originPlanet) {
      toast.error('Origin planet not found')
      return
    }

    if (shipDefinitions.length === 0) {
      toast.error('Ship definitions not loaded. Please wait and try again.')
      return
    }

    try {
      // Default ship for travel time calculation (1 fighter)
      // Find fighter ship definition (typically id=1 or slug='fighter')
      const fighterDef = shipDefinitions.find(def => def.slug === 'fighter' || def.id === 1)
      if (!fighterDef) {
        toast.error('Fighter ship definition not found')
        return
      }
      
      if (!destinationPlanet || !destinationPlanet.coordinate) {
        toast.error('Invalid destination planet')
        return
      }
      
      const ships = [{ definition_id: fighterDef.id, quantity: 1 }]
      const result = await calculateTravelTime(originPlanet, destinationPlanet, ships, shipDefinitions)
      setTravelTime(result)
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate travel time')
    }
  }

  const arrivalTick = currentTick && travelTime ? currentTick + travelTime.travel_ticks : null

  return (
    <Card className="panel-glass border-cyan/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-cyan-400" />
          Travel Time Calculator
        </CardTitle>
        <CardDescription>
          Calculate travel time from one of your planets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Origin Planet</label>
          {isLoadingPlanets ? (
            <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
              Loading planets...
            </div>
          ) : planetsError ? (
            <div className="p-3 bg-red-500/10 rounded-lg text-sm text-red-400">
              Failed to load planets
            </div>
          ) : (
            <>
              {ownedPlanets.length === 0 ? (
                <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                  No planets owned (Filtered: {allPlanets.length} total)
                </div>
              ) : (
                <Select 
                  value={originPlanetId ? originPlanetId.toString() : undefined} 
                  onValueChange={(value) => {
                    if (value) {
                      const numValue = Number(value)
                      if (!isNaN(numValue) && numValue > 0) {
                        setOriginPlanetId(numValue)
                        setTravelTime(null)
                      }
                    } else {
                      setOriginPlanetId(null)
                      setTravelTime(null)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select origin planet" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[10000]">
                    {ownedPlanets.map((planet) => {
                      if (!planet || !planet.id || !planet.coordinate) return null
                      const coordinateStr = formatCoordinate(planet.coordinate)
                      const displayName = planet.name || `Planet ${coordinateStr}`
                      return (
                        <SelectItem key={planet.id} value={String(planet.id)}>
                          {displayName} ({coordinateStr})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>

        {destinationPlanet && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination</label>
            <div className="p-3 bg-muted/20 rounded-lg">
              <div className="font-semibold">{destinationPlanet.name || 'Unknown Planet'}</div>
              <div className="text-sm text-muted-foreground font-mono">
                {destinationPlanet.coordinate ? formatCoordinate(destinationPlanet.coordinate) : 'N/A'}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleCalculate}
          disabled={!originPlanetId || !destinationPlanet || isLoading}
          className="w-full"
        >
          {isLoading ? 'Calculating...' : 'Calculate Travel Time'}
        </Button>

        {travelTime && (
          <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">Travel Time</span>
            </div>
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
              {arrivalTick && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Arrival Tick:</span>
                  <span className="ml-2 font-mono font-semibold">{arrivalTick}</span>
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
            {onNavigateToFleet && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => onNavigateToFleet(destinationPlanet)}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Fleet Order
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
