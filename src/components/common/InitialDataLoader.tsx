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
import { store } from '@/app/store'
import { universeApi } from '@/api/endpoints/universeApi'

interface InitialDataLoaderProps {
  onComplete: () => void
  mode?: 'default' | 'headless'
}

const SESSION_LOADED_KEY = 'planets_session_loaded' // Track if loaded this session

export function InitialDataLoader({ onComplete, mode = 'default' }: InitialDataLoaderProps) {
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
    // If not authenticated, complete immediately so login page can render
    if (!isAuthenticated || !token) {
      if (!hasCompleted) {
        setHasCompleted(true)
        setTimeout(() => onComplete(), 100)
      }
      if (showLoader) {
        setShowLoader(false)
        loaderStartTimeRef.current = null
      }
      hasLoadedOnceRef.current = false
      hasLoadedThisSession.current = false
      sessionStorage.removeItem(SESSION_LOADED_KEY)
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
          const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(
            /\/$/,
            ''
          )

          // OPTIMIZATION: Use API max limit (500) for better performance
          const limit = 500 // API maximum per docs (5x increase from 100)
          const initialPlanetsToLoad = 5000 // Load 5000 planets initially (fast)
          const maxPlanetsToLoad = Infinity // Load ALL planets - no limit
          const maxParallelRequests = 20 // Increased parallelism for faster initial load
          
          // PHASE 1: Load player's planets first (fastest, most important)
          dispatch(setLoadingProgress(5))
          dispatch(setLoadingPhase('fetching'))
          
          let allPlanets: Planet[] = []
          
          try {
            // Load player's planets via /planets endpoint (fast, no pagination)
            const playerPlanetsResponse = await fetch(`${baseUrl}/planets`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (playerPlanetsResponse.ok) {
              const playerData = await playerPlanetsResponse.json()
              const playerPlanets = playerData?.planets || []
              if (playerPlanets.length > 0) {
                allPlanets.push(...playerPlanets)
                dispatch(addPlanets(playerPlanets))
                console.log(`[InitialDataLoader] ✅ Loaded ${playerPlanets.length} player planets (Phase 1)`)
              }
            }
          } catch (error) {
            console.warn('[InitialDataLoader] Failed to load player planets, continuing...', error)
          }
          
          dispatch(setLoadingProgress(10))
          
          // PHASE 2: Load initial batch for immediate use (2000 planets)
          // Fetch first page to get total count (include_total=true only on first page)
          
          const firstPageResponse = await fetch(`${baseUrl}/planets/search?limit=${limit}&offset=0&include_total=true`, {
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
          
          // Filter out player planets we already loaded
          const existingIds = new Set(allPlanets.map(p => p.id))
          const newFirstPagePlanets = firstPagePlanets.filter((p: Planet) => !existingIds.has(p.id))
          
          if (newFirstPagePlanets.length > 0) {
            allPlanets.push(...newFirstPagePlanets)
            dispatch(addPlanets(newFirstPagePlanets))
          }
          
          // Load ALL planets - no cap
          const totalToLoad = total // Load all planets from API
          const totalPages = Math.ceil(totalToLoad / limit) // Calculate total pages needed

          console.log('[InitialDataLoader] Loading ALL planets:', { 
            apiTotal: total,
            playerPlanetsLoaded: allPlanets.length - newFirstPagePlanets.length,
            limitPerPage: limit,
            totalPages,
            maxParallel: maxParallelRequests,
            expectedPlanets: totalToLoad
          })
          
          // PHASE 2: Load ALL remaining pages (not just initial batch)
          dispatch(setLoadingProgress(15))
          
          // Load all pages beyond the first one
          const pagesToLoad = totalPages > 1 ? totalPages - 1 : 0
          
          if (pagesToLoad > 0) {
            console.log(`[InitialDataLoader] Loading ${pagesToLoad} pages (${totalToLoad} total planets)...`)
            
            // Create promises for ALL pages
            const allPagePromises: Promise<{ planets: Planet[]; offset: number; page: number }>[] = []
            
            // Start from page 1 (offset = limit) since page 0 (offset 0) is already loaded
            for (let page = 1; page < totalPages; page++) {
              const offset = page * limit
              allPagePromises.push(
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
                  return { planets: data.planets || [], offset, page }
                }).catch(error => {
                  console.error(`[InitialDataLoader] Error fetching page ${page}:`, error)
                  return { planets: [], offset, page }
                })
              )
            }
            
            // Process in chunks to update progress and avoid overwhelming
            const chunkSize = maxParallelRequests
            const existingIdsAfterFirstPage = new Set(allPlanets.map(p => p.id))
            
            for (let i = 0; i < allPagePromises.length; i += chunkSize) {
              const chunk = allPagePromises.slice(i, i + chunkSize)
              const chunkResults = await Promise.all(chunk)
              
              for (const result of chunkResults) {
                const newPlanets = result.planets.filter(p => !existingIdsAfterFirstPage.has(p.id))
                if (newPlanets.length > 0) {
                  allPlanets.push(...newPlanets)
                  dispatch(addPlanets(newPlanets))
                  newPlanets.forEach(p => existingIdsAfterFirstPage.add(p.id))
                }
              }
              
              // Update progress: 15% (first page) to 95% (all pages loaded)
              const progress = 15 + Math.floor(((i + chunk.length) / allPagePromises.length) * 80)
              dispatch(setLoadingProgress(Math.min(progress, 95)))
              
              console.log(`[InitialDataLoader] Loaded ${allPlanets.length}/${totalToLoad} planets (${((allPlanets.length / totalToLoad) * 100).toFixed(1)}%) - page ${i + chunk.length}/${allPagePromises.length}...`)
            }
            
            console.log(`[InitialDataLoader] ✅ Loaded all pages: ${allPlanets.length} planets total`)
          } else {
            // No additional pages needed - we already have all planets from first page
            console.log(`[InitialDataLoader] ✅ All planets loaded in first page: ${allPlanets.length} planets`)
          }
          
          // Warn if we didn't get all planets (shouldn't happen, but good to check)
          if (allPlanets.length < totalToLoad * 0.95) { // Allow 5% margin for duplicates/edge cases
            console.warn(`[InitialDataLoader] ⚠️ Only loaded ${allPlanets.length} out of ${totalToLoad} expected planets (${((allPlanets.length / totalToLoad) * 100).toFixed(1)}%)`)
          }
          
          // Verify we have at least 8000 planets (or close to the total)
          const minExpectedPlanets = Math.min(8000, totalToLoad * 0.95)
          if (allPlanets.length < minExpectedPlanets) {
            console.error(`[InitialDataLoader] ❌ Failed to load sufficient planets: ${allPlanets.length} < ${minExpectedPlanets}`)
            // Continue anyway, but log the issue
          } else {
            console.log(`[InitialDataLoader] ✅ Successfully loaded ${allPlanets.length} planets (target: ${totalToLoad})`)
          }
          
          // Complete load with ALL planets
          dispatch(setAllPlanets(allPlanets))
          dispatch(setLoadingProgress(100))
          dispatch(setLoadingPhase('complete'))
          
          console.log(`[InitialDataLoader] ✅ Loaded ALL ${allPlanets.length} planets - ready to proceed`)
          
          // Complete after minimum display time - ensure user sees completion
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
        } catch (error) {
          console.error('Error loading planets:', error)
          dispatch(setLoading(false))
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
      
      // Background loading function (non-blocking)
      const loadRemainingPlanetsInBackground = async (
        baseUrl: string,
        token: string,
        existingPlanets: Planet[],
        startPage: number,
        totalPages: number,
        effectiveLimit: number,
        totalToLoad: number
      ) => {
        try {
          const existingIds = new Set(existingPlanets.map(p => p.id))
          const remainingPages = totalPages - startPage
          
          if (remainingPages <= 0) return
          
          console.log(`[InitialDataLoader] Background: Loading ${remainingPages} remaining pages...`)
          
          // Create all promises for remaining pages
          const backgroundPromises: Promise<{ planets: Planet[]; offset: number; page: number }>[] = []
          
          for (let page = startPage; page < totalPages; page++) {
            const offset = page * effectiveLimit
            // Skip total on subsequent pages (only returned on first page by default)
            backgroundPromises.push(
              fetch(`${baseUrl}/planets/search?limit=${effectiveLimit}&offset=${offset}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).then(async response => {
                if (!response.ok) {
                  return { planets: [], offset, page }
                }
                const data = await response.json()
                return { planets: data.planets || [], offset, page }
              }).catch(error => {
                console.error(`[InitialDataLoader] Background fetch error page ${page}:`, error)
                return { planets: [], offset, page }
              })
            )
          }
          
          // Process in smaller chunks to avoid overwhelming
          const chunkSize = 10
          for (let i = 0; i < backgroundPromises.length; i += chunkSize) {
            const chunk = backgroundPromises.slice(i, i + chunkSize)
            const results = await Promise.all(chunk)
            
            const newPlanets: Planet[] = []
            for (const result of results) {
              const filtered = result.planets.filter(p => !existingIds.has(p.id))
              newPlanets.push(...filtered)
              filtered.forEach(p => existingIds.add(p.id))
            }
            
            if (newPlanets.length > 0) {
              dispatch(addPlanets(newPlanets))
              existingPlanets.push(...newPlanets)
              console.log(`[InitialDataLoader] Background: Loaded ${newPlanets.length} planets (${existingPlanets.length}/${totalToLoad} total)`)
            }
            
            // Update final state periodically
            if (i + chunkSize >= backgroundPromises.length || newPlanets.length > 0) {
              dispatch(setAllPlanets([...existingPlanets]))
            }
            
            // Small delay to avoid blocking UI
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
          console.log(`[InitialDataLoader] ✅ Background load complete: ${existingPlanets.length} planets total`)
        } catch (error) {
          console.error('[InitialDataLoader] Background load error:', error)
        }
      }

      loadAllPlanets()
    }
  }, [token, allPlanets.length, isLoading, isLoaded, isAuthenticated, hasCompleted, dispatch, onComplete, lastLoadedAt, showLoader])

  // Show loader only if authenticated, loading, and not completed
  // For unauthenticated users, return null immediately (don't block rendering)
  if (!isAuthenticated || !token) {
    return null
  }
  
  if ((!showLoader && !isLoading) || hasCompleted || mode === 'headless') {
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(46,121,141,0.18),transparent),radial-gradient(circle_at_80%_-10%,rgba(50,142,119,0.14),transparent)] bg-[#050c13e6] backdrop-blur-xl" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/25 via-sky-400/20 to-emerald-500/25 blur-xl" />
          <div className="absolute inset-[14%] rounded-full bg-[#06121c] border border-cyan-500/20 shadow-[0_0_30px_rgba(46,121,141,0.35)]" />

          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="astralus-loader" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(46, 121, 141, 1)" />
                <stop offset="50%" stopColor="rgba(50, 142, 119, 1)" />
                <stop offset="100%" stopColor="rgba(103, 232, 249, 0.9)" />
              </linearGradient>
            </defs>

            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(8, 39, 54, 0.65)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#astralus-loader)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ filter: 'drop-shadow(0 0 14px rgba(46, 121, 141, 0.55))' }}
            />
          </svg>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_12px_rgba(46,121,141,0.45)]">
              {Math.round(loadingProgress)}%
            </span>
            <span className="text-[10px] uppercase tracking-[0.6em] text-cyan-200/70">
              Syncing
            </span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-xl font-semibold uppercase tracking-[0.45em] text-cyan-100">
            {getPhaseLabel()}
          </h3>
          {getPhaseDescription() && (
            <p className="text-sm font-mono text-cyan-200/70">
              {getPhaseDescription()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
