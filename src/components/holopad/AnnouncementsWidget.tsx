import { Megaphone } from 'lucide-react'
import { WidgetWindow } from './WidgetWindow'
import { useGetAnnouncementsQuery } from '@/api/endpoints/announcementsApi'
import { Announcement } from '@/types/api.types'

interface AnnouncementsWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function AnnouncementsWidget({ 
  onMinimize,
  onClose,
  isMinimized 
}: AnnouncementsWidgetProps) {
  const { data, isLoading, error } = useGetAnnouncementsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute to catch new announcements
  })
  
  // Map API announcement to widget format
  const rawAnnouncements = data?.announcements || []
  
  const filtered = rawAnnouncements.filter((a: Announcement) => {
    // If is_active is not provided in the response, default to true (show the announcement)
    const isActive = a.is_active !== false // Default to true if undefined/null
    return isActive
  })
  
  const announcements: Array<{
    id: number
    title: string
    content: string
    published_at: string
    is_important?: boolean
    priority?: string
  }> = filtered
    .map((a: Announcement) => {
      return {
        id: a.id,
        title: a.title,
        content: a.message,
        published_at: a.created_at,
        is_important: (a.is_pinned ?? false) || a.priority === 'alert' || a.priority === 'warning',
        priority: a.priority,
      }
    })
    .sort((a, b) => {
      // Sort by pinned first, then by priority (alert > warning > success > info), then by date
      if (a.is_important && !b.is_important) return -1
      if (!a.is_important && b.is_important) return 1
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })
  
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground/70">
                    {formatDate(announcement.published_at)}
                  </p>
                  {/* Show priority badge if not info */}
                  {announcement.priority && announcement.priority !== 'info' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/50 rounded-full capitalize">
                      {announcement.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWindow>
  )
}

