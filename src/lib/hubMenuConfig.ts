import { LucideIcon } from 'lucide-react'
import {
  Award,
  Bell,
  Building2,
  Coins,
  Gem,
  GitBranch,
  Globe,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquare,
  Rocket,
  Scan,
  Settings,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

export interface SubMenuItem {
  id: string
  label: string
  panelType?: PanelType
  panelSize?: PanelSize
  panelData?: any
  subMenuItems?: SubMenuItem[] // Support nested submenus
  onClick?: () => void
  navigateTo?: string // Navigation path
  isDynamic?: boolean // If true, this item will be populated dynamically
}

export interface MainMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  panelType?: PanelType
  panelSize?: PanelSize
  panelData?: any
  subMenuItems?: SubMenuItem[]
  onClick?: () => void
  navigateTo?: string // Navigation path (e.g., '/map')
}

export interface HubCategory {
  id: string
  label: string
  icon: LucideIcon
  mainMenuItems: MainMenuItem[]
}

export const hubMenuConfig: HubCategory[] = [
  {
    id: 'command',
    label: 'Command Center',
    icon: Bell,
    mainMenuItems: [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        panelType: PanelType.NOTIFICATIONS,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: Mail,
        panelType: PanelType.MESSAGING,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'chat',
        label: 'Global Chat',
        icon: MessageSquare,
        panelType: PanelType.CHAT,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        panelType: PanelType.SETTINGS,
        panelSize: PanelSize.LARGE,
      },
    ],
  },
  {
    id: 'stellar',
    label: 'Stellar Operations',
    icon: Globe,
    mainMenuItems: [
      {
        id: 'galaxy-map',
        label: 'Galaxy Map',
        icon: Globe,
        navigateTo: '/map',
      },
      {
        id: 'fleet-command',
        label: 'Fleet Command',
        icon: Rocket,
        panelType: PanelType.FLEET_COMMAND,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'signals',
        label: 'Signals & Probes',
        icon: Scan,
        panelType: PanelType.SIGNALS,
        panelSize: PanelSize.LARGE,
      },
      {
        id: 'holopad',
        label: 'Holopad Layout',
        icon: LayoutDashboard,
        panelType: PanelType.HOLOPAD,
        panelSize: PanelSize.XLARGE,
      },
    ],
  },
  {
    id: 'colonies',
    label: 'Colonies & Industry',
    icon: Building2,
    mainMenuItems: [
      {
        id: 'planets',
        label: 'Planets & Colonies',
        icon: Building2,
        navigateTo: '/planets',
        subMenuItems: [
          {
            id: 'planets-list',
            label: 'Your Planets',
            isDynamic: true,
          },
        ],
      },
      {
        id: 'construction',
        label: 'Construction Queue',
        icon: ListChecks,
        panelType: PanelType.CONSTRUCTION_QUEUE,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'politics',
        label: 'Politics & Alliances',
        icon: Users,
        panelType: PanelType.POLITICS,
        panelSize: PanelSize.XLARGE,
      },
    ],
  },
  {
    id: 'research',
    label: 'Research & Engineering',
    icon: GitBranch,
    mainMenuItems: [
      {
        id: 'tech-tree',
        label: 'Tech Encyclopaedia',
        icon: GitBranch,
        navigateTo: '/tech-tree',
      },
      {
        id: 'boosters',
        label: 'Boosters',
        icon: Zap,
        panelType: PanelType.BOOSTERS,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'achievements',
        label: 'Achievements',
        icon: Award,
        panelType: PanelType.ACHIEVEMENTS,
        panelSize: PanelSize.MEDIUM,
      },
    ],
  },
  {
    id: 'economy',
    label: 'Economy & Diplomacy',
    icon: Coins,
    mainMenuItems: [
      {
        id: 'market',
        label: 'Galactic Market',
        icon: Coins,
        panelType: PanelType.MARKET,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'quantum-credits',
        label: 'Quantum Credits',
        icon: Gem,
        panelType: PanelType.QUANTUM_CREDITS,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'rankings',
        label: 'Rankings',
        icon: Trophy,
        panelType: PanelType.RANKINGS,
        panelSize: PanelSize.XLARGE,
      },
    ],
  },
  {
    id: 'fleet',
    label: 'Fleet & Combat',
    icon: Rocket,
    mainMenuItems: [
      {
        id: 'fleet-overview',
        label: 'Fleet Overview',
        icon: Rocket,
        panelType: PanelType.FLEETS,
        panelSize: PanelSize.LARGE,
      },
      {
        id: 'combat-logs',
        label: 'Combat Logs',
        icon: Sword,
        panelType: PanelType.COMBAT_LOGS,
        panelSize: PanelSize.LARGE,
      },
      {
        id: 'battle-reports',
        label: 'Battle Reports',
        icon: Target,
        navigateTo: '/combat',
      },
    ],
  },
]

