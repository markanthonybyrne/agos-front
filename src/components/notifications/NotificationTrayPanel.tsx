import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDateTime } from '@/lib/formatters'
import { markAsRead, markAllAsRead, deleteNotification } from '@/app/slices/notificationSlice'
import { Notification } from '@/app/slices/notificationSlice'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function NotificationTrayPanel() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'construction' | 'fleet' | 'combat' | 'alliance' | 'research' | 'attack' | 'tick' | 'announcement' | 'colonization' | 'capture' | 'incident'>('all')

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'error':
        return XCircle
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      default:
        return Info
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'construction':
        return '🔨'
      case 'fleet':
        return '🚀'
      case 'combat':
        return '⚔️'
      case 'alliance':
        return '🤝'
      case 'research':
        return '🔬'
      case 'attack':
        return '⚔️'
      case 'tick':
        return '⏱️'
      case 'announcement':
        return '📢'
      case 'colonization':
        return '🌍'
      case 'capture':
        return '🎯'
      case 'incident':
        return '📡'
      default:
        return '📢'
    }
  }

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'construction':
        return 'bg-blue-500/10 border-blue-500/20'
      case 'fleet':
        return 'bg-cyan-500/10 border-cyan-500/20'
      case 'combat':
        return 'bg-red-500/10 border-red-500/20'
      case 'alliance':
        return 'bg-purple-500/10 border-purple-500/20'
      case 'research':
        return 'bg-green-500/10 border-green-500/20'
      case 'attack':
        return 'bg-red-500/10 border-red-500/20'
      case 'tick':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'announcement':
        return 'bg-cyan-500/10 border-cyan-500/20'
      case 'colonization':
        return 'bg-emerald-500/10 border-emerald-500/20'
      case 'capture':
        return 'bg-orange-500/10 border-orange-500/20'
      case 'incident':
        return 'bg-purple-500/10 border-purple-500/20'
      default:
        return 'bg-muted/5 border-border/30'
    }
  }

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
  }

  const handleDeleteNotification = (id: string) => {
    dispatch(deleteNotification(id))
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id))
    }
    
    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notif.isRead
    return notif.category === activeTab
  })

  // Count notifications by category
  const categoryCounts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    construction: notifications.filter(n => n.category === 'construction').length,
    fleet: notifications.filter(n => n.category === 'fleet').length,
    combat: notifications.filter(n => n.category === 'combat' || n.category === 'attack').length,
    alliance: notifications.filter(n => n.category === 'alliance').length,
    research: notifications.filter(n => n.category === 'research').length,
    attack: notifications.filter(n => n.category === 'attack').length,
    tick: notifications.filter(n => n.category === 'tick').length,
    announcement: notifications.filter(n => n.category === 'announcement').length,
    colonization: notifications.filter(n => n.category === 'colonization').length,
    capture: notifications.filter(n => n.category === 'capture').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-7 w-full mb-4">
          <TabsTrigger value="all" className="text-xs">
            All {categoryCounts.all > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{categoryCounts.all}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Unread {categoryCounts.unread > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">{categoryCounts.unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="construction" className="text-xs">🔨</TabsTrigger>
          <TabsTrigger value="fleet" className="text-xs">🚀</TabsTrigger>
          <TabsTrigger value="combat" className="text-xs">⚔️</TabsTrigger>
          <TabsTrigger value="alliance" className="text-xs">🤝</TabsTrigger>
          <TabsTrigger value="tick" className="text-xs">⏱️</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1 pr-4">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground mb-1">No notifications</p>
                <p className="text-xs text-muted-foreground/70">
                  {activeTab === 'unread' ? 'All notifications are read' : `No ${activeTab === 'all' ? '' : activeTab + ' '}notifications yet`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const categoryColor = getCategoryColor(notification.category)
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative rounded-lg border transition-all duration-200 cursor-pointer",
                        "hover:border-primary/50 hover:shadow-md",
                        notification.isRead 
                          ? 'bg-muted/5 border-border/30' 
                          : cn('bg-primary/5 border-primary/30 shadow-sm', categoryColor)
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            notification.isRead ? 'bg-muted/20' : 'bg-primary/20'
                          )}>
                            <Icon className={cn("w-4 h-4", getNotificationColor(notification.type))} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={cn(
                                  "text-sm font-semibold truncate",
                                  !notification.isRead && "text-foreground"
                                )}>
                                  {notification.title}
                                </span>
                                <span className="text-xs flex-shrink-0">
                                  {getCategoryIcon(notification.category)}
                                </span>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            
                            <p className={cn(
                              "text-sm mb-2 line-clamp-2",
                              notification.isRead ? "text-muted-foreground" : "text-foreground/90"
                            )}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(String(notification.timestamp))}
                              </span>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(notification.id)
                                    }}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteNotification(notification.id)
                                  }}
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

