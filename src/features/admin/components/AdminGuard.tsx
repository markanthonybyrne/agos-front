import * as React from 'react'
import { useAppSelector } from '@/app/hooks'
import { Navigate, useLocation } from 'react-router-dom'
import { useIsAdmin } from '@/hooks/useAdminPermission'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)
  const isAdmin = useIsAdmin()
  const location = useLocation()

  // First check authentication
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Then check admin role
  if (!isAdmin) {
    return (
      <Navigate
        to="/holopad"
        state={{
          from: location,
          error: 'You do not have permission to access the admin portal',
        }}
        replace
      />
    )
  }

  return <>{children}</>
}

