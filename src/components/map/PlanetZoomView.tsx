import { useEffect, useState, useRef } from 'react'
import { Planet } from '@/types/api.types'
import { getPlanetImage, getRandomAsteroidImageForPlanet } from '@/lib/planetImages'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { X, Eye, Rocket, Home, Settings, Ship, Shield, FlaskConical, Send, ExternalLink, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCoordinate, parseCoordinate } from '@/lib/coordinates'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface PlanetZoomViewProps {
  planet: Planet
  onClose: () => void
}

/**
 * PlanetZoomView - Shows a zoomed-in view of a planet with circular action buttons and glass tooltip
 * 
 * Features:
 * - Glass blur overlay on background (system visible behind)
 * - Planet zooms in to center of viewport
 * - Action buttons arranged in a circle around the planet
 * - Glass tooltip panel below planet with details
 */
export function PlanetZoomView({ planet, onClose }: PlanetZoomViewProps) {
  const { openPanel } = usePanel()
  const { empire } = useAuth()
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Get planet image
  let planetSlug = planet.type?.slug
  if (planetSlug === 'sol' || planetSlug === 'sol_angry' || planetSlug === 'sol-angry' || 
      planetSlug === 'sol_massive' || planetSlug === 'sol-massive') {
    planetSlug = undefined
  }
  
  let planetImage: string | undefined
  if (planetSlug === 'asteroid' || planetSlug === 'asteroid_belt' || planetSlug === 'asteroid-belt') {
    planetImage = getRandomAsteroidImageForPlanet(planet.coordinate)
  } else {
    planetImage = getPlanetImage(planetSlug)
  }
  
  const isOwned = planet.owner_empire_id === empire?.id
  const isUnsettled = planet.state === 'unsettled'
  const coord = parseCoordinate(planet.coordinate)
  
  // Set animation complete after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])
  
  // Action handlers
  const handleViewDetails = () => {
    if (planet.id) {
      navigate(`/planets/${planet.id}`)
      onClose()
    }
  }
  
  const handleColonize = () => {
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: planet,
      orderType: 'colonize',
    })
    onClose()
  }
  
  const handleSendFleet = () => {
    openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
      destinationPlanet: planet
    })
    onClose()
  }
  
  const handleFacilities = () => {
    openPanel(PanelType.TECH_TREE_FACILITIES, PanelSize.XLARGE, {
      planet: planet
    })
    onClose()
  }
  
  const handleShips = () => {
    openPanel(PanelType.TECH_TREE_SHIPS, PanelSize.XLARGE, {
      planet: planet
    })
    onClose()
  }
  
  const handleDefenses = () => {
    openPanel(PanelType.TECH_TREE_DEFENSES, PanelSize.XLARGE, {
      planet: planet
    })
    onClose()
  }
  
  const handleResearch = () => {
    openPanel(PanelType.TECH_TREE_RESEARCH, PanelSize.XLARGE, {
      planet: planet
    })
    onClose()
  }
  
  // Define actions based on planet state
  const actions = [
    {
      id: 'view',
      icon: Eye,
      label: 'View Details',
      onClick: handleViewDetails,
      color: 'text-cyan-400',
      show: true,
    },
    ...(isUnsettled ? [{
      id: 'colonize',
      icon: Rocket,
      label: 'Colonize',
      onClick: handleColonize,
      color: 'text-green-400',
      show: true,
    }] : []),
    ...(isOwned ? [
      {
        id: 'facilities',
        icon: Settings,
        label: 'Facilities',
        onClick: handleFacilities,
        color: 'text-purple-400',
        show: true,
      },
      {
        id: 'ships',
        icon: Ship,
        label: 'Ships',
        onClick: handleShips,
        color: 'text-blue-400',
        show: true,
      },
      {
        id: 'defenses',
        icon: Shield,
        label: 'Defenses',
        onClick: handleDefenses,
        color: 'text-red-400',
        show: true,
      },
      {
        id: 'research',
        icon: FlaskConical,
        label: 'Research',
        onClick: handleResearch,
        color: 'text-green-400',
        show: true,
      },
      {
        id: 'fleet',
        icon: Send,
        label: 'Fleet',
        onClick: handleSendFleet,
        color: 'text-cyan-400',
        show: true,
      },
    ] : []),
    ...(!isOwned && !isUnsettled ? [{
      id: 'fleet',
      icon: Send,
      label: 'Send Fleet',
      onClick: handleSendFleet,
      color: 'text-cyan-400',
      show: true,
    }] : []),
  ].filter(action => action.show)
  
  // Calculate positions for circular action buttons
  const actionRadius = 280 // Distance from planet center
  const actionButtonSize = 56 // Button size
  const getActionPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2 // Start from top
    const x = Math.cos(angle) * actionRadius
    const y = Math.sin(angle) * actionRadius
    return { x, y, angle }
  }
  
  return (
    <>
      {/* Glass blur overlay - more transparent so system is visible */}
      <div
        className="fixed inset-0 z-[10001] pointer-events-auto"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          animation: 'fadeInGlass 0.4s ease-out forwards',
        }}
        onClick={onClose}
      />
      
      {/* Zoomed planet container */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[10002] pointer-events-none flex items-center justify-center"
        style={{
          animation: isAnimating ? 'planetZoomIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards' : 'none',
        }}
      >
        {/* Close button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 z-10 pointer-events-auto",
            "bg-black/70 backdrop-blur-sm border-white/20 hover:bg-black/90",
            "text-white"
          )}
        >
          <X className="w-4 h-4" />
        </Button>
        
        {/* Planet and actions container */}
        {planetImage && (
          <div
            className="relative"
            style={{
              width: '450px',
              height: '450px',
              animation: isAnimating ? 'planetScaleIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards' : 'none',
            }}
          >
            {/* Planet image container with rotation shadow */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative" style={{ width: '100%', height: '100%' }}>
                <img
                  src={planetImage}
                  alt={planet.type?.name || 'Planet'}
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.6))',
                    clipPath: 'circle(50% at 50% 50%)',
                  }}
                />
                
                {/* Rotating shadow overlay for 3D effect - matches image exactly */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 30% 50%, transparent 0%, transparent 45%, rgba(0, 0, 0, 0.25) 65%, rgba(0, 0, 0, 0.5) 100%)',
                    animation: 'planetRotateShadow 15s linear infinite',
                    mixBlendMode: 'multiply',
                    clipPath: 'circle(50% at 50% 50%)',
                    maskImage: 'radial-gradient(circle, black 0%, black 100%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 0%, black 100%)',
                  }}
                />
                
                {/* Subtle highlight overlay - matches image exactly */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 70% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 55%)',
                    animation: 'planetRotateShadow 15s linear infinite',
                    mixBlendMode: 'overlay',
                    clipPath: 'circle(50% at 50% 50%)',
                    maskImage: 'radial-gradient(circle, black 0%, black 100%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 0%, black 100%)',
                  }}
                />
              </div>
            </div>
            
            {/* Action buttons in a circle around the planet */}
            {actions.map((action, index) => {
              const { x, y } = getActionPosition(index, actions.length)
              const Icon = action.icon
              return (
                <div
                  key={action.id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    animation: isAnimating ? `actionButtonFadeIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) ${0.6 + index * 0.1}s both` : 'none',
                  }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      action.onClick()
                    }}
                    className={cn(
                      "w-14 h-14 rounded-full",
                      "bg-black/80 backdrop-blur-md border-cyan-500/40",
                      "hover:bg-cyan-500/20 hover:border-cyan-500/60",
                      "transition-all duration-200",
                      "group"
                    )}
                    title={action.label}
                  >
                    <Icon className={cn("w-6 h-6", action.color, "group-hover:scale-110 transition-transform")} />
                  </Button>
                  {/* Action label tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <div className="bg-black/90 backdrop-blur-sm border border-cyan-500/40 rounded px-2 py-1 text-xs text-white">
                      {action.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Glass tooltip panel below planet with details */}
        <div
          className="absolute pointer-events-auto"
          style={{
            top: 'calc(50% + 280px)',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: isAnimating ? 'tooltipFadeIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) 0.5s both' : 'none',
            minWidth: '400px',
            maxWidth: '600px',
          }}
        >
          <div className="panel-glass surface-gradient border border-cyan-500/40 card-glow p-6 shadow-2xl backdrop-blur-md">
            <div className="space-y-4">
              {/* Planet name header */}
              <div className="text-center border-b border-cyan-500/20 pb-3">
                <h3 className="text-2xl font-bold text-cyan-400 mb-1 tracking-wide">
                  {planet.name || `Planet ${formatCoordinate(planet.coordinate)}`}
                </h3>
                <p className="text-xs text-white/50 font-mono">
                  {formatCoordinate(planet.coordinate)}
                </p>
              </div>
              
              {/* Planet attributes grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Status</div>
                  <div>
                    {planet.state === 'homeworld' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Home className="w-3 h-3 mr-1" />
                        HOMEWORLD
                      </Badge>
                    )}
                    {planet.state === 'colony' && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        COLONIZED
                      </Badge>
                    )}
                    {planet.state === 'unsettled' && (
                      <Badge variant="outline" className="text-white/70 border-white/30">
                        UNSETTLED
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Type */}
                {planet.type && (
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Type</div>
                    <div className="text-sm font-semibold text-white/90 uppercase">
                      {planet.type.name}
                    </div>
                  </div>
                )}
                
                {/* Owner */}
                {planet.owner_empire_id && (
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Owner</div>
                    <div className="text-sm text-white/90 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {isOwned ? 'You' : `Empire #${planet.owner_empire_id}`}
                    </div>
                  </div>
                )}
                
                {/* Resources section */}
                {(planet.tellerium_balance !== undefined || planet.krypton_balance !== undefined) && (
                  <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Resources</div>
                    <div className="space-y-2">
                      {planet.tellerium_balance !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                            <span>Tellerium</span>
                          </div>
                          <span className="text-sm font-mono text-cyan-400">
                            {planet.tellerium_balance.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {planet.krypton_balance !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <span>Krypton</span>
                          </div>
                          <span className="text-sm font-mono text-purple-400">
                            {planet.krypton_balance.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Production rates */}
                {planet.production && (planet.production.tellerium_per_tick > 0 || planet.production.krypton_per_tick > 0) && (
                  <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Production</div>
                    <div className="space-y-2">
                      {planet.production.tellerium_per_tick > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">Tellerium/Tick</span>
                          <span className="text-sm font-mono text-cyan-400">
                            +{planet.production.tellerium_per_tick.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {planet.production.krypton_per_tick > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">Krypton/Tick</span>
                          <span className="text-sm font-mono text-purple-400">
                            +{planet.production.krypton_per_tick.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Infrastructure */}
                {(planet.mines > 0 || planet.probes > 0 || (planet.facilities && Object.keys(planet.facilities).length > 0) || (planet.defence_grid && Object.keys(planet.defence_grid).length > 0)) && (
                  <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Infrastructure</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {planet.mines > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Mines</span>
                          <span className="text-cyan-400 font-mono">{planet.mines}</span>
                        </div>
                      )}
                      {planet.probes > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Probes</span>
                          <span className="text-cyan-400 font-mono">{planet.probes}</span>
                        </div>
                      )}
                      {planet.facilities && Object.keys(planet.facilities).length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Facilities</span>
                          <span className="text-cyan-400 font-mono">
                            {Object.values(planet.facilities).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                      )}
                      {planet.defence_grid && Object.keys(planet.defence_grid).length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Defenses</span>
                          <span className="text-cyan-400 font-mono">
                            {Object.values(planet.defence_grid).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Type description */}
                {planet.type?.description && (
                  <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Description</div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {planet.type.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInGlass {
          from {
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            background-color: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
        
        @keyframes planetZoomIn {
          0% {
            opacity: 0;
            transform: scale(0.1) translateY(0);
            filter: blur(30px);
          }
          30% {
            opacity: 0.5;
            filter: blur(15px);
          }
          60% {
            opacity: 0.9;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        
        @keyframes planetScaleIn {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          50% {
            transform: scale(0.6);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes planetRotateShadow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes actionButtonFadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes tooltipFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  )
}
