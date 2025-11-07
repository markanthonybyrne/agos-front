import { useMemo } from 'react'
import { Planet } from '@/types/api.types'
import { X, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCoordinate } from '@/lib/coordinates'
import { formatResource } from '@/lib/formatters'
import { getTelleriumImage, getKryptonImage, getMineImage, getProbeImage } from '@/lib/resourceImages'
import planetHomePanelImg from '../../../assets/images/sections/planet/planet_home_panel.jpg'
import {
  createPlanetManagementActions,
  type OpenPanelHandler
} from './planetManagementActions'

interface PlanetManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  planet: Planet
  openPanel: OpenPanelHandler
}

export function PlanetManagementPanel({
  isOpen,
  onClose,
  onToggle,
  planet,
  openPanel
}: PlanetManagementPanelProps) {
  
  const managementActions = useMemo(
    () => createPlanetManagementActions(planet, openPanel),
    [planet, openPanel]
  )

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
                <CardTitle className="text-xl">{planet.name || 'Planet Management'}</CardTitle>
                {planet.coordinate && (
                  <CardDescription className="mt-1">
                    {formatCoordinate(planet.coordinate)}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className={cn(
                    "w-5 h-5 transition-transform",
                    isOpen ? "rotate-0" : "rotate-180"
                  )} />
                </Button>
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
              src={planetHomePanelImg}
              alt="Planet Management"
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
            {/* Planet Type and Description */}
            {planet.type && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {planet.type.name}
                  </Badge>
                  {planet.state && (
                    <Badge variant="outline" className="capitalize">
                      {planet.state}
                    </Badge>
                  )}
                </div>
                {planet.type.description && (
                  <p className="text-sm text-muted-foreground italic">
                    {planet.type.description}
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
                  {formatResource(planet.tellerium_balance || 0)}
                </div>
                {planet.production?.tellerium_per_tick && planet.production.tellerium_per_tick > 0 && (
                  <div className="text-xs text-muted-foreground">
                    +{formatResource(planet.production.tellerium_per_tick)}/tick
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
                  {formatResource(planet.krypton_balance || 0)}
                </div>
                {planet.production?.krypton_per_tick && planet.production.krypton_per_tick > 0 && (
                  <div className="text-xs text-muted-foreground">
                    +{formatResource(planet.production.krypton_per_tick)}/tick
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
                  {planet.mines || 0}
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
                  {planet.probes || 0}
                </div>
              </div>
            </div>
          </div>
          
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
                        {action.shortLabel}
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

