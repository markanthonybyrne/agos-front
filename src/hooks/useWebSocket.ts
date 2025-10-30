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

    // Handle tick processed event
    privateChannel.listen('.tick.processed', (data: any) => {
      dispatch(setTick({ tick: data.tick_number, nextTickETA: data.next_tick_eta }))
      dispatch(setTickProcessing(false))
      toast.success(`Tick ${data.tick_number} processed!`)
      
      // Invalidate all relevant caches
      dispatch(apiSlice.util.invalidateTags(['Empire', 'Planet', 'Fleet']))
    })

    // Handle fleet arrived event
    privateChannel.listen('.fleet.arrived', (data: any) => {
      dispatch(handleFleetArrived({
        fleetId: data.fleet_id,
        destination: data.destination_coordinate || data.destination,
        fleetName: data.fleet_name || `Fleet ${data.fleet_id}`,
      }))
      toast.info(`Fleet arrived at ${data.destination_coordinate}`)
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet']))
    })

    // Handle combat resolved event
    privateChannel.listen('.combat.resolved', (data: any) => {
      toast.warning(`Combat resolved at ${data.location_coordinate}`)
      dispatch(apiSlice.util.invalidateTags(['Fleet', 'Planet', 'Empire']))
    })

    // Handle mail received event
    privateChannel.listen('.mail.received', (data: any) => {
      toast.info('New mail received')
      dispatch(apiSlice.util.invalidateTags(['Empire']))
    })

    // Handle construction completed event
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

    // Subscribe to public tick channel
    const publicTickChannel = echo.channel('public.tick')
    
    publicTickChannel.listen('.tick.processed', (data: any) => {
      dispatch(handleTickProcessed({
        tickNumber: data.tick_number,
        nextTickEta: data.next_tick_eta,
      }))
      dispatch(setTick({ tick: data.tick_number, nextTickETA: data.next_tick_eta }))
      dispatch(setTickProcessing(false))
    })

          // Subscribe to galaxy channels for map updates
          if (meData?.planets) {
            const galaxyChannels = new Set<string>()
            meData.planets.forEach((planet: any) => {
        const coordString = formatCoordinate(planet.coordinate)
        const [quad, sec, gal] = coordString.split(':')
        const channelName = `public-galaxy.${quad}.${sec}.${gal}`
        if (!galaxyChannels.has(channelName)) {
          galaxyChannels.add(channelName)
          const galaxyChannel = echo.channel(channelName)
          galaxyChannel.listen('.planet.updated', () => {
            dispatch(apiSlice.util.invalidateTags(['Universe', 'Planet']))
          })
        }
      })
    }

    return () => {
      disconnectEcho()
    }
  }, [token, empire, dispatch, meData])
}

