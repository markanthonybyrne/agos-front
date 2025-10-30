import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { useGetMeQuery } from '@/api/endpoints/authApi'
import { setTick, setTickProcessing } from '@/app/slices/gameSlice'
import { updateEmpire } from '@/app/slices/authSlice'
import { 
  handleConstructionCompleted,
  handleFleetArrived,
  handleFleetAttacked,
  handleEmpireAttacked,
  handleResearchCompleted,
  handleAllianceMessage,
  handleTickProcessed,
} from '@/app/slices/notificationSlice'
import { initializeEcho, disconnectEcho, getEcho } from '@/lib/websocket'
import { formatCoordinate } from '@/lib/coordinates'
import { toast } from 'sonner'
import { apiSlice } from '@/api/apiSlice'

export function useWebSocket() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const empire = useAppSelector((state) => state.auth.empire)
  const { data: meData } = useGetMeQuery(undefined, { skip: !token })
  
  // Use ref to prevent multiple subscriptions and track channel
  const subscribedRef = useRef<string | null>(null) // Track which empire ID we're subscribed to
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!token || !empire) {
      if (channelRef.current) {
        channelRef.current = null
      }
      subscribedRef.current = null
      return
    }
    
    // Prevent multiple subscriptions to the same channel
    if (subscribedRef.current === `empire.${empire.id}`) {
      console.log('[WebSocket] Already subscribed to', subscribedRef.current, ', skipping...')
      return
    }

    const echo = initializeEcho(token)
    
    // Get auth endpoint for logging
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
    let authEndpoint = '/broadcasting/auth'
    try {
      const url = new URL(apiUrl)
      authEndpoint = `${url.protocol}//${url.host}/broadcasting/auth`
    } catch {
      authEndpoint = '/broadcasting/auth'
    }

    // Subscribe to private empire channel
    const channelName = `empire.${empire.id}`
    console.log('[WebSocket] Subscribing to channel:', channelName)
    console.log('[WebSocket] Auth endpoint for subscription:', authEndpoint)
    console.log('[WebSocket] Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
    
    subscribedRef.current = channelName
    
    const privateChannel = echo.private(channelName)
    channelRef.current = privateChannel
    
    // Log connection status - wait for subscription before setting up listeners
    privateChannel.subscribed(() => {
      console.log('[WebSocket] ✅ Successfully subscribed to channel:', channelName)
      console.log('[WebSocket] Channel is ready, setting up event listeners')
    })

    privateChannel.error((error: any) => {
      console.error('[WebSocket] ❌ Channel subscription error:', error)
      console.error('[WebSocket] Error details:', JSON.stringify(error, null, 2))
      console.error('[WebSocket] Channel:', channelName)
      console.error('[WebSocket] Auth endpoint:', authEndpoint)
      subscribedRef.current = null // Reset on error so it can retry
    })

    // Log when subscription is attempted
    console.log('[WebSocket] Channel subscription initiated, waiting for confirmation...')
    console.log('[WebSocket] ⚠️ Check Network tab for auth request to:', authEndpoint)
    console.log('[WebSocket] Connection state will be logged above - look for "Connected" or "failed" messages')

    // Add a catch-all listener that logs ALL events (for debugging)
    // This will help us see what events are actually being sent
    // Note: This is a workaround - Laravel Echo doesn't have a true wildcard listener
    // We'll log events in each listener below, but also try to catch any unexpected ones

    // Handle empire updated event
    privateChannel.listen('empire.updated', (data: any) => {
      console.log('[WebSocket] ✅ Received empire.updated event:', data)
      dispatch(apiSlice.util.invalidateTags(['Empire']))
    })

    // Handle news created event
    privateChannel.listen('news.created', (data: any) => {
      toast.info('New news item available')
      dispatch(apiSlice.util.invalidateTags(['Empire']))
    })

    // Handle mail received event
    privateChannel.listen('mail.received', (data: any) => {
      toast.info('New mail received')
      dispatch(apiSlice.util.invalidateTags(['Empire']))
    })

    // Handle fleet arrived event
    privateChannel.listen('fleet.arrived', (data: any) => {
      dispatch(handleFleetArrived({
        fleetId: data.fleet_id,
        destination: data.destination_coordinate || data.destination,
        fleetName: data.fleet_name || `Fleet ${data.fleet_id}`,
      }))
      toast.info(`Fleet arrived at ${data.destination_coordinate}`)
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet']))
    })

    // Handle planet updated event (if owned)
    privateChannel.listen('planet.updated', (data: any) => {
      console.log('[WebSocket] ✅ Received planet.updated event:', data)
      // Invalidate construction queue for the specific planet if planet_id is provided
      const tags: any[] = ['Planet']
      if (data.planet_id) {
        tags.push({ type: 'ConstructionQueue', id: Number(data.planet_id) })
        tags.push({ type: 'Planet', id: Number(data.planet_id) })
      }
      dispatch(apiSlice.util.invalidateTags(tags))
    })

    // Note: The following events may not be in the official API but keeping for backward compatibility
    // These use dot-prefixed names which Laravel may broadcast differently

    // Note: construction.completed, research.completed, etc. may not be in the official API
    // but keeping them for backward compatibility
    // Try multiple event name variations to catch what the backend actually sends
    const handleConstructionCompletedEvent = (data: any) => {
      console.log('[WebSocket] Construction completed event:', data)
      dispatch(handleConstructionCompleted({
        planetId: data.planet_id,
        itemType: data.item_type,
        itemName: data.item_name || data.item_type?.replace(/_/g, ' '),
      }))
      toast.success(`${data.item_type || 'Construction'} completed on planet ${data.planet_id}`)
      // Invalidate specific collections depending on item type
      const tags: any[] = ['Planet', 'ConstructionQueue', 'Buildable']
      // Also invalidate the specific planet's construction queue
      if (data.planet_id) {
        tags.push({ type: 'ConstructionQueue', id: Number(data.planet_id) })
      }
      const lower = String(data.item_type || '').toLowerCase()
      if (lower.includes('facility')) tags.push('Facility')
      if (lower.includes('defence') || lower.includes('defense')) tags.push('Defence')
      if (lower.includes('ship')) tags.push('Ship')
      if (lower.includes('research')) tags.push('Research')
      dispatch(apiSlice.util.invalidateTags(tags as any))
    }

    // Try multiple event name variations
    privateChannel.listen('.construction.completed', handleConstructionCompletedEvent)
    privateChannel.listen('construction.completed', handleConstructionCompletedEvent)
    privateChannel.listen('ConstructionCompleted', handleConstructionCompletedEvent)
    privateChannel.listen('construction_completed', handleConstructionCompletedEvent)
    // Also try with the App namespace prefix (Laravel convention)
    privateChannel.listen('App\\Events\\ConstructionCompleted', handleConstructionCompletedEvent)
    privateChannel.listen('App.Events.ConstructionCompleted', handleConstructionCompletedEvent)

    // Handle resources updated event
    privateChannel.listen('.resources.updated', (data: any) => {
      // Real-time resource updates - invalidate planet resources
      dispatch(apiSlice.util.invalidateTags(['Resource', 'Planet']))
    })

    // Handle research completed event
    privateChannel.listen('.research.completed', (data: any) => {
      dispatch(handleResearchCompleted({
        researchName: data.research_name || data.research_slug?.replace(/_/g, ' '),
        planetId: data.planet_id,
      }))
      toast.success(`Research completed: ${data.research_name}`)
      dispatch(apiSlice.util.invalidateTags(['Research', 'Planet']))
    })

    // Handle alliance message event
    privateChannel.listen('.alliance.message', (data: any) => {
      dispatch(handleAllianceMessage({
        senderName: data.sender_name || data.sender,
        message: data.message || data.content,
        allianceId: data.alliance_id,
      }))
      toast.info(`New alliance message from ${data.sender_name}`)
      dispatch(apiSlice.util.invalidateTags(['Alliance']))
    })

    // Handle planet colonized event
    privateChannel.listen('.planet.colonized', (data: any) => {
      toast.success(`Planet colonized at ${data.coordinate}`)
      dispatch(apiSlice.util.invalidateTags(['Planet', 'Empire']))
    })

    // Handle empire attacked event
    privateChannel.listen('.empire.attacked', (data: any) => {
      dispatch(handleEmpireAttacked({
        planetId: data.planet_id,
        attacker: data.attacker_name || data.attacker,
        location: data.location_coordinate || data.coordinate,
      }))
      toast.error(`Your empire is under attack at ${data.location_coordinate}!`)
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Planet', 'Fleet']))
    })

    // Handle fleet departed event
    privateChannel.listen('.fleet.departed', (data: any) => {
      toast.info(`Fleet departed from ${data.origin_coordinate}`)
      dispatch(apiSlice.util.invalidateTags(['Fleet']))
    })

    // Subscribe to public tick channel (Echo may auto-add 'public-' prefix, but docs show 'public.tick')
    // Try both formats to be safe
    const publicTickChannel = echo.channel('tick')
    
    publicTickChannel.listen('tick.processed', (data: any) => {
      dispatch(handleTickProcessed({
        tickNumber: data.tick_number,
        nextTickEta: data.next_tick_eta,
      }))
      dispatch(setTick({ tick: data.tick_number, nextTickETA: data.next_tick_eta }))
      dispatch(setTickProcessing(false))
    })

          // Subscribe to galaxy channels for map updates
          // Echo may auto-add 'public-' prefix, so use 'galaxy.{q}.{s}.{g}' format
          if (meData?.planets) {
            const galaxyChannels = new Set<string>()
            meData.planets.forEach((planet: any) => {
        const coordString = formatCoordinate(planet.coordinate)
        const [quad, sec, gal] = coordString.split(':')
        const channelName = `galaxy.${quad}.${sec}.${gal}`
        if (!galaxyChannels.has(channelName)) {
          galaxyChannels.add(channelName)
          const galaxyChannel = echo.channel(channelName)
          galaxyChannel.listen('planet.updated', () => {
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet']))
          })
          galaxyChannel.listen('combat.resolved', () => {
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet', 'Fleet']))
          })
        }
      })
    }

    // Cleanup function
    return () => {
      console.log('[WebSocket] Cleaning up WebSocket subscription for channel:', channelName)
      if (channelRef.current) {
        try {
          // Laravel Echo doesn't have a leave method, channels are automatically cleaned up
          // when Echo is disconnected or the component unmounts
          const echoWithConnector = echo as any
          if (echoWithConnector.connector?.pusher) {
            const pusher = echoWithConnector.connector.pusher
            // Unsubscribe from the channel using Pusher's unsubscribe method
            if (pusher.channel && pusher.channel(`private-${channelName}`)) {
              pusher.unsubscribe(`private-${channelName}`)
            }
          }
        } catch (e) {
          console.warn('[WebSocket] Error unsubscribing:', e)
        }
        channelRef.current = null
      }
      subscribedRef.current = null
      // Don't disconnect Echo here as it might be used by other components
    }
  }, [token, empire?.id, dispatch]) // Removed meData from dependencies to prevent re-subscription
}

