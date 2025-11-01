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
  Shield,
  Scan,
  Sword
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
import { useNavigate, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetQuantumCreditsQuery } from '@/api/endpoints/premiumApi'
import { BRAND } from '@/lib/brandImages'
import { getUserAvatarUrl } from '@/lib/avatar'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'

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
    id: 'signals',
    icon: Scan,
    label: 'Signals',
    panelType: PanelType.SIGNALS,
    panelSize: PanelSize.XLARGE,
    color: 'text-cyan-400',
  },
  {
    id: 'combat',
    icon: Sword,
    label: 'Battle Reports',
    panelType: PanelType.COMBAT_LOGS,
    panelSize: PanelSize.XLARGE,
    color: 'text-red-400',
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
  const location = useLocation()
  const notificationsCount = useAppSelector(state => 
    state.notifications.notifications.filter(n => !n.isRead).length
  )
  const { data } = useGetMeQuery()
  const { data: qcData } = useGetQuantumCreditsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute
  })
  const empire = useAppSelector((state) => state.auth.empire)

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
    <div className="fixed top-0 left-16 right-0 z-30">
      <div className="w-full px-4 py-2 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img 
            src={BRAND.logo} 
            alt="War For Galaxy" 
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* HUD Buttons - Tab style with glass background */}
        <div 
          className="panel-glass surface-gradient card-glow vignette border border-border/50"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
          }}
        >
          <div className="flex items-end gap-0">
            {HUD_BUTTONS.map((button) => {
              const Icon = button.icon
              const isActive = button.route ? location.pathname === button.route : false
              return (
                <button
                  key={button.id}
                  onClick={() => handleButtonClick(button)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 transition-all duration-200",
                    "uppercase text-xs font-semibold tracking-wide",
                    isActive
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  )}
                  style={isActive ? {
                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
                  } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span>{button.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* User Score */}
          {empire && (
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 panel-glass surface-gradient card-glow vignette border border-border/50 text-xs"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
              }}
            >
              <span className="text-muted-foreground">Score:</span>
              <span className="font-mono font-semibold text-cyan-400">
                {empire.score?.toLocaleString?.() || empire.score}
              </span>
            </div>
          )}

          {/* Quantum Credits */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPanel(PanelType.QUANTUM_CREDITS, PanelSize.MEDIUM)}
            className="relative flex items-center gap-2"
          >
            <img
              src={getQuantumCreditsImage()}
              alt="Quantum Credits"
              className="w-4 h-4"
            />
            <span className="font-mono text-cyan-400">
              {qcData?.balance ?? 0}
            </span>
          </Button>

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
  )
}

