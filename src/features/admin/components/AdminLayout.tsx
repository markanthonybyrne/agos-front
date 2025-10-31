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
} from 'lucide-react'

const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/empires', label: 'Empires', icon: Shield },
  { path: '/admin/planets', label: 'Planets', icon: Building2 },
  { path: '/admin/fleets', label: 'Fleets', icon: Rocket },
  { path: '/admin/alliances', label: 'Alliances', icon: UsersIcon },
  { path: '/admin/mail', label: 'Mail', icon: Mail },
  { path: '/admin/ticks', label: 'Ticks', icon: Clock },
  { path: '/admin/resources', label: 'Resources', icon: Coins },
  { path: '/admin/combats', label: 'Combats', icon: Sword },
]

interface AdminLayoutProps {
  children?: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading glow-cyan flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Admin Portal
          </h1>
          <p className="text-muted-foreground mt-1">Manage game entities and systems</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
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
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    'hover:text-foreground',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground'
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

