import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthGuard } from '@/components/common/AuthGuard'
import { TickCountdownTimer } from '@/components/common/TickCountdownTimer'
import { AuthTransitionOverlay } from '@/components/common/AuthTransitionOverlay'
import { InitialDataLoader } from '@/components/common/InitialDataLoader'
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications'
import { useGlobalTickData } from '@/hooks/useGlobalTickData'
import { useTutorialDetection } from '@/hooks/useTutorialDetection'
import { useMapDataRefresh } from '@/hooks/useMapDataRefresh'
import { TutorialManager } from '@/components/tutorial/TutorialManager'
import { AdminGuard } from '@/features/admin/components/AdminGuard'
import { LandingGuard } from '@/components/common/LandingGuard'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlayerManual } from '@/features/manual/PlayerManual'
import { Holopad } from '@/features/holopad/Holopad'
import { PlanetsList } from '@/features/planets/PlanetsList'
import { PlanetDetail } from '@/features/planets/PlanetDetail'
import { FleetsPage } from '@/features/fleets/FleetsPage'
import { FleetDetail } from '@/features/fleets/FleetDetail'
import { GalaxyMap } from '@/components/map/GalaxyMap'
import { SystemViewScreen } from '@/components/map/SystemViewScreen'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { useWindow } from '@/components/common/WindowManager'
import { AlliancesPage } from '@/features/alliances/AlliancesPage'
import { PoliticsPage } from '@/features/politics/PoliticsPage'
import { RankingsPage } from '@/features/rankings/RankingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TechTreeScreen } from '@/features/tech-tree/TechTreeScreen'
import { CombatLogsPage } from '@/features/combat/CombatLogsPage'
import { AdminPage } from '@/features/admin/AdminPage'
import { UsersPage } from '@/features/admin/routes/UsersPage'
import { EmpiresPage } from '@/features/admin/routes/EmpiresPage'
import { PlanetsPage } from '@/features/admin/routes/PlanetsPage'
import { FleetsPage as AdminFleetsPage } from '@/features/admin/routes/FleetsPage'
import { AlliancesPage as AdminAlliancesPage } from '@/features/admin/routes/AlliancesPage'
import { MailPage } from '@/features/admin/routes/MailPage'
import { ChatPage } from '@/features/admin/routes/ChatPage'
import { AnnouncementsPage } from '@/features/admin/routes/AnnouncementsPage'
import { TicksPage } from '@/features/admin/routes/TicksPage'
import { ResourcesPage } from '@/features/admin/routes/ResourcesPage'
import { CombatsPage } from '@/features/admin/routes/CombatsPage'
import { SimulationsPage } from '@/features/admin/routes/SimulationsPage'
import { TickTestingPage } from '@/features/admin/routes/TickTestingPage'
import { GameDefinitionsPage } from '@/features/admin/routes/GameDefinitionsPage'
import { QuantumCreditsPage } from '@/features/admin/routes/QuantumCreditsPage'
import { BoostersPage } from '@/features/admin/routes/BoostersPage'
import { AdminPanelWrapper } from '@/features/admin/components/AdminPanelWrapper'
import { PanelType, PanelSize } from '@/app/slices/panelSlice'

function AppContent() {
  // Initialize achievement notifications
  useAchievementNotifications()
  
  // Fetch tick data globally for all authenticated pages
  useGlobalTickData()
  
  // Detect and trigger tutorial for first-time users
  useTutorialDetection()
  
  // Refresh map data on tick events
  useMapDataRefresh()

  return (
    <>
      <TutorialManager />
      <Routes>
        <Route 
          path="/" 
          element={
            <LandingGuard>
              <LandingPage />
            </LandingGuard>
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/manual" element={<PlayerManual />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout>
                <Routes>
                  <Route path="/holopad" element={<Navigate to="/map" replace />} />
                  <Route path="/map" element={<GalaxyMap />} />
                  <Route path="/map/system/:region/:system" element={<SystemViewScreen />} />
                  <Route path="/planets" element={<PlanetsList />} />
                  <Route path="/planets/:id" element={<PlanetDetail />} />
                  <Route path="/fleets" element={<FleetsPage />} />
                  <Route path="/fleets/:id" element={<FleetDetail />} />
                  <Route path="/signals" element={<SignalsPanelRoute />} />
                  <Route path="/alliances" element={<PoliticsPage />} />
                  <Route path="/mail" element={<MessagingPage />} />
                  <Route path="/combat" element={<CombatLogsPage />} />
                  <Route path="/rankings" element={<RankingsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/tech-tree" element={<TechTreeScreen />} />
                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminGuard>
                        <AdminPanelWrapper>
                          <Routes>
                            <Route path="/" element={<AdminPage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/empires" element={<EmpiresPage />} />
                            <Route path="/planets" element={<PlanetsPage />} />
                            <Route path="/fleets" element={<AdminFleetsPage />} />
                            <Route path="/alliances" element={<AdminAlliancesPage />} />
                            <Route path="/mail" element={<MailPage />} />
                            <Route path="/chat" element={<ChatPage />} />
                            <Route path="/announcements" element={<AnnouncementsPage />} />
                            <Route path="/ticks" element={<TicksPage />} />
                            <Route path="/resources" element={<ResourcesPage />} />
                            <Route path="/combats" element={<CombatsPage />} />
                            <Route path="/simulations" element={<SimulationsPage />} />
                            <Route path="/tick-testing" element={<TickTestingPage />} />
                            <Route path="/definitions" element={<GameDefinitionsPage />} />
                            <Route path="/quantum-credits" element={<QuantumCreditsPage />} />
                            <Route path="/boosters" element={<BoostersPage />} />
                          </Routes>
                        </AdminPanelWrapper>
                      </AdminGuard>
                    }
                  />
                  {/* Default route - redirect to map */}
                  <Route path="/" element={<Navigate to="/map" replace />} />
                </Routes>
              </MainLayout>
            </AuthGuard>
          }
        />
      </Routes>
    </>
  )
}

function SignalsPanelRoute() {
  const navigate = useNavigate()
  const { openPanel } = useWindow()
  const openedRef = useRef(false)

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    openPanel(PanelType.SIGNALS, PanelSize.LARGE)
    navigate('/map', { replace: true })
  }, [openPanel, navigate])

  return null
}

function App() {
  const [dataLoadingComplete, setDataLoadingComplete] = useState(false)

  return (
    <ErrorBoundary>
      {/* Only render app content after data loading is complete */}
      {/* InitialDataLoader handles showing its own loading screen */}
      {dataLoadingComplete && <AppContent />}
      <InitialDataLoader onComplete={() => setDataLoadingComplete(true)} />
      <TickCountdownTimer />
      <AuthTransitionOverlay />
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          className: 'toast-glass',
          classNames: {
            toast: 'toast-glass-base',
            title: 'toast-title',
            description: 'toast-description',
            success: 'toast-success',
            error: 'toast-error',
            info: 'toast-info',
            warning: 'toast-warning',
          },
          duration: 4000,
        }}
      />
    </ErrorBoundary>
  )
}

export default App
