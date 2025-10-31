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
import { PanelSize, PanelType, PanelState } from '@/app/slices/panelSlice'
import { SlidingPanel } from './SlidingPanel'
import { useCallback } from 'react'
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
import { PlanetImageDisplay } from '@/components/planet/PlanetImageDisplay'
import { FleetsPage } from '@/features/fleets/FleetsPage'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { RankingsPage } from '@/features/rankings/RankingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useParams } from 'react-router-dom'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetPlanetQuery } from '@/api/endpoints/planetsApi'

// Render panel content based on type
function PanelContent({ panel }: { panel: any }) {
  // Get planet ID from route params if available, otherwise use first planet or fallback
  const params = useParams()
  const { data: meData } = useGetMeQuery()
  const planets = (meData?.planets || []) as any[]
  const firstPlanetId = planets?.length > 0 ? planets[0]?.id : 1
  const planetId = panel.data?.planetId || (params?.id && Number(params.id)) || firstPlanetId
  
  switch (panel.type) {
    case PanelType.PLANET_VIEW:
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
      return <FleetCommandPanel planetId={panel.data?.planetId} />
    
    case PanelType.GALAXY_MAP:
      return <UniverseMap />
    
    case PanelType.CONSTRUCTION_QUEUE:
      return <ConstructionQueue planetId={planetId} />
    
    case PanelType.MESSAGING:
      return <MessagingPage />
    
    case PanelType.NOTIFICATIONS:
      return <div>Notifications panel</div>
    
    case PanelType.RANKINGS:
      return <RankingsPage />
    
    case PanelType.SETTINGS:
      return <SettingsPage />
    
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
  return (
    <>
      {panels.map((panel) => {
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
          [PanelType.PLANET_VIEW]: 'Planet View',
          [PanelType.CONSTRUCTION_QUEUE]: 'Construction Queue',
          [PanelType.GALAXY_MAP]: 'Galaxy Map',
          [PanelType.MESSAGING]: 'Messages',
          [PanelType.NOTIFICATIONS]: 'Notifications',
          [PanelType.RANKINGS]: 'Rankings',
          [PanelType.SETTINGS]: 'Settings',
        }

        // Special handling for PLANET_VIEW with split layout
        if (panel.type === PanelType.PLANET_VIEW && panel.size === PanelSize.FULL_HEIGHT) {
          return (
            <div key={panel.id} className="fixed inset-0 z-40" style={{ zIndex: panel.zIndex - 1 }}>
              {/* Full screen backdrop for split layout */}
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => handleClose(panel.id)} />
              
              <PlanetImageDisplay
                planetId={panel.data?.planetId}
                className="fixed left-0 top-0 h-full w-[50%] flex items-center justify-center pointer-events-none"
              />
              <div className="fixed right-0 top-0 h-full w-[50%] pointer-events-none">
                <SlidingPanel
                  isOpen={true}
                  onClose={() => handleClose(panel.id)}
                  onMinimize={() => handleMinimize(panel.id)}
                  onMaximize={() => handleMaximize(panel.id)}
                  title={titles[panel.type] || 'Panel'}
                  size={PanelSize.FULL_HEIGHT}
                  panelState={panel.state}
                  zIndex={panel.zIndex}
                  className="pointer-events-auto"
                  hideBackdrop={true}
                >
                  <PanelContent panel={panel} />
                </SlidingPanel>
              </div>
            </div>
          )
        }

        return (
          <SlidingPanel
            key={panel.id}
            isOpen={true}
            onClose={() => handleClose(panel.id)}
            onMinimize={() => handleMinimize(panel.id)}
            onMaximize={() => handleMaximize(panel.id)}
            title={titles[panel.type] || 'Panel'}
            size={panel.size}
            panelState={panel.state}
            zIndex={panel.zIndex}
          >
            <PanelContent panel={panel} />
          </SlidingPanel>
        )
      })}
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

