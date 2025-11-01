import { ReactNode } from 'react'
import { PersistentHUD } from './PersistentHUD'
import { QuickAccessSidebar } from './QuickAccessSidebar'
import { PanelManager } from '@/components/common/PanelManager'
import { useAppSelector } from '@/app/hooks'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications'
import { useAutoRefetchOnInvalidation } from '@/hooks/useAutoRefetchOnInvalidation'

interface ImmersiveLayoutProps {
  children: ReactNode
}

export function ImmersiveLayout({ children }: ImmersiveLayoutProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  // Initialize WebSocket connection (this initializes Echo)
  useWebSocket()
  
  // Initialize WebSocket notifications when authenticated
  useWebSocketNotifications({ enabled: isAuthenticated })
  
  // Keep critical queries active so they auto-refetch when tags are invalidated
  useAutoRefetchOnInvalidation()

  if (!isAuthenticated) {
    return <>{children}</>
  }

  // Immersive EVE-like single-screen layout
  return (
    <div className="min-h-screen relative">
      {/* Immersive console background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/images/backgrounds/console.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Cosmic overlay effects */}
      <div className="fixed inset-0 bg-space-dark/60 pointer-events-none" />
      
      {/* Animated stars layer */}
      <div className="fixed inset-0 pointer-events-none cosmic-stars" />
      
      {/* Particle field layer */}
      <div className="fixed inset-0 pointer-events-none cosmic-particles" />
      
      {/* Nebula glow effect */}
      <div className="fixed inset-0 pointer-events-none cosmic-nebula" />
      
      {/* Main content area - immersive */}
      <div className="relative min-h-screen">
        {/* Quick Access Sidebar on left */}
        <QuickAccessSidebar />
        
        {/* Persistent HUD at top */}
        <PersistentHUD />
        
        {/* Panel Manager for sliding panels */}
        <PanelManager />
        
        {/* Main content in center - planets, map, etc */}
        <main className="relative z-0 pt-16 pl-16">
          {children}
        </main>
      </div>
    </div>
  )
}

