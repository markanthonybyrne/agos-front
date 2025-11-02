import { LayoutDashboard, ListChecks, MessageSquare, Mail, Trophy, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useUnreadMailCount } from '@/hooks/useUnreadMailCount'

interface QuickAccessSidebarProps {
  constructionCount?: number
}

export function QuickAccessSidebar({ constructionCount = 0 }: QuickAccessSidebarProps) {
  const navigate = useNavigate()
  const { openPanel } = usePanel()
  const { unreadCount } = useUnreadMailCount()

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 z-20 pointer-events-none">
      {/* EVE-style vertical icon bar with glass effect */}
      <div className="w-full h-full flex flex-col items-center pt-24 pb-4 gap-2 panel-glass surface-gradient card-glow vignette border-r border-border/50">
        
        {/* Command Center Button */}
        <div className="relative group pointer-events-auto z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/holopad')}
            className={cn(
              "w-12 h-12 transition-all duration-200 rounded-lg",
              "hover:bg-blue-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-blue-500/30",
              "bg-transparent border border-blue-500/30 hover:border-blue-500/50"
            )}
            aria-label="Command Center"
          >
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-blue-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
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
              "hover:bg-orange-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-orange-500/30",
              "bg-transparent border border-orange-500/30 hover:border-orange-500/50"
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
              "hover:bg-cyan-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-cyan-500/30",
              "bg-transparent border border-cyan-500/30 hover:border-cyan-500/50"
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
              "hover:bg-yellow-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-yellow-500/30",
              "bg-transparent border border-yellow-500/30 hover:border-yellow-500/50"
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
              "hover:bg-amber-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-amber-500/30",
              "bg-transparent border border-amber-500/30 hover:border-amber-500/50"
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
              "hover:bg-purple-500/20 hover:scale-110",
              "hover:shadow-lg hover:shadow-purple-500/30",
              "bg-transparent border border-purple-500/30 hover:border-purple-500/50"
            )}
            aria-label="Achievements"
          >
            <Award className="w-5 h-5 text-purple-400" />
          </Button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-sm border border-purple-500/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
              Achievements
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

