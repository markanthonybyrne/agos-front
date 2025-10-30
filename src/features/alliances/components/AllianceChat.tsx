import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/formatters'
import { useGetAllianceChatMessagesQuery, useSendAllianceChatMessageMutation } from '@/api/endpoints/alliancesApi'
import { useAuth } from '@/hooks/useAuth'
import { getEcho } from '@/lib/websocket'
import { 
  MessageSquare, 
  Send, 
  Crown,
  Shield
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { AllianceChatMessage } from '@/types/api.types'

interface AllianceChatProps {
  allianceId: number
}

export function AllianceChat({ allianceId }: AllianceChatProps) {
  const { empire } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  const { data: messagesData, isLoading, refetch } = useGetAllianceChatMessagesQuery({
    allianceId,
    limit: 50,
    offset: 0
  })

  const [sendMessage, { isLoading: isSending }] = useSendAllianceChatMessageMutation()

  // Sort messages by created_at ascending (oldest first, newest last)
  const messages = useMemo(() => {
    const msgs = messagesData?.messages || []
    return [...msgs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })
  }, [messagesData?.messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
    }
  }, [isLoading, messages.length])

  // WebSocket subscription
  useEffect(() => {
    if (!allianceId) return

    // Wait for WebSocket to be initialized
    let retryCount = 0
    const maxRetries = 10
    const retryInterval = 500

    const subscribeToChannel = () => {
      const echo = getEcho()
      if (!echo) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`WebSocket not ready, retrying... (${retryCount}/${maxRetries})`)
          setTimeout(subscribeToChannel, retryInterval)
          return
        } else {
          console.warn('WebSocket not available for alliance chat after retries')
          return
        }
      }

      // Echo automatically adds 'private-' prefix, so use 'alliance.{id}' not 'private-alliance.{id}'
      const channelName = `alliance.${allianceId}`
      console.log('Subscribing to alliance chat channel:', channelName)
      
      try {
        const channel = echo.private(channelName)
        subscriptionRef.current = channel
        
        // Listen for alliance chat message event (no dot prefix per docs)
        channel.listen('alliance.chat.message', (e: any) => {
          console.log('New alliance chat message received:', e)
          // Refresh messages when new message arrives
          refetch()
        })

        console.log('Successfully subscribed to alliance chat channel')
      } catch (error) {
        console.error('Error subscribing to alliance chat channel:', error)
      }
    }

    subscribeToChannel()

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.stopListening('alliance.chat.message')
        } catch (error) {
          console.error('Error unsubscribing from alliance chat channel:', error)
        }
      }
    }
  }, [allianceId, refetch])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    try {
      await sendMessage({
        allianceId,
        data: { message: newMessage.trim() }
      }).unwrap()
      setNewMessage('')
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send message')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return <Crown className="w-3 h-3 text-yellow-400" />
      case 'officer':
        return <Shield className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'officer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  return (
    <Card className="panel-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Alliance Chat
        </CardTitle>
        <CardDescription>
          Communicate with your alliance members in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16" />
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
                Start the conversation! Send a message to your alliance members.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message: AllianceChatMessage) => {
                const senderName = message.sender_empire?.name || 'Unknown'
                const role = 'member' // Default role, could be enhanced with member data
                
                return (
                  <div key={message.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {senderName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{senderName}</span>
                        {getRoleIcon(role) && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleColor(role)}`}
                          >
                            <div className="flex items-center gap-1">
                              {getRoleIcon(role)}
                              {role}
                            </div>
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-border/50 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
