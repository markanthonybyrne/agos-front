import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { apiSlice } from '@/api/apiSlice'
import { useGetPlanetsQuery } from '@/api/endpoints/planetsApi'
import { useGetFleetsQuery } from '@/api/endpoints/fleetsApi'
import { useGetMyResearchQuery } from '@/api/endpoints/researchApi'
import { useGetMeQuery } from '@/api/endpoints/authApi'

/**
 * Hook that ensures critical queries stay active and refetch when their tags are invalidated.
 * RTK Query automatically refetches active queries when their tags are invalidated,
 * so keeping these queries active ensures automatic updates via WebSocket events.
 */
export function useAutoRefetchOnInvalidation() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  // Keep these queries active so they automatically refetch when tags are invalidated
  // These are critical queries that need to update in real-time
  useGetPlanetsQuery(undefined, { skip: !isAuthenticated })
  useGetFleetsQuery(undefined, { skip: !isAuthenticated })
  useGetMyResearchQuery(undefined, { skip: !isAuthenticated })
  useGetMeQuery(undefined, { skip: !isAuthenticated })

  // RTK Query automatically refetches active queries when their tags are invalidated
  // So by keeping these queries active here, they will refetch whenever WebSocket
  // events invalidate their tags
}

