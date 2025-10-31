import { useEffect, useMemo } from 'react'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useGetAllianceHomepageQuery } from '@/api/endpoints/alliancesApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useGetMyResearchQuery } from '@/api/endpoints/researchApi'
import { useGetPlanetsQuery, useGetConstructionQueueQuery } from '@/api/endpoints/planetsApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setTick } from '@/app/slices/gameSlice'
import { logout, updateEmpire } from '@/app/slices/authSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatResource, formatTickETA } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getTelleriumImage, getKryptonImage } from '@/lib/resourceImages'
import { getPlanetImage } from '@/lib/planetImages'
import { Avatar } from '@/components/common/Avatar'
import { getUserAvatarUrl } from '@/lib/avatar'
import { 
  AlertCircle, 
  Rocket, 
  Settings, 
  FlaskConical, 
  Shield, 
  Ship,
  Clock,
  TrendingUp,
  MapPin,
  Zap,
  Globe,
  Mail,
  Scan,
  Users,
  Trophy,
  Building2,
  ArrowRight,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FleetDetails, ConstructionQueueItem } from '@/types/api.types'

export function Holopad() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const empire = useAppSelector((state) => state.auth.empire)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  // Fetch all data
  const { data, isLoading, error } = useGetMeQuery(undefined, {
    pollingInterval: 30000,
    skip: !isAuthenticated,
  })
  
  const { data: fleetsData, isLoading: fleetsLoading } = useGetFleetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: researchData, isLoading: researchLoading } = useGetMyResearchQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const { data: planetsData, isLoading: planetsLoading } = useGetPlanetsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

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
    const etaFromMe = d.next_tick_eta ?? d.tick_timing?.next_tick_eta ?? d.next_tick?.next_eta ?? d.next_tick_at ?? d.nextTickEta ?? (typeof d.next_tick?.eta_seconds === 'number' ? new Date(Date.now() + d.next_tick.eta_seconds * 1000).toISOString() : undefined)
          if (tickFromMe && etaFromMe) {
            dispatch(
              setTick({
                tick: Number(tickFromMe),
                nextTickETA: String(etaFromMe),
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
    <div className="space-y-6">
      {/* Command Center Header */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={getUserAvatarUrl(data?.user)}
              name={empireData?.name}
              size="xl"
              className="border-2 border-cyan/50 shadow-lg shadow-cyan/20"
            />
              <div>
              <CardTitle className="text-3xl font-heading glow-cyan">
                  Command Center
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                  {empireData?.name} • Tick {currentTick?.toLocaleString() || 'N/A'}
              </p>
            </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next Tick</p>
              <p className="text-xl font-mono font-bold text-primary">
                {nextTickETA ? formatTickETA(nextTickETA) : 'N/A'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts */}
      {(fleetsInTransit.length > 0 || activeResearch.length > 0) && (
        <Card className="panel-glass border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Activity className="w-5 h-5" />
              Active Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fleetsInTransit.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-semibold">{fleetsInTransit.length} Fleet{fleetsInTransit.length !== 1 ? 's' : ''} in Transit</p>
                      <p className="text-sm text-muted-foreground">Check fleet status</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/fleets')}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
              {activeResearch.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-semibold">{activeResearch.length} Active Research</p>
                      <p className="text-sm text-muted-foreground">Research in progress</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/planets')}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
              </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alliance MOTD */}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Fleet Operations & Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fleet Operations */}
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Fleet Operations
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/fleets')}>
                  View All
                </Button>
              </div>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">In Transit</span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {fleetsInTransit.length}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{fleetsInTransit.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Fleets traveling</p>
                </div>
                <div className="p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Stationed</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {fleetsStationed.length}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{fleetsStationed.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Fleets on planets</p>
                </div>
              </div>
              {fleetsInTransit.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold mb-2">Fleets in Transit:</p>
                  {fleetsInTransit.slice(0, 3).map((fleet: FleetDetails) => (
                    <div key={fleet.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span className="font-mono text-xs">
                        {formatCoordinate(fleet.destination_coordinate)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {fleet.order_type}
                      </Badge>
                    </div>
                  ))}
                  {fleetsInTransit.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/fleets')}>
                      View {fleetsInTransit.length - 3} more...
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resource Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Resource Overview
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/planets')}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-card rounded-lg border border-border flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-tellerium">Tellerium</span>
                      <Badge variant="outline" className="text-tellerium border-tellerium">
                        {formatResource(totalResources.tellerium)}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-tellerium">
                      {formatResource(totalResources.tellerium)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{formatResource(totalProduction.tellerium)}/tick
                    </p>
                  </div>
                  <img
                    src={getTelleriumImage()}
                    alt="Tellerium"
                    className="w-16 h-16 object-contain flex-shrink-0"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
                <div className="p-4 bg-card rounded-lg border border-border flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-krypton">Krypton</span>
                      <Badge variant="outline" className="text-krypton border-krypton">
                        {formatResource(totalResources.krypton)}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-krypton">
                      {formatResource(totalResources.krypton)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      +{formatResource(totalProduction.krypton)}/tick
                    </p>
                  </div>
                  <img
                    src={getKryptonImage()}
                    alt="Krypton"
                    className="w-16 h-16 object-contain flex-shrink-0"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold mb-2">Resources by Planet:</p>
                <div className="space-y-2">
                  {planets.slice(0, 5).map((planet) => (
                    <div key={planet.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <img
                          src={getPlanetImage(planet?.type?.slug) || getPlanetImage('arid')}
                          alt={planet?.type?.name || 'Planet'}
                          className="w-6 h-6 object-contain flex-shrink-0"
                          style={{ imageRendering: 'auto', display: 'block' }}
                        />
                        <span>{planet.name}</span>
                      </div>
                      <div className="flex gap-4 font-mono text-xs items-center">
                        <div className="flex items-center gap-1">
                          <img
                            src={getTelleriumImage()}
                            alt="T"
                            className="w-4 h-4 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-tellerium">{formatResource(planet.tellerium_balance || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img
                            src={getKryptonImage()}
                            alt="K"
                            className="w-4 h-4 object-contain"
                            style={{ imageRendering: 'auto' }}
                          />
                          <span className="text-krypton">{formatResource(planet.krypton_balance || 0)}</span>
                        </div>
                    </div>
                  </div>
                ))}
                  {planets.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/planets')}>
                      View {planets.length - 5} more planets...
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/planets')}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs">Planets</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/fleets')}
                >
                  <Rocket className="w-5 h-5" />
                  <span className="text-xs">Fleets</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/signals')}
                >
                  <Scan className="w-5 h-5" />
                  <span className="text-xs">Signals</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/map')}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-xs">Map</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/alliances')}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Alliances</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/mail')}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-xs">Mail</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/rankings')}
                >
                  <Trophy className="w-5 h-5" />
                  <span className="text-xs">Rankings</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-xs">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Info */}
        <div className="space-y-6">
          {/* Empire Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Empire Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {empireData?.score?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Planets</p>
                  <p className="text-2xl font-bold">
                    {planets.length} / 6
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Fleets</p>
                  <p className="text-2xl font-bold">
                    {fleets.length}
                  </p>
                </div>
              </div>
          </CardContent>
        </Card>

          {/* Planets Summary */}
        <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Planets
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/planets')}>
                  View All
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {planets.slice(0, 5).map((planet) => (
                  <div
                    key={planet.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate(`/planets/${planet.id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">{planet.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatCoordinate(planet.coordinate)}
                      </p>
                    </div>
                    <Badge variant={planet.state === 'homeworld' ? 'default' : 'outline'}>
                      {planet.state}
                    </Badge>
                  </div>
                ))}
                {planets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No planets owned
                  </p>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Research Status */}
          {activeResearch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" />
                  Active Research
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeResearch.map((research: any, index: number) => (
                    <div key={index} className="p-2 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-sm font-medium">{research.research_slug || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        Planet: {research.planet_id || 'N/A'}
                      </p>
                    </div>
                  ))}
      </div>
              </CardContent>
            </Card>
          )}

          {/* Construction Status */}
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Construction Status
              </CardTitle>
        </CardHeader>
        <CardContent>
              <div className="space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-1">Active Construction</p>
                  <p className="text-2xl font-bold">
                    {planets.length > 0 ? 'Check Planets' : 'None'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View construction queues on planet pages
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/planets')}
                >
                  View All Planets
                </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
