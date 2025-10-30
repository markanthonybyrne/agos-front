import { NavLink } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useAppDispatch } from '@/app/hooks'
import { toggleSidebar } from '@/app/slices/uiSlice'
import { cn } from '@/lib/utils'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { path: '/holopad', label: 'Holopad', icon: LayoutDashboard },
  { path: '/map', label: 'Universe Map', icon: Globe },
  { path: '/planets', label: 'Planets', icon: Building2 },
  { path: '/fleets', label: 'Fleets', icon: Rocket },
  { path: '/signals', label: 'Signals', icon: Scan },
  { path: '/alliances', label: 'Politics', icon: Users },
  { path: '/mail', label: 'Mail', icon: Mail },
  { path: '/rankings', label: 'Rankings', icon: Trophy },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen)
  const dispatch = useAppDispatch()
  const { unreadCount } = useUnreadMailCount()

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
        </nav>
      </div>
    </aside>
  )
}

