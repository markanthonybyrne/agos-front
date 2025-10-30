import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAppSelector } from '@/app/hooks'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  // Initialize WebSocket connection (this initializes Echo)
  useWebSocket()
  
  // Initialize WebSocket notifications when authenticated
  useWebSocketNotifications({ enabled: isAuthenticated })

  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-space-dark flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

