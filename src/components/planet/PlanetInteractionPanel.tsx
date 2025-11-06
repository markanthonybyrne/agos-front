import { Planet } from '@/types/api.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCoordinate, parseCoordinate, getPlanetXY } from '@/lib/coordinates'
import { 
  Rocket, 
  Ship,
  Shield,
  Sword
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getPlanetImage } from '@/lib/planetImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'

interface PlanetInteractionPanelProps {
  planet: Planet
  onClose?: () => void
}

export function PlanetInteractionPanel({ planet, onClose }: PlanetInteractionPanelProps) {
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const { data: planetsData } = useGetPlanetsQuery()
  const planets: any[] = Array.isArray(planetsData) ? planetsData : (planetsData as any)?.planets || []
  
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

  const handleColonize = () => {
    // Open fleet command panel with colonization order type
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: planet,
      orderType: 'colonize',
    })
    onClose?.()
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
            {isUnsettled && planet.is_habitable && (
              <Button
                onClick={handleColonize}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Colonization Fleet
              </Button>
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
