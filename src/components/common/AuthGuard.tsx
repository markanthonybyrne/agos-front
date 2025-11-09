import * as React from 'react'
import { useAppSelector } from '@/app/hooks'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)
  const verificationRequired = useAppSelector((state) => state.auth.verificationRequired)
  const location = useLocation()

  if (verificationRequired) {
    return <Navigate to="/login" state={{ from: location, reason: 'EMAIL_NOT_VERIFIED' }} replace />
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

