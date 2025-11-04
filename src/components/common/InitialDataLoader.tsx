import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  setLoading,
  setLoadingPhase,
  setLoadingProgress,
  setAllPlanets,
  addPlanets,
} from '@/app/slices/planetsSlice'
import { Planet } from '@/types/api.types'

interface InitialDataLoaderProps {
  onComplete: () => void
}

export function InitialDataLoader({ onComplete }: InitialDataLoaderProps) {
  const dispatch = useAppDispatch()
  const { allPlanets, isLoading, loadingProgress, loadingPhase, isLoaded } = useAppSelector(
    (state) => state.planets
  )
  const token = useAppSelector((state) => state.auth.token)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [started, setStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    // Only handle loading if authenticated
    if (!isAuthenticated || !token) {
      if (hasCompleted) {
        setHasCompleted(false)
      }
      return
    }

    // If already loaded and not loading, complete immediately
    if (isLoaded && allPlanets.length > 0 && !isLoading && !hasCompleted) {
      setHasCompleted(true)
      setTimeout(() => onComplete(), 300)
      return
    }

    // If already started, don't start again
    if (started || isLoading) {
      return
    }

    // Only start if we need to load planets
    if (!isLoaded || allPlanets.length === 0) {
      const loadAllPlanets = async () => {
        setStarted(true)
        dispatch(setLoading(true))
        dispatch(setLoadingPhase('initializing'))

        try {
          // Phase 1: Initialize and fetch first page
          dispatch(setLoadingProgress(5))
          await new Promise((resolve) => setTimeout(resolve, 300))

          dispatch(setLoadingPhase('fetching'))
          const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(
            /\/$/,
            ''
          )

          // Fetch first page to get total count
          // API maximum limit is 100, so we use 100 per page
          const limit = 100
          const firstPageResponse = await fetch(`${baseUrl}/planets/search?limit=${limit}&offset=0`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!firstPageResponse.ok) {
            throw new Error(`Failed to fetch planets: ${firstPageResponse.status}`)
          }

          const firstPageData = await firstPageResponse.json()
          const planets: Planet[] = firstPageData.planets || []
          const total = firstPageData.total || 0
          const maxPlanetsToLoad = 15000

          console.log('[InitialDataLoader] Starting planet load:', { total, firstPagePlanets: planets.length, maxToLoad: maxPlanetsToLoad })

          dispatch(setLoadingProgress(10))
          dispatch(addPlanets(planets))

          // Phase 2: Continue loading remaining planets in parallel batches
          let offset = planets.length
          const totalToLoad = Math.min(total, maxPlanetsToLoad)
          const batchSize = 10 // Fetch 10 pages in parallel (10 * 100 = 1000 planets per batch)
          const batchDelay = 100 // Delay between batches in ms

          console.log('[InitialDataLoader] Loading planets:', { current: planets.length, target: totalToLoad, total, batchSize })

          while (planets.length < totalToLoad && offset < total) {
            // Calculate how many pages to fetch in this batch
            const remainingPages = Math.ceil((totalToLoad - planets.length) / limit)
            const pagesInBatch = Math.min(batchSize, remainingPages)
            
            // Create array of fetch promises for this batch
            const fetchPromises = []
            for (let i = 0; i < pagesInBatch; i++) {
              const currentOffset = offset + (i * limit)
              if (currentOffset >= total) break
              
              fetchPromises.push(
                fetch(`${baseUrl}/planets/search?limit=${limit}&offset=${currentOffset}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }).then(response => {
                  if (!response.ok) {
                    throw new Error(`Failed to fetch planets at offset ${currentOffset}: ${response.status}`)
                  }
                  return response.json()
                })
              )
            }

            // Fetch all pages in this batch in parallel
            try {
              const batchResults = await Promise.all(fetchPromises)
              
              // Process all results from this batch
              let batchPlanetCount = 0
              let reachedEnd = false
              
              for (const data of batchResults) {
                const newPlanets = data.planets || []
                if (newPlanets.length > 0) {
                  planets.push(...newPlanets)
                  dispatch(addPlanets(newPlanets))
                  batchPlanetCount += newPlanets.length
                }
                
                // If we got fewer planets than requested, we've reached the end
                if (newPlanets.length < limit) {
                  reachedEnd = true
                }
              }

              // Update progress
              const progress = 10 + (planets.length / totalToLoad) * 80
              dispatch(setLoadingProgress(progress))

              console.log('[InitialDataLoader] Loaded parallel batch:', {
                batchSize: pagesInBatch,
                fetched: batchPlanetCount,
                totalLoaded: planets.length,
                target: totalToLoad,
                remaining: totalToLoad - planets.length
              })

              offset += pagesInBatch * limit

              // If we reached the end or got enough planets, break
              if (reachedEnd || planets.length >= totalToLoad) {
                if (reachedEnd) {
                  console.log('[InitialDataLoader] Reached end of data (got fewer than requested)')
                }
                break
              }

              // Small delay between batches to avoid overwhelming the server
              if (planets.length < totalToLoad) {
                await new Promise((resolve) => setTimeout(resolve, batchDelay))
              }
            } catch (error) {
              console.error('[InitialDataLoader] Error fetching batch:', error)
              // Continue with next batch even if one fails
              offset += pagesInBatch * limit
              // Small delay before retrying
              await new Promise((resolve) => setTimeout(resolve, batchDelay))
            }
          }

          console.log('[InitialDataLoader] Finished loading planets:', { loaded: planets.length, target: totalToLoad, total })

          // Phase 3: Processing
          dispatch(setLoadingPhase('processing'))
          dispatch(setLoadingProgress(95))
          await new Promise((resolve) => setTimeout(resolve, 200))

          // Phase 4: Complete
          dispatch(setAllPlanets(planets))
          dispatch(setLoadingProgress(100))
          dispatch(setLoadingPhase('complete'))

          // Small delay before completing
          setHasCompleted(true)
          setTimeout(() => {
            onComplete()
          }, 500)
        } catch (error) {
          console.error('Error loading planets:', error)
          dispatch(setLoading(false))
          // Still complete to allow user to continue
          setHasCompleted(true)
          setTimeout(() => {
            onComplete()
          }, 500)
        }
      }

      loadAllPlanets()
    }
  }, [token, started, allPlanets.length, isLoading, isLoaded, isAuthenticated, hasCompleted, dispatch, onComplete])

  // Only show loader if authenticated, loading, and not completed
  if (!isAuthenticated || !token || (!isLoading && isLoaded && allPlanets.length > 0) || hasCompleted) {
    return null
  }

  const getPhaseLabel = () => {
    switch (loadingPhase) {
      case 'initializing':
        return 'Initializing universe...'
      case 'fetching':
        return 'Loading universal planetary data...'
      case 'processing':
        return 'Processing coordinates...'
      case 'complete':
        return 'Complete!'
      default:
        return 'Preparing...'
    }
  }

  const getPhaseDescription = () => {
    if (loadingPhase === 'fetching') {
      return `${allPlanets.length.toLocaleString()} planets loaded`
    }
    return ''
  }

  // Calculate progress for the circle (similar to tick countdown)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference * (1 - loadingProgress / 100)

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Glassy blur overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Timer circle (similar to tick countdown) */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse" />
          
          {/* SVG Circle */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-border/30"
            />
            
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-cyan-400 transition-all duration-300"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))',
              }}
            />
          </svg>
          
          {/* Progress display */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="font-mono font-bold text-cyan-400 glow-cyan text-2xl">
              {Math.round(loadingProgress)}%
            </span>
          </div>
        </div>
        
        {/* Phase label */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground glow-cyan">
            {getPhaseLabel()}
          </h3>
          {getPhaseDescription() && (
            <p className="text-sm text-muted-foreground font-mono">
              {getPhaseDescription()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

