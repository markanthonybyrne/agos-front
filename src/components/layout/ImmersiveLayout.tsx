import { ReactNode } from 'react'
import { PersistentHUD } from './PersistentHUD'
import { HubSidebar } from './HubSidebar'
import { WindowManager } from '@/components/common/WindowManager'
import { useAppSelector } from '@/app/hooks'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications'
import { useAutoRefetchOnInvalidation } from '@/hooks/useAutoRefetchOnInvalidation'
import { BACKGROUNDS } from '@/lib/backgroundImages'

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
          backgroundImage: `url(${BACKGROUNDS.console})`,
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
        {/* Hub Sidebar on left */}
        <HubSidebar />
        
        {/* Persistent HUD at top */}
        <PersistentHUD />
        
        {/* Window Manager for desktop windows */}
        <WindowManager />
        
                {/* Main content in center - planets, map, etc */}
                {/* Padding adjusts based on sidebar state (sidebar component handles its own state) */}
                {/* Sidebar is now 48px wide */}
                <main className="relative z-0 pt-16 pl-12">
                  {children}
                </main>
      </div>
    </div>
  )
}

