import * as React from 'react'
import { useAppSelector } from '@/app/hooks'
import { Navigate } from 'react-router-dom'

interface LandingGuardProps {
  children: React.ReactNode
}

export function LandingGuard({ children }: LandingGuardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)

  // If authenticated, redirect to holopad
  if (token && isAuthenticated) {
    return <Navigate to="/holopad" replace />
  }

  // If not authenticated, show landing page
  return <>{children}</>
}



