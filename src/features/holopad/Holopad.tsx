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

  // Widget layout state - load from localStorage or use default
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem('holopad-layout')
    if (savedLayout) {
      try {
        return JSON.parse(savedLayout)
      } catch {
        // Fall through to default layout
      }
    }
    return [
      { i: 'operations', x: 0, y: 0, w: 6, h: 4 },
      { i: 'resources', x: 6, y: 0, w: 6, h: 4 },
      { i: 'market_trends', x: 0, y: 4, w: 6, h: 4 },
      { i: 'quantum_credits', x: 6, y: 4, w: 3, h: 4 },
      { i: 'boosters', x: 9, y: 4, w: 3, h: 4 },
      { i: 'achievements', x: 0, y: 8, w: 4, h: 4 },
      { i: 'planets', x: 4, y: 8, w: 6, h: 5 },
      { i: 'status', x: 10, y: 8, w: 2, h: 5 },
      { i: 'announcements', x: 0, y: 13, w: 6, h: 6 },
    ]
  })

  // Widget minimize state
  const [minimizedWidgets, setMinimizedWidgets] = useState<Set<string>>(new Set())

  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout)
    localStorage.setItem('holopad-layout', JSON.stringify(newLayout))
  }

  const handleMinimizeWidget = (widgetId: string) => {
    setMinimizedWidgets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId)
      } else {
        newSet.add(widgetId)
      }
      return newSet
    })
  }

  const handleCloseWidget = (widgetId: string) => {
    // For now, just minimize - could implement actual removal later
    setMinimizedWidgets(prev => new Set(prev).add(widgetId))
  }

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
    <div className="px-6 py-8 holopad-enter">
      <GridLayout
        className="layout"
        layout={layout}
        onLayoutChange={handleLayoutChange}
        cols={12}
        rowHeight={60}
        width={windowWidth - 64}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        compactType={null}
        preventCollision={false}
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

        {/* Empire Status Widget */}
        <div key="status">
          <EmpireStatusWidget
            score={empireData?.score || 0}
            planetCount={planets.length}
            maxPlanets={6}
            fleetCount={fleets.length}
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
    </div>
  )
}
