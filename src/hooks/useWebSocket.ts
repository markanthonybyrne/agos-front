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
  addNotification,
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
    
    // Define all handlers BEFORE subscription so they can be called manually
    // Handle empire updated event
    const handleEmpireUpdated = (data: any) => {
      console.log('[WebSocket] ✅ Received empire.updated event:', data)
      // Update empire state if data includes empire object
      if (data.empire) {
        dispatch(updateEmpire(data.empire))
      }
      
      // Check for significant changes that warrant notifications
      const changes = data.changes || {}
      if (changes.score || changes.planets_owned || changes.alliance_id) {
        const changeMessages: string[] = []
        if (changes.score) changeMessages.push(`Score: ${changes.score > 0 ? '+' : ''}${changes.score}`)
        if (changes.planets_owned) changeMessages.push(`${changes.planets_owned > 0 ? 'Gained' : 'Lost'} planet`)
        if (changes.alliance_id) changeMessages.push(`Alliance ${changes.alliance_id ? 'joined' : 'left'}`)
        
        if (changeMessages.length > 0) {
          toast.info(`Empire updated: ${changeMessages.join(', ')}`)
        }
      }
      
      // Invalidate Empire, Universe, and Resource tags to refresh all related data
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Universe', 'Resource']))
    }
    
    // Handle planet updated event
    const handlePlanetUpdated = (data: any) => {
      console.log('[WebSocket] ✅✅✅ PLANET UPDATED HANDLER CALLED ✅✅✅')
      console.log('[WebSocket] Event data:', JSON.stringify(data, null, 2))
      
      // Invalidate construction queue for the specific planet if planet_id is provided
      const tags: any[] = ['Planet', 'Resource', 'Empire']
      if (data.planet_id) {
        const planetId = Number(data.planet_id)
        console.log('[WebSocket] Invalidating tags for planet:', planetId)
        tags.push({ type: 'ConstructionQueue', id: planetId })
        tags.push({ type: 'Planet', id: planetId })
        tags.push({ type: 'Resource', id: planetId })
        tags.push({ type: 'Facility', id: planetId })
        tags.push({ type: 'Defence', id: planetId })
        tags.push({ type: 'Ship', id: planetId })
        tags.push({ type: 'Research', id: planetId })
        tags.push({ type: 'Buildable', id: planetId })
      } else {
        console.log('[WebSocket] ⚠️ No planet_id in event data, invalidating general tags only')
      }
      
      console.log('[WebSocket] Invalidating tags:', tags)
      // Invalidate tags - RTK Query will automatically refetch active queries
      dispatch(apiSlice.util.invalidateTags(tags))
      console.log('[WebSocket] ✅ Tags invalidated, queries should refetch automatically')
    }
    
    // Handle fleet arrived event (per WebSocket events spec)
    const handleFleetArrivedEvent = (data: any) => {
      console.log('[WebSocket] ✅ Received fleet.arrived event:', data)
      // Per spec: data.fleet.id, data.fleet.destination.coordinate
      const fleetData = data.fleet || data
      dispatch(handleFleetArrived({
        fleetId: fleetData.id || fleetData.fleet_id,
        destination: fleetData.destination?.coordinate || fleetData.destination_coordinate || fleetData.destination,
        fleetName: `Fleet ${fleetData.id || fleetData.fleet_id}`,
      }))
      const destinationCoord = fleetData.destination?.coordinate || fleetData.destination_coordinate || 'destination'
      toast.info(`Fleet arrived at ${destinationCoord}`)
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet']))
    }
    
    // Handle resources updated event
    const handleResourcesUpdated = (data: any) => {
      console.log('[WebSocket] ✅ Received resources.updated event:', data)
      // Real-time resource updates - invalidate planet resources
      const tags: any[] = ['Resource', 'Planet', 'Empire', 'Universe']
      if (data.planet_id) {
        tags.push({ type: 'Resource', id: Number(data.planet_id) })
        tags.push({ type: 'Planet', id: Number(data.planet_id) })
      }
      dispatch(apiSlice.util.invalidateTags(tags))
    }
    
    // Handle mail received event (per WebSocket events spec)
    const handleMailReceived = (data: any) => {
      console.log('[WebSocket] ✅ Received mail.received event:', data)
      // Per spec: data.mail.from_empire.name, data.mail.subject
      const mailData = data.mail || data
      const mailSubject = mailData.subject || 'New message'
      const senderName = mailData.from_empire?.name || data.from_empire?.name || data.sender_name || 'Unknown'
      toast.info(`New mail from ${senderName}: ${mailSubject}`)
      // Invalidate mail tags and unread count to refresh UI
      dispatch(apiSlice.util.invalidateTags([
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'LIST' },
        { type: 'Mail', id: 'UNREAD_COUNT' },
      ]))
    }
    
    // Handle fleet attacked event
    const handleFleetAttackedEvent = (data: any) => {
      console.log('[WebSocket] ✅ Received fleet.attacked event:', data)
      dispatch(handleFleetAttacked({
        fleetId: data.fleet_id,
        attacker: data.attacker_name || data.attacker || 'Unknown',
        location: data.location_coordinate || data.coordinate || 'Unknown',
      }))
      toast.error(`Your fleet is under attack at ${data.location_coordinate || data.coordinate}!`)
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet']))
    }
    
    // Handle empire attacked event
    const handleEmpireAttackedEvent = (data: any) => {
      console.log('[WebSocket] ✅ Received empire.attacked event:', data)
      dispatch(handleEmpireAttacked({
        planetId: data.planet_id,
        attacker: data.attacker_name || data.attacker || 'Unknown',
        location: data.location_coordinate || data.coordinate || 'Unknown',
      }))
      toast.error(`Your empire is under attack at ${data.location_coordinate || data.coordinate}!`)
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Planet', 'Fleet']))
    }
    
    // Handle combat resolved event (on private channel - per WebSocket events spec)
    const handleCombatResolvedEvent = (data: any) => {
      console.log('[WebSocket] ✅ Received combat.resolved event:', data)
      // Invalidate tags to refresh data
      dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet', 'Fleet', 'CombatLog', 'Empire']))
      // Show notification with battle result
      if (data.combat_log?.id) {
        toast.info('Combat resolved! Check battle reports for details.', {
          action: {
            label: 'View',
            onClick: () => {
              console.log('Navigate to combat log:', data.combat_log.id)
            }
          }
        })
      } else {
        toast.info('Combat resolved! Check battle reports for details.')
      }
    }
    
    // Handle research completed event
    const handleResearchCompletedEvent = (data: any) => {
      console.log('[WebSocket] ✅ Received research.completed event:', data)
      dispatch(handleResearchCompleted({
        researchName: data.research_name || data.research_slug?.replace(/_/g, ' '),
        planetId: data.planet_id,
      }))
      const tags: any[] = ['Research', 'Planet', 'Buildable', 'Empire']
      if (data.planet_id) {
        tags.push({ type: 'Research', id: Number(data.planet_id) })
        tags.push({ type: 'Planet', id: Number(data.planet_id) })
        tags.push({ type: 'ConstructionQueue', id: Number(data.planet_id) })
      }
      dispatch(apiSlice.util.invalidateTags(tags))
    }
    
    // Handle construction completed event
    const handleConstructionCompletedEvent = (data: any) => {
      console.log('[WebSocket] Construction completed event:', data)
      dispatch(handleConstructionCompleted({
        planetId: data.planet_id,
        itemType: data.item_type,
        itemName: data.item_name || data.item_type?.replace(/_/g, ' '),
      }))
      // Invalidate specific collections depending on item type
      const tags: any[] = ['Planet', 'ConstructionQueue', 'Buildable', 'Resource']
      // Also invalidate the specific planet's construction queue and related data
      if (data.planet_id) {
        const planetId = Number(data.planet_id)
        tags.push({ type: 'ConstructionQueue', id: planetId })
        tags.push({ type: 'Planet', id: planetId })
        tags.push({ type: 'Resource', id: planetId })
      }
      const lower = String(data.item_type || '').toLowerCase()
      if (lower.includes('facility')) {
        tags.push('Facility')
        if (data.planet_id) tags.push({ type: 'Facility', id: Number(data.planet_id) })
      }
      if (lower.includes('defence') || lower.includes('defense')) {
        tags.push('Defence')
        if (data.planet_id) tags.push({ type: 'Defence', id: Number(data.planet_id) })
      }
      if (lower.includes('ship')) {
        tags.push('Ship')
        if (data.planet_id) tags.push({ type: 'Ship', id: Number(data.planet_id) })
      }
      if (lower.includes('research')) {
        tags.push('Research')
        if (data.planet_id) tags.push({ type: 'Research', id: Number(data.planet_id) })
      }
      // Also invalidate Empire to refresh planet lists
      tags.push('Empire')
      dispatch(apiSlice.util.invalidateTags(tags as any))
    }
    
    // Log connection status - wait for subscription before setting up listeners
    privateChannel.subscribed(() => {
      console.log('[WebSocket] ✅ Successfully subscribed to channel:', channelName)
      console.log('[WebSocket] Channel is ready, setting up event listeners')
      
      // Set up comprehensive event debugging AND manual event forwarding
      const echoWithConnector = echo as any
      if (echoWithConnector.connector?.pusher) {
        const pusher = echoWithConnector.connector.pusher
        const channelNameForPusher = `private-${channelName}`
        const doublePrefixChannelName = `private-private-${channelName}` // Handle double prefix case
        
        console.log('[WebSocket] 🔍 Channel names for matching:', {
          channelName,
          channelNameForPusher,
          doublePrefixChannelName
        })
        
        // CRITICAL: Intercept Pusher messages and manually forward them to our handlers
        // This bypasses Laravel Echo's event routing which might be broken
        console.log('[WebSocket] 📡 Setting up connection-level message interceptor')
        pusher.connection.bind('message', (event: any) => {
          console.log('[WebSocket] 🔔🔔🔔 PUSHER MESSAGE RECEIVED ON CONNECTION 🔔🔔🔔', {
            channel: event.channel,
            event: event.event,
            hasData: !!event.data
          })
          
          // Skip events without a channel (like pusher:pong)
          if (!event.channel) {
            console.log('[WebSocket] Skipping event without channel:', event.event)
            return
          }
          
          // Handle both normal and double-prefixed channel names
          // Pusher can show: private-empire.6 (single prefix) or private-private-empire.6 (double prefix)
          // We subscribe to: empire.6 (Laravel Echo adds private- prefix)
          const normalizedChannel = event.channel.replace(/^private-private-/, 'private-')
          const isOurChannel = normalizedChannel === channelNameForPusher || 
                              event.channel === channelNameForPusher ||
                              event.channel === doublePrefixChannelName ||
                              event.channel === `private-${channelName}` ||
                              event.channel === `private-private-${channelName}` ||
                              event.channel.includes(`empire.${empire.id}`)
          
          console.log('[WebSocket] Channel match check:', {
            eventChannel: event.channel,
            normalizedChannel: normalizedChannel,
            expectedChannel: channelNameForPusher,
            isOurChannel: isOurChannel
          })
          
          // Skip internal Pusher events and pings/pongs
          if (event.event && (event.event.startsWith('pusher_internal:') || event.event.startsWith('pusher:'))) {
            console.log('[WebSocket] Skipping internal Pusher event:', event.event)
            return
          }
          
          if (isOurChannel) {
            const eventName = event.event
            const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
            
            console.log('[WebSocket] 🔔🔔🔔 RAW PUSHER MESSAGE FOR OUR CHANNEL 🔔🔔🔔:', {
              channel: event.channel,
              normalizedChannel: normalizedChannel,
              expectedChannel: channelNameForPusher,
              event: eventName,
              data: eventData
            })
            
            // Manually trigger our handlers based on exact event name match
            // Events are coming as: "planet.updated" (no prefix, no namespace)
            if (eventName === 'planet.updated' || eventName.includes('planet.updated') || eventName.includes('PlanetUpdated')) {
              console.log('[WebSocket] 🎯🎯🎯 MATCHED planet.updated EVENT - TRIGGERING HANDLER 🎯🎯🎯')
              console.log('[WebSocket] Event name:', eventName)
              console.log('[WebSocket] Event data:', eventData)
              handlePlanetUpdated(eventData)
            } else {
              console.log('[WebSocket] ⚠️ Event name does not match planet.updated:', eventName)
            }
            if (eventName === 'construction.completed' || eventName.includes('construction.completed') || eventName.includes('ConstructionCompleted')) {
              console.log('[WebSocket] 🎯 Manually triggering construction.completed handler')
              handleConstructionCompletedEvent(eventData)
            }
            if (eventName === 'research.completed' || eventName.includes('research.completed') || eventName.includes('ResearchCompleted')) {
              console.log('[WebSocket] 🎯 Manually triggering research.completed handler')
              handleResearchCompletedEvent(eventData)
            }
            if (eventName === 'fleet.arrived' || eventName.includes('fleet.arrived') || eventName.includes('FleetArrived')) {
              console.log('[WebSocket] 🎯 Manually triggering fleet.arrived handler')
              handleFleetArrivedEvent(eventData)
            }
            if (eventName === 'resources.updated' || eventName.includes('resources.updated') || eventName.includes('ResourcesUpdated')) {
              console.log('[WebSocket] 🎯 Manually triggering resources.updated handler')
              handleResourcesUpdated(eventData)
            }
            if (eventName === 'empire.updated' || eventName.includes('empire.updated') || eventName.includes('EmpireUpdated')) {
              console.log('[WebSocket] 🎯 Manually triggering empire.updated handler')
              handleEmpireUpdated(eventData)
            }
            if (eventName === 'mail.received' || eventName.includes('mail.received') || eventName.includes('MailReceived')) {
              console.log('[WebSocket] 🎯 Manually triggering mail.received handler')
              handleMailReceived(eventData)
            }
            if (eventName === 'fleet.attacked' || eventName.includes('fleet.attacked') || eventName.includes('FleetAttacked')) {
              console.log('[WebSocket] 🎯 Manually triggering fleet.attacked handler')
              handleFleetAttackedEvent(eventData)
            }
            if (eventName === 'empire.attacked' || eventName.includes('empire.attacked') || eventName.includes('EmpireAttacked')) {
              console.log('[WebSocket] 🎯 Manually triggering empire.attacked handler')
              handleEmpireAttackedEvent(eventData)
            }
            if (eventName === 'combat.resolved' || eventName.includes('combat.resolved') || eventName.includes('CombatResolved')) {
              console.log('[WebSocket] 🎯 Manually triggering combat.resolved handler')
              handleCombatResolvedEvent(eventData)
            }
          } else {
            console.log('[WebSocket] 🚫 Event is for a different channel, ignoring')
          }
        })
        
        // Also intercept at the channel level
        setTimeout(() => {
          const pusherChannel = pusher.channel(channelNameForPusher)
          const doublePrefixPusherChannel = pusher.channel(doublePrefixChannelName)
          
          if (pusherChannel) {
            console.log('[WebSocket] ✅ Pusher channel found:', channelNameForPusher)
            
            // Check what callbacks are registered
            const callbacks = (pusherChannel as any).callbacks || (pusherChannel as any)._callbacks || {}
            // Pusher stores callbacks in a nested structure, let's inspect it properly
            console.log('[WebSocket] 📋 Pusher channel callbacks structure:', callbacks)
            
            // Try to get all registered event names
            const eventNames: string[] = []
            if (callbacks && typeof callbacks === 'object') {
              Object.keys(callbacks).forEach(key => {
                if (key !== '_callbacks' && key !== 'callbacks') {
                  eventNames.push(key)
                } else if (callbacks[key] && typeof callbacks[key] === 'object') {
                  eventNames.push(...Object.keys(callbacks[key]))
                }
              })
            }
            console.log('[WebSocket] 📋 Registered event listeners:', eventNames.length > 0 ? eventNames : 'None found')
            
            // Also check Laravel Echo's internal listener storage
            const echoListeners = (privateChannel as any).events || (privateChannel as any)._events || {}
            console.log('[WebSocket] 📋 Laravel Echo registered listeners:', Object.keys(echoListeners))
            
            // Override handleEvent to manually forward events
            const originalHandleEvent = (pusherChannel as any).handleEvent
            if (originalHandleEvent) {
              (pusherChannel as any).handleEvent = function(eventName: string, data: any) {
                console.log('[WebSocket] 🔔 CHANNEL HANDLE EVENT:', eventName, 'Data:', data)
                // Call original handler
                const result = originalHandleEvent.call(this, eventName, data)
                // Also manually trigger Echo listeners
                try {
                  privateChannel.listen(eventName, () => {})
                } catch (e) {
                  // Ignore
                }
                return result
              }
            }
          } else {
            console.warn('[WebSocket] ⚠️ Pusher channel not found:', channelNameForPusher)
          }
          
          // Also check the double prefix channel
          if (doublePrefixPusherChannel) {
            console.log('[WebSocket] ✅ Double-prefix Pusher channel ALSO found:', doublePrefixChannelName)
            
            // Override handleEvent on double prefix channel too
            const originalHandleEvent2 = (doublePrefixPusherChannel as any).handleEvent
            if (originalHandleEvent2) {
              (doublePrefixPusherChannel as any).handleEvent = function(eventName: string, data: any) {
                console.log('[WebSocket] 🔔 DOUBLE-PREFIX CHANNEL HANDLE EVENT:', eventName, 'Data:', data)
                // Call original handler
                const result = originalHandleEvent2.call(this, eventName, data)
                // Also manually trigger Echo listeners
                try {
                  privateChannel.listen(eventName, () => {})
                } catch (e) {
                  // Ignore
                }
                return result
              }
            }
          } else {
            console.warn('[WebSocket] ⚠️ Double-prefix Pusher channel not found:', doublePrefixChannelName)
          }
        }, 1000)
      }
      
      // Register Laravel Echo listeners using the handlers defined above
      // Handle empire updated event - try multiple naming variations
      privateChannel.listen('empire.updated', handleEmpireUpdated)
      privateChannel.listen('.empire.updated', handleEmpireUpdated)
      privateChannel.listen('EmpireUpdated', handleEmpireUpdated)
      privateChannel.listen('App\\Events\\EmpireUpdated', handleEmpireUpdated)
      privateChannel.listen('App.Events.EmpireUpdated', handleEmpireUpdated)

      // Handle news created event
      privateChannel.listen('news.created', (data: any) => {
        toast.info('New news item available')
        dispatch(apiSlice.util.invalidateTags(['Empire']))
      })

      // Handle mail received event - try multiple naming variations
      privateChannel.listen('mail.received', handleMailReceived)
      privateChannel.listen('.mail.received', handleMailReceived)
      privateChannel.listen('MailReceived', handleMailReceived)
      privateChannel.listen('mail_received', handleMailReceived)
      privateChannel.listen('App\\Events\\MailReceived', handleMailReceived)
      privateChannel.listen('App.Events.MailReceived', handleMailReceived)

      // Register fleet listeners
      privateChannel.listen('fleet.arrived', handleFleetArrivedEvent)
      privateChannel.listen('.fleet.arrived', handleFleetArrivedEvent)
      privateChannel.listen('FleetArrived', handleFleetArrivedEvent)
      privateChannel.listen('App\\Events\\FleetArrived', handleFleetArrivedEvent)
      privateChannel.listen('App.Events.FleetArrived', handleFleetArrivedEvent)

      // Handle planet updated event (if owned) - try multiple naming variations
      privateChannel.listen('planet.updated', handlePlanetUpdated)
      privateChannel.listen('.planet.updated', handlePlanetUpdated)
      privateChannel.listen('PlanetUpdated', handlePlanetUpdated)
      privateChannel.listen('App\\Events\\PlanetUpdated', handlePlanetUpdated)
      privateChannel.listen('App.Events.PlanetUpdated', handlePlanetUpdated)

      // Try multiple event name variations for construction completed
      privateChannel.listen('.construction.completed', handleConstructionCompletedEvent)
      privateChannel.listen('construction.completed', handleConstructionCompletedEvent)
      privateChannel.listen('ConstructionCompleted', handleConstructionCompletedEvent)
      privateChannel.listen('construction_completed', handleConstructionCompletedEvent)
      // Also try with the App namespace prefix (Laravel convention)
      privateChannel.listen('App\\Events\\ConstructionCompleted', handleConstructionCompletedEvent)
      privateChannel.listen('App.Events.ConstructionCompleted', handleConstructionCompletedEvent)

      // Register resources listeners
      privateChannel.listen('resources.updated', handleResourcesUpdated)
      privateChannel.listen('.resources.updated', handleResourcesUpdated)
      privateChannel.listen('ResourcesUpdated', handleResourcesUpdated)
      privateChannel.listen('App\\Events\\ResourcesUpdated', handleResourcesUpdated)
      privateChannel.listen('App.Events.ResourcesUpdated', handleResourcesUpdated)

      // Register research listeners
      privateChannel.listen('research.completed', handleResearchCompletedEvent)
      privateChannel.listen('.research.completed', handleResearchCompletedEvent)
      privateChannel.listen('ResearchCompleted', handleResearchCompletedEvent)
      privateChannel.listen('App\\Events\\ResearchCompleted', handleResearchCompletedEvent)
      privateChannel.listen('App.Events.ResearchCompleted', handleResearchCompletedEvent)

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

      // Handle fleet attacked event - try multiple naming variations
      privateChannel.listen('fleet.attacked', handleFleetAttackedEvent)
      privateChannel.listen('.fleet.attacked', handleFleetAttackedEvent)
      privateChannel.listen('FleetAttacked', handleFleetAttackedEvent)
      privateChannel.listen('fleet_attacked', handleFleetAttackedEvent)
      privateChannel.listen('App\\Events\\FleetAttacked', handleFleetAttackedEvent)
      privateChannel.listen('App.Events.FleetAttacked', handleFleetAttackedEvent)

      // Handle empire attacked event - try multiple naming variations
      privateChannel.listen('empire.attacked', handleEmpireAttackedEvent)
      privateChannel.listen('.empire.attacked', handleEmpireAttackedEvent)
      privateChannel.listen('EmpireAttacked', handleEmpireAttackedEvent)
      privateChannel.listen('empire_attacked', handleEmpireAttackedEvent)
      privateChannel.listen('App\\Events\\EmpireAttacked', handleEmpireAttackedEvent)
      privateChannel.listen('App.Events.EmpireAttacked', handleEmpireAttackedEvent)

      // Handle combat resolved event on private channel - try multiple naming variations
      privateChannel.listen('combat.resolved', handleCombatResolvedEvent)
      privateChannel.listen('.combat.resolved', handleCombatResolvedEvent)
      privateChannel.listen('CombatResolved', handleCombatResolvedEvent)
      privateChannel.listen('combat_resolved', handleCombatResolvedEvent)
      privateChannel.listen('App\\Events\\CombatResolved', handleCombatResolvedEvent)
      privateChannel.listen('App.Events.CombatResolved', handleCombatResolvedEvent)

      // Handle fleet departed event
      privateChannel.listen('.fleet.departed', (data: any) => {
        toast.info(`Fleet departed from ${data.origin_coordinate}`)
        dispatch(apiSlice.util.invalidateTags(['Fleet']))
      })
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

    // Subscribe to public tick channel (Echo may auto-add 'public-' prefix, but docs show 'public.tick')
    // Try both formats to be safe
    const publicTickChannel = echo.channel('tick')
    
    publicTickChannel.listen('.tick.processed', (data: any) => {
      console.log('[WebSocket] ✅ Received tick.processed event:', data)
      dispatch(handleTickProcessed({
        tickNumber: data.tick_number,
        nextTickEta: data.next_tick_eta,
      }))
      dispatch(setTick({ tick: data.tick_number, nextTickETA: data.next_tick_eta }))
      dispatch(setTickProcessing(false))
      // Invalidate Signal tags when tick processes (signals are processed during ticks)
      dispatch(apiSlice.util.invalidateTags(['Signal']))
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
          galaxyChannel.listen('.combat.resolved', (data: any) => {
            console.log('[WebSocket] ✅ Combat resolved event on public channel:', data)
            // Invalidate tags to refresh data
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet', 'Fleet', 'CombatLog', 'Empire']))
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

