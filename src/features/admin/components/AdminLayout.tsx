import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Rocket,
  Users as UsersIcon,
  Mail,
  Clock,
  Coins,
  Sword,
  Shield,
  Megaphone,
  MessageSquare,
  Gift,
  Zap,
  Beaker,
  TestTube,
  Settings,
} from 'lucide-react'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/empires', label: 'Empires', icon: Shield },
  { path: '/admin/planets', label: 'Planets', icon: Building2 },
  { path: '/admin/fleets', label: 'Fleets', icon: Rocket },
  { path: '/admin/alliances', label: 'Alliances', icon: UsersIcon },
  { path: '/admin/mail', label: 'Mail', icon: Mail },
  { path: '/admin/chat', label: 'Chat', icon: MessageSquare },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { path: '/admin/ticks', label: 'Ticks', icon: Clock },
  { path: '/admin/resources', label: 'Resources', icon: Coins },
  { path: '/admin/combats', label: 'Combats', icon: Sword },
  { path: '/admin/simulations', label: 'Simulations', icon: Beaker },
  { path: '/admin/tick-testing', label: 'Tick Testing', icon: TestTube },
  { path: '/admin/definitions', label: 'Game Definitions', icon: Settings },
  { path: '/admin/quantum-credits', label: 'Quantum Credits', icon: Gift },
  { path: '/admin/boosters', label: 'Boosters', icon: Zap },
]

interface AdminLayoutProps {
  children?: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="panel-glass border-border/50 rounded-lg p-2">
        <nav className="flex gap-1 overflow-x-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-md',
                    'hover:bg-primary/10 hover:text-cyan-400',
                    isActive
                      ? 'bg-primary/20 text-cyan-400 border border-cyan-400/30'
                      : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children || <Outlet />}</div>
    </div>
  )
}

