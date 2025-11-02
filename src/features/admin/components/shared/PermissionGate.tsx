import { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { hasPermission } from '@/lib/permissions'

interface PermissionGateProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const user = useSelector((state: RootState) => state.auth.user)
  const hasAccess = hasPermission(user, permission)
  
  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this feature.
          </p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

