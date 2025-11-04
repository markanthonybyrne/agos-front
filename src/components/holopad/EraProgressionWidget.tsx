import { WidgetWindow } from './WidgetWindow'
import { EraProgressionCard } from '@/components/era/EraProgressionCard'
import { useGetEraProgressionQuery } from '@/api/endpoints/empiresApi'
import { Skeleton } from '@/components/ui/skeleton'

interface EraProgressionWidgetProps {
  onMinimize?: () => void
  onClose?: () => void
  isMinimized?: boolean
}

export function EraProgressionWidget({
  onMinimize,
  onClose,
  isMinimized,
}: EraProgressionWidgetProps) {
  const { data: eraProgression, isLoading } = useGetEraProgressionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })

  if (isMinimized) {
    return (
      <WidgetWindow
        title="Era Progression"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-cyan/20"
      >
        <div className="h-16" />
      </WidgetWindow>
    )
  }

  if (isLoading) {
    return (
      <WidgetWindow
        title="Era Progression"
        onMinimize={onMinimize}
        onClose={onClose}
        isMinimized={isMinimized}
        className="border-cyan/20"
      >
        <Skeleton className="h-32" />
      </WidgetWindow>
    )
  }

  if (!eraProgression) {
    return null
  }

  return (
    <WidgetWindow
      title="Era Progression"
      onMinimize={onMinimize}
      onClose={onClose}
      isMinimized={isMinimized}
      className="border-cyan/20"
    >
      <EraProgressionCard eraProgression={eraProgression} className="border-0 shadow-none" />
    </WidgetWindow>
  )
}

