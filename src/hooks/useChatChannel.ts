import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { getEcho } from '@/lib/websocket'
import { 
  setTypingUser,
  updateOnlineUser,
  setOnlineUsers,
  setLastMessageId,
} from '@/app/slices/chatSlice'
import { chatApi } from '@/api/endpoints/chatApi'
import { ChatMessage, OnlineUser } from '@/types/api.types'

interface UseChatChannelProps {
  channelSlug: string
  enabled?: boolean
  onMessageReceived?: (message: ChatMessage) => void
  onMessageEdited?: (message: ChatMessage) => void
  onMessageDeleted?: (messageId: number) => void
}

export function useChatChannel({
  channelSlug,
  enabled = true,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
}: UseChatChannelProps) {
  const dispatch = useAppDispatch()
  const echo = getEcho()
  const channelRef = useRef<any>(null)
  const subscriptionRef = useRef<string | null>(null)

  // Subscribe to WebSocket channel
  useEffect(() => {
    if (!echo || !enabled || !channelSlug) {
      console.log('Chat channel subscription skipped:', { echo: !!echo, enabled, channelSlug })
      return
    }

    // Prevent multiple subscriptions to the same channel
    if (subscriptionRef.current === channelSlug) {
      console.log('[Chat] Already subscribed to', channelSlug, ', skipping...')
      return
    }

    const channelName = `public-chat.${channelSlug}`
    console.log('[Chat] Subscribing to channel:', channelName)

    try {
      const channel = echo.channel(channelName)
      channelRef.current = channel
      subscriptionRef.current = channelSlug

      // Listen for new messages
      channel.listen('.chat.message.sent', (event: any) => {
        console.log('[Chat] New message received:', event)
        if (event.message) {
          dispatch(setLastMessageId({ channelSlug, messageId: event.message.id }))
          dispatch(chatApi.util.invalidateTags(['Chat']))
          if (onMessageReceived) {
            onMessageReceived(event.message as ChatMessage)
          }
        }
      })

      // Listen for message edits
      channel.listen('.chat.message.edited', (event: any) => {
        console.log('[Chat] Message edited:', event)
        if (event.message) {
          dispatch(chatApi.util.invalidateTags(['Chat']))
          if (onMessageEdited) {
            onMessageEdited(event.message as ChatMessage)
          }
        }
      })

      // Listen for message deletions
      channel.listen('.chat.message.deleted', (event: any) => {
        console.log('[Chat] Message deleted:', event)
        if (event.message_id) {
          dispatch(chatApi.util.invalidateTags(['Chat']))
          if (onMessageDeleted) {
            onMessageDeleted(event.message_id)
          }
        }
      })

      // Listen for typing indicators
      channel.listen('.chat.user.typing', (event: any) => {
        console.log('[Chat] User typing:', event)
        if (event.empire_id && event.is_typing !== undefined) {
          dispatch(
            setTypingUser({
              channelSlug,
              empireId: event.empire_id,
              isTyping: event.is_typing,
            })
          )
        }
      })

      // Listen for presence changes
      channel.listen('.chat.presence.changed', (event: any) => {
        console.log('[Chat] Presence changed:', event)
        if (event.empire_id && event.empire_name) {
          const user: OnlineUser = {
            empire_id: event.empire_id,
            empire_name: event.empire_name,
            last_seen: event.timestamp || new Date().toISOString(),
          }
          dispatch(
            updateOnlineUser({
              channelSlug,
              user,
              isOnline: event.status === 'online',
            })
          )
        }
      })

      console.log('[Chat] Successfully subscribed to channel:', channelName)
    } catch (error) {
      console.error('[Chat] Error subscribing to channel:', error)
    }

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('.chat.message.sent')
          channelRef.current.stopListening('.chat.message.edited')
          channelRef.current.stopListening('.chat.message.deleted')
          channelRef.current.stopListening('.chat.user.typing')
          channelRef.current.stopListening('.chat.presence.changed')
          echo.leave(channelName)
          console.log('[Chat] Unsubscribed from channel:', channelName)
        } catch (error) {
          console.error('[Chat] Error unsubscribing from channel:', error)
        }
      }
      subscriptionRef.current = null
      channelRef.current = null
    }
  }, [echo, enabled, channelSlug, dispatch, onMessageReceived, onMessageEdited, onMessageDeleted])

  // Function to manually trigger a refetch
  const refetchMessages = useCallback(() => {
    dispatch(chatApi.util.invalidateTags(['Chat']))
  }, [dispatch])

  return {
    refetchMessages,
  }
}

