import React, { useState, useCallback } from 'react'
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu'
import { useContextMenu } from '@/hooks/useContextMenu'
import { useWindow } from '@/components/common/WindowManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Planet } from '@/types/api.types'
import { formatCoordinate, getPlanetXY } from '@/lib/coordinates'
import { 
  Eye, 
  Ship, 
  Globe, 
  MapPin, 
  Search,
  ArrowRight,
  Target,
  Users,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface MapContextMenuProviderProps {
  children: React.ReactNode
}

export function MapContextMenuProvider({ children }: MapContextMenuProviderProps) {
  const { openPanel } = useWindow()
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  // Planet context menu
  const planetContextMenu = useContextMenu({
    items: selectedPlanet
      ? getPlanetContextMenuItems(selectedPlanet, openPanel, navigate, empire?.id)
      : [],
    enabled: !!selectedPlanet,
  })

  // Handle planet right-click
  const handlePlanetContextMenu = useCallback(
    (e: React.MouseEvent, planet: Planet) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedPlanet(planet)
      setMenuPosition({ x: e.clientX, y: e.clientY })
      planetContextMenu.handleContextMenu(e)
    },
    [planetContextMenu]
  )

  // Map background context menu
  const mapContextMenu = useContextMenu({
    items: getMapContextMenuItems(openPanel, navigate),
    enabled: true,
  })

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClick = () => {
      planetContextMenu.closeMenu()
      mapContextMenu.closeMenu()
      setSelectedPlanet(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [planetContextMenu, mapContextMenu])

  return (
    <>
      {children}
      {/* Planet context menu */}
      {planetContextMenu.isOpen && selectedPlanet && (
        <ContextMenu
          items={planetContextMenu.items}
          position={menuPosition}
          onClose={() => {
            planetContextMenu.closeMenu()
            setSelectedPlanet(null)
          }}
        />
      )}
      {/* Map background context menu */}
      {mapContextMenu.isOpen && (
        <ContextMenu
          items={mapContextMenu.items}
          position={mapContextMenu.position}
          onClose={mapContextMenu.closeMenu}
        />
      )}
    </>
  )
}

// Helper functions for context menu items
function getPlanetContextMenuItems(
  planet: Planet,
  openPanel: (type: PanelType, size?: PanelSize, data?: any) => void,
  navigate: (path: string) => void,
  empireId?: number
): ContextMenuItem[] {
  const isOwned = planet.owner_empire_id === empireId
  const hasOwner = !!planet.owner_empire_id

  const items: ContextMenuItem[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: () => {
        openPanel(PanelType.PLANET_VIEW, PanelSize.MEDIUM, {
          planetId: planet.id,
          showDetailView: true,
        })
      },
    },
    {
      label: 'View on Map',
      icon: MapPin,
      onClick: () => {
        navigate(`/map`)
        const xy = getPlanetXY(planet)
        if (xy) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('map:centerOn', {
                detail: { x: xy.x, y: xy.y, zoom: 0.95 },
              })
            )
          }, 250)
        } else {
          toast.warning('We could not determine this planet’s exact position to center the map.')
        }
      },
    },
    { label: '', icon: undefined, onClick: () => {}, separator: true },
  ]

  if (!hasOwner) {
    items.push({
      label: 'Colonize',
      icon: Globe,
      onClick: () => {
        openPanel(PanelType.PLANET_INTERACTION, PanelSize.MEDIUM, {
          planet,
        })
      },
    })
  }

  items.push({
    label: 'Send Fleet',
    icon: Ship,
    onClick: () => {
      openPanel(PanelType.FLEET_COMMAND, PanelSize.MEDIUM, {
        destinationPlanet: planet.id,
      })
    },
  })

  items.push({
    label: 'Scan Planet',
    icon: Search,
    onClick: () => {
      const coordinate = formatCoordinate(planet.coordinate)
      if (!coordinate || coordinate === 'Invalid coordinate') {
        toast.error('Unable to prefill scan target for this planet.')
        return
      }
      openPanel(PanelType.SIGNALS, PanelSize.LARGE, {
        initialTarget: {
          coordinate,
          type: 'planetary',
        },
      })
    },
  })

  if (isOwned) {
    items.push({ label: '', icon: undefined, onClick: () => {}, separator: true })
    items.push({
      label: 'Manage Planet',
      icon: Target,
      onClick: () => {
        navigate(`/planets/${planet.id}`)
      },
    })
  }

  return items
}

function getMapContextMenuItems(
  openPanel: (type: PanelType, size?: PanelSize, data?: any) => void,
  navigate: (path: string) => void
): ContextMenuItem[] {
  return [
    {
      label: 'View Galaxy Map',
      icon: Globe,
      onClick: () => {
        navigate('/map')
      },
    },
    {
      label: 'My Planets',
      icon: MapPin,
      onClick: () => {
        navigate('/planets')
      },
    },
    { label: '', icon: undefined, onClick: () => {}, separator: true },
    {
      label: 'Fleet Management',
      icon: Ship,
      onClick: () => {
        openPanel(PanelType.FLEETS, PanelSize.LARGE)
      },
    },
    {
      label: 'Alliances',
      icon: Users,
      onClick: () => {
        openPanel(PanelType.POLITICS, PanelSize.LARGE)
      },
    },
    {
      label: 'Messages',
      icon: FileText,
      onClick: () => {
        openPanel(PanelType.MESSAGING, PanelSize.LARGE)
      },
    },
  ]
}

// Export hook for using context menu in map components
export function usePlanetContextMenu(planet: Planet | null) {
  const { openPanel } = useWindow()
  const navigate = useNavigate()
  const { empire } = useAuth()
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const items = React.useMemo(
    () =>
      planet
        ? getPlanetContextMenuItems(planet, openPanel, navigate, empire?.id)
        : [],
    [planet, openPanel, navigate, empire?.id]
  )

  const contextMenu = useContextMenu({
    items,
    enabled: !!planet,
  })

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (planet) {
        setMenuPosition({ x: e.clientX, y: e.clientY })
        contextMenu.handleContextMenu(e)
      }
    },
    [planet, contextMenu]
  )

  return {
    handleContextMenu,
    isOpen: contextMenu.isOpen,
    position: menuPosition,
    closeMenu: contextMenu.closeMenu,
  }
}

