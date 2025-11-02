import { useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { PermissionGate } from '../components/shared/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { SimulationModeSelector } from '../components/simulations/SimulationModeSelector'
import { SingleCombatSimulator } from '../components/simulations/SingleCombatSimulator'
import { BatchSimulator } from '../components/simulations/BatchSimulator'
import { FleetTester } from '../components/simulations/FleetTester'
import { DefenceTester } from '../components/simulations/DefenceTester'

type SimulationMode = 'single' | 'batch' | 'fleet-test' | 'defence-test'

export function SimulationsPage() {
  const [mode, setMode] = useState<SimulationMode>('single')

  const renderContent = () => {
    switch (mode) {
      case 'single':
        return <SingleCombatSimulator />
      case 'batch':
        return <BatchSimulator />
      case 'fleet-test':
        return <FleetTester />
      case 'defence-test':
        return <DefenceTester />
    }
  }

  return (
    <PermissionGate permission={PERMISSIONS.SIMULATE_COMBATS}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading">Battle Simulations</h2>
            <p className="text-muted-foreground">
              Simulate combat scenarios to test balance and outcomes
            </p>
          </div>

          <SimulationModeSelector mode={mode} onModeChange={setMode} />

          <div className="mt-6">
            {renderContent()}
          </div>
        </div>
      </AdminLayout>
    </PermissionGate>
  )
}

