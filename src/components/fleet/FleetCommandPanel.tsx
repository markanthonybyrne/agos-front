import { useState, useEffect } from 'react'
import { useGetPlanetsQuery, useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useCreateFleetMutation } from '@/api/endpoints/fleetsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ship, MapPin, Clock, Shield, Target, ArrowLeftRight, Zap, Send, CheckCircle } from 'lucide-react'
import { formatCoordinate, calculateDistance, parseCoordinate } from '@/lib/coordinates'
import { convertToLegacyCoordinate } from '@/lib/coordinateConversion'
import { hierarchicalToXy } from '@/lib/coordinateUtils'
import { Coordinate } from '@/types/game.types'
import { toast } from 'sonner'
import { VisualCoordinateSelector } from './VisualCoordinateSelector'
import { VisualShipSelector } from './VisualShipSelector'

interface FleetCommandPanelProps {
  planetId?: number
  destinationPlanet?: any // Planet object from API
  orderType?: 'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport' // Pre-selected order type
  resources?: { tellerium?: number; krypton?: number } // For transport orders
}

export function FleetCommandPanel({ planetId, destinationPlanet, orderType: initialOrderType, resources: initialResources }: FleetCommandPanelProps) {
  const [step, setStep] = useState<'origin' | 'ships' | 'destination' | 'confirm'>('origin')
  const [selectedOriginPlanet, setSelectedOriginPlanet] = useState<number>(planetId || 0)
  const [selectedShips, setSelectedShips] = useState<Record<string, number>>({})
  const [selectedDestination, setSelectedDestination] = useState<Coordinate | null>(() => {
    // Pre-fill destination if provided
    if (destinationPlanet?.coordinate) {
      const coord = typeof destinationPlanet.coordinate === 'string' 
        ? parseCoordinate(destinationPlanet.coordinate)
        : destinationPlanet.coordinate
      return coord || null
    }
    return null
  })
  const [orderType, setOrderType] = useState<'attack' | 'defend' | 'station' | 'return' | 'colonize' | 'transport'>(initialOrderType || 'attack')
  const [resources, setResources] = useState<{ tellerium?: number; krypton?: number }>(initialResources || {})
  const [autoReturn, setAutoReturn] = useState(false)
  
  // Auto-advance to ships step if origin is pre-filled
  useEffect(() => {
    if (planetId && step === 'origin') {
      setStep('ships')
    }
  }, [planetId, step])
  
  // Auto-advance to confirm if destination and order type are pre-filled
  useEffect(() => {
    if (selectedDestination && initialOrderType && step === 'destination') {
      setStep('confirm')
    }
  }, [selectedDestination, initialOrderType, step])

  const [createFleet, { isLoading }] = useCreateFleetMutation()
  const { data: planetsData } = useGetPlanetsQuery()
  const { data: originPlanetData } = useGetPlanetQuery(selectedOriginPlanet, {
    skip: selectedOriginPlanet === 0,
  })

  const originPlanet = originPlanetData?.planet
  const planets: any[] = Array.isArray(planetsData) ? planetsData : (planetsData as any)?.planets || []

  const totalShips = Object.values(selectedShips).reduce((sum, qty) => sum + qty, 0)
  const travelTime =
    originPlanet && selectedDestination
      ? calculateDistance(originPlanet.coordinate, selectedDestination)
      : 0

  const handleOriginSelect = (planetId: number) => {
    setSelectedOriginPlanet(planetId)
    setStep('ships')
  }

  const handleShipsComplete = () => {
    if (totalShips === 0) {
      toast.error('Select at least one ship')
      return
    }
    setStep('destination')
  }

  const handleDestinationComplete = () => {
    if (!selectedDestination) {
      toast.error('Select a destination')
      return
    }
    setStep('confirm')
  }

  const handleLaunch = async () => {
    if (!originPlanet || !selectedDestination || totalShips === 0) {
      toast.error('Complete all steps')
      return
    }

    // Convert coordinate to legacy format for API compatibility
    const legacyCoord = convertToLegacyCoordinate(selectedDestination)
    if (!legacyCoord) {
      toast.error('Invalid destination coordinate format')
      return
    }

    // Convert hierarchical coordinates to X/Y coordinates
    const destinationXY = hierarchicalToXy(
      legacyCoord.quadrant,
      legacyCoord.sector,
      legacyCoord.galaxy,
      legacyCoord.planet
    )

    try {
      await createFleet({
        ships: selectedShips,
        origin_planet_id: selectedOriginPlanet,
        destination_quadrant: legacyCoord.quadrant,
        destination_sector: legacyCoord.sector,
        destination_galaxy: legacyCoord.galaxy,
        destination_planet: legacyCoord.planet,
        destination_x: destinationXY.x,
        destination_y: destinationXY.y,
        order_type: orderType,
        auto_return_on_failure: autoReturn,
        resources: orderType === 'transport' ? resources : undefined,
      }).unwrap()

      toast.success('Fleet launched successfully!')
      
      // Reset
      setStep('origin')
      setSelectedShips({})
      setSelectedDestination(null)
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to launch fleet'
      const errorDetails = error?.data?.details
      
      // If there are details (array of validation errors), format them nicely
      if (Array.isArray(errorDetails) && errorDetails.length > 0) {
        const detailsText = errorDetails.join('\n• ')
        toast.error(`${errorMessage}\n\n• ${detailsText}`, {
          duration: 8000, // Show longer for validation errors
        })
      } else {
        toast.error(errorMessage)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'origin' || step === 'ships' || step === 'destination' || step === 'confirm'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'ships' || step === 'destination' || step === 'confirm'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'destination' || step === 'confirm'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'confirm'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            4
          </div>
        </div>
      </div>

      {/* Step 1: Origin */}
      {step === 'origin' && (
        <Card className="panel-glass border-cyan/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Select Origin Planet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planets.map((planet: any) => (
                <Button
                  key={planet.id}
                  variant="outline"
                  className="h-auto p-4 justify-start hover:border-primary/50 transition-all"
                  onClick={() => handleOriginSelect(planet.id)}
                >
                  <div className="flex-1 text-left">
                    <div className="font-semibold mb-1">{planet.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatCoordinate(planet.coordinate)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Ships */}
      {step === 'ships' && (
        <div className="space-y-4">
          <VisualShipSelector
            planetId={selectedOriginPlanet}
            selectedShips={selectedShips}
            onChange={setSelectedShips}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('origin')}
            >
              Back
            </Button>
            <Button
              onClick={handleShipsComplete}
              disabled={totalShips === 0}
              className="flex-1"
            >
              Next: Set Destination
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Destination */}
      {step === 'destination' && (
        <div className="space-y-4">
          <VisualCoordinateSelector
            onSelect={setSelectedDestination}
            currentCoordinate={selectedDestination || undefined}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('ships')}
            >
              Back
            </Button>
            <Button
              onClick={handleDestinationComplete}
              disabled={!selectedDestination}
              className="flex-1"
            >
              Next: Confirm
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="panel-glass border-green/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Fleet Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Origin */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold">Origin</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{originPlanet?.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {originPlanet && formatCoordinate(originPlanet.coordinate)}
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-red-400" />
                  <span className="font-semibold">Destination</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg">
                    {selectedDestination &&
                      formatCoordinate(selectedDestination)}
                  </div>
                </div>
              </div>

              {/* Ships */}
              <div className="p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Ship className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">Fleet Composition</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedShips).map(([slug, qty]) => (
                    <div
                      key={slug}
                      className="flex justify-between text-sm"
                    >
                      <span className="capitalize">{slug.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{qty}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border font-semibold text-lg">
                  Total: <span className="font-mono">{totalShips}</span> ships
                </div>
              </div>

              {/* Travel time */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">Travel Time</span>
                </div>
                <span className="font-mono">{travelTime} ticks</span>
              </div>
            </CardContent>
          </Card>

          {/* Order type selection */}
          <Card className="panel-glass border-purple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Fleet Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={orderType === 'attack' ? 'default' : 'outline'}
                  onClick={() => setOrderType('attack')}
                  className="h-16 flex-col gap-2"
                >
                  <Target className="w-6 h-6" />
                  <span>Attack</span>
                </Button>
                <Button
                  variant={orderType === 'defend' ? 'default' : 'outline'}
                  onClick={() => setOrderType('defend')}
                  className="h-16 flex-col gap-2"
                >
                  <Shield className="w-6 h-6" />
                  <span>Defend</span>
                </Button>
                <Button
                  variant={orderType === 'station' ? 'default' : 'outline'}
                  onClick={() => setOrderType('station')}
                  className="h-16 flex-col gap-2"
                >
                  <MapPin className="w-6 h-6" />
                  <span>Station</span>
                </Button>
                <Button
                  variant={orderType === 'colonize' ? 'default' : 'outline'}
                  onClick={() => setOrderType('colonize')}
                  className="h-16 flex-col gap-2"
                >
                  <Zap className="w-6 h-6" />
                  <span>Colonize</span>
                </Button>
                <Button
                  variant={orderType === 'transport' ? 'default' : 'outline'}
                  onClick={() => setOrderType('transport')}
                  className="h-16 flex-col gap-2"
                >
                  <ArrowLeftRight className="w-6 h-6" />
                  <span>Transport</span>
                </Button>
                <Button
                  variant={orderType === 'return' ? 'default' : 'outline'}
                  onClick={() => setOrderType('return')}
                  className="h-16 flex-col gap-2"
                >
                  <ArrowLeftRight className="w-6 h-6" />
                  <span>Return</span>
                </Button>
              </div>
              
              {/* Colonization info */}
              {orderType === 'colonize' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                  <strong>Colonization Requirements:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Target planet must be unsettled</li>
                    <li>Target planet must be habitable</li>
                    <li>Fleet must contain colonizer ships</li>
                  </ul>
                </div>
              )}
              
              {/* Resource transport fields */}
              {orderType === 'transport' && originPlanet && (
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold">Resource Transport</h4>
                  <div className="space-y-2">
                    <label className="text-sm">Tellerium</label>
                    <input
                      type="number"
                      min={0}
                      max={originPlanet.tellerium_balance || 0}
                      value={resources.tellerium || ''}
                      onChange={(e) => setResources(prev => ({ ...prev, tellerium: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 bg-background border border-input rounded-md"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">
                      Available: {originPlanet.tellerium_balance || 0}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Krypton</label>
                    <input
                      type="number"
                      min={0}
                      max={originPlanet.krypton_balance || 0}
                      value={resources.krypton || ''}
                      onChange={(e) => setResources(prev => ({ ...prev, krypton: parseInt(e.target.value) || 0 }))}
                      className="w-full p-2 bg-background border border-input rounded-md"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">
                      Available: {originPlanet.krypton_balance || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Launch button */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('destination')}
            >
              Back
            </Button>
            <Button
              onClick={handleLaunch}
              disabled={isLoading}
              className="flex-1 text-lg py-6"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Launch Fleet
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

