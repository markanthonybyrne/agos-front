import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthGuard } from '@/components/common/AuthGuard'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlayerManual } from '@/features/manual/PlayerManual'
import { Holopad } from '@/features/holopad/Holopad'
import { PlanetsList } from '@/features/planets/PlanetsList'
import { PlanetDetail } from '@/features/planets/PlanetDetail'
import { FleetsPage } from '@/features/fleets/FleetsPage'
import { FleetDetail } from '@/features/fleets/FleetDetail'
import { UniverseMap } from '@/features/map/UniverseMap'
import { MessagingPage } from '@/features/messaging/MessagingPage'
import { SignalsPage } from '@/features/signals/SignalsPage'
import { AlliancesPage } from '@/features/alliances/AlliancesPage'
import { PoliticsPage } from '@/features/politics/PoliticsPage'
import { RankingsPage } from '@/features/rankings/RankingsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { CombatLogsPage } from '@/features/combat/CombatLogsPage'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/manual" element={<PlayerManual />} />
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
                          <Route path="/alliances" element={<PoliticsPage />} />
                          <Route path="/mail" element={<MessagingPage />} />
                          <Route path="/combat" element={<CombatLogsPage />} />
                          <Route path="/rankings" element={<RankingsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
              </MainLayout>
            </AuthGuard>
          }
        />
      </Routes>
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
