import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useGetAllianceChatQuery, useSendAllianceChatMutation } from '@/api/endpoints/allianceChatApi'
import { useAllianceChat } from '@/hooks/useAllianceChat'
import { formatDate } from '@/lib/formatters'
import { Send, Users, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface AllianceChatProps {
  allianceId: number
  allianceName?: string
  memberCount?: number
}

export function AllianceChat({ allianceId, allianceName, memberCount }: AllianceChatProps) {
  const [message, setMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: chatData, isLoading, error } = useGetAllianceChatQuery({
    allianceId: Number(allianceId),
    page: currentPage,
    per_page: 50,
  })

  const [sendMessage, { isLoading: isSending }] = useSendAllianceChatMutation()

  // Initialize WebSocket connection for real-time chat
  useAllianceChat({ allianceId: Number(allianceId), enabled: true })

  const messages = (chatData as any)?.data?.data || (chatData as any)?.data || []
  const hasMorePages = (chatData as any)?.data?.meta ? currentPage < (chatData as any).data.meta.pages : false

  // Debug logging
  console.log('Alliance Chat Debug:', {
    allianceId,
    chatData,
    isLoading,
    error,
    messages: messages.length,
    hasMorePages,
    rawMessages: chatData?.data?.data,
    meta: chatData?.data?.meta
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    console.log('Sending message:', {
      allianceId,
      message: message.trim(),
      isSending
    })

    try {
      const result = await sendMessage({
        allianceId: Number(allianceId),
        data: { message: message.trim() },
      }).unwrap()
      
      console.log('Message sent successfully:', result)
      setMessage('')
      toast.success('Message sent')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error?.data?.message || 'Failed to send message')
    }
  }

  const loadMoreMessages = () => {
    if (hasMorePages && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const renderMessage = (msg: any) => (
    <div key={msg.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
        {msg.empire?.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {msg.empire.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(msg.created_at)}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {msg.message}
        </p>
      </div>
    </div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )

  if (error) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Alliance Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-destructive">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load chat</p>
            <p className="text-sm text-muted-foreground mt-2">
              {((error as any)?.data?.message) || 'Unable to connect to alliance chat'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Alliance Chat
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{memberCount} members</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-1">
            {isLoading && messages.length === 0 ? (
              renderSkeleton()
            ) : (
              <>
                {hasMorePages && (
                  <div className="text-center py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreMessages}
                      disabled={isLoading}
                      className="text-muted-foreground"
                    >
                      {isLoading ? 'Loading...' : 'Load older messages'}
                    </Button>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
              maxLength={1000}
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || isSending}
              size="sm"
            >
              {isSending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{message.length}/1000 characters</span>
            <span>{allianceName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
