import { LayoutDashboard, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

interface QuickAccessSidebarProps {
  constructionCount?: number
}

export function QuickAccessSidebar({ constructionCount = 0 }: QuickAccessSidebarProps) {
  const navigate = useNavigate()
  const { openPanel } = usePanel()

  return (
    <div className="fixed left-0 top-16 bottom-0 w-20 z-20 flex flex-col items-center gap-4 py-6 pointer-events-none">
      {/* Command Center Button */}
      <div className="relative group pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/holopad')}
          className={cn(
            "w-16 h-16 rounded-r-lg rounded-l-none transition-all duration-200",
            "hover:bg-cyan/10 hover:scale-110 hover:shadow-xl hover:shadow-cyan/20",
            "bg-background/80 backdrop-blur-sm border-r border-y border-l-0 border-cyan/20",
            "hover:border-cyan/50 hover:bg-gradient-to-r hover:from-cyan/5 hover:to-transparent"
          )}
          aria-label="Command Center"
        >
          <LayoutDashboard className="w-8 h-8 text-cyan-400" />
        </Button>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-background/95 backdrop-blur-sm border border-cyan/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
            Command Center
          </div>
        </div>
      </div>

      {/* Construction Queue Button */}
      <div className="relative group pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openPanel(PanelType.CONSTRUCTION_QUEUE, PanelSize.MEDIUM)}
          className={cn(
            "w-16 h-16 rounded-r-lg rounded-l-none transition-all duration-200 relative",
            "hover:bg-orange/10 hover:scale-110 hover:shadow-xl hover:shadow-orange/20",
            "bg-background/80 backdrop-blur-sm border-r border-y border-l-0 border-orange/20",
            "hover:border-orange/50 hover:bg-gradient-to-r hover:from-orange/5 hover:to-transparent"
          )}
          aria-label="Construction Queue"
        >
          <ListChecks className="w-8 h-8 text-orange-400" />
          {constructionCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs"
            >
              {constructionCount > 9 ? '9+' : constructionCount}
            </Badge>
          )}
        </Button>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-background/95 backdrop-blur-sm border border-orange/30 px-3 py-1.5 rounded text-sm whitespace-nowrap shadow-xl">
            Construction Queue
          </div>
        </div>
      </div>
    </div>
  )
}

