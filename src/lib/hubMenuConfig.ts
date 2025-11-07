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
  Radio,
  Globe,
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
    id: 'management',
    label: 'Management',
    icon: Menu,
    mainMenuItems: [
      {
        id: 'holopad',
        label: 'Holopad',
        icon: Radio,
        panelType: PanelType.HOLOPAD,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'planets',
        label: 'Planets',
        icon: Building2,
        navigateTo: '/planets',
        subMenuItems: [
          {
            id: 'planets-list',
            label: 'List of Planets',
            isDynamic: true, // This will be populated dynamically with actual planets
          },
          {
            id: 'research',
            label: 'Research',
            panelType: PanelType.TECH_TREE_RESEARCH,
            panelSize: PanelSize.XLARGE,
          },
        ],
      },
      {
        id: 'politics',
        label: 'Politics',
        icon: Shield,
        panelType: PanelType.POLITICS,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'social',
        label: 'Social',
        icon: MessageSquare,
        panelType: PanelType.CHAT,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'mail',
        label: 'Interstellar Mail',
        icon: Mail,
        panelType: PanelType.MESSAGING,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'market',
        label: 'Market',
        icon: Coins,
        panelType: PanelType.MARKET,
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
    id: 'inventory',
    label: 'Inventory',
    icon: Box,
    mainMenuItems: [
      {
        id: 'facilities',
        label: 'Facilities',
        icon: Factory,
        panelType: PanelType.TECH_TREE_FACILITIES,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'defenses',
        label: 'Defenses',
        icon: Shield,
        panelType: PanelType.TECH_TREE_DEFENSES,
        panelSize: PanelSize.XLARGE,
      },
      {
        id: 'ships',
        label: 'Ships',
        icon: Ship,
        panelType: PanelType.TECH_TREE_SHIPS,
        panelSize: PanelSize.XLARGE,
      },
    ],
  },
  {
    id: 'fleets',
    label: 'Fleets',
    icon: Rocket,
    mainMenuItems: [
      {
        id: 'fleet-command',
        label: 'Fleet Command',
        icon: Send,
        navigateTo: '/fleets',
      },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: User,
    mainMenuItems: [
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
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        panelType: PanelType.SETTINGS,
        panelSize: PanelSize.LARGE,
      },
    ],
  },
]

