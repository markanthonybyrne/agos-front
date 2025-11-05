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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { path: '/holopad', label: 'Holopad', icon: LayoutDashboard },
  { path: '/map', label: 'Universe Map', icon: Globe },
  { path: '/planets', label: 'Planets', icon: Building2 },
  { path: '/fleets', label: 'Fleets', icon: Rocket },
  { path: '/combat', label: 'Battle Reports', icon: Sword },
  { path: '/signals', label: 'Signals', icon: Scan },
  { path: '/tech-tree', label: 'Tech Tree', icon: GitBranch },
  { path: '/alliances', label: 'Politics', icon: Users },
  { path: '/mail', label: 'Mail', icon: Mail },
  { path: '/rankings', label: 'Rankings', icon: Trophy },
  { path: '/achievements', label: 'Achievements', icon: Award },
  { path: '/settings', label: 'Settings', icon: Settings },
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
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const showBadge = item.path === '/mail' && unreadCount > 0
            const isActive = location.pathname === item.path || 
                           (item.path === '/fleets' && location.pathname.startsWith('/fleets')) ||
                           (item.path === '/achievements' && location.pathname === '/achievements')
            
            // Special handling for fleets - open panel instead of navigating
            if (item.path === '/fleets') {
              return (
                <button
                  key={item.path}
                  onClick={() => openPanel(PanelType.FLEETS, PanelSize.LARGE)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative w-full text-left',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    !sidebarOpen && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </button>
              )
            }
            
            // Special handling for achievements - open panel instead of navigating
            if (item.path === '/achievements') {
              return (
                <button
                  key={item.path}
                  onClick={() => openPanel(PanelType.ACHIEVEMENTS, PanelSize.MEDIUM)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative w-full text-left',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    !sidebarOpen && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </button>
              )
            }
            
            return (
              <NavLink
                key={item.path}
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
          })}
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

