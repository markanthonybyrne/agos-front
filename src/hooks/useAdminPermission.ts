import { useAppSelector } from '@/app/hooks'

/**
 * Hook to check if user has admin role
 */
export function useIsAdmin(): boolean {
  const user = useAppSelector((state) => state.auth.user)
  return user?.roles?.some((role) => role.slug === 'admin') ?? false
}

/**
 * Hook to check if user has a specific permission
 * Note: This checks based on roles. For specific permission checking,
 * the backend should provide permissions array in roles.
 */
export function useHasPermission(permission: string): boolean {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = useIsAdmin()
  
  // Admins typically have all permissions
  if (isAdmin) {
    return true
  }
  
  // Check if user's roles have the permission
  // This assumes roles have a permissions array (backend should provide this)
  return (
    user?.roles?.some((role) => {
      // If role has permissions array, check it
      // This would need to match the backend role structure
      return (role as any).permissions?.includes(permission)
    }) ?? false
  )
}

/**
 * Hook to get user's roles
 */
export function useUserRoles() {
  const user = useAppSelector((state) => state.auth.user)
  return user?.roles ?? []
}

