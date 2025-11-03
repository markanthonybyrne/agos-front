import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { 
  openPanel as openPanelAction,
  closePanel, 
  minimizePanel, 
  maximizePanel, 
  bringToFront,
  closeAllPanels as closeAllPanelsAction,
  closePanelsByType as closePanelsByTypeAction,
} from '@/app/slices/panelSlice'
import { PanelSize, PanelType, PanelState, Panel } from '@/app/slices/panelSlice'
import { SlidingPanel } from './SlidingPanel'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { FacilityTechTree } from '@/components/tech-tree/FacilityTechTree'
import { ShipTechTree } from '@/components/tech-tree/ShipTechTree'
import { DefenseTechTree } from '@/components/tech-tree/DefenseTechTree'
import { ResearchTechTree } from '@/components/tech-tree/ResearchTechTree'
import { BuildDetailPanel } from '@/components/build/BuildDetailPanel'
import { ResearchDetailPanel } from '@/components/research/ResearchDetailPanel'
import { FleetCommandPanel } from '@/components/fleet/FleetCommandPanel'
import { UniverseMap } from '@/features/map/UniverseMap'
import { ConstructionQueue } from '@/components/construction/ConstructionQueue'
import { PlanetConsolePanel } from '@/components/planet/PlanetConsolePanel'
import { PlanetDetailPanel } from '@/components/planet/PlanetDetailPanel'
import { PlanetInteractionPanel } from '@/components/planet/PlanetInteractionPanel'
import { PlanetImageDisplay } from '@/components/planet/PlanetImageDisplay'
import { FleetsPanel } from '@/features/fleets/FleetsPanel'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { RankingsPage } from '@/features/rankings/RankingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PoliticsPage } from '@/features/politics/PoliticsPage'
import { NotificationTrayPanel } from '@/components/notifications/NotificationTrayPanel'
import { CreateAllianceRequestForm } from '@/features/politics/components/CreateAllianceRequestForm'
import { QuantumCreditsPanel } from '@/components/premium/QuantumCreditsPanel'
import { BoostersPanel } from '@/components/premium/BoostersPanel'
import { AchievementsPanel } from '@/components/premium/AchievementsPanel'
import { SignalsPage } from '@/features/signals/SignalsPage'
import { CombatLogsPage } from '@/features/combat/CombatLogsPage'
import { ComposeMailPanel } from '@/components/messaging/ComposeMailPanel'
import { ChatPanel } from '@/features/chat/ChatPanel'
import { MarketPanel } from '@/features/market/MarketPanel'
import { useParams } from 'react-router-dom'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'
import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Get panel title helper function
function getPanelTitle(panel: Panel): string {
  if (panel.type === PanelType.COMPOSE_MAIL && panel.data?.replyToMail) {
    return 'Reply to Message'
  }
  
  const titles: Record<PanelType, string> = {
    [PanelType.TECH_TREE_FACILITIES]: 'Facility Tech Tree',
    [PanelType.TECH_TREE_SHIPS]: 'Ship Tech Tree',
    [PanelType.TECH_TREE_DEFENSES]: 'Defense Tech Tree',
    [PanelType.TECH_TREE_RESEARCH]: 'Research Tech Tree',
    [PanelType.BUILD_DETAIL]: 'Build Item',
    [PanelType.FLEET_COMMAND]: 'Fleet Command',
    [PanelType.VISUAL_COORDINATE]: 'Select Destination',
    [PanelType.SHIP_SELECTOR]: 'Select Ships',
    [PanelType.RESEARCH_DETAIL]: 'Research Details',
    [PanelType.PLANET_VIEW]: panel.data?.showDetailView ? 'Planet Details' : 'Planet View',
    [PanelType.CONSTRUCTION_QUEUE]: 'Construction Queue',
    [PanelType.GALAXY_MAP]: 'Galaxy Map',
    [PanelType.MESSAGING]: 'Messages',
    [PanelType.NOTIFICATIONS]: 'Notifications',
    [PanelType.RANKINGS]: 'Rankings',
    [PanelType.SETTINGS]: 'Settings',
    [PanelType.POLITICS]: 'Politics & Alliances',
    [PanelType.CREATE_ALLIANCE_REQUEST]: 'Create Alliance Request',
    [PanelType.MAP_PLANET_INFO]: 'Planet Information',
    [PanelType.QUANTUM_CREDITS]: 'Quantum Credits',
    [PanelType.BOOSTERS]: 'Boosters',
    [PanelType.ACHIEVEMENTS]: 'Achievements',
    [PanelType.SIGNALS]: 'Signals',
    [PanelType.COMBAT_LOGS]: 'Combat Logs',
    [PanelType.COMPOSE_MAIL]: 'Compose Message',
    [PanelType.CHAT]: 'Global Chat',
    [PanelType.MARKET]: 'Market',
    [PanelType.FLEETS]: 'Fleet Command',
    [PanelType.PLANET_INTERACTION]: 'Planet Actions',
  }
  
  return titles[panel.type] || 'Panel'
}

// Planet view with opening/closing animations - optimized
function PlanetViewWithAnimation({ 
  panel, 
  onClose, 
  onMinimize, 
  onMaximize,
  onContentClose 
}: { 
  panel: any
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onContentClose: () => void
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  
  // Trigger opening animation on mount with proper timing
  useEffect(() => {
    // Use requestAnimationFrame for smoother animation start
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(false)
      })
    })
  }, [])
  
  const handleClose = () => {
    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 400) // Match animation duration
  }

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        "sliding-panel-container fixed inset-0 z-40 transition-opacity ease-out",
        isClosing ? "opacity-0" : isOpening ? "opacity-0" : "opacity-100"
      )}
      style={{ 
        transitionDuration: '400ms',
        zIndex: panel.zIndex - 1,
        pointerEvents: isClosing ? 'none' : 'auto'
      }}
    >
      {/* Full screen backdrop for split layout */}
      <div 
        className={cn(
          "sliding-panel-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity ease-out",
          isClosing ? "opacity-0" : isOpening ? "opacity-0" : "opacity-100"
        )}
        style={{ transitionDuration: '400ms' }}
        onClick={handleClose} 
      />
      
      <div
        className={cn(
          "sliding-panel-content fixed left-0 top-0 h-full w-[50%] flex items-center justify-center pointer-events-none transition-all ease-out",
          isClosing 
            ? "opacity-0 scale-95" 
            : isOpening 
            ? "opacity-0 scale-95" 
            : "opacity-100 scale-100"
        )}
        style={{
          transform: isClosing || isOpening 
            ? 'scale(0.95) translateZ(0)' 
            : 'scale(1) translateZ(0)',
          transitionDuration: '400ms'
        }}
      >
        <PlanetImageDisplay
          planetId={panel.data?.planetId}
        />
      </div>
      <div 
        className={cn(
          "sliding-panel-container fixed right-0 top-0 h-full w-[50%] pointer-events-none transition-all ease-out",
          isClosing 
            ? "opacity-0" 
            : isOpening 
            ? "opacity-0" 
            : "opacity-100"
        )}
        style={{
          transform: isClosing || isOpening 
            ? 'translate3d(100%, 0, 0)' 
            : 'translate3d(0, 0, 0)',
          transitionDuration: '400ms'
        }}
      >
        <SlidingPanel
          isOpen={true}
          onClose={handleClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          title={getPanelTitle(panel)}
          size={PanelSize.FULL_HEIGHT}
          panelState={panel.state}
          zIndex={panel.zIndex}
          className="pointer-events-auto"
          hideBackdrop={true}
        >
          <PanelContent panel={panel} onClose={onContentClose} />
        </SlidingPanel>
      </div>
    </div>
  )
}

// Render panel content based on type
function PanelContent({ panel, onClose }: { panel: any; onClose: () => void }) {
  // Get planet ID from route params if available, otherwise use first planet or fallback
  const params = useParams()
  const { data: meData } = useGetMeQuery()
  const planets = (meData?.planets || []) as any[]
  const firstPlanetId = planets?.length > 0 ? planets[0]?.id : 1
  const planetId = panel.data?.planetId || (params?.id && Number(params.id)) || firstPlanetId
  
  switch (panel.type) {
    case PanelType.PLANET_VIEW:
      // Check if we should show full detail view (when opened from map) or console view
      if (panel.data?.showDetailView) {
        return <PlanetDetailPanel planetId={panel.data?.planetId || planetId} onClose={onClose} />
      }
      return <PlanetConsolePanel planetId={panel.data?.planetId || planetId} />
    
    case PanelType.TECH_TREE_FACILITIES:
      return <FacilityTechTree planetId={planetId} />
    
    case PanelType.TECH_TREE_SHIPS:
      return <ShipTechTree planetId={planetId} />
    
    case PanelType.TECH_TREE_DEFENSES:
      return <DefenseTechTree planetId={planetId} />
    
    case PanelType.TECH_TREE_RESEARCH:
      return <ResearchTechTree planetId={planetId} />
    
    case PanelType.BUILD_DETAIL:
      return (
        <BuildDetailPanel
          type={panel.data?.type}
          slug={panel.data?.slug}
          planetId={planetId}
        />
      )
    
    case PanelType.RESEARCH_DETAIL:
      return (
        <ResearchDetailPanel
          slug={panel.data?.slug}
          planetId={planetId}
        />
      )
    
    case PanelType.FLEET_COMMAND:
      return <FleetCommandPanel planetId={panel.data?.planetId} destinationPlanet={panel.data?.destinationPlanet} />
    
    case PanelType.GALAXY_MAP:
      return <UniverseMap />
    
    case PanelType.CONSTRUCTION_QUEUE:
      return <ConstructionQueue planetId={planetId} />
    
    case PanelType.MESSAGING:
      return <MessagingPage />
    
    case PanelType.NOTIFICATIONS:
      return <NotificationTrayPanel />
    
    case PanelType.RANKINGS:
      return <RankingsPage />
    
    case PanelType.SETTINGS:
      return <SettingsPage />
    
    case PanelType.POLITICS:
      return <PoliticsPage />
    
    case PanelType.CREATE_ALLIANCE_REQUEST:
      return <CreateAllianceRequestForm onSuccess={onClose} onCancel={onClose} />
    
    case PanelType.QUANTUM_CREDITS:
      return <QuantumCreditsPanel />
    
    case PanelType.BOOSTERS:
      return <BoostersPanel />
    
    case PanelType.ACHIEVEMENTS:
      return <AchievementsPanel />
    
    case PanelType.SIGNALS:
      return <SignalsPage />
    
    case PanelType.COMBAT_LOGS:
      return <CombatLogsPage />
    
    case PanelType.COMPOSE_MAIL:
      return (
        <ComposeMailPanel 
          replyToMail={panel.data?.replyToMail}
          onSuccess={() => onClose()}
        />
      )
    
    case PanelType.CHAT:
      return <ChatPanel />
    
    case PanelType.MARKET:
      return <MarketPanel />
    
    case PanelType.FLEETS:
      return <FleetsPanel />
    
    case PanelType.PLANET_INTERACTION:
      // Require planet object to be explicitly provided
      const interactionPlanet = panel.data?.planet
      
      if (!interactionPlanet) {
        console.error('[PanelManager] PLANET_INTERACTION: No planet in panel.data', panel.data)
        return (
          <div className="text-center py-12 p-6">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-destructive mb-2">Invalid Planet</h2>
            <p className="text-muted-foreground mb-6">
              No planet data provided. Panel data: {JSON.stringify(panel.data)}
            </p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        )
      }
      return <PlanetInteractionPanel planet={interactionPlanet} onClose={onClose} />
    
    default:
      return <div>Panel content not implemented yet</div>
  }
}

export function PanelManager() {
  const dispatch = useAppDispatch()
  const { panels, backdropVisible } = useAppSelector(state => state.panel)

  const handleClose = useCallback((panelId: string) => {
    dispatch(closePanel(panelId))
  }, [dispatch])

  const handleMinimize = useCallback((panelId: string) => {
    dispatch(minimizePanel(panelId))
  }, [dispatch])

  const handleMaximize = useCallback((panelId: string) => {
    dispatch(maximizePanel(panelId))
  }, [dispatch])

  // Render panels from state
  const minimizedPanels = panels.filter(p => p.state === PanelState.MINIMIZED)
  const normalPanels = panels.filter(p => p.state !== PanelState.MINIMIZED)

  return (
    <>
      {/* Normal open panels */}
      {normalPanels.map((panel) => {
        // Special handling for PLANET_VIEW with split layout
        if (panel.type === PanelType.PLANET_VIEW && panel.size === PanelSize.FULL_HEIGHT) {
          return (
            <PlanetViewWithAnimation 
              key={panel.id}
              panel={panel}
              onClose={() => handleClose(panel.id)}
              onMinimize={() => handleMinimize(panel.id)}
              onMaximize={() => handleMaximize(panel.id)}
              onContentClose={() => handleClose(panel.id)}
            />
          )
        }

        return (
          <SlidingPanel
            key={panel.id}
            isOpen={true}
            onClose={() => handleClose(panel.id)}
            onMinimize={() => handleMinimize(panel.id)}
            onMaximize={() => handleMaximize(panel.id)}
            title={getPanelTitle(panel)}
            size={panel.size}
            panelState={panel.state}
            zIndex={panel.zIndex}
          >
            <PanelContent panel={panel} onClose={() => handleClose(panel.id)} />
          </SlidingPanel>
        )
      })}
      
      {/* Minimized panels as tabs at bottom */}
      {minimizedPanels.length > 0 && (
        <div className="fixed bottom-0 left-16 right-0 z-30 flex items-end gap-1 pl-4 pb-0 pointer-events-none">
          {minimizedPanels.map((panel, index) => (
            <div
              key={panel.id}
              className="relative pointer-events-auto cursor-pointer group"
              style={{ zIndex: panel.zIndex }}
            >
              <button
                onClick={() => handleMaximize(panel.id)}
                className="panel-glass border-t border-l border-r px-4 py-2 text-sm font-semibold transition-all hover:bg-muted/20 hover:border-cyan/50 whitespace-nowrap rounded-t-lg"
              >
                {getPanelTitle(panel)}
              </button>
              <button
                onClick={() => handleClose(panel.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border hover:bg-red-500/20 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-auto"
                style={{ zIndex: panel.zIndex + 1 }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// Helper hook for panel operations
export function usePanel() {
  const dispatch = useAppDispatch()
  const { panels, backdropVisible } = useAppSelector(state => state.panel)

  return {
    panels,
    backdropVisible,
    closePanel: (id: string) => dispatch(closePanel(id)),
    openPanel: (type: PanelType, size?: PanelSize, data?: any) => 
      dispatch(openPanelAction({ type, size, data })),
    minimizePanel: (id: string) => dispatch(minimizePanel(id)),
    maximizePanel: (id: string) => dispatch(maximizePanel(id)),
    bringToFront: (id: string) => dispatch(bringToFront(id)),
    closeAllPanels: () => dispatch(closeAllPanelsAction()),
    closePanelsByType: (type: PanelType) => 
      dispatch(closePanelsByTypeAction(type)),
  }
}

