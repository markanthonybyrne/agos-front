import { ChatMessage as ChatMessageType } from '@/types/api.types'
import { formatDateTime } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageType
  onEdit?: (messageId: number) => void
  onDelete?: (messageId: number) => void
}

// Highlight mentions in message text
const highlightMentions = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  const mentionRegex = /@(\w+)/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{text.substring(lastIndex, match.index)}</span>
      )
    }

    // Add highlighted mention
    parts.push(
      <span
        key={`mention-${key++}`}
        className="text-cyan-400 bg-cyan-400/10 px-1 rounded font-medium"
      >
        {match[0]}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`}>{text.substring(lastIndex)}</span>
    )
  }

  return parts.length > 0 ? parts : [<span key="text-0">{text}</span>]
}

export function ChatMessage({ message, onEdit, onDelete }: ChatMessageProps) {
  const { empire } = useAuth()
  const isOwnMessage = empire?.id === message.sender_empire.id
  const senderName = message.sender_empire?.name || 'Unknown'

  return (
    <div className="flex items-start gap-3 group hover:bg-muted/5 rounded-lg p-2 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-primary">
          {senderName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">{senderName}</span>
          
          {message.is_edited && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              edited
            </Badge>
          )}
          
          {message.is_moderated && (
            <Badge variant="outline" className="text-xs text-destructive">
              moderated
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            {formatDateTime(message.created_at)}
          </span>

          {/* Action buttons (own messages only) */}
          {isOwnMessage && (
            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onEdit(message.id)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(message.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Message Text */}
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {highlightMentions(message.message)}
        </div>

        {/* Edited timestamp */}
        {message.is_edited && message.edited_at && (
          <div className="text-xs text-muted-foreground italic">
            Edited {formatDateTime(message.edited_at)}
          </div>
        )}
      </div>
    </div>
  )
}

