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
          const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(
            /\/$/,
            ''
          )

          // OPTIMIZATION: Use API max limit (500) for better performance
          const limit = 500 // API maximum per docs (5x increase from 100)
          const initialPlanetsToLoad = 2000 // Load 2000 planets initially (fast)
          const maxPlanetsToLoad = 15000 // Load remaining in background
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
          
          const effectiveLimit = limit // Use API max limit (100)
          const initialPagesNeeded = Math.ceil(initialPlanetsToLoad / effectiveLimit)
          const totalToLoad = Math.min(total, maxPlanetsToLoad)
          const totalPages = Math.ceil(totalToLoad / effectiveLimit)

          console.log('[InitialDataLoader] Optimized loading strategy:', { 
            apiTotal: total,
            playerPlanetsLoaded: allPlanets.length - newFirstPagePlanets.length,
            initialTarget: initialPlanetsToLoad,
            maxPlanetsToLoad,
            effectiveLimit,
            initialPagesNeeded,
            totalPages,
            maxParallel: maxParallelRequests
          })
          
          // PHASE 2: Load initial batch quickly (for immediate use)
          dispatch(setLoadingProgress(15))
          
          if (initialPagesNeeded > 1) {
            // Create promises for initial batch only
            const initialPromises: Promise<{ planets: Planet[]; offset: number; page: number }>[] = []
            
            for (let page = 1; page < initialPagesNeeded && page < totalPages; page++) {
              const offset = page * effectiveLimit
              // Skip total on subsequent pages (only returned on first page by default)
              initialPromises.push(
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
                  return { planets: data.planets || [], offset, page }
                }).catch(error => {
                  console.error(`[InitialDataLoader] Error fetching page ${page}:`, error)
                  return { planets: [], offset, page }
                })
              )
            }
            
            // Fetch initial batch in parallel (all at once for speed)
            const initialResults = await Promise.all(initialPromises)
            const existingIdsAfter = new Set(allPlanets.map(p => p.id))
            
            for (const result of initialResults) {
              const newPlanets = result.planets.filter(p => !existingIdsAfter.has(p.id))
              if (newPlanets.length > 0) {
                allPlanets.push(...newPlanets)
                dispatch(addPlanets(newPlanets))
                // Add IDs to the set - can't spread array into Set.add()
                newPlanets.forEach(p => existingIdsAfter.add(p.id))
              }
            }
            
            console.log(`[InitialDataLoader] ✅ Loaded initial batch: ${allPlanets.length} planets total`)
          }
          
          // Complete initial load quickly
          dispatch(setAllPlanets(allPlanets))
          dispatch(setLoadingProgress(90))
          dispatch(setLoadingPhase('complete'))
          
          // Complete immediately so user can interact
          const elapsed = loaderStartTimeRef.current ? Date.now() - loaderStartTimeRef.current : 0
          const remainingTime = Math.max(0, MIN_LOADER_DISPLAY_TIME - elapsed)
          
          setTimeout(() => {
            console.log('[InitialDataLoader] ✅ Initial load complete, allowing user to continue')
            setHasCompleted(true)
            hasLoadedOnceRef.current = true
            hasLoadedThisSession.current = true
            sessionStorage.setItem(SESSION_LOADED_KEY, 'true')
            
            // Start background loading of remaining planets (non-blocking)
            if (allPlanets.length < totalToLoad && totalPages > initialPagesNeeded) {
              console.log('[InitialDataLoader] Starting background load of remaining planets...')
              loadRemainingPlanetsInBackground(
                baseUrl,
                token!,
                allPlanets,
                initialPagesNeeded,
                totalPages,
                effectiveLimit,
                totalToLoad
              )
            }
            
            setTimeout(() => {
              onComplete()
            }, 300)
          }, remainingTime + 200)
          
          return // Exit early, background loading continues
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
