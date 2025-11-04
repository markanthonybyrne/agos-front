import { WidgetWindow } from './WidgetWindow'
import { DarkMatterDisplay } from '@/components/resources/DarkMatterDisplay'
import { useGetDarkMatterInfoQuery } from '@/api/endpoints/empiresApi'
import { Skeleton } from '@/components/ui/skeleton'

interface DarkMatterWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function DarkMatterWidget({
  onMinimize,
  onClose,
  isMinimized,
}: DarkMatterWidgetProps) {
  const { data: darkMatterInfo, isLoading } = useGetDarkMatterInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  if (isMinimized) {
    return (
      <WidgetWindow
        title="Dark Matter"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-purple/20"
      >
        <div className="h-16" />
      </WidgetWindow>
    )
  }

  if (isLoading) {
    return (
      <WidgetWindow
        title="Dark Matter"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-purple/20"
      >
        <Skeleton className="h-32" />
      </WidgetWindow>
    )
  }

  if (!darkMatterInfo) {
    return null
  }

  return (
    <WidgetWindow
      title="Dark Matter"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-purple/20"
    >
      <DarkMatterDisplay darkMatterInfo={darkMatterInfo} className="border-0 shadow-none" />
    </WidgetWindow>
  )
}

