import { useEffect, useCallback } from 'react'
import { getEcho } from '@/lib/websocket'
import { useGetAllianceChatQuery } from '@/api/endpoints/allianceChatApi'
import { useAppDispatch } from '@/app/hooks'
import { allianceChatApi } from '@/api/endpoints/allianceChatApi'

interface UseAllianceChatProps {
  allianceId: number
  enabled?: boolean
}

export function useAllianceChat({ allianceId, enabled = true }: UseAllianceChatProps) {
  const dispatch = useAppDispatch()
  const echo = getEcho()

  // Subscribe to alliance chat channel
  useEffect(() => {
    if (!echo || !enabled) {
      console.log('WebSocket not available or disabled:', { echo: !!echo, enabled })
      return
    }

    const channelName = `private-alliance.${allianceId}`
    console.log('Subscribing to alliance chat channel:', channelName)
    const channel = echo.private(channelName)

    // Listen for new chat messages
    channel.listen('.alliance.chat.message', (data: any) => {
      console.log('New alliance chat message received:', data)
      
      // Invalidate the chat query to refetch latest messages
      dispatch(allianceChatApi.util.invalidateTags(['Alliance']))
    })

    // Listen for member join/leave events
    channel.listen('.alliance.member.joined', (data: any) => {
      console.log('Member joined alliance:', data)
      // Could show a toast notification here
    })

    channel.listen('.alliance.member.left', (data: any) => {
      console.log('Member left alliance:', data)
      // Could show a toast notification here
    })

    return () => {
      channel.stopListening('.alliance.chat.message')
      channel.stopListening('.alliance.member.joined')
      channel.stopListening('.alliance.member.left')
    }
  }, [echo, allianceId, enabled, dispatch])

  // Function to manually trigger a refetch
  const refetchChat = useCallback(() => {
    dispatch(allianceChatApi.util.invalidateTags(['Alliance']))
  }, [dispatch, allianceId])

  return {
    refetchChat,
  }
}
