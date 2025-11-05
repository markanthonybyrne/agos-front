import { useState } from 'react'
import { Planet } from '@/types/api.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useColonizePlanetMutation } from '@/api/endpoints/planetsApi'
import { formatCoordinate, parseCoordinate, getPlanetXY } from '@/lib/coordinates'
import { hierarchicalToXy } from '@/lib/coordinateUtils'
import { 
  Rocket, 
  Ship,
  Shield,
  Sword
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getPlanetImage } from '@/lib/planetImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

interface PlanetInteractionPanelProps {
  planet: Planet
  onClose?: () => void
}

export function PlanetInteractionPanel({ planet, onClose }: PlanetInteractionPanelProps) {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [colonizePlanet, { isLoading: isColonizing }] = useColonizePlanetMutation()
  const [planetName, setPlanetName] = useState('')
  
  if (!planet) {
    return (
      <div className="text-center py-12 p-6">
        <p className="text-muted-foreground">No planet data available</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </div>
    )
  }

  const coord = parseCoordinate(planet.coordinate)
  const isOwned = planet.owner_empire_id === empire?.id
  const isUnsettled = planet.state === 'unsettled'
  const isOccupied = planet.owner_empire_id && !isOwned
  const planetImage = planet.type?.slug ? getPlanetImage(planet.type.slug) : getPlanetImage('arid')

  const handleColonize = async () => {
    if (!coord) {
      toast.error('Invalid planet coordinates')
      return
    }

    const trimmedName = planetName.trim()
    if (!trimmedName) {
      toast.error('Please enter a name for the planet')
      return
    }

    // Get X/Y coordinates - try to get from planet first, otherwise convert from hierarchical
    let planetXY = getPlanetXY(planet)
    if (!planetXY) {
      planetXY = hierarchicalToXy(coord.quadrant, coord.sector, coord.galaxy, coord.planet)
    }

    try {
      await colonizePlanet({
        quadrant: coord.quadrant,
        sector: coord.sector,
        galaxy: coord.galaxy,
        planet: coord.planet,
        x: planetXY.x,
        y: planetXY.y,
        name: trimmedName,
      }).unwrap()

      toast.success(`Planet ${trimmedName} colonized successfully!`)
      setPlanetName('')
      onClose?.()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to colonize planet'
      const errorDetails = error?.data?.details
      
      // If there are details (validation errors), format them nicely
      if (errorDetails && typeof errorDetails === 'object') {
        // Handle details as an object with field names as keys
        const detailMessages: string[] = []
        Object.entries(errorDetails).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg: string) => {
              detailMessages.push(`${field}: ${msg}`)
            })
          }
        })
        
        if (detailMessages.length > 0) {
          const detailsText = detailMessages.join('\n• ')
          toast.error(`${errorMessage}\n\n• ${detailsText}`, {
            duration: 8000,
          })
        } else {
          toast.error(errorMessage)
        }
      } else if (Array.isArray(errorDetails) && errorDetails.length > 0) {
        // Handle details as an array
        const detailsText = errorDetails.join('\n• ')
        toast.error(`${errorMessage}\n\n• ${detailsText}`, {
          duration: 8000,
        })
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleSendFleet = () => {
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, { 
      destinationPlanet: planet 
    })
  }

  return (
    <div className="space-y-4 p-6">
      {/* Large Planet Image */}
      <div className="flex justify-center">
        <div className="relative w-64 h-64">
          <img
            src={planetImage}
            alt={planet.type?.name || 'Planet'}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Vital Stats */}
      <Card className="panel-glass border-cyan/20">
        <CardContent className="pt-4 space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Coordinates</div>
            <div className="font-mono font-semibold text-cyan-400">
              {formatCoordinate(planet.coordinate)}
            </div>
          </div>
          {planet.type && (
            <div>
              <div className="text-sm text-muted-foreground">Planet Type</div>
              <div className="font-semibold capitalize">{planet?.type?.name || 'Unknown'}</div>
              {planet?.type?.description && (
                <p className="mt-1 text-xs text-muted-foreground">{planet?.type?.description}</p>
              )}
            </div>
          )}
          <div>
            <div className="text-sm text-muted-foreground">State</div>
            <Badge variant={isUnsettled ? 'outline' : 'default'}>
              {planet.state || 'Unknown'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="panel-glass border-cyan/20">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {isUnsettled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planet-name">Planet Name</Label>
                  <Input
                    id="planet-name"
                    type="text"
                    placeholder="Enter planet name..."
                    value={planetName}
                    onChange={(e) => setPlanetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && planetName.trim()) {
                        handleColonize()
                      }
                    }}
                    disabled={isColonizing}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleColonize}
                  disabled={isColonizing || !planetName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {isColonizing ? 'Colonizing...' : 'Colonize Planet'}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              onClick={handleSendFleet}
              className="w-full"
            >
              <Ship className="w-4 h-4 mr-2" />
              Send Fleet Here
            </Button>

            {isOccupied && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSendFleet}
                  className="w-full"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Attack Planet
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSendFleet}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Station Fleet Here
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
