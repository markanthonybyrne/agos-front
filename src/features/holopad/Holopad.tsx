import { useEffect } from 'react'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setTick } from '@/app/slices/gameSlice'
import { logout, updateEmpire } from '@/app/slices/authSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatResource, formatTickETA } from '@/lib/formatters'
import { formatCoordinate } from '@/lib/coordinates'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'

export function Holopad() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const empire = useAppSelector((state) => state.auth.empire)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const { data, isLoading, error } = useGetMeQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    skip: !isAuthenticated, // Skip the query if not authenticated
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
          const etaFromMe = d.next_tick_eta ?? d.tick_timing?.next_tick_eta ?? d.tick?.next_eta ?? d.next_tick_at ?? d.nextTickEta ?? (typeof d.next_tick?.eta_seconds === 'number' ? new Date(Date.now() + d.next_tick.eta_seconds * 1000).toISOString() : undefined)
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
  const nextTickETA = useAppSelector((state) => state.game.nextTickETA) || d.next_tick_eta || d.tick_timing?.next_tick_eta || d.tick?.next_eta || d.next_tick_at || d.nextTickEta || (typeof d.next_tick?.eta_seconds === 'number' ? new Date(Date.now() + d.next_tick.eta_seconds * 1000).toISOString() : undefined)

  if (isLoading) {
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

        const empireData = data?.empire || empire
        const planets = Array.isArray(data?.planets) ? data.planets : []
  
  // Debug logging
  console.log('Holopad data:', data)
  console.log('Planets:', planets)
  console.log('Is planets array?', Array.isArray(planets))
  
  // Handle error case
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
      {/* Welcome Banner */}
      <Card className="panel-glass border-cyan/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              src={data?.user?.avatar_path}
              name={empireData?.name}
              size="xl"
              className="border-2 border-cyan/50 shadow-lg shadow-cyan/20"
            />
            <div className="flex-1">
              <CardTitle className="text-3xl font-heading glow-cyan">
                Welcome, Commander {empireData?.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.user?.username ? `@${data.user.username}` : 'Ready to command'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Tick</p>
              <p className="text-2xl font-mono font-bold text-cyan">
                {currentTick?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Tick ETA</p>
              <p className="text-2xl font-mono font-bold text-blue">
                {nextTickETA ? formatTickETA(nextTickETA) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Empire Score</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {empireData?.score.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {planets.length > 0 ? (
              <div className="space-y-2">
                {planets.map((planet) => (
                  <div key={planet.id} className="flex justify-between items-center">
                    <span className="text-sm">{planet.name}</span>
                    <div className="flex gap-4 font-mono">
                      <span className="text-cyan">
                        T: {formatResource(planet.tellerium_balance)}
                      </span>
                      <span className="text-blue">
                        K: {formatResource(planet.krypton_balance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No planets found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planets.length > 0 ? (
                planets.map((planet) => (
                  <div key={planet.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{planet.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatCoordinate(planet.coordinate)}
                      </p>
                    </div>
                    <span className="text-sm capitalize">{planet.state}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No planets owned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
              <p className="font-medium">Build Ships</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
              <p className="font-medium">Build Facilities</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
              <p className="font-medium">Send Fleet</p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:bg-accent transition-colors">
              <p className="font-medium">Launch Signal</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

