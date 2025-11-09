import { NavLink, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useAppDispatch } from '@/app/hooks'
import { toggleSidebar } from '@/app/slices/uiSlice'
import { cn } from '@/lib/utils'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'
import { useIsAdmin } from '@/hooks/useAdminPermission'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import {
  Bell,
  MessageCircle,
  LayoutDashboard,
  Globe,
  Building2,
  Rocket,
  Scan,
  Users,
  Mail,
  Trophy,
  Settings,
  Menu,
  Sword,
  Shield,
  Award,
  GitBranch,
  Zap,
  Coins,
  Diamond,
  Ship,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type MenuRouteItem = {
  type: 'route'
  key: string
  label: string
  path: string
  icon: LucideIcon
}

type MenuPanelItem = {
  type: 'panel'
  key: string
  label: string
  panel: PanelType
  icon: LucideIcon
  size?: PanelSize
}

type MenuItem = MenuRouteItem | MenuPanelItem

const menuSections: Array<{ label: string; items: MenuItem[] }> = [
  {
    label: 'Command Center',
    items: [
      { type: 'panel', key: 'notifications', label: 'Notifications', panel: PanelType.NOTIFICATIONS, icon: Bell, size: PanelSize.MEDIUM },
      { type: 'route', key: 'messages', label: 'Messages', path: '/mail', icon: Mail },
      { type: 'panel', key: 'chat', label: 'Global Chat', panel: PanelType.CHAT, icon: MessageCircle, size: PanelSize.MEDIUM },
      { type: 'route', key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
  {
    label: 'Stellar Operations',
    items: [
      { type: 'route', key: 'map', label: 'Galaxy Map', path: '/map', icon: Globe },
      { type: 'panel', key: 'fleet-command', label: 'Fleet Command', panel: PanelType.FLEET_COMMAND, icon: Rocket, size: PanelSize.XLARGE },
      { type: 'route', key: 'signals', label: 'Signals & Probes', path: '/signals', icon: Scan },
    ],
  },
  {
    label: 'Colonies & Industry',
    items: [
      { type: 'route', key: 'planets', label: 'Planets & Colonies', path: '/planets', icon: Building2 },
      { type: 'route', key: 'holopad', label: 'Holopad Layout', path: '/holopad', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Research & Engineering',
    items: [
      { type: 'route', key: 'tech-tree', label: 'Tech Encyclopaedia', path: '/tech-tree', icon: GitBranch },
      { type: 'panel', key: 'boosters', label: 'Boosters', panel: PanelType.BOOSTERS, icon: Zap, size: PanelSize.MEDIUM },
      { type: 'panel', key: 'achievements', label: 'Achievements', panel: PanelType.ACHIEVEMENTS, icon: Award, size: PanelSize.MEDIUM },
    ],
  },
  {
    label: 'Economy & Diplomacy',
    items: [
      { type: 'panel', key: 'market', label: 'Galactic Market', panel: PanelType.MARKET, icon: Coins, size: PanelSize.XLARGE },
      { type: 'route', key: 'alliances', label: 'Politics & Alliances', path: '/alliances', icon: Users },
      { type: 'route', key: 'rankings', label: 'Rankings', path: '/rankings', icon: Trophy },
      { type: 'panel', key: 'quantum-credits', label: 'Quantum Credits', panel: PanelType.QUANTUM_CREDITS, icon: Diamond, size: PanelSize.MEDIUM },
    ],
  },
  {
    label: 'Fleet & Combat',
    items: [
      { type: 'panel', key: 'fleets', label: 'Fleet Overview', panel: PanelType.FLEETS, icon: Ship, size: PanelSize.LARGE },
      { type: 'panel', key: 'combat-logs', label: 'Combat Logs', panel: PanelType.COMBAT_LOGS, icon: Sword, size: PanelSize.LARGE },
      { type: 'route', key: 'battle-reports', label: 'Battle Reports', path: '/combat', icon: Target },
    ],
  },
]

const adminNavItem = { path: '/admin', label: 'Admin', icon: Shield }

export function Sidebar() {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)
  const dispatch = useAppDispatch()
  const { unreadCount } = useUnreadMailCount()
  const isAdmin = useIsAdmin()
  const { openPanel } = usePanel()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.35em] text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  if (item.type === 'route') {
                    const showBadge = item.path === '/mail' && unreadCount > 0
                    return (
                      <NavLink
                        key={item.key}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative',
                            'hover:bg-accent hover:text-accent-foreground',
                            isActive && 'bg-accent text-accent-foreground',
                            !sidebarOpen && 'justify-center'
                          )
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">{item.label}</span>}
                        {showBadge && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </NavLink>
                    )
                  }

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => openPanel(item.panel, item.size ?? PanelSize.MEDIUM)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                        !sidebarOpen && 'justify-center'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span className="text-sm">{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-border" />
              {(() => {
                const Icon = adminNavItem.icon
                return (
                  <NavLink
                    to={adminNavItem.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive && 'bg-accent text-accent-foreground',
                        !sidebarOpen && 'justify-center'
                      )
                    }
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
                    {sidebarOpen && <span className="text-sm font-semibold">{adminNavItem.label}</span>}
                  </NavLink>
                )
              })()}
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}

