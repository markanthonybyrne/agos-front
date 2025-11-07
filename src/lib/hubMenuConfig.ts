import { LucideIcon } from 'lucide-react'
import {
  Gem,
  TrendingUp,
  Factory,
  Box,
  User,
  Ship,
  Users,
  Wrench,
  Menu,
  Map,
  BookOpen,
  Scan,
  Sword,
  Award,
  Coins,
  Wallet,
  FileText,
  ListChecks,
  GitBranch,
  FlaskConical,
  Building2,
  Package,
  Rocket,
  Send,
  Shield,
  MessageSquare,
  Mail,
  Trophy,
  HelpCircle,
  Search,
  Bell,
  Settings,
} from 'lucide-react'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

export interface SubMenuItem {
  id: string
  label: string
  panelType?: PanelType
  panelSize?: PanelSize
  panelData?: any
  onClick?: () => void
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
    id: 'activities',
    label: 'Activities',
    icon: Gem,
    mainMenuItems: [
      {
        id: 'map',
        label: 'Map',
        icon: Map,
        navigateTo: '/map', // Navigate to /map instead of opening as panel
      },
      {
        id: 'journal',
        label: 'Journal',
        icon: BookOpen,
        subMenuItems: [
          {
            id: 'activity-log',
            label: 'Activity Log',
            panelType: PanelType.COMBAT_LOGS,
            panelSize: PanelSize.LARGE,
          },
          {
            id: 'combat-history',
            label: 'Combat History',
            panelType: PanelType.COMBAT_LOGS,
            panelSize: PanelSize.LARGE,
          },
        ],
      },
      {
        id: 'signals',
        label: 'Signals',
        icon: Scan,
        panelType: PanelType.SIGNALS,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'combat-logs',
        label: 'Combat Logs',
        icon: Sword,
        panelType: PanelType.COMBAT_LOGS,
        panelSize: PanelSize.LARGE,
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
    id: 'finance',
    label: 'Finance',
    icon: TrendingUp,
    mainMenuItems: [
      {
        id: 'market',
        label: 'Market',
        icon: Coins,
        panelType: PanelType.MARKET,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'quantum-credits',
        label: 'Quantum Credits',
        icon: Wallet,
        panelType: PanelType.QUANTUM_CREDITS,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: FileText,
        subMenuItems: [
          {
            id: 'view-all',
            label: 'View All',
            panelType: PanelType.MARKET,
            panelSize: PanelSize.LARGE,
            panelData: { view: 'transactions' },
          },
        ],
      },
    ],
  },
  {
    id: 'industry',
    label: 'Industry',
    icon: Factory,
    mainMenuItems: [
      {
        id: 'construction-queue',
        label: 'Construction Queue',
        icon: ListChecks,
        panelType: PanelType.CONSTRUCTION_QUEUE,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'tech-trees',
        label: 'Tech Trees',
        icon: GitBranch,
        subMenuItems: [
          {
            id: 'facilities',
            label: 'Facilities',
            panelType: PanelType.TECH_TREE_FACILITIES,
            panelSize: PanelSize.XLARGE,
          },
          {
            id: 'ships',
            label: 'Ships',
            panelType: PanelType.TECH_TREE_SHIPS,
            panelSize: PanelSize.XLARGE,
          },
          {
            id: 'defenses',
            label: 'Defenses',
            panelType: PanelType.TECH_TREE_DEFENSES,
            panelSize: PanelSize.XLARGE,
          },
          {
            id: 'research-tree',
            label: 'Research Tree',
            panelType: PanelType.TECH_TREE_RESEARCH,
            panelSize: PanelSize.XLARGE,
          },
        ],
      },
      {
        id: 'research',
        label: 'Research',
        icon: FlaskConical,
        subMenuItems: [
          {
            id: 'active-research',
            label: 'Active Research',
            panelType: PanelType.RESEARCH_DETAIL,
            panelSize: PanelSize.LARGE,
          },
        ],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Box,
    mainMenuItems: [
      {
        id: 'planets',
        label: 'Planets',
        icon: Building2,
        subMenuItems: [
          {
            id: 'my-planets',
            label: 'My Planets',
            panelType: PanelType.PLANET_VIEW,
            panelSize: PanelSize.LARGE,
          },
        ],
      },
      {
        id: 'fleet-assets',
        label: 'Fleet Assets',
        icon: Package,
        panelType: PanelType.FLEETS,
        panelSize: PanelSize.XLARGE,
      },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: User,
    mainMenuItems: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        panelType: PanelType.SETTINGS,
        panelSize: PanelSize.LARGE,
      },
      {
        id: 'achievements',
        label: 'Achievements',
        icon: Award,
        panelType: PanelType.ACHIEVEMENTS,
        panelSize: PanelSize.MEDIUM,
      },
      {
        id: 'boosters',
        label: 'Boosters',
        icon: Award,
        panelType: PanelType.BOOSTERS,
        panelSize: PanelSize.MEDIUM,
      },
    ],
  },
  {
    id: 'ship',
    label: 'Ship',
    icon: Ship,
    mainMenuItems: [
      {
        id: 'fleet-command',
        label: 'Fleet Command',
        icon: Send,
        panelType: PanelType.FLEET_COMMAND,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'active-fleets',
        label: 'Active Fleets',
        icon: Rocket,
        panelType: PanelType.FLEETS,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'ship-management',
        label: 'Ship Management',
        icon: Ship,
        subMenuItems: [
          {
            id: 'build-ships',
            label: 'Build Ships',
            panelType: PanelType.TECH_TREE_SHIPS,
            panelSize: PanelSize.XLARGE,
          },
        ],
      },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
    mainMenuItems: [
      {
        id: 'politics',
        label: 'Politics & Alliances',
        icon: Shield,
        panelType: PanelType.POLITICS,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'chat',
        label: 'Chat',
        icon: MessageSquare,
        panelType: PanelType.CHAT,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'mail',
        label: 'Mail',
        icon: Mail,
        panelType: PanelType.MESSAGING,
        panelSize: PanelSize.XLARGE,
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
    id: 'utilities',
    label: 'Utilities',
    icon: Wrench,
    mainMenuItems: [
      {
        id: 'help',
        label: 'Help',
        icon: HelpCircle,
        subMenuItems: [
          {
            id: 'documentation',
            label: 'Documentation',
            // No panel type - could navigate or open external link
          },
        ],
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        panelType: PanelType.NOTIFICATIONS,
        panelSize: PanelSize.MEDIUM,
      },
    ],
  },
]

