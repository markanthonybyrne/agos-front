import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthGuard } from '@/components/common/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { Holopad } from '@/features/holopad/Holopad'
import { PlanetsList } from '@/features/planets/PlanetsList'
import { PlanetDetail } from '@/features/planets/PlanetDetail'
import { FleetsPage } from '@/features/fleets/FleetsPage'
import { FleetDetail } from '@/features/fleets/FleetDetail'
import { UniverseMap } from '@/features/map/UniverseMap'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { SignalsPage } from '@/features/signals/SignalsPage'
import { AlliancesPage } from '@/features/alliances/AlliancesPage'
import { RankingsPage } from '@/features/rankings/RankingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <MainLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/holopad" replace />} />
                          <Route path="/holopad" element={<Holopad />} />
                          <Route path="/map" element={<UniverseMap />} />
                          <Route path="/planets" element={<PlanetsList />} />
                          <Route path="/planets/:id" element={<PlanetDetail />} />
                          <Route path="/fleets" element={<FleetsPage />} />
                          <Route path="/fleets/:id" element={<FleetDetail />} />
                          <Route path="/signals" element={<SignalsPage />} />
                          <Route path="/alliances" element={<AlliancesPage />} />
                          <Route path="/mail" element={<MessagingPage />} />
                          <Route path="/rankings" element={<RankingsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
              </MainLayout>
            </AuthGuard>
          }
        />
      </Routes>
      <Toaster position="top-right" theme="dark" />
    </ErrorBoundary>
  )
}

export default App
