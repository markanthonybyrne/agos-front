import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { Bell, X, Check, CheckCheck, Settings, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDateTime } from '@/lib/formatters'
import { markAsRead, markAllAsRead, deleteNotification } from '@/app/slices/notificationSlice'
import { Notification } from '@/app/slices/notificationSlice'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const dispatch = useAppDispatch()
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'construction' | 'fleet' | 'combat' | 'alliance' | 'research' | 'attack' | 'tick' | 'announcement'>('all')

  console.log('NotificationCenter render:', { isOpen, notificationsCount: notifications.length, unreadCount })

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
      default:
        return '📢'
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

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notif.isRead
    return notif.category === activeTab
  })

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-end p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card className="panel-glass w-full max-w-2xl h-[600px] flex flex-col shadow-2xl border-2 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-5 mx-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="construction">🔨</TabsTrigger>
              <TabsTrigger value="fleet">🚀</TabsTrigger>
              <TabsTrigger value="combat">⚔️</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[400px] px-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            notification.isRead 
                              ? 'bg-muted/5 border-border/30' 
                              : 'bg-primary/5 border-primary/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Icon className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {notification.title}
                                </span>
                                <span className="text-xs">
                                  {getCategoryIcon(notification.category)}
                                </span>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(String(notification.timestamp))}
                                </span>
                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
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
        </CardContent>
      </Card>
    </div>
  )
}
