import { useGetUnreadMailCountQuery } from '@/api/endpoints/mailApi'

export function useUnreadMailCount() {
  const { data, isLoading } = useGetUnreadMailCountQuery(undefined, {
    refetchOnMountOrArgChange: true, // Refetch when component mounts or query args change
  })

  const unreadCount = data?.unread_count || 0

  return {
    unreadCount,
    isLoading,
  }
}

