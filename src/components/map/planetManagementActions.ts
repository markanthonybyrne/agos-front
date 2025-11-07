import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { Planet } from '@/types/api.types'
import {
  FlaskConical,
  LucideIcon,
  Send,
  Settings,
  Shield,
  Ship
} from 'lucide-react'

export type PlanetActionAccent = 'cyan' | 'green' | 'red' | 'purple'

export type OpenPanelHandler = (
  type: PanelType,
  size?: PanelSize,
  data?: any
) => void

export interface PlanetManagementAction {
  id: string
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  accent: PlanetActionAccent
  onClick: () => void
}

export function createPlanetManagementActions(
  planet: Planet,
  openPanel: OpenPanelHandler
): PlanetManagementAction[] {
  return [
    {
      id: 'facilities',
      label: 'Tech Tree - Facilities',
      shortLabel: 'Facilities',
      description: 'Manage and research facility technologies',
      icon: Settings,
      accent: 'green',
      onClick: () =>
        openPanel(PanelType.TECH_TREE_FACILITIES, PanelSize.XLARGE, {
          planet
        })
    },
    {
      id: 'ships',
      label: 'Tech Tree - Ships',
      shortLabel: 'Ships',
      description: 'Research and unlock ship technologies',
      icon: Ship,
      accent: 'cyan',
      onClick: () =>
        openPanel(PanelType.TECH_TREE_SHIPS, PanelSize.XLARGE, {
          planet
        })
    },
    {
      id: 'defenses',
      label: 'Tech Tree - Defenses',
      shortLabel: 'Defenses',
      description: 'Research defensive technologies',
      icon: Shield,
      accent: 'red',
      onClick: () =>
        openPanel(PanelType.TECH_TREE_DEFENSES, PanelSize.XLARGE, {
          planet
        })
    },
    {
      id: 'research',
      label: 'Tech Tree - Research',
      shortLabel: 'Research',
      description: 'Advanced research and development',
      icon: FlaskConical,
      accent: 'green',
      onClick: () =>
        openPanel(PanelType.TECH_TREE_RESEARCH, PanelSize.XLARGE, {
          planet
        })
    },
    {
      id: 'fleet',
      label: 'Fleet Command',
      shortLabel: 'Fleet Command',
      description: 'Manage fleets and send ships',
      icon: Send,
      accent: 'cyan',
      onClick: () =>
        openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE, {
          destinationPlanet: planet
        })
    }
  ]
}


