import { useMemo } from 'react'
import { Planet } from '@/types/api.types'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Settings, Ship, Shield, FlaskConical, Send, X, Building2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useGetPlanetFacilitiesQuery } from '@/api/endpoints/facilitiesApi'
import { useGetPlanetDefencesQuery } from '@/api/endpoints/defencesApi'
import { useGetConstructionQueueQuery } from '@/api/endpoints/planetsApi'
import { Skeleton } from '@/components/ui/skeleton'
import planetSurfaceImg from '../../../assets/images/sections/planet/planet_surface.jpg'

interface PlanetDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  planet: Planet | null
}

export function PlanetDetailPanel({
  isOpen,
  onClose,
  planet,
}: PlanetDetailPanelProps) {
  const { openPanel } = usePanel()
  
  const { data: planetData, isLoading: isLoadingPlanet } = useGetPlanetQuery(
    planet?.id || 0,
    { skip: !planet?.id }
  )
  const { data: facilitiesData, isLoading: isLoadingFacilities } = useGetPlanetFacilitiesQuery(
    planet?.id || 0,
    { skip: !planet?.id }
  )
  const { data: defencesData, isLoading: isLoadingDefences } = useGetPlanetDefencesQuery(
    planet?.id || 0,
    { skip: !planet?.id }
  )
  const { data: queueData, isLoading: isLoadingQueue } = useGetConstructionQueueQuery(
    planet?.id || 0,
    { skip: !planet?.id }
  )

  const displayPlanet = planetData?.planet || planet

  const managementActions = useMemo(() => {
    if (!displayPlanet) return []
    
    return [
      {
        label: 'Tech Tree - Facilities',
        icon: Settings,
        description: 'Manage and research facility technologies',
        onClick: () => {
          openPanel(PanelType.TECH_TREE_FACILITIES, PanelSize.XLARGE, {
            planet: displayPlanet
          })
        }
      },
      {
        label: 'Tech Tree - Ships',
        icon: Ship,
        description: 'Research and unlock ship technologies',
        onClick: () => {
          openPanel(PanelType.TECH_TREE_SHIPS, PanelSize.XLARGE, {
            planet: displayPlanet
          })
        }
      },
      {
        label: 'Tech Tree - Defenses',
        icon: Shield,
        description: 'Research defensive technologies',
        onClick: () => {
          openPanel(PanelType.TECH_TREE_DEFENSES, PanelSize.XLARGE, {
            planet: displayPlanet
          })
        }
      },
      {
        label: 'Tech Tree - Research',
        icon: FlaskConical,
        description: 'Advanced research and development',
        onClick: () => {
          openPanel(PanelType.TECH_TREE_RESEARCH, PanelSize.XLARGE, {
            planet: displayPlanet
          })
        }
      },
      {
        label: 'Fleet Command',
        icon: Send,
        description: 'Manage fleets and send ships',
        onClick: () => {
          openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
            destinationPlanet: displayPlanet
          })
        }
      },
      {
        label: 'Construction Queue',
        icon: Building2,
        description: 'View and manage construction projects',
        onClick: () => {
          openPanel(PanelType.CONSTRUCTION_QUEUE, PanelSize.MEDIUM, {
            planetId: displayPlanet.id
          })
        }
      }
    ]
  }, [displayPlanet, openPanel])

  if (!planet) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[10003] bg-black/40 backdrop-blur-md transition-opacity"
          onClick={onClose}
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        />
      )}
      
      {/* Slide Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full z-[10004] shadow-2xl',
          'transition-transform duration-300 ease-out',
          'w-full max-w-md overflow-y-auto',
          'panel-glass surface-gradient card-glow',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'linear-gradient(180deg, hsl(var(--card) / 0.7) 0%, hsl(var(--card) / 0.5) 100%)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <Card className="h-full rounded-none !border-0 bg-transparent shadow-none">
          <CardHeader className="sticky top-0 bg-card/60 backdrop-blur-md z-10 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{displayPlanet?.name || 'Planet Details'}</CardTitle>
                {displayPlanet?.coordinate && (
                  <CardDescription className="mt-1">
                    {formatCoordinate(displayPlanet.coordinate)}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Banner Image - Edge to edge, no padding */}
          <div className="w-full relative">
            <img
              src={planetSurfaceImg}
              alt="Planet Surface"
              className="w-full h-auto object-cover"
            />
            {/* Gradient Overlay - Subtle and sleek */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to bottom, 
                    rgba(0, 0, 0, 0.15) 0%, 
                    rgba(0, 0, 0, 0) 25%, 
                    rgba(0, 0, 0, 0) 75%, 
                    rgba(6, 182, 212, 0.1) 100%
                  ),
                  linear-gradient(to right,
                    rgba(0, 0, 0, 0.1) 0%,
                    rgba(0, 0, 0, 0) 50%,
                    rgba(0, 0, 0, 0.1) 100%
                  )
                `,
              }}
            />
          </div>
          
          {/* Planet Info Section */}
          <div className="px-6 pt-6 pb-4 space-y-4 border-b border-border/50">
            {isLoadingPlanet ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                {/* Planet Type and Description */}
                {displayPlanet?.type && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {displayPlanet.type.name}
                      </Badge>
                      {displayPlanet.state && (
                        <Badge variant="outline" className="capitalize">
                          {displayPlanet.state}
                        </Badge>
                      )}
                    </div>
                    {displayPlanet.type.description && (
                      <p className="text-sm text-muted-foreground italic">
                        {displayPlanet.type.description}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Planet Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tellerium */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTelleriumImage()}
                        alt="Tellerium"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-xs text-muted-foreground">Tellerium</span>
                    </div>
                    <div className="font-mono font-semibold text-cyan-400">
                      {formatResource(displayPlanet?.tellerium_balance || 0)}
                    </div>
                    {displayPlanet?.production?.tellerium_per_tick && displayPlanet.production.tellerium_per_tick > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{formatResource(displayPlanet.production.tellerium_per_tick)}/tick
                      </div>
                    )}
                  </div>
                  
                  {/* Krypton */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getKryptonImage()}
                        alt="Krypton"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-xs text-muted-foreground">Krypton</span>
                    </div>
                    <div className="font-mono font-semibold text-blue-400">
                      {formatResource(displayPlanet?.krypton_balance || 0)}
                    </div>
                    {displayPlanet?.production?.krypton_per_tick && displayPlanet.production.krypton_per_tick > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{formatResource(displayPlanet.production.krypton_per_tick)}/tick
                      </div>
                    )}
                  </div>
                  
                  {/* Mines */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getMineImage()}
                        alt="Mines"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-xs text-muted-foreground">Mines</span>
                    </div>
                    <div className="font-semibold text-green-400">
                      {displayPlanet?.mines || 0}
                    </div>
                  </div>
                  
                  {/* Probes */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getProbeImage()}
                        alt="Probes"
                        className="w-4 h-4 object-contain"
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-xs text-muted-foreground">Probes</span>
                    </div>
                    <div className="font-semibold text-purple-400">
                      {displayPlanet?.probes || 0}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Facilities Section */}
          {!isLoadingFacilities && facilitiesData?.facilities && facilitiesData.facilities.length > 0 && (
            <div className="px-6 pt-4 pb-4 border-b border-border/50">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Facilities ({facilitiesData.facilities.length})
              </h3>
              <div className="space-y-2">
                {facilitiesData.facilities.slice(0, 5).map((facility: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {facility.definition?.name || facility.facility_slug}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Lv. {facility.level || 1}
                    </Badge>
                  </div>
                ))}
                {facilitiesData.facilities.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{facilitiesData.facilities.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Defenses Section */}
          {!isLoadingDefences && defencesData?.defences && defencesData.defences.length > 0 && (
            <div className="px-6 pt-4 pb-4 border-b border-border/50">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Defenses ({defencesData.defences.length})
              </h3>
              <div className="space-y-2">
                {defencesData.defences.slice(0, 5).map((defence: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {defence.definition?.name || defence.defence_slug}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {defence.quantity || 1}x
                    </Badge>
                  </div>
                ))}
                {defencesData.defences.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{defencesData.defences.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Construction Queue Preview */}
          {!isLoadingQueue && queueData?.construction_queue && queueData.construction_queue.length > 0 && (
            <div className="px-6 pt-4 pb-4 border-b border-border/50">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Construction Queue ({queueData.construction_queue.length})
              </h3>
              <div className="space-y-2">
                {queueData.construction_queue.slice(0, 3).map((construction, index: number) => (
                  <div key={construction.id || index} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {construction.item_slug || construction.type}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {construction.ticks_remaining || 0} ticks
                      </Badge>
                    </div>
                  </div>
                ))}
                {queueData.construction_queue.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{queueData.construction_queue.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
          
          <CardContent className="p-6">
            {/* Desktop-style Action Grid */}
            <div className="grid grid-cols-2 gap-4">
              {managementActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-3 p-6",
                      "panel-glass border border-border/30 hover:border-primary/50",
                      "bg-card/30 hover:bg-card/50",
                      "transition-all duration-200",
                      "hover:shadow-lg hover:shadow-primary/10",
                      "hover:scale-[1.02] hover:-translate-y-0.5",
                      "active:scale-[0.98]"
                    )}
                    style={{
                      clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0% 100%)',
                    }}
                  >
                    {/* Icon Container with Background */}
                    <div className={cn(
                      "relative w-14 h-14 flex items-center justify-center",
                      "bg-primary/10 border border-primary/20 rounded-sm",
                      "group-hover:bg-primary/20 group-hover:border-primary/40",
                      "transition-all duration-200"
                    )}>
                      <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    
                    {/* Label */}
                    <div className="text-center">
                      <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {action.label.split(' - ')[1] || action.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {action.description}
                      </div>
                    </div>
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="absolute inset-0 bg-primary/5 blur-xl" />
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

