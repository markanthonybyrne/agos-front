import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Bell,
  X,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePanel } from '@/components/common/PanelManager'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'
import { useAppSelector } from '@/app/hooks'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetQuantumCreditsQuery } from '@/api/endpoints/premiumApi'
import { BRAND } from '@/lib/brandImages'
import { getQuantumCreditsImage } from '@/lib/quantumCreditsImages'
import { cn } from '@/lib/utils'

interface PersistentHUDProps {
  className?: string
  showClose?: boolean
}

export function PersistentHUD({ className, showClose = false }: PersistentHUDProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { openPanel, backdropVisible, closeAllPanels } = usePanel()
  const notificationsCount = useAppSelector(state => 
    state.notifications.notifications.filter(n => !n.isRead).length
  )
  const { data, refetch: refetchMe } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: qcData } = useGetQuantumCreditsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute
  })
  const empire = useAppSelector((state) => state.auth.empire)
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname
    if (path.startsWith('/planets')) return 'planets'
    if (path.startsWith('/map')) return 'map'
    if (path.startsWith('/fleets')) return 'fleets'
    return null
  }
  
  const activeTab = getActiveTab()
  
  const tabs = [
    { id: 'planets', label: 'Planets', path: '/planets' },
    { id: 'map', label: 'Map', path: '/map' },
    { id: 'fleets', label: 'Fleets', path: '/fleets' },
  ]
  
  // Listen for tick/empire update events to immediately refetch and update display
  useEffect(() => {
    const handleTickProcessed = () => {
      refetchMe()
    }
    const handleEmpireUpdated = () => {
      refetchMe()
    }
    
    window.addEventListener('tick:processed', handleTickProcessed)
    window.addEventListener('empire:updated', handleEmpireUpdated)
    
    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
      window.removeEventListener('empire:updated', handleEmpireUpdated)
    }
  }, [refetchMe])
  
  // Use query data for empire if available (more up-to-date), fallback to Redux state
  const displayEmpire = data?.empire || empire
  
  // Get rank directly from the empire object (from /auth/me endpoint)
  const rank = displayEmpire?.rank ?? null

  return (
    <>
      {/* Top HUD - Logo, Tabs, and Notifications */}
      <div className="fixed top-0 left-0 sm:left-16 right-0 z-30">
        <div className="w-full px-2 sm:px-4 py-2 flex items-center justify-between gap-4 relative">
          {/* Logo - Left aligned */}
          <div className="flex-shrink-0">
            <img 
              src={BRAND.logo} 
              alt="A Game Of Space" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>

          {/* Center Tabs Bar - Glass style with classic angled corners */}
          <div className="flex-1 flex justify-center">
            <div 
              className="flex items-center gap-0 panel-glass surface-gradient card-glow vignette border border-border/50"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
              }}
            >
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={cn(
                      "px-6 py-2.5 text-sm font-medium transition-all duration-200 relative",
                      "hover:bg-primary/10 border-r border-border/30 last:border-r-0",
                      isActive 
                        ? "text-cyan-400 bg-primary/20" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPanel(PanelType.NOTIFICATIONS, PanelSize.MEDIUM)}
              className="relative flex-shrink-0"
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

            {/* Close all panels */}
            {showClose && backdropVisible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => closeAllPanels()}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Left HUD - Rank, Score, and Quantum Credits */}
      <div className="fixed bottom-0 left-0 sm:left-16 z-30 p-4">
        <div className="flex items-center gap-3">
          {/* User Score and Rank */}
          {displayEmpire && (
            <div 
              className="flex items-center gap-3 px-4 py-2 panel-glass surface-gradient card-glow vignette border border-border/50 text-sm"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
              }}
            >
              {rank && (
                <>
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-muted-foreground">Rank:</span>
                  <span className="font-mono font-semibold text-purple-400">
                    #{rank}
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                </>
              )}
              <span className="text-muted-foreground">Score:</span>
              <span className="font-mono font-semibold text-cyan-400">
                {displayEmpire.score?.toLocaleString?.() || displayEmpire.score}
              </span>
            </div>
          )}

          {/* Quantum Credits */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPanel(PanelType.QUANTUM_CREDITS, PanelSize.MEDIUM)}
            className="relative flex items-center gap-2 px-4 py-2 panel-glass surface-gradient card-glow vignette border border-border/50"
            style={{
              clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
            }}
          >
            <img
              src={getQuantumCreditsImage()}
              alt="Quantum Credits"
              className="w-5 h-5 flex-shrink-0"
            />
            <span className="font-mono text-cyan-400 text-sm">
              {qcData?.balance ?? 0}
            </span>
          </Button>
        </div>
      </div>
    </>
  )
}

