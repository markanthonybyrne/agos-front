import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type HudPosition = {
  top: number
  left: number
}

const PANEL_MAX_WIDTH = 440
const PANEL_WIDTH_RATIO = 0.92
const PANEL_MARGIN = 8
const PANEL_TOP_OFFSET = 24
const PANEL_MAX_BOTTOM_MARGIN = 220
const HUD_INACTIVITY_TIMEOUT = 5000

function getPanelWidth() {
  if (typeof window === 'undefined') return PANEL_MAX_WIDTH
  return Math.min(window.innerWidth * PANEL_WIDTH_RATIO, PANEL_MAX_WIDTH)
}

function clampHudPosition(position: HudPosition): HudPosition {
  if (typeof window === 'undefined') return position
  const panelWidth = getPanelWidth()
  const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - panelWidth - PANEL_MARGIN)
  const maxTop = Math.max(PANEL_MARGIN, window.innerHeight - PANEL_MAX_BOTTOM_MARGIN)
  return {
    left: Math.max(PANEL_MARGIN, Math.min(maxLeft, position.left)),
    top: Math.max(PANEL_MARGIN, Math.min(maxTop, position.top)),
  }
}

function getDefaultHudPosition(): HudPosition {
  if (typeof window === 'undefined') {
    return { top: PANEL_TOP_OFFSET, left: PANEL_MARGIN }
  }
  const panelWidth = getPanelWidth()
  const centeredLeft = (window.innerWidth - panelWidth) / 2
  return clampHudPosition({
    top: PANEL_TOP_OFFSET,
    left: centeredLeft,
  })
}

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
  const [hudVisible, setHudVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem('hud-visible')
    return stored !== 'false'
  })
  const [hudPosition, setHudPosition] = useState<HudPosition>(() => {
    if (typeof window === 'undefined') return getDefaultHudPosition()
    const stored = window.localStorage.getItem('hud-position')
    if (!stored) return getDefaultHudPosition()
    try {
      const parsed = JSON.parse(stored)
      if (typeof parsed.top === 'number' && typeof parsed.left === 'number') {
        return clampHudPosition(parsed)
      }
    } catch {
      // ignore invalid stored value
    }
    return getDefaultHudPosition()
  })
  const [dragOrigin, setDragOrigin] = useState<{
    pointerX: number
    pointerY: number
    startLeft: number
    startTop: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inactivityTimer = useRef<number | null>(null)
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('hud-visible', hudVisible ? 'true' : 'false')
  }, [hudVisible])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('hud-position', JSON.stringify(clampHudPosition(hudPosition)))
  }, [hudPosition])
  
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
  const limitedPosition = useMemo(() => clampHudPosition(hudPosition), [hudPosition])

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current !== null) {
      window.clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }
  }, [])

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer()
    inactivityTimer.current = window.setTimeout(() => {
      setHudVisible(false)
      inactivityTimer.current = null
    }, HUD_INACTIVITY_TIMEOUT)
  }, [clearInactivityTimer])

  const registerActivity = useCallback(() => {
    if (!hudVisible) return
    startInactivityTimer()
  }, [hudVisible, startInactivityTimer])

  useEffect(() => {
    if (!isDragging || !dragOrigin) return
    const handleMouseMove = (event: MouseEvent) => {
      registerActivity()
      const deltaX = event.clientX - dragOrigin.pointerX
      const deltaY = event.clientY - dragOrigin.pointerY
      setHudPosition(
        clampHudPosition({
          left: dragOrigin.startLeft + deltaX,
          top: dragOrigin.startTop + deltaY,
        }),
      )
    }
    const handleMouseUp = () => {
      registerActivity()
      setIsDragging(false)
      setDragOrigin(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOrigin, registerActivity])

  useEffect(() => {
    if (hudVisible) {
      startInactivityTimer()
      return () => clearInactivityTimer()
    }
    clearInactivityTimer()
  }, [hudVisible, startInactivityTimer, clearInactivityTimer])

  useEffect(() => {
    const handleResize = () => {
      setHudPosition((prev) => clampHudPosition(prev))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleOpenHud = useCallback(() => {
    const centered = getDefaultHudPosition()
    setHudPosition(centered)
    setHudVisible(true)
  }, [])

  return (
    <>
      <div
        className="fixed top-0 z-20 flex items-center justify-between px-4 py-2 pointer-events-none"
        style={{
          left: '4rem',
          right: '1.5rem',
        }}
      >
        <div className="pointer-events-auto">
          <img 
            src={BRAND.logo} 
            alt="A Game Of Space" 
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>
        {!hudVisible && (
          <button
            type="button"
            className="pointer-events-auto flex items-center gap-2 rounded-md border border-border/60 bg-card/80 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-lg transition hover:bg-card hover:text-foreground"
            onClick={handleOpenHud}
          >
            Open HUD
          </button>
        )}
      </div>

      {hudVisible && (
        <div
          className={cn(
            'fixed z-40 max-w-full pointer-events-none',
            className
          )}
          style={{
            top: limitedPosition.top,
            left: limitedPosition.left,
          }}
        >
          <div
            className="pointer-events-auto w-[min(92vw,440px)] rounded-xl border border-border/60 bg-[rgba(8,14,23,0.92)] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.55)]"
            onMouseMove={registerActivity}
            onMouseDown={registerActivity}
            onClick={registerActivity}
            onWheel={registerActivity}
            onTouchStart={registerActivity}
            onTouchMove={registerActivity}
          >
            <div
              className="flex items-start justify-between gap-3 cursor-move select-none"
              onMouseDown={(event) => {
                registerActivity()
                if (event.button !== 0) return
                setIsDragging(true)
                setDragOrigin({
                  pointerX: event.clientX,
                  pointerY: event.clientY,
                  startLeft: limitedPosition.left,
                  startTop: limitedPosition.top,
                })
              }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={BRAND.logo} 
                  alt="A Game Of Space" 
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.38em] text-muted-foreground/70">
                    Command HUD
                  </p>
                  <p className="text-xs text-muted-foreground/50 truncate max-w-[180px]">
                    {displayEmpire?.name ?? 'Uncharted Empire'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation()
                    registerActivity()
                    openPanel(PanelType.NOTIFICATIONS, PanelSize.MEDIUM)
                  }}
                  className="relative h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                >
                  <Bell className="w-4 h-4" />
                  {notificationsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[9px] flex items-center justify-center"
                    >
                      {notificationsCount > 9 ? '9+' : notificationsCount}
                    </Badge>
                  )}
                </Button>
                {showClose && backdropVisible && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation()
                      registerActivity()
                      closeAllPanels()
                    }}
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-destructive/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation()
                    registerActivity()
                    setHudVisible(false)
                  }}
                  className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-destructive/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-card/35 p-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      className={cn(
                        'rounded-md border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition-colors',
                        isActive
                          ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-200 shadow-inner'
                          : 'border-transparent text-muted-foreground hover:border-border/40 hover:bg-primary/10 hover:text-foreground'
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-3 rounded-lg border border-border/40 bg-card/30 p-3">
                {displayEmpire && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border/30 bg-primary/5 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <span className="text-muted-foreground/70">Rank</span>
                      <span className="font-mono font-semibold text-purple-300">
                        {rank ? `#${rank}` : 'Unranked'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/70">Score</span>
                      <span className="font-mono font-semibold text-cyan-300">
                        {displayEmpire.score?.toLocaleString?.() || displayEmpire.score || 0}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPanel(PanelType.QUANTUM_CREDITS, PanelSize.MEDIUM)}
                  className="relative flex items-center justify-between gap-3 rounded-md border border-border/30 bg-cyan-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/20"
                >
                  <span className="flex items-center gap-2">
                    <img
                      src={getQuantumCreditsImage()}
                      alt="Quantum Credits"
                      className="h-5 w-5"
                    />
                    Quantum Credits
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {qcData?.balance ?? 0}
                  </span>
                  {qcData?.can_claim_daily && (
                    <Badge 
                      variant="outline" 
                      className="absolute -top-2 right-2 text-[0.6rem] border-yellow-500/40 text-yellow-400"
                    >
                      Daily Ready
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

