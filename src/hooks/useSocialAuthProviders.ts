import { useEffect } from 'react'
import { useGetSocialProvidersQuery } from '@/api/endpoints/authApi'
import { useAppSelector } from '@/app/hooks'

/**
 * Hook to ensure social auth providers are discovered and cached client-side.
 * Fetches once per session unless explicitly cleared.
 */
export function useSocialAuthProviders() {
  const providersLoaded = useAppSelector((state) => state.auth.socialProvidersLoaded)
  const { refetch, isFetching, isError } = useGetSocialProvidersQuery(undefined, {
    skip: providersLoaded,
    refetchOnMountOrArgChange: !providersLoaded,
  })

  // If the query was skipped due to cached data but the cache is empty (e.g., localStorage wiped),
  // allow consumers to trigger a refetch.
  useEffect(() => {
    if (!providersLoaded && !isFetching && isError) {
      refetch()
    }
  }, [providersLoaded, isFetching, isError, refetch])
}

