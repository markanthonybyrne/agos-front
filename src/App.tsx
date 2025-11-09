import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useMapDataRefresh } from '@/hooks/useMapDataRefresh'
import { AdminGuard } from '@/features/admin/components/AdminGuard'
import { LandingGuard } from '@/components/common/LandingGuard'
import { LandingLayout } from '@/features/landing/LandingLayout'
import { LandingPage } from '@/features/landing/LandingPage'
import { AboutAstralusPage } from '@/features/landing/pages/AboutAstralusPage'
import { LearnToPlayPage } from '@/features/landing/pages/LearnToPlayPage'
import { SupportPage } from '@/features/landing/pages/SupportPage'
import { TermsPage } from '@/features/landing/pages/TermsPage'
import { PrivacyPage } from '@/features/landing/pages/PrivacyPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SocialAuthCallbackPage } from '@/features/auth/SocialAuthCallbackPage'
import { PlayerManual } from '@/features/manual/PlayerManual'
import { Holopad } from '@/features/holopad/Holopad'
import { PlanetsList } from '@/features/planets/PlanetsList'
import { PlanetDetail } from '@/features/planets/PlanetDetail'
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
import { UiGuidePage } from '@/features/guides/UiGuidePage'
import { useSocialAuthProviders } from '@/hooks/useSocialAuthProviders'
import { useAppSelector } from '@/app/hooks'
import { OnboardingExperience } from '@/features/onboarding/OnboardingExperience'
import { ASTRALUS_CINEMATIC, ASTRALUS_TOUR } from '@/features/onboarding/config'
import { useUpdateOnboardingStatusMutation } from '@/api/endpoints/authApi'

function AppContent() {
  // Initialize achievement notifications
  useAchievementNotifications()
  
  // Fetch tick data globally for all authenticated pages
  useGlobalTickData()
  
  // Refresh map data on tick events
  useMapDataRefresh()

  // Discover available social auth providers once per session
  useSocialAuthProviders()

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <LandingGuard>
              <LandingLayout />
            </LandingGuard>
          }
        >
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutAstralusPage />} />
          <Route path="learn" element={<LearnToPlayPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="manual" element={<PlayerManual variant="landing" />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/auth/callback" element={<SocialAuthCallbackPage />} />
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
                  <Route path="/fleets" element={<FleetsPanelRoute />} />
                  <Route path="/fleets/:id" element={<FleetDetail />} />
                  <Route path="/signals" element={<SignalsPanelRoute />} />
                  <Route path="/alliances" element={<PoliticsPage />} />
                  <Route path="/mail" element={<MessagingPage />} />
                  <Route path="/combat" element={<CombatLogsPage />} />
                  <Route path="/rankings" element={<RankingsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/guides/ui" element={<UiGuidePage />} />
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

function FleetsPanelRoute() {
  const navigate = useNavigate()
  const { openPanel, closePanelsByType } = useWindow()
  const openedRef = useRef(false)

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    closePanelsByType(PanelType.FLEETS)
    openPanel(PanelType.FLEETS, PanelSize.XLARGE)
    navigate('/map', { replace: true })
  }, [closePanelsByType, navigate, openPanel])

  return null
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
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [updateOnboardingStatus] = useUpdateOnboardingStatusMutation()

  const shouldShowOnboarding = Boolean(
    isAuthenticated && user && user.onboarding_completed === false && !onboardingDismissed
  )

  const handleOnboardingClose = useCallback(
    async (options?: { markComplete?: boolean }) => {
      setOnboardingDismissed(true)
      if (options?.markComplete === false) {
        return
      }
      try {
        await updateOnboardingStatus({ completed: true }).unwrap()
      } catch (error) {
        console.warn('[Onboarding] Failed to update onboarding status', error)
      }
    },
    [updateOnboardingStatus],
  )

  return (
    <ErrorBoundary>
      {shouldShowOnboarding && (
        <OnboardingExperience
          isOpen
          onClose={async (options) => {
            await handleOnboardingClose(options)
          }}
          cinematic={ASTRALUS_CINEMATIC}
          tour={ASTRALUS_TOUR}
          autoStart
        />
      )}
      {/* Only render app content after data loading is complete */}
      {/* InitialDataLoader handles showing its own loading screen */}
      {dataLoadingComplete && <AppContent />}
      <InitialDataLoader
        onComplete={() => setDataLoadingComplete(true)}
        mode={shouldShowOnboarding ? 'headless' : 'default'}
      />
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
