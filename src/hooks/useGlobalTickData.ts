import { useEffect } from 'react'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setTick } from '@/app/slices/gameSlice'
import { updateEmpire } from '@/app/slices/authSlice'

/**
 * Global hook to fetch and update tick data app-wide
 * This ensures tick timing is available everywhere, not just in Holopad
 */
export function useGlobalTickData() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  // Poll for tick data every 30 seconds when authenticated
  const { data } = useGetMeQuery(undefined, {
    pollingInterval: 30000,
    skip: !isAuthenticated,
  })

  useEffect(() => {
    if (!data) return

    const d: any = data || {}
    const tickFromMe = d.current_tick ?? d.tick_timing?.current_tick ?? d.tick?.current ?? d.currentTick ?? d.tickNumber ?? d.next_tick?.tick_number
    
    // Handle eta_seconds as number (can be negative)
    let etaFromMe: string | undefined
    let tickInterval: number | undefined
    
    if (typeof d.next_tick?.eta_seconds === 'number') {
      const etaSeconds = d.next_tick.eta_seconds
      
      // Determine tick interval (default to 300 seconds = 5 minutes)
      // Try to detect interval from the data, or use default
      tickInterval = d.tick_interval_seconds ?? d.next_tick?.interval_seconds ?? 300
      
      if (etaSeconds < 0 && tickInterval) {
        // Tick has passed, calculate when next tick will be
        const secondsUntilNext = tickInterval - (Math.abs(etaSeconds) % tickInterval)
        etaFromMe = new Date(Date.now() + secondsUntilNext * 1000).toISOString()
      } else if (etaSeconds >= 0) {
        // Tick is in the future
        etaFromMe = new Date(Date.now() + etaSeconds * 1000).toISOString()
      }
    } else {
      etaFromMe = d.next_tick_eta ?? d.tick_timing?.next_tick_eta ?? d.next_tick?.next_eta ?? d.next_tick_at ?? d.nextTickEta
    }
    
    if (tickFromMe && etaFromMe) {
      dispatch(
        setTick({
          tick: Number(tickFromMe),
          nextTickETA: String(etaFromMe),
          tickIntervalSeconds: tickInterval,
        })
      )
    }
    
    if (d.empire) {
      dispatch(updateEmpire(d.empire))
    }
  }, [data, dispatch])
}

