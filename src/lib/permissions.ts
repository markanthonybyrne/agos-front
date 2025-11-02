import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'

export const PERMISSIONS = {
  SIMULATE_COMBATS: 'simulate_combats',
  RUN_TICK_TESTS: 'run_tick_tests',
  MANAGE_DEFINITIONS: 'manage_game_definitions',
  ROLLBACK_DEFINITIONS: 'rollback_definitions',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Check if the current user has a specific permission
 */
export function hasPermission(user: { roles?: Array<{ permissions?: string[] }> } | null, permission: string): boolean {
  if (!user?.roles) return false
  
  return user.roles.some((role: any) => 
    role.permissions?.includes(permission)
  )
}

/**
 * React hook to check if current user has a permission
 */
export function usePermission(permission: Permission): boolean {
  const user = useSelector((state: RootState) => state.auth.user)
  return hasPermission(user, permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: { roles?: Array<{ permissions?: string[] }> } | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

