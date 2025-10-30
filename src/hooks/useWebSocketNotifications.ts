import { useEffect } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { getEcho } from '@/lib/websocket'
import { useAuth } from '@/hooks/useAuth'
import {
  handleConstructionCompleted,
  handleFleetArrived,
  handleFleetAttacked,
  handleEmpireAttacked,
  handleResearchCompleted,
  handleAllianceMessage,
  handleTickProcessed,
  addNotification
} from '@/app/slices/notificationSlice'

interface UseWebSocketNotificationsProps {
  enabled?: boolean
}

export function useWebSocketNotifications({ enabled = true }: UseWebSocketNotificationsProps) {
  const dispatch = useAppDispatch()
  const { empire } = useAuth()
  const echo = getEcho()

  useEffect(() => {
    if (!echo || !enabled || !empire) {
      console.log('WebSocket not available or notifications disabled:', { echo: !!echo, enabled, empire: !!empire })
      return
    }

    console.log('Setting up WebSocket notifications...')

    // Private channel for empire-specific notifications (matches useWebSocket hook)
    const privateChannel = echo.private(`empire.${empire.id}`)

    // Listen for construction completed events
    privateChannel.listen('.construction.completed', (data: any) => {
      console.log('Construction completed event:', data)
      dispatch(handleConstructionCompleted({
        planetId: data.planet_id,
        itemType: data.item_type,
        itemName: data.item_name
      }))
    })

    // Listen for fleet events
    privateChannel.listen('.fleet.arrived', (data: any) => {
      console.log('Fleet arrived event:', data)
      dispatch(handleFleetArrived({
        fleetId: data.fleet_id,
        destination: data.destination,
        fleetName: data.fleet_name
      }))
    })

    privateChannel.listen('.fleet.attacked', (data: any) => {
      console.log('Fleet attacked event:', data)
      dispatch(handleFleetAttacked({
        fleetId: data.fleet_id,
        attacker: data.attacker,
        location: data.location
      }))
    })

    // Listen for empire attack events
    privateChannel.listen('.empire.attacked', (data: any) => {
      console.log('Empire attacked event:', data)
      dispatch(handleEmpireAttacked({
        planetId: data.planet_id,
        attacker: data.attacker,
        location: data.location
      }))
    })

    // Listen for research completed events
    privateChannel.listen('.research.completed', (data: any) => {
      console.log('Research completed event:', data)
      dispatch(handleResearchCompleted({
        researchName: data.research_name,
        planetId: data.planet_id
      }))
    })

    // Listen for alliance message events
    privateChannel.listen('.alliance.message', (data: any) => {
      console.log('Alliance message event:', data)
      dispatch(handleAllianceMessage({
        senderName: data.sender_name,
        message: data.message,
        allianceId: data.alliance_id
      }))
    })

    // Listen for tick processed events
    privateChannel.listen('.tick.processed', (data: any) => {
      console.log('Tick processed event:', data)
      dispatch(handleTickProcessed({
        tickNumber: data.tick_number,
        nextTickEta: data.next_tick_eta
      }))
    })

    // Listen for general game events
    privateChannel.listen('.game.event', (data: any) => {
      console.log('Game event:', data)
      dispatch(addNotification({
        type: data.type || 'info',
        title: data.title || 'Game Event',
        message: data.message || 'A game event has occurred',
        category: data.category || 'general',
        actionUrl: data.action_url,
        data: data.data
      }))
    })

    // Listen for resource updates
    privateChannel.listen('.resources.updated', (data: any) => {
      console.log('Resources updated event:', data)
      dispatch(addNotification({
        type: 'info',
        title: 'Resources Updated',
        message: `Resources have been updated on Planet ${data.planet_id}`,
        category: 'general',
        actionUrl: `/planets/${data.planet_id}`,
        data: data
      }))
    })

    // Listen for planet colonization events
    privateChannel.listen('.planet.colonized', (data: any) => {
      console.log('Planet colonized event:', data)
      dispatch(addNotification({
        type: 'success',
        title: 'Planet Colonized',
        message: `Planet ${data.planet_id} has been successfully colonized`,
        category: 'construction',
        actionUrl: `/planets/${data.planet_id}`,
        data: data
      }))
    })

    return () => {
      console.log('Cleaning up WebSocket notification listeners...')
      privateChannel.stopListening('.construction.completed')
      privateChannel.stopListening('.fleet.arrived')
      privateChannel.stopListening('.fleet.attacked')
      privateChannel.stopListening('.empire.attacked')
      privateChannel.stopListening('.research.completed')
      privateChannel.stopListening('.alliance.message')
      privateChannel.stopListening('.tick.processed')
      privateChannel.stopListening('.game.event')
      privateChannel.stopListening('.resources.updated')
      privateChannel.stopListening('.planet.colonized')
    }
  }, [echo, enabled, dispatch, empire])

  return {
    isConnected: !!echo
  }
}

