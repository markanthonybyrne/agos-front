import { 
  Settings, 
  Map, 
  Bell,
  X,
  Building2,
  Rocket,
  Mail,
  Trophy,
  LogOut,
  ChevronDown,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { logout } from '@/app/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { getUserAvatarUrl } from '@/lib/avatar'

interface HUDButton {
  id: string
  icon: typeof Settings
  label: string
  panelType?: PanelType
  panelSize?: PanelSize
  route?: string // For navigation to actual pages
  badge?: number
  color?: string
}

const HUD_BUTTONS: HUDButton[] = [
  {
    id: 'planets',
    icon: Building2,
    label: 'Planets',
    route: '/planets',
    color: 'text-orange-400',
  },
  {
    id: 'map',
    icon: Map,
    label: 'Map',
    route: '/map',
    color: 'text-space-blue',
  },
  {
    id: 'fleets',
    icon: Rocket,
    label: 'Fleets',
    panelType: PanelType.FLEET_COMMAND,
    panelSize: PanelSize.XLARGE,
    color: 'text-blue-400',
  },
  {
    id: 'mail',
    icon: Mail,
    label: 'Mail',
    panelType: PanelType.MESSAGING,
    panelSize: PanelSize.XLARGE,
    color: 'text-yellow-400',
  },
  {
    id: 'rankings',
    icon: Trophy,
    label: 'Rankings',
    panelType: PanelType.RANKINGS,
    panelSize: PanelSize.XLARGE,
    color: 'text-amber-400',
  },
  {
    id: 'politics',
    icon: Shield,
    label: 'Politics',
    panelType: PanelType.POLITICS,
    panelSize: PanelSize.XLARGE,
    color: 'text-purple-400',
  },
]

interface PersistentHUDProps {
  className?: string
  showClose?: boolean
}

export function PersistentHUD({ className, showClose = false }: PersistentHUDProps) {
  const { openPanel, backdropVisible, closeAllPanels } = usePanel()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const notificationsCount = useAppSelector(state => 
    state.notifications.notifications.filter(n => !n.isRead).length
  )
  const { data } = useGetMeQuery()

  const handleButtonClick = (button: HUDButton) => {
    if (button.route) {
      navigate(button.route)
    } else if (button.panelType && button.panelSize) {
      openPanel(button.panelType, button.panelSize)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className={cn(
      "fixed top-0 left-20 right-0 z-30 transition-all duration-300",
      backdropVisible && "bg-background/80 backdrop-blur-md border-b border-border/50",
      className
    )}>
      <div className="w-full px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 mr-4">
            <img 
              src="/assets/images/logo.png" 
              alt="War For Galaxy" 
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* HUD Buttons - Centered */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 justify-center">
            {HUD_BUTTONS.map((button) => {
              const Icon = button.icon
              return (
                <Button
                  key={button.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleButtonClick(button)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-muted/50 hover:scale-105",
                    "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
                    button.color
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wide hidden md:inline">
                    {button.label}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPanel(PanelType.NOTIFICATIONS, PanelSize.MEDIUM)}
              className="relative"
            >
              <Bell className="w-4 h-4" />
              {notificationsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {notificationsCount > 9 ? '9+' : notificationsCount}
                </Badge>
              )}
            </Button>

            {/* User Avatar Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 p-0">
                  <Avatar
                    src={getUserAvatarUrl(data?.user)}
                    name={data?.user?.username || 'User'}
                    size="md"
                    className="border-2 border-cyan/50"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 panel-glass">
                <DropdownMenuItem onClick={() => openPanel(PanelType.SETTINGS, PanelSize.LARGE)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close all panels */}
            {showClose && backdropVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => closeAllPanels()}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

