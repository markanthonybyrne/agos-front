import { useEffect, useMemo, useState } from 'react'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetAllianceHomepageQuery } from '@/api/endpoints/alliancesApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useGetMyResearchQuery } from '@/api/endpoints/researchApi'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setTick } from '@/app/slices/gameSlice'
import { logout, updateEmpire } from '@/app/slices/authSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import GridLayout from 'react-grid-layout'
import { useNavigate } from 'react-router-dom'
import { FleetDetails } from '@/types/api.types'
import { FleetOperationsWidget } from '@/components/holopad/FleetOperationsWidget'
import { ResourcesWidget } from '@/components/holopad/ResourcesWidget'
import { PlanetsWidget } from '@/components/holopad/PlanetsWidget'
import { EmpireStatusWidget } from '@/components/holopad/EmpireStatusWidget'
import { ActiveOperationsWidget } from '@/components/holopad/ActiveOperationsWidget'
import { AnnouncementsWidget } from '@/components/holopad/AnnouncementsWidget'
import { QuantumCreditsWidget } from '@/components/holopad/QuantumCreditsWidget'
import { BoostersWidget } from '@/components/holopad/BoostersWidget'
import { AchievementsWidget } from '@/components/holopad/AchievementsWidget'
import { MarketTrendsWidget } from '@/components/holopad/MarketTrendsWidget'
import { EraProgressionWidget } from '@/components/holopad/EraProgressionWidget'
import { DarkMatterWidget } from '@/components/holopad/DarkMatterWidget'
import { ResearchEffectsWidget } from '@/components/holopad/ResearchEffectsWidget'
import { SpecializationSelectionModal } from '@/components/specialization/SpecializationSelectionModal'
import { useGetEmpireStateQuery } from '@/api/endpoints/empiresApi'
import { Taskbar } from '@/components/holopad/Taskbar'
import '@/styles/holopad.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export function Holopad() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const empire = useAppSelector((state) => state.auth.empire)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  
  // Fetch all data
  const { data, isLoading, error, refetch: refetchMe } = useGetMeQuery(undefined, {
    pollingInterval: 30000,
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  })
  
  const { data: fleetsData, isLoading: fleetsLoading, refetch: refetchFleets } = useGetFleetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: researchData, isLoading: researchLoading } = useGetMyResearchQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetsData, isLoading: planetsLoading, refetch: refetchPlanets } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: empireState } = useGetEmpireStateQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !isAuthenticated,
  })
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)
  
  // Listen for tick processed events to immediately refetch data
  useEffect(() => {
    const handleTickProcessed = () => {
      // Immediately refetch all data when tick processes
      refetchMe()
      refetchPlanets()
      refetchFleets()
    }
    
    window.addEventListener('tick:processed', handleTickProcessed)
    
    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
    }
  }, [refetchMe, refetchPlanets, refetchFleets])

  const allianceId = data?.empire?.alliance_id || empire?.alliance_id
  const { data: allianceHomepageData } = useGetAllianceHomepageQuery(allianceId!, {
    skip: !allianceId
  })

  // Handle authentication errors
  useEffect(() => {
    if (error && 'status' in error && error.status === 401) {
      dispatch(logout())
      toast.error('Session expired. Please log in again.')
      navigate('/login')
    }
  }, [error, dispatch, navigate])

        useEffect(() => {
          const d: any = data || {}
          const tickFromMe = d.current_tick ?? d.tick_timing?.current_tick ?? d.tick?.current ?? d.currentTick ?? d.tickNumber ?? d.next_tick?.tick_number
          
          // Handle eta_seconds as number (can be negative)
          let etaFromMe: string | undefined
          let tickInterval: number | undefined
          
          if (typeof d.next_tick?.eta_seconds === 'number') {
            const etaSeconds = d.next_tick.eta_seconds
            
            // Determine tick interval (default to 300 seconds = 5 minutes)
            // Try to detect interval from the data, or use default
            tickInterval = d.tick_interval_seconds ?? d.next_tick?.interval_seconds ?? 300
            
            if (etaSeconds < 0 && tickInterval) {
              // Tick has passed, calculate when next tick will be
              const secondsUntilNext = tickInterval - (Math.abs(etaSeconds) % tickInterval)
              etaFromMe = new Date(Date.now() + secondsUntilNext * 1000).toISOString()
            } else if (etaSeconds >= 0) {
              // Tick is in the future
              etaFromMe = new Date(Date.now() + etaSeconds * 1000).toISOString()
            }
          } else {
            etaFromMe = d.next_tick_eta ?? d.tick_timing?.next_tick_eta ?? d.next_tick?.next_eta ?? d.next_tick_at ?? d.nextTickEta
          }
          
          if (tickFromMe && etaFromMe) {
            dispatch(
              setTick({
                tick: Number(tickFromMe),
                nextTickETA: String(etaFromMe),
                tickIntervalSeconds: tickInterval,
              })
            )
          }
          if (d.empire) {
            dispatch(updateEmpire(d.empire))
          }
        }, [data, dispatch])

  const d: any = data || {}
  const currentTick = useAppSelector((state) => state.game.currentTick) || d.current_tick || d.tick_timing?.current_tick || d.tick?.current || d.currentTick || d.tickNumber || d.next_tick?.tick_number
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA) || d.next_tick_eta || d.tick_timing?.next_tick_eta || d.next_tick?.next_eta || d.next_tick_at || d.nextTickEta || (typeof d.next_tick?.eta_seconds === 'number' ? new Date(Date.now() + d.next_tick.eta_seconds * 1000).toISOString() : undefined)

  const empireData = data?.empire || empire
  const planets = planetsData?.planets || data?.planets || []
  const fleets = fleetsData?.fleets || []
  
  // Calculate totals
  const totalResources = useMemo(() => {
    return planets.reduce((acc, planet) => ({
      tellerium: acc.tellerium + (planet.tellerium_balance || 0),
      krypton: acc.krypton + (planet.krypton_balance || 0),
    }), { tellerium: 0, krypton: 0 })
  }, [planets])

  const totalProduction = useMemo(() => {
    return planets.reduce((acc, planet) => ({
      tellerium: acc.tellerium + ((planet.production?.tellerium_per_tick || 0) + (planet.mines || 0) * 1000 + 250),
      krypton: acc.krypton + ((planet.production?.krypton_per_tick || 0) + (planet.probes || 0) * 750 + 250),
    }), { tellerium: 0, krypton: 0 })
  }, [planets])

  // Filter fleets
  const fleetsInTransit = fleets.filter((f: FleetDetails) => f.status === 'in_transit')
  const fleetsStationed = fleets.filter((f: FleetDetails) => f.status === 'stationed')

  // Get active research
  const activeResearch = researchData?.research || []

  // Check if should show specialization modal
  useEffect(() => {
    if (empireState?.should_prompt_specialization) {
      setShowSpecializationModal(true)
    }
  }, [empireState?.should_prompt_specialization])

  const DEFAULT_WIDGET_LAYOUT: Record<string, { x: number; y: number; w: number; h: number }> = {
    operations: { x: 0, y: 0, w: 4, h: 5 },
    resources: { x: 4, y: 0, w: 4, h: 5 },
    planets: { x: 8, y: 0, w: 4, h: 5 },
    era_progression: { x: 0, y: 5, w: 4, h: 4 },
    dark_matter: { x: 4, y: 5, w: 4, h: 4 },
    research_effects: { x: 8, y: 5, w: 4, h: 4 },
    status: { x: 0, y: 9, w: 4, h: 4 },
    quantum_credits: { x: 4, y: 9, w: 4, h: 4 },
    boosters: { x: 8, y: 9, w: 4, h: 4 },
    achievements: { x: 0, y: 13, w: 4, h: 4 },
    announcements: { x: 4, y: 13, w: 4, h: 5 },
    market_trends: { x: 8, y: 13, w: 4, h: 5 },
  }

  // Widget layout state - load from localStorage or use default grid
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem('holopad-layout')
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch {
        // fall through
      }
    }
    return Object.entries(DEFAULT_WIDGET_LAYOUT).map(([key, value]) => ({
      i: key,
      ...value,
    }))
  })

  // Widget minimize state - default to all widgets visible
  const [minimizedWidgets, setMinimizedWidgets] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('holopad-minimized')
    if (saved) {
      return new Set(JSON.parse(saved))
    }
    return new Set()
  })
  const [closedWidgets, setClosedWidgets] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('holopad-closed')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  // Save minimized/closed state to localStorage
  useEffect(() => {
    localStorage.setItem('holopad-minimized', JSON.stringify(Array.from(minimizedWidgets)))
  }, [minimizedWidgets])

  useEffect(() => {
    localStorage.setItem('holopad-closed', JSON.stringify(Array.from(closedWidgets)))
  }, [closedWidgets])

  // Widget titles for taskbar
  const widgetTitles: Record<string, string> = {
    operations: 'Fleet Operations',
    resources: 'Resources',
    planets: 'Planets',
    era_progression: 'Era Progression',
    dark_matter: 'Dark Matter',
    research_effects: 'Research Effects',
    status: 'Empire Status',
    quantum_credits: 'Quantum Credits',
    boosters: 'Boosters',
    achievements: 'Achievements',
    announcements: 'Announcements',
    market_trends: 'Market Trends',
  }

  const clampLayoutItem = (item: any) => ({
    ...item,
    x: Math.max(0, Math.min(item.x, 12 - item.w)),
    y: Math.max(0, item.y),
    w: Math.min(12, Math.max(2, item.w)),
    h: Math.max(2, item.h),
  })

  const handleLayoutChange = (newLayout: any) => {
    const normalized = newLayout.map(clampLayoutItem)
    setLayout(normalized)
    localStorage.setItem('holopad-layout', JSON.stringify(normalized))
  }

  const handleMinimizeWidget = (widgetId: string) => {
    setMinimizedWidgets(prev => {
      const newSet = new Set(prev)
      newSet.add(widgetId)
      return newSet
    })
    // Remove from layout when minimized
    setLayout((prev: any[]) => {
      const next = prev.filter((item: any) => item.i !== widgetId)
      localStorage.setItem('holopad-layout', JSON.stringify(next))
      return next
    })
  }

  // Filter out minimized and closed widgets from layout
  const visibleLayout = useMemo(() => {
    return layout.filter((item: any) => 
      !minimizedWidgets.has(item.i) && !closedWidgets.has(item.i)
    )
  }, [layout, minimizedWidgets, closedWidgets])

  const handleRestoreWidget = (widgetId: string) => {
    setMinimizedWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(widgetId)
      return newSet
    })
    // Also remove from closed widgets if it was closed
    setClosedWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(widgetId)
      return newSet
    })
    // Add back to layout at a default position
    const existingLayout = visibleLayout.map(clampLayoutItem)
    const defaultPosition = DEFAULT_WIDGET_LAYOUT[widgetId] || { x: 0, y: 0, w: 4, h: 4 }
    const candidate = { i: widgetId, ...defaultPosition }

    const collides = (test: { x: number; y: number; w: number; h: number }) =>
      existingLayout.some((item: any) => {
        const separated =
          test.x + test.w <= item.x ||
          test.x >= item.x + item.w ||
          test.y + test.h <= item.y ||
          test.y >= item.y + item.h
        return !separated
      })

    let attempts = 0
    while (collides(candidate) && attempts < 50) {
      candidate.y += candidate.h
      attempts += 1
    }

    const updated = [...existingLayout, clampLayoutItem(candidate)]
    setLayout(updated)
    localStorage.setItem('holopad-layout', JSON.stringify(updated))
  }

  const handleCloseWidget = (widgetId: string) => {
    setClosedWidgets(prev => new Set(prev).add(widgetId))
    setMinimizedWidgets(prev => {
      const newSet = new Set(prev)
      newSet.delete(widgetId)
      return newSet
    })
    // Remove from layout
    setLayout((prev: any[]) => {
      const next = prev.filter((item: any) => item.i !== widgetId)
      localStorage.setItem('holopad-layout', JSON.stringify(next))
      return next
    })
  }

  const handleReorderWidgets = (newOrder: string[]) => {
    // Save order to localStorage
    localStorage.setItem('holopad-taskbar-order', JSON.stringify(newOrder))
  }

  // Get minimized widgets for taskbar
  const minimizedWidgetsList = Array.from(minimizedWidgets)
    .filter(id => !closedWidgets.has(id))
    .map(id => ({
      id,
      title: widgetTitles[id] || id,
    }))

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isLoading || fleetsLoading || researchLoading || planetsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="panel-glass border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load empire data. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 holopad-enter pb-24" data-onboarding-target="holopad">
      <GridLayout
        className="layout"
        layout={visibleLayout}
        onLayoutChange={handleLayoutChange}
        cols={12}
        rowHeight={60}
        width={Math.max(960, windowWidth - 64)}
        isDraggable={true}
        isResizable={true}
        margin={[20, 24]}
        compactType="vertical"
        preventCollision={false}
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
      >
        {/* Fleet Operations Widget */}
        <div key="operations">
          <FleetOperationsWidget
            fleetsInTransit={fleetsInTransit}
            fleetsStationed={fleetsStationed}
            onMinimize={() => handleMinimizeWidget('operations')}
            onClose={() => handleCloseWidget('operations')}
            isMinimized={minimizedWidgets.has('operations')}
                  />
                </div>

        {/* Resources Widget */}
        <div key="resources">
          <ResourcesWidget
            totalTellerium={totalResources.tellerium}
            totalKrypton={totalResources.krypton}
            productionTellerium={totalProduction.tellerium}
            productionKrypton={totalProduction.krypton}
            onMinimize={() => handleMinimizeWidget('resources')}
            onClose={() => handleCloseWidget('resources')}
            isMinimized={minimizedWidgets.has('resources')}
                  />
                </div>

        {/* Planets Widget */}
        <div key="planets">
          <PlanetsWidget
            planets={planets}
            onMinimize={() => handleMinimizeWidget('planets')}
            onClose={() => handleCloseWidget('planets')}
            isMinimized={minimizedWidgets.has('planets')}
          />
        </div>

        {/* Era Progression Widget */}
        <div key="era_progression">
          <EraProgressionWidget
            onMinimize={() => handleMinimizeWidget('era_progression')}
            onClose={() => handleCloseWidget('era_progression')}
            isMinimized={minimizedWidgets.has('era_progression')}
          />
        </div>

        {/* Dark Matter Widget */}
        <div key="dark_matter">
          <DarkMatterWidget
            onMinimize={() => handleMinimizeWidget('dark_matter')}
            onClose={() => handleCloseWidget('dark_matter')}
            isMinimized={minimizedWidgets.has('dark_matter')}
          />
        </div>

        {/* Research Effects Widget */}
        <div key="research_effects">
          <ResearchEffectsWidget
            onMinimize={() => handleMinimizeWidget('research_effects')}
            onClose={() => handleCloseWidget('research_effects')}
            isMinimized={minimizedWidgets.has('research_effects')}
          />
        </div>

        {/* Empire Status Widget */}
        <div key="status">
          <EmpireStatusWidget
            score={empireData?.score || 0}
            planetCount={planets.length}
            maxPlanets={6}
            fleetCount={fleets.length}
            activeEra={empireState?.active_era || empireData?.active_era}
            specializationsUnlocked={empireState?.specializations_unlocked || empireData?.specializations_unlocked || []}
            onMinimize={() => handleMinimizeWidget('status')}
            onClose={() => handleCloseWidget('status')}
            isMinimized={minimizedWidgets.has('status')}
          />
        </div>

        {/* Quantum Credits Widget */}
        <div key="quantum_credits">
          <QuantumCreditsWidget
            onMinimize={() => handleMinimizeWidget('quantum_credits')}
            onClose={() => handleCloseWidget('quantum_credits')}
            isMinimized={minimizedWidgets.has('quantum_credits')}
          />
        </div>

        {/* Boosters Widget */}
        <div key="boosters">
          <BoostersWidget
            onMinimize={() => handleMinimizeWidget('boosters')}
            onClose={() => handleCloseWidget('boosters')}
            isMinimized={minimizedWidgets.has('boosters')}
          />
        </div>

        {/* Achievements Widget */}
        <div key="achievements">
          <AchievementsWidget
            onMinimize={() => handleMinimizeWidget('achievements')}
            onClose={() => handleCloseWidget('achievements')}
            isMinimized={minimizedWidgets.has('achievements')}
          />
        </div>

        {/* Announcements Widget */}
        <div key="announcements">
          <AnnouncementsWidget
            onMinimize={() => handleMinimizeWidget('announcements')}
            onClose={() => handleCloseWidget('announcements')}
            isMinimized={minimizedWidgets.has('announcements')}
          />
        </div>

        {/* Market Trends Widget */}
        <div key="market_trends">
          <MarketTrendsWidget
            onMinimize={() => handleMinimizeWidget('market_trends')}
            onClose={() => handleCloseWidget('market_trends')}
            isMinimized={minimizedWidgets.has('market_trends')}
          />
        </div>
      </GridLayout>

      {/* Active Operations Widget - Conditional */}
      {(fleetsInTransit.length > 0 || activeResearch.length > 0) && (
        <div className="mt-6">
          <ActiveOperationsWidget
            fleetsInTransit={fleetsInTransit.length}
            activeResearch={activeResearch.length}
          />
        </div>
      )}

      {/* Specialization Selection Modal */}
      <SpecializationSelectionModal
        open={showSpecializationModal}
        onClose={() => setShowSpecializationModal(false)}
        availableSpecializations={['industrial', 'military', 'relic']}
      />

      {/* Taskbar for minimized widgets */}
      <Taskbar
        minimizedWidgets={minimizedWidgetsList}
        onRestoreWidget={handleRestoreWidget}
        onCloseWidget={handleCloseWidget}
        onReorder={handleReorderWidgets}
      />
    </div>
  )
}
