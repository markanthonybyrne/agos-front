import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { updatePlanets } from '@/app/slices/planetsSlice'
import { Planet } from '@/types/api.types'

/**
 * Hook to refresh map data when tick events occur
 * This ensures the map stays up-to-date with fleet movements, planet changes, etc.
 */
export function useMapDataRefresh() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const { allPlanets, isLoaded } = useAppSelector((state) => state.planets)
  const refreshInProgressRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || !isLoaded) {
      return
    }

    const handleTickProcessed = async () => {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log('[useMapDataRefresh] Refresh already in progress, skipping...')
        return
      }

      refreshInProgressRef.current = true
      console.log('[useMapDataRefresh] Tick processed, refreshing map data...')

      try {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(
          /\/$/,
          ''
        )

        // Fetch updated planet data in batches
        // Use larger page size to reduce API calls
        const limit = 300
        const maxPlanetsToRefresh = 15000
        const maxParallelRequests = 10

        // Fetch first page to get total count
        const firstPageResponse = await fetch(`${baseUrl}/planets/search?limit=${limit}&offset=0`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!firstPageResponse.ok) {
          throw new Error(`Failed to refresh planets: ${firstPageResponse.status}`)
        }

        const firstPageData = await firstPageResponse.json()
        const total = firstPageData.total || 0
        const totalToRefresh = Math.min(total, maxPlanetsToRefresh)
        const totalPages = Math.ceil(totalToRefresh / limit)

        console.log('[useMapDataRefresh] Refreshing planets:', {
          total,
          totalToRefresh,
          totalPages,
          currentLoaded: allPlanets.length
        })

        // Start with first page
        const updatedPlanets: Planet[] = firstPageData.planets || []
        dispatch(updatePlanets(updatedPlanets))
        let totalUpdated = updatedPlanets.length

        // Fetch remaining pages in parallel chunks
        const remainingPages = totalPages - 1

        if (remainingPages > 0) {
          const allFetchPromises: Promise<{ planets: Planet[] }>[] = []

          for (let page = 1; page < totalPages; page++) {
            const offset = page * limit
            if (offset >= totalToRefresh) break

            allFetchPromises.push(
              fetch(`${baseUrl}/planets/search?limit=${limit}&offset=${offset}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).then(async response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch planets at offset ${offset}: ${response.status}`)
                }
                const data = await response.json()
                return { planets: data.planets || [] }
              })
            )
          }

          // Process in parallel chunks
          const chunkSize = maxParallelRequests

          for (let i = 0; i < allFetchPromises.length; i += chunkSize) {
            const chunk = allFetchPromises.slice(i, i + chunkSize)

            try {
              const chunkResults = await Promise.all(chunk)

              for (const result of chunkResults) {
                if (result.planets.length > 0) {
                  dispatch(updatePlanets(result.planets))
                  totalUpdated += result.planets.length
                }
              }

              console.log('[useMapDataRefresh] Refreshed chunk:', {
                chunkSize: chunk.length,
                totalUpdated
              })
            } catch (error) {
              console.error('[useMapDataRefresh] Error refreshing chunk:', error)
              // Continue with next chunk even if one fails
            }
          }
        }

        console.log('[useMapDataRefresh] Map data refresh complete')
      } catch (error) {
        console.error('[useMapDataRefresh] Error refreshing map data:', error)
      } finally {
        refreshInProgressRef.current = false
      }
    }

    // Listen for tick:processed events
    window.addEventListener('tick:processed', handleTickProcessed)

    return () => {
      window.removeEventListener('tick:processed', handleTickProcessed)
    }
  }, [token, isAuthenticated, isLoaded, dispatch, allPlanets.length])
}

