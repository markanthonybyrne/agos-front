import { AdminLayout } from '../components/AdminLayout'
import { PermissionGate } from '../components/shared/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export function GameDefinitionsPage() {
  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_DEFINITIONS}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-heading">Game Definitions</h2>
            <p className="text-muted-foreground">Manage facility, ship, defence, and research definitions</p>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>Game definitions features coming soon...</p>
          </div>
        </div>
      </AdminLayout>
    </PermissionGate>
  )
}

