import { useEffect, useState } from 'react'
import {
  Bell,
  Mail,
  Globe,
  Building2,
  Rocket,
  Coins,
  Scan,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Award,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'
import { Avatar } from '@/components/common/Avatar'
import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/app/slices/authSlice'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { getUserAvatarUrl } from '@/lib/avatar'

interface QuickAccessSidebarProps {
  constructionCount?: number
}

export function QuickAccessSidebar({ constructionCount = 0 }: QuickAccessSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true) // Start collapsed by default
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const { unreadCount } = useUnreadMailCount()
  const dispatch = useAppDispatch()
  const { data } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  useEffect(() => {
    const handleOnboardingStep = (event: Event) => {
      const custom = event as CustomEvent<{ stepId?: string }>
      if (custom.detail?.stepId === 'quick-dock') {
        setIsCollapsed(false)
      }
    }
    window.addEventListener('astralus:onboarding-tour-step', handleOnboardingStep)
    return () => {
      window.removeEventListener('astralus:onboarding-tour-step', handleOnboardingStep)
    }
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <>
      {/* Collapsible Sidebar */}
      <div 
        className={cn(
          'fixed left-0 top-0 bottom-0 z-20 pointer-events-none transition-transform duration-300 ease-in-out',
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        )}
        style={{ width: '64px' }}
        data-onboarding-target="quick-dock"
      >
      {/* EVE-style vertical icon bar with glass effect */}
      <div className="w-full h-full flex flex-col items-center pt-4 pb-4 gap-2 panel-glass surface-gradient card-glow vignette border-r border-border/50 pointer-events-auto">
        
        {/* Avatar at top */}
        <div className="relative group pointer-events-auto z-10">
          <Avatar
            src={getUserAvatarUrl(data?.user)}
            name={data?.user?.username || 'User'}
            size="sm"
            className="border-2 border-cyan/50 w-12 h-12"
          />
        </div>

        {/* Notifications */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.NOTIFICATIONS, PanelSize.MEDIUM)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-border/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Notifications
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.MESSAGING, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Messages"
          >
            <Mail className="w-5 h-5 text-yellow-400" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-yellow-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Messages
            </div>
          </div>
        </div>

        {/* Construction Queue */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.CONSTRUCTION_QUEUE, PanelSize.MEDIUM)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg relative",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Construction Queue"
          >
            <ListChecks className="w-5 h-5 text-orange-400" />
            {constructionCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {constructionCount > 9 ? '9+' : constructionCount}
              </Badge>
            )}
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-orange-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Construction Queue
            </div>
          </div>
        </div>

        {/* Galaxy Map */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/map')}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Galaxy Map"
          >
            <Globe className="w-5 h-5 text-cyan-300" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-cyan-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Galaxy Map
            </div>
          </div>
        </div>

        {/* Planet Command */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/planets')}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Planets & Colonies"
          >
            <Building2 className="w-5 h-5 text-emerald-300" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-emerald-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Planets & Colonies
            </div>
          </div>
        </div>

        {/* Fleet Command */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.FLEET_COMMAND, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Fleet Command"
          >
            <Rocket className="w-5 h-5 text-red-400" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-red-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Fleet Command
            </div>
          </div>
        </div>

        {/* Tech Encyclopaedia */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tech-tree')}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Tech Encyclopaedia"
          >
            <GitBranch className="w-5 h-5 text-purple-300" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-purple-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Tech Encyclopaedia
            </div>
          </div>
        </div>

        {/* Market */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.MARKET, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover-border-border/50"
            )}
            aria-label="Galactic Market"
          >
            <Coins className="w-5 h-5 text-amber-300" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-amber-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Galactic Market
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.SIGNALS, PanelSize.LARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Signals & Probes"
          >
            <Scan className="w-5 h-5 text-sky-300" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-sky-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Signals & Probes
            </div>
          </div>
        </div>

        {/* Holopad */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/holopad')}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Holopad Layout"
          >
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-border/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Holopad Layout
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.ACHIEVEMENTS, PanelSize.MEDIUM)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover-border-border/50"
            )}
            aria-label="Achievements"
          >
            <Award className="w-5 h-5 text-purple-400" />
          </Button>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-border/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Achievements
            </div>
          </div>
        </div>

        {/* Spacer to push settings and logout to bottom */}
        <div className="flex-1" />

        {/* Settings Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.SETTINGS, PanelSize.LARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-border/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Settings
            </div>
          </div>
        </div>

        {/* Logout Button at bottom */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-destructive/20 hover:scale-110",
              "bg-transparent border border-destructive/30 hover:border-destructive/50"
            )}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-destructive" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-destructive/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Logout
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Pull-out Tab - appears when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(
            'fixed left-0 z-30',
            'w-14 h-40',
            'panel-glass border-r border-primary/30 backdrop-blur-md',
            'flex items-center justify-center',
            'transition-all duration-300',
            'hover:bg-primary/10 hover:border-primary/50 hover:scale-105',
            'shadow-lg shadow-primary/30',
            'pointer-events-auto',
            'group'
          )}
          style={{
            top: '50vh',
            transform: 'translateY(-50%)',
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)',
          }}
          aria-label="Open sidebar"
        >
          <ChevronRight className="w-6 h-6 text-primary group-hover:text-primary transition-colors" />
        </button>
      )}

      {/* Collapse button - appears when sidebar is open, positioned on the right edge */}
      {!isCollapsed && (
        <button
          onClick={() => setIsCollapsed(true)}
          className={cn(
            'fixed left-[64px] z-30',
            'w-8 h-20',
            'panel-glass border-l border-border/50 backdrop-blur-sm',
            'flex items-center justify-center',
            'transition-all duration-300',
            'hover:bg-muted/20 hover:border-border',
            'shadow-lg',
            'pointer-events-auto',
            'group'
          )}
          style={{
            top: '50vh',
            transform: 'translateY(-50%)',
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%)',
          }}
          aria-label="Collapse sidebar"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-foreground transition-colors" />
        </button>
      )}
    </>
  )
}

