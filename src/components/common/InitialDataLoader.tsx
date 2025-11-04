import { useEffect, useState, useRef } from 'react'
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

const SESSION_LOADED_KEY = 'planets_session_loaded' // Track if loaded this session

export function InitialDataLoader({ onComplete }: InitialDataLoaderProps) {
  const dispatch = useAppDispatch()
  const { allPlanets, isLoading, loadingProgress, loadingPhase, isLoaded, lastLoadedAt } = useAppSelector(
    (state) => state.planets
  )
  const token = useAppSelector((state) => state.auth.token)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const hasLoadedOnceRef = useRef(false) // Track if we've loaded once this session
  const loaderStartTimeRef = useRef<number | null>(null) // Track when loader started showing
  const MIN_LOADER_DISPLAY_TIME = 1500 // Minimum 1.5 seconds to show loader for visual feedback
  
  // Check if this is a fresh login (token just set) vs page reload (token already in localStorage)
  // We use sessionStorage to track if we've loaded this browser session
  const hasLoadedThisSession = useRef(sessionStorage.getItem(SESSION_LOADED_KEY) === 'true')

  useEffect(() => {
    // Only handle loading if authenticated
    if (!isAuthenticated || !token) {
      if (hasCompleted) {
        setHasCompleted(false)
        hasLoadedOnceRef.current = false
        setShowLoader(false)
        loaderStartTimeRef.current = null
        hasLoadedThisSession.current = false
        sessionStorage.removeItem(SESSION_LOADED_KEY)
      }
      return
    }

    // Only load on fresh login (not on page reload)
    // If we've already loaded this session, skip loading (use cached data)
    if (hasLoadedThisSession.current) {
      if (!hasCompleted) {
        // Use cached data, complete immediately without showing loader
        setHasCompleted(true)
        setTimeout(() => onComplete(), 100)
      }
      return
    }

    // If already loaded (from cache) and not loading, show loader briefly then complete
    // This ensures we show the loader on fresh login even if cached data exists
    if (isLoaded && allPlanets.length > 0 && !isLoading) {
      if (!hasCompleted) {
        // Start showing loader if not already showing
        if (!showLoader) {
          setShowLoader(true)
          loaderStartTimeRef.current = Date.now()
          
          // Set up loading state for visual feedback
          // Reset progress to show animation even with cached data
          dispatch(setLoadingPhase('initializing'))
          dispatch(setLoadingProgress(0))
          
          // Animate progress quickly for cached data
          setTimeout(() => {
            dispatch(setLoadingProgress(30))
            dispatch(setLoadingPhase('fetching'))
          }, 150)
          
          setTimeout(() => {
            dispatch(setLoadingProgress(70))
            dispatch(setLoadingPhase('processing'))
          }, 500)
          
          setTimeout(() => {
            dispatch(setLoadingProgress(100))
            dispatch(setLoadingPhase('complete'))
          }, 900)
        }
        
        // Ensure minimum display time has passed before completing
        const checkCompletion = () => {
          const elapsed = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0
          if (elapsed >= MIN_LOADER_DISPLAY_TIME) {
            setHasCompleted(true)
            hasLoadedOnceRef.current = true
            hasLoadedThisSession.current = true
            sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
            setTimeout(() => onComplete(), 300)
          } else {
            setTimeout(checkCompletion, 100)
          }
        }
        checkCompletion()
      }
      return
    }

    // If we've already loaded once this session, show loader briefly then complete
    // Data will be refreshed via periodic updates or WebSocket events
    if (hasLoadedOnceRef.current && isLoaded) {
      if (!hasCompleted) {
        // Show loader briefly for visual feedback
        if (!showLoader) {
          setShowLoader(true)
          loaderStartTimeRef.current = Date.now()
          dispatch(setLoadingPhase('processing'))
          dispatch(setLoadingProgress(95))
          
          setTimeout(() => {
            dispatch(setLoadingProgress(100))
            dispatch(setLoadingPhase('complete'))
          }, 500)
        }
        
        // Ensure minimum display time
        const checkCompletion = () => {
          const elapsed = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0
          if (elapsed >= MIN_LOADER_DISPLAY_TIME) {
            setHasCompleted(true)
            setTimeout(() => onComplete(), 300)
          } else {
            setTimeout(checkCompletion, 100)
          }
        }
        checkCompletion()
      }
      return
    }

    // If already loading, wait
    if (isLoading) {
      return
    }

    // Only start if we need to load planets (not loaded and no cache)
    if (!isLoaded || allPlanets.length === 0) {
      const loadAllPlanets = async () => {
        hasLoadedOnceRef.current = true
        setShowLoader(true)
        loaderStartTimeRef.current = Date.now()
        dispatch(setLoading(true))
        dispatch(setLoadingPhase('initializing'))

        try {
          // Phase 1: Initialize and fetch first page to get total count
          dispatch(setLoadingProgress(2))
          dispatch(setLoadingPhase('fetching'))
          
          const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(
            /\/$/,
            ''
          )

          // Use larger page size to reduce API calls - 300 items per page
          const limit = 300
          const maxPlanetsToLoad = 15000
          const maxParallelRequests = 10 // Fetch up to 10 pages in parallel (10 * 300 = 3000 planets)
          
          // Fetch first page to get total count
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
          const total = firstPageData.total || 0
          const firstPagePlanets = firstPageData.planets || []
          
          // Detect actual limit - API might return fewer than requested
          const actualLimit = firstPagePlanets.length
          const effectiveLimit = actualLimit > 0 ? actualLimit : limit
          
          // If API returned less than requested, it likely has a max limit
          if (actualLimit < limit && actualLimit > 0) {
            console.warn(`[InitialDataLoader] API returned ${actualLimit} planets per page (requested ${limit}). API likely has a max limit of ${actualLimit}.`)
          }
          
          const totalToLoad = Math.min(total, maxPlanetsToLoad)
          const totalPages = Math.ceil(totalToLoad / effectiveLimit)

          console.log('[InitialDataLoader] Starting optimized planet load:', { 
            apiTotal: total,
            maxPlanetsToLoad,
            totalToLoad, 
            requestedLimit: limit,
            actualLimit: effectiveLimit,
            totalPages, 
            maxParallel: maxParallelRequests,
            firstPagePlanets: firstPagePlanets.length,
            expectedTotalPages: Math.ceil(totalToLoad / effectiveLimit)
          })

          // Warn if API total is less than expected
          if (total < maxPlanetsToLoad) {
            console.warn(`[InitialDataLoader] API reports only ${total} planets, but we want to load ${maxPlanetsToLoad}. Will load ${totalToLoad}.`)
          }

          // Start with first page
          const allPlanets: Planet[] = firstPagePlanets
          dispatch(setLoadingProgress(5))
          dispatch(addPlanets(allPlanets))

          // Phase 2: Fetch all remaining pages in parallel chunks
          // Calculate how many parallel requests we need
          const remainingPages = totalPages - 1
          
          if (remainingPages > 0) {
            // Create all fetch promises upfront
            const allFetchPromises: Promise<{ planets: Planet[]; offset: number }>[] = []
            
            // Create fetch promises for all remaining pages
            // Use effectiveLimit (actual API limit) not requested limit for offset calculation
            for (let page = 1; page < totalPages; page++) {
              const offset = page * effectiveLimit
              
              // Don't break early - create all promises even if offset seems high
              // The API might have pagination quirks, so fetch all pages
              // Use effectiveLimit in the request URL to match what API actually returns
              allFetchPromises.push(
                fetch(`${baseUrl}/planets/search?limit=${effectiveLimit}&offset=${offset}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }).then(async response => {
                  if (!response.ok) {
                    throw new Error(`Failed to fetch planets at offset ${offset}: ${response.status}`)
                  }
                  const data = await response.json()
                  const planets = data.planets || []
                  console.log(`[InitialDataLoader] Fetched page ${page} (offset ${offset}): ${planets.length} planets returned`)
                  return { planets, offset, page }
                }).catch(error => {
                  console.error(`[InitialDataLoader] Error fetching page ${page} (offset ${offset}):`, error)
                  return { planets: [], offset, page }
                })
              )
            }

            console.log('[InitialDataLoader] Created fetch promises:', {
              remainingPages,
              totalPages,
              promisesCreated: allFetchPromises.length,
              expectedPromises: totalPages - 1,
              actualLimit: effectiveLimit,
              requestedLimit: limit,
              lastOffset: (totalPages - 1) * effectiveLimit,
              totalToLoad,
              firstOffset: effectiveLimit,
              lastOffsetCalculated: (totalPages - 1) * effectiveLimit,
              willFetchUpTo: (totalPages - 1) * effectiveLimit + effectiveLimit,
              estimatedPlanets: (totalPages - 1) * effectiveLimit + firstPagePlanets.length
            })
            
            // Verify we created enough promises
            if (allFetchPromises.length < totalPages - 1) {
              console.error(`[InitialDataLoader] ⚠️ WARNING: Only created ${allFetchPromises.length} promises but need ${totalPages - 1} for ${totalToLoad} planets!`)
            }
            
            // Warn if effective limit is different from requested
            if (effectiveLimit !== limit) {
              console.warn(`[InitialDataLoader] ⚠️ Using effective limit of ${effectiveLimit} instead of requested ${limit}. This means we need ${totalPages} pages instead of ${Math.ceil(totalToLoad / limit)}.`)
            }

            // Process in parallel chunks to avoid overwhelming the server
            // but maximize parallelism
            const chunkSize = maxParallelRequests
            const totalChunks = Math.ceil(allFetchPromises.length / chunkSize)
            
            console.log('[InitialDataLoader] Starting to process chunks:', {
              totalPromises: allFetchPromises.length,
              chunkSize,
              totalChunks,
              willProcessAll: true
            })
            
            for (let i = 0; i < allFetchPromises.length; i += chunkSize) {
              const chunk = allFetchPromises.slice(i, i + chunkSize)
              const chunkIndex = Math.floor(i / chunkSize) + 1
              const chunksRemaining = Math.ceil((allFetchPromises.length - (i + chunkSize)) / chunkSize)
              
              console.log(`[InitialDataLoader] Processing chunk ${chunkIndex}/${totalChunks} (${chunk.length} promises, ${chunksRemaining} remaining)`)
              
              try {
                // Fetch chunk in parallel
                const chunkResults = await Promise.all(chunk)
                
                // Process all results from this chunk
                let chunkPlanetCount = 0
                for (const result of chunkResults) {
                  if (result.planets && result.planets.length > 0) {
                    allPlanets.push(...result.planets)
                    dispatch(addPlanets(result.planets))
                    chunkPlanetCount += result.planets.length
                  } else {
                    console.warn(`[InitialDataLoader] Empty result from page ${result.page || 'unknown'} (offset ${result.offset || 'unknown'})`)
                  }
                }

                // Update progress based on actual planets loaded
                const progress = 5 + ((allPlanets.length / totalToLoad) * 90)
                dispatch(setLoadingProgress(Math.min(95, progress)))

                console.log('[InitialDataLoader] Loaded parallel chunk:', {
                  chunkIndex,
                  totalChunks,
                  chunksRemaining,
                  chunkSize: chunk.length,
                  chunkPlanets: chunkPlanetCount,
                  totalLoaded: allPlanets.length,
                  target: totalToLoad,
                  progress: Math.round(progress),
                  remaining: totalToLoad - allPlanets.length,
                  percentageComplete: Math.round((allPlanets.length / totalToLoad) * 100) + '%',
                  willContinue: i + chunkSize < allFetchPromises.length,
                  nextChunkStart: i + chunkSize,
                  totalPromises: allFetchPromises.length
                })
                
                // NEVER break early - always process ALL chunks
                // Even if we've loaded enough planets, continue to ensure we get all data
                if (i + chunkSize >= allFetchPromises.length) {
                  console.log(`[InitialDataLoader] ✅ Processed all ${totalChunks} chunks. Total loaded: ${allPlanets.length}`)
                } else {
                  console.log(`[InitialDataLoader] Continuing to next chunk...`)
                }
              } catch (error) {
                console.error(`[InitialDataLoader] Error fetching chunk ${chunkIndex}:`, error)
                // Continue with next chunk even if one fails - don't break the loop
              }
            }
            
            console.log(`[InitialDataLoader] ✅ Finished processing all ${totalChunks} chunks. Final count: ${allPlanets.length} planets`)
          }

          // Verify we actually loaded all planets
          const actualLoaded = allPlanets.length
          console.log('[InitialDataLoader] Finished loading planets:', { 
            loaded: actualLoaded, 
            target: totalToLoad, 
            total,
            success: actualLoaded >= totalToLoad,
            missing: totalToLoad - actualLoaded
          })

          // If we didn't load all planets, try to fetch remaining ones
          // Use effectiveLimit for calculations
          if (actualLoaded < totalToLoad && actualLoaded < total) {
            const missing = totalToLoad - actualLoaded
            const additionalPagesNeeded = Math.ceil(missing / effectiveLimit)
            const currentPage = Math.floor(actualLoaded / effectiveLimit)
            
            console.warn(`[InitialDataLoader] Only loaded ${actualLoaded} of ${totalToLoad} planets. Missing ${missing}.`)
            console.warn(`[InitialDataLoader] Using effective limit ${effectiveLimit}, need ${additionalPagesNeeded} more pages starting from page ${currentPage + 1}`)
            
            // Try fetching additional pages that might have been missed
            const additionalPromises: Promise<{ planets: Planet[]; offset: number; page: number }>[] = []
            
              // Fetch all remaining pages systematically using effectiveLimit
              // Calculate how many pages we've actually loaded
              const pagesActuallyLoaded = Math.ceil(actualLoaded / effectiveLimit)
              const pagesNeeded = Math.ceil(totalToLoad / effectiveLimit)
              
              console.log(`[InitialDataLoader] Recovery: Loaded ${pagesActuallyLoaded} pages, need ${pagesNeeded} total. Fetching pages ${pagesActuallyLoaded + 1} to ${pagesNeeded}`)
              
              for (let page = pagesActuallyLoaded; page < pagesNeeded && page * effectiveLimit < total; page++) {
                const offset = page * effectiveLimit
                
                additionalPromises.push(
                  fetch(`${baseUrl}/planets/search?limit=${effectiveLimit}&offset=${offset}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }).then(async response => {
                    if (!response.ok) {
                      console.warn(`[InitialDataLoader] Additional fetch failed for page ${page} (offset ${offset}): ${response.status}`)
                      return { planets: [], offset, page }
                    }
                    const data = await response.json()
                    const planets = data.planets || []
                    console.log(`[InitialDataLoader] Additional fetch page ${page} (offset ${offset}): ${planets.length} planets returned`)
                    return { planets, offset, page }
                  }).catch(error => {
                    console.error(`[InitialDataLoader] Error in additional fetch page ${page} (offset ${offset}):`, error)
                    return { planets: [], offset, page }
                  })
                )
              }
            
            // Fetch additional pages in smaller batches
            if (additionalPromises.length > 0) {
              const batchSize = 5
              for (let i = 0; i < additionalPromises.length; i += batchSize) {
                const batch = additionalPromises.slice(i, i + batchSize)
                try {
                  const batchResults = await Promise.all(batch)
                  for (const result of batchResults) {
                    if (result.planets && result.planets.length > 0) {
                      // Only add planets we don't already have
                      const newPlanets = result.planets.filter(p => !allPlanets.some(existing => existing.id === p.id))
                      if (newPlanets.length > 0) {
                        allPlanets.push(...newPlanets)
                        dispatch(addPlanets(newPlanets))
                        console.log(`[InitialDataLoader] Added ${newPlanets.length} new planets from page ${result.page}`)
                      }
                    }
                  }
                } catch (error) {
                  console.error('[InitialDataLoader] Error fetching additional batch:', error)
                }
              }
              
              const finalLoaded = allPlanets.length
              console.log('[InitialDataLoader] After additional fetch:', {
                loaded: finalLoaded,
                target: totalToLoad,
                stillMissing: totalToLoad - finalLoaded
              })
            }
          }

          // Phase 3: Processing
          dispatch(setLoadingPhase('processing'))
          dispatch(setLoadingProgress(95))

          // Phase 4: Complete - ensure we have all planets before completing
          dispatch(setAllPlanets(allPlanets))
          dispatch(setLoadingProgress(100))
          dispatch(setLoadingPhase('complete'))

          // Small delay before completing
          // Ensure minimum display time AND that we actually loaded the data
          const elapsed = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0
          const remainingTime = Math.max(0, MIN_LOADER_DISPLAY_TIME - elapsed)
          
          setTimeout(() => {
            // Double-check that we have planets before completing
            if (allPlanets.length >= totalToLoad || allPlanets.length >= 15000) {
              console.log('[InitialDataLoader] ✅ Sufficient planets loaded, completing loader')
              setHasCompleted(true)
              hasLoadedOnceRef.current = true
              hasLoadedThisSession.current = true
              sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
              setTimeout(() => {
                onComplete()
              }, 300)
            } else {
              console.warn('[InitialDataLoader] ⚠️ Not enough planets loaded, but completing anyway to prevent blocking')
              setHasCompleted(true)
              hasLoadedOnceRef.current = true
              hasLoadedThisSession.current = true
              sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
              setTimeout(() => {
                onComplete()
              }, 300)
            }
          }, remainingTime + 200)
        } catch (error) {
          console.error('Error loading planets:', error)
          dispatch(setLoading(false))
          // Still complete to allow user to continue
          // Ensure minimum display time
          const elapsed = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0
          const remainingTime = Math.max(0, MIN_LOADER_DISPLAY_TIME - elapsed)
          
          setTimeout(() => {
            setHasCompleted(true)
            hasLoadedOnceRef.current = true
            hasLoadedThisSession.current = true
            sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
            setTimeout(() => {
              onComplete()
            }, 300)
          }, remainingTime + 200)
        }
      }

      loadAllPlanets()
    }
  }, [token, allPlanets.length, isLoading, isLoaded, isAuthenticated, hasCompleted, dispatch, onComplete, lastLoadedAt, showLoader])

  // Show loader if authenticated and (loading or showing loader) and not completed
  if (!isAuthenticated || !token || (!showLoader && !isLoading) || hasCompleted) {
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

