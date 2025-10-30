import { useAppSelector } from '@/app/hooks'

export function useAuth() {
  const user = useAppSelector((state) => state.auth.user)
  const empire = useAppSelector((state) => state.auth.empire)
  const token = useAppSelector((state) => state.auth.token)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return {
    user,
    empire,
    token,
    isAuthenticated,
  }
}

