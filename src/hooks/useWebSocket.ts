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

  useEffect(() => {
    if (!token || !empire) {
      disconnectEcho()
      return
    }

    const echo = initializeEcho(token)

    // Subscribe to private empire channel
    const privateChannel = echo.private(`empire.${empire.id}`)

    // Handle empire updated event
    privateChannel.listen('empire.updated', (data: any) => {
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
      dispatch(apiSlice.util.invalidateTags(['Planet']))
    })

    // Note: The following events may not be in the official API but keeping for backward compatibility
    // These use dot-prefixed names which Laravel may broadcast differently

    // Note: construction.completed, research.completed, etc. may not be in the official API
    // but keeping them for backward compatibility
    privateChannel.listen('.construction.completed', (data: any) => {
      dispatch(handleConstructionCompleted({
        planetId: data.planet_id,
        itemType: data.item_type,
        itemName: data.item_name || data.item_type.replace(/_/g, ' '),
      }))
      toast.success(`${data.item_type} construction completed on planet ${data.planet_id}`)
      // Invalidate specific collections depending on item type
      const tags: any[] = ['Planet', 'ConstructionQueue', 'Buildable']
      const lower = String(data.item_type || '').toLowerCase()
      if (lower.includes('facility')) tags.push('Facility')
      if (lower.includes('defence') || lower.includes('defense')) tags.push('Defence')
      if (lower.includes('ship')) tags.push('Ship')
      if (lower.includes('research')) tags.push('Research')
      dispatch(apiSlice.util.invalidateTags(tags as any))
    })

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

    return () => {
      disconnectEcho()
    }
  }, [token, empire, dispatch, meData])
}

