import { LayoutDashboard, ListChecks, MessageSquare, Mail, Trophy, Award, Settings, LogOut } from 'lucide-react'
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
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const { unreadCount } = useUnreadMailCount()
  const dispatch = useAppDispatch()
  const { data } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 z-20 pointer-events-none">
      {/* EVE-style vertical icon bar with glass effect */}
      <div className="w-full h-full flex flex-col items-center pt-4 pb-4 gap-2 panel-glass surface-gradient card-glow vignette border-r border-border/50">
        
        {/* Avatar at top */}
        <div className="relative group pointer-events-auto z-10">
          <Avatar
            src={getUserAvatarUrl(data?.user)}
            name={data?.user?.username || 'User'}
            size="sm"
            className="border-2 border-cyan/50 w-12 h-12"
          />
        </div>

        {/* Command Center Button */}
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
            aria-label="Command Center"
          >
            <LayoutDashboard className="w-5 h-5 text-foreground" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-border/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Command Center
            </div>
          </div>
        </div>

        {/* Construction Queue Button */}
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
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-orange-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Construction Queue
            </div>
          </div>
        </div>

        {/* Chat Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.CHAT, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Global Chat"
          >
            <MessageSquare className="w-5 h-5 text-cyan-400" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-cyan-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Global Chat
            </div>
          </div>
        </div>

        {/* Mail Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.MESSAGING, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg relative",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Mail"
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
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-yellow-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Mail
            </div>
          </div>
        </div>

        {/* Rankings Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.RANKINGS, PanelSize.XLARGE)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Rankings"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-amber-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Rankings
            </div>
          </div>
        </div>

        {/* Achievements Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPanel(PanelType.ACHIEVEMENTS, PanelSize.MEDIUM)}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-muted/20 hover:scale-110",
              "bg-transparent border border-border/30 hover:border-border/50"
            )}
            aria-label="Achievements"
          >
            <Award className="w-5 h-5 text-purple-400" />
          </Button>
          {/* Tooltip */}
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
  )
}

