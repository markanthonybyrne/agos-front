import * as React from 'react'
import { useAppSelector } from '@/app/hooks'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)
  const user = useAppSelector((state) => state.auth.user)
  const location = useLocation()

  console.log('AuthGuard check:', { isAuthenticated, token: !!token, user: !!user, location: location.pathname })

  // If no token or not authenticated, redirect to login
  if (!token || !isAuthenticated) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If we have a token and are authenticated, render the children
  console.log('Authenticated, rendering children')
  return <>{children}</>
}

