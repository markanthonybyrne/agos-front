import { AdminLayout } from '../components/AdminLayout'
import { PermissionGate } from '../components/shared/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export function TickTestingPage() {
  return (
    <PermissionGate permission={PERMISSIONS.RUN_TICK_TESTS}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading">Tick Testing</h2>
            <p className="text-muted-foreground">Test tick processing without persisting changes</p>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>Tick testing features coming soon...</p>
          </div>
        </div>
      </AdminLayout>
    </PermissionGate>
  )
}

