import { useGetMailQuery } from '@/api/endpoints/mailApi'

export function useUnreadMailCount() {
  const { data: inboxData, isLoading } = useGetMailQuery({
    type: 'inbox',
    page: 1,
    per_page: 100, // Get more messages to count unread
  })

  const mailList: any[] = (inboxData as any)?.mail || (inboxData as any)?.data || []
  const unreadCount = mailList.filter((mail: any) => !mail?.is_read).length || 0

  return {
    unreadCount,
    isLoading,
  }
}

