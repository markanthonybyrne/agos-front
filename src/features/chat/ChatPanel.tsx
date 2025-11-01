import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useListChannelsQuery, useGetMessagesQuery, useSendMessageMutation, useEditMessageMutation, useDeleteMessageMutation, useSendTypingIndicatorMutation, useGetOnlineUsersQuery } from '@/api/endpoints/chatApi'
import { useChatChannel } from '@/hooks/useChatChannel'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { setActiveChannel, getTypingUsersForChannel, isRateLimited, getRateLimitRemaining, setRateLimitCooldown } from '@/app/slices/chatSlice'
import { ChatMessage } from './ChatMessage'
import { ChatMessage as ChatMessageType, OnlineUser } from '@/types/api.types'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { MessageSquare, Send, Users, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatPanel() {
  const dispatch = useAppDispatch()
  const { empire } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onlineUsersIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get channels and active channel
  const { data: channelsData, isLoading: channelsLoading } = useListChannelsQuery()
  const activeChannelSlug = useAppSelector((state) => state.chat.activeChannelSlug)
  
  // Set default channel if none selected
  useEffect(() => {
    if (!activeChannelSlug && channelsData?.channels?.length > 0) {
      dispatch(setActiveChannel(channelsData.channels[0].slug))
    }
  }, [activeChannelSlug, channelsData, dispatch])

  // Determine effective active channel (use first channel if none selected but channels exist)
  const effectiveChannelSlug = activeChannelSlug || (channelsData?.channels?.length > 0 ? channelsData.channels[0].slug : null)

  const currentChannel = channelsData?.channels?.find(c => c.slug === effectiveChannelSlug)
  const typingUsers = useAppSelector((state) => 
    effectiveChannelSlug ? getTypingUsersForChannel(state.chat, effectiveChannelSlug) : []
  )
  const rateLimited = useAppSelector((state) => 
    effectiveChannelSlug ? isRateLimited(state.chat, effectiveChannelSlug) : false
  )
  const rateLimitRemaining = useAppSelector((state) => 
    effectiveChannelSlug ? getRateLimitRemaining(state.chat, effectiveChannelSlug) : 0
  )

  // Get messages for active channel
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { channelSlug: effectiveChannelSlug!, limit: 200 },
    { skip: !effectiveChannelSlug }
  )

  // Get online users
  const { data: onlineUsersData, refetch: refetchOnlineUsers } = useGetOnlineUsersQuery(
    effectiveChannelSlug!,
    { skip: !effectiveChannelSlug, pollingInterval: 30000 }
  )

  // WebSocket subscription
  useChatChannel({
    channelSlug: effectiveChannelSlug!,
    enabled: !!effectiveChannelSlug,
    onMessageReceived: () => {
      refetchMessages()
    },
    onMessageEdited: () => {
      refetchMessages()
    },
    onMessageDeleted: () => {
      refetchMessages()
    },
  })

  // Mutations
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [editMessage, { isLoading: isEditing }] = useEditMessageMutation()
  const [deleteMessage] = useDeleteMessageMutation()
  const [sendTypingIndicator] = useSendTypingIndicatorMutation()

  // Sort messages by created_at ascending
  const messages = useMemo(() => {
    const msgs = messagesData?.messages || []
    return [...msgs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })
  }, [messagesData?.messages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Typing indicator debounce
  const handleTyping = () => {
    if (!effectiveChannelSlug) return

    // Send typing indicator
    sendTypingIndicator({
      channelSlug: effectiveChannelSlug,
      data: { is_typing: true },
    }).catch(() => {
      // Silent fail for typing indicators
    })

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator({
        channelSlug: effectiveChannelSlug,
        data: { is_typing: false },
      }).catch(() => {
        // Silent fail
      })
    }, 2000)
  }

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (onlineUsersIntervalRef.current) {
        clearInterval(onlineUsersIntervalRef.current)
      }
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || !effectiveChannelSlug || rateLimited) return

    try {
      await sendMessage({
        channelSlug: effectiveChannelSlug,
        data: { message: newMessage.trim() },
      }).unwrap()
      
      setNewMessage('')
      // Stop typing indicator
      sendTypingIndicator({
        channelSlug: effectiveChannelSlug,
        data: { is_typing: false },
      }).catch(() => {})
      
      refetchMessages()
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to send message'
      toast.error(errorMessage)
      
      // Handle rate limit
      if (error?.response?.status === 429) {
        const retryAfter = error?.data?.retry_after_seconds || 60
        dispatch(setRateLimitCooldown({
          channelSlug: effectiveChannelSlug,
          expiresAt: Date.now() + retryAfter * 1000,
        }))
      }
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessageId || !editText.trim() || isEditing || !effectiveChannelSlug) return

    try {
      await editMessage({
        messageId: editingMessageId,
        data: { message: editText.trim() },
      }).unwrap()
      
      setEditingMessageId(null)
      setEditText('')
      refetchMessages()
      toast.success('Message edited')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to edit message')
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await deleteMessage(messageId).unwrap()
      refetchMessages()
      toast.success('Message deleted')
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete message')
    }
  }

  const handleStartEdit = (message: ChatMessageType) => {
    setEditingMessageId(message.id)
    setEditText(message.message)
  }

  const handleChannelChange = (slug: string) => {
    dispatch(setActiveChannel(slug))
    setNewMessage('')
    setEditingMessageId(null)
  }

  // Get typing users names (excluding current user)
  const typingUserNames = useMemo(() => {
    if (!onlineUsersData?.online_users || !typingUsers.length) return []
    return onlineUsersData.online_users
      .filter(u => typingUsers.includes(u.empire_id) && u.empire_id !== empire?.id)
      .map(u => u.empire_name)
  }, [typingUsers, onlineUsersData, empire])

  return (
    <Card className="panel-glass surface-gradient h-full flex flex-col">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          Global Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Channel Selector */}
        {channelsLoading ? (
          <div className="p-4 border-b border-border/50">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="p-4 border-b border-border/50">
            <Tabs value={effectiveChannelSlug || ''} onValueChange={handleChannelChange}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${channelsData?.channels.length || 1}, 1fr)` }}>
                {channelsData?.channels.map((channel) => (
                  <TabsTrigger key={channel.slug} value={channel.slug}>
                    {channel.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 flex min-h-0">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-0">
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                <p className="text-center max-w-md">
                  Start the conversation! Send a message to the channel.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Online Users Sidebar */}
          {onlineUsersData && (
            <div className="w-48 border-l border-border/50 p-4 bg-muted/5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Online</span>
                <Badge variant="secondary" className="ml-auto">
                  {onlineUsersData.count}
                </Badge>
              </div>
              <div className="space-y-2">
                {onlineUsersData.online_users.map((user) => (
                  <div key={user.empire_id} className="text-sm text-muted-foreground truncate">
                    {user.empire_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        {typingUserNames.length > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground italic border-t border-border/50">
            {typingUserNames.length === 1
              ? `${typingUserNames[0]} is typing...`
              : `${typingUserNames.slice(0, 2).join(', ')}${typingUserNames.length > 2 ? ` and ${typingUserNames.length - 2} more` : ''} are typing...`}
          </div>
        )}

        {/* Rate Limit Warning */}
        {rateLimited && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t border-border/50">
            Rate limited. Please wait {rateLimitRemaining} second{rateLimitRemaining !== 1 ? 's' : ''}...
          </div>
        )}

        {/* Message Input */}
        <div className="border-t border-border/50 p-4">
          {editingMessageId ? (
            <div className="flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Edit message..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleEditMessage()
                  }
                  if (e.key === 'Escape') {
                    setEditingMessageId(null)
                    setEditText('')
                  }
                }}
              />
              <Button onClick={handleEditMessage} disabled={!editText.trim() || isEditing}>
                {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingMessageId(null)
                setEditText('')
              }}>
                Cancel
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                placeholder={currentChannel ? `Message ${currentChannel.name}...` : 'Loading channels...'}
                className="flex-1"
                disabled={isSending || rateLimited || !effectiveChannelSlug || channelsLoading}
                maxLength={currentChannel?.max_message_length || 1000}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending || rateLimited || !effectiveChannelSlug || channelsLoading}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          )}
          {currentChannel && (
            <div className="text-xs text-muted-foreground mt-1">
              {newMessage.length} / {currentChannel.max_message_length} characters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

