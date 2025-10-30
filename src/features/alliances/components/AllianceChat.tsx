import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/formatters'
import { 
  MessageSquare, 
  Send, 
  Users,
  Crown,
  Shield
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AllianceChatProps {
  allianceId: number
}

interface ChatMessage {
  id: number
  empire_name: string
  empire_role: string
  message: string
  created_at: string
}

export function AllianceChat({ allianceId }: AllianceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data for now - in real implementation, this would come from WebSocket
  useEffect(() => {
    // Simulate loading messages
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          empire_name: 'CommanderZen',
          empire_role: 'leader',
          message: 'Welcome to the alliance! Let\'s work together to dominate the galaxy.',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          empire_name: 'SpaceAdmiral',
          empire_role: 'officer',
          message: 'I\'ve spotted some enemy activity near sector 3:2:1. Should we investigate?',
          created_at: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 3,
          empire_name: 'GalaxyRuler',
          empire_role: 'member',
          message: 'I can send a fleet to scout the area.',
          created_at: new Date(Date.now() - 180000).toISOString()
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [allianceId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    // Mock sending message - in real implementation, this would send via WebSocket
    const message: ChatMessage = {
      id: Date.now(),
      empire_name: 'You', // In real implementation, get from user context
      empire_role: 'member',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return <Crown className="w-3 h-3 text-yellow-400" />
      case 'officer':
        return <Shield className="w-3 h-3 text-blue-400" />
      case 'member':
        return <Users className="w-3 h-3 text-green-400" />
      default:
        return <Users className="w-3 h-3 text-muted-foreground" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'leader':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'officer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'member':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
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
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {message.empire_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{message.empire_name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleColor(message.empire_role)}`}
                      >
                        <div className="flex items-center gap-1">
                          {getRoleIcon(message.empire_role)}
                          {message.empire_role}
                        </div>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
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
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isLoading}
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

