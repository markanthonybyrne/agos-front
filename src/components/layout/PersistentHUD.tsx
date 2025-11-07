import { useEffect } from 'react'
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

interface PersistentHUDProps {
  className?: string
  showClose?: boolean
}

export function PersistentHUD({ className, showClose = false }: PersistentHUDProps) {
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
    <div className="fixed top-0 left-0 sm:left-16 right-0 z-30">
      <div className="w-full px-2 sm:px-4 py-2 flex items-center justify-between gap-2 relative">
        {/* Left spacer for balance */}
        <div className="flex-shrink-0 hidden sm:block w-0 sm:w-auto" />

        {/* Logo - Absolutely centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img 
            src={BRAND.logo} 
            alt="A Game Of Space" 
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
          {/* User Score and Rank */}
          {displayEmpire && (
            <div 
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 panel-glass surface-gradient card-glow vignette border border-border/50 text-xs"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0% 100%)',
              }}
            >
              {rank && (
                <>
                  <Trophy className="w-3.5 h-3.5 text-purple-400" />
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
            className="relative flex items-center gap-1 sm:gap-2"
          >
            <img
              src={getQuantumCreditsImage()}
              alt="Quantum Credits"
              className="w-4 h-4 flex-shrink-0"
            />
            <span className="hidden md:inline font-mono text-cyan-400">
              {qcData?.balance ?? 0}
            </span>
          </Button>

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
  )
}

