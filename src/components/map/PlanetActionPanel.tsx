import { Planet } from '@/types/api.types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useColonizePlanetMutation, useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useNavigate } from 'react-router-dom'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { 
  Home, 
  MapPin, 
  Eye, 
  Rocket, 
  Telescope, 
  ExternalLink,
  User,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { TravelTimeCalculator } from './TravelTimeCalculator'

interface PlanetActionPanelProps {
  planet: Planet | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function PlanetActionPanel({ planet, isOpen, onClose, onRefresh }: PlanetActionPanelProps) {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [colonizePlanet, { isLoading: isColonizing }] = useColonizePlanetMutation()
  const [showTravelCalculator, setShowTravelCalculator] = useState(false)
  
  // Fetch full planet details if planet ID is available
  const { data: planetDetails } = useGetPlanetQuery(planet?.id || 0, {
    skip: !planet?.id,
  })

  const displayPlanet = planetDetails?.planet || planet
  if (!displayPlanet) return null

  const coord = parseCoordinate(displayPlanet.coordinate)
  const isOwned = displayPlanet.owner_empire_id === empire?.id
  const isUnsettled = displayPlanet.state === 'unsettled'

  const handleColonize = async () => {
    if (!coord) {
      toast.error('Invalid planet coordinates')
      return
    }

    const name = prompt('Enter a name for this planet:')
    if (!name || name.trim() === '') {
      return
    }

    try {
      await colonizePlanet({
        quadrant: coord.quadrant,
        sector: coord.sector,
        galaxy: coord.galaxy,
        planet: coord.planet,
        name: name.trim(),
      }).unwrap()

      toast.success(`Planet ${name} colonized successfully!`)
      onRefresh?.()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to colonize planet')
    }
  }

  const handleViewDetails = () => {
    if (displayPlanet.id) {
      navigate(`/planets/${displayPlanet.id}`)
      onClose()
    }
  }

  const handleViewOwner = () => {
    if (displayPlanet.owner_empire_id) {
      navigate(`/empires/${displayPlanet.owner_empire_id}`)
      onClose()
    }
  }

  const getPlanetTypeImage = () => {
    if (displayPlanet.type?.slug) {
      return `/assets/images/${displayPlanet.type.slug}.jpg`
    }
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getPlanetTypeImage() && (
              <img
                src={getPlanetTypeImage()!}
                alt={displayPlanet.type?.name || 'Planet'}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <DialogTitle className="flex items-center gap-2">
                {displayPlanet.name || `Planet ${formatCoordinate(displayPlanet.coordinate)}`}
                {displayPlanet.state === 'homeworld' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Home className="w-3 h-3 mr-1" />
                    Homeworld
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="font-mono">
                {formatCoordinate(displayPlanet.coordinate)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Planet Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">State</label>
              <div className="mt-1">
                <Badge variant={isUnsettled ? 'outline' : 'default'}>
                  {displayPlanet.state}
                </Badge>
              </div>
            </div>
            {displayPlanet.type && (
              <div>
                <label className="text-sm text-muted-foreground">Type</label>
                <div className="mt-1 font-semibold">{displayPlanet.type.name}</div>
              </div>
            )}
            {displayPlanet.owner_empire_id && (
              <div>
                <label className="text-sm text-muted-foreground">Owner</label>
                <div className="mt-1 font-semibold">
                  {isOwned ? 'You' : `Empire #${displayPlanet.owner_empire_id}`}
                </div>
              </div>
            )}
          </div>

          {/* Resources (if owned) */}
          {isOwned && (
            <>
              <div className="border-t border-border/50 my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Tellerium</label>
                  <div className="mt-1 font-mono font-semibold text-cyan-400">
                    {formatResource(displayPlanet.tellerium_balance)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Krypton</label>
                  <div className="mt-1 font-mono font-semibold text-blue-400">
                    {formatResource(displayPlanet.krypton_balance)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Mines</label>
                  <div className="mt-1 font-semibold">{displayPlanet.mines}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Probes</label>
                  <div className="mt-1 font-semibold">{displayPlanet.probes}</div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border/50 my-4" />

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleViewDetails}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>

              {isUnsettled && (
                <Button
                  onClick={handleColonize}
                  disabled={isColonizing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {isColonizing ? 'Colonizing...' : 'Colonize'}
                </Button>
              )}

              {!isUnsettled && displayPlanet.owner_empire_id && !isOwned && (
                <Button
                  variant="outline"
                  onClick={handleViewOwner}
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Owner
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowTravelCalculator(!showTravelCalculator)}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Travel Time
              </Button>
            </div>
          </div>

          {/* Travel Time Calculator */}
          {showTravelCalculator && (
            <div className="mt-4">
              <TravelTimeCalculator
                destinationPlanet={displayPlanet}
                onNavigateToFleet={(planet) => {
                  navigate('/fleets', { state: { destinationPlanet: planet } })
                  onClose()
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

