import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { 
  selectAllPanels, 
  selectNormalPanels, 
  selectMinimizedPanels, 
  selectBackdropVisible 
} from '@/app/slices/panelSelectors'
import {
  openPanel as openPanelAction,
  closePanel,
  minimizePanel,
  maximizePanel,
  bringToFront,
  updatePanelPosition,
  updatePanelDimensions,
  closeAllPanels as closeAllPanelsAction,
  closePanelsByType as closePanelsByTypeAction,
} from '@/app/slices/panelSlice'
import { PanelSize, PanelType, PanelState, Panel } from '@/app/slices/panelSlice'
import { DesktopWindow } from './DesktopWindow'
import React, { useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getDefaultWindowDimensions,
  getDefaultWindowPosition,
} from '@/lib/windowUtils'
import { PanelContent } from './PanelManager'

// Get panel title helper function (reused from PanelManager)
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
    [PanelType.HOLOPAD]: 'Holopad',
  }

  return titles[panel.type] || 'Panel'
}

export const WindowManager = React.memo(function WindowManager() {
  const dispatch = useAppDispatch()
  const normalPanels = useAppSelector(selectNormalPanels)
  const minimizedPanels = useAppSelector(selectMinimizedPanels)
  const backdropVisible = useAppSelector(selectBackdropVisible)

  const handleClose = useCallback(
    (panelId: string) => {
      dispatch(closePanel(panelId))
    },
    [dispatch]
  )

  const handleMinimize = useCallback(
    (panelId: string) => {
      dispatch(minimizePanel(panelId))
    },
    [dispatch]
  )

  const handleMaximize = useCallback(
    (panelId: string) => {
      dispatch(maximizePanel(panelId))
    },
    [dispatch]
  )

  const handleBringToFront = useCallback(
    (panelId: string) => {
      dispatch(bringToFront(panelId))
    },
    [dispatch]
  )

  const handlePositionChange = useCallback(
    (panelId: string, position: { x: number; y: number }) => {
      dispatch(updatePanelPosition({ id: panelId, position }))
    },
    [dispatch]
  )

  const handleDimensionsChange = useCallback(
    (panelId: string, dimensions: { width: number; height: number }) => {
      dispatch(updatePanelDimensions({ id: panelId, dimensions }))
    },
    [dispatch]
  )

  return (
    <>
      {/* Normal open windows */}
      {normalPanels.map((panel) => {
        // Initialize position and dimensions if not set
        const dimensions =
          panel.dimensions ||
          getDefaultWindowDimensions(panel.size)
        const panelIndex = normalPanels.findIndex(p => p.id === panel.id)
        const position =
          panel.position ||
          getDefaultWindowPosition(dimensions, {
            x: (panelIndex % 3) * 30,
            y: (panelIndex % 3) * 30,
          })

        return (
          <DesktopWindow
            key={panel.id}
            id={panel.id}
            isOpen={true}
            onClose={() => handleClose(panel.id)}
            onMinimize={() => handleMinimize(panel.id)}
            onMaximize={() => handleMaximize(panel.id)}
            title={getPanelTitle(panel)}
            size={panel.size}
            panelState={panel.state}
            isMaximized={panel.isMaximized || false}
            position={position}
            dimensions={dimensions}
            onPositionChange={(pos) => handlePositionChange(panel.id, pos)}
            onDimensionsChange={(dims) =>
              handleDimensionsChange(panel.id, dims)
            }
            zIndex={panel.zIndex}
            persistPosition={true}
          >
            <div
              onClick={() => handleBringToFront(panel.id)}
              onMouseDown={() => handleBringToFront(panel.id)}
            >
              <PanelContent panel={panel} onClose={() => handleClose(panel.id)} />
            </div>
          </DesktopWindow>
        )
      })}

      {/* Minimized windows tray at bottom */}
      {minimizedPanels.length > 0 && (
        <div className="fixed bottom-0 left-16 right-0 z-[2000] flex items-end gap-1 pl-4 pb-0 pointer-events-none">
          {minimizedPanels.map((panel, index) => (
            <div
              key={panel.id}
              className="relative pointer-events-auto cursor-pointer group"
              style={{ zIndex: panel.zIndex }}
            >
              <button
                onClick={() => {
                  dispatch(maximizePanel(panel.id))
                  dispatch(bringToFront(panel.id))
                }}
                className={cn(
                  'panel-glass border-t border-l border-r border-cyan-500/30',
                  'px-4 py-2 text-sm font-semibold transition-all',
                  'hover:bg-cyan-500/20 hover:border-cyan-500/50',
                  'whitespace-nowrap rounded-none cut-corners',
                  'shadow-lg shadow-cyan-500/10'
                )}
              >
                {getPanelTitle(panel)}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose(panel.id)
                }}
                className={cn(
                  'absolute -top-1 -right-1 w-5 h-5 rounded-full',
                  'bg-background/90 border border-border hover:bg-red-500/20',
                  'hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100',
                  'flex items-center justify-center pointer-events-auto'
                )}
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
})

// Export helper hook for window operations
export function useWindow() {
  const dispatch = useAppDispatch()
  const panels = useAppSelector(selectAllPanels)
  const backdropVisible = useAppSelector(selectBackdropVisible)

  return {
    panels,
    backdropVisible,
    openPanel: (type: PanelType, size?: PanelSize, data?: any) =>
      dispatch(openPanelAction({ type, size, data })),
    closePanel: (id: string) => dispatch(closePanel(id)),
    minimizePanel: (id: string) => dispatch(minimizePanel(id)),
    maximizePanel: (id: string) => dispatch(maximizePanel(id)),
    bringToFront: (id: string) => dispatch(bringToFront(id)),
    closeAllPanels: () => dispatch(closeAllPanelsAction()),
    closePanelsByType: (type: PanelType) =>
      dispatch(closePanelsByTypeAction(type)),
    updatePosition: (id: string, position: { x: number; y: number }) =>
      dispatch(updatePanelPosition({ id, position })),
    updateDimensions: (
      id: string,
      dimensions: { width: number; height: number }
    ) => dispatch(updatePanelDimensions({ id, dimensions })),
  }
}

