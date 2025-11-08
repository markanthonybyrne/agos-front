import { useState } from 'react'
import { Planet } from '@/types/api.types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useNavigate } from 'react-router-dom'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { formatResource, formatNumber } from '@/lib/formatters'
import { 
  Home, 
  MapPin, 
  Eye, 
  Rocket, 
  Telescope, 
  ExternalLink,
  User,
  AlertCircle,
  Droplets
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { TravelTimeCalculator } from './TravelTimeCalculator'
import { getPlanetImage } from '@/lib/planetImages'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useResourcesCatalog } from '@/hooks/useResourcesCatalog'

interface PlanetActionPanelProps {
  planet: Planet | null
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export function PlanetActionPanel({ planet, isOpen, onClose, onRefresh }: PlanetActionPanelProps) {
  const navigate = useNavigate()
  const { empire } = useAuth()
  const { openPanel } = usePanel()
  const [showTravelCalculator, setShowTravelCalculator] = useState(false)
  
  // Fetch full planet details if planet ID is available
  const { data: planetDetails } = useGetPlanetQuery(planet?.id || 0, {
    skip: !planet?.id,
  })

  const displayPlanet = planetDetails?.planet || planet
  const { getMetadata } = useResourcesCatalog({ reserves: displayPlanet?.secondary_reserves })
  if (!displayPlanet) return null

  const coord = parseCoordinate(displayPlanet.coordinate)
  const isOwned = displayPlanet.owner_empire_id === empire?.id
  const isUnsettled = displayPlanet.state === 'unsettled'
  
  const handleColonize = () => {
    // Open fleet command panel with colonization order type
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: displayPlanet,
      orderType: 'colonize',
    })
    onClose()
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
      return getPlanetImage(displayPlanet.type.slug)
    }
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto panel-glass surface-gradient card-glow vignette border-muted/20 p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={getPlanetTypeImage() || getPlanetImage('arid')}
              alt={displayPlanet.type?.name || 'Planet'}
              className="h-14 w-14 flex-shrink-0 object-contain sm:h-16 sm:w-16"
              style={{ imageRendering: 'auto', display: 'block' }}
              onError={(e) => {
                console.error('Planet image failed to load in action panel:', displayPlanet.type?.slug)
              }}
            />
            <div className="space-y-2">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-lg text-brand-cyan sm:text-xl">
                {displayPlanet.name || `Planet ${formatCoordinate(displayPlanet.coordinate)}`}
                {displayPlanet.state === 'homeworld' && (
                  <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                    <Home className="w-3 h-3 mr-1" />
                    Homeworld
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="font-mono text-sm text-muted-foreground">
                {formatCoordinate(displayPlanet.coordinate)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Planet Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">State</label>
              <div className="mt-1">
                <Badge variant={isUnsettled ? 'outline' : 'default'}>
                  {displayPlanet.state}
                </Badge>
              </div>
            </div>
            {displayPlanet.type && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Type</label>
                <div className="mt-1 font-semibold text-sm sm:text-base">{displayPlanet.type.name}</div>
                {displayPlanet.type.description && (
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{displayPlanet.type.description}</p>
                )}
              </div>
            )}
            {displayPlanet.owner_empire_id && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Owner</label>
                <div className="mt-1 text-sm font-semibold sm:text-base">
                  {isOwned ? 'You' : `Empire #${displayPlanet.owner_empire_id}`}
                </div>
              </div>
            )}
          </div>

          {/* Resources (if owned) */}
          {isOwned && (
            <>
              <div className="border-t border-border/50 my-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <img
                      src={getTelleriumImage()}
                      alt="T"
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <label className="text-sm text-muted-foreground">Tellerium</label>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-cyan-400 sm:text-base">
                    {formatResource(displayPlanet.tellerium_balance)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <img
                      src={getKryptonImage()}
                      alt="K"
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <label className="text-sm text-muted-foreground">Krypton</label>
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-blue-400 sm:text-base">
                    {formatResource(displayPlanet.krypton_balance)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <img
                      src={getMineImage()}
                      alt="Mine"
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <label className="text-sm text-muted-foreground">Mines</label>
                  </div>
                  <div className="mt-1 font-semibold">{displayPlanet.mines}</div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <img
                      src={getProbeImage()}
                      alt="Probe"
                      className="h-4 w-4 object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                    <label className="text-sm text-muted-foreground">Probes</label>
                  </div>
                  <div className="mt-1 font-semibold">{displayPlanet.probes}</div>
                </div>
              </div>
            </>
          )}

          {displayPlanet.secondary_reserves && displayPlanet.secondary_reserves.length > 0 && (
            <>
              <div className="border-t border-border/50 my-4" />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-300" />
                  Ore Veins
                </h3>
                <div className="space-y-2">
                  {displayPlanet.secondary_reserves.map((reserve) => {
                    const metadata = getMetadata(reserve.slug)
                    const richnessPercent = Math.round(((reserve.richness ?? 1) - 1) * 100)
                    return (
                      <div
                        key={`${reserve.slug}-${reserve.remaining}-${reserve.depleted_at ?? 'active'}`}
                        className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: metadata.color }}
                            />
                            <span className="text-sm font-medium text-foreground">{metadata.name}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {metadata.rarity}
                            </Badge>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatNumber(reserve.remaining ?? 0)} remaining
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Richness: {richnessPercent >= 0 ? '+' : ''}
                            {richnessPercent}%
                          </span>
                          {reserve.depleted_at && (
                            <span className="text-red-300">Depleted</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border/50 my-4" />

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Actions</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleViewDetails}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>

              {isUnsettled && displayPlanet.is_habitable && (
                <Button
                  onClick={handleColonize}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Create Colonization Fleet
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

