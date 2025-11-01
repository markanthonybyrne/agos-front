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
  handleFleetLaunched,
  handlePlanetCaptured,
  handlePlanetColonized,
  addNotification,
} from '@/app/slices/notificationSlice'
import { initializeTickCountdown, updateCountdownFromWebSocket } from '@/lib/tickService'
import { initializeEcho, disconnectEcho, getEcho } from '@/lib/websocket'
import { formatCoordinate } from '@/lib/coordinates'
import { toast } from 'sonner'
import { apiSlice } from '@/api/apiSlice'
import { notifyWithToast } from '@/lib/notificationHelper'

export function useWebSocket() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.auth.token)
  const empire = useAppSelector((state) => state.auth.empire)
  const { data: meData } = useGetMeQuery(undefined, { skip: !token })
  
  // Use ref to prevent multiple subscriptions and track channel
  const subscribedRef = useRef<string | null>(null) // Track which empire ID we're subscribed to
  const channelRef = useRef<any>(null)
  const allianceChannelRef = useRef<any>(null)
  const initializedRef = useRef<boolean>(false)
  const subscriptionsRef = useRef<Array<{ channel: string; events: string[] }>>([])

  useEffect(() => {
    if (!token || !empire) {
      if (channelRef.current) {
        channelRef.current = null
      }
      subscribedRef.current = null
      initializedRef.current = false
      return
    }
    
    // Prevent multiple subscriptions to the same channel
    if (subscribedRef.current === `empire.${empire.id}` && initializedRef.current) {
      return
    }

    console.log('[WebSocket] 🚀 Initializing WebSocket connection and ALL channel subscriptions...')
    const echo = initializeEcho(token)
    
    // Reset subscriptions tracking
    subscriptionsRef.current = []
    
    // Helper function to track subscription - call this when channel is confirmed subscribed
    const trackSubscription = (channelName: string, events: string[]) => {
      // Check if already tracked
      const existing = subscriptionsRef.current.find(sub => sub.channel === channelName)
      if (!existing) {
        subscriptionsRef.current.push({
          channel: channelName,
          events: [...events]
        })
        console.log(`[WebSocket] ✅ Tracked subscription: ${channelName} with ${events.length} events`)
        logSubscriptionSummary()
      }
    }
    
    // Helper function to log subscription summary
    const logSubscriptionSummary = () => {
      // Debounce to avoid logging multiple times rapidly
      if ((logSubscriptionSummary as any).timeout) {
        clearTimeout((logSubscriptionSummary as any).timeout)
      }
      (logSubscriptionSummary as any).timeout = setTimeout(() => {
        const subscriptions = subscriptionsRef.current
        const totalChannels = subscriptions.length
        const totalEvents = subscriptions.reduce((sum, sub) => sum + sub.events.length, 0)
        
        // Only log if we have subscriptions and haven't logged yet
        if (totalChannels > 0 && !initializedRef.current) {
          console.log('[WebSocket] 📊 WebSocket Initialization Summary:')
          console.log(`[WebSocket] ✅ Connected and configured`)
          console.log(`[WebSocket] ✅ Total channels subscribed: ${totalChannels}`)
          console.log(`[WebSocket] ✅ Total events subscribed: ${totalEvents}`)
          console.log('[WebSocket] 📋 Channel breakdown:')
          subscriptions.forEach(sub => {
            console.log(`[WebSocket]   - ${sub.channel}: ${sub.events.length} events (${sub.events.slice(0, 3).join(', ')}${sub.events.length > 3 ? '...' : ''})`)
          })
          console.log('[WebSocket] ✅ ALL WebSocket channels and events are now subscribed and ready!')
          initializedRef.current = true
        }
      }, 1500) // Wait 1.5 seconds after last subscription to log summary
    }
    
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
    subscribedRef.current = channelName
    
    const privateChannel = echo.private(channelName)
    channelRef.current = privateChannel
    
    // Define all handlers BEFORE subscription so they can be called manually
    // Handle empire updated event (enhanced for real-time updates)
    const handleEmpireUpdated = (data: any) => {
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
          notifyWithToast(dispatch, {
            type: 'info',
            title: 'Empire updated',
            message: changeMessages.join(', '),
            category: 'general',
          })
        }
      }
      
      // Aggressively invalidate all Empire-related tags for real-time updates
      const tags: any[] = ['Empire', 'Universe', 'Resource', 'Planet', 'Statistics']
      
      // Force refetch all active empire queries immediately
      dispatch(apiSlice.util.invalidateTags(tags))
      
      // Also refetch specific queries that might be active
      dispatch(apiSlice.util.invalidateTags([{ type: 'Empire', id: 'LIST' }]))
    }
    
    // Handle planet updated event (enhanced for real-time updates)
    const handlePlanetUpdated = (data: any) => {
      // Extract planet ID from multiple possible locations
      const planetId = data.planet?.id || data.planet_id || data.id
      
      // Aggressively invalidate all planet-related tags for real-time updates
      const tags: any[] = ['Planet', 'Resource', 'Empire', 'Universe']
      
      if (planetId) {
        const pid = Number(planetId)
        // Invalidate construction queue immediately (critical for real-time updates)
        tags.push({ type: 'ConstructionQueue', id: pid })
        tags.push({ type: 'Planet', id: pid })
        tags.push({ type: 'Resource', id: pid })
        tags.push({ type: 'Facility', id: pid })
        tags.push({ type: 'Defence', id: pid })
        tags.push({ type: 'Ship', id: pid })
        tags.push({ type: 'Research', id: pid })
        tags.push({ type: 'Buildable', id: pid })
        
        // Also invalidate general tags to ensure all planet lists update
        tags.push('ConstructionQueue')
        tags.push('Buildable')
      } else {
        // Even without planet_id, invalidate all planet-related tags
        tags.push('ConstructionQueue')
        tags.push('Buildable')
      }
      
      // Invalidate tags immediately for real-time updates
      dispatch(apiSlice.util.invalidateTags(tags))
      
      // Check if resources changed - if so, trigger resource update events
      const changes = data.changes || {}
      if (changes.tellerium_balance || changes.krypton_balance || changes.mines || changes.probes) {
        // Dispatch custom event for resource updates (for UI components that listen)
        window.dispatchEvent(
          new CustomEvent('planet:resources:updated', {
            detail: { planetId, changes, planet: data.planet || data },
          })
        )
      }
      
      // Check if construction queue changed
      if (changes.construction_queue || data.planet?.construction_queue !== undefined) {
        // Dispatch custom event for construction queue updates
        window.dispatchEvent(
          new CustomEvent('planet:construction:updated', {
            detail: { planetId, planet: data.planet || data },
          })
        )
      }
    }
    
    // Handle fleet arrived event (per WebSocket events spec)
    const handleFleetArrivedEvent = (data: any) => {
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
      // Per spec: data.mail.from_empire.name, data.mail.subject
      const mailData = data.mail || data
      const mailSubject = mailData.subject || 'New message'
      const senderName = mailData.from_empire?.name || data.from_empire?.name || data.sender_name || 'Unknown'
      notifyWithToast(dispatch, {
        type: 'info',
        title: 'New Mail',
        message: `${senderName}: ${mailSubject}`,
        category: 'general',
        actionUrl: '/mail',
        data: { mailId: mailData.id, senderName, subject: mailSubject },
      })
      // Invalidate mail tags and unread count to refresh UI
      dispatch(apiSlice.util.invalidateTags([
        { type: 'Mail', id: 'inbox' },
        { type: 'Mail', id: 'LIST' },
        { type: 'Mail', id: 'UNREAD_COUNT' },
      ]))
    }
    
    // Handle fleet attacked event
    const handleFleetAttackedEvent = (data: any) => {
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
      // Invalidate tags to refresh data
      dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet', 'Fleet', 'CombatLog', 'Empire']))
      
      // Determine if this empire is the attacker or defender
      const isAttacker = data.combat_log?.attacker_empire_id === empire?.id
      const isDefender = data.combat_log?.defender_empire_id === empire?.id
      const isWinner = (isAttacker && data.combat_log?.attacker_won) || (isDefender && !data.combat_log?.attacker_won)
      
      // Show notification with battle result
      if (data.combat_log?.id && (isAttacker || isDefender)) {
        const opponentName = isAttacker 
          ? data.combat_log.defender_empire_name 
          : data.combat_log.attacker_empire_name
        const planetCoord = data.combat_log.planet_coordinate || 'Unknown'
        const result = isWinner ? 'Victory' : 'Defeat'
        
        // Add notification to notification center
        dispatch(addNotification({
          type: isWinner ? 'success' : 'error',
          title: `Battle ${result} at ${planetCoord}`,
          message: `${result} against ${opponentName}${data.combat_log.planet_captured ? ' - Planet Captured!' : ''}`,
          category: 'combat',
          actionUrl: '/combat',
          data: {
            combat_log_id: data.combat_log.id,
            planet_coordinate: planetCoord,
            attacker_won: data.combat_log.attacker_won,
            planet_captured: data.combat_log.planet_captured,
          }
        }))
        
        // Show toast notification
        toast[isWinner ? 'success' : 'error'](
          `Battle ${result} at ${planetCoord}!`,
          {
            duration: 10000,
            description: `${result} against ${opponentName}${data.combat_log.planet_captured ? ' - Planet Captured!' : ''}`,
            action: {
              label: 'View Report',
              onClick: () => {
                // Navigate to combat logs page
                window.location.href = '/combat'
              }
            }
          }
        )
      } else {
        toast.info('Combat resolved! Check battle reports for details.')
      }
    }
    
    // Handle research completed event
    const handleResearchCompletedEvent = (data: any) => {
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
    
    // Handle construction completed event (enhanced per guide specs + real-time)
    const handleConstructionCompletedEvent = (data: any) => {
      const { construction, planet } = data
      const planetId = planet?.id || data.planet_id
      const itemType = construction?.type || data.item_type || data.type
      const itemSlug = construction?.item_slug || data.item_slug
      const quantity = construction?.quantity || data.quantity || 1
      const planetName = planet?.name || data.planet_name || `Planet ${planetId}`
      
      // Show notification with proper formatting
      const itemNames: Record<string, string> = {
        facility: 'Facility',
        defence: 'Defence',
        defense: 'Defence',
        ship: 'Ship',
        research: 'Research',
      }
      const itemTypeName = itemNames[itemType?.toLowerCase() || ''] || itemType || 'Item'
      
      dispatch(handleConstructionCompleted({
        planetId: planetId || 0,
        itemType: itemType || 'unknown',
        itemName: itemSlug?.replace(/_/g, ' ') || itemTypeName,
      }))
      
      // Show toast notification
      toast.success(`✅ ${itemTypeName} Complete`, {
        description: `${quantity}x ${itemSlug?.replace(/_/g, ' ') || itemTypeName} completed on ${planetName}`,
        duration: 5000,
      })
      
      // Aggressively invalidate for real-time updates
      const tags: any[] = ['Planet', 'ConstructionQueue', 'Buildable', 'Resource', 'Empire']
      
      if (planetId) {
        const pid = Number(planetId)
        // Invalidate specific planet tags immediately
        tags.push({ type: 'ConstructionQueue', id: pid })
        tags.push({ type: 'Planet', id: pid })
        tags.push({ type: 'Resource', id: pid })
      }
      
      // Also invalidate general tags to ensure all queries update
      tags.push('ConstructionQueue')
      
      const lower = String(itemType || '').toLowerCase()
      if (lower.includes('facility')) {
        tags.push('Facility')
        if (planetId) tags.push({ type: 'Facility', id: Number(planetId) })
      }
      if (lower.includes('defence') || lower.includes('defense')) {
        tags.push('Defence')
        if (planetId) tags.push({ type: 'Defence', id: Number(planetId) })
      }
      if (lower.includes('ship')) {
        tags.push('Ship')
        if (planetId) tags.push({ type: 'Ship', id: Number(planetId) })
      }
      if (lower.includes('research')) {
        tags.push('Research')
        if (planetId) tags.push({ type: 'Research', id: Number(planetId) })
      }
      
      // Dispatch custom event for construction queue updates
      window.dispatchEvent(
        new CustomEvent('planet:construction:updated', {
          detail: { planetId, completed: true, itemType, planet },
        })
      )
      
      dispatch(apiSlice.util.invalidateTags(tags as any))
    }
    
    // Handle fleet launched event (CRITICAL - defender warnings)
    const handleFleetLaunchedEvent = (data: any) => {
      const { fleet, attacker } = data
      const isDefender = fleet?.destination?.owner_empire_id === empire?.id
      const destinationPlanetId = fleet?.destination?.planet_id
      const destinationName = fleet?.destination?.planet_name || fleet?.destination?.coordinate || 'Unknown'
      
      dispatch(handleFleetLaunched({
        isDefender,
        attacker: attacker || fleet?.attacker,
        fleet: fleet || data,
        destinationPlanetId,
      }))
      
      if (isDefender) {
        // URGENT: Show prominent warning
        toast.error('⚠️ Incoming Fleet Attack!', {
          description: `${attacker?.name || 'Unknown'} has launched a fleet at your planet ${destinationName}`,
          duration: 10000,
          action: {
            label: 'View Planet',
            onClick: () => {
              if (destinationPlanetId) {
                window.location.href = `/planets/${destinationPlanetId}`
              }
            },
          },
        })
        
        // Trigger planet highlighting event (for map components)
        window.dispatchEvent(
          new CustomEvent('planet:highlight', {
            detail: { planetId: destinationPlanetId },
          })
        )
      } else {
        // Attacker confirmation
        toast.info('Fleet Launched', {
          description: `Your fleet will arrive at tick ${fleet?.arrival_tick || 'Unknown'}`,
          duration: 5000,
        })
      }
      
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet']))
    }
    
    // Handle planet captured event (CRITICAL - ownership changes)
    const handlePlanetCapturedEvent = (data: any) => {
      const { planet, previous_owner, new_owner, combat_log_id } = data
      const isPreviousOwner = previous_owner?.id === empire?.id
      const isNewOwner = new_owner?.id === empire?.id
      
      dispatch(handlePlanetCaptured({
        isPreviousOwner,
        isNewOwner,
        planet: planet || data.planet,
        previousOwner: previous_owner,
        newOwner: new_owner,
        combatLogId: combat_log_id,
      }))
      
      if (isPreviousOwner) {
        // Planet lost
        toast.error('⚠️ Planet Lost!', {
          description: `${planet?.name || 'Planet'} has been captured by ${new_owner?.name || 'Unknown'}`,
          duration: 10000,
          action: combat_log_id
            ? {
                label: 'View Combat Report',
                onClick: () => {
                  window.location.href = `/combat/${combat_log_id}`
                },
              }
            : undefined,
        })
      } else if (isNewOwner) {
        // Planet captured
        toast.success('🎯 Planet Captured!', {
          description: `You have successfully captured ${planet?.name || 'Planet'}!`,
          duration: 8000,
          action: {
            label: 'View Planet',
            onClick: () => {
              if (planet?.id) {
                window.location.href = `/planets/${planet.id}`
              }
            },
          },
        })
      }
      
      // Refresh data
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Planet', 'Universe', 'CombatLog']))
    }
    
    // Handle planet colonized event (enhanced)
    const handlePlanetColonizedEvent = (data: any) => {
      const { planet, empire: empireData } = data
      const planetId = planet?.id || data.planet_id
      const planetName = planet?.name || 'Planet'
      const coordinate = planet?.coordinate || data.coordinate
      const coordString = coordinate
        ? `${coordinate.quadrant}:${coordinate.sector}:${coordinate.galaxy}:${coordinate.planet}`
        : coordinate
      
      dispatch(handlePlanetColonized({
        planet: planet || { id: planetId, name: planetName, coordinate },
        empire: empireData || { id: empire?.id || 0, name: empire?.name || 'Unknown' },
      }))
      
      // Show success notification
      toast.success('🎉 Planet Colonized!', {
        description: `Successfully colonized ${planetName} at ${coordString}`,
        duration: 8000,
        action: {
          label: 'View Planet',
          onClick: () => {
            if (planetId) {
              window.location.href = `/planets/${planetId}`
            }
          },
        },
      })
      
      // Refresh empire planets list
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Planet', 'Universe']))
      
      // Update universe map
      window.dispatchEvent(
        new CustomEvent('planet:updated', {
          detail: { planet },
        })
      )
    }
    
    // Track all events for private channel (declared outside callback so it's accessible)
    const privateChannelEvents: string[] = []
    
    // Wait for subscription before setting up listeners
    privateChannel.subscribed(() => {
      console.log(`[WebSocket] ✅ Successfully subscribed to private channel: ${channelName}`)
      
      // Set up manual event forwarding for reliability
      const echoWithConnector = echo as any
      if (echoWithConnector.connector?.pusher) {
        const pusher = echoWithConnector.connector.pusher
        const channelNameForPusher = `private-${channelName}`
        const doublePrefixChannelName = `private-private-${channelName}`
        
        // Intercept Pusher messages and manually forward them to our handlers
        pusher.connection.bind('message', (event: any) => {
          // Skip events without a channel
          if (!event.channel) {
            return
          }
          
          // Handle both normal and double-prefixed channel names
          const normalizedChannel = event.channel.replace(/^private-private-/, 'private-')
          const isOurChannel = normalizedChannel === channelNameForPusher || 
                              event.channel === channelNameForPusher ||
                              event.channel === doublePrefixChannelName ||
                              event.channel === `private-${channelName}` ||
                              event.channel === `private-private-${channelName}` ||
                              event.channel.includes(`empire.${empire.id}`)
          
          // Skip internal Pusher events
          if (event.event && (event.event.startsWith('pusher_internal:') || event.event.startsWith('pusher:'))) {
            return
          }
          
          if (isOurChannel) {
            const eventName = event.event
            const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
            
            // Manually trigger our handlers based on event name match
            if (eventName === 'planet.updated' || eventName.includes('planet.updated') || eventName.includes('PlanetUpdated')) {
              handlePlanetUpdated(eventData)
            }
            if (eventName === 'construction.completed' || eventName.includes('construction.completed') || eventName.includes('ConstructionCompleted')) {
              handleConstructionCompletedEvent(eventData)
            }
            if (eventName === 'research.completed' || eventName.includes('research.completed') || eventName.includes('ResearchCompleted')) {
              handleResearchCompletedEvent(eventData)
            }
            if (eventName === 'fleet.arrived' || eventName.includes('fleet.arrived') || eventName.includes('FleetArrived')) {
              handleFleetArrivedEvent(eventData)
            }
            if (eventName === 'resources.updated' || eventName.includes('resources.updated') || eventName.includes('ResourcesUpdated')) {
              handleResourcesUpdated(eventData)
            }
            if (eventName === 'empire.updated' || eventName.includes('empire.updated') || eventName.includes('EmpireUpdated')) {
              handleEmpireUpdated(eventData)
            }
            if (eventName === 'mail.received' || eventName.includes('mail.received') || eventName.includes('MailReceived')) {
              handleMailReceived(eventData)
            }
            if (eventName === 'fleet.attacked' || eventName.includes('fleet.attacked') || eventName.includes('FleetAttacked')) {
              handleFleetAttackedEvent(eventData)
            }
            if (eventName === 'empire.attacked' || eventName.includes('empire.attacked') || eventName.includes('EmpireAttacked')) {
              handleEmpireAttackedEvent(eventData)
            }
            if (eventName === 'combat.resolved' || eventName.includes('combat.resolved') || eventName.includes('CombatResolved')) {
              handleCombatResolvedEvent(eventData)
            }
            if (eventName === 'announcement.created' || eventName.includes('announcement') && eventName.includes('created')) {
              handleAnnouncementCreated(eventData)
            }
            if (eventName === 'announcement.published' || eventName.includes('announcement') && eventName.includes('published')) {
              handleAnnouncementCreated(eventData)
            }
            if (eventName === 'fleet.launched' || eventName.includes('fleet.launched') || eventName.includes('FleetLaunched')) {
              handleFleetLaunchedEvent(eventData)
            }
            if (eventName === 'planet.captured' || eventName.includes('planet.captured') || eventName.includes('PlanetCaptured')) {
              handlePlanetCapturedEvent(eventData)
            }
            if (eventName === 'planet.colonized' || eventName.includes('planet.colonized') || eventName.includes('PlanetColonized')) {
              handlePlanetColonizedEvent(eventData)
            }
          }
        })
        
        // Also intercept at the channel level
        setTimeout(() => {
          const pusherChannel = pusher.channel(channelNameForPusher)
          const doublePrefixPusherChannel = pusher.channel(doublePrefixChannelName)
          
          if (pusherChannel) {
            const originalHandleEvent = (pusherChannel as any).handleEvent
            if (originalHandleEvent) {
              (pusherChannel as any).handleEvent = function(eventName: string, data: any) {
                const result = originalHandleEvent.call(this, eventName, data)
                try {
                  privateChannel.listen(eventName, () => {})
                } catch (e) {
                  // Ignore
                }
                return result
              }
            }
          }
          
          if (doublePrefixPusherChannel) {
            const originalHandleEvent2 = (doublePrefixPusherChannel as any).handleEvent
            if (originalHandleEvent2) {
              (doublePrefixPusherChannel as any).handleEvent = function(eventName: string, data: any) {
                const result = originalHandleEvent2.call(this, eventName, data)
                try {
                  privateChannel.listen(eventName, () => {})
                } catch (e) {
                  // Ignore
                }
                return result
              }
            }
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
      privateChannelEvents.push('empire.updated', '.empire.updated', 'EmpireUpdated', 'App\\Events\\EmpireUpdated', 'App.Events.EmpireUpdated')

      // Handle news created event
      privateChannel.listen('news.created', (data: any) => {
        notifyWithToast(dispatch, {
          type: 'info',
          title: 'New News Item',
          message: 'A new news item is available',
          category: 'general',
          data: { newsId: data.news?.id || data.id },
        })
        dispatch(apiSlice.util.invalidateTags(['Empire']))
      })
      privateChannelEvents.push('news.created')

      // Handle mail received event - try multiple naming variations
      privateChannel.listen('mail.received', handleMailReceived)
      privateChannel.listen('.mail.received', handleMailReceived)
      privateChannel.listen('MailReceived', handleMailReceived)
      privateChannel.listen('mail_received', handleMailReceived)
      privateChannel.listen('App\\Events\\MailReceived', handleMailReceived)
      privateChannel.listen('App.Events.MailReceived', handleMailReceived)
      privateChannelEvents.push('mail.received', '.mail.received', 'MailReceived', 'mail_received', 'App\\Events\\MailReceived', 'App.Events.MailReceived')

      // Register fleet listeners
      privateChannel.listen('fleet.arrived', handleFleetArrivedEvent)
      privateChannel.listen('.fleet.arrived', handleFleetArrivedEvent)
      privateChannel.listen('FleetArrived', handleFleetArrivedEvent)
      privateChannel.listen('App\\Events\\FleetArrived', handleFleetArrivedEvent)
      privateChannel.listen('App.Events.FleetArrived', handleFleetArrivedEvent)
      privateChannelEvents.push('fleet.arrived', '.fleet.arrived', 'FleetArrived', 'App\\Events\\FleetArrived', 'App.Events.FleetArrived')

      // Handle planet updated event (if owned) - try multiple naming variations
      privateChannel.listen('planet.updated', handlePlanetUpdated)
      privateChannel.listen('.planet.updated', handlePlanetUpdated)
      privateChannel.listen('PlanetUpdated', handlePlanetUpdated)
      privateChannel.listen('App\\Events\\PlanetUpdated', handlePlanetUpdated)
      privateChannel.listen('App.Events.PlanetUpdated', handlePlanetUpdated)
      privateChannelEvents.push('planet.updated', '.planet.updated', 'PlanetUpdated', 'App\\Events\\PlanetUpdated', 'App.Events.PlanetUpdated')

      // Try multiple event name variations for construction completed
      privateChannel.listen('.construction.completed', handleConstructionCompletedEvent)
      privateChannel.listen('construction.completed', handleConstructionCompletedEvent)
      privateChannel.listen('ConstructionCompleted', handleConstructionCompletedEvent)
      privateChannel.listen('construction_completed', handleConstructionCompletedEvent)
      privateChannel.listen('App\\Events\\ConstructionCompleted', handleConstructionCompletedEvent)
      privateChannel.listen('App.Events.ConstructionCompleted', handleConstructionCompletedEvent)
      privateChannelEvents.push('.construction.completed', 'construction.completed', 'ConstructionCompleted', 'construction_completed', 'App\\Events\\ConstructionCompleted', 'App.Events.ConstructionCompleted')

      // Register resources listeners
      privateChannel.listen('resources.updated', handleResourcesUpdated)
      privateChannel.listen('.resources.updated', handleResourcesUpdated)
      privateChannel.listen('ResourcesUpdated', handleResourcesUpdated)
      privateChannel.listen('App\\Events\\ResourcesUpdated', handleResourcesUpdated)
      privateChannel.listen('App.Events.ResourcesUpdated', handleResourcesUpdated)
      privateChannelEvents.push('resources.updated', '.resources.updated', 'ResourcesUpdated', 'App\\Events\\ResourcesUpdated', 'App.Events.ResourcesUpdated')

      // Register research listeners
      privateChannel.listen('research.completed', handleResearchCompletedEvent)
      privateChannel.listen('.research.completed', handleResearchCompletedEvent)
      privateChannel.listen('ResearchCompleted', handleResearchCompletedEvent)
      privateChannel.listen('App\\Events\\ResearchCompleted', handleResearchCompletedEvent)
      privateChannel.listen('App.Events.ResearchCompleted', handleResearchCompletedEvent)
      privateChannelEvents.push('research.completed', '.research.completed', 'ResearchCompleted', 'App\\Events\\ResearchCompleted', 'App.Events.ResearchCompleted')

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
      privateChannelEvents.push('.alliance.message')

      // Handle planet colonized event (enhanced)
      privateChannel.listen('.planet.colonized', handlePlanetColonizedEvent)
      privateChannel.listen('planet.colonized', handlePlanetColonizedEvent)
      privateChannel.listen('PlanetColonized', handlePlanetColonizedEvent)
      privateChannelEvents.push('.planet.colonized', 'planet.colonized', 'PlanetColonized')
      
      // Handle fleet launched event (CRITICAL)
      privateChannel.listen('.fleet.launched', handleFleetLaunchedEvent)
      privateChannel.listen('fleet.launched', handleFleetLaunchedEvent)
      privateChannel.listen('FleetLaunched', handleFleetLaunchedEvent)
      privateChannelEvents.push('.fleet.launched', 'fleet.launched', 'FleetLaunched')
      
      // Handle planet captured event (CRITICAL)
      privateChannel.listen('.planet.captured', handlePlanetCapturedEvent)
      privateChannel.listen('planet.captured', handlePlanetCapturedEvent)
      privateChannel.listen('PlanetCaptured', handlePlanetCapturedEvent)
      privateChannelEvents.push('.planet.captured', 'planet.captured', 'PlanetCaptured')

      // Handle fleet attacked event - try multiple naming variations
      privateChannel.listen('fleet.attacked', handleFleetAttackedEvent)
      privateChannel.listen('.fleet.attacked', handleFleetAttackedEvent)
      privateChannel.listen('FleetAttacked', handleFleetAttackedEvent)
      privateChannel.listen('fleet_attacked', handleFleetAttackedEvent)
      privateChannel.listen('App\\Events\\FleetAttacked', handleFleetAttackedEvent)
      privateChannel.listen('App.Events.FleetAttacked', handleFleetAttackedEvent)
      privateChannelEvents.push('fleet.attacked', '.fleet.attacked', 'FleetAttacked', 'fleet_attacked', 'App\\Events\\FleetAttacked', 'App.Events.FleetAttacked')

      // Handle empire attacked event - try multiple naming variations
      privateChannel.listen('empire.attacked', handleEmpireAttackedEvent)
      privateChannel.listen('.empire.attacked', handleEmpireAttackedEvent)
      privateChannel.listen('EmpireAttacked', handleEmpireAttackedEvent)
      privateChannel.listen('empire_attacked', handleEmpireAttackedEvent)
      privateChannel.listen('App\\Events\\EmpireAttacked', handleEmpireAttackedEvent)
      privateChannel.listen('App.Events.EmpireAttacked', handleEmpireAttackedEvent)
      privateChannelEvents.push('empire.attacked', '.empire.attacked', 'EmpireAttacked', 'empire_attacked', 'App\\Events\\EmpireAttacked', 'App.Events.EmpireAttacked')

      // Handle combat resolved event on private channel - try multiple naming variations
      privateChannel.listen('combat.resolved', handleCombatResolvedEvent)
      privateChannel.listen('.combat.resolved', handleCombatResolvedEvent)
      privateChannel.listen('CombatResolved', handleCombatResolvedEvent)
      privateChannel.listen('combat_resolved', handleCombatResolvedEvent)
      privateChannel.listen('App\\Events\\CombatResolved', handleCombatResolvedEvent)
      privateChannel.listen('App.Events.CombatResolved', handleCombatResolvedEvent)
      privateChannelEvents.push('combat.resolved', '.combat.resolved', 'CombatResolved', 'combat_resolved', 'App\\Events\\CombatResolved', 'App.Events.CombatResolved')

      // Handle fleet departed event
      privateChannel.listen('.fleet.departed', (data: any) => {
        notifyWithToast(dispatch, {
          type: 'info',
          title: 'Fleet Departed',
          message: `Fleet departed from ${data.origin_coordinate || 'origin'}`,
          category: 'fleet',
          actionUrl: data.fleet_id ? `/fleets/${data.fleet_id}` : '/fleets',
          data: { fleetId: data.fleet_id, originCoordinate: data.origin_coordinate },
        })
        dispatch(apiSlice.util.invalidateTags(['Fleet']))
      })
      privateChannelEvents.push('.fleet.departed')
      
      // Track subscription for private channel
      console.log(`[WebSocket] ✅ Successfully subscribed to private channel: ${channelName}`)
      console.log(`[WebSocket] ✅ Registered ${privateChannelEvents.length} events on private-${channelName}`)
      trackSubscription(`private-${channelName}`, privateChannelEvents)
    })

    privateChannel.error((error: any) => {
      console.error('[WebSocket] ❌ Channel subscription error:', error)
      console.error('[WebSocket] Error details:', JSON.stringify(error, null, 2))
      console.error('[WebSocket] Channel:', channelName)
      console.error('[WebSocket] Auth endpoint:', authEndpoint)
      subscribedRef.current = null // Reset on error so it can retry
    })


    // Subscribe to public tick channel (use 'public.tick' as per guide)
    const publicTickChannel = echo.channel('public.tick')
    const tickChannelEvents: string[] = []
    
    publicTickChannel.error((error: any) => {
      console.error('[WebSocket] Error subscribing to tick channel:', error)
    })
    
    const handleTickProcessedEvent = (data: any) => {
      
      const tickNumber = data.tick_number || data.tickNumber || data.tick?.number || data.tick
      const nextTickEta = data.next_tick_eta || data.next_tick_at || data.nextTickEta || data.nextTickAt
      
      // Update countdown from WebSocket event
      if (data.next_tick_at && data.tick_interval) {
        updateCountdownFromWebSocket({
          tick_number: tickNumber,
          next_tick_at: data.next_tick_at,
          tick_interval: data.tick_interval,
          next_tick_eta: nextTickEta,
        })
      } else {
        // Fallback to old format
        dispatch(setTick({ tick: tickNumber, nextTickETA: nextTickEta }))
      }
      
      // Create notification (handleTickProcessed already adds to notification tray)
      dispatch(handleTickProcessed({
        tickNumber: tickNumber,
        nextTickEta: nextTickEta || 'calculating...',
      }))
      
      // Also show toast for immediate visibility
      toast.info(`Tick ${tickNumber} Processed`, {
        description: `Game tick ${tickNumber} has completed processing`,
        duration: 5000,
      })
      
      dispatch(setTickProcessing(false))
      
      // Invalidate Signal tags when tick processes (signals are processed during ticks)
      dispatch(apiSlice.util.invalidateTags(['Signal', 'Tick', 'Planet', 'Resource', 'Fleet', 'Empire']))
    }
    
    // Listen for multiple event name variations
    const wrappedTickHandler = (data: any) => {
      handleTickProcessedEvent(data)
    }
    
    // Register events FIRST, then set up subscription callback
    publicTickChannel.listen('.tick.processed', wrappedTickHandler)
    publicTickChannel.listen('tick.processed', wrappedTickHandler)
    publicTickChannel.listen('TickProcessed', wrappedTickHandler)
    publicTickChannel.listen('App\\Events\\TickProcessed', wrappedTickHandler)
    publicTickChannel.listen('App.Events.TickProcessed', wrappedTickHandler)
    tickChannelEvents.push('.tick.processed', 'tick.processed', 'TickProcessed', 'App\\Events\\TickProcessed', 'App.Events.TickProcessed')
    
    // Now set up subscription callback AFTER events are registered
    publicTickChannel.subscribed(() => {
      console.log('[WebSocket] ✅ Successfully subscribed to public channel: public.tick')
      trackSubscription('public.tick', tickChannelEvents)
    })
    
    // Also check if already subscribed (in case it subscribed synchronously)
    const echoWithConnectorForTick = echo as any
    if (echoWithConnectorForTick.connector?.pusher) {
      const pusher = echoWithConnectorForTick.connector.pusher
      const tickPusherChannel = pusher.channel('public.tick')
      if (tickPusherChannel && (tickPusherChannel as any).subscribed) {
        // Already subscribed, track it now
        setTimeout(() => trackSubscription('public.tick', tickChannelEvents), 100)
      }
    }
    
    // Initialize tick countdown from API on mount
    initializeTickCountdown().catch((error) => {
      console.error('[WebSocket] Failed to initialize tick countdown:', error)
    })

    // Subscribe to public announcements channel for real-time announcements
    const announcementsChannel = echo.channel('announcements')
    const announcementChannelEvents: string[] = []
    
    const handleAnnouncementCreated = (data: any) => {
      const announcement = data.announcement || data
      const title = announcement.title || 'New announcement'
      const priority = announcement.priority || 'info'
      
      // Show toast notification
      toast.success(`New announcement: ${title}`, {
        duration: 10000,
        description: announcement.message || announcement.content || '',
      })
      
      // Add notification to notification tray
      dispatch(addNotification({
        type: priority === 'alert' ? 'error' : priority === 'warning' ? 'warning' : priority === 'success' ? 'success' : 'info',
        title: `New Announcement: ${title}`,
        message: announcement.message || announcement.content || 'A new announcement has been published',
        category: 'announcement',
        data: {
          announcement_id: announcement.id,
        },
      }))
      
      // Invalidate announcement cache to refresh the list
      dispatch(apiSlice.util.invalidateTags(['Announcement']))
    }
    
    // Register events FIRST, then set up subscription callback
    announcementsChannel.listen('announcement.created', handleAnnouncementCreated)
    announcementsChannel.listen('.announcement.created', handleAnnouncementCreated)
    announcementsChannel.listen('AnnouncementCreated', handleAnnouncementCreated)
    announcementsChannel.listen('announcement.published', handleAnnouncementCreated)
    announcementsChannel.listen('.announcement.published', handleAnnouncementCreated)
    announcementsChannel.listen('AnnouncementPublished', handleAnnouncementCreated)
    announcementChannelEvents.push('announcement.created', '.announcement.created', 'AnnouncementCreated', 'announcement.published', '.announcement.published', 'AnnouncementPublished')
    
    // Now set up subscription callback AFTER events are registered
    announcementsChannel.subscribed(() => {
      console.log('[WebSocket] ✅ Successfully subscribed to public channel: announcements')
      trackSubscription('announcements', announcementChannelEvents)
    })
    
    // Also check if already subscribed (in case it subscribed synchronously)
    const echoWithConnectorForAnnouncements = echo as any
    if (echoWithConnectorForAnnouncements.connector?.pusher) {
      const pusher = echoWithConnectorForAnnouncements.connector.pusher
      const announcementsPusherChannel = pusher.channel('announcements')
      if (announcementsPusherChannel && (announcementsPusherChannel as any).subscribed) {
        // Already subscribed, track it now
        setTimeout(() => trackSubscription('announcements', announcementChannelEvents), 100)
      }
    }
    
    // Intercept at connection level for debugging multiple channels (tick and announcements)
    const echoWithConnector = echo as any
    if (echoWithConnector.connector?.pusher) {
      const pusher = echoWithConnector.connector.pusher
      
      pusher.connection.bind('message', (event: any) => {
        const channelName = event.channel || 'unknown'
        const eventName = event.event || 'unknown'
        
        // Check if this is for the tick channel
        if (channelName === 'public-tick' || channelName === 'public.tick' || channelName.includes('tick')) {
          // If it's a tick.processed event, manually trigger handler
          if (eventName.includes('tick') && (eventName.includes('processed') || eventName.includes('Processed'))) {
            const eventData = typeof event.data === 'string' ? (() => {
              try {
                return JSON.parse(event.data)
              } catch {
                return event.data
              }
            })() : event.data
            handleTickProcessedEvent(eventData)
          }
        }
        
        // Check if this is for the announcements channel
        if (channelName === 'public-announcements' || channelName === 'announcements' || channelName.includes('announcements')) {
          const eventData = typeof event.data === 'string' ? (() => {
            try {
              return JSON.parse(event.data)
            } catch {
              return event.data
            }
          })() : event.data
          
          if (eventName === 'announcement.created' || (eventName.includes('announcement') && eventName.includes('created'))) {
            handleAnnouncementCreated(eventData)
          }
          if (eventName === 'announcement.published' || (eventName.includes('announcement') && eventName.includes('published'))) {
            handleAnnouncementCreated(eventData)
          }
        }
      })
    }

    // Subscribe to alliance channel automatically when empire is in an alliance
    if (empire?.alliance_id) {
      const allianceChannelName = `alliance.${empire.alliance_id}`
      const allianceChannelEvents: string[] = []
      
      const allianceChannel = echo.private(allianceChannelName)
      allianceChannelRef.current = allianceChannel
      
      // Handle alliance chat message event
      allianceChannel.listen('.alliance.chat.message', (data: any) => {
        const { message } = data
        const senderName = message?.sender_empire?.name || data.sender_name || 'Unknown'
        
        dispatch(handleAllianceMessage({
          senderName,
          message: message?.message || data.message || '',
          allianceId: message?.alliance_id || empire.alliance_id || 0,
        }))
        
        // Show toast notification (only if chat window is not focused)
        toast.info(`Alliance Message from ${senderName}`, {
          description: message?.message?.substring(0, 100) || '',
          duration: 5000,
        })
        
        // Invalidate alliance tags
        dispatch(apiSlice.util.invalidateTags(['Alliance', 'Chat']))
      })
      allianceChannelEvents.push('.alliance.chat.message')
      
      // Set up subscription callback AFTER events are registered
      allianceChannel.subscribed(() => {
        console.log(`[WebSocket] ✅ Successfully subscribed to private channel: ${allianceChannelName}`)
        console.log(`[WebSocket] ✅ Registered ${allianceChannelEvents.length} events on ${allianceChannelName}`)
        trackSubscription(`private-${allianceChannelName}`, allianceChannelEvents)
      })
      
      allianceChannel.error((error: any) => {
        console.error('[WebSocket] Alliance channel subscription error:', error)
      })
    }

    // Subscribe to galaxy channels for map updates when planet data is available
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
          const galaxyChannelEvents: string[] = []
          
          galaxyChannel.listen('planet.updated', () => {
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet']))
          })
          galaxyChannel.listen('.combat.resolved', (data: any) => {
            // Invalidate tags to refresh data
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet', 'Fleet', 'CombatLog', 'Empire']))
          })
          galaxyChannelEvents.push('planet.updated', '.combat.resolved')
          
          // Set up subscription callback AFTER events are registered
          galaxyChannel.subscribed(() => {
            console.log(`[WebSocket] ✅ Successfully subscribed to public channel: ${channelName}`)
            console.log(`[WebSocket] ✅ Registered ${galaxyChannelEvents.length} events on ${channelName}`)
            trackSubscription(channelName, galaxyChannelEvents)
          })
        }
      })
      console.log(`[WebSocket] ✅ Subscribed to ${galaxyChannels.size} galaxy channels for map updates`)
    } else if (token && empire) {
      // Log that we're waiting for planet data
      console.log('[WebSocket] ⏳ Waiting for planet data to subscribe to galaxy channels...')
    }
    
    // Final summary check after delay to ensure all channels are tracked
    // This catches any channels that subscribed but their callbacks haven't fired yet
    setTimeout(() => {
      if (!initializedRef.current && subscriptionsRef.current.length > 0) {
        console.log('[WebSocket] 🔍 Final subscription check - triggering summary...')
        logSubscriptionSummary()
      }
    }, 3000) // After 3 seconds, force summary if not already logged

    // Cleanup function
    return () => {
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
  }, [token, empire?.id, dispatch, meData?.planets]) // Include meData.planets to subscribe to galaxy channels when available
}

