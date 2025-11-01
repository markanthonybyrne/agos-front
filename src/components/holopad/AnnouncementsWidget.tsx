import { Megaphone } from 'lucide-react'
import { WidgetWindow } from './WidgetWindow'

interface Announcement {
  id: number
  title: string
  content: string
  published_at: string
  is_important?: boolean
}

interface AnnouncementsWidgetProps {
  announcements?: Announcement[]
  isLoading?: boolean
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function AnnouncementsWidget({ 
  announcements = [],
  isLoading = false,
  onMinimize,
  onClose,
  isMinimized 
}: AnnouncementsWidgetProps) {
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <WidgetWindow
      title="Game Announcements"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-purple/20"
    >
      <div className="h-full flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No announcements</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 bg-card rounded-lg border ${
                  announcement.is_important 
                    ? 'border-purple-400/50 bg-purple-500/10' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`font-semibold text-sm ${
                    announcement.is_important ? 'text-purple-300' : 'text-foreground'
                  }`}>
                    {announcement.title}
                  </h3>
                  {announcement.is_important && (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/50 rounded-full font-semibold">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap mb-2">
                  {announcement.content}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {formatDate(announcement.published_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWindow>
  )
}

