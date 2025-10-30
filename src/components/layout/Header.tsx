import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Bell, Settings } from 'lucide-react'
import { logout } from '@/app/slices/authSlice'
import { useLogoutMutation } from '@/api/endpoints/authApi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NotificationCenter } from '@/features/notifications/NotificationCenter'
import { setNotificationCenterOpen } from '@/app/slices/notificationSlice'
import { useGetMeQuery } from '@/api/endpoints/authApi'

export function Header() {
  const empire = useAppSelector((state) => state.auth.empire)
  const { unreadCount, isNotificationCenterOpen } = useAppSelector((state) => state.notifications)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [logoutMutation] = useLogoutMutation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated })

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap()
      dispatch(logout())
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      dispatch(logout())
      navigate('/login')
    }
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleNotificationCenterToggle = () => {
    dispatch(setNotificationCenterOpen(!isNotificationCenterOpen))
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Left cluster: logo + empire info */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-heading glow-cyan whitespace-nowrap shrink-0">agameof.space</h1>
          {empire && (
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-white/90 text-sm truncate max-w-[26ch] leading-none">
                {empire.name}
              </span>
              <span className="h-7 inline-flex items-center gap-2 px-2 rounded bg-black/30 border border-border text-xs whitespace-nowrap">
                <span className="text-muted-foreground">Score</span>
                <span className="font-mono text-primary">
                  {empire.score?.toLocaleString?.() || empire.score}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">Rank</span>
                <span className="font-mono text-cyan-400">
                  {(
                    (meData?.empire as unknown as { rank?: number } | undefined)?.rank ??
                    (empire as unknown as { rank?: number } | null)?.rank ?? '—'
                  )}
                </span>
              </span>
            </div>
          )}
        </div>
        {/* Right cluster: actions */}
        <div className="shrink-0 flex items-center gap-2">
          {empire && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNotificationCenterToggle}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
      
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => dispatch(setNotificationCenterOpen(false))}
      />
    </header>
  )
}

